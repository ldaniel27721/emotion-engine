// 把 EmotionWordsChecklist(1).pdf 解析成结构化 JSON。
//
// ⚠️ 关键：必须用【bbox 抽取器】的产物（pdf-formula-extract.py 的 page-NN.txt），
//    不能用 pdf-extract.py 的 get_text() 产物。
//    实测：get_text() 对这张多列表会
//      ① 把族标题 `Hurt–betrayed` 排到文件末尾
//      ② 把它的 17 个词错归给前一个族 `Ambivalent–conflicted`（26 词 = 9 + 17）
//    bbox 版本按 (y, x) 重建视觉行后，族与词的归属完全正确。
//
// 结构：族标题（格式 `X–Y`，en dash U+2013）+ 该族下的词，同视觉行按双空格分隔。
//
// 用法：node parse-emotion-checklist.js
const fs = require('fs');
const path = require('path');

const DIR = 'E:\\dsh\\tmp-moe\\emotion-lexicon\\checklist-bbox';
const DST = 'E:\\dsh\\tmp-moe\\emotion-lexicon\\emotion-checklist.json';
const EN_DASH = '\u2013';

// ---- 收集所有页（按页序）----
const pages = fs.readdirSync(DIR).filter(f => /^page-\d+\.txt$/.test(f)).sort();
if (pages.length === 0) { console.error('❌ ' + DIR + ' 里没有 page-NN.txt'); process.exit(1); }

const families = [];
let cur = null;
const stray = [];

for (const pf of pages) {
  const lines = fs.readFileSync(path.join(DIR, pf), 'utf8').split(/\r?\n/);
  for (const raw of lines) {
    const line = raw.trim();
    if (line === '') continue;
    // ⚠️ 第 1 页的页眉是裸标题，不含 en-dash，会被当成"族标题前的散词"
    if (line === 'Emotion Words Checklist') continue;

    if (line.includes(EN_DASH)) {
      const parts = line.split(EN_DASH).map(s => s.trim()).filter(Boolean);
      cur = { header: line, anchors: parts, words: [], pages: [pf] };
      families.push(cur);
    } else {
      // 同一视觉行可能有多个词：按 2+ 空格切
      const toks = line.split(/\s{2,}/).map(s => s.trim()).filter(Boolean);
      if (!cur) { stray.push(...toks); continue; }
      for (const t of toks) cur.words.push(t);
    }
  }
}

// ---- 自校验 ----
const problems = [];
const warnings = [];

if (families.length === 0) problems.push('一个族都没解析出来');
if (stray.length) problems.push('族标题前的散词: ' + stray.join(', '));

const badHeader = families.filter(f => f.anchors.length !== 2);
if (badHeader.length) problems.push('族标题不是两段: ' + badHeader.map(f => f.header).join(' | '));

// 空族：记为警告（原表可能确实未展开），不算失败
const emptyFam = families.filter(f => f.words.length === 0);
for (const f of emptyFam) warnings.push('空族: ' + f.header);

// 同族内重复词
for (const f of families) {
  const seen = new Set();
  for (const w of f.words) {
    const k = w.toLowerCase();
    if (seen.has(k)) warnings.push(f.header + ' 内重复词: ' + w);
    seen.add(k);
  }
}

const badWords = [];
for (const f of families) for (const w of f.words) {
  if (/^[\d=]+$/.test(w) || w.length > 26 || /^(title|author|creator|producer|creationDate|subject):/.test(w)) {
    badWords.push(w + '(' + f.header + ')');
  }
}
if (badWords.length) problems.push('可疑词面: ' + badWords.slice(0, 8).join(', '));

const total = families.reduce((s, f) => s + f.words.length, 0);
const uniq = new Set();
for (const f of families) for (const w of f.words) uniq.add(w.toLowerCase());

// 跨族重复（一个词出现在多个族 = 与 Emotion-Feelings 的 41 个跨类词同性质）
const cross = {};
for (const f of families) for (const w of f.words) {
  const k = w.toLowerCase();
  (cross[k] = cross[k] || new Set()).add(f.header);
}
const multi = Object.entries(cross).filter(([, v]) => v.size > 1);

console.log('==== 解析结果（bbox 版）====');
console.log('  页数        ' + pages.length);
console.log('  族数        ' + families.length);
console.log('  词总数      ' + total);
console.log('  去重后      ' + uniq.size);
console.log('  跨族重复词  ' + multi.length);
console.log('');
console.log('==== 每族词数 ====');
const sizes = families.map(f => f.words.length).sort((a, b) => a - b);
console.log('  min ' + sizes[0] + ' / 中位 ' + sizes[(sizes.length / 2) | 0] + ' / max ' + sizes[sizes.length - 1]);
console.log('');
console.log('==== 全部族 ====');
families.forEach((f, i) => {
  console.log('  ' + String(i + 1).padStart(2) + '. ' + f.header.padEnd(24) +
    String(f.words.length).padStart(3) + ' 词  ' + f.words.slice(0, 5).join(' · '));
});
if (multi.length) {
  console.log('');
  console.log('==== 跨族重复词（模棱两可区）====');
  console.log('  ' + multi.map(([k, v]) => k + '[' + [...v].join('|') + ']').join('  '));
}
console.log('');
if (warnings.length) {
  console.log('⚠️ 警告（不阻止写盘）：');
  for (const w of warnings) console.log('   · ' + w);
  console.log('');
}
if (problems.length) {
  console.log('❌ 有问题，未写盘：');
  for (const p of problems) console.log('   · ' + p);
  process.exit(1);
}

const payload = {
  source: 'Emotion Words Checklist (2019, Creo Normalizer)',
  extraction: 'pdf-formula-extract.py (bbox-sorted) — 必须用这个，get_text() 会错归族',
  structure: 'family headers in `X–Y` form (en dash) + member words',
  built: new Date().toISOString().slice(0, 10),
  families: families.map(f => ({ header: f.header, anchors: f.anchors, count: f.words.length, words: f.words })),
  totalWords: total,
  uniqueWords: uniq.size,
  crossFamilyDuplicates: multi.map(([k, v]) => ({ word: k, families: [...v] })),
};
fs.writeFileSync(DST, JSON.stringify(payload, null, 1), 'utf8');
console.log('✅ 校验通过 → ' + DST + '  (' + fs.statSync(DST).size + ' B)');
