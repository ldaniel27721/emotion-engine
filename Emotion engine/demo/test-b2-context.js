// B2（ρ 按情境分段）验证
// ⚠️ 重点：默认关闭 ⇒ 行为与 v0.1.5 一致
'use strict';
const { V } = require('../src/space');
const { Dynamics } = require('../src/dynamics');

const hr = s => '\n' + '═'.repeat(84) + '\n' + s + '\n' + '═'.repeat(84);
const f = (x, d = 6) => Number(x).toFixed(d);
let PASS = 0, FAIL = 0;
const check = (n, ok, d = '') => { console.log('  ' + (ok ? '✅ PASS' : '❌ FAIL') + '  ' + n + (d ? '   ' + d : '')); ok ? PASS++ : FAIL++; };

const MU = [0, 0, 0];
const SIGMA = 0.50;

// 文献（Wang & Zhang 2025 Appl. Sci. 15:4960 案例）：工作日 γ=0.3 ｜ 周末 γ=1
// ⚠️ γ 是【衰减速率】⇒ 半衰期 = ln2/γ ⇒ 半衰期倍数 = γ 的倒数
const K_WORKDAY = 1 / 0.3;   // ≈ 3.333
const K_WEEKEND = 1 / 1.0;   // = 1.0（基准）
const CTX = { workday: K_WORKDAY, weekend: K_WEEKEND, alone: 1.0, audience: 1.0 };

// ═════════════════════════════════════════════════
console.log(hr('① 默认关闭 ⇒ 不动 ρ'));

{
  const d = new Dynamics({ sigma: SIGMA });
  const r = d.step([0, 0, 0], MU, {});
  check('默认 rho = 0.927', Math.abs(r.rho - 0.927) < 1e-12, f(r.rho));
  check('rhoContext = null', r.rhoContext === null);
  check('rhoByContext 默认 null', d.rhoByContext === null);
}

// ═════════════════════════════════════════════════
console.log(hr('② 情境 → 半衰期倍数 → ρ（语义方向要对）'));

{
  const d = new Dynamics({ sigma: SIGMA, rhoByContext: CTX });
  console.log('  基准: rho=0.927 ⇒ 半衰期 ' + f(d.halfLife, 3) + ' 轮');
  console.log('');

  const hl = (rho) => Math.log(0.5) / Math.log(rho);
  console.log('  ' + '情境'.padEnd(12) + 'k(半衰期倍数)'.padEnd(18) + 'ρ 实际'.padEnd(14) + '半衰期'.padEnd(12) + '对比基准');
  console.log('  ' + '-'.repeat(74));
  for (const name of ['workday', 'weekend']) {
    const rho = d.rhoForContext(name);
    const ratio = hl(rho) / d.halfLife;
    console.log('  ' + name.padEnd(12) + f(CTX[name], 3).padEnd(18) + f(rho, 6).padEnd(14) +
      f(hl(rho), 3).padEnd(12) + f(ratio, 3) + '×');
  }

  const rw = d.rhoForContext('workday');
  const rk = d.rhoForContext('weekend');
  check('工作日 ρ > 基准（γ 小 ⇒ 衰减慢 ⇒ 留存久）', rw > 0.927, f(rw));
  check('周末 ρ = 基准（k=1.0）', Math.abs(rk - 0.927) < 1e-12, f(rk));
  check('工作日半衰期 = 基准 × 3.333', Math.abs(hl(rw) / d.halfLife - K_WORKDAY) < 1e-9,
    '实测 ' + f(hl(rw) / d.halfLife, 4) + '×');
  console.log('\n  ⭐ 语义核对：γ=0.3（工作日）比 γ=1（周末）小 ⇒ 衰减更慢 ⇒ 情绪更持久 ✓');
}

// ═════════════════════════════════════════════════
console.log(hr('③ 3.33× 落在【半衰期】而不是【ρ】上'));

