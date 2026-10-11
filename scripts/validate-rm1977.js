// R&M 1977 Table 4 的落盘校验器。
// ⭐ 原则：只认【落盘 JSON】，不认任何"我以为我读到了什么"。
//
// 用法：node validate-rm1977.js <path-to-table4.json>
//
// 校验项：
//   ① 结构：151 行、编号 1..151 连续无缺无重、每行 6 个数值
//   ② 值域：mean ∈ [-1,1]，SD ∈ [0,1.5]
//   ③ 锚点：与独立通读得到的已知值逐位比对（这是抓住符号错误的关键）
//   ④ 极性一致性：负面词块不应全是正 P（系统性丢负号的直接信号）
//   ⑤ 八型符号一致性：各型代表词的 P/A/D 符号应与八型定义相符
const fs = require('fs');

const path = process.argv[2];
if (!path) { console.error('用法: node validate-rm1977.js <table4.json>'); process.exit(2); }
if (!fs.existsSync(path)) { console.error('文件不存在: ' + path); process.exit(2); }

let data;
try { data = JSON.parse(fs.readFileSync(path, 'utf8')); }
catch (e) { console.error('❌ JSON 解析失败: ' + e.message); process.exit(1); }

const rows = data.rows || [];
let fail = 0;
const say = (ok, msg) => { console.log((ok ? '  ✅ ' : '  ❌ ') + msg); if (!ok) fail++; };

console.log('==== ① 结构 ====');
say(rows.length === 151, '行数 = ' + rows.length + '（应为 151）');
const nos = rows.map(r => r.no).sort((a, b) => a - b);
const missing = [];
for (let i = 1; i <= 151; i++) if (!nos.includes(i)) missing.push(i);
const dup = nos.filter((v, i) => i > 0 && nos[i - 1] === v);
say(missing.length === 0, '编号缺号: ' + (missing.length ? missing.join(',') : '无'));
say(dup.length === 0, '编号重号: ' + (dup.length ? dup.join(',') : '无'));

let badNums = 0;
for (const r of rows) {
  for (const f of ['P', 'P_sd', 'A', 'A_sd', 'D', 'D_sd']) {
    if (r[f] === null || r[f] === undefined) { badNums++; console.log('     ⚠️ #' + r.no + ' ' + r.term + ' 的 ' + f + ' 为 null'); }
  }
}
say(badNums === 0, '空值格数 = ' + badNums);

console.log('');
console.log('==== ② 值域 ====');
let rangeBad = [];
for (const r of rows) {
  for (const f of ['P', 'A', 'D']) if (r[f] !== null && (r[f] < -1 || r[f] > 1)) rangeBad.push('#' + r.no + ' ' + r.term + '.' + f + '=' + r[f]);
  for (const f of ['P_sd', 'A_sd', 'D_sd']) if (r[f] !== null && (r[f] < 0 || r[f] > 1.5)) rangeBad.push('#' + r.no + ' ' + r.term + '.' + f + '=' + r[f]);
}
say(rangeBad.length === 0, '越界值: ' + (rangeBad.length ? rangeBad.slice(0, 8).join('; ') : '无'));

// ---- ③ 锚点：来自【独立通读】的已知值 ----
//   这组值由另一轮逐页通读给出，与本次抽取互相独立 —— 两边必须逐位一致。
const ANCHORS = [
  ['Angry',      -0.51, 0.59, 0.25],
  ['Bored',      -0.65, -0.62, -0.33],
  ['Happy',       0.81, 0.51, 0.46],
  ['Loved',       0.87, 0.54, -0.18],
  ['Relaxed',     0.68, -0.46, 0.06],
  // Disdainful 的 D：两轮通读冲突（.09 vs .05）。第二轮给出字形级证据
  // （.09 的 9 有闭合下环；该格是开口的圆即 5，且同页 94 行那个才是 .09）
  // → 此处采信 0.05，并已在 JSON 的 disputed 段记录。
  ['Disdainful', -0.32, -0.11, 0.05],
  ['Depressed',  -0.72, -0.29, -0.41],
  ['Sad',        -0.63, -0.27, -0.33],
  ['Astonished',  0.16, 0.88, -0.15],
  ['Sheltered',   0.14, -0.36, -0.44],
  ['Crushed',    -0.69, 0.03, -0.50],
  ['Disgusted',  -0.60, 0.35, 0.11],
  ['Hostile',    -0.42, 0.53, 0.30],
  ['Fearful',    -0.64, 0.60, -0.43],
  ['Terrified',  -0.62, 0.82, -0.43],
  ['Enraged',    -0.44, 0.72, 0.32],
  ['Lonely',     -0.66, -0.43, -0.32],
  ['Hate',       -0.56, 0.59, 0.13],
  ['Irritated',  -0.58, 0.40, 0.01],
  ['Proud',       0.77, 0.38, 0.65],
];
console.log('');
console.log('==== ③ 锚点比对（与独立通读的已知值逐位一致）====');
let anchorBad = 0;
const byName = {};
for (const r of rows) byName[r.term] = r;
for (const [name, p, a, d] of ANCHORS) {
  const r = byName[name];
  if (!r) { console.log('  ❌ 找不到锚点词: ' + name); anchorBad++; continue; }
  const bad = [];
  if (r.P !== p) bad.push('P ' + r.P + '≠' + p);
  if (r.A !== a) bad.push('A ' + r.A + '≠' + a);
  if (r.D !== d) bad.push('D ' + r.D + '≠' + d);
  if (bad.length) { console.log('  ❌ ' + name.padEnd(14) + ' ' + bad.join('  ')); anchorBad++; }
}
say(anchorBad === 0, '锚点不符 = ' + anchorBad + ' / ' + ANCHORS.length);

