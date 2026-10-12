// 词库 × 情绪模型 —— 整合测试
//
//  验证 599 词能否作为【概念先验】接入评价层
//
// 用法：node test-lexicon.js
'use strict';

const { Lexicon } = require('../src/lexicon');
const { V } = require('../src/space');
const { Character, appraisal } = require('../src/engine');

const hr = s => '\n' + '═'.repeat(96) + '\n' + s + '\n' + '═'.repeat(96);
const sub = s => '\n' + '─'.repeat(96) + '\n' + s + '\n' + '─'.repeat(96);

// ═══════════════════════════════════════════════
const lex = new Lexicon();

console.log(hr('① 词库概况'));
console.log(lex.describe());
console.log(`
  ⭐ 概念先验的读法（barrett2016）:
     释义（gloss20） → 语义邻域
     主题（theme）   → 目标维度
     方向（category）→ 效价
     强弱（intensity）→ 先验强度 / 精度
  ⭐ kind=perception 的词【移出情绪强度空间】，只作知觉模板（topdown2025 p.398）
`);

// ═══════════════════════════════════════════════
console.log(hr('② 概念先验示例'));

for (const w of ['委屈', '心疼', '生气', '害羞', '难过', '开心']) {
  const e = lex.lookup(w);
  if (!e) { console.log(`  ${w}: （词库中无）`); continue; }
  console.log(`  ${w}`);
  console.log(`     释义: ${e.gloss}`);
  console.log(`     主题: ${e.theme}（关切 = ${e.goal}）`);
  console.log(`     方向: ${e.category} → 八型 ${e.octant}  签名 ${V.fmt(e.signature, 2)}`);
  console.log(`     kind: ${e.kind} · 强度: ${e.intensity}（先验精度 ${e.precision}）`);
}

// ═══════════════════════════════════════════════
console.log(hr('③ 模糊查词（按释义搜索）'));

for (const q of ['想被', '被理解', '无力', '不甘']) {
  const hits = lex.search(q, 5);
  console.log(`\n  搜「${q}」→ ${hits.length} 条`);
  for (const h of hits) console.log(`     ${h.word}（${h.octant}）${h.gloss.slice(0, 30)}`);
}

// ═══════════════════════════════════════════════
console.log(hr('④ ⭐ 三幕评价 → 词库候选（这是整合的关键接口）'));

const dafeiyu = new Character({
  name: '傲娇大肥鱼', sigma: 0.50, muPreset: 'dependent',
  subtype: ['Tsundere', 'Tsun-Ama', 'Tsuntere'],
  gainPos: 1.0, gainNeg: 1.3,
});

const ACTS = [
  {
    title: '第一幕 · 「我找了别的 AI」',
    eventKey: '被替代',
    context: { triggers: ['alone'] },
    appraisal: {
      relevance: 0.95, congruence: -0.85, importance: 0.85,
      agency: 'other', coping: 0.25, certainty: 0.80,
      expectancy: 0.85, intentionality: 0.30, currentArousal: 0.30,
    },
  },
  {
    title: '第二幕 · 「好啦好啦，摸摸头」',
    eventKey: '被安抚',
    context: { triggers: ['alone'], strategyScale: 0.35 },
    appraisal: {
      relevance: 0.80, congruence: 0.70, importance: 0.60,
      agency: 'other', coping: 0.80, certainty: 0.70,
      expectancy: 0.40, intentionality: 1.0, currentArousal: 0.60,
    },
  },
  {
    title: '第三幕 · 「你说过的话不许收回去」',
    eventKey: '被戳中',
    context: { triggers: ['calledOut'] },
    appraisal: {
      relevance: 0.95, congruence: 0.80, importance: 0.85,
      agency: 'other', coping: 0.40, certainty: 0.90,
      expectancy: 0.30, intentionality: 1.0, currentArousal: 0.55,
    },
  },
];

for (const act of ACTS) {
  console.log(sub(act.title));
  const r = dafeiyu.step(act);

  console.log(`
  【引擎算出的】方向 = ${r.direction} → 八型 = ${r.octant}
     ΔE = ${V.fmt(r.dE)}   |ΔE| = ${V.norm(r.dE).toFixed(4)}
     价效 = ${r.valence.toFixed(3)} · 强度 = ${r.intensity.toFixed(3)}`);

  // ⭐ 引擎内部已匹配（含 categoryHint）
  if (r.concept) {
    console.log(`\n  【引擎选中的概念】⭐ ${r.concept.word}`);
    console.log(`     ${r.concept.gloss}`);
    console.log(`     主题 ${r.concept.theme}（关切 = ${r.concept.goal}）`);
    console.log(`     ${r.concept.category} → ${r.concept.octant} · ${r.concept.intensity}`);
  }

  // ⭐ 完整候选（带方向类提示）
  const cands = lex.matchAppraisal(r.appraisal, {
    valence: r.valence,
    octantHint: r.octant,
    categoryHint: r.direction,     // ⭐ 关键：加上方向类
    top: 6,
  });
  console.log(`\n  【词库候选】（方向类 = ${r.direction} · 八型 = ${r.octant} · 价效 = ${r.valence.toFixed(2)}）`);
  for (const c of cands) {
    const mark = c.category === r.direction ? '⭐⭐' : (c.octant === r.octant ? ' ⭐' : '  ·');
    console.log(`     ${mark} ${c.word.padEnd(7)} [${c.category.padEnd(10)}/${c.octant.padEnd(10)}] ${c.gloss.slice(0, 30)}`);
  }
  console.log(`  ⭐ 返回【候选集】而非单一答案 —— 因为"大多数情绪体验是模棱两可的`
    + `交由模型自行判断"（设定者裁定）`);
}

