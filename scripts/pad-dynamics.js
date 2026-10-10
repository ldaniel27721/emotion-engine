// 大肥鱼情绪动力学 · A2 参考实现
//   E_t = μ + ρ·(E_{t−1} − μ) + ΔE_t
//     μ  = 底情绪（导入角色时用户指定，也是球心与收敛终点）
//     ρ  = 记忆保持率（角色参数）
//     ΔE = 单次事件引起的情绪变化（本文件只接收，不生成；来源机制另立待办）
//   A1 衔接：r = ‖E − μ‖，白化后 r²/σ² ~ χ²(3)，σ² = s²/(1−ρ²)
//
// 用法：
//   node pad-dynamics.js              打印参数表、底情绪候选、模拟验证
//   node pad-dynamics.js 0.50 0.927   指定 (σ, ρ) 看该档详情
'use strict';

// ---------- χ²(3) ----------
function erf(z) {
  const s = Math.sign(z); z = Math.abs(z);
  const t = 1 / (1 + 0.3275911 * z);
  return s * (1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-z * z));
}
const Phi = z => 0.5 * (1 + erf(z / Math.SQRT2));
const sfChi3 = x => x <= 0 ? 1 : 2 * (1 - Phi(Math.sqrt(x))) + Math.sqrt(2 * x / Math.PI) * Math.exp(-x / 2);
const CHI3 = { 25: 1.2133, 50: 2.3660, 75: 4.1083, 90: 6.2514, 95: 7.8147 };

// ---------- 参数换算 ----------
const halfLife = rho => Math.log(0.5) / Math.log(rho);          // 以"轮"为单位
const rhoOfHalfLife = h => Math.pow(0.5, 1 / h);
const sFrom = (sigma, rho) => sigma * Math.sqrt(1 - rho * rho); // 单次冲击敏感度（导出量）
const sigmaFrom = (s, rho) => s / Math.sqrt(1 - rho * rho);
const rhoFrom = (s, sigma) => Math.sqrt(1 - (s * s) / (sigma * sigma));
const rAt = (sigma, p) => sigma * Math.sqrt(CHI3[p]);           // 分位强度
const pOverSphere = sigma => sfChi3(1 / (sigma * sigma));       // P(r > 1)

// ---------- 核心动力学 ----------
/**
 * 走一步：E_t = μ + ρ(E_{t−1} − μ) + ΔE
 * @param {number[]} E   当前状态（白化后坐标）
 * @param {number[]} mu  底情绪（球心）
 * @param {number} rho   记忆保持率
 * @param {number[]} dE  本步事件引起的情绪变化
 * @returns {{E:number[], r:number, pct:number, overSphere:boolean}}
 */
function step(E, mu, rho, dE) {
  const next = E.map((v, i) => mu[i] + rho * (v - mu[i]) + dE[i]);
  const r = Math.hypot(...next.map((v, i) => v - mu[i]));
  return { E: next, r, pct: 1 - sfChi3(r * r), overSphere: r > 1 };
}

/** 底情绪构造：只取方向 + 指定强度。‖μ‖ < 1 是硬约束。 */
function baseEmotion(gamma, rMu) {
  if (rMu >= 1) throw new Error('底情绪强度必须 < 1（否则日常待机位置已在球外）');
  const n = Math.hypot(...gamma);
  return gamma.map(v => v / n * rMu);
}

// ---------- 输出 ----------
const args = process.argv.slice(2);
const oneSigma = args.length ? parseFloat(args[0]) : null;
const oneRho = args.length > 1 ? parseFloat(args[1]) : null;

console.log('==== A2 情绪动力学 ====');
console.log('  E_t = μ + ρ·(E_{t−1} − μ) + ΔE_t');
console.log('  μ = 底情绪（球心、收敛终点）· ρ = 记忆保持率 · ΔE = 事件冲击');
console.log('  r = ‖E − μ‖，白化后 r²/σ² ~ χ²(3)；  σ² = s²/(1−ρ²)');
console.log('');

console.log('==== ① 半衰期 ↔ ρ ====');
console.log('  ρ      ' + [0.70, 0.80, 0.85, 0.90, 0.927, 0.95, 0.97].map(r => r.toFixed(3).padStart(9)).join(''));
console.log('  半衰期(轮)' + [0.70, 0.80, 0.85, 0.90, 0.927, 0.95, 0.97].map(r => halfLife(r).toFixed(1).padStart(9)).join(''));
console.log('  ⭐ ρ = 0.927 → 9.1 轮（设定者认可的"多轮次"档）');

