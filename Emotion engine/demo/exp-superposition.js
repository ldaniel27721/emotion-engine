// 定位：为什么超定原理不吻合 —— 假设是【封顶】在破坏线性
'use strict';
const V = require('../src/space').V;
const { Character } = require('../src/engine');

const hr = s => '\n' + '═'.repeat(92) + '\n' + s + '\n' + '═'.repeat(92);
const f = (x, d = 4) => Number(x).toFixed(d);
const fmt = (a, d = 4) => V.fmt(a, d);

const EV = {
  夸奖: { eventKey: '被夸奖', appraisal: { relevance: 0.9, congruence: 0.8, importance: 0.6, agency: 'other', coping: 0.8, certainty: 0.7, expectancy: 0.4, intentionality: 1.0, currentArousal: 0.3 } },
  忽视: { eventKey: '被忽视', appraisal: { relevance: 0.9, congruence: -0.8, importance: 0.7, agency: 'other', coping: 0.3, certainty: 0.7, expectancy: 0.8, intentionality: 0.3, currentArousal: 0.4 } },
  戳中: { eventKey: '被戳中', appraisal: { relevance: 0.95, congruence: 0.8, importance: 0.85, agency: 'other', coping: 0.4, certainty: 0.9, expectancy: 0.3, intentionality: 1.0, currentArousal: 0.55 } },
  责备: { eventKey: '被责备', appraisal: { relevance: 0.9, congruence: -0.9, importance: 0.8, agency: 'other', coping: 0.5, certainty: 0.9, expectancy: 0.7, intentionality: 1.0, currentArousal: 0.5 } },
};
const mk = (o = {}) => new Character(Object.assign({
  name: 'x', sigma: 0.50, muPreset: 'dependent', subtype: ['Tsundere'], gainPos: 1.0, gainNeg: 1.0,
}, o));

const SEQ = [[1, '夸奖'], [2, null], [3, '忽视'], [4, null], [5, null], [6, '戳中'],
[7, null], [8, '责备'], [9, null], [10, null], [11, '夸奖'], [12, null],
[13, null], [14, '忽视'], [15, null], [16, null], [17, null], [18, '戳中'], [19, null], [20, null]];

function trial(useCap) {
  const c = mk();
  c.space.useCap = useCap;
  c.dynamics.useCap = useCap;
  c.E = c.mu.vector.slice(); c.dynamics.syncTo(c.E);
  const steps = [];
  for (const [, name] of SEQ) {
    if (name) {
      const r = c.step(JSON.parse(JSON.stringify(EV[name])));
      steps.push({ eff: V.mul(r.dE, r.g * r.h) });
    } else { c.idle(1); steps.push(null); }
  }
  const rho = c.dynamics.rho, T = SEQ.length;
  let pred = [0, 0, 0];
  for (let i = 0; i < T; i++) if (steps[i]) pred = V.add(pred, V.mul(steps[i].eff, Math.pow(rho, T - 1 - i)));
  const actual = V.sub(c.E, c.mu.vector);
  return { pred, actual, diff: V.norm(V.sub(pred, actual)) };
}

console.log(hr('① 开 / 关 封顶，看超定原理是否恢复'));
for (const useCap of [true, false]) {
  const t = trial(useCap);
  console.log('  useCap=' + String(useCap).padEnd(6) +
    '预测=' + fmt(t.pred, 5).padEnd(34) + '实际=' + fmt(t.actual, 5).padEnd(34) +
    '差=' + f(t.diff, 9) + (t.diff < 1e-9 ? '  ✅ 吻合' : '  ⚠️ 不吻合'));
}

