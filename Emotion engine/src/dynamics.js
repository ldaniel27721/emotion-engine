// A2 —— 情绪动力学（三层版）
//
//   现:  E_t = μ + ρ(E_{t−1} − μ) + ΔE_t
//   建:  E_t = μ + ρ(E_{t−1} − μ) + g(策略) · h(n) · ΔE_raw   → 再经封顶
//
// 依据（11 篇文献整合 · 三批独立汇合）：
//   · 衰减习惯化两篇：ρ 是"唯一不被任何个体差异预测"的指标 (p=0.415)
//   · 强度习惯化两篇：习惯化速度也不由基线/特质预测
//                     （基线 anxiety BF₁₀=0.04 / excitement 0.12 / trait anxiety 0.55）
//   · SMC2019：习惯化速率 ∝ SpI/Sl —— 不是常数
//   ⇒ ⭐ 三种"变小"必须拆开：
//        ρ        自发回落（纯净，不被特质影响）
//        h(n)     重复习惯化（α ≈ 0.93–0.96，角色级）
//        g(策略)  换策略导致的冲击缩放（brainsci: 效价轴 ≈0.35）
//
// 封顶（2026-10-12 裁定）：
//   f(r) = 1 − (1+r)^(−k)，k = 1/σ —— 让"球面"从阈值变成渐近极限
'use strict';

const { V, cap } = require('./space');

class Dynamics {
  /**
   * @param {object} o
   * @param {number}   o.rho     记忆保持率（自发回落）—— A2 现值 0.927
   * @param {number}   o.alpha   习惯化衰减因子 h(n)=α^(n−1) —— 0.93~0.96
   * @param {boolean}  o.useCap  是否启用封顶
   * @param {number}   o.sigma   角色 σ（决定封顶的 k）
   */
  constructor({ rho = 0.927, alpha = 0.95, useCap = true, sigma = 0.40,
    // ⭐ docs/06 的 P0 两项 —— 均【默认关闭】，关闭时行为与 v0.1.2 完全一致
    noveltyReset = false,      // B3: h(n) 自动新颖性复位
    noveltyThreshold = 0.35,   // B3: 触发复位的相对阶跃阈值
    rhoByValence = null,       // B1: { neg, mid, posMid, posHigh } 或 null
    // ⭐ docs/06 的 P2 · B2 情境分段 —— 默认关闭
    rhoByContext = null,       // B2: { <情境名>: 半衰期倍数 } 或 null
    context = null,            // B2: 当前情境名（对应 rhoByContext 的键）
  } = {}) {
    this.rho = rho;
    this.alpha = alpha;
    this.useCap = useCap;
    this.k = 1 / sigma;
    this.sigmaOfK = sigma;     // ⭐ B1 判"高正性"用
    // ⭐ B1/B3 开关
    this.noveltyReset = noveltyReset;
    this.noveltyThreshold = noveltyThreshold;
    this.rhoByValence = rhoByValence;
    // ⭐ B2 开关
    this.rhoByContext = rhoByContext;
    this.context = context;
    this.reset();
  }

  // ═══════════════════════════════════════════════════════════
  // ⭐ B2（docs/06）ρ 按情境分段 —— 默认关闭
  //
  //   文献：Wang & Zhang (2025) Appl. Sci. 15:4960 的案例模型
  //         dE/dt = αS + βG(1−E) − γE
  //         案例给出：工作日 γ=0.3 ｜ 周末 γ=1  ⇒ 【γ 之比 3.33×】
  //
  //   ⚠️ 关键：γ 是【衰减速率】，不是留存率 ρ。两者成反比：
  //        半衰期 = ln2 / γ  ⇒  γ 之比 = 半衰期之比的倒数
  //      ⇒ 工作日 γ 小 ⇒ 半衰期长 ⇒ 情绪更持久
  //
  //   ⭐ 所以情境参数按【半衰期倍数】给，而不是直接给 ρ：
  //        ρ_eff = 0.5 ^ (1 / (halfLife_base × k_context))
  //      k_context = 1.0 为基准；k_context = 3.33 表示半衰期延长 3.33 倍。
  //      ⇒ 这样"3.33×"这个文献数字落在【它本来描述的量的轴】上。
  //
  //   ⚠️ 默认 rhoByContext=null ⇒ 不启用，行为与既有版本一致。
  // ═══════════════════════════════════════════════════════════

