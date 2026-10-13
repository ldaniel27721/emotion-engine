// 多事件混合模拟：模型会不会"记住"多次事件？各事件如何让整体情绪漂移？
//
// 关键：A2 是【线性】AR(1) + 脉冲
//   E_t = μ + ρ(E_{t−1} − μ) + ΔE_t
//   ⇒ 展开：E_t − μ = Σ_{i≤t} ρ^(t−i) · ΔE_i
//   ⇒ ⭐ 超定原理成立 ⇒ 可以用解析式预测每一步
'use strict';
const V = require('../src/space').V;
const { Character } = require('../src/engine');

const hr = s => '\n' + '═'.repeat(92) + '\n' + s + '\n' + '═'.repeat(92);
const f = (x, d = 4) => Number(x).toFixed(d);
const fmt = (a, d = 3) => V.fmt(a, d);

// ═══════════════════════════════════════════════════════════════
// 事件定义：每个事件给一个 appraisal
// ═══════════════════════════════════════════════════════════════
const EV = {
  夸奖: {
    eventKey: '被夸奖',
    appraisal: { relevance: 0.9, congruence: 0.8, importance: 0.6, agency: 'other', coping: 0.8, certainty: 0.7, expectancy: 0.4, intentionality: 1.0, currentArousal: 0.3 },
  },
  忽视: {
    eventKey: '被忽视',
    appraisal: { relevance: 0.9, congruence: -0.8, importance: 0.7, agency: 'other', coping: 0.3, certainty: 0.7, expectancy: 0.8, intentionality: 0.3, currentArousal: 0.4 },
  },
  戳中: {
    eventKey: '被戳中',
    appraisal: { relevance: 0.95, congruence: 0.8, importance: 0.85, agency: 'other', coping: 0.4, certainty: 0.9, expectancy: 0.3, intentionality: 1.0, currentArousal: 0.55 },
  },
  责备: {
    eventKey: '被责备',
    appraisal: { relevance: 0.9, congruence: -0.9, importance: 0.8, agency: 'other', coping: 0.5, certainty: 0.9, expectancy: 0.7, intentionality: 1.0, currentArousal: 0.5 },
  },
};

const mkChar = (opts = {}) => new Character(Object.assign({
  name: '傲娇大肥鱼', sigma: 0.50, muPreset: 'dependent',
  subtype: ['Tsundere'], gainPos: 1.0, gainNeg: 1.0,
}, opts));

// ═══════════════════════════════════════════════════════════════
console.log(hr('0. 先确认：ρ 是"单调下降"吗'));

{
  const c = mkChar();
  console.log('  默认 ρ = ' + c.dynamics.rho + '   半衰期 = ' + f(c.dynamics.halfLife, 2) + ' 轮');
  console.log('  ⚠️ 22.8 轮是 ρ=0.97 那档的，不是 0.927：');
  console.log('     ρ      ' + [0.90, 0.927, 0.95, 0.97].map(x => x.toFixed(3).padStart(8)).join(''));
  console.log('     半衰期 ' + [0.90, 0.927, 0.95, 0.97].map(x => (Math.log(0.5) / Math.log(x)).toFixed(1).padStart(8)).join(''));

  // 无事件时逐轮看 r
  c.E = V.add(c.mu.vector, V.mul(V.unit([1, 0.5, -0.3]), 0.6));
  c.dynamics.syncTo(c.E);
  const rs = [V.norm(V.sub(c.E, c.mu.vector))];
  for (let i = 0; i < 20; i++) rs.push(V.norm(V.sub(c.idle(1), c.mu.vector)));
  console.log('\n  无事件 20 轮：r = ' + rs.slice(0, 11).map(x => f(x, 3)).join(' → '));
  let mono = true;
  for (let i = 1; i < rs.length; i++) if (rs[i] > rs[i - 1] + 1e-12) mono = false;
  console.log('  ⇒ ' + (mono ? '✅ 严格单调下降（默认单标量 ρ + 无事件）' : '❌ 非单调'));
  console.log('  ⚠️ 但【有事件时】不是 —— 事件会把它推上去。见下。');
}

// ═══════════════════════════════════════════════════════════════
console.log(hr('1. 多事件混合：一条 20 轮的对话'));

