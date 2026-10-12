// 情绪引擎 —— 把 A1/A2/A3/A4 与评价层、表达层组装成完整链路
//
//   刺激 → 评价计算 → ΔE → A2 动力学 → 情绪(E_inner) → 表达层 → E_outer → 行为
//
// 依据：11 篇文献整合（papers2/papers3）+ 傲娇的机制结构（wiki 语料）
'use strict';

const { V, Space } = require('./space');
const { Dynamics } = require('./dynamics');
const { Mu, PRESETS } = require('./mu');
const { Tsundere } = require('./tsundere');
const appraisal = require('./appraisal');

// 词库为可选依赖（不装也能跑）
let Lexicon = null;
try { ({ Lexicon } = require('./lexicon')); } catch (_) { /* 无词库则降级 */ }

// ────────────────────────────────────────────────
// ⭐ 角色定义
// ────────────────────────────────────────────────
class Character {
  constructor({
    name = 'unnamed',
    sigma = 0.40,              // A1：情绪起伏幅度（"情绪化程度"）
    rho = 0.927,               // A2：自发回落（半衰期 9.1 轮）
    alpha = 0.95,              // A2：习惯化因子
    muPreset = 'dependent',    // A3：底情绪预设
    muOverride = null,         // A3：直接给 {dir, precision}
    subtype = ['Tsundere'],    // 表达层：傲娇亚型（可叠加）
    s0 = null,                 // 表达层：覆盖抑制基线
    // ⭐ AET 的 g_i（反应增益，正负独立）—— 可选
    gainPos = 1.0,
    gainNeg = 1.0,
    // ⭐ A4：词库（可选）
    lexicon = null,
    useLexiconSignature = false,   // 是否用选中词的签名替代八型签名
  } = {}) {
    this.name = name;
    this.space = new Space({ sigma, useCap: true });
    this.dynamics = new Dynamics({ rho, alpha, useCap: true, sigma });
    const p = muOverride || PRESETS[muPreset] || PRESETS.neutral;
    this.mu = new Mu({
      dir: p.dir, precision: p.precision,
      rMu: p.rMu || 0.45, label: p.label || muPreset,
    });
    this.tsundere = new Tsundere({ subtype, s0 });
    this.gainPos = gainPos;
    this.gainNeg = gainNeg;

    // ⭐ A4 词库
    this.lexicon = lexicon || (Lexicon ? new Lexicon() : null);
    this.useLexiconSignature = useLexiconSignature;

    this.E = this.mu.vector.slice();   // 初始状态 E₀ = μ（A3 裁定）
    this.turn = 0;
    this.history = [];
  }

  /** ⭐ 反应增益：按 ΔE 的效价符号选 g_正 / g_负（AET pp.38-39） */
  gainFor(dERaw) {
    // 用 ΔE 在愉悦轴上的投影判正负
    return (dERaw[0] >= 0) ? this.gainPos : this.gainNeg;
  }