  /** 基准半衰期（轮） */
  get halfLife() { return Math.log(0.5) / Math.log(this.rho); }

  /** ⭐ B2：切换情境（必须是 rhoByContext 里的键，或 null 表示不生效） */
  setContext(name) {
    if (name !== null && this.rhoByContext && !(name in this.rhoByContext)) {
      throw new Error('unknown context: ' + name + '（可选：' + Object.keys(this.rhoByContext).join(' / ') + '）');
    }
    this.context = name;
    return this.context;
  }

  /** ⭐ B2：由情境名解出实际使用的 ρ */
  rhoForContext(name) {
    if (!this.rhoByContext || !name) return this.rho;
    const kk = this.rhoByContext[name];
    if (typeof kk !== 'number' || kk <= 0) return this.rho;
    const hl = this.halfLife * kk;                 // 半衰期倍数
    return Math.pow(0.5, 1 / hl);                  // 换回留存率
  }

  /**
   * ⭐ 重置
   * @param {number[]} [initial] 初始情绪 —— ⚠️ 必须与 Character.E 一致！
   *
   * ⚠️⚠️ 2026-10-12 修正（Codex 审计）：
   *   原实现把 this.E 硬写成 [0,0,0]，而 Character.E 从 μ 起 ⇒
   *   两者差 ‖μ‖（默认 0.45），而 step() 用的是 this.E ⇒ 第一轮起点不是 μ，
   *   直接违反 A3 的裁定「E₀ = μ」。
   */
  reset(initial = null) {
    /** @type {number[]} 当前情绪 E（PAD） */
    this.E = initial ? initial.slice() : [0, 0, 0];
    /** 初始值留档，便于外部核对同步性 */
    this.initial = this.E.slice();
    /** 暴露计数：按"事件类别"记，用于 h(n) */
    this.exposure = new Map();
    /** ⭐ B3：按"事件类别"记上一次的 ΔE_raw，用于判"刺激是否变了" */
    this._lastDE = new Map();
    /** 事件日志 */
    this.log = [];
  }

  /**
   * ⭐ 把内部状态同步到外部给定的 E（Character 构造后调用）
   */
  syncTo(E) {
    this.E = E.slice();
    this.initial = E.slice();
    return this.E;
  }

