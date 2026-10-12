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
//   ⚠️⚠️ 2026-10-12 重大修正（Codex 审计发现的稳定性缺陷）
//
//   原实现 f(r) = 1 − (1+r)^(−k) 是【全域】施加的，但
//        f'(0) = k  ← 不是 1！
//   ⇒ 低区不是"近似恒等"，而是【斜率 k 的线性放大】
//   ⇒ 空闲时 dev ×= ρ(0.927) 再 ×≈k(2) ⇒ 净 1.854 > 1 ⇒ 【放大】
//   ⇒ 实测：从 r0=0.01/0.05/0.15/0.30 出发空闲 30 轮，
//           全部收敛到 r≈0.574 而不是 0 —— 推翻了 A3「μ 是收敛终点」
//
//   ⭐ 而设定者原话是「对数函数做为限制，使其增长最大值无限趋于1但不为，
//      高增幅阶段则由模型情绪化程度决定」——
//      【高增幅阶段】才限制 ⇒ 低区应当恒等。原实现理解错了。
//
//   修正后的分段形式（r0 处 C¹ 连续）：
//
//      f(r) = r                                            r ≤ r0
//           = r0 + (1−r0)·[1 − (1 + (r−r0)/((1−r0)·k))^(−k)]   r > r0
//
//   性质：f(0)=0 · f'(0)=1（低区恒等）· f'(r0⁻)=f'(r0⁺)=1
//         lim(r→∞) f(r) = 1（渐近，永不到达）· f(r) ≤ r（全域不放大）
//   ⭐ r0 = 低区上界，由 σ 决定 —— 即「高增幅阶段由情绪化程度决定」
// ────────────────────────────────────────────────

/** ⭐ 低区上界 r0：默认 2σ（约在角色日常波动的上沿） */
function defaultR0(k) {
  const sigma = 1 / k;
  return Math.min(0.85, Math.max(0.30, 2 * sigma));
}

/**
 * 分段对数封顶
 * @param {number} r
 * @param {number} k   陡度（= 1/σ）
 * @param {number} [r0] 低区上界；不给则取 2σ
 */
function cap(r, k, r0 = null) {
  if (r <= 0) return 0;
  const R0 = r0 === null ? defaultR0(k) : r0;
  if (r <= R0) return r;                         // ⭐ 低区：恒等（不放大）
  const u = r - R0;
  const A = 1 - R0;
  return R0 + A * (1 - Math.pow(1 + u / (A * k), -k));
}

/**
 * 反解：给 y = cap(r)，求 r
 */
function capInverse(y, k, r0 = null) {
  const R0 = r0 === null ? defaultR0(k) : r0;
  if (y <= 0) return 0;
  if (y <= R0) return y;                         // 低区恒等
  if (y >= 1) return Infinity;
  const A = 1 - R0;
  const t = (y - R0) / A;                        // ∈ (0,1)
  // t = 1 − (1 + u/(A·k))^(−k)  ⇒  u = A·k·[(1−t)^(−1/k) − 1]
  return R0 + A * k * (Math.pow(1 - t, -1 / k) - 1);
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

module.exports = { V, Space, cap, capInverse, chi2_3_cdf, defaultR0 };
