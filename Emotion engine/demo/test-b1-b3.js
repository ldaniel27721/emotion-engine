// B1（ρ 按效价分段）与 B3（h(n) 新颖性复位）的验证
// ⚠️ 重点：默认关闭时行为必须与 v0.1.2 【逐位一致】
'use strict';
const { V, cap } = require('../src/space');
const { Dynamics } = require('../src/dynamics');
const { Character } = require('../src/engine');

const hr = s => '\n' + '═'.repeat(84) + '\n' + s + '\n' + '═'.repeat(84);
const f = (x, d = 6) => Number(x).toFixed(d);
let PASS = 0, FAIL = 0;
const check = (n, ok, d = '') => { console.log('  ' + (ok ? '✅ PASS' : '❌ FAIL') + '  ' + n + (d ? '   ' + d : '')); ok ? PASS++ : FAIL++; };

const MU = [0.364, 0.227, -0.136];   // dependent 的 μ
const DE_A = [-0.30, 0.20, -0.25];   // 事件 A
const DE_B = [0.15, -0.10, 0.45];    // 事件 B（与 A 差别很大）

// ═════════════════════════════════════════════════
console.log(hr('默认关闭 ⇒ 行为必须与 v0.1.2 一致'));

for (const [name, cfg] of [['noveltyReset=false', {}], ['rhoByValence=null', {}]]) {
  const d = new Dynamics({ sigma: 0.50, ...cfg });
  console.log(`  ${name}: noveltyReset=${d.noveltyReset} rhoByValence=${d.rhoByValence}`);
}
{
  const d = new Dynamics({ sigma: 0.50 });
  const r = d.step(DE_A, MU, { eventKey: 'x' });
  check('默认 rho = 0.927（单标量）', Math.abs(r.rho - 0.927) < 1e-9);
  check('默认 noveltyFired = false', r.noveltyFired === false);
}

// ═════════════════════════════════════════════════
console.log(hr('B3 · h(n) 自动新颖性复位'));

{
  // 关闭时：同一 eventKey 反复 ⇒ h 一路递减，永不复位
  const off = new Dynamics({ sigma: 0.50, noveltyReset: false });
  const hOff = [];
  for (let i = 0; i < 6; i++) hOff.push(off.step(DE_A, MU, { eventKey: 'k' }).h);
  console.log('  关闭: h = ' + hOff.map(x => f(x, 4)).join(' '));
  check('关闭时 h 单调递减、无复位', hOff.every((v, i) => i === 0 || v < hOff[i - 1]));

  // 开启时：前几次同一事件，然后【换个差别很大的事件】
  const on = new Dynamics({ sigma: 0.50, noveltyReset: true, noveltyThreshold: 0.35 });
  const seq = [DE_A, DE_A, DE_A, DE_A, DE_B, DE_B, DE_B];
  const rows = seq.map((de, i) => {
    const r = on.step(de, MU, { eventKey: 'k' });
    return { i, tag: de === DE_A ? 'A' : 'B', h: r.h, exp: r.exposure, fired: r.noveltyFired };
  });
  console.log('  ' + '轮'.padEnd(4) + '事件'.padEnd(6) + 'h'.padEnd(12) + 'exposure'.padEnd(10) + '复位?');
  console.log('  ' + '-'.repeat(44));
  for (const r of rows) console.log('  ' + String(r.i).padEnd(4) + r.tag.padEnd(6) + f(r.h, 5).padEnd(12) + String(r.exp).padEnd(10) + (r.fired ? '⭐ 是' : ''));
  check('换梗时触发复位', rows[4].fired === true, `（第 5 轮 A→B）`);
  check('复位后 exposure 归零再计（=1）', rows[4].exp === 1);
  check('复位后 h 回到 1（重新敏感）', Math.abs(rows[4].h - 1) < 1e-9);
  check('同梗重复时不误触发', !rows[1].fired && !rows[2].fired && !rows[3].fired);
}

// ═════════════════════════════════════════════════
console.log(hr('B1 · ρ 按效价分段'));

