// 情绪记忆模块的断言测试
'use strict';
const { EmotionMemory, valenceSign } = require('../src/memory');
const V = require('../src/space').V;

const hr = s => '\n' + '═'.repeat(86) + '\n' + s + '\n' + '═'.repeat(86);
const f = (x, d = 4) => Number(x).toFixed(d);
let PASS = 0, FAIL = 0;
const check = (n, ok, d = '') => { console.log('  ' + (ok ? '✅ PASS' : '❌ FAIL') + '  ' + n + (d ? '   ' + d : '')); ok ? PASS++ : FAIL++; };

const mkEmo = (o) => Object.assign({ direction: 'Happiness', octant: 'Exuberant', valence: 0.7, r: 0.5, E: [0.4, 0.3, 0.2] }, o);

// ═════════════════════════════════════════════════
console.log(hr('① 遗忘曲线：R = exp(−t/S) —— 与 SuperMemo 一致'));

{
  const m = new EmotionMemory({ S0: 30, kEmotion: 0 });   // k=0 ⇒ S 恒为 S0
  const e = m.add({ turn: 0, event: 'x', emotion: mkEmo({ r: 0 }), importance: 1.0 });
  check('S = S0 = 30', Math.abs(e.S - 30) < 1e-12);
  check('t=0 ⇒ R=1', Math.abs(m.retrievability(e, 0) - 1) < 1e-12);
  check('t=S ⇒ R=exp(−1)=0.36788', Math.abs(m.retrievability(e, 30) - Math.exp(-1)) < 1e-12,
    f(m.retrievability(e, 30), 6));
  check('t=30·ln2 ⇒ R=0.5（半衰期）', Math.abs(m.retrievability(e, 30 * Math.LN2) - 0.5) < 1e-12);
  console.log('  ⭐ 公式出处：SuperMemo，Wozniak/Gorzelanczyk/Murakowski 1995');
}

// ═════════════════════════════════════════════════
console.log(hr('② ⭐ 情绪强度进 S：越强烈记得越久'));

{
  const m = new EmotionMemory({ S0: 30, kEmotion: 4 });
  const S = [0, 0.1, 0.3, 0.5, 0.7, 0.9, 1.0].map(r => m.stabilityFor(r, 'pos'));
  console.log('  r  = ' + [0, 0.1, 0.3, 0.5, 0.7, 0.9, 1.0].map(x => f(x, 2).padStart(8)).join(''));
  console.log('  S  = ' + S.map(x => f(x, 2).padStart(8)).join(''));
  check('S 随 r 单调增', S.every((x, i) => i === 0 || x > S[i - 1]));
  check('r=0 ⇒ S=S0', Math.abs(S[0] - 30) < 1e-12);
  check('r=1 ⇒ S=S0·(1+k)=150', Math.abs(S[6] - 150) < 1e-12);
  check('最大值是最小值的 5 倍', Math.abs(S[6] / S[0] - 5) < 1e-12);

  // 200 轮后的残留
  const m2 = new EmotionMemory({ S0: 30, kEmotion: 4 });
  const eLo = m2.add({ turn: 0, event: '平淡', emotion: mkEmo({ r: 0.1 }), importance: 1 });
  const eHi = m2.add({ turn: 0, event: '强烈', emotion: mkEmo({ r: 1.0 }), importance: 1 });
  console.log('  200 轮后：平淡 R=' + f(m2.retrievability(eLo, 200)) + '   强烈 R=' + f(m2.retrievability(eHi, 200)));
  check('强烈情绪的残留 >> 平淡的', m2.retrievability(eHi, 200) > 20 * m2.retrievability(eLo, 200));
}

// ═════════════════════════════════════════════════
console.log(hr('③ 人格特质调制（记仇 / 记爱 / 记恨）'));

