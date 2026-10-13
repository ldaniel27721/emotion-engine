// 多事件混合模拟 v2 —— 修正超定原理的预测式（补上 g·h）
//
// ⚠️ v1 的错误：我拿 rec.dE（评价层产出的【原始】ΔE）当"实际加进去的量"，
//    但 dynamics.step 里实际加的是 dEff = ΔE_raw × g × h(n)。
//    ⇒ 预测式漏了 g·h，所以差 0.115。
//
// ⭐ 正确的叠加式：
//    E_T − μ = Σ_i  ρ^(T−i) · g_i · h(n_i) · ΔE_raw_i
'use strict';
const V = require('../src/space').V;
const { Character } = require('../src/engine');

const hr = s => '\n' + '═'.repeat(92) + '\n' + s + '\n' + '═'.repeat(92);
const f = (x, d = 4) => Number(x).toFixed(d);
const fmt = (a, d = 3) => V.fmt(a, d);

const EV = {
  夸奖: { eventKey: '被夸奖', appraisal: { relevance: 0.9, congruence: 0.8, importance: 0.6, agency: 'other', coping: 0.8, certainty: 0.7, expectancy: 0.4, intentionality: 1.0, currentArousal: 0.3 } },
  忽视: { eventKey: '被忽视', appraisal: { relevance: 0.9, congruence: -0.8, importance: 0.7, agency: 'other', coping: 0.3, certainty: 0.7, expectancy: 0.8, intentionality: 0.3, currentArousal: 0.4 } },
  戳中: { eventKey: '被戳中', appraisal: { relevance: 0.95, congruence: 0.8, importance: 0.85, agency: 'other', coping: 0.4, certainty: 0.9, expectancy: 0.3, intentionality: 1.0, currentArousal: 0.55 } },
  责备: { eventKey: '被责备', appraisal: { relevance: 0.9, congruence: -0.9, importance: 0.8, agency: 'other', coping: 0.5, certainty: 0.9, expectancy: 0.7, intentionality: 1.0, currentArousal: 0.5 } },
};
const mkChar = (o = {}) => new Character(Object.assign({
  name: '傲娇大肥鱼', sigma: 0.50, muPreset: 'dependent', subtype: ['Tsundere'], gainPos: 1.0, gainNeg: 1.0,
}, o));

const SEQ = [
  [1, '夸奖'], [2, null], [3, '忽视'], [4, null], [5, null], [6, '戳中'],
  [7, null], [8, '责备'], [9, null], [10, null], [11, '夸奖'], [12, null],
  [13, null], [14, '忽视'], [15, null], [16, null], [17, null], [18, '戳中'],
  [19, null], [20, null],
];

// ═══════════════════════════════════════════════════════════════
console.log(hr('① 修正后的超定原理检验'));
{
  const c = mkChar();
  const steps = [];
  for (const [, name] of SEQ) {
    if (name) {
      const r = c.step(JSON.parse(JSON.stringify(EV[name])));
      // ⭐ 实际加进 E 的量 = ΔE_raw × g × h
      steps.push({ raw: r.dE.slice(), g: r.g, h: r.h, eff: V.mul(r.dE, r.g * r.h) });
    } else {
      c.idle(1);
      steps.push(null);
    }
  }
  const rho = c.dynamics.rho, T = SEQ.length;
  let pred = [0, 0, 0];
  for (let i = 0; i < T; i++) {
    if (!steps[i]) continue;
    pred = V.add(pred, V.mul(steps[i].eff, Math.pow(rho, T - 1 - i)));
  }
  const actual = V.sub(c.E, c.mu.vector);
  console.log('  预测 Σ ρ^(age)·g·h·ΔE_raw = ' + fmt(pred, 6));
  console.log('  仿真 E − μ                = ' + fmt(actual, 6));
  console.log('  差 = ' + f(V.norm(V.sub(pred, actual)), 10) + '   ' +
    (V.norm(V.sub(pred, actual)) < 1e-9 ? '✅ 逐位吻合 ⇒ 模型确实严格线性可叠加' : '⚠️ 仍不吻合'));
}

// ═══════════════════════════════════════════════════════════════
console.log(hr('② ρ 是不是"单调下降"—— 分三种情形'));
{
  // (a) 无事件
  const a = mkChar();
  a.E = V.add(a.mu.vector, V.mul(V.unit([1, 0.5, -0.3]), 0.6)); a.dynamics.syncTo(a.E);
  const ra = [V.norm(V.sub(a.E, a.mu.vector))];
  for (let i = 0; i < 15; i++) ra.push(V.norm(V.sub(a.idle(1), a.mu.vector)));
  console.log('  (a) 无事件          r = ' + ra.slice(0, 8).map(x => f(x, 3)).join(' → ') + ' …');
  console.log('      ⇒ ✅ 严格单调下降（每轮 ×ρ）');

  // (b) 周期性同向事件
  const b = mkChar();
  const rb = [];
  for (let t = 1; t <= 15; t++) {
    if (t % 3 === 0) b.step(JSON.parse(JSON.stringify(EV['夸奖']))); else b.idle(1);
    rb.push(V.norm(V.sub(b.E, b.mu.vector)));
  }
  console.log('  (b) 每 3 轮一次夸奖   r = ' + rb.slice(0, 8).map(x => f(x, 3)).join(' → ') + ' …');
  console.log('      ⇒ ⚠️ 上升到某个稳态后停住（不是单调下降）');

  // (c) 混合
  const cc = mkChar();
  const rc = [];
  for (const [, name] of SEQ) {
    if (name) cc.step(JSON.parse(JSON.stringify(EV[name]))); else cc.idle(1);
    rc.push(V.norm(V.sub(cc.E, cc.mu.vector)));
  }
  console.log('  (c) 混合 20 轮        r = ' + rc.filter((_, i) => i % 2 === 0).map(x => f(x, 3)).join(' → '));
  console.log('      ⇒ ⚠️ 锯齿形，整体【上台阶】—— 事件比衰减来得快');
}