  /**
   * ⭐ 推进一轮
   * @param {number[]} dERaw   评价层产出的原始 ΔE
   * @param {number[]} mu      底情绪 μ
   * @param {object}   opts
   * @param {string}   opts.eventKey  事件类别（用于暴露计数；同类别 → h(n) 递减）
   * @param {number}   opts.g       策略缩放（默认 1）
   * @param {number}   opts.h       显式指定 h（不给则按暴露计数算）
   * @param {boolean}  opts.resetExposure 是否重置该类别的暴露计数
   */
  step(dERaw, mu, opts = {}) {
    const { eventKey = null, g = 1, h = null, resetExposure = false, context } = opts;

    // ═══════════════════════════════════════════════════════════
    // ⭐ B3（docs/06）h(n) 的【自动】新颖性复位 —— 默认关闭
    //
    //   文献：Déniz et al. (2004) 的 Stanley ODE + "刺激单调性"判别器。
    //        刺激一变 ⇒ 习惯化状态打回 0，重新敏感。
    //   补法：判别信号用【已有的量】—— |ΔE_raw| 相对该类别的上次值发生阶跃。
    //   ⚠️ 默认 noveltyReset=false ⇒ 行为与 v0.1.2 完全一致。
    // ═══════════════════════════════════════════════════════════
    let noveltyFired = false;
    if (this.noveltyReset && eventKey !== null) {
      const last = this._lastDE.get(eventKey);
      if (last) {
        const dev = V.norm(V.sub(dERaw, last));
        const scale = Math.max(V.norm(last), 1e-6);
        if (dev / scale > this.noveltyThreshold) {
          this.exposure.set(eventKey, 0);      // ⭐ 复位：重新敏感
          noveltyFired = true;
        }
      }
      this._lastDE.set(eventKey, dERaw.slice());
    }

    // ── h(n)：重复习惯化 ──
    let hn = h;
    if (hn === null) {
      if (eventKey === null) {
        hn = 1;
      } else {
        const n = (this.exposure.get(eventKey) || 0) + 1;
        this.exposure.set(eventKey, n);
        hn = Math.pow(this.alpha, n - 1);
      }
    }
    if (resetExposure && eventKey !== null) this.exposure.set(eventKey, 0);

    // ── 自发回落 + 冲击 ──
    const dev = V.sub(this.E, mu);                       // E − μ

    // ⭐ B1（docs/06）ρ 按效价分段 —— 默认关闭
    //   文献：Sci. Rep. (2025) 15:36328 Table 3（渲染成图逐字读）
    //         中等正性/中性 0.875 ｜ 高正性 0.805 ｜ 低/负性 0.451
    //   ⚠️ 非单调：不是"越正越持久"
    //   ⭐ 分段依据：当前偏离在 P 轴上的符号（正 / 中 / 负）
    //   ⚠️ 默认 rhoByValence=null ⇒ 用单一 rho，行为与 v0.1.2 一致。
    let rho = this.rho;
    if (this.rhoByValence) {
      const pPos = dev[0] > 0, pNeg = dev[0] < 0;
      // 用偏离的强度相对于 σ 判"高正性"
      const mag = V.norm(dev);
      const isHigh = mag > 1.5 * this.sigmaOfK;
      rho = pNeg ? this.rhoByValence.neg
        : (pPos && isHigh) ? this.rhoByValence.posHigh
          : pPos ? this.rhoByValence.posMid
            : this.rhoByValence.mid;   // P 轴 ≈ 0 → 中性档
    }

    // ⭐ B2（docs/06）ρ 按情境分段 —— 默认关闭
    //   ⭐ 与 B1【复合】：效价定"这类情绪本身多粘"，情境定"这场合衰减多快"
    //      做法：先取到 rhoBase（效价档或基准），再把它的【半衰期】乘 k_context
    //   ⚠️ opts.context 优先于 this.context；两者都没给则不生效。
    const ctxName = opts.context !== undefined ? opts.context : this.context;
    let rhoContext = null;
    if (this.rhoByContext && ctxName) {
      const kk = this.rhoByContext[ctxName];
      if (typeof kk === 'number' && kk > 0) {
        const hlBase = Math.log(0.5) / Math.log(rho);
        rhoContext = Math.pow(0.5, 1 / (hlBase * kk));
        rho = rhoContext;
      }
    }

    let next = V.add(mu, V.mul(dev, rho));                // ρ 回落
    const dEff = V.mul(dERaw, g * hn);                    // g·h·ΔE_raw
    next = V.add(next, dEff);

    // ── ⭐ 封顶：对偏离量做非线性压缩（v0.1.2 起为分段形式）──
    const rRaw = V.norm(V.sub(next, mu));
    let rFinal = rRaw;
    if (this.useCap) {
      const capped = cap(rRaw, this.k);
      // 封顶后按比例缩回（保持方向不变）
      const scale = rRaw > 1e-12 ? capped / rRaw : 1;
      next = V.add(mu, V.mul(V.sub(next, mu), scale));
      rFinal = capped;
    }

    const rec = {
      E: next.slice(),
      r: rFinal,
      rRaw,
      dE: dEff.slice(),
      g, h: hn,
      rho,                       // ⭐ 实际用到的 ρ（便于审计 B1/B2 生效）
      rhoContext,                // ⭐ B2 情境调整后的 ρ（未启用则为 null）
      context: ctxName,          // ⭐ 本轮生效的情境名
      noveltyFired,              // ⭐ B3 是否触发复位（便于审计）
      eventKey,
      exposure: eventKey === null ? null : this.exposure.get(eventKey),
    };
    this.E = next;
    this.log.push(rec);
    return rec;
  }

  /** 只回落、不冲击（模拟"什么都没发生"的一轮） */
  idle(mu, n = 1) {
    for (let i = 0; i < n; i++) this.step([0, 0, 0], mu, { h: 1 });
    return this.E.slice();
  }

  describe() {
    return `Dynamics(ρ=${this.rho}, 半衰期=${this.halfLife.toFixed(1)}轮, ` +
      `α=${this.alpha}, k=${this.k.toFixed(2)}, cap=${this.useCap})`;
  }
}

module.exports = { Dynamics };