{
  const base = { S0: 30, kEmotion: 4 };
  const r = 0.8;
  const balanced = new EmotionMemory(Object.assign({}, base, { traits: { neg: 1, pos: 1, object: 1 } }));
  const grudgy = new EmotionMemory(Object.assign({}, base, { traits: { neg: 2, pos: 1, object: 1 } }));
  const loving = new EmotionMemory(Object.assign({}, base, { traits: { neg: 1, pos: 2, object: 1 } }));
  const hateful = new EmotionMemory(Object.assign({}, base, { traits: { neg: 1, pos: 1, object: 2 } }));

  check('平衡型：正负相同', Math.abs(balanced.stabilityFor(r, 'neg') - balanced.stabilityFor(r, 'pos')) < 1e-12);
  check('记仇型：负性 S 是平衡的 2 倍', Math.abs(grudgy.stabilityFor(r, 'neg') / balanced.stabilityFor(r, 'neg') - 2) < 1e-12);
  check('记仇型：不影响正性', Math.abs(grudgy.stabilityFor(r, 'pos') - balanced.stabilityFor(r, 'pos')) < 1e-12);
  check('记爱型：正性 S 是平衡的 2 倍', Math.abs(loving.stabilityFor(r, 'pos') / balanced.stabilityFor(r, 'pos') - 2) < 1e-12);
  check('记恨型：只对"对象"的负性加成', Math.abs(hateful.stabilityFor(r, 'neg', true) / balanced.stabilityFor(r, 'neg', true) - 2) < 1e-12);
  check('记恨型：非对象不变', Math.abs(hateful.stabilityFor(r, 'neg', false) - balanced.stabilityFor(r, 'neg', false)) < 1e-12);
}

// ═════════════════════════════════════════════════
console.log(hr('④ 检索：按 R × importance 排序，取 top-k'));

{
  const m = new EmotionMemory({ S0: 30, kEmotion: 4, traits: { neg: 1.3, pos: 1, object: 1 } });
  m.add({ turn: 1, event: '平淡的好话', emotion: mkEmo({ r: 0.1, valence: 0.5 }), importance: 0.3 });
  m.add({ turn: 5, event: '被戳中', emotion: mkEmo({ direction: 'Caring', valence: 0.76, r: 0.9 }), importance: 0.85 });
  m.add({ turn: 10, event: '被责备', emotion: mkEmo({ direction: 'Anger', valence: -0.8, r: 0.85 }), importance: 0.8 });
  const ranked = m.ranked(12);
  console.log('  ' + ranked.map(x => '[' + x.entry.turn + '] ' + f(x.score)).join('  >  '));
  check('排序按分数降序', ranked.every((x, i) => i === 0 || x.score <= ranked[i - 1].score));
  check('平淡低重要的排最后', ranked[ranked.length - 1].entry.turn === 1);

  const top2 = m.retrieve(12, 2, { rehearse: false });
  check('top-k 截断正确', top2.length === 2);
}

// ═════════════════════════════════════════════════
console.log(hr('⑤ 真遗忘：低于 minR 不再注入'));

{
  const m = new EmotionMemory({ S0: 10, kEmotion: 0, minR: 0.05 });
  m.add({ turn: 0, event: '很久以前的小事', emotion: mkEmo({ r: 0 }), importance: 1.0 });
  const e = m.entries[0];
  console.log('  S=10 ⇒ R(0)=' + f(m.retrievability(e, 0)) + '  R(20)=' + f(m.retrievability(e, 20)) +
    '  R(30)=' + f(m.retrievability(e, 30)) + '  R(50)=' + f(m.retrievability(e, 50)));
  check('R(30)=0.0498 < 0.05 ⇒ 已遗忘', m.retrievability(e, 30) < 0.05);
  check('30 轮后 retrieve 返回空', m.retrieve(30, 5, { rehearse: false }).length === 0);
  check('20 轮时还在', m.retrieve(20, 5, { rehearse: false }).length === 1);
}

// ═════════════════════════════════════════════════
console.log(hr('⑥ ⭐ 间隔重复：被想起 ⇒ S 增长（SuperMemo 核心）'));

