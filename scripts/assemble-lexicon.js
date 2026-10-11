// 组装最终中文情绪词库：把【主题轴（605 表的 19 类）】与【方向轴（12 类 + 八型）】叠起来。
//
// 输入：
//   out/batch-1..4.json        396 词  方向映射（第一批）
//   out2/missing-1..3.json     204 词  方向映射（补映射，gloss 由子代理撰写）
//   emotion-vocab-605.json     599 词  主题骨架（设定者给的 19 类）
//
// 输出：
//   emotion-lexicon-final.json
//
// ⭐ 原则：只认落盘物。缺哪一批就报哪一批，绝不静默产出半成品。
//
// 用法：node assemble-lexicon.js
const fs = require('fs');
const path = require('path');

const DIR = 'E:\\dsh\\tmp-moe\\emotion-lexicon';
const DST = path.join(DIR, 'emotion-lexicon-final.json');

const ALLOWED_CAT = ['Happiness', 'Caring', 'Depression', 'Inadequate', 'Fear',
                     'Confusion', 'Hurt', 'Anger', 'Loneliness', 'Remorse', 'Contempt', 'Calm'];
const CAT_TO_OCTANT = {
  Happiness: 'Exuberant', Caring: 'Dependent', Depression: 'Bored', Inadequate: 'Bored',
  Fear: 'Anxious', Confusion: 'Anxious', Hurt: 'Anxious', Anger: 'Hostile',
  Loneliness: 'Bored', Remorse: 'Anxious', Contempt: 'Disdainful', Calm: 'Relaxed',
};
const OCTANT_SIGN = {
  Exuberant: [1, 1, 1], Dependent: [1, 1, -1], Relaxed: [1, -1, 1], Docile: [1, -1, -1],
  Hostile: [-1, 1, 1], Anxious: [-1, 1, -1], Disdainful: [-1, -1, 1], Bored: [-1, -1, -1],
};

// 已知的源文件残缺产物，不该作为独立词条落库
const DROP_WORDS = new Set(['疾首']);

const problems = [];
const dirByWord = {};

