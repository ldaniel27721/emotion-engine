// B8 标定验证：μ 漂移速率与「60 天看不出漂移」
'use strict';
const { Mu, DRIFT_RATE_CALIBRATED } = require('../src/mu');
const { V } = require('../src/space');

const hr = s => '\n' + '═'.repeat(84) + '\n' + s + '\n' + '═'.repeat(84);
const f = (x, d = 6) => Number(x).toFixed(d);
let PASS = 0, FAIL = 0;
const check = (n, ok, d = '') => { console.log('  ' + (ok ? '✅ PASS' : '❌ FAIL') + '  ' + n + (d ? '   ' + d : '')); ok ? PASS++ : FAIL++; };

const MAXD = 0.35;
const N_PER_DAY = 20;
const DAYS = 60;
const DELTA = 0.05;    // "看不出"的阈值：球体半径的 5%

// ═════════════════════════════════════════════════
console.log(hr('① 标定值本身'));
console.log('  DRIFT_RATE_CALIBRATED = ' + DRIFT_RATE_CALIBRATED.toExponential(3));
{
  const bound = DELTA / (DAYS * N_PER_DAY);
  console.log('  反解上界 δ/(60N) = ' + bound.toExponential(3) + '   （N=' + N_PER_DAY + ', δ=' + DELTA + '）');
  check('标定值 ≤ 反解上界', DRIFT_RATE_CALIBRATED <= bound + 1e-12);
  check('标定值 > 0', DRIFT_RATE_CALIBRATED > 0);
}

// ═════════════════════════════════════════════════
console.log(hr('② 现行默认 0.02 确实过时'));

{
  const stepsCap = MAXD / 0.02;
  const daysCap = stepsCap / N_PER_DAY;
  console.log('  默认 0.02/次 ⇒ 顶到 maxDrift(0.35) 需 ' + f(stepsCap, 1) + ' 轮 = ' + f(daysCap, 2) + ' 天');
  check('默认值在 60 天【之内】就顶到上限（与文献冲突）', daysCap < DAYS, f(daysCap, 2) + ' 天 ≪ 60 天');
  check('标定值比默认值小至少 100 倍', 0.02 / DRIFT_RATE_CALIBRATED >= 100,
    f(0.02 / DRIFT_RATE_CALIBRATED, 0) + '×');
}

// ═════════════════════════════════════════════════
console.log(hr('③ 用标定值：60 天内位移 < δ'));

{
  // 每轮都朝同一方向漂（最坏情形 —— 位移最快）
  const m = new Mu({ dir: [1, 0, 0], precision: 3, rMu: 0.45, label: 'cal' });
  const N = DAYS * N_PER_DAY;
  for (let i = 0; i < N; i++) m.drift([0, 1, 0], DRIFT_RATE_CALIBRATED);
  const d60 = m.driftMagnitude;
  console.log('  最坏情形（每轮都朝同向漂）' + N + ' 轮后位移 = ' + f(d60));
  check('60 天累计位移 ≤ δ(0.05)', d60 <= DELTA + 1e-12, f(d60));
  check('且确实产生了位移（不是死值）', d60 > 0.03, f(d60));
}

// ═════════════════════════════════════════════════
console.log(hr('④ 到上限需要多"慢"'));

{
  const stepsCap = MAXD / DRIFT_RATE_CALIBRATED;
  const daysCap = stepsCap / N_PER_DAY;
  const years = daysCap / 365;
  console.log('  标定值 ⇒ 顶到上限需 ' + f(stepsCap, 0) + ' 轮 = ' + f(daysCap, 0) + ' 天 = ' + f(years, 2) + ' 年');
  check('到上限需要 > 1 年（才算慢变量）', years > 1, f(years, 2) + ' 年');
}

// ═════════════════════════════════════════════════
console.log(hr('⑤ 与「记忆是 μ 唯一载体」的相容性'));

{
  // 平凡情形：delta 很小 ⇒ μ 几乎不动
  const quiet = new Mu({ dir: [1, 0, 0], precision: 3, rMu: 0.45, label: 'quiet' });
  for (let i = 0; i < 60 * N_PER_DAY; i++) quiet.drift([0, 1, 0], 0);   // 无可记之事
  console.log('  平凡情形（delta=0）60 天位移 = ' + f(quiet.driftMagnitude));
  check('无事发生 ⇒ μ 完全不动', quiet.driftMagnitude === 0);

  // 重大事件：delta 大、rate 也大（记忆被写厚）
  const storm = new Mu({ dir: [1, 0, 0], precision: 3, rMu: 0.45, label: 'storm' });
  for (let i = 0; i < 60; i++) storm.drift([0, 1, 0], 0.005);           // 每轮一次重度记忆
  console.log('  重大事件（rate=0.005/轮）60 轮位移 = ' + f(storm.driftMagnitude));
  check('有重事 ⇒ μ 可以明显移动', storm.driftMagnitude > DELTA,
    f(storm.driftMagnitude) + ' > ' + DELTA);
  console.log('  ⭐ 结论：rate 是【每单位记忆积累】的系数；60 天标定只约束【平凡情形】');
}

// ═════════════════════════════════════════════════
console.log(hr('⑥ 回归：drift 的既有不变量仍成立'));

{
  const m = new Mu({ dir: [1, 0, 0], precision: 3, rMu: 0.45, label: 'r' });
  const s0 = V.fmt(m.vector, 9);
  m.drift([0, 1, 0], 0);
  check('rate=0 幂等（B4 修正的不变量）', V.fmt(m.vector, 9) === s0);

  const m2 = new Mu({ dir: [1, 0, 0], precision: 3, rMu: 0.45, label: 'r2' });
  for (let i = 0; i < 500; i++) m2.drift([0, 1, 0], 0.01);
  check('大 rate 仍受 maxDrift 约束', m2.driftMagnitude <= MAXD + 1e-12, f(m2.driftMagnitude));

  // 漂移不得把 ‖μ‖ 推出球体（drift 只改 _drift，dir*rMu 部分不变）
  check('‖μ‖ 有限（未爆）', Number.isFinite(V.norm(m2.vector)), f(V.norm(m2.vector)));
}

// ═════════════════════════════════════════════════
console.log(hr('汇总'));
console.log(`  ✅ PASS ${PASS}   ❌ FAIL ${FAIL}`);
process.exit(FAIL === 0 ? 0 : 1);