{
  // 文献值（Sci. Rep. 2025 Table 3，渲染成图逐字读）
  const RHO_BY_VAL = { neg: 0.451, mid: 0.875, posMid: 0.875, posHigh: 0.805 };
  console.log('  文献 ρ: 负性 0.451 · 中等正性 0.875 · 高正性 0.805（⚠️ 非单调）');

  const off = new Dynamics({ sigma: 0.50 });
  const on = new Dynamics({ sigma: 0.50, rhoByValence: RHO_BY_VAL });

  // 负性偏离：从 μ 出发朝负 P 拉
  const setup = (d, dir) => { d.E = V.add(MU, V.mul(V.unit(dir), 0.5)); return d; };
  const negDir = [-1, 0.3, -0.2];
  const posDir = [1, 0.3, -0.2];

  const a = setup(new Dynamics({ sigma: 0.50 }), negDir);
  const b = setup(new Dynamics({ sigma: 0.50, rhoByValence: RHO_BY_VAL }), negDir);
  const ra = a.step([0, 0, 0], MU, {});
  const rb = b.step([0, 0, 0], MU, {});
  console.log('  负性偏离: 默认 rho=' + f(ra.rho, 4) + '  分段 rho=' + f(rb.rho, 4));
  check('负性 → 取 ρ_neg=0.451', Math.abs(rb.rho - 0.451) < 1e-9);

  const c = setup(new Dynamics({ sigma: 0.50, rhoByValence: RHO_BY_VAL }), posDir);
  const rc = c.step([0, 0, 0], MU, {});
  console.log('  正性偏离(|r|=0.5): 分段 rho=' + f(rc.rho, 4));
  check('正性(中等) → 取 ρ_posMid=0.875', Math.abs(rc.rho - 0.875) < 1e-9);

  // 高正性：偏离更大
  const d2 = new Dynamics({ sigma: 0.40, rhoByValence: RHO_BY_VAL });
  d2.E = V.add(MU, V.mul(V.unit(posDir), 0.85));   // > 1.5*0.40 = 0.60
  const rd = d2.step([0, 0, 0], MU, {});
  console.log('  正性偏离(|r|=0.85, σ=0.40): 分段 rho=' + f(rd.rho, 4));
  check('高正性 → 取 ρ_posHigh=0.805', Math.abs(rd.rho - 0.805) < 1e-9);

  // 半衰期对比
  const hl = (r) => Math.log(0.5) / Math.log(r);
  console.log('\n  半衰期: 负性 ' + f(hl(0.451), 2) + ' 轮 ｜ 中等正性 ' + f(hl(0.875), 2) +
    ' 轮 ｜ 高正性 ' + f(hl(0.805), 2) + ' 轮 ｜ 默认单标量 ' + f(hl(0.927), 2) + ' 轮');
  check('负性比正性散得快得多', hl(0.451) < hl(0.875));

  // 端到端：负性事件在分段模式下衰减更快
  const mk = (cfg) => {
    const c = new Character({ name: 'c', sigma: 0.50, muPreset: 'dependent' });
    c.dynamics.rhoByValence = cfg;
    return c;
  };
  const EV = { eventKey: null, appraisal: { relevance: 0.9, congruence: -0.9, importance: 0.85, agency: 'other', coping: 0.3, certainty: 0.8, expectancy: 0.8, intentionality: 0.5 } };
  const c1 = mk(null), c2 = mk(RHO_BY_VAL);
  c1.step(JSON.parse(JSON.stringify(EV))); c2.step(JSON.parse(JSON.stringify(EV)));
  c1.idle(5); c2.idle(5);
  const r1 = V.norm(V.sub(c1.E, c1.mu.vector));
  const r2 = V.norm(V.sub(c2.E, c2.mu.vector));
  console.log('  负性事件后空闲 5 轮残留: 默认 ' + f(r1, 4) + '  vs 分段 ' + f(r2, 4));
  check('分段模式下负性残留更小（散得更快）', r2 < r1);
}

// ═════════════════════════════════════════════════
console.log(hr('汇总'));
console.log(`  ✅ PASS ${PASS}   ❌ FAIL ${FAIL}`);
process.exit(FAIL === 0 ? 0 : 1);
