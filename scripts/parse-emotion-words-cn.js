// 解析中文情绪词表 emotion-words-raw.txt → 结构化 JSON
//
// 源文件的两个坑（都不在词上，在换行上）：
//   ① 行内粘连：有些行含【多条】条目，例如
//        行 15  喜出望外：遇到出乎意外的喜事而特别高兴。畅快：舒畅、快乐。
//        行 31  痛苦：身体或精神感到非常难受。惨然：形容心里悲惨。
//      → 不能按行切，必须在行内也按 `词：` 切
//   ② 多词共用释义：
//        舒服、舒坦：精神上感到轻松愉快。
//        入迷、着迷：对人或事物产生难以舍弃的爱好。
//      → 一个条目的"词域"可以是用 `、` 分隔的多个词
//
// 切分规则：用 /([\u4e00-\u9fa5、]{2,12})：/g 找条目起点。
//   词域限定为【纯中文 + 顿号】的 2~12 字串 → 天然避开释义里的标点与数字编号，
//   所以不会把释义内的内容误判成新条目。
//
// 用法：node parse-emotion-words-cn.js
const fs = require('fs');

const SRC = 'E:\\dsh\\tmp-moe\\emotion-words-raw.txt';
const DST = 'E:\\dsh\\tmp-moe\\emotion-lexicon\\emotion-words-cn.json';

const raw = fs.readFileSync(SRC, 'utf8').split(/\r?\n/);

const items = [];
const skipped = [];
const WORD_RE = /([\u4e00-\u9fa5、]{2,12})：/g;

for (let i = 0; i < raw.length; i++) {
  const line = raw[i].trim();
  if (line === '') continue;
  // 首行是说明，不是条目
  if (i === 0 && !WORD_RE.test(line)) { skipped.push({ line: i + 1, text: line, why: '文件说明行' }); continue; }
  WORD_RE.lastIndex = 0;

  // 收集本行所有条目起点的位置
  const hits = [];
  let m;
  while ((m = WORD_RE.exec(line)) !== null) {
    hits.push({ wordsRaw: m[1], start: m.index, afterColon: m.index + m[0].length });
  }

  if (hits.length === 0) {
    // 既不是说明行、也没有 `词：` —— 可能是上一条目释义的软换行延续
    if (items.length) {
      items[items.length - 1].gloss += line.replace(/。$/, '');
      skipped.push({ line: i + 1, text: line, why: '并入上一条释义（软换行）' });
    } else {
      skipped.push({ line: i + 1, text: line, why: '无法归类' });
    }
    continue;
  }

  hits.forEach((h, k) => {
    const end = (k + 1 < hits.length) ? hits[k + 1].start : line.length;
    let gloss = line.slice(h.afterColon, end).trim().replace(/。+$/, '');
    const words = h.wordsRaw.split('、').map(s => s.trim()).filter(Boolean);
    items.push({ line: i + 1, words, gloss });
  });
}

// ---- 展平成"一词一条" ----
const entries = [];
for (const it of items) {
  for (const w of it.words) {
    entries.push({ word: w, gloss: it.gloss, srcLine: it.line });
  }
}

// ---- 自校验 ----
const problems = [];
const warnings = [];

if (items.length === 0) problems.push('一条都没解析出来');

const emptyGloss = items.filter(it => !it.gloss);
if (emptyGloss.length) problems.push('空释义条目: ' + emptyGloss.slice(0, 6).map(it => it.words.join('/')).join(', '));

const longGloss = items.filter(it => it.gloss.length > 20);
if (longGloss.length) warnings.push('释义 > 20 字的条目: ' + longGloss.length + ' / ' + items.length +
  '  —— 设定者要求 ≤20 字，需压缩');

const dupWord = {};
for (const e of entries) dupWord[e.word] = (dupWord[e.word] || 0) + 1;
const dups = Object.entries(dupWord).filter(([, n]) => n > 1);
if (dups.length) warnings.push('重复词: ' + dups.map(([w, n]) => w + '×' + n).join(', '));

const tooShort = entries.filter(e => e.word.length < 2);
if (tooShort.length) problems.push('过短词面: ' + tooShort.map(e => e.word).join(', '));

// 释义长度分布
const lens = items.map(it => it.gloss.length).sort((a, b) => a - b);
const pct = q => lens[Math.min(lens.length - 1, Math.floor(lens.length * q))];

console.log('==== 解析结果 ====');
console.log('  条目数（一个条目可含多个词）  ' + items.length);
console.log('  展平后词数                    ' + entries.length);
console.log('  去重后词数                    ' + new Set(entries.map(e => e.word)).size);
console.log('  被跳过的行                    ' + skipped.length);
console.log('');
console.log('==== 释义长度分布（字符）====');
console.log('  min ' + lens[0] + ' / 25% ' + pct(0.25) + ' / 中位 ' + pct(0.5) + ' / 75% ' + pct(0.75) + ' / max ' + lens[lens.length - 1]);
console.log('  ≤20 字占比  ' + (100 * lens.filter(n => n <= 20).length / lens.length).toFixed(1) + '%');
console.log('');
console.log('==== 多词共用释义的条目（前 12）====');
items.filter(it => it.words.length > 1).slice(0, 12)
  .forEach(it => console.log('  ' + it.words.join('、') + '  →  ' + it.gloss.slice(0, 30)));
console.log('');
if (skipped.length) {
  console.log('==== 被跳过的行 ====');
  skipped.slice(0, 8).forEach(s => console.log('  行 ' + s.line + ' [' + s.why + '] ' + s.text.slice(0, 46)));
  if (skipped.length > 8) console.log('  …共 ' + skipped.length + ' 行');
  console.log('');
}
if (warnings.length) {
  console.log('⚠️ 警告：');
  for (const w of warnings) console.log('   · ' + w);
  console.log('');
}
if (problems.length) {
  console.log('❌ 有问题，未写盘：');
  for (const p of problems) console.log('   · ' + p);
  process.exit(1);
}

const payload = {
  source: 'emotion-words-raw.txt（500 个描述情绪的词汇 + 释义）',
  structure: '`词[、词]*：释义`；行内可含多条，词域可含多个词',
  built: new Date().toISOString().slice(0, 10),
  itemCount: items.length,
  wordCount: entries.length,
  uniqueWordCount: new Set(entries.map(e => e.word)).size,
  entries,
};
fs.writeFileSync(DST, JSON.stringify(payload, null, 1), 'utf8');
console.log('✅ 校验通过 → ' + DST + '  (' + fs.statSync(DST).size + ' B)');
