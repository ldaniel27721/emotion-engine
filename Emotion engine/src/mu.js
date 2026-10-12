// A3 —— 原点 · 底情绪 μ · 初始状态
//
//   μ = (方向, precision)
//
// 依据（11 篇文献整合）：
//   · topdown2025: μ 是【知觉层的先验】，只改 starting bias、不改 drift rate (pp.397-398)
//     刻板印象 = "chronic expectations" + "strong perceptual priors"
//   · SMC2019: 习惯化速率 ∝ SpI/Sl，SpI = 初始不确定性 = precision 的倒数
//   · barrett2016: 精度门控决定哪个预测误差被学
//   · topdown2025 Box 2 (p.393): "先验因不确定性更低而支配知觉"
//   · AET pp.38-39: 特质在【ΔE 的增益】上，不在 μ 的常数偏移上
//     ⚠️ 但我们的 μ 是【用户显式配置的角色设定】，来源不同，不冲突
//
// 几何含义：
//   · 几何原点 (0,0,0) = 中性（不是任何角色的底情绪）
//   · μ = 球心 = 收敛终点 = 角色"没事时待的地方"
//   · 硬约束 ‖μ‖ < 1；软约束 r_μ ∈ [0.40, 0.50]
'use strict';

const { V } = require('./space');

// ────────────────────────────────────────────────
// ⭐ 出厂角色（预设）
// ────────────────────────────────────────────────
const PRESETS = {
  /** 理想无情绪 —— 退化路径，一旦对话开始就应离开 0 */
  neutral: { dir: [0, 0, 0], precision: 1.0, label: '中性（出厂）' },

  /** ⭐ 傲娇大肥鱼的候选底情绪 —— 依赖型（+P, +A, −D） */
  dependent: { dir: [ 0.80, 0.50, -0.30], precision: 3.0, label: '依赖型' },

  /** 焦虑型（−P, +A, −D） */
  anxious: { dir: [-0.75, 0.60, -0.25], precision: 5.0, label: '焦虑型' },

  /** 平静型（+P, −A, +D） */
  calm: { dir: [ 0.70, -0.50, 0.50], precision: 2.0, label: '平静型' },

  /** 轻蔑型（−P, −A, +D） */
  disdainful: { dir: [-0.70, -0.50, 0.50], precision: 4.0, label: '轻蔑型' },
};

class Mu {
  /**
   * @param {object} o
   * @param {number[]} o.dir        底情绪方向（PAD，会被归一化到 r_μ）
   * @param {number}   o.precision  先验确定性（1 = 弱，8 = 极固执）
   * @param {number}   o.rMu        到球心的距离（软约束 [0.40, 0.50]）
   * @param {string}   o.label
   */
  constructor({ dir = [0, 0, 0], precision = 1.0, rMu = 0.45, label = 'unnamed' } = {}) {
    const n = V.norm(dir);
    this.dir = n < 1e-9 ? [0, 0, 0] : V.mul(dir, 1 / n);
    this.rMu = n < 1e-9 ? 0 : rMu;
    this.precision = precision;
    this.label = label;
    // ⭐ 不可变基准（drift 由「基准 + 累计漂移」导出，避免重复吸收）
    this._baseDir = this.dir.slice();
    this._baseRmu = this.rMu;
    this._drift = [0, 0, 0];   // 慢漂移累积（#43）
    // ⭐ B5：信度的"刷新目标"（拿到新证据时回到这里）
    this._basePrecision = precision;
  }

  // ═══════════════════════════════════════════════════════════
  // ⭐ B5（docs/06）precision 的时间动力学 —— 信度衰减
  //
  //   文献：Patrício & Jamshidnejad (2025) IEEE Access 的 EKF 心智状态估计——
  //         R(k) = R0（有测量）否则 α·R(k−1)，α>1（实验 α=2）
  //         原文："α models the rate of decay of the confidence in reused measurements"
  //   ⭐ R 是【方差】；我们的 precision = 1/方差 ⇒ 无测量时 precision ← precision/α
  //
  //   ⚠️ 按 docs/06 的硬要求：【不要做在线自适应】。
  //      该文自身的假设 3（forward-fill-evolving）被其自己的实验证伪，
  //      forward-fill 就够了 —— 所以这里只有"刷新 / 衰减"两个动作，不做插值或拟合。
  //
  //   ⚠️ 默认不调用 ⇒ 不动 A3，行为与既有版本一致。
  // ═══════════════════════════════════════════════════════════

