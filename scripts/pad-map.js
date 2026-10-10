// 按 Xu et al. (2023) 的方法，为七类骨架里的每个情绪词计算 PAD 坐标。
//   μ(w) = λ(w) · γ(w)
//     γ(w) = 该词所属 PAD 八型的单位参考向量（三分量 ±1）
//     λ(w) = 情绪强度因子，|λ| ≤ 1
//
// ⚠️ λ 的取值来源尚未裁定 —— 本脚本默认 λ = 1（纯方向版本，只定位到八型的角上）。
//    见 issue：强度如何离散成档。
const fs = require('fs');

// ---------- 八型参考向量（论文 Table 2，逐字）----------
const OCTANTS = {
  Exuberant:  { g: [1, 1, 1],   emolexion: ['Happiness (PA)', 'Love (PB)', 'Praise (PH)'] },
  Dependent:  { g: [1, 1, -1],  emolexion: ['Respect (PD)', 'Trust (PG)', 'Thinking (PF)'] },
  Relaxed:    { g: [1, -1, 1],  emolexion: ['Wish (PK)', 'Surprise (PC)'] },
  Docile:     { g: [1, -1, -1], emolexion: ['Ease (PE)'] },
  Hostile:    { g: [-1, 1, 1],  emolexion: ['Reproach (NN)', 'Anger (NA)'] },
  Anxious:    { g: [-1, 1, -1], emolexion: ['Panic (NI)', 'Fear (NC)'] },
  Disdainful: { g: [-1, -1, 1], emolexion: ['Hate (ND)', 'Jealousy (NK)', 'Suspect (NL)', 'Disappointment (NJ)'] },
  Bored:      { g: [-1, -1, -1], emolexion: ['Sadness (NB)', 'Guilt (NH)', 'Shame (NG)', 'Boredom (NE)'] },
};

// ---------- 七类骨架 → PAD 八型（⚠️ 助手推导，非论文内容，须裁定）----------
const TAX2OCT = {
  '快乐（Joy）': 'Exuberant',
  '悲伤（Sadness）': 'Bored',
  '愤怒（Anger）': 'Hostile',
  '恐惧（Fear）': 'Anxious',
  '惊讶（Surprise）': 'Relaxed',        // 依论文：Surprise(PC) 归 Relaxed
  '厌恶（Disgust）': 'Disdainful',
  '自我评价类': null,                    // 正负混杂，须拆
  '人际互动类': null,
  '目标相关情绪': null,
  '爱与联结': 'Exuberant',
  '平静与满足': 'Relaxed',
  '动力与希望': 'Exuberant',
  '焦虑与压力': 'Anxious',
  '孤独与疏离': 'Bored',
  '无力与绝望': 'Bored',
  '': null,                              // 中性情绪 → 无象限，λ≈0
  '社交场景': null,
  '生理反应': null,
  '中文特有': null,
  '西方特有': null,
};

// ---------- 从合并稿里抽 (节, 词) ----------
const md = fs.readFileSync('E:/dsh/tmp-moe/emotion-merged.md', 'utf8');
const lines = md.split('\n');
let top = '', sub = '';
const words = [];
for (const l of lines) {
  const mt = l.match(/^##\s+(.+)$/);
  if (mt) { top = mt[1]; sub = ''; continue; }
  const ms = l.match(/^###\s+(.+)$/);
  if (ms) { sub = ms[1]; continue; }
  const mw = l.match(/^\|\s+\*\*(.+?)\*\*(（.*?）)?\s*\|/);
  if (mw) words.push({ w: mw[1], top, sub });
}

const OCT = process.argv[2] ? parseFloat(process.argv[2]) : 1.0;   // λ 默认 1

const rows = words.map(x => {
  const oct = TAX2OCT[x.sub] ?? null;
  const g = oct ? OCTANTS[oct].g : null;
  const mu = g ? g.map(v => +(v * OCT).toFixed(4)) : null;
  return { ...x, oct, gamma: g, lambda: g ? OCT : 0, mu };
});

const mapped = rows.filter(r => r.mu);
const unmapped = rows.filter(r => !r.mu);

// ---------- 输出 ----------
const byOct = {};
for (const r of mapped) (byOct[r.oct] = byOct[r.oct] || []).push(r.w);

const out = [];
out.push('# PAD 坐标表（λ = ' + OCT + '）');
out.push('');
out.push('> 公式：μ(w) = λ · γ(w)　—— Xu et al. (2023) 式 (1) 的单词语形式');
out.push('> γ 取论文 Table 2 的八型单位参考向量；**λ 默认 1（纯方向版本）**');
out.push('');
for (const [o, list] of Object.entries(byOct)) {
  out.push('## ' + o + '　γ = (' + OCTANTS[o].g.join(', ') + ')　共 ' + list.length + ' 词');
  out.push('');
  out.push(list.join('、'));
  out.push('');
}
if (unmapped.length) {
  out.push('## 未映射（' + unmapped.length + ' 词）');
  out.push('');
  out.push('这些词所在的子类**正负混杂**，无法整体归到某一个象限，须逐词或拆分后裁定：');
  out.push('');
  const g2 = {};
  for (const r of unmapped) (g2[r.sub] = g2[r.sub] || []).push(r.w);
  for (const [s, l] of Object.entries(g2)) {
    out.push('- **' + (s || '(中性情绪)') + '**（' + l.length + '）：' + l.slice(0, 30).join('、') + (l.length > 30 ? ' …' : ''));
  }
  out.push('');
}
fs.writeFileSync('E:/dsh/tmp-moe/pad-coords.md', out.join('\n'), 'utf8');

console.log('λ                = ' + OCT + '   (默认纯方向版)');
console.log('总词数           = ' + rows.length);
console.log('已映射到八型     = ' + mapped.length + '   (' + (mapped.length / rows.length * 100).toFixed(1) + '%)');
console.log('未映射（混杂类） = ' + unmapped.length);
console.log('');
console.log('==== 八型分布 ====');
for (const [o, list] of Object.entries(byOct).sort((a, b) => b[1].length - a[1].length)) {
  console.log('  ' + o.padEnd(11) + 'γ=(' + OCTANTS[o].g.map(v => (v > 0 ? '+' : '−')).join(',') + ')  ' +
    String(list.length).padStart(4) + ' 词    例: ' + list.slice(0, 5).join('、'));
}
console.log('');
console.log('==== 未映射的子类 ====');
const g2 = {};
for (const r of unmapped) (g2[r.sub || '(中性)'] = g2[r.sub || '(中性)'] || []).push(r.w);
for (const [s, l] of Object.entries(g2).sort((a, b) => b[1].length - a[1].length)) {
  console.log('  ' + s.padEnd(16) + String(l.length).padStart(4) + ' 词');
}
console.log('');
console.log('输出: E:/dsh/tmp-moe/pad-coords.md');