const SEQ = [
  [1, '夸奖'], [2, null], [3, '忽视'], [4, null], [5, null], [6, '戳中'],
  [7, null], [8, '责备'], [9, null], [10, null], [11, '夸奖'], [12, null],
  [13, null], [14, '忽视'], [15, null], [16, null], [17, null], [18, '戳中'],
  [19, null], [20, null],
];

{
  const c = mkChar();
  console.log('  ' + '轮'.padEnd(4) + '事件'.padEnd(9) + '方向/八型'.padEnd(22) + 'r（强度）'.padEnd(12) + 'E 的 P/A/D');
  console.log('  ' + '-'.repeat(88));
  for (const [t, name] of SEQ) {
    if (name) {
      const r = c.step(JSON.parse(JSON.stringify(EV[name])));
      console.log('  ' + String(t).padEnd(4) + name.padEnd(11) +
        (r.direction + '→' + r.octant).padEnd(24) + f(r.r, 4).padEnd(12) + fmt(c.E));
    } else {
      c.idle(1);
      console.log('  ' + String(t).padEnd(4) + '—'.padEnd(11) + ''.padEnd(24) + f(V.norm(V.sub(c.E, c.mu.vector)), 4).padEnd(12) + fmt(c.E));
    }
  }
}

// ═══════════════════════════════════════════════════════════════
console.log(hr('2. ⭐ 核心问题：模型"记住"了这些事件吗'));

{
  const c = mkChar();
  const dEs = [];   // 每轮事件的 ΔE（无事件则为 0）
  for (const [t, name] of SEQ) {
    if (name) {
      const r = c.step(JSON.parse(JSON.stringify(EV[name])));
      dEs.push(r.dE.slice());
    } else {
      c.idle(1);
      dEs.push([0, 0, 0]);
    }
  }

  // 解析预测：E_T − μ = Σ ρ^(T−i) · ΔE_i
  const rho = c.dynamics.rho;
  const T = SEQ.length;
  let pred = [0, 0, 0];
  for (let i = 0; i < T; i++) {
    const w = Math.pow(rho, T - 1 - i);
    pred = V.add(pred, V.mul(dEs[i], w));
  }
  const actual = V.sub(c.E, c.mu.vector);
  console.log('  解析预测 E−μ = Σ ρ^(age)·ΔE_i ：' + fmt(pred, 5));
  console.log('  仿真实际 E−μ                  ：' + fmt(actual, 5));
  console.log('  差 = ' + f(V.norm(V.sub(pred, actual)), 9) + '   ' +
    (V.norm(V.sub(pred, actual)) < 1e-9 ? '✅ 完全吻合（线性叠加成立）' : '⚠️ 不吻合'));
  console.log('');
  console.log('  ⭐ 所以"记住"的真相是：');
  console.log('     · E 里【确实】保留了每一个历史事件的痕迹 —— 按 ρ^age 加权');
  console.log('     · 但这个权重【指数衰减】：9.14 轮后只剩一半');
  console.log('     · 20 轮后，第 1 个事件的权重 = ρ^19 = ' + f(Math.pow(rho, 19), 6));

  // 逐事件的贡献分解
  console.log('\n  各事件在第 20 轮时的【残余贡献】：');
  console.log('  ' + '事件'.padEnd(9) + '发生时轮'.padEnd(12) + '年龄'.padEnd(8) + '权重 ρ^age'.padEnd(14) + '贡献向量');
  console.log('  ' + '-'.repeat(74));
  let idx = 0;
  const rows = [];
  for (let i = 0; i < T; i++) {
    if (!SEQ[i][1]) continue;
    const age = T - 1 - i;
    const w = Math.pow(rho, age);
    const contrib = V.mul(dEs[i], w);
    rows.push({ name: SEQ[i][1], t: SEQ[i][0], age, w, contrib, mag: V.norm(contrib) });
  }
  for (const r of rows) {
    console.log('  ' + r.name.padEnd(11) + String(r.t).padEnd(12) + String(r.age).padEnd(8) + f(r.w, 5).padEnd(14) + fmt(r.contrib, 4) + '  |' + f(r.mag, 5) + '|');
  }
  const totalContrib = rows.reduce((s, r) => V.add(s, r.contrib), [0, 0, 0]);
  console.log('  ' + '-'.repeat(74));
  console.log('  合计贡献 = ' + fmt(totalContrib, 5) + '   |' + f(V.norm(totalContrib), 5) + '|');
  console.log('  ⭐ 早期事件虽在，但权重被压得很小 —— 最近的事件主导当下。');
}