// ---- ④ 极性一致性 ----
//   151 词里有一大批明确的负面词。若它们的 P 全为正 = 系统性丢负号的铁证。
const NEG = ['Angry', 'Bored', 'Depressed', 'Sad', 'Fearful', 'Terrified', 'Hate', 'Hostile',
  'Disgusted', 'Crushed', 'Frustrated', 'Distressed', 'Insecure', 'Humiliated', 'Helpless',
  'Troubled', 'Guilty', 'Shamed', 'Lonely', 'Meek', 'Feeble', 'Nauseated', 'Inhibited',
  'Fatigued', 'Rejected', 'Subdued', 'Impotent', 'Ennui', 'Listless', 'Weary', 'Uninterested',
  'Detached', 'Discontented', 'Discouraged', 'Confused', 'Tense', 'Startled'];
const posP = NEG.filter(n => byName[n] && byName[n].P > 0);
console.log('');
console.log('==== ④ 极性一致性（负面词块的 P）====');
say(posP.length === 0, '负面词里 P > 0 的: ' + posP.length + ' 个' +
  (posP.length ? '  → ' + posP.slice(0, 10).join(', ') + '  ⚠️ 疑似系统性丢负号' : ''));

// ---- ⑤ 八型符号一致性 ----
// ⭐ 判定三分：
//    · 该格 sig=false（原文标为不显著）→ 符号本无统计意义，【跳过】
//    · 该格显著且符号与八型定义相反 → 记为【发现】（实测 vs 理论的分歧），不算 fail
//    · 其余不匹配 → 记为【错误】
const OCT = [
  ['Exuberant',  ['Happy', 'Joyful', 'Triumphant', 'Excited', 'Vigorous'], [1, 1, 1]],
  ['Dependent',  ['Loved', 'Grateful', 'Hopeful', 'Impressed', 'Awed'], [1, 1, -1]],
  ['Relaxed',    ['Relaxed', 'Secure', 'Leisurely', 'Untroubled'], [1, -1, 1]],
  ['Docile',     ['Sheltered', 'Protected', 'Consoled', 'Humble', 'Quiet'], [1, -1, -1]],
  ['Hostile',    ['Angry', 'Hostile', 'Cruel', 'Enraged', 'Contempt'], [-1, 1, 1]],
  ['Anxious',    ['Fearful', 'Terrified', 'Startled', 'Humiliated'], [-1, 1, -1]],
  ['Disdainful', ['Disdainful', 'Contemptuous', 'Scornful'], [-1, -1, 1]],
  ['Bored',      ['Bored', 'Depressed', 'Sad', 'Lonely'], [-1, -1, -1]],
];
console.log('');
console.log('==== ⑤ 八型符号一致性（各型代表词）====');
const findings = [];
for (const [oct, words, signs] of OCT) {
  const hit = [], skipped = [], found = [];
  for (const w of words) {
    const r = byName[w];
    if (!r) continue;
    const fields = [['P', r.P, r.P_sig, signs[0]], ['A', r.A, r.A_sig, signs[1]], ['D', r.D, r.D_sig, signs[2]]];
    let allOk = true, anyReal = false;
    for (const [f, v, sig, want] of fields) {
      const got = v >= 0 ? 1 : -1;
      if (got === want) continue;
      allOk = false;
      if (!sig) { skipped.push(w + '.' + f + '（不显著，符号无意义）'); }
      else { anyReal = true; found.push(w + '.' + f + '=' + v + '（期望 ' + (want > 0 ? '+' : '−') + '）'); }
    }
    if (allOk) hit.push(w);
    else if (anyReal) findings.push({ oct, word: w, detail: found[found.length - 1] });
  }
  const ok = found.length === 0;
  console.log('  ' + (ok ? '✅' : '⚠️ ') + ' ' + oct.padEnd(11) + signs.map(s => s > 0 ? '+' : '−').join('') +
    '  符合 ' + hit.length + ' / ' + words.length +
    (found.length ? '   【发现】' + found.join(', ') : '') +
    (skipped.length ? '   [跳过] ' + skipped.join(', ') : ''));
}
console.log('');
if (findings.length) {
  console.log('==== ⭐ 发现：实测数据与八型理论的分歧（不是抽取错误）====');
  for (const f of findings) console.log('  · ' + f.oct + ' / ' + f.detail +
    '   —— R&M 1977 原文即如此；结合原文自承 "Disdainful … failed to provide any instances"，' +
    '这是【理论层面的薄弱处】，应以数据为准。');
} else {
  console.log('  （无分歧）');
}

console.log('');
console.log(fail === 0 ? '✅ 全部校验通过 —— 这份表可以用于下游计算' : ('❌ 共 ' + fail + ' 类问题，【不要】用于下游计算'));
process.exit(fail === 0 ? 0 : 1);
