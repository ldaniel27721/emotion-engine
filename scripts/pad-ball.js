// 大肥鱼情绪动力学 · A1 球体模型参考实现
//   球体半径 1 + 三轴白化 + 正态互补（白化后 r²/σ² ~ χ²(3)）+ σ 作为角色参数
//
// 用法：
//   node pad-ball.js              打印分位表与各 σ 下的越界概率
//   node pad-ball.js 0.42         只看 σ=0.42 这一档
//
// 依赖：无（仅 Node 内置）
'use strict';

// ---------- χ²(3) 的分位点（查表值，自由度 3）----------
//   P(χ²₃ ≤ q) = p
const CHI2_3 = [
  [0.50, 2.3660], [0.75, 4.1083], [0.90, 6.2514], [0.905, 6.3000],
  [0.95, 7.8147], [0.975, 9.3484], [0.99, 11.3449], [0.995, 12.8382],
];

// χ²(3) 的生存函数有闭式：P(χ²₃ > x) = 2(1−Φ(√x)) + √(2x/π)·e^(−x/2)
function erf(z) {                       // Abramowitz & Stegun 7.1.26
  const s = Math.sign(z); z = Math.abs(z);
  const t = 1 / (1 + 0.3275911 * z);
  const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-z * z);
  return s * y;
}
const Phi = z => 0.5 * (1 + erf(z / Math.SQRT2));
const sfChi3 = x => x <= 0 ? 1 : 2 * (1 - Phi(Math.sqrt(x))) + Math.sqrt(2 * x / Math.PI) * Math.exp(-x / 2);

// ---------- 核心关系 ----------
// 白化后 y = W(x−μ)，三轴独立 ~ N(0, σ²)，于是 r = |y| 满足  r = σ·√χ²₃
/** 球面半径 1 对应的 χ² 分位：r=1 ⟺ σ = 1/√q */
const sigmaForTailAtSphere = p => 1 / Math.sqrt(chi2QuantileGivenTail(p));
/** 给定角色的 σ，求"越过球面(半径1)的概率" */
const pOverSphere = sigma => sfChi3(1 / (sigma * sigma));
/** 给定 σ 与目标越界概率，反解需要多大的 σ —— 见 pOverSphere 的数值反查 */
const radiusAtPercentile = (sigma, p) => sigma * Math.sqrt(chi2AtP(p));

// 由目标分位 p 反求 χ²(3) 分位（表内插，表外用生存函数二分）
function chi2AtP(p) {
  for (let i = 0; i < CHI2_3.length; i++) if (Math.abs(CHI2_3[i][0] - p) < 1e-12) return CHI2_3[i][1];
  let lo = 1e-6, hi = 60;
  for (let k = 0; k < 200; k++) { const mid = (lo + hi) / 2; (1 - sfChi3(mid) < p) ? lo = mid : hi = mid; }
  return (lo + hi) / 2;
}
function chi2QuantileGivenTail(pTail) {   // 使 sfChi3(q) = pTail
  let lo = 1e-6, hi = 60;
  for (let k = 0; k < 200; k++) { const mid = (lo + hi) / 2; (sfChi3(mid) > pTail) ? lo = mid : hi = mid; }
  return (lo + hi) / 2;
}

// ---------- 线性代数（3×3，够用）----------
const matVec = (M, v) => M.map(row => row.reduce((s, x, i) => s + x * v[i], 0));
function transpose(M) { return M[0].map((_, j) => M.map(r => r[j])); }
function matMul(A, B) {
  const Bt = transpose(B);
  return A.map(row => Bt.map(col => row.reduce((s, x, i) => s + x * col[i], 0)));
}
/** Cholesky：Σ = L Lᵀ（Σ 须正定） */
function cholesky(S) {
  const n = S.length, L = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) for (let j = 0; j <= i; j++) {
    let s = S[i][j];
    for (let k = 0; k < j; k++) s -= L[i][k] * L[j][k];
    if (i === j) { if (s <= 0) throw new Error('Σ 不是正定矩阵'); L[i][j] = Math.sqrt(s); }
    else L[i][j] = s / L[j][j];
  }
  return L;
}
/** 前代法解 L y = b（L 下三角） */
function forwardSub(L, b) {
  const n = b.length, y = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    let s = b[i];
    for (let k = 0; k < i; k++) s -= L[i][k] * y[k];
    y[i] = s / L[i][i];
  }
  return y;
}
/** 白化矩阵 W = L⁻¹，使 W Σ Wᵀ = I。对每个点：y = W(x − μ) */
function whitenMatrix(Sigma) { return cholesky(Sigma); }   // 直接用 L 做前代即可，无需显式求逆

/**
 * 把一个原始 PAD 点白化并算出球坐标。
 * @param {number[]} x      原始 (P,A,D)
 * @param {number[]} mu     该角色的情绪中心（通常全 0；见 A3）
 * @param {number[][]} Sigma 三轴协方差矩阵
 * @returns {{y:number[], r:number, dir:number[], pct:number}}
 */
