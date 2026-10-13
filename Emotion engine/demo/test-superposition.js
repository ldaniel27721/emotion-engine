// 多事件可叠加性回归 —— 把 docs/11 的核心结论固化成断言
'use strict';
const V = require('../src/space').V;
const { Character } = require('../src/engine');

const hr = s => '\n' + '═'.repeat(88) + '\n' + s + '\n' + '═'.repeat(88);
const f = (x, d = 6) => Number(x).toFixed(d);
let PASS = 0, FAIL = 0;
const check = (n, ok, d = '') => { console.log('  ' + (ok ? '✅ PASS' : '❌ FAIL') + '  ' + n + (d ? '   ' + d : '')); ok ? PASS++ : FAIL++; };

const EV = {
  夸奖: { eventKey: '被夸奖', appraisal: { relevance: 0.9, congruence: 0.8, importance: 0.6, agency: 'other', coping: 0.8, certainty: 0.7, expectancy: 0.4, intentionality: 1.0, currentArousal: 0.3 } },
  责备: { eventKey: '被责备', appraisal: { relevance: 0.9, congruence: -0.9, importance: 0.8, agency: 'other', coping: 0.5, certainty: 0.9, expectancy: 0.7, intentionality: 1.0, currentArousal: 0.5 } },
  忽视: { eventKey: '被忽视', appraisal: { relevance: 0.9, congruence: -0.8, importance: 0.7, agency: 'other', coping: 0.3, certainty: 0.7, expectancy: 0.8, intentionality: 0.3, currentArousal: 0.4 } },
};
const mk = (o = {}) => new Character(Object.assign({
  name: 'x', sigma: 0.50, muPreset: 'dependent', subtype: ['Tsundere'], gainPos: 1.0, gainNeg: 1.0,
}, o));

// ⚠️ 这组序列必须真能把 r 推到 r0=2σ 以上，否则封顶不介入、测不出非线性。
//    （σ=0.50 ⇒ r0=0.85；本组在第 6 轮就越过）
const SEQ = [[1, '夸奖'], [2, '责备'], [3, '忽视'], [4, '夸奖'], [5, '责备'], [6, '忽视'],
[7, null], [8, '夸奖'], [9, '责备'], [10, '夸奖'], [11, '忽视'], [12, '责备']];

// ═════════════════════════════════════════════════
console.log(hr('① 关封顶 ⇒ E−μ 必须等于 Σ ρ^age·g·h·ΔE_raw（逐位）'));

for (const useCap of [false, true]) {
  const c = mk();
  c.space.useCap = useCap; c.dynamics.useCap = useCap;
  c.E = c.mu.vector.slice(); c.dynamics.syncTo(c.E);
  const steps = [];
  for (const [, name] of SEQ) {
    if (name) { const r = c.step(JSON.parse(JSON.stringify(EV[name]))); steps.push(V.mul(r.dE, r.g * r.h)); }
    else { c.idle(1); steps.push(null); }
  }
  const rho = c.dynamics.rho, T = SEQ.length;
  let pred = [0, 0, 0];
  for (let i = 0; i < T; i++) if (steps[i]) pred = V.add(pred, V.mul(steps[i], Math.pow(rho, T - 1 - i)));
  const diff = V.norm(V.sub(pred, V.sub(c.E, c.mu.vector)));
  console.log('  useCap=' + String(useCap).padEnd(6) + '差 = ' + f(diff, 10));
  if (!useCap) check('关封顶 ⇒ 逐位吻合（< 1e-9）', diff < 1e-9);
  else check('开封顶 ⇒ 【不】吻合（证明封顶是非线性来源）', diff > 1e-6);
}

// ═════════════════════════════════════════════════
console.log(hr('② 连续 N 次同向事件 ⇒ r 的倍数应等于 Σρ^k（不是 N）'));

