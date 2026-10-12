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
  constructor({ rho = 0.927, alpha = 0.95, useCap = true, sigma = 0.40 } = {}) {
    this.rho = rho;
    this.alpha = alpha;
    this.useCap = useCap;
    this.k = 1 / sigma;
    this.reset();
  }

  reset() {
    /** @type {number[]} 当前情绪 E（PAD） */
    this.E = [0, 0, 0];
    /** 暴露计数：按"事件类别"记，用于 h(n) */
    this.exposure = new Map();
    /** 事件日志 */
    this.log = [];
  }

  /** 半衰期（轮） */
  get halfLife() { return Math.log(0.5) / Math.log(this.rho); }

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
    const { eventKey = null, g = 1, h = null, resetExposure = false } = opts;

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
    let next = V.add(mu, V.mul(dev, this.rho));           // ρ 回落
    const dEff = V.mul(dERaw, g * hn);                    // g·h·ΔE_raw
    next = V.add(next, dEff);

    // ── ⭐ 封顶：对偏离量做非线性压缩 ──
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
