// 情绪记忆模块的数值行为
'use strict';
const { EmotionMemory, valenceSign } = require('../src/memory');
const V = require('../src/space').V;

const hr = s => '\n' + '═'.repeat(92) + '\n' + s + '\n' + '═'.repeat(92);
const f = (x, d = 4) => Number(x).toFixed(d);

const hrl = s => '\n' + '─'.repeat(92) + '\n' + s + '\n' + '─'.repeat(92);

// ═══════════════════════════════════════════════════════════════
console.log(hr('① 遗忘曲线本身：R = exp(−t/S)'));
{
  const m = new EmotionMemory({ S0: 30, kEmotion: 4 });
  console.log('  S0 = 30 ⇒ R=0.5 时 t = S·ln2 = ' + f(30 * Math.LN2, 2) + ' 轮');
  console.log('');
  console.log('  ' + 't（轮）'.padEnd(9) + ['S=10', 'S=30', 'S=60', 'S=150'].map(x => x.padStart(11)).join(''));
  console.log('  ' + '-'.repeat(55));
  for (const t of [0, 5, 10, 20, 30, 50, 100, 200]) {
    const row = [10, 30, 60, 150].map(S => Math.exp(-t / S));
    console.log('  ' + String(t).padEnd(9) + row.map(x => f(x).padStart(11)).join(''));
  }
  console.log('');
  console.log('  ⭐ 同一时刻，S 越大残留越多 ⇒ "记得牢"就是把 S 做大。');
}

// ═══════════════════════════════════════════════════════════════
console.log(hr('② ⭐ 核心：情绪强度进 S —— 越强烈的情绪记得越久'));
{
  const m = new EmotionMemory({ S0: 30, kEmotion: 4 });
  console.log('  S = S0 · (1 + k·r)，S0=30、k=4');
  console.log('');
  console.log('  ' + '情绪强度 r'.padEnd(13) + 'S'.padEnd(11) + '半衰期 t'.padEnd(13) + '200 轮后 R');
  console.log('  ' + '-'.repeat(52));
  for (const r of [0.0, 0.1, 0.3, 0.5, 0.7, 0.9, 1.0]) {
    const S = m.stabilityFor(r, 'pos');
    console.log('  ' + f(r, 2).padEnd(13) + f(S, 2).padEnd(11) + f(S * Math.LN2, 2).padEnd(13) + f(Math.exp(-200 / S)));
  }
  console.log('');
  console.log('  ⭐ 语义（设定者原话）：「更容易记住让大肥鱼体验强烈的情绪及其事件」');
  console.log('     r=0.1 的记忆 200 轮后剩 ' + f(Math.exp(-200 / m.stabilityFor(0.1, 'pos'))) +
    '；r=1.0 的剩 ' + f(Math.exp(-200 / m.stabilityFor(1.0, 'pos'))));
  console.log('     ⇒ 强烈情绪的记忆【几乎不衰减】，平淡的早就没了。');
}

// ═══════════════════════════════════════════════════════════════
console.log(hr('③ 人格特质调制：记仇 / 记爱 / 记恨'));
{
  const base = { S0: 30, kEmotion: 4 };
  const configs = [
    ['平衡（都是 1.0）', { neg: 1.0, pos: 1.0, object: 1.0 }],
    ['记仇型（neg=2）', { neg: 2.0, pos: 1.0, object: 1.0 }],
    ['记爱型（pos=2）', { neg: 1.0, pos: 2.0, object: 1.0 }],
    ['记恨型（object=2）', { neg: 1.0, pos: 1.0, object: 2.0 }],
  ];
  console.log('  同一个高强事件（r=0.8），不同特质下的 S：');
  console.log('');
  console.log('  ' + '特质'.padEnd(22) + '负性·非对象'.padEnd(15) + '负性·对象'.padEnd(14) + '正性·非对象');
  console.log('  ' + '-'.repeat(66));
  for (const [label, traits] of configs) {
    const m = new EmotionMemory(Object.assign({}, base, { traits }));
    console.log('  ' + label.padEnd(22) +
      f(m.stabilityFor(0.8, 'neg', false), 2).padEnd(15) +
      f(m.stabilityFor(0.8, 'neg', true), 2).padEnd(14) +
      f(m.stabilityFor(0.8, 'pos', false), 2));
  }
  console.log('');
  console.log('  ⭐ 设定者说：「这三条只是形容人格特质的，它会影响漂移」——');
  console.log('     所以它们【不是新状态】，而是【同一个事件被记得多牢】的乘数。');
  console.log('     ⇒ 记仇型角色：负性事件 S 更大 ⇒ 检索时权重更高 ⇒ 喂给 μ.drift 的分量更大。');
}

