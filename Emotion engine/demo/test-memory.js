// 情绪记忆（简化版）测试 —— 设定者 2026-10-13 规格
'use strict';
const { EmotionMemory, tokenize } = require('../src/memory');
const hr = s => '\n' + '═'.repeat(84) + '\n' + s + '\n' + '═'.repeat(84);
const f = (x, d = 4) => Number(x).toFixed(d);
let PASS = 0, FAIL = 0;
const ck = (n, ok, d = '') => { console.log('  ' + (ok ? '✅ PASS' : '❌ FAIL') + '  ' + n + (d ? '   ' + d : '')); ok ? PASS++ : FAIL++; };

// ═════════════════════════════════════════════════
console.log(hr('① 条目只有四样：轮次 / 时间戳 / 摘要 / 情绪词'));

{
  const m = new EmotionMemory();
  const e = m.add({
    turn: 12, at: '2026-10-13T13:00:00+08:00',
    summary: '用户说「你今天有点可爱」',
    emotion: '嘴上不认但心里开心',
  });
  console.log('  ' + JSON.stringify(e).slice(0, 200));
  ck('有 turn', e.turn === 12);
  ck('有 at（时间戳）', typeof e.at === 'string');
  ck('有 summary（摘要）', e.summary.length > 0);
  ck('有 emotion（情绪词）', e.emotion.length > 0);
  ck('⭐ 没有 S 字段', e.S === undefined);
  ck('⭐ 没有 recalls 字段', e.recalls === undefined);
  ck('自动切了关键词', e.keywords.length > 0, e.keywords.slice(0, 5).join('/'));
}

// ═════════════════════════════════════════════════
console.log(hr('② 遗忘曲线：只剩【一个全局 λ】，不再逐条 S'));

{
  const m = new EmotionMemory({ lambda: 0.07581 });
  console.log('  λ = ' + m.lambda + '  ⇒ 半衰期 ' + f(m.halfLife, 2) + ' 轮');
  ck('半衰期 ≈ 9.14 轮（对齐引擎 ρ=0.927）', Math.abs(m.halfLife - 9.14) < 0.02, f(m.halfLife, 3));
  const e = m.add({ turn: 0, summary: 'x', emotion: 'y' });
  ck('t=0 ⇒ R=1', Math.abs(m.retrievability(e, 0) - 1) < 1e-12);
  ck('t=半衰期 ⇒ R=0.5', Math.abs(m.retrievability(e, m.halfLife) - 0.5) < 1e-12);
  console.log('  ' + 'Δ轮'.padEnd(8) + 'R');
  for (const d of [1, 3, 5, 9.14, 15, 20, 30, 40]) {
    console.log('  ' + String(d).padEnd(8) + f(m.retrievability(e, d)));
  }
}

// ═════════════════════════════════════════════════
console.log(hr('③ ⭐ 关键词 / 摘要触发'));

{
  const m = new EmotionMemory();
  m.add({ turn: 1, summary: '用户说「你今天有点可爱」', emotion: '开心' });
  m.add({ turn: 5, summary: '用户没接话，转头说别的', emotion: '难受' });
  m.add({ turn: 9, summary: '用户说「你其实很在意吧」', emotion: '被戳中' });
  m.add({ turn: 14, summary: '聊起了原神的配队', emotion: '平静' });

  const t1 = m.retrieve(20, '你今天有点可爱');
  console.log('  hint=「你今天有点可爱」 → ' + t1.length + ' 条：' + t1.map(x => x.entry.summary.slice(0, 14)).join(' ｜ '));
  ck('命中相关记忆', t1.some(x => x.entry.summary.includes('可爱')));

  const t2 = m.retrieve(20, '你其实很在意吧');
  console.log('  hint=「你其实很在意吧」  → ' + t2.map(x => x.entry.summary.slice(0, 14)).join(' ｜ '));
  ck('命中被戳中那条', t2.some(x => x.entry.summary.includes('在意')));

  const t3 = m.retrieve(20, '毫不相关的外星话题 zzz');
  console.log('  hint=无关串 → ' + t3.length + ' 条（退回全体，按遗忘曲线）');
  ck('无命中时退回全体', t3.length > 0);

  const t4 = m.retrieve(20, null);
  ck('hint=null 时按遗忘曲线取全体', t4.length === 4);
  console.log('  排序（时间近的在前）：' + t4.map(x => '[' + x.entry.turn + ']').join(' > '));
  ck('按 R 降序（越近越前）', t4[0].entry.turn === 14);
}

// ═════════════════════════════════════════════════
console.log(hr('④ 真遗忘：R 低于 minR 就不再注入'));

{
  const m = new EmotionMemory({ lambda: 0.07581, minR: 0.05 });
  m.add({ turn: 0, summary: '很久以前的事', emotion: '淡了' });
  const e = m.entries[0];
  const tLife = Math.log(1 / 0.05) / m.lambda;
  console.log('  寿命（R 掉到 0.05）= ' + f(tLife, 1) + ' 轮');
  ck('39 轮时还在', m.retrieve(39, null, 5).length === 1);
  ck('40 轮时已遗忘', m.retrieve(40, null, 5).length === 0);
}

// ═════════════════════════════════════════════════
console.log(hr('⑤ 注入渲染：相对时间词 + "你当时…"'));

{
  const m = new EmotionMemory();
  m.add({ turn: 1, summary: '用户说「你今天有点可爱」', emotion: '嘴上不认但心里开心' });
  m.add({ turn: 15, summary: '用户说「你其实很在意吧」', emotion: '被戳中' });
  m.add({ turn: 18, summary: '用户语气重了', emotion: '生气' });
  const txt = m.render(m.retrieve(20, null, 3), 20);
  console.log(txt.split('\n').map(l => '    ' + l).join('\n'));
  ck('有标题', txt.includes('【你还记得的】'));
  ck('用相对时间词（无 ISO 时间戳）', !/\d{4}-\d{2}-\d{2}/.test(txt));
  ck('用"你当时"', txt.includes('你当时'));
}

// ═════════════════════════════════════════════════
console.log(hr('⑥ 没被用到的复杂构造【确实删了】'));

{
  const m = new EmotionMemory();
  console.log('  实例上的键: ' + Object.keys(m).join(', '));
  for (const k of ['S0', 'kEmotion', 'kRecall', 'traits', 'maxS', 'recallCount']) {
    ck('已删除 ' + k, m[k] === undefined);
  }
  for (const f2 of ['stabilityFor', 'driftVector', 'ranked', 'decayPrecision']) {
    ck('已删除方法 ' + f2, typeof m[f2] === 'undefined');
  }
  console.log('  ⭐ 只剩: add / retrievability / retrieve / render / all / size / halfLife');
}

// ═════════════════════════════════════════════════
console.log(hr('⑦ tokenize 行为'));
{
  console.log('  tokenize("用户说「你今天有点可爱」") = ' + JSON.stringify(tokenize('用户说「你今天有点可爱」').slice(0, 10)));
  ck('中文切出 2-gram', tokenize('你今天有点可爱').includes('可爱'));
  ck('英文按词切', tokenize('hello world').includes('hello'));
}

console.log(hr('汇总'));
console.log(`  ✅ PASS ${PASS}   ❌ FAIL ${FAIL}`);
process.exit(FAIL === 0 ? 0 : 1);