  /**
   * ⭐ 主推进
   * @param {object} ev  事件
   * @param {object} ev.appraisal  评价结果（LLM 直填，或 rule-based）
   * @param {string} ev.eventKey   事件类别（用于习惯化计数）
   * @param {object} ev.context    情境
   * @param {number} ev.context.strategyScale 策略缩放 g（brainsci：间接回复 ≈0.35）
   * @param {string[]} ev.context.triggers  情境触发（audience/alone/calledOut/…）
   */
  step(ev = {}) {
    this.turn++;
    const ctx = ev.context || {};

    // ── ① 评价 ──
    const a = appraisal.aiAppraise(ev.appraisal);
    const evalCtx = { mu: this.mu.vector, space: this.space, attention: ctx.attention || 1.0 };
    const ar = appraisal.appraisalToDeltaE(a, evalCtx);

    // ── ①′ ⭐ 词库：匹配候选概念（可选增强）──
    let concept = null, candidates = [];
    if (this.lexicon) {
      candidates = this.lexicon.matchAppraisal(a, {
        valence: ar.valence,
        octantHint: ar.octant,
        categoryHint: ar.direction,
        top: 6,
      });
      concept = candidates[0] || null;
      // 可选：用选中词的签名替代八型签名（更细的分辨率）
      if (concept && this.useLexiconSignature) {
        const sig = concept.signature;
        ar.dE = V.mul(sig, V.norm(ar.dE));
      }
    }

    // ── ② 情境触发表达层 ──
    if (Array.isArray(ctx.triggers)) {
      for (const t of ctx.triggers) this.tsundere.apply(t, ctx.triggerStrength || 1);
    }

    // ── ③ 反应增益 + 策略缩放 ──
    const gGain = this.gainFor(ar.dE);
    const gStrategy = ctx.strategyScale === undefined ? 1 : ctx.strategyScale;

    // ── ④ 动力学 ──
    const dyn = this.dynamics.step(ar.dE, this.mu.vector, {
      eventKey: ev.eventKey || null,
      g: gGain * gStrategy,
    });
    this.E = dyn.E;

    // ── ⑤ 表达层 ──
    const exp = this.tsundere.express(this.E, this.mu.vector);

    const rec = {
      turn: this.turn,
      // 评价
      appraisal: a,
      direction: ar.direction,
      octant: ar.octant,
      alpha: ar.alpha,
      eps: ar.eps,
      valence: ar.valence,
      intensity: ar.intensity,
      dE: ar.dE,
      // 动力学
      h: dyn.h,
      exposure: dyn.exposure,
      gGain, gStrategy,
      r: dyn.r, rRaw: dyn.rRaw,
      // 表达
      E_inner: this.E.slice(),
      E_outer: exp.eOuter,
      s: exp.s, sEff: exp.sEff,
      leak: exp.leak, leakAmount: exp.leakAmount,
      // 量程
      percentile: this.space.percentile(dyn.r),
      note: ar.note,
      // ⭐ 词库概念
      concept: concept ? {
        word: concept.word, gloss: concept.gloss, theme: concept.theme,
        category: concept.category, octant: concept.octant,
        kind: concept.kind, intensity: concept.intensity, goal: concept.goal,
      } : null,
      candidates: candidates.map(c => c.word),
    };
    this.history.push(rec);
    return rec;
  }

  /** 只过时间、无事件 */
  idle(n = 1) {
    for (let i = 0; i < n; i++) {
      this.dynamics.step([0, 0, 0], this.mu.vector, { h: 1 });
      this.E = this.dynamics.E.slice();
    }
    return this.E.slice();
  }

  /**

   * ⭐ 心境 ↔ 情绪开关（AET p.18）
   *   情绪 → 心境：失去对触发事件的聚焦
   *   心境 → 情绪：使心境的原因变得显著
   * @param {boolean} causeSalient 原因是否显著
   */
  moodSwitch(causeSalient) {
    // 原因显著 → 弥散心境收敛为具体情绪（全局影响削弱）
    return causeSalient
      ? { state: 'emotion', globalGain: 1.0, desc: '原因显著 → 具体情绪，全局影响被削弱' }
      : { state: 'mood', globalGain: 1.6, desc: '原因模糊 → 弥散心境，全局影响被放大' };
  }

  describe() {
    return [
      `── ${this.name} ──`,
      `  ${this.space.describe()}`,
      `  ${this.dynamics.describe()}`,
      `  ${this.mu.describe()}`,
      `  ${this.tsundere.describe()}`,
      `  g_i = (正 ${this.gainPos}, 负 ${this.gainNeg})`,
      `  当前 E = ${V.fmt(this.E)}  r = ${V.norm(V.sub(this.E, this.mu.vector)).toFixed(3)}`,
    ].join('\n');
  }
}

module.exports = { Character, appraisal };
