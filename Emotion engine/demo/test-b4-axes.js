// B4 判定测试：ρ（时间轴）与 α_habit（事件轴）【不可互换】
//
// 设定者 2026-10-13 裁定：两轴分开，各为独立参数（裁定"甲"）。
// 本测试把该裁定的数值依据固化成可复跑的断言。
//
// 判据：
//   ① 同一 ρ 下，要达成同一 r，密集/稀疏两种情境所需的 α 显著不同
//   ② 存在目标 r：密集可达、稀疏不可达 ⇒ α 的作用域受事件密度限制
//   ③ α 对密集情境的影响远大于对稀疏情境的影响
//   ④ 强行令 α ≡ ρ（同源假设）会产生可观偏差
'use strict';
const { V } = require('../src/space');
const { Dynamics } = require('../src/dynamics');

const hr = s => '\n' + '═'.repeat(84) + '\n' + s + '\n' + '═'.repeat(84);
const f = (x, d = 4) => Number(x).toFixed(d);
let PASS = 0, FAIL = 0;
const check = (n, ok, d = '') => { console.log('  ' + (ok ? '✅ PASS' : '❌ FAIL') + '  ' + n + (d ? '   ' + d : '')); ok ? PASS++ : FAIL++; };

const MU = [0, 0, 0];
const SIGMA = 0.50;
const DE = [0.30, 0.20, 0.15];
const S_DENSE = [1, 1, 1, 1, 1, 1];      // 每轮都有同类事件
const S_SPARSE = [1, 0, 0, 1, 0, 0];     // 仅第 1、4 轮

function run(rho, alpha, schedule) {
  const d = new Dynamics({ rho, alpha, sigma: SIGMA, useCap: false });
  d.E = MU.slice();
  for (const has of schedule) {
    d.step(has ? DE : [0, 0, 0], MU, { eventKey: has ? 'k' : null });
  }
  return V.norm(V.sub(d.E, MU));
}

const RHOS = [0.70, 0.80, 0.85, 0.90, 0.927, 0.95];
const ALPHAS = [0.70, 0.80, 0.85, 0.90, 0.95, 1.00];

/** 对固定 ρ，二分找使 r == target 的 α；无解返回 null */
function solveAlpha(rho, sched, target) {
  const g = (a) => run(rho, a, sched) - target;
  let lo = 0.3, hi = 1.20;
  if (g(lo) * g(hi) > 0) return null;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (g(lo) * g(mid) <= 0) hi = mid; else lo = mid;
  }
  return (lo + hi) / 2;
}

// ═════════════════════════════════════════════════
console.log(hr('① 等值线是否随情境改变'));

{
  let maxDiff = 0, best = null;
  for (const t of [0.30, 0.40, 0.50, 0.55, 0.60]) {
    for (const r of RHOS) {
      const a = solveAlpha(r, S_DENSE, t);
      const b = solveAlpha(r, S_SPARSE, t);
      if (a === null || b === null) continue;
      const d = Math.abs(a - b);
      if (d > maxDiff) { maxDiff = d; best = { t, r, a, b }; }
    }
  }
  console.log('  最大失配: 目标 r=' + f(best.t, 2) + ' · ρ=' + f(best.r, 3) +
    ' ⇒ A 需 α=' + f(best.a) + ' · B 需 α=' + f(best.b));
  check('两情境所需 α 的最大差异 > 0.20', maxDiff > 0.20, '实测 ' + f(maxDiff));
  check('⇒ 两轴不可互换', maxDiff > 0.20);
}

// ═════════════════════════════════════════════════
console.log(hr('② 存在"密集可达、稀疏不可达"的目标'));

{
  const unreachable = [];
  for (const t of [0.60, 0.70, 0.80]) {
    let aOK = 0, bOK = 0;
    for (const r of RHOS) {
      if (solveAlpha(r, S_DENSE, t) !== null) aOK++;
      if (solveAlpha(r, S_SPARSE, t) !== null) bOK++;
    }
    console.log('  目标 r=' + f(t, 2) + '  ⇒ 密集 ' + aOK + '/' + RHOS.length + ' 个 ρ 有解 · 稀疏 ' + bOK + '/' + RHOS.length + ' 有解');
    if (aOK > 0 && bOK === 0) unreachable.push(t);
  }
  check('存在只有密集情境能达到的目标', unreachable.length > 0,
    '（' + unreachable.map(x => 'r=' + f(x, 2)).join(', ') + '）');
  console.log('  ⭐ 语义：稀疏情境下同类事件太少 ⇒ 习惯化几乎不起作用 ⇒ α 即使拉满也够不着');
}

