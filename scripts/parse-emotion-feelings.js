// 把 Emotion-Feelings(1).pdf 的抽取文本解析成结构化 JSON。
//
// 原表结构：10 大类 × 3 个强度档（Strong / Medium / Light）
// 抽取后的线性文本里，每个档以档名开头，然后十组词【按固定顺序】铺开，
// 组与组之间【没有分隔符】—— 所以组边界必须显式给定（下表的 groups 词数）。
//
// ⚠️ 边界是我逐词读出来的，脚本负责：按边界切词 + 校验总数 + 校验词面干净。
//    若边界写错，校验会失败而不是静默产出垃圾。
//
// 用法：node parse-emotion-feelings.js
const fs = require('fs');

const SRC = 'E:\\dsh\\tmp-moe\\emotion-lexicon\\Emotion-Feelings1.txt';
const DST = 'E:\\dsh\\tmp-moe\\emotion-lexicon\\emotion-feelings.json';

const CATEGORIES = ['Happiness', 'Caring', 'Depression', 'Inadequate', 'Fear',
                    'Confusion', 'Hurt', 'Anger', 'Loneliness', 'Remorse'];

// 每档：起始行号（1-based，指向档名行）+ 十组各自的词数（按 CATEGORIES 顺序）
const LEVELS = [
  { level: 'Strong', headerLine: 24,  groups: [15, 14, 17, 17, 13, 17, 17, 17, 14, 15] }, // 156
  { level: 'Medium', headerLine: 182, groups: [14, 15, 20, 20, 18, 20, 18, 20, 14, 16] }, // 175
  { level: 'Light',  headerLine: 359, groups: [12, 12, 12, 11, 12,  6, 11, 11,  9,  9] }, // 105
];

// ⭐ 大类的性质标注（来自设定者 2026-10-12 的裁定：Hurt 是【知觉】不是情绪）
const KIND = {
  Happiness: 'emotion', Caring: 'emotion', Depression: 'emotion', Inadequate: 'emotion',
  Fear: 'emotion', Confusion: 'emotion',
  Hurt: 'perception',   // ← 设定者：「受伤更像一种知觉，是体验情绪的前置物和副产物」
  Anger: 'emotion', Loneliness: 'emotion', Remorse: 'emotion',
};

// ---- 读源文件，剥掉"源文件=/页数=/页头"那几行 ----
const raw = fs.readFileSync(SRC, 'utf8').split(/\r?\n/);
const lines = raw.map(s => s.replace(/\s+$/, ''));

// 只取正文（第 1 页标记之后）
let bodyStart = lines.findIndex(l => /^=+ 第 1 页/.test(l));
if (bodyStart < 0) bodyStart = 9;
// 行号按【原文件 1-based】对齐：脚本内 index = 行号 - 1
const at = n => (lines[n - 1] === undefined ? '' : lines[n - 1].trim());

const entries = [];
const problems = [];

for (const spec of LEVELS) {
  // 档名行必须真的是档名
  const hdr = at(spec.headerLine);
  if (hdr !== spec.level) problems.push(`档名行 ${spec.headerLine} 应为 "${spec.level}"，实际读到 "${hdr}"`);

  let cursor = spec.headerLine + 1;
  spec.groups.forEach((count, gi) => {
    const cat = CATEGORIES[gi];
    const words = [];
    while (words.length < count) {
      const w = at(cursor);
      if (w === '') { cursor++; continue; }                 // 跳过空行
      if (LEVELS.some(s => s.level === w)) break;           // 撞到下一档 = 词数写多了
      if (w.startsWith('==========')) break;
      if (w === 'Vocabulary of Emotions/Feelings' || w === 'tomdrummond.com') { cursor++; continue; }
      words.push(w);
      cursor++;
    }
    if (words.length !== count) {
      problems.push(`${spec.level}/${cat}: 期望 ${count} 词，实际读到 ${words.length}`);
    }
    for (const w of words) {
      entries.push({
        word: w,
        category: cat,
        kind: KIND[cat],
        level: spec.level,
        levelRank: { Strong: 3, Medium: 2, Light: 1 }[spec.level],
        source: 'Emotion-Feelings (tomdrummond.com)',
      });
    }
  });
}

// ---- 自校验 ----
const expectedTotal = LEVELS.reduce((s, l) => s + l.groups.reduce((a, b) => a + b, 0), 0);
if (entries.length !== expectedTotal) {
  problems.push(`总词数不符：期望 ${expectedTotal}，实际 ${entries.length}`);
}

// 词面必须干净：不含数字、页头、明显噪声
const dirty = entries.filter(e => /^[\d=]+$/.test(e.word) || e.word.includes('第 ') || e.word.length > 28);
if (dirty.length) problems.push('可疑词面: ' + dirty.map(d => '#' + d.word + '(' + d.category + ')').join(', '));

// 去重统计
const uniq = new Set(entries.map(e => e.word.toLowerCase()));
const dupCross = {};
for (const e of entries) {
  const k = e.word.toLowerCase();
  (dupCross[k] = dupCross[k] || new Set()).add(e.category + '/' + e.level);
}
const multi = Object.entries(dupCross).filter(([, v]) => v.size > 1);

console.log('==== 解析结果 ====');
for (const spec of LEVELS) {
  const n = spec.groups.reduce((a, b) => a + b, 0);
  console.log(`  ${spec.level.padEnd(7)} ${String(n).padStart(4)} 词   ` +
    spec.groups.map((c, i) => CATEGORIES[i].slice(0, 4) + ':' + c).join(' '));
}
console.log(`  ${'合计'.padEnd(6)} ${String(entries.length).padStart(4)} 词`);
console.log(`  去重后   ${String(uniq.size).padStart(4)} 个不同词面`);
console.log('');
console.log('==== 跨组重复的词（同一词面出现在多个 类/档）====');
console.log('  ' + multi.length + ' 个：' + multi.slice(0, 14).map(([k, v]) => k + '[' + [...v].join('|') + ']').join('  '));
console.log('');
if (problems.length) {
  console.log('❌ 有问题，未写盘：');
  for (const p of problems) console.log('   · ' + p);
  process.exit(1);
}

const payload = {
  source: 'Emotion-Feelings / Vocabulary of Emotions, Tom Drummond (tomdrummond.com), 2019',
  structure: '10 categories × 3 intensity levels (Strong/Medium/Light), row-major within each level',
  built: new Date().toISOString().slice(0, 10),
  categories: CATEGORIES.map(c => ({ name: c, kind: KIND[c] })),
  levels: LEVELS.map(l => ({ name: l.level, count: l.groups.reduce((a, b) => a + b, 0) })),
  total: entries.length,
  uniqueWords: uniq.size,
  entries,
};
fs.writeFileSync(DST, JSON.stringify(payload, null, 1), 'utf8');
console.log('✅ 全部校验通过 → ' + DST + '  (' + fs.statSync(DST).size + ' B)');
