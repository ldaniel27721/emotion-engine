// docs/10 走查例子的断言版 —— 保证文档里的公式与数字与引擎一致
// 同时回归：rec 必须【透传】动力学实际用到的因子（2026-10-13 修的透传缺陷）
'use strict';
const V = require('../src/space').V;
const ap = require('../src/appraisal');
const { Character } = require('../src/engine');

const hr = s => '\n' + '═'.repeat(84) + '\n' + s + '\n' + '═'.repeat(84);
const f = (x, d = 4) => Number(x).toFixed(d);
let PASS = 0, FAIL = 0;
const check = (n, ok, d = '') => { console.log('  ' + (ok ? '✅ PASS' : '❌ FAIL') + '  ' + n + (d ? '   ' + d : '')); ok ? PASS++ : FAIL++; };
const near = (a, b, tol = 1e-9) => Math.abs(a - b) < tol;

const EV = {
  eventKey: '被夸奖',
  appraisal: {
    relevance: 0.9, congruence: 0.8, importance: 0.6,
    agency: 'other', coping: 0.8, certainty: 0.7,
    expectancy: 0.4, intentionality: 1.0, currentArousal: 0.3,
  },
  context: { triggers: ['alone'], strategyScale: 0.35 },
};

// ═════════════════════════════════════════════════
console.log(hr('① 文档里的中间量公式与引擎一致'));

{
  const a = ap.aiAppraise(EV.appraisal);
  const c = new Character({ name: 'x', sigma: 0.50, muPreset: 'dependent' });
  const r = c.step(JSON.parse(JSON.stringify(EV)));

  const valence = a.congruence * a.relevance;
  const expVal = (a.expectancy - 0.5) * 2;
  const intensity = Math.min(1, a.importance * a.relevance * (1 + 0.5 * (1 - a.expectancy)) * (1 + 0.3 * a.currentArousal));
  const alpha = Math.min(1, Math.max(0, Math.max(a.relevance * a.importance, (1 - a.certainty) * a.relevance)));
  const eps = Math.abs(valence - expVal) * 0.5 + 0.5 * (1 - a.certainty);

  console.log('   valence=' + f(valence) + '  expectedValence=' + f(expVal) + '  intensity=' + f(intensity));
  console.log('   α=' + f(alpha) + '  ε=' + f(eps));
  check('valence = congruence×relevance', near(r.valence, valence));
  check('intensity = 0.7652（文档值）', near(r.intensity, intensity));
  check('α = 0.5400（文档值）', near(r.alpha, alpha));
  check('ε = 0.6100（文档值）', near(r.eps, eps));
  check('direction = Happiness → Exuberant', r.direction === 'Happiness' && r.octant === 'Exuberant');
}

// ═════════════════════════════════════════════════
console.log(hr('② ⭐ 回归：rec 必须透传动力学实际用到的因子'));

{
  const c = new Character({ name: 'x', sigma: 0.50, muPreset: 'dependent' });
  const r = c.step(JSON.parse(JSON.stringify(EV)));

  // 2026-10-13 前：rec 里没有 g / rho / rhoContext / context / noveltyFired
  for (const k of ['g', 'rho', 'rhoContext', 'context', 'noveltyFired']) {
    check('rec.' + k + ' 已透传（不是 undefined）', r[k] !== undefined, '= ' + JSON.stringify(r[k]));
  }
  console.log('   g=' + f(r.g) + '（gGain ' + f(r.gGain) + ' × strategyScale ' + f(r.gStrategy) + '）');
  check('g = gGain × gStrategy', near(r.g, r.gGain * r.gStrategy));
  check('g = 0.35（文档值）', near(r.g, 0.35));
  check('rho = 0.927（默认单标量）', near(r.rho, 0.927));
}

// ═════════════════════════════════════════════════
console.log(hr('③ B2 / B3 开启时，痕迹也必须能被看见'));

{
  const { Dynamics } = require('../src/dynamics');
  const CTX = { workday: 1 / 0.3, weekend: 1.0 };
  const c = new Character({ name: 'y', sigma: 0.50, muPreset: 'dependent' });
  c.dynamics.rhoByContext = CTX;
  const r = c.step(Object.assign(JSON.parse(JSON.stringify(EV)), { context: { triggers: [], scene: 'workday' } }));
  console.log('   rho=' + f(r.rho) + '  rhoContext=' + (r.rhoContext === null ? 'null' : f(r.rhoContext)) + '  context=' + r.context);
  check('context 被记录', r.context === 'workday');
  check('rhoContext 非空（B2 生效）', r.rhoContext !== null && r.rhoContext > 0.927);

  // B3
  const d = new Dynamics({ sigma: 0.50, noveltyReset: true, noveltyThreshold: 0.35 });
  d.E = [0, 0, 0];
  d.step([0.3, 0.2, 0.15], [0, 0, 0], { eventKey: 'k' });
  d.step([0.3, 0.2, 0.15], [0, 0, 0], { eventKey: 'k' });
  const r3 = d.step([-0.4, -0.3, 0.2], [0, 0, 0], { eventKey: 'k' });   // 换梗
  check('noveltyFired 被记录（换梗时 true）', r3.noveltyFired === true);
}