// ═════════════════════════════════════════════════
console.log(hr('③ α 对两种情境的影响面不对称'));

{
  // 固定 ρ=1.00（关掉时间轴），扫 α，看 A 与 B 各自的变化幅度
  const aLo = run(1.00, 0.70, S_DENSE), aHi = run(1.00, 1.00, S_DENSE);
  const bLo = run(1.00, 0.70, S_SPARSE), bHi = run(1.00, 1.00, S_SPARSE);
  const dA = aHi - aLo, dB = bHi - bLo;
  console.log('  A 密集: α 0.70→1.00 使 r 从 ' + f(aLo) + ' 变到 ' + f(aHi) + '   Δ=' + f(dA));
  console.log('  B 稀疏: α 0.70→1.00 使 r 从 ' + f(bLo) + ' 变到 ' + f(bHi) + '   Δ=' + f(dB));
  console.log('  影响比 = ' + f(dA / dB, 2) + '×');
  check('α 对密集情境的影响 ≥ 稀疏的 3 倍', dA / dB >= 3, '实测 ' + f(dA / dB, 2) + '×');
  console.log('  ⭐ 语义：ρ 作用于【每一轮】，α 只作用于【同类事件出现时】');
}

// ═════════════════════════════════════════════════
console.log(hr('④ 强行令 α ≡ ρ（同源假设）的偏差'));

{
  let maxErr = 0, at = null;
  for (const r of RHOS) {
    const free = run(r, 0.85, S_DENSE);   // α=0.85 作为"事件轴明显钝化"的代表
    const tied = run(r, r, S_DENSE);
    const e = Math.abs(free - tied);
    if (e > maxErr) { maxErr = e; at = r; }
  }
  console.log('  最大偏差出现在 ρ=' + f(at, 3) + ' ⇒ ' + f(maxErr));
  check('同源假设造成的偏差 > 0.20', maxErr > 0.20, '实测 ' + f(maxErr));
  check('⇒ 两轴确实各自承担了不同的工作', maxErr > 0.20);
}

// ═════════════════════════════════════════════════
console.log(hr('⑤ 两轴的语义可分离性（直接验证）'));

{
  // 只推进 ρ（eventKey=null）⇒ 只有时间轴动
  const onlyTime = new Dynamics({ rho: 0.80, alpha: 0.50, sigma: SIGMA, useCap: false });
  onlyTime.E = V.mul(V.unit(DE), 1.0);
  const r0 = V.norm(onlyTime.E);
  const rec1 = onlyTime.step([0, 0, 0], MU, { eventKey: null });
  check('eventKey=null ⇒ h 不衰减（h=1）', rec1.h === 1, '实测 h=' + rec1.h);
  check('但 ρ 照常推进（r 缩小）', rec1.r < r0, f(r0) + ' → ' + f(rec1.r));

  // 只推进事件轴（rho=1）⇒ 只有事件轴动
  const onlyEvent = new Dynamics({ rho: 1.00, alpha: 0.50, sigma: SIGMA, useCap: false });
  const h1 = onlyEvent.step(DE, MU, { eventKey: 'k' }).h;
  const h2 = onlyEvent.step(DE, MU, { eventKey: 'k' }).h;
  const h3 = onlyEvent.step(DE, MU, { eventKey: 'k' }).h;
  console.log('  只开事件轴: h = ' + [h1, h2, h3].map(x => f(x, 3)).join(' → '));
  check('同类事件连发 ⇒ h 逐次钝化（0.50 幂次）', h1 === 1 && Math.abs(h2 - 0.5) < 1e-9 && Math.abs(h3 - 0.25) < 1e-9);
  console.log('  ⭐ 两轴可各自单独驱动 ⇒ 结构上确实是两个自由度');
}

// ═════════════════════════════════════════════════
console.log(hr('汇总'));
console.log(`  ✅ PASS ${PASS}   ❌ FAIL ${FAIL}`);
console.log('');
console.log('  裁定：ρ（时间轴）与 α_habit（事件轴）【分开】，各为独立参数。');
process.exit(FAIL === 0 ? 0 : 1);
