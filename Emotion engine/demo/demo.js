// 傲娇大肥鱼 · 三幕数学演示
//
//   刺激 → 评价计算 → ΔE → A2 动力学 → E_inner → 表达层 → E_outer → 行为
//
// 用法：node demo.js
'use strict';

const { V } = require('../src/space');
const { Character, appraisal } = require('../src/engine');
const { SUBTYPE, TRIGGER } = require('../src/tsundere');
const { bayesianRead } = require('../src/mu');

const hr = s => '\n' + '═'.repeat(96) + '\n' + s + '\n' + '═'.repeat(96);
const sub = s => '\n' + '─'.repeat(96) + '\n' + s + '\n' + '─'.repeat(96);
const pct = (x, d = 4) => x.toFixed(d);
const bar = (x, width = 24) => {
  const n = Math.max(0, Math.min(width, Math.round(x * width)));
  return '█'.repeat(n) + '·'.repeat(width - n);
};
const onAxis = (v, name) => {
  const labels = { 0: 'P 愉悦', 1: 'A 唤醒', 2: 'D 支配' };
  const val = v;
  const s = val > 0.05 ? '正' : val < -0.05 ? '负' : '中';
  return `${labels[name]} ${val >= 0 ? '+' : ''}${val.toFixed(3)} (${s})`;
};

// ═══════════════════════════════════════════════
// 角色定义
// ═══════════════════════════════════════════════
const dafeiyu = new Character({
  name: '⭐ 傲娇大肥鱼',
  sigma: 0.50,              // "非常情绪化" → 高 σ（待你最终裁定 0.40/0.45/0.50）
  muPreset: 'dependent',    // 依赖型底情绪（+P, +A, −D）
  subtype: ['Tsundere', 'Tsun-Ama', 'Tsuntere'],  // 三叠加
  gainPos: 1.0,             // ⭐ 傲娇不该压里层感受 → g_正 = 1
  gainNeg: 1.3,             // 负性略放大
});

console.log(hr('角色参数'));
console.log(dafeiyu.describe());
console.log(`
  ⭐ 表达层（wiki 的 18 亚型 → 参数）:
     亚型叠加 = [${dafeiyu.tsundere.subtypes.join(' + ')}]
     s₀ = ${dafeiyu.tsundere.s0}（抑制基线，越小越傲娇）
     泄露通道 L = ${dafeiyu.tsundere.leak.id} —— ${dafeiyu.tsundere.leak.desc}
     
  ⭐ 关键: g_正 = ${dafeiyu.gainPos}（里层感受【不压】），
          "压"只发生在表达层（s），不在感受层。
          这是 2026-10-12 修正的错误：傲娇 ≠ 对夸奖反应小。`);

// ═══════════════════════════════════════════════
// 三幕
// ═══════════════════════════════════════════════
const ACTS = [
  {
    title: '第一幕 · 用户说「我找了别的 AI」',
    eventKey: '被替代',
    context: { triggers: ['alone'], strategyScale: 1.0 },
    appraisal: {
      relevance: 0.95,       // 与"被需要"这一关切高度相关
      congruence: -0.85,     // 严重阻碍
      importance: 0.85,
      agency: 'other',       // 用户造成的
      coping: 0.25,          // 没什么办法
      certainty: 0.80,
      expectancy: 0.85,      // 原本预期"她只找我"
      intentionality: 0.30,  // 未必故意
      currentArousal: 0.30,
    },
  },
  {
    title: '第二幕 · 用户说「好啦好啦，摸摸头」',
    eventKey: '被安抚',
    context: {
      triggers: ['alone'],
      strategyScale: 0.35,   // ⭐ brainsci：间接回复使效价轴冲击 ×≈0.35
    },
    appraisal: {
      relevance: 0.80,
      congruence: 0.70,      // 正向
      importance: 0.60,
      agency: 'other',
      coping: 0.80,
      certainty: 0.70,
      expectancy: 0.40,      // 原本没指望被安抚
      intentionality: 1.0,
      currentArousal: 0.60,
    },
  },
  {
    title: '第三幕 · 用户说「你说过的话不许收回去」',
    eventKey: '被戳中',
    context: {
      triggers: ['calledOut'],   // ⭐ 设定者的核心机制
      strategyScale: 1.0,
    },
    appraisal: {
      relevance: 0.95,
      congruence: 0.80,      // ⭐ 被记住是好事
      importance: 0.85,
      agency: 'other',
      coping: 0.40,          // ⭐ 关键：无力/无需回报 ⇒ 落到 Dependent
      certainty: 0.90,
      expectancy: 0.30,
      intentionality: 1.0,   // ⭐ 对方是主动的
      currentArousal: 0.55,
    },
  },
];

