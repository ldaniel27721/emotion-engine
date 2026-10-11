// 合并 4 批映射结果 → 最终中文情绪词库，并做全量校验。
//
// ⭐ 原则：只认【落盘物】。逐条比对 out/batch-N.json 与 batches/batch-N.json，
//    保证子代理没有篡改词面、没漏条、没停序。
//
// 校验项：
//   ① 4 份产出齐备、每份条数 = 对应输入的条数
//   ② 词面与顺序【逐条】与输入一致（防篡改/防漏/防错序）
//   ③ category 全在 11 个允许值内
//   ④ gloss20 ≤ 20 字（设定者要求）
//   ⑤ 无重复词
//   ⑥ kind ∈ {emotion, perception}；intensity ∈ {strong, mild}
//
// 用法：node merge-cn-lexicon.js
const fs = require('fs');
const path = require('path');

const BASE = 'E:\\dsh\\tmp-moe\\emotion-lexicon';
const OUT = 'E:\\dsh\\tmp-moe\\emotion-lexicon\\out';
const DST = 'E:\\dsh\\tmp-moe\\emotion-lexicon\\emotion-lexicon-cn.json';

const ALLOWED_CAT = ['Happiness', 'Caring', 'Depression', 'Inadequate', 'Fear',
                     'Confusion', 'Hurt', 'Anger', 'Loneliness', 'Remorse', 'Contempt',
                     'Calm'];
const ALLOWED_KIND = ['emotion', 'perception'];
const ALLOWED_INT = ['strong', 'mild'];

// 八型方向表（供产出附带，便于下游直接取方向约束）
// ⭐ Calm 是第 12 类：八型里本来就有 Relaxed (+,−,+)，Checklist 也有 `Calm–relaxed` 族，
//    但 Emotion-Feelings 的 10 类把它并进了 Happiness。中文词表里这一族有 18 个词
//    （安宁·安心·冷静·宁静·坦然·镇定…），并入 Happiness 会让它们的唤醒轴判反。
const CAT_TO_OCTANT = {
  Happiness: 'Exuberant', Caring: 'Dependent', Depression: 'Bored', Inadequate: 'Bored',
  Fear: 'Anxious', Confusion: 'Anxious', Hurt: 'Anxious', Anger: 'Hostile',
  Loneliness: 'Bored', Remorse: 'Anxious', Contempt: 'Disdainful', Calm: 'Relaxed',
};
const OCTANT_SIGN = {
  Exuberant: [1, 1, 1], Dependent: [1, 1, -1], Relaxed: [1, -1, 1], Docile: [1, -1, -1],
  Hostile: [-1, 1, 1], Anxious: [-1, 1, -1], Disdainful: [-1, -1, 1], Bored: [-1, -1, -1],
};

const problems = [];
const warnings = [];
const merged = [];

for (let n = 1; n <= 4; n++) {
  const inPath = path.join(BASE, 'batches', 'batch-' + n + '.json');
  const outPath = path.join(OUT, 'batch-' + n + '.json');

  if (!fs.existsSync(outPath)) { problems.push('缺产出: ' + outPath); continue; }
  const inp = JSON.parse(fs.readFileSync(inPath, 'utf8'));
  let got;
  try { got = JSON.parse(fs.readFileSync(outPath, 'utf8')); }
  catch (e) { problems.push('batch-' + n + ' JSON 解析失败: ' + e.message); continue; }

  if (got.length !== inp.length) {
    problems.push('batch-' + n + ' 条数不符: 输入 ' + inp.length + ' → 产出 ' + got.length);
  }

  // ⭐ 逐条比对词面与顺序
  const lim = Math.min(inp.length, got.length);
  for (let i = 0; i < lim; i++) {
    if (got[i].word !== inp[i].word) {
      problems.push('batch-' + n + ' 第 ' + (i + 1) + ' 条词面不符: 输入 "' + inp[i].word + '" → 产出 "' + got[i].word + '"');
      break;
    }
  }

  for (const r of got) {
    if (!ALLOWED_CAT.includes(r.category)) problems.push('非法 category: ' + r.word + ' → ' + r.category);
    if (!ALLOWED_KIND.includes(r.kind)) problems.push('非法 kind: ' + r.word + ' → ' + r.kind);
    if (!ALLOWED_INT.includes(r.intensity)) problems.push('非法 intensity: ' + r.word + ' → ' + r.intensity);
    if (typeof r.gloss20 !== 'string' || r.gloss20.length === 0) problems.push('缺 gloss20: ' + r.word);
    else if (r.gloss20.length > 20) warnings.push('gloss20 > 20 字: ' + r.word + ' (' + r.gloss20.length + ' 字)');
    merged.push(r);
  }
}