{
  const d = new Dynamics({ sigma: SIGMA, rhoByContext: CTX });
  const rw = d.rhoForContext('workday');
  const rhoRatio = rw / 0.927;
  const hlRatio = (Math.log(0.5) / Math.log(rw)) / d.halfLife;
  console.log('  ρ 之比    = ' + f(rhoRatio, 4) + '   ⚠️ 不是 3.33');
  console.log('  半衰期之比 = ' + f(hlRatio, 4) + '   ⭐ 才是 3.33');
  check('ρ 之比 ≠ 3.33（说明没有张冠李戴）', Math.abs(rhoRatio - K_WORKDAY) > 0.05);
  check('半衰期之比 = 3.33', Math.abs(hlRatio - K_WORKDAY) < 1e-9);
}

// ═════════════════════════════════════════════════
console.log(hr('④ 与 B1 复合（效价 × 情境）'));

{
  const RHO_BY_VAL = { neg: 0.451, mid: 0.875, posMid: 0.875, posHigh: 0.805 };
  const d = new Dynamics({ sigma: SIGMA, rhoByValence: RHO_BY_VAL, rhoByContext: CTX });

  const negDir = [-1, 0.3, -0.2];
  d.E = V.mul(V.unit(negDir), 0.5);
  const rA = d.step([0, 0, 0], MU, { context: 'weekend' });   // 周末：k=1 ⇒ ρ 应 = 0.451
  d.E = V.mul(V.unit(negDir), 0.5);
  const rB = d.step([0, 0, 0], MU, { context: 'workday' });   // 工作日：半衰期 ×3.333

  console.log('  负性偏离 · 周末  ⇒ ρ=' + f(rA.rho) + '  ρ_ctx=' + f(rA.rhoContext) + '  半衰期 ' + f(Math.log(0.5) / Math.log(rA.rho), 3));
  console.log('  负性偏离 · 工作日 ⇒ ρ=' + f(rB.rho) + '  ρ_ctx=' + f(rB.rhoContext) + '  半衰期 ' + f(Math.log(0.5) / Math.log(rB.rho), 3));
  check('B1 生效（负性取 0.451）', Math.abs(rA.rho - 0.451) < 1e-9);
  check('B2 在 B1 之上复合（工作日 ρ 更高）', rB.rho > rA.rho);
  const hlRatio = (Math.log(0.5) / Math.log(rB.rho)) / (Math.log(0.5) / Math.log(rA.rho));
  check('复合后半衰期之比仍 = 3.333', Math.abs(hlRatio - K_WORKDAY) < 1e-9, f(hlRatio, 4) + '×');
}

// ═════════════════════════════════════════════════
console.log(hr('⑤ setContext / 未知情境'));

{
  const d = new Dynamics({ sigma: SIGMA, rhoByContext: CTX });
  d.setContext('workday');
  check('setContext 生效', d.context === 'workday');
  const r = d.step([0, 0, 0], MU, {});
  check('未传 opts.context 时用 this.context', r.context === 'workday');

  const r2 = d.step([0, 0, 0], MU, { context: 'weekend' });
  check('opts.context 优先于 this.context', r2.context === 'weekend');

  let threw = false;
  try { d.setContext('不存在的场合'); } catch (e) { threw = true; console.log('  抛错信息: ' + e.message); }
  check('未知情境名 ⇒ 抛错（不静默）', threw);

  check('setContext(null) 关闭本轮情境', (d.setContext(null), d.context === null));
}

// ═════════════════════════════════════════════════
console.log(hr('⑥ 端到端：工作日残留 > 周末残留'));

{
  const mk = (ctx) => {
    const c = new Dynamics({ sigma: SIGMA, rho: 0.927, rhoByContext: CTX, context: ctx });
    c.E = V.mul(V.unit([-1, 0.3, -0.2]), 0.5);
    return c;
  };
  const a = mk('weekend'), b = mk('workday');
  for (let i = 0; i < 4; i++) { a.step([0, 0, 0], MU, {}); b.step([0, 0, 0], MU, {}); }
  const ra = V.norm(a.E), rb = V.norm(b.E);
  console.log('  空闲 4 轮后残留:  周末 ' + f(ra) + '  ｜  工作日 ' + f(rb));
  check('工作日残留更大（衰减更慢）', rb > ra, f(rb / ra, 3) + '×');
}

// ═════════════════════════════════════════════════
console.log(hr('汇总'));
console.log(`  ✅ PASS ${PASS}   ❌ FAIL ${FAIL}`);
process.exit(FAIL === 0 ? 0 : 1);