console.log('');
console.log('==== ② 参数表：σ × ρ → 导出的 s ====');
const sigmas = oneSigma ? [oneSigma] : [0.40, 0.45, 0.50, 0.55];
const rhos = oneRho ? [oneRho] : [0.90, 0.927, 0.95];
process.stdout.write('  σ \\ ρ  ');
for (const r of rhos) process.stdout.write(('ρ=' + r).padStart(11));
process.stdout.write('    越界率   ‖μ‖上限(球内)');
console.log('');
for (const sg of sigmas) {
  process.stdout.write('  ' + sg.toFixed(2) + '   ');
  for (const r of rhos) process.stdout.write(sFrom(sg, r).toFixed(3).padStart(11));
  const muCap = Math.min(1 - 1e-9, rAt(sg, 75));
  process.stdout.write(('   ' + (pOverSphere(sg) * 100).toFixed(1) + '%').padStart(11) +
    ('   ' + muCap.toFixed(3)).padStart(15));
  console.log('');
}
console.log('  ⚠️ ‖μ‖ 上限取 min(1, 75%分位) —— 底情绪本身必须在球内');

console.log('');
console.log('==== ③ 底情绪候选（方向取八型，强度统一给）====');
const REPS = [
  ['Exuberant ', 'Happy',     0.81, 0.51, 0.46],
  ['Dependent ', 'Loved',     0.87, 0.54, -0.18],
  ['Relaxed   ', 'Relaxed',   0.68, -0.46, 0.06],
  ['Docile    ', 'Sheltered', 0.14, -0.36, -0.44],
  ['Hostile   ', 'Angry',    -0.51, 0.59, 0.25],
  ['Anxious   ', 'Fearful',  -0.64, 0.60, -0.43],
  ['Disdainful', 'Disdainful', -0.32, -0.11, 0.09],
  ['Bored     ', 'Bored',    -0.65, -0.62, -0.33],
];
const rMu = 0.45;
console.log('  底情绪 = 方向 γ × 强度 r_μ（建议 0.40~0.50；本例 ' + rMu + '）');
console.log('  八型         代表词       方向 γ                     μ = r_μ·γ');
for (const [oct, word, p, a, d] of REPS) {
  const g0 = [p, a, d]; const n = Math.hypot(...g0); const g = g0.map(v => v / n);
  const mu = baseEmotion(g0, rMu);
  console.log('  ' + oct + word.padEnd(11) + '  (' + g.map(v => v.toFixed(2).padStart(6)).join(',') +
    ')   (' + mu.map(v => v.toFixed(2).padStart(6)).join(',') + ')');
}
console.log('  ⭐ 底情绪只取代表词的【方向】，强度由 r_μ 统一给 —— 方向可辨认但幅度温和。');
console.log('     代表词原始 r 在 0.35~1.06，其中 Happy(1.06) 已越界，显然不适合直接当底情绪。');

console.log('');
console.log('==== ④ 模拟验证：稳态分布是否等于 A1 的 χ²(3) ====');
function simulate(sigma, rho, n) {
  const s = sFrom(sigma, rho);
  // 白化后球心在 0（把 μ 平移到原点，动力学形状不变）
  let x = 0, y = 0, z = 0; const rs = [];
  let spare = null;
  const gauss = () => {
    if (spare !== null) { const v = spare; spare = null; return v; }
    let u = 0, v = 0, q = 0;
    do { u = Math.random() * 2 - 1; v = Math.random() * 2 - 1; q = u * u + v * v; } while (q === 0 || q >= 1);
    const m = Math.sqrt(-2 * Math.log(q) / q); spare = v * m; return u * m;
  };
  for (let t = 0; t < n + 3000; t++) {
    x = rho * x + s * gauss(); y = rho * y + s * gauss(); z = rho * z + s * gauss();
    if (t >= 3000) rs.push(Math.hypot(x, y, z));
  }
  return rs;
}
const quant = (a, f) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor((s.length - 1) * f)]; };
for (const [sg, r] of (oneSigma && oneRho ? [[oneSigma, oneRho]] : [[0.40, 0.927], [0.50, 0.927]])) {
  const rs = simulate(sg, r, 60000);
  console.log('  σ=' + sg.toFixed(2) + ' ρ=' + r.toFixed(3) + '（s=' + sFrom(sg, r).toFixed(3) + '）');
  console.log('    分位     A1 预测    模拟实测     差');
  for (const p of [50, 75, 90, 95]) {
    const theo = rAt(sg, p), obs = quant(rs, p / 100);
    console.log('    ' + String(p).padStart(2) + '%     ' + theo.toFixed(3).padStart(8) +
      obs.toFixed(3).padStart(12) + (obs - theo).toFixed(3).padStart(9));
  }
  console.log('    越界率   ' + (pOverSphere(sg) * 100).toFixed(2) + '%     ' +
    (rs.filter(v => v > 1).length / rs.length * 100).toFixed(2) + '%');
  console.log('    ✅ 若两者吻合，说明 A2 的动力学精确复现 A1 的稳态分布');
}
