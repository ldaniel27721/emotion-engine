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
    //
    // ⚠️⚠️ 引用纪律（docs/06 的 B7 + docs/07 的证据分级）：
    //   文献（nihms / Mote et al.）的结论是「放大利正 > 压制负向」——
    //      PA 预测动机（b=0.20~0.43, p<.001），NA 不预测。
    //   ⭐ 而本项目取 g_负 > g_正（傲娇被戳更疼）——
    //      这是【设定者裁定层】的决定，其权威**高于**上述文献意见。
    //   ⇒ 文献在此只作【对照】，不作约束。不得写成"没有文献依据的工程取值"。
    //   （立此存照：docs/07-证据分级与裁定权.md 第 3 节）
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
    // ⚠️⚠️ 2026-10-12 修正（Codex 审计）：Dynamics 内部状态默认是 [0,0,0]，
    //   而 step() 用它起算 ⇒ 必须在这里同步，否则第一轮起点不是 μ。
    this.dynamics.syncTo(this.E);
    // ⭐ 心境状态（AET p.18：原因显著 ⇄ 弥散心境）
    this.moodState = 'emotion';   // 'emotion' | 'mood'
    this.moodGain = 1.6;          // 弥散心境时的全局增益
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
    const evalCtx = {
      mu: this.mu.vector,
      space: this.space,
      attention: ctx.attention || 1.0,
      // ⭐ 2026-10-12：把 μ 的 precision 接进主循环（原先完全没参与）
      muPrecision: this.mu.precision,
    };
    const ar = appraisal.appraisalToDeltaE(a, evalCtx);

    // ⭐ 2026-10-12：心境开关真正生效（原先只返回描述、不改行为）
    //   AET p.18：原因模糊 ⇒ 弥散心境 ⇒ 全局影响【放大】
    //             原因显著 ⇒ 具体情绪 ⇒ 全局影响【削弱】
    const globalGain = this.moodState === 'mood' ? this.moodGain : 1.0;
    if (globalGain !== 1.0) ar.dE = V.mul(ar.dE, globalGain);

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
      // 可选：用选中词的签名替代八型签名
      // ⚠️ 注意（Codex 审计更正）：词库签名与八型签名【数值同源】，
      //    这条分支不会提升分辨率；真正的增益是"选词"本身与语义锚。
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
      // ⚠️ 2026-10-13 修正：B2 的情境名原先【没有透传】——
      //    dynamics 那边支持 opts.context，但 Character 这一层从没传过，
      //    导致 rhoByContext 走 Character 完全用不上（只能直接调 Dynamics）。
      //    ⭐ 走 ev.context.scene（避免与 ev.context 这个对象本身重名）。
      context: ctx.scene,
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
      priorStrength: ar.priorStrength,   // ⭐ 2026-10-12：暴露先验强度（precision 的接入痕迹）
      valence: ar.valence,
      intensity: ar.intensity,
      dE: ar.dE,
      // 动力学
      h: dyn.h,
      exposure: dyn.exposure,
      gGain, gStrategy,
      // ⚠️ 2026-10-13 修正：下面这几个原先【没有透传】——
      //    dynamics.step() 已经算出来了，engine 的 rec 却只取了 h/exposure/r/rRaw，
      //    导致审计时看不出"实际乘进去的 g 是多少""实际用的 ρ 是哪个档"。
      g: gGain * gStrategy,        // ⭐ 合成后的 g（真正乘进 ΔE 的那个）
      rho: dyn.rho,                // ⭐ 实际用到的 ρ
      rhoContext: dyn.rhoContext,  // ⭐ B2 情境调整后的 ρ（未启用为 null）
      context: dyn.context,        // ⭐ 本轮生效的情境名
      noveltyFired: dyn.noveltyFired, // ⭐ B3 是否触发新颖性复位
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
    // ⚠️ 2026-10-12 修正（Codex 审计）：原先只 return 一个描述对象、
    //   完全不改状态 ⇒ 开关是死的。现改为【真的写状态】，
    //   并在 step() 里用 this.moodGain 缩放 ΔE。
    this.moodState = causeSalient ? 'emotion' : 'mood';
    return causeSalient
      ? { state: 'emotion', globalGain: 1.0, desc: '原因显著 → 具体情绪，全局影响被削弱' }
      : { state: 'mood', globalGain: this.moodGain, desc: '原因模糊 → 弥散心境，全局影响被放大' };
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