// ═══════════════════════════════════════════════════════════════
console.log(hr('3. 各事件如何让"整体情绪"漂移：同向加强 vs 反向抵消'));

{
  const runs = [
    ['三次夸奖（同向）', ['夸奖', null, '夸奖', null, null, '夸奖']],
    ['三次责备（同向）', ['责备', null, '责备', null, null, '责备']],
    ['夸奖·责备·夸奖（对冲）', ['夸奖', null, '责备', null, null, '夸奖']],
    ['夸奖·忽视·戳中（混合）', ['夸奖', null, '忽视', null, null, '戳中']],
  ];
  for (const [name, seq] of runs) {
    const c = mkChar();
    let last = null;
    for (const e of seq) {
      last = e ? c.step(JSON.parse(JSON.stringify(EV[e]))) : (c.idle(1), null);
    }
    const dev = V.sub(c.E, c.mu.vector);
    console.log('  ' + name.padEnd(24) + 'r=' + f(V.norm(dev), 4).padEnd(9) + ' E−μ=' + fmt(dev, 4));
  }
  console.log('');
  console.log('  ⭐ 读法：同向事件【叠加】（r 更大），反向事件【抵消】（r 更小）——');
  console.log('     这是线性系统的必然（超定原理）。');
}

// ═══════════════════════════════════════════════════════════════
console.log(hr('4. ⚠️ 关键缺口：μ 会不会因为这些事件而漂移'));

{
  const c = mkChar();
  const mu0 = c.mu.vector.slice();
  for (const [t, name] of SEQ) {
    if (name) c.step(JSON.parse(JSON.stringify(EV[name])));
    else c.idle(1);
  }
  const mu1 = c.mu.vector.slice();
  console.log('  20 轮、7 个事件之后：');
  console.log('    μ 起始 = ' + fmt(mu0, 5));
  console.log('    μ 现在 = ' + fmt(mu1, 5));
  console.log('    变化量 = ' + f(V.norm(V.sub(mu1, mu0)), 9));
  console.log('  ' + (V.norm(V.sub(mu1, mu0)) < 1e-12
    ? '  ⚠️ μ 【完全没动】—— 因为它只在显式调用 drift() 时才变'
    : '  μ 动了'));
  console.log('');
  console.log('  ⭐⭐ 所以"模型会不会记住多次事件"要分两层回答：');
  console.log('     ┌ E 层（快变量）：会留下痕迹，但按 ρ^age 指数消失 ⇒ 半衰期 9.14 轮');
  console.log('     └ μ 层（慢变量）：【不会自动记住】—— 必须显式调 drift()');
  console.log('  ⇒ ⚠️ 现状是：【短期会记住，长期会遗忘】。');
  console.log('     真正的"长期记忆"要靠 μ 漂移接上（这是 issue #43 的范围）。');
}

// ═══════════════════════════════════════════════════════════════
console.log(hr('5. 如果接上 μ 漂移：各事件把底情绪推去哪'));

{
  const c = mkChar();
  const mu0 = c.mu.vector.slice();
  const DRIFT = require('../src/mu').DRIFT_RATE_CALIBRATED;
  console.log('  用标定值 rate = ' + DRIFT + '（60 天看不出漂移那档）');
  console.log('  ' + '轮'.padEnd(5) + '事件'.padEnd(9) + 'ΔE'.padEnd(30) + '调用 drift 后 μ 位移');
  console.log('  ' + '-'.repeat(70));
  let dev = [0, 0, 0];
  for (const [t, name] of SEQ) {
    if (name) {
      const r = c.step(JSON.parse(JSON.stringify(EV[name])));
      // 用 ΔE 当漂移方向（记忆被写厚的代理）
      c.mu.drift(r.dE, DRIFT * 1000);   // ⚠️ 放大 1000 倍便于观察（真实值太慢）
      const d = V.norm(V.sub(c.mu.vector, mu0));
      console.log('  ' + String(t).padEnd(5) + name.padEnd(11) + fmt(r.dE, 4).padEnd(32) + f(d, 6));
    }
  }
  console.log('');
  console.log('  ⚠️ 注意：为便于观察把 rate 放大了 1000 倍；真实标定值下 20 轮几乎不动。');
  console.log('  ⭐ 方向：μ 被推往各事件 ΔE 的【累计向量和】—— 这个和就是"这段时间的总体心情"。');
}