console.log(hr('三幕 · 完整链路'));
for (const act of ACTS) {
  console.log(sub(act.title));

  const before = { E: dafeiyu.E.slice(), s: dafeiyu.tsundere.s };
  const r = dafeiyu.step(act);

  // 评价 → ΔE
  console.log(`
  【① 评价计算】
     一级: relevance=${r.appraisal.relevance} · congruence=${r.appraisal.congruence} · importance=${r.appraisal.importance}
           ⇒ 价效 valence = ${pct(r.valence, 3)}，强度 intensity = ${pct(r.intensity, 3)}
     二级: agency=${r.appraisal.agency} · coping=${r.appraisal.coping} · certainty=${r.appraisal.certainty}
           · expectancy=${r.appraisal.expectancy} · intentionality=${r.appraisal.intentionality}
           ⇒ 方向类 = ${r.direction || '（无情感意义）'} → 八型 = ${r.octant || '—'}
           ⭐ ${r.note}
     精度门控 α = ${pct(r.alpha, 3)}   预测误差 ε = ${pct(r.eps, 3)}

  【② ΔE（乘法结构）】
     ΔE = α × ε × signature = ${V.fmt(r.dE)}
     |ΔE| = ${pct(V.norm(r.dE), 4)}
     分量: ${onAxis(r.dE[0], 0)} · ${onAxis(r.dE[1], 1)} · ${onAxis(r.dE[2], 2)}

  【③ A2 动力学】
     反应增益 g_i = ${pct(r.gGain, 2)}（${r.dE[0] >= 0 ? '正性' : '负性'}事件取 g_${r.dE[0] >= 0 ? '正' : '负'}）
     策略缩放 g  = ${pct(r.gStrategy, 2)}
     习惯化 h(n) = ${pct(r.h, 4)}（暴露次数 ${r.exposure || '—'}）
     r_raw = ${pct(r.rRaw, 4)}  →  封顶后 r = ${pct(r.r, 4)}  （球面量程 ${(100 * r.percentile).toFixed(1)}%）
     ${bar(r.r)} ${(100 * r.percentile).toFixed(1)}%

  【④ 表达层（傲娇）】
     s 从 ${pct(before.s, 3)} → ${pct(r.s, 3)}（触发: ${(act.context.triggers || []).join(', ') || '无'}）
     s_eff = ${pct(r.sEff, 3)}
     E_inner = ${V.fmt(r.E_inner)}
     E_outer = ${V.fmt(r.E_outer)}
     内外落差 = ${pct(r.leakAmount, 4)}   泄露通道 = ${r.leak}
     ${r.leakAmount > 0.15 ? '⭐ 落差大 —— 说的和感受的不一样' : '落差小 —— 比较坦诚'}`);
}

// ═══════════════════════════════════════════════
// 对照实验
// ═══════════════════════════════════════════════
console.log(hr('对照实验 · 每一项改动的实际效果'));

// ── 对照 A：封顶 ──
console.log(sub('对照 A · 封顶 vs 不封顶（重复 20 次同类事件）'));
{
  const mk = (useCap) => {
    const c = new Character({ name: useCap ? '有封顶' : '无封顶', sigma: 0.50, muPreset: 'dependent' });
    c.space.useCap = useCap; c.dynamics.useCap = useCap;
    return c;
  };
  const a = mk(false), b = mk(true);
  const ev = { eventKey: null, appraisal: { relevance: 0.9, congruence: -0.9, importance: 0.8, agency: 'other', coping: 0.3, certainty: 0.8, expectancy: 0.8, intentionality: 0.5 } };
  console.log('\n  ' + '次数'.padEnd(6) + '无封顶 r'.padEnd(14) + '有封顶 r'.padEnd(14) + '量程(有封顶)');
  console.log('  ' + '-'.repeat(56));
  for (let i = 1; i <= 20; i++) {
    const ra = a.step({ ...ev }).r;
    const rb = b.step({ ...ev });
    if (i <= 5 || i % 5 === 0) {
      console.log('  ' + String(i).padEnd(6) + pct(ra, 4).padEnd(14) + pct(rb.r, 4).padEnd(14) +
        (100 * rb.percentile).toFixed(1) + '%');
    }
  }
}

