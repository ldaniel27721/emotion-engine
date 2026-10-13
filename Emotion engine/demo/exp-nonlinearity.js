// 把【两处非线性】分开：h(n) 习惯化 vs 封顶
'use strict';
const V = require('../src/space').V;
const { Character } = require('../src/engine');

const hr = s => '\n' + '═'.repeat(96) + '\n' + s + '\n' + '═'.repeat(96);
const f = (x, d = 5) => Number(x).toFixed(d);

const EVQ = { eventKey: '被夸奖', appraisal: { relevance: 0.9, congruence: 0.8, importance: 0.6, agency: 'other', coping: 0.8, certainty: 0.7, expectancy: 0.4, intentionality: 1.0, currentArousal: 0.3 } };

// 三种配置
function run({ cap, habit, n, keyStrategy = 'same' }) {
  const c = new Character({
    name: 'x', sigma: 0.50, muPreset: 'dependent',
    subtype: ['Tsundere'], gainPos: 1.0, gainNeg: 1.0,
    alpha: habit ? 0.95 : 1.0,          // ⭐ α=1 ⇒ 无习惯化
  });
  c.space.useCap = cap; c.dynamics.useCap = cap;
  for (let i = 0; i < n; i++) {
    const ev = JSON.parse(JSON.stringify(EVQ));
    // keyStrategy='new' ⇒ 每次都换 eventKey（绕开习惯化）
    if (keyStrategy === 'new') ev.eventKey = '被夸奖_' + i;
    c.step(ev);
  }
  return V.norm(V.sub(c.E, c.mu.vector));
}

console.log(hr('① 三处效果分离：连续 N 次同向「夸奖」'));
console.log('  ' + '配置'.padEnd(30) + ['1 次', '2 次', '3 次', '4 次'].map(x => x.padStart(10)).join(''));
console.log('  ' + '-'.repeat(76));

const configs = [
  ['现状（封顶 + 习惯化）', { cap: true, habit: true, keyStrategy: 'same' }],
  ['关封顶（只留习惯化）', { cap: false, habit: true, keyStrategy: 'same' }],
  ['关习惯化（只留封顶）', { cap: true, habit: false, keyStrategy: 'same' }],
  ['两个都关（纯线性）', { cap: false, habit: false, keyStrategy: 'same' }],
  ['都关 + 换 eventKey', { cap: false, habit: false, keyStrategy: 'new' }],
];
const results = {};
for (const [label, cfg] of configs) {
  const rs = [1, 2, 3, 4].map(n => run(Object.assign({ n }, cfg)));
  results[label] = rs;
  console.log('  ' + label.padEnd(30) + rs.map(x => f(x).padStart(10)).join(''));
}

console.log('\n  ⭐ 看倍数（相对 1 次）：');
console.log('  ' + '配置'.padEnd(30) + ['1×', '2×', '3×', '4×'].map(x => x.padStart(10)).join(''));
console.log('  ' + '-'.repeat(76));
for (const [label, rs] of Object.entries(results)) {
  console.log('  ' + label.padEnd(30) + rs.map(x => f(x / rs[0], 3).padStart(10)).join(''));
}
console.log('');
console.log('  ⭐ 读法：');
console.log('     · 「两个都关」应给出 1.000 / 2.000 / 3.000 / 4.000（纯线性）');
console.log('     · 「关封顶」的倍数 < 线性 ⇒ 差额来自 h(n)');
console.log('     · 「关习惯化」的倍数 < 线性 ⇒ 差额来自封顶');

// ═══════════════════════════════════════════════════════════════
console.log(hr('② 各非线性的单独贡献量'));
{
  const pure = results['两个都关（纯线性）'];
  const nocc = results['关封顶（只留习惯化）'];
  const nohd = results['关习惯化（只留封顶）'];
  const both = results['现状（封顶 + 习惯化）'];
  console.log('  ' + '次数'.padEnd(6) + '纯线性'.padEnd(11) + '只习惯化'.padEnd(11) + '只封顶'.padEnd(11) + '两者都有'.padEnd(11) + '总损失');
  console.log('  ' + '-'.repeat(64));
  for (let i = 0; i < 4; i++) {
    const loss = (1 - both[i] / pure[i]) * 100;
    console.log('  ' + String(i + 1).padEnd(6) + f(pure[i]).padEnd(11) + f(nocc[i]).padEnd(11) +
      f(nohd[i]).padEnd(11) + f(both[i]).padEnd(11) + f(loss, 1) + '%');
  }
  console.log('');
  console.log('  ⭐ 4 次同向事件：非线性把总强度压掉了 ' + f((1 - both[3] / pure[3]) * 100, 1) + '%');
}

