// 情绪记忆（修正版）测试 —— S 挂评价层 · 针对情绪衰减
'use strict';
const { EmotionMemory, tokenize } = require('../src/memory');
const hr = s => '\n' + '═'.repeat(84) + '\n' + s + '\n' + '═'.repeat(84);
const f = (x, d = 4) => Number(x).toFixed(d);
let PASS = 0, FAIL = 0;
const ck = (n, ok, d = '') => { console.log('  ' + (ok ? '✅ PASS' : '❌ FAIL') + '  ' + n + (d ? '   ' + d : '')); ok ? PASS++ : FAIL++; };

// ═════════════════════════════════════════════════
console.log(hr('① 语义：这是【情绪的衰减】，不是记忆'));

{
  const m = new EmotionMemory({ S0: 30, k: 4 });
  const e = m.add({ turn: 0, summary: '用户夸了你', emotion: '开心', intensity: 0.5 });
  console.log('  条目的键: ' + Object.keys(e).join(', '));
  ck('有 intensity（来自评价层）', typeof e.intensity === 'number');
  ck('有 S（写入时定下）', typeof e.S === 'number');
  ck('⭐ 方法名是 residual（情绪残余），不是 retrievability', typeof m.residual === 'function');
  ck('⭐ 不再是 retrievability', typeof m.retrievability === 'undefined');
  ck('⭐ 有 emotionLife（这条情绪还能持续多久）', typeof m.emotionLife === 'function');
}

// ═════════════════════════════════════════════════
console.log(hr('② ⭐ S 挂评价层：S = S0·(1 + k·intensity)'));

{
  const m = new EmotionMemory({ S0: 30, k: 4 });
  console.log('  ' + 'intensity'.padEnd(12) + 'S'.padEnd(10) + '半衰期(轮)'.padEnd(14) + '情绪寿命(轮)');
  console.log('  ' + '-'.repeat(52));
  for (const i of [0, 0.1, 0.3, 0.5, 0.7, 0.9, 1.0]) {
    const S = m.stabilityFor(i);
    console.log('  ' + f(i, 2).padEnd(12) + f(S, 1).padEnd(10) + f(S * Math.LN2, 1).padEnd(14) + f(S * Math.log(1 / 0.05), 0));
  }
  ck('intensity=0 ⇒ S=S0', Math.abs(m.stabilityFor(0) - 30) < 1e-12);
  ck('intensity=1 ⇒ S=S0(1+k)=150', Math.abs(m.stabilityFor(1) - 150) < 1e-12);
  ck('S 随 intensity 单调增',
    [0, 0.2, 0.4, 0.6, 0.8, 1].every((x, idx, a) => idx === 0 || m.stabilityFor(x) > m.stabilityFor(a[idx - 1])));
  ck('越界输入被 clamp（-1 ⇒ 0）', Math.abs(m.stabilityFor(-1) - 30) < 1e-12);
  ck('越界输入被 clamp（2 ⇒ 1）', Math.abs(m.stabilityFor(2) - 150) < 1e-12);
}

// ═════════════════════════════════════════════════
console.log(hr('③ ⭐ 情绪残余：R = exp(−Δturn / S)'));

{
  const m = new EmotionMemory({ S0: 30, k: 4 });
  const weak = m.add({ turn: 0, summary: '小事', emotion: '还行', intensity: 0.05 });
  const strong = m.add({ turn: 0, summary: '戳心', emotion: '被戳中', intensity: 0.95 });
  console.log('  弱情绪 (i=0.05, S=' + f(weak.S, 1) + ') ｜ 强情绪 (i=0.95, S=' + f(strong.S, 1) + ')');
  console.log('');
  console.log('  ' + 'Δ轮'.padEnd(8) + '弱情绪残余'.padEnd(14) + '强情绪残余');
  console.log('  ' + '-'.repeat(36));
  for (const d of [0, 5, 10, 20, 30, 50, 80]) {
    console.log('  ' + String(d).padEnd(8) + f(m.residual(weak, d)).padEnd(14) + f(m.residual(strong, d)));
  }
  ck('t=0 ⇒ R=1', Math.abs(m.residual(weak, 0) - 1) < 1e-12);
  ck('⚠️ 强情绪比弱情绪散得【慢】', m.residual(strong, 20) > m.residual(weak, 20));
  ck('强情绪在 20 轮时还剩一半以上', m.residual(strong, 20) > 0.5);
}

// ═════════════════════════════════════════════════
console.log(hr('④ 关键词 / 摘要触发'));

