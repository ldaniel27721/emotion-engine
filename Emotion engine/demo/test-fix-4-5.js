// 验证 ④ precision 已接入 与 心境开关已生效
'use strict';
const { V } = require('../src/space');
const { Character } = require('../src/engine');
const { PRESETS } = require('../src/mu');

const hr = s => '\n' + '═'.repeat(84) + '\n' + s + '\n' + '═'.repeat(84);
const f = (x, d = 6) => Number(x).toFixed(d);
let PASS = 0, FAIL = 0;
const check = (n, ok, d = '') => { console.log('  ' + (ok ? '✅ PASS' : '❌ FAIL') + '  ' + n + (d ? '   ' + d : '')); ok ? PASS++ : FAIL++; };

const EV = {
  eventKey: 'e',
  appraisal: {
    relevance: 0.9, congruence: -0.6, importance: 0.8, agency: 'other',
    coping: 0.4, certainty: 0.35, expectancy: 0.7, intentionality: 0.5,
  },
};

console.log(hr('④a precision 是否影响主循环（事件故意设成模糊：certainty=0.35）'));
{
  const mk = (prec) => new Character({
    name: 'p' + prec, sigma: 0.50,
    muOverride: { dir: PRESETS.dependent.dir, precision: prec },
  });
  console.log('  ' + 'precision'.padEnd(12) + 'priorStrength'.padEnd(16) + 'ΔE'.padEnd(34) + '|ΔE|');
  console.log('  ' + '-'.repeat(76));
  const rs = [];
  for (const p of [1, 3, 6, 9]) {
    const c = mk(p);
    const r = c.step(JSON.parse(JSON.stringify(EV)));
    rs.push(r);
    console.log('  ' + String(p).padEnd(12) + f(r.priorStrength).padEnd(16) + V.fmt(r.dE, 4).padEnd(34) + f(V.norm(r.dE)));
  }
  const distinct = new Set(rs.map(r => f(V.norm(r.dE), 6))).size;
  check('不同 precision 产生不同 ΔE', distinct > 1, `（${distinct} 种）`);
  check('priorStrength 随 precision 单调上升',
    rs.every((r, i) => i === 0 || r.priorStrength >= rs[i - 1].priorStrength));
}

console.log(hr('④b 心境开关是否真的改行为'));
{
  const mk = () => new Character({ name: 'm', sigma: 0.50, muPreset: 'dependent' });
  const a = mk(), b = mk();
  a.moodSwitch(false);           // → mood（弥散，全局增益 1.6）
  b.moodSwitch(true);            // → emotion（具体，增益 1.0）
  const ra = a.step(JSON.parse(JSON.stringify(EV)));
  const rb = b.step(JSON.parse(JSON.stringify(EV)));
  console.log('  mood    : state=' + a.moodState + '  |ΔE|=' + f(V.norm(ra.dE)));
  console.log('  emotion : state=' + b.moodState + '  |ΔE|=' + f(V.norm(rb.dE)));
  check('moodSwitch 真的写了状态', a.moodState === 'mood' && b.moodState === 'emotion');
  check('mood 的 ΔE 更大（全局影响被放大）', V.norm(ra.dE) > V.norm(rb.dE));
  const ratio = V.norm(ra.dE) / V.norm(rb.dE);
  check(`放大倍数 ≈ moodGain(1.6)：实测 ${f(ratio, 4)}`, Math.abs(ratio - 1.6) < 0.02);
}

console.log(hr('⑤ 词库签名分辨率（更正后的事实）'));
{
  const { Lexicon } = require('../src/lexicon');
  const lex = new Lexicon();
  const sigs = new Set(lex.entries.map(e => e.signature.map(x => Number(x).toFixed(3)).join(',')));
  console.log('  词条 ' + lex.size + ' → 去重签名 ' + sigs.size + ' 种');
  check('签名种类 = 八型实际用到的数量（应为 7，不是 599）', sigs.size === 7, `（实测 ${sigs.size}）`);
}

console.log(hr('汇总'));
console.log(`  ✅ PASS ${PASS}   ❌ FAIL ${FAIL}`);
process.exit(FAIL === 0 ? 0 : 1);