  /** ⭐ 拿到新证据 ⇒ 信度刷新（默认回到 _basePrecision） */
  setPrecision(p = null) {
    if (p !== null) this._basePrecision = p;
    this.precision = this._basePrecision;
    return this.precision;
  }

  /** ⭐ 无新证据 ⇒ 信度衰减：precision ← precision/α（α>1） */
  decayPrecision(alpha = 2.0, floor = 0.05) {
    this.precision = Math.max(floor, this.precision / alpha);
    return this.precision;
  }

  /** ⭐ 一轮：有测量则刷新，无测量则衰减 */
  tickPrecision(measured, { alpha = 2.0, floor = 0.05, refreshTo = null } = {}) {
    return measured ? this.setPrecision(refreshTo) : this.decayPrecision(alpha, floor);
  }

  /** 当前 μ 向量 */
  get vector() {
    return V.add(V.mul(this.dir, this.rMu), this._drift);
  }

  /** 先验方差（precision 的倒数）—— 供评价层/知觉层使用 */
  get variance() { return 1 / this.precision; }

  /**
   * ⭐ 慢漂移（#43「记忆是 μ 的唯一载体」）
   * 依据：barrett2016 "neurons do not lie dormant until stimulated"、μ 应为慢变而非常数
   *
   * ⚠️⚠️ 2026-10-12 修正（Codex 审计）：
   *   原实现每次调用都执行 `dir ← normalize(dir·rMu + _drift)`，
   *   而 `_drift` 在第一次调用时【已经被吸收进 dir 了】——
   *   于是第二次起 rate=0 虽然不改 _drift，却把它【又加一遍】：
   *     实测 dir 从 0.810961 连变到 0.815329（调 4 次），rMu 被顶到上限 0.500。
   *
   *   ⭐ 修法：把 (baseDir, baseRmu) 作为【不可变的基准】保存，
   *     每次由「基准 + 累计漂移」重新导出 dir/rMu。
   *     ⇒ rate=0 时 _drift 不变 ⇒ 导出结果不变 ⇒ 幂等。
   *
   * @param {number[]} delta     漂移方向
   * @param {number}   rate      漂移速率（很小，典型 0.01~0.05）；0 = 不漂
   * @param {number}   maxDrift  漂移上限（防止 μ 跑出球体）
   */
  drift(delta, rate = 0.02, maxDrift = 0.35) {
    // ⭐ rate=0 直接返回，不做任何重算（幂等）
    if (!(rate > 0)) return this.vector;

    const step = V.mul(V.unit(delta), rate);
    let next = V.add(this._drift, step);
    const nd = V.norm(next);
    if (nd > maxDrift) next = V.mul(next, maxDrift / nd);
    this._drift = next;

    // ⭐ 由【不可变基准】+ 累计漂移导出，避免重复吸收
    const full = V.add(V.mul(this._baseDir, this._baseRmu), this._drift);
    const fn = V.norm(full);
    if (fn > 1e-9) {
      this.dir = V.mul(full, 1 / fn);
      this.rMu = Math.min(0.50, Math.max(0.40, fn));
    }
    return this.vector;
  }

  /** ⭐ 累计漂移量（供审计/测试） */
  get driftMagnitude() { return V.norm(this._drift); }

  describe() {
    return `μ[${this.label}] dir=${V.fmt(this.dir, 3)} r_μ=${this.rMu.toFixed(2)} ` +
      `precision=${this.precision} var=${this.variance.toFixed(2)}`;
  }
}

/**
 * ⭐ 贝叶斯解读：precision 如何改变"模糊事件如何被读"
 * 后验均值 = (μ/varPrior + event/varLik) / (1/varPrior + 1/varLik)
 * @param {number} priorMean   先验（1 维投影，如 P 轴）
 * @param {number} eventMean   模糊事件的观测
 * @param {number} eventNoise  事件的噪声（模糊程度）
 * @param {number} precision   先验精度
 */
function bayesianRead(priorMean, eventMean, eventNoise, precision) {
  const vp = 1 / precision;
  const vl = eventNoise * eventNoise;
  const post = (priorMean / vp + eventMean / vl) / (1 / vp + 1 / vl);
  return { posterior: post, shift: post - priorMean };
}

module.exports = { Mu, PRESETS, bayesianRead };