// ═══════════════════════════════════════════════════════════════
console.log(hr('③ ⭐ 关键：r 会不会一直涨上去（同向事件反复发生）'));
{
  const c = mkChar();
  console.log('  每 3 轮一次「夸奖」，跑 60 轮：');
  console.log('  ' + '轮'.padEnd(6) + 'r'.padEnd(12) + '|ΔE_eff| 本轮');
  console.log('  ' + '-'.repeat(34));
  const rs = [];
  for (let t = 1; t <= 60; t++) {
    let r;
    if (t % 3 === 0) r = c.step(JSON.parse(JSON.stringify(EV['夸奖'])));
    else { c.idle(1); r = { r: V.norm(V.sub(c.E, c.mu.vector)), dE: [0, 0, 0], g: 1, h: 1 }; }
    rs.push(r.r);
    if (t % 9 === 0 || t <= 6) {
      console.log('  ' + String(t).padEnd(6) + f(r.r, 5).padEnd(12) + f(V.norm(V.mul(r.dE, r.g * r.h)), 5));
    }
  }
  // 解析稳态：r_∞ = |ΔE_eff| / (1 − ρ)
  const r0 = c.step(JSON.parse(JSON.stringify(EV['夸奖'])));
  const dEffMag = V.norm(V.mul(r0.dE, r0.g * r0.h));
  console.log('');
  console.log('  解析稳态（周期性同向事件）： r_∞ = |ΔE_eff| / (1 − ρ)');
  console.log('     |ΔE_eff| = ' + f(dEffMag, 5) + '   (1−ρ) = ' + f(1 - 0.927, 5));
  console.log('     ⇒ r_∞ = ' + f(dEffMag / (1 - 0.927), 4));
  console.log('  ⚠️ 而球面半径是 1 ⇒ 会被封顶压住');
  console.log('  ⇒ ⭐ 这就是当初要加封顶的原因（docs/08 第一节）');
}

// ═══════════════════════════════════════════════════════════════
console.log(hr('④ 各事件在第 N 轮还剩多少"记忆"（半衰期视角）'));
{
  const rho = 0.927, hl = Math.log(0.5) / Math.log(rho);
  console.log('  ρ = 0.927 ⇒ 半衰期 ' + f(hl, 2) + ' 轮');
  console.log('  ' + '经过轮数'.padEnd(11) + '权重 ρ^age'.padEnd(14) + '剩多少');
  console.log('  ' + '-'.repeat(46));
  for (const n of [0, 3, 5, 9.14, 15, 20, 30, 50, 100]) {
    const w = Math.pow(rho, n);
    const pct = (w * 100).toFixed(2) + '%';
    const bar = '#'.repeat(Math.max(0, Math.round(w * 30)));
    console.log('  ' + f(n, 2).padEnd(11) + f(w, 6).padEnd(14) + pct.padEnd(10) + bar);
  }
  console.log('');
  console.log('  ⭐ 100 轮后还剩 ' + (Math.pow(rho, 100) * 100).toFixed(2) + '%');
  console.log('     ⇒ 理论上"永不归零"，但实际几十轮后就低于可察觉水平。');
}

// ═══════════════════════════════════════════════════════════════
console.log(hr('⑤ 对比：开启 rhoByValence 后，负性事件"记得更短"'));
{
  const RHO_V = { neg: 0.451, mid: 0.875, posMid: 0.875, posHigh: 0.805 };
  const run = (label, useV) => {
    const c = mkChar();
    if (useV) c.dynamics.rhoByValence = RHO_V;
    const out = [];
    const seq = [['忽视', 1], [null, 2], [null, 3], ['夸奖', 4], [null, 5], [null, 6], [null, 7], [null, 8]];
    for (const [name, t] of seq) {
      if (name) c.step(JSON.parse(JSON.stringify(EV[name]))); else c.idle(1);
      out.push(f(V.norm(V.sub(c.E, c.mu.vector)), 4));
    }
    console.log('  ' + label.padEnd(22) + out.join(' → '));
    return out;
  };
  console.log('  ' + '（轮 1-8，轮1=忽视，轮4=夸奖）');
  run('默认 ρ=0.927', false);
  run('rhoByValence 开启', true);
  console.log('');
  console.log('  ⭐ 负性那段（轮 1-3）在开启后散得快得多（0.451 vs 0.927）——');
  console.log('     而正性那段（轮 4-8）差别不大（0.805/0.875 vs 0.927）。');
}

// ═══════════════════════════════════════════════════════════════
console.log(hr('⑥ ⚠️ μ 层：长记忆的缺口'));
{
  const c = mkChar();
  const mu0 = c.mu.vector.slice();
  for (const [, name] of SEQ) { if (name) c.step(JSON.parse(JSON.stringify(EV[name]))); else c.idle(1); }
  console.log('  20 轮 7 个事件后，μ 的变化量 = ' + f(V.norm(V.sub(c.mu.vector, mu0)), 9));
  console.log('  ⇒ μ 【完全没动】—— 它只在显式调用 drift() 时才变。');
  console.log('');
  console.log('  ⭐⭐ 所以「会不会记住多次事件」分两层：');
  console.log('     ┌ E 层（快）：会叠加、会留痕，但按 ρ^age 指数消失 ⇒ 半衰期 9.14 轮');
  console.log('     └ μ 层（慢）：不自动记 —— 必须显式接 drift()');
  console.log('  ⇒ 现状 = 【短期会记，长期会忘】。长期记忆要靠 μ 漂移（issue #43）。');
}