// ═══════════════════════════════════════════════════════════════
console.log(hr('④ 注入强度随轮次的变化（一条 r=0.8 的负性记忆，平衡特质）'));
{
  const m = new EmotionMemory({ S0: 30, kEmotion: 4 });
  const S = m.stabilityFor(0.8, 'neg');
  console.log('  S = ' + f(S, 2) + '  ⇒ 半衰期 ' + f(S * Math.LN2, 2) + ' 轮');
  console.log('');
  console.log('  ' + '轮次差 t'.padEnd(11) + 'R（可提取性）'.padEnd(16) + '是否还注入（minR=0.05）'.padEnd(22) + '进度条');
  console.log('  ' + '-'.repeat(72));
  for (const t of [0, 5, 10, 20, 30, 50, 80, 120, 200, 300]) {
    const R = Math.exp(-t / S);
    const alive = R >= 0.05;
    console.log('  ' + String(t).padEnd(11) + f(R).padEnd(16) + (alive ? '✅ 是' : '❌ 已遗忘').padEnd(22) +
      '#'.repeat(Math.max(0, Math.round(R * 30))));
  }
}

// ═══════════════════════════════════════════════════════════════
console.log(hr('⑤ ⭐ 间隔重复：被反复想起 ⇒ S 增长（SuperMemo 的核心）'));
{
  const m = new EmotionMemory({ S0: 30, kEmotion: 4, kRecall: 0.5, maxS: 30 * 5 * 2 });
  m.add({
    turn: 1, at: '2026-10-13T09:00:00+08:00', event: '用户说「你今天有点可爱」',
    eventKey: '被夸奖', importance: 0.6,
    emotion: { direction: 'Happiness', octant: 'Exuberant', valence: 0.72, r: 0.6, E: [0.5, 0.4, 0.1] },
  });
  const e = m.entries[0];
  console.log('  初始 S = ' + f(e.S, 2));
  console.log('');
  console.log('  ' + '第几次被想起'.padEnd(14) + 'S 之后'.padEnd(12) + '相对初始');
  console.log('  ' + '-'.repeat(40));
  console.log('  ' + '0（初始）'.padEnd(14) + f(e.S, 2).padEnd(12) + '1.00×');
  for (let i = 1; i <= 6; i++) {
    e.S = Math.min(m.maxS, e.S * (1 + m.kRecall));
    console.log('  ' + String(i).padEnd(14) + f(e.S, 2).padEnd(12) + f(e.S / m.entries[0].S, 2) + '×');
  }
  console.log('');
  console.log('  ⚠️ 注意上面相对倍数被改写基准了 —— 真实初始 S 是 ' + f(m.stabilityFor(0.6, 'pos'), 2));
  console.log('  ⭐ 这就是"记仇"的动力学：越是被反复想起的事，S 越大、越难忘。');
}