// ═════════════════════════════════════════════════
console.log(hr('④ 文档说的"任一为 0 则 ΔE = 0"逐条验证'));

{
  const mk = () => new Character({ name: 'z', sigma: 0.50, muPreset: 'dependent' });
  const run = (patch) => {
    const ev = JSON.parse(JSON.stringify(EV));
    Object.assign(ev.appraisal, patch);
    return mk().step(ev);
  };

  const cases = [
    ['relevance = 0（与你无关）', { relevance: 0 }],
    ['congruence = 0（无所谓顺不顺）', { congruence: 0 }],
    ['importance = 0（不重要）', { importance: 0 }],
  ];
  for (const [name, patch] of cases) {
    const r = run(patch);
    console.log('   ' + name.padEnd(28) + 'α=' + f(r.alpha) + '  ε=' + f(r.eps) +
      '  intensity=' + f(r.intensity) + '  |ΔE|=' + f(V.norm(r.dE), 6));
  }

  check('relevance = 0 ⇒ ΔE 归零', V.norm(run({ relevance: 0 }).dE) < 1e-12);
  check('congruence = 0 ⇒ ΔE 明显变小（不归零，因为 ε 与 α 仍在）',
    V.norm(run({ congruence: 0 }).dE) < V.norm(run({}).dE));
  check('importance = 0 ⇒ ΔE 归零', V.norm(run({ importance: 0 }).dE) < 1e-12);
  console.log('   ⭐ 注意 congruence=0 不归零 —— 因为 ε 里还有 (1−certainty) 那一项。');
  console.log('      文档里"任一为 0"要说准：是【进乘法主项的四个】为 0 才归零。');
}

// ═════════════════════════════════════════════════
console.log(hr('⑤ ⭐ ε 几乎不会精确为 0（文档需注明的观察）'));

{
  const mk = () => new Character({ name: 'e', sigma: 0.50, muPreset: 'dependent' });
  const run = (patch) => {
    const ev = JSON.parse(JSON.stringify(EV));
    Object.assign(ev.appraisal, patch);
    return mk().step(ev);
  };
  // 想让 ε = 0 需要 |valence − (expectancy−0.5)×2| = 0 且 certainty = 1
  // valence = congruence × relevance，要它恰等于 (expectancy−0.5)×2 很难凑
  const r = run({ certainty: 1, expectancy: 0.9 });
  console.log('   certainty=1, expectancy=0.9 ⇒ valence=' + f(r.valence) +
    '  expectedValence=' + f((0.9 - 0.5) * 2) + '  ε=' + f(r.eps));
  check('ε 非精确 0（因 valence ≠ expectedValence）', r.eps > 0);
  check('ε 很小（< 0.05）', r.eps < 0.05, '实测 ' + f(r.eps));

  const r2 = run({ certainty: 1, expectancy: 0.86, congruence: 0.8, relevance: 0.9 });
  console.log('   试着凑齐：valence=' + f(r2.valence) + '  expectedValence=' + f((0.86 - 0.5) * 2) + '  ε=' + f(r2.eps));
  console.log('   ⭐ 结论：ε = 0 需要 valence 与 expectedValence 精确相等，实际几乎取不到。');
  console.log('      所以"完全符合预期 ⇒ 不产生情绪"在数值上是【渐近】的，不是精确的。');
}

// ═════════════════════════════════════════════════
console.log(hr('⑥ 封顶：低于 r0 时应恒等'));

{
  const c = new Character({ name: 'c', sigma: 0.50, muPreset: 'dependent' });
  const r = c.step(JSON.parse(JSON.stringify(EV)));
  console.log('   r_raw=' + f(r.rRaw) + '  封顶后 r=' + f(r.r) + '  （σ=0.50 ⇒ r0=0.85）');
  check('r_raw < r0 ⇒ 封顶恒等', r.rRaw < 0.85 && near(r.r, r.rRaw));
}

// ═════════════════════════════════════════════════
console.log(hr('汇总'));
console.log(`  ✅ PASS ${PASS}   ❌ FAIL ${FAIL}`);
process.exit(FAIL === 0 ? 0 : 1);
