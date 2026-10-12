// A1 —— 球体与正态互补模型
//
// 三维 PAD 空间 · 白化 · χ²(3) 量程 · 对数封顶
//
// 设计要点（来自 A1 定案 + 2026-10-12 的封顶裁定）：
//   · 情绪 = 单位球内的一个点 E ∈ R³（P=愉悦, A=唤醒, D=支配）
//   · 白化后 γ = y/‖y‖，r = ‖y‖；r²/σ² ~ χ²(3)   （σ 是角色参数）
//   · ⭐ 封顶：f(r) = 1 − (1+r)^(−k)，k = 1/σ
//       lim(r→∞) f(r) = 1（永不到达）—— "球面 = 强度的极致" 从【阈值】变成【极限】
//       低区近似线性，高区被压扁；k 决定"从哪里开始被压扁"
'use strict';

// ────────────────────────────────────────────────
// 向量工具
// ────────────────────────────────────────────────
const V = {
  add: (a, b) => a.map((x, i) => x + b[i]),
  sub: (a, b) => a.map((x, i) => x - b[i]),
  mul: (a, s) => a.map(x => x * s),
  dot: (a, b) => a.reduce((s, x, i) => s + x * b[i], 0),
  norm: a => Math.hypot(...a),
  unit: a => { const n = V.norm(a); return n < 1e-12 ? [0, 0, 0] : V.mul(a, 1 / n); },
  lerp: (a, b, t) => a.map((x, i) => x + (b[i] - x) * t),
  fmt: (a, d = 3) => '[' + a.map(x => x.toFixed(d).padStart(7)).join(', ') + ']',
};

// ────────────────────────────────────────────────
// χ²(3) 分布（Wilson–Hilferty 近似）
// ────────────────────────────────────────────────
function chi2_3_cdf(x) {
  if (x <= 0) return 0;
  const z = (Math.cbrt(x / 3) - (1 - 2 / 9)) / Math.sqrt(2 / 9);
  // Φ(z)
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989422804 * Math.exp(-z * z / 2);
  const p = d * t * (0.319381530 + t * (-0.356563782 + t * (1.781477937 +
    t * (-1.821255978 + t * 1.330274429))));
  return z > 0 ? 1 - p : p;
}

// ────────────────────────────────────────────────
// ⭐ 封顶函数（2026-10-12 裁定）
//
//   f(r) = 1 − (1+r)^(−k)  =  1 − e^(−k·ln(1+r))
//                                ↑       ↑
//                          指数封顶   对数内核
//
//   性质：f(0)=0 · f' > 0 · lim f = 1 · f(r) < r（恒压缩）
//   k = 1/σ  ⇒ "情绪化程度"同时决定【平时波动】与【多快被压扁】
// ────────────────────────────────────────────────
function cap(r, k) {
  if (r <= 0) return 0;
  return 1 - Math.pow(1 + r, -k);
}
function capInverse(y, k) {
  // 反解 r：y = 1 − (1+r)^(−k)  ⇒  r = (1−y)^(−1/k) − 1
  if (y <= 0) return 0;
  if (y >= 1) return Infinity;
  return Math.pow(1 - y, -1 / k) - 1;
}

// ────────────────────────────────────────────────
// 球体（一个角色 = 一套参数）
// ────────────────────────────────────────────────
class Space {
  /**
   * @param {object} o
   * @param {number[]} o.sigma  情绪起伏幅度（A1 角色参数，典型 0.40~0.50）
   * @param {boolean}  o.useCap 是否启用对数封顶（默认 true）
   */
  constructor({ sigma = 0.40, useCap = true } = {}) {
    this.sigma = sigma;
    this.useCap = useCap;
    this.k = 1 / sigma;            // ⭐ 封顶参数由 σ 挂接
  }

  /** 球面量程：把 r 映射到 [0,1) 的百分位（χ²(3)） */
  percentile(r) { return chi2_3_cdf((r * r) / (this.sigma * this.sigma)); }

  /** 有效强度：封顶后的 r */
  effective(r) { return this.useCap ? cap(r, this.k) : r; }

  /** r 到球面的"距离感"：越接近 1 越接近极限 */
  saturations(r) { return this.effective(r); }

  describe() {
    return `Space(σ=${this.sigma}, k=${this.k.toFixed(3)}, cap=${this.useCap})`;
  }
}

module.exports = { V, Space, cap, capInverse, chi2_3_cdf };
