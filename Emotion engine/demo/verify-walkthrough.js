// 验证 docs/10 的走查例子：逐步骤打印，核对文档里的数字
'use strict';
const V = require('../src/space').V;
const ap = require('../src/appraisal');
const { Character } = require('../src/engine');

const f = (x, d = 4) => Number(x).toFixed(d);
const EV = {
  eventKey: '被夸奖',
  appraisal: {
    relevance: 0.9, congruence: 0.8, importance: 0.6,
    agency: 'other', coping: 0.8, certainty: 0.7,
    expectancy: 0.4, intentionality: 1.0, currentArousal: 0.3,
  },
  context: { triggers: ['alone'], strategyScale: 0.35 },
};

console.log('═'.repeat(84));
console.log('docs/10 走查例子的数值验证');
console.log('═'.repeat(84));

// ① 评价层
const a = ap.aiAppraise(EV.appraisal);
console.log('\n① 评价层（LLM 填后归一化）');
console.log('   ' + JSON.stringify(EV.appraisal));

// ② 中间量（用导出的内部函数复算，核对文档公式）
console.log('\n② 中间量');
const valence = a.congruence * a.relevance;
const expectedValence = (a.expectancy - 0.5) * 2;
const modUnexpected = 1 + 0.5 * (1 - a.expectancy);
const modArousal = 1 + 0.3 * (a.currentArousal || 0);
const intensity = Math.min(1, a.importance * a.relevance * modUnexpected * modArousal);
const alpha = Math.min(1, Math.max(0, Math.max(a.relevance * a.importance, (1 - a.certainty) * a.relevance)));
const eps = Math.abs(valence - expectedValence) * 0.5 + 0.5 * (1 - a.certainty);

console.log('   valence        = congruence × relevance = ' + f(a.congruence, 2) + ' × ' + f(a.relevance, 2) + ' = ' + f(valence));
console.log('   expectedValence= (expectancy−0.5)×2      = (' + f(a.expectancy, 2) + '−0.5)×2 = ' + f(expectedValence));
console.log('   modUnexpected  = 1+0.5(1−expectancy)     = ' + f(modUnexpected));
console.log('   modArousal     = 1+0.3×arousal           = ' + f(modArousal));
console.log('   intensity      = ' + f(intensity));
console.log('   α (精度门控)   = max(' + f(a.relevance * a.importance) + ', ' + f((1 - a.certainty) * a.relevance) + ') = ' + f(alpha));
console.log('   ε (预测误差)   = |' + f(valence) + '−(' + f(expectedValence) + ')|×0.5 + 0.5×' + f(1 - a.certainty) + ' = ' + f(eps));

// 方向
const dir = ap.classifyDirection(a);
console.log('   direction      = ' + dir.direction + ' → ' + dir.octant + '   (' + dir.note + ')');

// ③ 走一整套
console.log('\n③ 走引擎（含动力学与表达层）');
const c = new Character({
  name: '傲娇大肥鱼', sigma: 0.50, muPreset: 'dependent',
  subtype: ['Tsundere'], gainPos: 1.0, gainNeg: 1.0,
});
const r = c.step(JSON.parse(JSON.stringify(EV)));

console.log('   评价: direction=' + r.direction + '  octant=' + r.octant);
console.log('   α=' + f(r.alpha) + '  ε=' + f(r.eps) + '  intensity=' + f(r.intensity) + '  valence=' + f(r.valence));
console.log('   priorStrength=' + f(r.priorStrength) + '   (0.15×(1−certainty)×precision/3 = 0.15×' +
  f(1 - a.certainty, 2) + '×' + f(c.mu.precision / 3, 2) + ')');
console.log('   ΔE = ' + V.fmt(r.dE, 4) + '   |ΔE|=' + f(V.norm(r.dE)));
console.log('');
console.log('   h(n)    = ' + f(r.h) + '   （eventKey="被夸奖"，第 1 次 ⇒ α^0 = 1）');
console.log('   g       = ' + f(r.g) + '   （gGain ' + f(c.gainFor(r.dE)) + ' × strategyScale ' + EV.context.strategyScale + '）');
console.log('   ρ       = ' + f(r.rho) + '   （默认单标量，未开效价/情境分段）');
console.log('   r_raw   = ' + f(r.rRaw) + '  →  封顶后 r = ' + f(r.r) + '   （σ=0.50 ⇒ r0=0.85）');
console.log('');
const exp = c.tsundere.express(c.E, c.mu.vector);
console.log('   表达层: s = ' + f(exp.s) + '   （s₀=' + f(c.tsundere.s0) + ' + alone +0.55 等）');
console.log('   E_inner  = ' + V.fmt(c.E, 4));
console.log('   E_outer  = ' + V.fmt(exp.eOuter, 4));

// ④ 反向验证：把 relevance 归零，整条链应塌
console.log('\n④ 反向验证：relevance → 0（"与你无关"）');
const z = new Character({ name: 'z', sigma: 0.50, muPreset: 'dependent' });
const ez = JSON.parse(JSON.stringify(EV));
ez.appraisal.relevance = 0;
const rz = z.step(ez);
console.log('   relevance=0 ⇒ α=' + f(rz.alpha) + '  ε=' + f(rz.eps) + '  |ΔE|=' + f(V.norm(rz.dE)) +
  '   ' + (V.norm(rz.dE) < 1e-9 ? '✅ ΔE 归零' : '⚠️ 未归零'));

// ⑤ 边缘：ε → 0
console.log('\n⑤ 反向验证：完全符合预期（ε → 0）');
const e2 = new Character({ name: 'e', sigma: 0.50, muPreset: 'dependent' });
const ee = JSON.parse(JSON.stringify(EV));
ee.appraisal.certainty = 1; ee.appraisal.expectancy = 0.9;   // valence 与期望对齐
const re = e2.step(ee);
console.log('   certainty=1, expectancy=0.9 ⇒ ε=' + f(re.eps) + '   |ΔE|=' + f(V.norm(re.dE)));