// 去重
const seen = new Set();
const dups = [];
for (const r of merged) {
  if (seen.has(r.word)) dups.push(r.word);
  seen.add(r.word);
}
if (dups.length) problems.push('重复词: ' + dups.join(', '));

// ---- 报告 ----
const byCat = {}, byKind = {}, byInt = {};
for (const r of merged) {
  byCat[r.category] = (byCat[r.category] || 0) + 1;
  byKind[r.kind] = (byKind[r.kind] || 0) + 1;
  byInt[r.intensity] = (byInt[r.intensity] || 0) + 1;
}

console.log('==== 合并结果 ====');
console.log('  总词数        ' + merged.length);
console.log('  去重后        ' + seen.size);
console.log('');
console.log('==== category 分布 ====');
for (const c of ALLOWED_CAT) {
  const n = byCat[c] || 0;
  const bar = '█'.repeat(Math.round(n / 3));
  console.log('  ' + c.padEnd(12) + String(n).padStart(4) + '  ' + bar);
}
console.log('');
console.log('==== kind / intensity 分布 ====');
console.log('  kind:      ' + ALLOWED_KIND.map(k => k + ' ' + (byKind[k] || 0)).join('   '));
console.log('  intensity: ' + ALLOWED_INT.map(k => k + ' ' + (byInt[k] || 0)).join('   '));
console.log('');
const g20 = merged.map(r => r.gloss20.length).sort((a, b) => a - b);
console.log('==== gloss20 长度 ====');
console.log('  min ' + g20[0] + ' / 中位 ' + g20[(g20.length / 2) | 0] + ' / max ' + g20[g20.length - 1]);
console.log('  全部 ≤20 字: ' + (g20[g20.length - 1] <= 20 ? '是' : '否'));
console.log('');
if (warnings.length) {
  console.log('⚠️ 警告：');
  warnings.slice(0, 12).forEach(w => console.log('   · ' + w));
  if (warnings.length > 12) console.log('   …共 ' + warnings.length + ' 条');
  console.log('');
}
if (problems.length) {
  console.log('❌ 有问题，未写盘：');
  problems.slice(0, 20).forEach(p => console.log('   · ' + p));
  if (problems.length > 20) console.log('   …共 ' + problems.length + ' 条');
  process.exit(1);
}

const payload = {
  name: '中文情绪词库（离线查表用）',
  purpose: '给大肥鱼的情绪模型提供【词 → 释义 + 大类 + 方向约束】的离线查询表；' +
           '运行时查表，不实时解析，避免情绪反应飘忽',
  sources: {
    words: 'emotion-words-raw.txt（500 个描述情绪的词汇 + 释义）',
    categorySystem: 'Emotion-Feelings (tomdrummond.com): 10 大类',
    octantSystem: 'Mehrabian 八型 → 球体方向（A1/A2/A3）',
  },
  built: new Date().toISOString().slice(0, 10),
  total: merged.length,
  categories: ALLOWED_CAT,
  categoryToOctant: CAT_TO_OCTANT,
  octantSign: OCTANT_SIGN,
  counts: { byCategory: byCat, byKind, byIntensity: byInt },
  entries: merged.map(r => ({
    word: r.word,
    gloss: r.gloss,
    gloss20: r.gloss20,
    category: r.category,
    octant: CAT_TO_OCTANT[r.category],
    kind: r.kind,
    intensity: r.intensity,
  })),
};
fs.writeFileSync(DST, JSON.stringify(payload, null, 1), 'utf8');
console.log('✅ 全部校验通过 → ' + DST + '  (' + fs.statSync(DST).size + ' B)');