function toBall(x, mu, Sigma) {
  const L = whitenMatrix(Sigma);                       // Σ = L Lᵀ
  const d = x.map((v, i) => v - mu[i]);
  const y = forwardSub(L, d);                          // y 已去相关且各轴同方差
  const r = Math.hypot(...y);
  return { y, r, dir: r > 0 ? y.map(v => v / r) : y.map(() => 0), pct: 1 - sfChi3((r / 1) ** 2 * 0) };
}

// ---------- 输出 ----------
const args = process.argv.slice(2);
const oneSigma = args.length ? parseFloat(args[0]) : null;

console.log('==== A1 球体 + 正态互补模型 · 分位表 ====');
console.log('  关系：白化后 r = |y| = σ·√χ²₃      （χ²₃ = 自由度 3 的卡方）');
console.log('');
console.log('  分位      χ²₃         r/σ        σ=0.40 时   σ=0.50 时');
for (const [p, q] of CHI2_3) {
  const k = Math.sqrt(q);
  console.log('  ' + (p * 100).toFixed(1).padStart(5) + '%   ' + q.toFixed(3).padStart(7) +
    '   ' + k.toFixed(3).padStart(7) +
    '   ' + (0.40 * k).toFixed(3).padStart(8) + '   ' + (0.50 * k).toFixed(3).padStart(8));
}

console.log('');
console.log('==== 球面半径 1 的位置 ====');
const qAtSphere01 = chi2QuantileGivenTail(0.10);        // 10% 尾巴
const qAtSphere005 = chi2QuantileGivenTail(0.05);
console.log('  若「前 10% 的极端情绪越过球面」→ σ 应取 ' + (1 / Math.sqrt(qAtSphere01)).toFixed(4) +
  '   （此时 r=1 ⟺ χ²₃=' + qAtSphere01.toFixed(3) + '）');
console.log('  若「前  5% 的极端情绪越过球面」→ σ 应取 ' + (1 / Math.sqrt(qAtSphere005)).toFixed(4) +
  '   （此时 r=1 ⟺ χ²₃=' + qAtSphere005.toFixed(3) + '）');
console.log('  ⭐ 与实测拟合值（心理学谱系 σ≈0.38~0.40）一致 → 采用「前 10%」这一档');

console.log('');
console.log('==== σ 作为角色参数：越界概率 ====');
console.log('  σ        越过球面(|E|>1)的概率      中位强度 r=1.538σ     平时用掉多少量程');
const sigmas = oneSigma ? [oneSigma] : [0.25, 0.30, 0.35, 0.40, 0.45, 0.50, 0.60];
for (const s of sigmas) {
  const p = pOverSphere(s);
  const medR = radiusAtPercentile(s, 0.50);
  console.log('  ' + s.toFixed(2).padStart(4) + '   ' + (p * 100).toFixed(2).padStart(8) + '%' +
    '                ' + medR.toFixed(3).padStart(6) + '            ' + (medR * 100).toFixed(0).padStart(3) + '%');
}
console.log('');
console.log('  ⭐ 读法：σ 决定「这个人平时用掉球体多少量程、多容易摸到球面」。');
console.log('     球体半径恒为 1 —— 是所有人的共同容器；σ 是角色参数（情绪起伏幅度）。');
console.log('     冷淡平稳 σ≈0.30 · 典型 σ≈0.40 · 情绪化 σ≈0.50');

console.log('');
console.log('==== 白化示例（拟用 P–D = .40 的相关结构）====');
const rho = 0.40;
const Sigma = [[1, 0, rho], [0, 1, 0], [rho, 0, 1]];
try {
  const L = cholesky(Sigma);
  const W = matMul([[1, 0, 0], [0, 1, 0], [0, 0, 1]], L);   // 仅展示 L
  console.log('  Σ = [[1,0,' + rho + '],[0,1,0],[' + rho + ',0,1]]   （P–D 相关 .40，A 独立）');
  console.log('  Cholesky L =');
  L.forEach(row => console.log('    [' + row.map(v => v.toFixed(4).padStart(8)).join(', ') + ']'));
  // 验证：L Lᵀ 应还原 Σ
  const back = matMul(L, transpose(L));
  console.log('  验证 L·Lᵀ 是否还原 Σ：' +
    (back.every((r, i) => r.every((v, j) => Math.abs(v - Sigma[i][j]) < 1e-9)) ? '✅ 是' : '❌ 否'));
  console.log('  白化：y = L⁻¹(x−μ)  —— 用前代法解 L y = x−μ 即可，不必显式求逆。');
  const x = [0.81, 0.51, 0.46];                              // R&M 1977 的 Happy
  const y = forwardSub(L, x);
  const r = Math.hypot(...y);
  console.log('');
  console.log('  例：Happy = (' + x.join(', ') + ')');
  console.log('      白化后 y = (' + y.map(v => v.toFixed(4)).join(', ') + ')   r = ' + r.toFixed(4));
  const s = 0.40;
  console.log('      σ=0.40 时该点的 χ²₃ = (r/σ)² = ' + ((r / s) ** 2).toFixed(3) +
    '  → 尾部概率 ' + (sfChi3((r / s) ** 2) * 100).toFixed(2) + '%');
  console.log('      → ' + (r > 1 ? '⚠️ 越过球面（属极端情绪）' : '在球面内（' + (r * 100).toFixed(0) + '% 量程处）'));
} catch (e) {
  console.log('  ❌ ' + e.message);
}