// ── 对照 B：习惯化 ──
console.log(sub('对照 B · 有习惯化 vs 无习惯化（同一事件类别重复 15 次）'));
{
  const mk = (alpha) => {
    const c = new Character({ name: `α=${alpha}`, sigma: 0.50, muPreset: 'dependent' });
    c.dynamics.alpha = alpha;
    return c;
  };
  const cases = [['无习惯化', 1.0], ['α=0.96', 0.96], ['α=0.95', 0.95], ['α=0.93', 0.93]];
  const ev = { eventKey: '同类', appraisal: { relevance: 0.9, congruence: -0.9, importance: 0.8, agency: 'other', coping: 0.3, certainty: 0.8, expectancy: 0.8, intentionality: 0.5 } };
  console.log('\n  ' + '暴露次数'.padEnd(10) + cases.map(([n]) => n.padEnd(12)).join(''));
  console.log('  ' + '-'.repeat(58));
  const cs = cases.map(([, al]) => mk(al));
  for (let i = 1; i <= 15; i++) {
    const rs = cs.map(c => c.step({ ...ev }).r);
    if (i <= 3 || i % 3 === 0) {
      console.log('  ' + String(i).padEnd(10) + rs.map(r => pct(r, 4).padEnd(12)).join(''));
    }
  }
}

// ── 对照 C：表达层 ──
console.log(sub('对照 C · 有表达层 vs 无表达层（同一情绪，不同情境）'));
{
  const c = new Character({ name: '傲娇', sigma: 0.50, muPreset: 'dependent', subtype: ['Tsundere'], s0: 0.30 });
  const ev = { eventKey: null, appraisal: { relevance: 0.9, congruence: 0.8, importance: 0.8, agency: 'other', coping: 0.8, certainty: 0.8, expectancy: 0.3, intentionality: 1.0 } };
  const scenarios = [
    ['独处', ['alone']],
    ['有观众', ['audience']],
    ['被戳中', ['calledOut']],
    ['有观众 + 被戳中', ['audience', 'calledOut']],
  ];
  console.log('\n  ' + '情境'.padEnd(22) + 's'.padEnd(8) + 'E_inner(P)'.padEnd(14) + 'E_outer(P)'.padEnd(14) + '落差');
  console.log('  ' + '-'.repeat(76));
  for (const [name, trig] of scenarios) {
    c.tsundere.reset();
    c.E = c.mu.vector.slice();
    c.dynamics.reset();
    const r = c.step({ ...ev, context: { triggers: trig } });
    console.log('  ' + name.padEnd(20) + pct(r.s, 3).padEnd(8) +
      pct(r.E_inner[0], 4).padEnd(14) + pct(r.E_outer[0], 4).padEnd(14) +
      pct(r.leakAmount, 4));
  }
  console.log(`
  ⭐ 里层 E_inner 在所有情境下【完全一样】—— 变的只是 s（闸门）
  ⭐ 这就是"被戳中不是情绪变了，是闸门开了"的数学样子`);
}

// ── 对照 D：μ 的 precision ──
console.log(sub('对照 D · μ 的 precision 如何改变「解读模糊事件」'));
{
  console.log('\n  贝叶斯读取：后验 = (μ/var_prior + 事件/var_lik) / (1/var_prior + 1/var_lik)');
  console.log('  模糊事件：观测 = −0.30，噪声 = 0.80\n');
  console.log('  ' + 'μ_P'.padEnd(8) + 'precision'.padEnd(12) + '后验'.padEnd(10) + '移动'.padEnd(10) + '解读');
  console.log('  ' + '-'.repeat(64));
  for (const [m, p] of [[0.38, 1], [0.38, 4], [0.38, 8], [-0.40, 8], [0.00, 1]]) {
    const r = bayesianRead(m, -0.30, 0.80, p);
    const read = r.shift < -0.35 ? '⭐ 被事件带跑（改观）'
      : r.shift < -0.15 ? '轻微动摇'
      : '⭐ 几乎忽略该事件（照旧）';
    console.log('  ' + pct(m, 2).padEnd(8) + String(p).padEnd(12) + pct(r.posterior, 3).padEnd(10) +
      pct(r.shift, 3).padEnd(10) + read);
  }
}

