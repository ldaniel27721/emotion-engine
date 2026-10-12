// 从源码里抽出所有【可调常量】，作为因子总表的准确来源
'use strict';
const { Space, cap, defaultR0 } = require('../src/space');
const { Dynamics } = require('../src/dynamics');
const { Mu, PRESETS, DRIFT_RATE_CALIBRATED } = require('../src/mu');
const { Character } = require('../src/engine');
const ts = require('../src/tsundere');
const ap = require('../src/appraisal');
const lex = require('../src/lexicon');

const f = (x, d = 6) => (typeof x === 'number' ? Number(x).toFixed(d) : String(x));
const hr = s => '\n' + '═'.repeat(90) + '\n' + s + '\n' + '═'.repeat(90);

console.log(hr('从源码抽取的可调常量'));

// ── A1 ──
console.log('\n【A1 空间层 · space.js】');
const sp = new Space({ sigma: 0.40 });
console.log('  sigma 默认      : 0.40          （角色参数）');
console.log('  k = 1/sigma     : ' + f(sp.k, 4));
console.log('  r0 (低区上界)   : ' + f(defaultR0(sp.k), 4) + '   = min(0.85, max(0.30, 2σ))');
console.log('  useCap 默认     : true');
console.log('  cap(0.1,k=2.5)  : ' + f(cap(0.1, 2.5), 6) + '   （低区恒等 ⇒ = r）');
console.log('  cap(2.0,k=2.5)  : ' + f(cap(2.0, 2.5), 6) + '   （高区压缩）');

// ── A2 ──
console.log('\n【A2 动力学层 · dynamics.js】');
const d = new Dynamics({});
console.log('  rho 默认        : ' + d.rho);
console.log('  alpha 默认      : ' + d.alpha);
console.log('  useCap 默认     : ' + d.useCap);
console.log('  halfLife        : ' + f(d.halfLife, 4) + ' 轮');
console.log('  noveltyReset    : ' + d.noveltyReset + '   （默认关）');
console.log('  noveltyThreshold: ' + d.noveltyThreshold);
console.log('  rhoByValence    : ' + d.rhoByValence + '   （默认关）');
console.log('  rhoByContext    : ' + d.rhoByContext + '   （默认关）');
console.log('  context         : ' + d.context);

// ── A3 ──
console.log('\n【A3 底情绪层 · mu.js】');
console.log('  DRIFT_RATE_CALIBRATED : ' + DRIFT_RATE_CALIBRATED + '   （B8 标定）');
const m0 = new Mu({});
console.log('  drift() 默认 rate     : 0.02   ⚠️ 保留仅向后兼容');
console.log('  drift() maxDrift      : 0.35');
console.log('  rMu 默认              : ' + m0.rMu + '   （软约束 [0.40, 0.50]）');
console.log('  precision 默认        : ' + m0.precision);
console.log('  decayPrecision alpha  : 2.0    （文献实测值）');
console.log('  decayPrecision floor  : 0.05');
console.log('\n  PRESETS：');
for (const [k2, v] of Object.entries(PRESETS)) {
  console.log('    ' + k2.padEnd(12) + 'dir=[' + v.dir.map(x => f(x, 2)).join(',') + ']  precision=' + v.precision + '  ' + v.label);
}

// ── 评价层 ──
console.log('\n【评价层 · appraisal.js】');
console.log('  OCTANT 八型：');
for (const [k2, v] of Object.entries(ap.OCTANT)) console.log('    ' + k2.padEnd(12) + '[' + v.map(x => f(x, 3)).join(', ') + ']');
console.log('\n  DIRECTION_TO_OCTANT（12 方向类）：');
for (const [k2, v] of Object.entries(ap.DIRECTION_TO_OCTANT)) console.log('    ' + k2.padEnd(14) + '→ ' + v);
console.log('\n  APPRAISAL_SCHEMA 字段：');
const props = ap.APPRAISAL_SCHEMA.properties || {};
for (const [k2, v] of Object.entries(props)) {
  console.log('    ' + k2.padEnd(18) + (v.type || '') + '  ' + String(v.description || '').slice(0, 54));
}

// ── 表达层 ──
console.log('\n【表达层 · tsundere.js】');
console.log('  SUBTYPE 数  : ' + Object.keys(ts.SUBTYPE).length);
console.log('  TRIGGER：');
for (const [k2, v] of Object.entries(ts.TRIGGER)) {
  console.log('    ' + k2.padEnd(12) + JSON.stringify(v));
}
console.log('  LEAK_CHANNEL: ' + JSON.stringify(ts.LEAK_CHANNEL));
console.log('\n  SUBTYPE 明细（前 20）：');
let i = 0;
for (const [k2, v] of Object.entries(ts.SUBTYPE)) {
  if (i++ >= 20) break;
  console.log('    ' + k2.padEnd(16) + JSON.stringify(v).slice(0, 90));
}

// ── A4 ──
console.log('\n【A4 词库 · lexicon.js】');
const lx = new lex.Lexicon();
console.log('  词条数          : ' + lx.size);
const octs = new Set(lx.entries.map(e => e.octant));
console.log('  实际用到八型    : ' + [...octs].join(', ') + '   (' + octs.size + ' 种)');
console.log('  THEME_TO_GOAL 数: ' + Object.keys(lex.THEME_TO_GOAL).length);
console.log('  主题（前 20）   : ' + Object.keys(lex.THEME_TO_GOAL).slice(0, 20).join(' / '));
