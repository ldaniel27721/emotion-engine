// B5（precision 信度衰减）验证
// ⚠️ 重点：默认不调用 ⇒ 行为与 v0.1.3 完全一致
'use strict';
const { V } = require('../src/space');
const { Mu } = require('../src/mu');
const { Character } = require('../src/engine');

const hr = s => '\n' + '═'.repeat(84) + '\n' + s + '\n' + '═'.repeat(84);
const f = (x, d = 6) => Number(x).toFixed(d);
let PASS = 0, FAIL = 0;
const check = (n, ok, d = '') => { console.log('  ' + (ok ? '✅ PASS' : '❌ FAIL') + '  ' + n + (d ? '   ' + d : '')); ok ? PASS++ : FAIL++; };

// ═════════════════════════════════════════════════
console.log(hr('① 基本行为：刷新 / 衰减 / 下限'));

{
  const m = new Mu({ dir: [0.8, 0.5, -0.3], precision: 6.0, rMu: 0.45, label: 'T' });
  console.log('  初始 precision = ' + f(m.precision, 4) + '   方差 = ' + f(m.variance, 4));

  m.decayPrecision(2.0);
  check('衰减一次 ⇒ precision 减半（=3）', Math.abs(m.precision - 3) < 1e-9, '实测 ' + f(m.precision, 4));
  m.decayPrecision(2.0);
  check('再衰减 ⇒ 1.5', Math.abs(m.precision - 1.5) < 1e-9);
  console.log('  ⭐ 方差同步上升：' + f(m.variance, 4) + '  ⇒ 先验变"松"，模糊事件更易被读动');

  m.setPrecision();
  check('setPrecision() ⇒ 回到基准 6', Math.abs(m.precision - 6) < 1e-9);

  // 下限
  const m2 = new Mu({ dir: [1, 0, 0], precision: 1.0, rMu: 0.45, label: 'F' });
  for (let i = 0; i < 20; i++) m2.decayPrecision(2.0, 0.05);
  check('下限生效（floor=0.05）', Math.abs(m2.precision - 0.05) < 1e-12, '实测 ' + f(m2.precision, 6));
}

// ═════════════════════════════════════════════════
console.log(hr('② tickPrecision：有测量刷新 / 无测量衰减'));

{
  const m = new Mu({ dir: [0.8, 0.5, -0.3], precision: 4.0, rMu: 0.45, label: 'T' });
  m.tickPrecision(false, { alpha: 2.0 });
  check('无测量 ⇒ 衰减到 2', Math.abs(m.precision - 2) < 1e-9);
  m.tickPrecision(false, { alpha: 2.0 });
  check('再一轮无测量 ⇒ 1', Math.abs(m.precision - 1) < 1e-9);
  m.tickPrecision(true);
  check('有测量 ⇒ 刷新回基准 4', Math.abs(m.precision - 4) < 1e-9);
}

// ═════════════════════════════════════════════════
console.log(hr('③ 默认不调用 ⇒ 行为与 v0.1.3 一致'));

{
  const a = new Mu({ dir: [0.8, 0.5, -0.3], precision: 5.0, rMu: 0.45, label: 'A' });
  const b = new Mu({ dir: [0.8, 0.5, -0.3], precision: 5.0, rMu: 0.45, label: 'B' });
  // 只对 a 做不带 precision 的操作
  a.drift([0.6, 0.2, -0.4], 0.04);
  b.drift([0.6, 0.2, -0.4], 0.04);
  check('不调用 B5 时 precision 恒定', a.precision === 5.0 && a.precision === b.precision);
  check('vectors 仍逐位一致', V.fmt(a.vector, 9) === V.fmt(b.vector, 9));
}

// ═════════════════════════════════════════════════
console.log(hr('④ 与主循环联动：precision 衰减后，模糊事件的解读确实变了'));

{
  // 事件故意设成模糊（certainty 低）
  const EV = {
    eventKey: 'e',
    appraisal: {
      relevance: 0.9, congruence: -0.6, importance: 0.8, agency: 'other',
      coping: 0.4, certainty: 0.30, expectancy: 0.7, intentionality: 0.5,
    },
  };
  const mk = () => new Character({ name: 'c', sigma: 0.50, muPreset: 'dependent' });

  const fresh = mk();                     // 信度高（基准 3.0? 见 PRESETS）
  const stale = mk();
  for (let i = 0; i < 4; i++) stale.mu.decayPrecision(2.0);   // 4 轮无证据

  console.log('  fresh: precision=' + f(fresh.mu.precision, 4));
  console.log('  stale: precision=' + f(stale.mu.precision, 4) + '  （4 轮无新证据）');

  const rf = fresh.step(JSON.parse(JSON.stringify(EV)));
  const rs = stale.step(JSON.parse(JSON.stringify(EV)));
  console.log('  fresh: priorStrength=' + f(rf.priorStrength, 6) + '  ΔE=' + V.fmt(rf.dE, 4));
  console.log('  stale: priorStrength=' + f(rs.priorStrength, 6) + '  ΔE=' + V.fmt(rs.dE, 4));

  check('stale 的先验拉力更弱', rs.priorStrength < rf.priorStrength);
  check('两者的 ΔE 因此不同', V.fmt(rf.dE, 6) !== V.fmt(rs.dE, 6));
  console.log('  ⭐ 语义：久无反馈 ⇒ 先验变"松" ⇒ 模糊事件更多按事件本身读（少被 μ 拉）');
}

// ═════════════════════════════════════════════════
console.log(hr('汇总'));
console.log(`  ✅ PASS ${PASS}   ❌ FAIL ${FAIL}`);
process.exit(FAIL === 0 ? 0 : 1);