function loadDirMapping(file, label) {
  if (!fs.existsSync(file)) { problems.push('缺产出: ' + label + '  (' + file + ')'); return; }
  let arr;
  try { arr = JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch (e) { problems.push(label + ' JSON 解析失败: ' + e.message); return; }
  let n = 0;
  for (const r of arr) {
    if (!ALLOWED_CAT.includes(r.category)) { problems.push(label + ' 非法 category: ' + r.word + ' → ' + r.category); continue; }
    if (dirByWord[r.word]) { problems.push('方向映射重复词: ' + r.word + '（' + label + '）'); continue; }
    dirByWord[r.word] = { gloss: r.gloss, gloss20: r.gloss20, category: r.category, kind: r.kind, intensity: r.intensity };
    n++;
  }
  console.log('  ' + label.padEnd(22) + String(n).padStart(4) + ' 词');
}

console.log('==== 载入方向映射 ====');
for (let i = 1; i <= 4; i++) loadDirMapping(path.join(DIR, 'out', 'batch-' + i + '.json'), 'out/batch-' + i);
for (let i = 1; i <= 3; i++) loadDirMapping(path.join(DIR, 'out2', 'missing-' + i + '.json'), 'out2/missing-' + i);
console.log('  方向映射合计            ' + String(Object.keys(dirByWord).length).padStart(4) + ' 词');
console.log('');

const vocab = JSON.parse(fs.readFileSync(path.join(DIR, 'emotion-vocab-605.json'), 'utf8'));
console.log('==== 载入主题骨架 ====');
console.log('  605 表                  ' + String(vocab.entries.length).padStart(4) + ' 词 / ' + vocab.classCount + ' 类');
console.log('');

// ---- 组装 ----
const entries = [];
const missingDir = [];
for (const e of vocab.entries) {
  if (DROP_WORDS.has(e.word)) continue;
  const d = dirByWord[e.word];
  if (!d) { missingDir.push(e.word); continue; }
  entries.push({
    word: e.word,
    gloss20: d.gloss20,
    theme: e.className,          // 主题轴（19 类）
    themeSection: e.section,
    category: d.category,        // 方向轴（12 类）
    octant: CAT_TO_OCTANT[d.category],
    sign: OCTANT_SIGN[CAT_TO_OCTANT[d.category]],
    kind: d.kind,
    intensity: d.intensity,
  });
}

// ---- 校验 ----
const warnings = [];

if (missingDir.length) {
  warnings.push('605 表里有 ' + missingDir.length + ' 个词还没方向映射（会出现在下一批）: ' +
    missingDir.slice(0, 20).join(' · ') + (missingDir.length > 20 ? ' …' : ''));
}

const longGloss = entries.filter(e => !e.gloss20 || e.gloss20.length > 20);
if (longGloss.length) warnings.push('gloss20 缺失或超 20 字: ' + longGloss.length + ' 个 — ' +
  longGloss.slice(0, 8).map(e => e.word + '(' + (e.gloss20 ? e.gloss20.length : '空') + ')').join(', '));

const unused = Object.keys(dirByWord).filter(w => !vocab.entries.some(e => e.word === w));
if (unused.length) warnings.push('方向映射里有 ' + unused.length + ' 个词不在 605 表里: ' + unused.slice(0, 10).join(' · '));

// 分布
const byTheme = {}, byCat = {}, byOct = {}, byKind = {}, byInt = {};
for (const e of entries) {
  byTheme[e.theme] = (byTheme[e.theme] || 0) + 1;
  byCat[e.category] = (byCat[e.category] || 0) + 1;
  byOct[e.octant] = (byOct[e.octant] || 0) + 1;
  byKind[e.kind] = (byKind[e.kind] || 0) + 1;
  byInt[e.intensity] = (byInt[e.intensity] || 0) + 1;
}

console.log('==== 组装结果 ====');
console.log('  落库词数                ' + entries.length + '（605 表的 ' + vocab.entries.length + ' 减去 ' + DROP_WORDS.size + ' 个残缺产物）');
console.log('');
console.log('==== 主题轴分布（19 类，设定者给的）====');
Object.entries(byTheme).sort((a, b) => b[1] - a[1]).forEach(([k, n]) => console.log('  ' + k.padEnd(20) + String(n).padStart(4)));
console.log('');
console.log('==== 方向轴分布（12 类 → 八型）====');
ALLOWED_CAT.forEach(c => { if (byCat[c]) console.log('  ' + c.padEnd(12) + String(byCat[c]).padStart(4) + '   → ' + CAT_TO_OCTANT[c]); });
console.log('');
console.log('==== 八型方向分布 ====');
Object.entries(byOct).sort((a, b) => b[1] - a[1]).forEach(([k, n]) => console.log('  ' + k.padEnd(12) + String(n).padStart(4)));
console.log('');
console.log('  kind:      ' + Object.entries(byKind).map(([k, n]) => k + ' ' + n).join('   '));
console.log('  intensity: ' + Object.entries(byInt).map(([k, n]) => k + ' ' + n).join('   '));
console.log('');
if (warnings.length) {
  console.log('⚠️ 警告：');
  warnings.forEach(w => console.log('   · ' + w));
  console.log('');
}
if (problems.length) {
  console.log('❌ 有问题，未写盘：');
  problems.forEach(p => console.log('   · ' + p));
  process.exit(1);
}

const payload = {
  name: '中文情绪词库（离线查表用）',
  purpose: '给大肥鱼的情绪模型提供【词 → 释义 + 主题 + 方向约束】的离线查询表；运行时查表，不实时解析',
  architecture: {
    themeAxis: '主题轴 —— 这个词讲的是什么场景/对象（设定者 2026-10-10 给的 19 类骨架）',
    directionAxis: '方向轴 —— 这个情绪往哪走（12 类，来自 Emotion-Feelings 体系）',
    octant: '方向的具体取值（Mehrabian 八型 → A1 球体方向）',
    note: '两轴正交：一个词同时有主题和方向',
  },
  sources: {
    theme: 'persona/reference/情绪词汇表.md（设定者提供，605 词 / 19 类）',
    direction: 'Emotion-Feelings (tomdrummond.com) 10 类 + Calm（补第 12 类）',
    octant: 'Mehrabian 八型 → 球体方向（A1/A2/A3）',
    reference: 'R&M 1977 Table 4（151 词 PAD 实测）',
  },
  built: new Date().toISOString().slice(0, 10),
  total: entries.length,
  categories: ALLOWED_CAT,
  categoryToOctant: CAT_TO_OCTANT,
  octantSign: OCTANT_SIGN,
  counts: { byTheme, byCategory: byCat, byOctant: byOct, byKind, byIntensity: byInt },
  entries,
};
fs.writeFileSync(DST, JSON.stringify(payload, null, 1), 'utf8');
console.log('✅ 组装完成 → ' + DST + '  (' + fs.statSync(DST).size + ' B)');