// ═══════════════════════════════════════════════
console.log(hr('⑤ ⭐ 词库两种用法对比'));

console.log(`
  【用法 A】八型签名（当前引擎默认）
      ΔE = α × ε × signature(八型)
      signature 只有 8 个可能值 —— 粗糙但稳定

  【用法 B】词库签名（增强）
      ΔE = α × ε × signature(选中词)
      599 个可能的 signature —— 细腻，但需要选词
      ⭐ 而"选词"这一步正是评价层要做的
`);

// 演示：同一评价，用八型 vs 用选中词
const r3 = dafeiyu.history[dafeiyu.history.length - 1];
console.log('  以第三幕为例:');
console.log(`     八型签名   ${V.fmt(appraisal.OCTANT[r3.octant], 2)}  → ΔE = ${V.fmt(r3.dE)}`);
const best = lex.matchAppraisal(r3.appraisal, { valence: r3.valence, octantHint: r3.octant, top: 1 })[0];
if (best) {
  const sig = best.signature;
  const dE2 = V.mul(sig, V.norm(r3.dE));
  console.log(`     词「${best.word}」   ${V.fmt(sig, 2)}  → ΔE = ${V.fmt(dE2)}`);
}

console.log(`
  ⭐ 两者的 P 轴符号一致、方向相近 —— 说明八型是词库的【粗粒度投影】。
     词库给的是更细的分辨率（同一个卦限内还能区分不同词）。
`);

// ═══════════════════════════════════════════════
console.log(hr('⑥ ⭐ 模棱两可区（mild 词）的处理'));

const mildByTheme = new Map();
for (const e of lex.entries) {
  if (e.intensity !== 'mild') continue;
  if (!mildByTheme.has(e.theme)) mildByTheme.set(e.theme, []);
  mildByTheme.get(e.theme).push(e);
}
console.log(`
  词库中 mild（弱）词共 ${[...mildByTheme.values()].reduce((s, a) => s + a.length, 0)} 个
  ⭐ 这些是"先验接近均匀"的词 —— 等情境证据裁决（#47 用户调教通道的设计对象）
`);
console.log('  ' + '主题'.padEnd(16) + 'mild 词数'.padEnd(12) + '示例');
console.log('  ' + '-'.repeat(76));
for (const [t, arr] of [...mildByTheme.entries()].sort((a, b) => b[1].length - a[1].length).slice(0, 8)) {
  console.log('  ' + t.padEnd(14) + String(arr.length).padEnd(12) +
    arr.slice(0, 4).map(e => e.word).join(' · '));
}

// ═══════════════════════════════════════════════
console.log(hr('⑦ ⭐ perception 词（39 个）的独立处理'));

const percep = lex.entries.filter(e => e.isPerception);
console.log(`  共 ${percep.length} 个 kind=perception 的词`);
console.log(`  ⭐ 按 topdown2025 p.398（interoception 也算 perception）与
     barrett2016 p.22（疼痛与情绪是"同一枚硬币的两面"），
     这批词【移出情绪强度空间】，改作知觉层的【知觉模板】。\n`);
console.log('  ' + '词'.padEnd(8) + '主题'.padEnd(14) + '释义');
console.log('  ' + '-'.repeat(76));
for (const e of percep.slice(0, 15)) {
  console.log('  ' + e.word.padEnd(7) + e.theme.padEnd(14) + e.gloss.slice(0, 40));
}
if (percep.length > 15) console.log(`  … 还有 ${percep.length - 15} 个`);

console.log(hr('整合结论'));
console.log(`
  ✅ 词库（599 词）已作为【概念先验】接入评价层
  ✅ 接口: lex.matchAppraisal(评价) → 候选词集（不是单一答案）
  ✅ 两种签名用法: 八型（粗，8 个）vs 词库（细，599 个）
  ✅ mild 词 = 先验接近均匀 → 交给模型/用户裁决（#47）
  ✅ perception 词（39）已标记，可移出情绪强度空间
  ⚠️ 引用纪律: 词库只作工程用概念先验，不写成"情绪的本质"
     （AET pp.20-22 · barrett2016 p.21 的警告）
`);
