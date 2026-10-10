// Chen & Cui (2018, Journal of Computers 29(1):99-111) 的 Table 1：
// PAD 空间里 24 个情绪的【真实坐标】。
// 本脚本：① 反算 λ 与 γ   ② 定象限   ③ 与 Xu et al. (2023) 的八型归属对撞
//        ④ 把 Chen 的真实方向拿来精化「大肥鱼」词汇表所用的 γ
const fs = require('fs');

// Table 1 逐字（NO., emotion, P, A, D）
const T1 = [
  [1, 'admiration', 0.5, 0.3, -0.2], [2, 'angry', -0.51, 0.59, 0.25],
  [3, 'disgust', -0.4, 0.2, 0.1], [4, 'disappoint', -0.3, 0.1, -0.4],
  [5, 'pain', -0.4, -0.2, -0.5], [6, 'afraid', -0.64, 0.6, -0.43],
  [7, 'fear', -0.5, 0.3, -0.7], [8, 'gloat', 0.3, -0.3, -0.1],
  [9, 'satisfaction', 0.6, 0.5, 0.4], [10, 'grateful', 0.4, 0.2, -0.3],
  [11, 'happy', 0.4, 0.2, 0.2], [12, 'hate', -0.6, 0.6, 0.3],
  [13, 'hope', 0.2, 0.2, -0.1], [14, 'delight', 0.4, 0.2, 0.1],
  [15, 'like', 0.4, 0.16, -0.24], [16, 'love', 0.3, 0.1, 0.2],
  [17, 'sympathy', -0.4, -0.2, -0.5], [18, 'arrogance', 0.4, 0.3, 0.3],
  [19, 'relaxed', 0.2, -0.3, 0.4], [20, 'remorse', -0.3, 0.1, -0.6],
  [21, 'reproach', -0.3, -0.1, 0.4], [22, 'resentment', -0.2, -0.3, -0.2],
  [23, 'contentment', 0.3, -0.2, 0.4], [24, 'shame', -0.3, 0.1, -0.6],
];

const octantOf = (p, a, d) => {
  const s = v => (v >= 0 ? '+' : '-');
  const key = s(p) + s(a) + s(d);
  return { '+++': 'Exuberant', '++-': 'Dependent', '+-+': 'Relaxed', '+--': 'Docile',
           '-++': 'Hostile', '-+-': 'Anxious', '--+': 'Disdainful', '---': 'Bored' }[key];
};

// Xu et al. (2023) Table 2 的归属（只列 Chen 表里出现的）
const XU = {
  admiration: null, angry: 'Hostile', disgust: null, disappoint: 'Disdainful',
  pain: null, afraid: 'Anxious', fear: 'Anxious', gloat: null,
  satisfaction: null, grateful: null, happy: 'Exuberant', hate: 'Disdainful',
  hope: null, delight: null, like: null, love: 'Exuberant',
  sympathy: null, arrogance: null, relaxed: null, remorse: null,
  reproach: 'Hostile', resentment: null, contentment: null, shame: 'Bored',
};

const rows = T1.map(([no, emo, p, a, d]) => {
  const mag = Math.sqrt(p * p + a * a + d * d);      // = λ（因 γ 取单位向量）
  const g = [p / mag, a / mag, d / mag];              // 单位方向 γ
  const oct = octantOf(p, a, d);
  return { no, emo, p, a, d, lambda: mag, gamma: g, oct, xu: XU[emo] };
});

const conflicts = rows.filter(r => r.xu && r.xu !== r.oct);

console.log('==== 24 点的 λ（模长）与单位方向 γ，及象限 ====');
console.log('  #  情绪          P      A      D      λ      γ=(P,A,D)              象限           Xu 归属');
for (const r of rows) {
  const g = '(' + r.gamma.map(v => v.toFixed(3).padStart(6)).join(',') + ')';
  const mark = r.xu && r.xu !== r.oct ? '  ⚠️' : '';
  console.log('  ' + String(r.no).padStart(2) + '  ' + r.emo.padEnd(12) +
    r.p.toFixed(2).padStart(6) + r.a.toFixed(2).padStart(7) + r.d.toFixed(2).padStart(7) +
    r.lambda.toFixed(3).padStart(8) + '  ' + g.padEnd(24) + r.oct.padEnd(11) +
    (r.xu || '—') + mark);
}

console.log('');
console.log('==== ⚠️ 两篇的象限归属冲突（' + conflicts.length + ' 处）====');
for (const r of conflicts) {
  console.log('  ' + r.emo.padEnd(12) + 'Xu: ' + r.xu.padEnd(11) +
    'Chen 坐标推得: ' + r.oct.padEnd(11) +
    ' 坐标 ' + '(' + [r.p, r.a, r.d].join(', ') + ')');
}

console.log('');
console.log('==== λ 的实测范围 ====');
const ls = rows.map(r => r.lambda).sort((a, b) => a - b);
console.log('  min=' + ls[0].toFixed(3) + '  中位=' + ls[Math.floor(ls.length / 2)].toFixed(3) + '  max=' + ls[ls.length - 1].toFixed(3));
console.log('  ⭐ 全部坐标都在 [−0.7, 0.6] 内 —— 【没有点到达 ±1 的球面】');
console.log('');
console.log('  λ 最小三个: ' + rows.slice().sort((a, b) => a.lambda - b.lambda).slice(0, 3).map(r => r.emo + '(' + r.lambda.toFixed(3) + ')').join('  '));
console.log('  λ 最大三个: ' + rows.slice().sort((a, b) => b.lambda - a.lambda).slice(0, 3).map(r => r.emo + '(' + r.lambda.toFixed(3) + ')').join('  '));

console.log('');
console.log('==== 八型分布（Chen 的 24 点）====');
const byOct = {};
for (const r of rows) (byOct[r.oct] = byOct[r.oct] || []).push(r.emo);
for (const [o, l] of Object.entries(byOct).sort((a, b) => b[1].length - a[1].length)) {
  console.log('  ' + o.padEnd(11) + String(l.length).padStart(3) + ' 词   ' + l.join('、'));
}
const missing = ['Exuberant', 'Dependent', 'Relaxed', 'Docile', 'Hostile', 'Anxious', 'Disdainful', 'Bored']
  .filter(o => !byOct[o]);
console.log('  未出现的象限: ' + (missing.length ? missing.join('、') : '（无，八个都覆盖到了）'));

const out = {
  source: 'Chen & Cui (2018) Journal of Computers 29(1):99-111, Table 1',
  points: rows.map(r => ({ no: r.no, emotion: r.emo, P: r.p, A: r.a, D: r.d, lambda: +r.lambda.toFixed(4), gamma: r.gamma.map(v => +v.toFixed(4)), octant: r.oct, xu2023: r.xu })),
  conflicts: conflicts.map(r => ({ emotion: r.emo, xu2023: r.xu, chen2018: r.oct, coord: [r.p, r.a, r.d] })),
};
fs.writeFileSync('E:/dsh/tmp-moe/pad-chen24.json', JSON.stringify(out, null, 2), 'utf8');
console.log('');
console.log('输出: E:/dsh/tmp-moe/pad-chen24.json');