// ═══════════════════════════════════════════════════════════════
console.log(hr('③ 习惯化单独看：同类事件第 n 次的实际冲击'));
{
  const c = new Character({ name: 'x', sigma: 0.50, muPreset: 'dependent', alpha: 0.95 });
  console.log('  ' + '第 n 次'.padEnd(9) + 'h(n)'.padEnd(12) + '相对第 1 次');
  console.log('  ' + '-'.repeat(34));
  for (let n = 1; n <= 10; n++) {
    const h = Math.pow(0.95, n - 1);
    console.log('  ' + String(n).padEnd(9) + f(h, 5).padEnd(12) + f(h * 100, 1) + '%');
  }
  console.log('');
  console.log('  ⭐ 第 10 次只剩 ' + f(Math.pow(0.95, 9) * 100, 1) + '% —— 但【永不为 0】，' +
    '所以"无限重复"仍有累计效果（见 ④）。');
}

// ═══════════════════════════════════════════════════════════════
console.log(hr('④ 长期重复同一事件：r 会收敛到哪里'));
{
  const c = new Character({ name: 'x', sigma: 0.50, muPreset: 'dependent', alpha: 0.95 });
  const rs = [];
  for (let t = 1; t <= 200; t++) {
    const r = c.step(JSON.parse(JSON.stringify(EVQ)));
    if (t % 20 === 0) rs.push([t, r.r, r.h]);
  }
  console.log('  ' + '轮'.padEnd(7) + 'r'.padEnd(12) + 'h(n)');
  console.log('  ' + '-'.repeat(30));
  for (const [t, r, h] of rs) console.log('  ' + String(t).padEnd(7) + f(r).padEnd(12) + f(h, 6));
  console.log('');
  console.log('  ⭐ 结论：h(n) 让冲击趋近 0，所以【有习惯化时】r 会稳定在一个有限值；');
  console.log('     而如果 α=1（无习惯化），r_∞ = |ΔE_eff|/(1−ρ) = 1.34 ⇒ 必须靠封顶压住。');
  console.log('  ⇒ ⭐⭐ 两处非线性【互相补位】：习惯化管"同类事件多久钝"，封顶管"任何来源的总强度上限"。');
}

// ═══════════════════════════════════════════════════════════════
console.log(hr('⑤ 反向：正向事件与负向事件会不会互相抵消'));
{
  const EVA = { eventKey: '被夸奖', appraisal: { relevance: 0.9, congruence: 0.8, importance: 0.6, agency: 'other', coping: 0.8, certainty: 0.7, expectancy: 0.4, intentionality: 1.0, currentArousal: 0.3 } };
  const EVB = { eventKey: '被责备', appraisal: { relevance: 0.9, congruence: -0.9, importance: 0.8, agency: 'other', coping: 0.5, certainty: 0.9, expectancy: 0.7, intentionality: 1.0, currentArousal: 0.5 } };
  const trial = (seq) => {
    const c = new Character({ name: 'x', sigma: 0.50, muPreset: 'dependent', alpha: 1.0 });
    c.space.useCap = false; c.dynamics.useCap = false;   // 关封顶看纯叠加
    for (const e of seq) c.step(JSON.parse(JSON.stringify(e === 'A' ? EVA : EVB)));
    return V.sub(c.E, c.mu.vector);
  };
  const fmt = a => V.fmt(a, 4);
  const onlyA = trial(['A']);
  const onlyB = trial(['B']);
  const AB = trial(['A', 'B']);
  const BA = trial(['B', 'A']);
  console.log('  只夸奖     E−μ = ' + fmt(onlyA));
  console.log('  只责备     E−μ = ' + fmt(onlyB));
  console.log('  夸奖→责备  E−μ = ' + fmt(AB));
  console.log('  责备→夸奖  E−μ = ' + fmt(BA));
  console.log('');
  const sum = require('../src/space').V.add(onlyA, onlyB);
  console.log('  两者之和   E−μ = ' + fmt(sum) + '   （⚠️ 与上面两行不同，因为 ρ 衰减在起作用）');
  console.log('');
  console.log('  ⭐ 顺序有影响（因 ρ 让先发生的那件衰减更多）——');
  console.log('     「夸奖→责备」与「责备→夸奖」结果不同 ⇒ 情绪有【时序记忆】。');
}
