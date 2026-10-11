// 解析 persona/reference/情绪词汇表.md（605 词表，设定者给的七类骨架）→ 结构化 JSON
//
// 结构：
//   ## 一、基础情绪（6大类）          ← 大节
//   ### 快乐（Joy）                   ← 类
//   | 词 | 释义 |
//   |---|---|
//   | **喜悦** | 愉快；高兴。 |        ← 条目（词被 ** 包住，释义可能为 —）
//
// 用法：node parse-emotion-vocab-605.js
const fs = require('fs');

const SRC = 'E:\\dsh\\_herta-clone\\persona\\reference\\情绪词汇表.md';
const DST = 'E:\\dsh\\tmp-moe\\emotion-lexicon\\emotion-vocab-605.json';

const lines = fs.readFileSync(SRC, 'utf8').split(/\r?\n/);

let section = null;
const classes = [];
let cur = null;
const meta = [];

for (const raw of lines) {
  const l = raw.trim();

  // 大节：## 一、基础情绪（6大类）
  const mSec = l.match(/^##\s+(.+)$/);
  if (mSec) { section = mSec[1]; continue; }

  // 类：### 快乐（Joy）
  const mCls = l.match(/^###\s+(.+)$/);
  if (mCls) {
    const name = mCls[1];
    // 拆出中文名与英文名："快乐（Joy）" → cn=快乐, en=Joy
    const mm = name.match(/^(.+?)（(.+?)）\s*$/);
    cur = {
      section,
      name,
      cn: mm ? mm[1] : name,
      en: mm ? mm[2] : null,
      words: [],
    };
    classes.push(cur);
    continue;
  }

  // 条目：| **喜悦** | 愉快；高兴。 |
  const mRow = l.match(/^\|\s*\*\*(.+?)\*\*\s*\|\s*(.*?)\s*\|\s*$/);
  if (mRow && cur) {
    const gloss = mRow[2] === '—' ? '' : mRow[2];
    cur.words.push({ word: mRow[1].trim(), gloss });
    continue;
  }

  // 头部说明（> 来源：…）
  if (l.startsWith('>')) meta.push(l);
}

// 展平
const entries = [];
for (const c of classes) {
  for (const w of c.words) {
    entries.push({
      word: w.word,
      gloss: w.gloss,
      section: c.section,
      className: c.name,
      classCn: c.cn,
      classEn: c.en,
    });
  }
}

// ---- 自校验 ----
const problems = [];
const uniq = new Set(entries.map(e => e.word));
const dup = {};
for (const e of entries) dup[e.word] = (dup[e.word] || 0) + 1;
const dups = Object.entries(dup).filter(([, n]) => n > 1);

const noGloss = entries.filter(e => !e.gloss).length;

console.log('==== 解析结果 ====');
console.log('  大节        ' + [...new Set(classes.map(c => c.section))].length);
console.log('  类          ' + classes.length);
console.log('  条目（词次） ' + entries.length);
console.log('  去重后词面   ' + uniq.size);
console.log('  无释义条目   ' + noGloss);
console.log('  跨类重复词   ' + dups.length);
console.log('');
console.log('==== 七类骨架 ====');
let lastSec = null;
for (const c of classes) {
  if (c.section !== lastSec) { console.log('  【' + c.section + '】'); lastSec = c.section; }
  console.log('    ' + c.name.padEnd(18) + String(c.words.length).padStart(4) + ' 词   ' +
    c.words.slice(0, 4).map(x => x.word).join(' · '));
}
console.log('');
console.log('==== 头部说明 ====');
meta.forEach(m => console.log('  ' + m));
console.log('');

if (dups.length) {
  console.log('==== 跨类重复的词（前 20）====');
  dups.slice(0, 20).forEach(([w, n]) => console.log('  ' + w + ' ×' + n));
  console.log('');
}

if (entries.length === 0) problems.push('一条都没解析出来');
if (classes.length === 0) problems.push('一个类都没解析出来');

if (problems.length) {
  console.log('❌ 有问题，未写盘：');
  problems.forEach(p => console.log('   · ' + p));
  process.exit(1);
}

const payload = {
  source: 'persona/reference/情绪词汇表.md（设定者提供，两批，2026-10-10）',
  skeleton: '七类划分（Ekman 六基础情绪 + 扩展层），设定者 2026-10-10 17:11 给出',
  built: new Date().toISOString().slice(0, 10),
  classCount: classes.length,
  entryCount: entries.length,
  uniqueWordCount: uniq.size,
  meta,
  classes: classes.map(c => ({ section: c.section, name: c.name, cn: c.cn, en: c.en, count: c.words.length })),
  entries,
};
fs.writeFileSync(DST, JSON.stringify(payload, null, 1), 'utf8');
console.log('✅ 校验通过 → ' + DST + '  (' + fs.statSync(DST).size + ' B)');