{
  const m = new EmotionMemory();
  m.add({ turn: 1, summary: '用户说「你今天有点可爱」', emotion: '嘴硬心软', intensity: 0.3 });
  m.add({ turn: 5, summary: '用户没接话，转头说别的', emotion: '难受', intensity: 0.45 });
  m.add({ turn: 9, summary: '用户说「你其实很在意吧」', emotion: '被戳中', intensity: 0.9 });
  m.add({ turn: 14, summary: '聊起了原神的配队', emotion: '平静', intensity: 0.1 });

  const t1 = m.retrieve(20, '你今天有点可爱');
  console.log('  hint=「你今天有点可爱」 → ' + t1.map(x => x.entry.summary.slice(0, 14)).join(' ｜ '));
  ck('命中相关', t1.some(x => x.entry.summary.includes('可爱')));

  const t2 = m.retrieve(20, '你其实很在意吧');
  ck('命中被戳中那条', t2.some(x => x.entry.summary.includes('在意')));

  const t3 = m.retrieve(20, '外星话题 zzz');
  ck('无命中时退回全体', t3.length > 1);

  const t4 = m.retrieve(20, null);
  console.log('  全体排序：' + t4.map(x => '[' + x.entry.turn + ']i=' + x.entry.intensity + ' R=' + f(x.R, 2)).join('  '));
  ck('按情绪残余降序', t4.every((x, i) => i === 0 || x.R <= t4[i - 1].R));
  ck('⭐ 残余最高的排第一（可能是更早但更强的情绪，不一定是最近的）',
    t4[0].entry.turn === 9, '轮' + t4[0].entry.turn + ' R=' + f(t4[0].R, 3) + '（i=0.9）');
  console.log('  ⭐ 轮 9 比轮 14 更早，但它的情绪更强 ⇒ 排在前面 —— 这正是设计意图');
}

// ═════════════════════════════════════════════════
console.log(hr('⑤ 强情绪更"难忘"—— 排序会体现'));

{
  const m = new EmotionMemory({ S0: 30, k: 4 });
  m.add({ turn: 1, summary: '很戳心的旧事', emotion: '被戳中', intensity: 0.95 });   // S=150
  m.add({ turn: 10, summary: '刚发生的小事', emotion: '还行', intensity: 0.05 });   // S=36
  const hits = m.retrieve(25, null);
  console.log('  第 25 轮时：');
  for (const h of hits) console.log('    [' + h.entry.turn + '] i=' + h.entry.intensity + ' S=' + f(h.entry.S, 1) + ' 残余=' + f(h.R, 4) + '  ' + h.entry.summary);
  // 轮1 的强情绪：Δ=24, S=150 ⇒ R=exp(-0.16)=0.852
  // 轮10 的弱情绪：Δ=15, S=36  ⇒ R=exp(-0.4167)=0.659
  ck('⭐ 24 轮前的强情绪，残余【高于】15 轮前的弱情绪', hits[0].entry.turn === 1, 'R=' + f(hits[0].R, 4));
}

// ═════════════════════════════════════════════════
console.log(hr('⑥ 注入渲染：标出"情绪还剩多少"'));

{
  const m = new EmotionMemory({ S0: 30, k: 4 });
  m.add({ turn: 18, summary: '用户语气重了', emotion: '生气', intensity: 0.8 });
  m.add({ turn: 15, summary: '用户说「你其实很在意吧」', emotion: '被戳中', intensity: 0.9 });
  m.add({ turn: 1, summary: '用户夸了你', emotion: '嘴硬心软', intensity: 0.02 });   // ⭐ 很淡 + 很早
  const hits = m.retrieve(40, null, 3);
  const txt = m.render(hits, 40);
  console.log(txt.split('\n').map(l => '    ' + l).join('\n'));
  console.log('    （残余：' + hits.map(h => '[' + h.entry.turn + ']' + f(h.R, 2)).join(' ') + '）');
  ck('有标题', txt.includes('【你还记得的】'));
  ck('无 ISO 时间戳', !/\d{4}-\d{2}-\d{2}/.test(txt));
  ck('用"你当时"', txt.includes('你当时'));
  ck('⭐ 淡了的会标出来', txt.includes('淡了些') || txt.includes('大概'), '（最弱那条 R=' + f(hits[hits.length - 1].R, 3) + '）');
}

// ═════════════════════════════════════════════════
console.log(hr('⑦ 真遗忘 + 复杂构造确实没回来'));

{
  const m = new EmotionMemory({ S0: 30, k: 4, minR: 0.05 });
  const e = m.add({ turn: 0, summary: 'x', emotion: 'y', intensity: 0 });
  console.log('  intensity=0 ⇒ S=' + f(e.S, 1) + ' ⇒ 情绪寿命 ' + f(m.emotionLife(e), 1) + ' 轮');
  ck('89 轮时还在', m.retrieve(89, null, 5).length === 1);
  ck('91 轮时已散尽', m.retrieve(91, null, 5).length === 0);

  for (const k of ['kEmotion', 'kRecall', 'traits', 'maxS', 'recallCount', 'lambda']) {
    ck('没有 ' + k, m[k] === undefined);
  }
  console.log('  实例上的键: ' + Object.keys(m).join(', '));
}

console.log(hr('汇总'));
console.log(`  ✅ PASS ${PASS}   ❌ FAIL ${FAIL}`);
process.exit(FAIL === 0 ? 0 : 1);