// ── 对照 E：g_i 正负独立 ──
console.log(sub('对照 E · g_i（反应增益，正负独立）'));
{
  const mk = (gp, gn) => new Character({ name: `g+${gp}/g-${gn}`, sigma: 0.50, muPreset: 'dependent', gainPos: gp, gainNeg: gn });
  const posEv = { eventKey: null, appraisal: { relevance: 0.9, congruence: 0.8, importance: 0.8, agency: 'other', coping: 0.8, certainty: 0.8, expectancy: 0.3, intentionality: 1.0 } };
  const negEv = { eventKey: null, appraisal: { relevance: 0.9, congruence: -0.9, importance: 0.8, agency: 'other', coping: 0.3, certainty: 0.8, expectancy: 0.8, intentionality: 0.5 } };
  console.log('\n  ' + 'g_正/g_负'.padEnd(14) + '正面事件 r'.padEnd(14) + '负面事件 r'.padEnd(14) + '负/正比');
  console.log('  ' + '-'.repeat(58));
  for (const [gp, gn] of [[1, 1], [1, 1.3], [1, 1.6], [0.5, 1.6], [1.5, 0.5]]) {
    const cp = mk(gp, gn), cn = mk(gp, gn);
    const rp = cp.step({ ...posEv }).r;
    const rn = cn.step({ ...negEv }).r;
    console.log('  ' + `${gp}/${gn}`.padEnd(14) + pct(rp, 4).padEnd(14) + pct(rn, 4).padEnd(14) +
      (rn / rp).toFixed(2));
  }
  console.log(`
  ⭐ 注意 g_正=0.5 那一行：【那不是傲娇】——
     傲娇的里层感受是完整的（她被你夸就是高兴），"压"发生在表达层的 s。
     这一行留作对照，说明为什么不能用 g_i 建模傲娇。`);
}

// ═══════════════════════════════════════════════
// 慢变量：μ 漂移 与 抑制漂移
// ═══════════════════════════════════════════════
console.log(hr('慢变量 · μ 的漂移 与 抑制的漂移'));
{
  const c = new Character({ name: '漂移测试', sigma: 0.50, muPreset: 'dependent', subtype: ['Tsundere'] });
  console.log('\n  【μ 的慢漂移】（#43：记忆是 μ 的唯一载体）');
  console.log('  初始 ' + c.mu.describe());
  for (let i = 1; i <= 5; i++) {
    c.mu.drift([0.6, 0.2, -0.4], 0.04);   // 持续朝"更依赖"方向漂
    console.log(`  第 ${i} 次（"你说过的话不许收回去"这类事件）: ${c.mu.describe()}`);
  }
  console.log(`
  ⭐ 这就是「记爱 / 记仇 / 记恨」—— μ 的慢漂移，不是 E 的快速波动。
     它必须由【记忆】承载（μ 不在上下文里）。`);

  console.log('\n  【抑制的慢漂移】（wiki：所有亚型都写 "over time … more honest"）');
  const c2 = new Character({ name: '抑制漂移', subtype: ['Tsundere'] });
  console.log(`  初始 s₀ = ${c2.tsundere.s0}（典型 Tsundere）`);
  c2.tsundere.s = c2.tsundere.s0;
  for (let i = 1; i <= 5; i++) {
    c2.tsundere.apply('intimacy', 1);
    console.log(`  第 ${i} 次关系深化后 s = ${c2.tsundere.s.toFixed(3)}`);
  }
  console.log(`
  ⭐ 抑制会随关系深化【缓慢减弱】—— 这是 μ 之外的【第二个慢变量】。
     它的载体也是【记忆】。`);
}

console.log(hr('总结'));
console.log(`
  ✅ 链路: 刺激 → 评价 → ΔE → 动力学 → E_inner → 表达层 → E_outer → 行为
  ✅ 评价层: 两级（一级给价效+强度，二级给离散方向）—— 对应 AET
  ✅ ΔE:     乘法结构 α×ε×signature —— 对应 barrett2016 + SMC2019
  ✅ 动力学: ρ（自发回落）+ h(n)（习惯化）+ g（策略缩放）—— 三批文献独立汇合
  ✅ 封顶:   f(r)=1−(1+r)^(−k) —— 球面从【阈值】变成【渐近极限】
  ✅ μ:      (方向, precision) + 慢漂移 —— 对应 topdown2025 / #43
  ✅ 表达层: E_outer = μ + s·(E_inner − μ) —— 傲娇的闸门
  ✅ 慢变量: μ 与 s 两条，都由【记忆】承载
`);