// ═══════════════════════════════════════════════════════════════
console.log(hr('⑥ 一次完整走查：7 个事件的记忆库，在第 20 轮看还剩什么'));
{
  const m = new EmotionMemory({ S0: 30, kEmotion: 4, traits: { neg: 1.3, pos: 1.0, object: 1.0 } });
  const events = [
    [1, '夸奖', '用户说「你今天有点可爱」', '被夸奖', 0.6, { d: 'Happiness', o: 'Exuberant', v: 0.72, r: 0.27, E: [0.54, 0.39, 0.0] }],
    [3, '忽视', '用户没接话，转头说别的', '被忽视', 0.7, { d: 'Hurt', o: 'Anxious', v: -0.72, r: 0.41, E: [0.31, 0.61, -0.26] }],
    [6, '戳中', '用户说「你其实很在意吧」', '被戳中', 0.85, { d: 'Caring', o: 'Dependent', v: 0.76, r: 0.77, E: [0.63, 0.84, -0.53] }],
    [8, '责备', '用户语气重了', '被责备', 0.8, { d: 'Anger', o: 'Hostile', v: -0.81, r: 0.79, E: [0.34, 1.02, -0.22] }],
    [11, '夸奖', '用户又说了一句好话', '被夸奖', 0.6, { d: 'Happiness', o: 'Exuberant', v: 0.72, r: 0.80, E: [0.51, 1.01, -0.08] }],
    [14, '忽视', '用户又没回应', '被忽视', 0.7, { d: 'Hurt', o: 'Anxious', v: -0.72, r: 0.88, E: [0.29, 1.08, -0.32] }],
    [18, '戳中', '用户第二次戳中', '被戳中', 0.85, { d: 'Caring', o: 'Dependent', v: 0.76, r: 0.94, E: [0.58, 1.06, -0.52] }],
  ];
  for (const [turn, name, event, key, imp, emo] of events) {
    m.add({
      turn, at: '2026-10-13T09:00:00+08:00', event, eventKey: key, importance: imp,
      emotion: { direction: emo.d, octant: emo.o, valence: emo.v, r: emo.r, E: emo.E },
      toObject: turn >= 6,
    });
  }
  const NOW = 20;
  console.log('  第 ' + NOW + ' 轮时的记忆库（按注入分数排序）：');
  console.log('  ' + '写入轮'.padEnd(9) + '事件'.padEnd(22) + 'r'.padEnd(8) + 'S'.padEnd(9) + 'R'.padEnd(10) + '分数');
  console.log('  ' + '-'.repeat(70));
  for (const x of m.ranked(NOW)) {
    console.log('  ' + String(x.entry.turn).padEnd(9) + x.entry.event.slice(0, 20).padEnd(22) +
      f(x.entry.emotion.r, 2).padEnd(8) + f(x.entry.S, 2).padEnd(9) + f(x.R).padEnd(10) + f(x.score));
  }
  console.log('');
  const hits = m.retrieve(NOW, 4, { rehearse: false });
  console.log('  ⭐ 取 top-4 注入：');
  console.log(m.render(hits, NOW).split('\n').map(l => '    ' + l).join('\n'));
  console.log('');
  const dr = m.driftVector(NOW);
  console.log('  ⭐ 供 μ.drift() 的加权向量和 = ' + V.fmt(dr, 5) + '   |·|=' + f(V.norm(dr)));
}

// ═══════════════════════════════════════════════════════════════
console.log(hr('⑦ 参数敏感性：S0 与 kEmotion'));
{
  console.log('  ' + 'S0'.padEnd(7) + 'k'.padEnd(6) + 'r=0.1 的 S'.padEnd(13) + 'r=1.0 的 S'.padEnd(13) + '倍数');
  console.log('  ' + '-'.repeat(52));
  for (const S0 of [10, 20, 30, 60]) {
    for (const k of [2, 4, 8]) {
      const m = new EmotionMemory({ S0, kEmotion: k });
      const a = m.stabilityFor(0.1, 'pos'), b = m.stabilityFor(1.0, 'pos');
      console.log('  ' + String(S0).padEnd(7) + String(k).padEnd(6) + f(a, 2).padEnd(13) + f(b, 2).padEnd(13) + f(b / a, 2) + '×');
    }
  }
  console.log('');
  console.log('  ⭐ 当前的 30/4 只是本鱼的初值 —— 这两个数该由设定者按"体验"定：');
  console.log('     · S0 决定"平淡的事记多久"（30 ⇒ 半衰期 20.8 轮）');
  console.log('     · k 决定"强烈的事比平淡的事牢多少倍"（4 ⇒ 5 倍）');
}