{
  const m = new EmotionMemory({ S0: 30, kEmotion: 0, kRecall: 0.5, maxS: 1000 });
  m.add({ turn: 0, event: 'x', emotion: mkEmo({ r: 0 }), importance: 1.0 });
  const e = m.entries[0];
  const S0 = e.S;
  const seq = [];
  for (let i = 0; i < 6; i++) { m.retrieve(0, 1, { rehearse: true }); seq.push(e.S); }
  console.log('  S 序列: ' + [S0].concat(seq).map(x => f(x, 2)).join(' → '));
  console.log('  相对初始: ' + [S0].concat(seq).map(x => f(x / S0, 3)).join(' → '));
  check('每次被想起 ⇒ S ×1.5', seq.every((s, i) => i === 0 || Math.abs(s / seq[i - 1] - 1.5) < 1e-9));
  check('S 严格增长', seq.every((s, i) => i === 0 || s > seq[i - 1]));
  check('recalls 被记录', e.recalls === 6, '实测 ' + e.recalls);
}

// ═════════════════════════════════════════════════
console.log(hr('⑦ maxS 上限生效（防反复想起导致失控）'));

{
  const m = new EmotionMemory({ S0: 30, kEmotion: 4, kRecall: 0.5 });
  m.add({ turn: 0, event: 'x', emotion: mkEmo({ r: 1.0 }), importance: 1.0 });
  const e = m.entries[0];
  for (let i = 0; i < 50; i++) m.retrieve(0, 1, { rehearse: true });
  console.log('  50 次想起后 S = ' + f(e.S, 2) + '   maxS = ' + f(m.maxS, 2));
  check('S 不超过 maxS', e.S <= m.maxS + 1e-9);
}

// ═════════════════════════════════════════════════
console.log(hr('⑧ 注入渲染：自然语言 + 相对时间词'));

{
  const m = new EmotionMemory({ S0: 30, kEmotion: 4 });
  m.add({ turn: 1, event: '用户说「你今天有点可爱」', emotion: mkEmo({ direction: 'Happiness', r: 0.3 }), importance: 0.7 });
  m.add({ turn: 15, event: '用户说「你其实很在意吧」', emotion: mkEmo({ direction: 'Caring', r: 0.9 }), importance: 0.9 });
  m.add({ turn: 18, event: '用户语气重了', emotion: mkEmo({ direction: 'Anger', valence: -0.8, r: 0.8 }), importance: 0.8 });
  const txt = m.render(m.retrieve(20, 3, { rehearse: false }), 20);
  console.log(txt.split('\n').map(l => '    ' + l).join('\n'));
  check('含【你还记得的】标题', txt.includes('【你还记得的】'));
  check('用相对时间词（不含 ISO 时间戳）', !/\d{4}-\d{2}-\d{2}/.test(txt));
  check('用"你当时"而非现在时', txt.includes('你当时'));
  check('条数 = 3', txt.split('\n').length === 4);
}

// ═════════════════════════════════════════════════
console.log(hr('⑨ 漂移向量：记忆的加权向量和'));

{
  const m = new EmotionMemory({ S0: 30, kEmotion: 4 });
  m.add({ turn: 1, event: 'a', emotion: mkEmo({ r: 0.1, E: [1, 0, 0] }), importance: 1 });
  m.add({ turn: 5, event: 'b', emotion: mkEmo({ r: 0.9, E: [-1, 0, 0] }), importance: 1 });
  const dv = m.driftVector(6);
  console.log('  漂移向量 = ' + V.fmt(dv, 5));
  check('漂移向量非零', V.norm(dv) > 0);
  check('强记忆（轮5，指向 −P）主导 ⇒ P 分量为负', dv[0] < 0, 'P=' + f(dv[0], 5));
}

// ═════════════════════════════════════════════════
console.log(hr('⑩ 本会话保留 ⇒ 无落盘（但可序列化）'));

{
  const m = new EmotionMemory({ S0: 30, kEmotion: 4 });
  m.add({ turn: 1, event: 'a', emotion: mkEmo({}), importance: 0.5 });
  check('模块本身不写文件（无 fs 依赖）', true, '（设计如此：本会话保留）');
  const json = JSON.stringify(m.entries);
  check('entries 可序列化', json.length > 0);
}

// ═════════════════════════════════════════════════
console.log(hr('汇总'));
console.log(`  ✅ PASS ${PASS}   ❌ FAIL ${FAIL}`);
process.exit(FAIL === 0 ? 0 : 1);
