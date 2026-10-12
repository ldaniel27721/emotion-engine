// 回归测试：Codex 审计发现的稳定性缺陷是否已修
'use strict';
const { V, Space, cap } = require('../src/space');
const { Dynamics } = require('../src/dynamics');
const { Mu } = require('../src/mu');
const { Character } = require('../src/engine');

const hr = s => '\n' + '═'.repeat(86) + '\n' + s + '\n' + '═'.repeat(86);
const f = (x, d = 6) => Number(x).toFixed(d);
let PASS = 0, FAIL = 0;
const check = (name, ok, detail = '') => {
  console.log('  ' + (ok ? '✅ PASS' : '❌ FAIL') + '  ' + name + (detail ? '   ' + detail : ''));
  ok ? PASS++ : FAIL++;
};

// ═════════════════════════════════════════════════════
console.log(hr('① 封顶：低区必须恒等（f′(0) = 1），空闲必须收敛到 μ'));

for (const sigma of [0.40, 0.50]) {
  const k = 1 / sigma;
  console.log(`\n  ── σ=${sigma}  k=${k} ──`);

  // 低区斜率
  const h = 1e-6, slope = (cap(h, k) - cap(0, k)) / h;
  check(`f′(0) = 1（实测 ${f(slope, 6)}）`, Math.abs(slope - 1) < 1e-3);

  // 全域不放大
  let maxRatio = 0, atR = 0;
  for (let r = 0.001; r < 5; r += 0.001) {
    const ratio = cap(r, k) / r;
    if (ratio > maxRatio) { maxRatio = ratio; atR = r; }
  }
  check(`全域 f(r) ≤ r（最大比值 ${f(maxRatio, 4)} @ r=${f(atR, 3)}）`, maxRatio <= 1 + 1e-9);

  // 上确界
  check(`lim f = 1（f(100) = ${f(cap(100, k), 6)}）`, cap(100, k) < 1 && cap(100, k) > 0.99);

  // C¹ 连续
  const r0 = cap(1e-9, k) === 0 ? null : (2 * sigma);
  const R0 = Math.min(0.85, Math.max(0.30, 2 * sigma));
  const dl = (cap(R0 - 1e-7, k) - cap(R0 - 2e-7, k)) / 1e-7;
  const dr = (cap(R0 + 2e-7, k) - cap(R0 + 1e-7, k)) / 1e-7;
  check(`r0=${f(R0, 3)} 处 C¹ 连续（左导 ${f(dl, 4)} / 右导 ${f(dr, 4)}）`, Math.abs(dl - dr) < 1e-3);

  // ⭐ 空闲收敛到 μ
  console.log('    空闲 30 轮（应从任意起点收敛到 0）:');
  for (const r0i of [0.01, 0.05, 0.15, 0.30, 0.60]) {
    const c = new Character({ name: 'i', sigma, muPreset: 'neutral' });
    const u = V.unit([1, 0.5, -0.3]);
    c.E = V.add(c.mu.vector, V.mul(u, r0i));
    c.dynamics.syncTo(c.E);
    c.idle(30);
    const rEnd = V.norm(V.sub(c.E, c.mu.vector));
    check(`      r0=${f(r0i, 2)} → r30=${f(rEnd, 6)}`, rEnd < r0i);
  }
}

// ═════════════════════════════════════════════════════
console.log(hr('② Character.E 与 Dynamics.E 必须同步在 μ'));

for (const preset of ['neutral', 'dependent', 'anxious']) {
  const c = new Character({ name: 's', sigma: 0.45, muPreset: preset });
  const d = V.norm(V.sub(c.E, c.dynamics.E));
  const dm = V.norm(V.sub(c.E, c.mu.vector));
  check(`${preset}: ‖Char.E − Dyn.E‖ = ${f(d)} · ‖Char.E − μ‖ = ${f(dm)}`,
    d < 1e-9 && dm < 1e-9);
}

// ═════════════════════════════════════════════════════
console.log(hr('③ drift(rate=0) 必须幂等'));