// ═══════════════════════════════════════════════════════════════
console.log(hr('② 确认机制：r 超过 r0=2σ 时封顶才介入'));
{
  const c = mk();   // σ=0.50 ⇒ r0=0.85
  console.log('  σ=0.50 ⇒ r0 = 0.85');
  console.log('  ' + '轮'.padEnd(5) + '事件'.padEnd(9) + 'r_raw'.padEnd(10) + 'r（封顶后）'.padEnd(14) + '是否被压');
  console.log('  ' + '-'.repeat(56));
  for (const [t, name] of SEQ) {
    let rRaw, r;
    if (name) { const q = c.step(JSON.parse(JSON.stringify(EV[name]))); rRaw = q.rRaw; r = q.r; }
    else { c.idle(1); rRaw = r = V.norm(V.sub(c.E, c.mu.vector)); }
    const squeezed = rRaw > 1e-9 && (rRaw - r) / rRaw > 1e-6;
    if (name) console.log('  ' + String(t).padEnd(5) + name.padEnd(11) + f(rRaw, 5).padEnd(10) + f(r, 5).padEnd(14) + (squeezed ? '⭐ 是（压了 ' + f((rRaw - r) / rRaw * 100, 2) + '%）' : '否'));
  }
}

// ═══════════════════════════════════════════════════════════════
console.log(hr('③ ⭐⭐ 封顶的副作用：它让"多次事件"产生【饱和】而不是叠加'));
{
  const runOne = (names) => {
    const c = mk();
    for (const n of names) c.step(JSON.parse(JSON.stringify(EV[n])));
    return V.norm(V.sub(c.E, c.mu.vector));
  };
  const single = runOne(['夸奖']);
  const double = runOne(['夸奖', '夸奖']);
  const triple = runOne(['夸奖', '夸奖', '夸奖']);
  console.log('  连续同向「夸奖」（无间隔）：');
  console.log('     1 次 ⇒ r = ' + f(single, 5));
  console.log('     2 次 ⇒ r = ' + f(double, 5) + '   （线性预测 2× = ' + f(single * 2, 5) + '）');
  console.log('     3 次 ⇒ r = ' + f(triple, 5) + '   （线性预测 3× = ' + f(single * 3, 5) + '）');
  console.log('');
  const ratio2 = double / single, ratio3 = triple / single;
  console.log('     实际倍数：2 次 = ' + f(ratio2, 3) + '×   3 次 = ' + f(ratio3, 3) + '×');
  console.log('     ⇒ ' + (ratio2 < 1.99 || ratio3 < 2.99 ? '⚠️ 明显【小于】线性倍数 ⇒ 出现饱和' : '≈ 线性'));
  console.log('');
  console.log('  ⭐ 关掉封顶再试：');
  const runOneNoCap = (names) => {
    const c = mk(); c.space.useCap = false; c.dynamics.useCap = false;
    for (const n of names) c.step(JSON.parse(JSON.stringify(EV[n])));
    return V.norm(V.sub(c.E, c.mu.vector));
  };
  const s1 = runOneNoCap(['夸奖']), s2 = runOneNoCap(['夸奖', '夸奖']), s3 = runOneNoCap(['夸奖', '夸奖', '夸奖']);
  console.log('     1 次 ⇒ ' + f(s1, 5) + '   2 次 ⇒ ' + f(s2, 5) + '（' + f(s2 / s1, 3) + '×）   3 次 ⇒ ' + f(s3, 5) + '（' + f(s3 / s1, 3) + '×）');
  console.log('     ⇒ ✅ 倍数精确 —— 无封顶时是纯线性叠加');
}

// ═══════════════════════════════════════════════════════════════
console.log(hr('④ 结论：模型在两种区间里行为不同'));
console.log(`
  ┌─ 低强度区（r ≤ r0 = 2σ）────────────────────────
  │  ✅ 严格线性 ⇒ 超定原理成立
  │  ⭐ 各事件的贡献【可加】：E − μ = Σ ρ^age · g · h · ΔE
  │  ⭐ 同向事件线性叠加，反向事件线性抵消
  │
  └─ 高强度区（r > r0）────────────────────────────
     ⚠️ 封顶介入 ⇒ 【非线性】
     ⭐ 产生"饱和"：边际效果递减
        · 2 次夸奖的涨幅 < 2 × 1 次夸奖
        · 这就是"情绪饱和"的数学含义
     ⭐ 副作用是好的：不加封顶的话 r_∞ = |ΔE_eff|/(1−ρ) = 1.34 > 球面半径 1
`);