{
  const rho = 0.927;
  const sum = (n) => { let s = 0; for (let k = 0; k < n; k++) s += Math.pow(rho, k); return s; };
  console.log('  解析 Σρ^k: ' + [1, 2, 3, 4].map(n => f(sum(n), 4).padStart(9)).join(''));

  const run = (n) => {
    const c = mk({ alpha: 1.0 });           // ⭐ 关习惯化
    c.space.useCap = false; c.dynamics.useCap = false;   // ⭐ 关封顶
    for (let i = 0; i < n; i++) c.step(JSON.parse(JSON.stringify(EV['夸奖'])));
    return V.norm(V.sub(c.E, c.mu.vector));
  };
  const r1 = run(1);
  const ratios = [1, 2, 3, 4].map(n => run(n) / r1);
  console.log('  实测倍数  : ' + ratios.map(x => f(x, 4).padStart(9)).join(''));
  const ok = [1, 2, 3, 4].every(n => Math.abs(ratios[n - 1] - sum(n)) < 1e-9);
  check('实测倍数 = Σρ^k（逐位）', ok);
  check('2 次的正确基准是 1.927，不是 2', Math.abs(ratios[1] - 1.927) < 1e-9, f(ratios[1]));
}

// ═════════════════════════════════════════════════
console.log(hr('③ 时序记忆：AB = ρ·A + B，BA = A + ρ·B'));

{
  const one = (e) => {
    const c = mk({ alpha: 1.0 });
    c.space.useCap = false; c.dynamics.useCap = false;
    c.step(JSON.parse(JSON.stringify(e)));
    return V.sub(c.E, c.mu.vector);
  };
  const two = (e1, e2) => {
    const c = mk({ alpha: 1.0 });
    c.space.useCap = false; c.dynamics.useCap = false;
    c.step(JSON.parse(JSON.stringify(e1)));
    c.step(JSON.parse(JSON.stringify(e2)));
    return V.sub(c.E, c.mu.vector);
  };
  const rho = 0.927;
  const A = one(EV['夸奖']), B = one(EV['责备']);
  const AB = two(EV['夸奖'], EV['责备']);
  const BA = two(EV['责备'], EV['夸奖']);

  const predAB = V.add(V.mul(A, rho), B);
  const predBA = V.add(V.mul(B, rho), A);
  console.log('  AB 实测=' + V.fmt(AB, 5) + '  预测=' + V.fmt(predAB, 5) + '  差=' + f(V.norm(V.sub(AB, predAB)), 10));
  console.log('  BA 实测=' + V.fmt(BA, 5) + '  预测=' + V.fmt(predBA, 5) + '  差=' + f(V.norm(V.sub(BA, predBA)), 10));
  check('「夸奖→责备」= ρ·A + B', V.norm(V.sub(AB, predAB)) < 1e-9);
  check('「责备→夸奖」= A + ρ·B', V.norm(V.sub(BA, predBA)) < 1e-9);
  check('顺序不同 ⇒ 结果不同（时序记忆）', V.norm(V.sub(AB, BA)) > 1e-3, f(V.norm(V.sub(AB, BA)), 4));
}

// ═════════════════════════════════════════════════
console.log(hr('④ 习惯化：同类事件第 n 次的冲击 = α^(n−1)'));

{
  const c = mk({ alpha: 0.95 });
  const hs = [];
  for (let i = 0; i < 6; i++) hs.push(c.step(JSON.parse(JSON.stringify(EV['夸奖']))).h);
  console.log('  h = ' + hs.map(x => f(x, 5)).join(' → '));
  check('h(n) = 0.95^(n−1)', hs.every((h, i) => Math.abs(h - Math.pow(0.95, i)) < 1e-12));
  check('h 单调递减（不复位）', hs.every((h, i) => i === 0 || h <= hs[i - 1]));
}

// ═════════════════════════════════════════════════
console.log(hr('⑤ μ 层：多事件后 μ 不动（长期记忆的缺口）'));

{
  const c = mk();
  const mu0 = c.mu.vector.slice();
  for (const [, name] of SEQ) { if (name) c.step(JSON.parse(JSON.stringify(EV[name]))); else c.idle(1); }
  const d = V.norm(V.sub(c.mu.vector, mu0));
  console.log('  μ 变化量 = ' + f(d, 12));
  check('μ 【不】自动漂移（必须显式调 drift）', d < 1e-12);
  console.log('  ⭐ 所以"长期记忆"必须靠 μ 漂移接上（issue #43）');
}

// ═════════════════════════════════════════════════
console.log(hr('汇总'));
console.log(`  ✅ PASS ${PASS}   ❌ FAIL ${FAIL}`);
process.exit(FAIL === 0 ? 0 : 1);