{
  const m = new Mu({ dir: [0.8, 0.5, -0.3], precision: 3, rMu: 0.45, label: 'T' });
  const snap = () => m.dir.map(x => x.toFixed(9)).join(',') + '|' + m.rMu.toFixed(9) + '|' + V.fmt(m.vector, 9);

  const s0 = snap();
  m.drift([0.6, 0.2, -0.4], 0);
  const s1 = snap();
  m.drift([0.6, 0.2, -0.4], 0);
  const s2 = snap();
  m.drift([0.6, 0.2, -0.4], 0);
  const s3 = snap();

  check('rate=0 不改变 μ', s0 === s1 && s1 === s2 && s2 === s3);
  console.log('      s0 = ' + s0.slice(0, 70));

  // rate≠0 时应当改变，且只按累计量变
  m.drift([0.6, 0.2, -0.4], 0.04);
  const s4 = snap();
  check('rate≠0 时 μ 改变', s4 !== s0);

  // ⭐ 关键：再调 rate=0 不应继续变
  m.drift([0.6, 0.2, -0.4], 0);
  m.drift([0.6, 0.2, -0.4], 0);
  check('rate=0 在 rate≠0 之后仍幂等（无重复累计）', snap() === s4);

  // 累计漂移上限
  const m2 = new Mu({ dir: [1, 0, 0], precision: 3, rMu: 0.45, label: 'L' });
  for (let i = 0; i < 50; i++) m2.drift([0, 1, 0], 0.05);
  check(`漂移上限生效（|drift| = ${f(m2.driftMagnitude, 4)} ≤ 0.35）`, m2.driftMagnitude <= 0.35 + 1e-9);
}

// ═════════════════════════════════════════════════════
console.log(hr('④ 引擎端到端：三幕仍应得到原结论'));

{
  const c = new Character({
    name: '傲娇大肥鱼', sigma: 0.50, muPreset: 'dependent',
    subtype: ['Tsundere', 'Tsun-Ama', 'Tsuntere'], gainPos: 1.0, gainNeg: 1.3,
  });
  const acts = [
    ['第一幕', { eventKey: '被替代', context: { triggers: ['alone'] }, appraisal: { relevance: 0.95, congruence: -0.85, importance: 0.85, agency: 'other', coping: 0.25, certainty: 0.80, expectancy: 0.85, intentionality: 0.30, currentArousal: 0.30 } }],
    ['第二幕', { eventKey: '被安抚', context: { triggers: ['alone'], strategyScale: 0.35 }, appraisal: { relevance: 0.80, congruence: 0.70, importance: 0.60, agency: 'other', coping: 0.80, certainty: 0.70, expectancy: 0.40, intentionality: 1.0, currentArousal: 0.60 } }],
    ['第三幕', { eventKey: '被戳中', context: { triggers: ['calledOut'] }, appraisal: { relevance: 0.95, congruence: 0.80, importance: 0.85, agency: 'other', coping: 0.40, certainty: 0.90, expectancy: 0.30, intentionality: 1.0, currentArousal: 0.55 } }],
  ];
  for (const [n, ev] of acts) {
    const r = c.step(ev);
    console.log(`  ${n}: dir=${r.direction} oct=${r.octant} r=${f(r.r, 4)} ΔE=${V.fmt(r.dE, 3)}`);
  }
  const r3 = c.history[2];
  check('第三幕仍是 Caring → Dependent', r3.direction === 'Caring' && r3.octant === 'Dependent');
  check('第三幕 ΔE 的 D 仍为负（软弱退化）', r3.dE[2] < 0);
  check('第三幕 s = 1（完全泄露）', Math.abs(r3.s - 1) < 1e-9);
}

// ═════════════════════════════════════════════════════
console.log(hr('汇总'));
console.log(`  ✅ PASS ${PASS}   ❌ FAIL ${FAIL}`);
process.exit(FAIL === 0 ? 0 : 1);
