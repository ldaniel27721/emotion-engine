// 傲娇表达层 —— 刺激/情绪 → 表达
//
//   E_outer = μ + s · (E_inner − μ)
//
// 理论地位：
//   ⚠️ 这一层【文献里没有】。傲娇是亚文化圈的萌属性，学术理论不支持其研究。
//      定义来自 the-dere-types wiki（粉丝维基）+ 设定者的裁定。
//      故本模块【不可作为学术依据对外引用】，只作工程实现。
//
// 结构（2026-10-12 落档 · 傲娇的机制结构.md）：
//   里层 E_inner : dere（爱 / 依恋 / 想被宠）—— 完整、强烈
//         ↓
//   抑制 s       : 抑制强度 ∈ [0,1] —— 连续谱（wiki 用 1−10 的 Honesty 反向标注）
//         ↓
//   泄露 L       : 泄露走哪条路 —— 18 个亚型的核心差异
//         ↓
//   表层 E_outer : 说出来的话 / 做出来的事
//
// 与 topdown2025 的对接：
//   d′ / drift rate     = 知觉【本身】（真实感受）      ← E_inner
//   c  / starting point = 判断 / 【报告偏向】           ← ⭐ 傲娇在这里
//
// ⭐ 核心判据（wiki 逐字）：
//   ① intentional（故意的）—— 不是失控、不是脾气坏
//   ② towards their love interest（对象特定）
//   ③ 区分【真实感受】与【因害羞而造的公开形象】
//   ④ 在 tsun 与 dere 之间【切换】
'use strict';

const { V } = require('./space');

// ────────────────────────────────────────────────
// ⭐ 泄露通道（来自 18 亚型的核心差异）
// ────────────────────────────────────────────────
const LEAK_CHANNEL = {
  /** Tsundere / Tsundere 本体：独处时不抑制 */
  none:        { id: 'none',        desc: '无特定通道（靠场合切换）' },
  /** Tsuntere：害羞 → 口头攻击 → 骂完就跑 */
  attack:      { id: 'attack',      desc: '语无伦次地攻击，说完就跑' },
  /** Tsun-Ama：嘴上冷淡，行动上过度宠溺 */
  action:      { id: 'action',      desc: '嘴上冷淡，行动上送礼/照顾' },
  /** Tsunneko：身体语言（耳朵/尾巴） */
  body:        { id: 'body',        desc: '身体语言泄露（脸红/僵住/靠近）' },
  /** Roshidere：外语说真心话 */
  altLanguage: { id: 'altLanguage', desc: '用别的语言/媒介说真心话' },
  /** Tsunshun：事后自己难过 */
  regret:      { id: 'regret',      desc: '事后独处时因自己不够诚实而难过' },
  /** Tsunpuri / Tsundero：用替代理由掩盖 */
  excuse:      { id: 'excuse',      desc: '用一个冠冕的理由掩盖真实理由' },
  /** Tsun-Pure：双手捂嘴 */
  suppress:    { id: 'suppress',    desc: '物理性地阻止自己说真话' },
  /** Tsunbaka：健忘 → 必须被照顾 */
  dependent:   { id: 'dependent',   desc: '健忘/依赖，迫使对方照顾' },
};

// ────────────────────────────────────────────────
// ⭐ 18 亚型 → (抑制基线 s₀, 泄露通道, 触发特点)
//    s₀ 越小 = 抑制越强
//    ⭐ s₀ 的标定依据：wiki 的 Honesty 1–10，取 s₀ ≈ (Honesty−1)/9 再按亚型微调
// ────────────────────────────────────────────────
const SUBTYPE = {
  Tsundere:   { s0: 0.30, leak: 'none',        honesty: 5, desc: '本体：冷淡/高傲，只对特定对象；独处→dere' },
  Tsundora:   { s0: 0.10, leak: 'none',        honesty: 2, desc: '冻原：极端冷淡，看不出 dere（"higher state"）' },
  Tsuntere:   { s0: 0.25, leak: 'attack',      honesty: 4, desc: '照れ：害羞→口头攻击→骂完就跑' },
  Tsunshun:   { s0: 0.30, leak: 'regret',      honesty: 3, desc: 'しゅん：冷淡→事后自己难过' },
  Tsunbaka:   { s0: 0.35, leak: 'dependent',   honesty: 4, desc: 'バカ：嘴硬+健忘→必须被照顾' },
  Tsungire:   { s0: 0.20, leak: 'attack',      honesty: 3, desc: '切れ：发怒推开（而非冷淡）' },
  'Tsun-Ama': { s0: 0.45, leak: 'action',      honesty: 6, desc: '甘え：嘴上冷淡，行动上过度宠溺' },
  Tsunneko:   { s0: 0.35, leak: 'body',        honesty: 4, desc: 'ネコ：身体语言泄露' },
  Tsunpuri:   { s0: 0.40, leak: 'excuse',      honesty: 5, desc: '公主：用"王室职责"做借口' },
  Roshidere:  { s0: 0.40, leak: 'altLanguage', honesty: 5, desc: '用外语说真心话' },
  Deretsun:   { s0: 0.70, leak: 'none',        honesty: 9, desc: '反向：平时 dere，被指出时转 tsun' },
  'Tsun-Aho': { s0: 0.25, leak: 'none',        honesty: 3, desc: 'アホ：过度伪装反而显得蠢' },
  'Tsun-Pure':{ s0: 0.30, leak: 'suppress',    honesty: 4, desc: 'ピュア：双手捂嘴' },
  Tsundero:   { s0: 0.20, leak: 'excuse',      honesty: 3, desc: 'デロ：用替代理由掩盖' },
  Biridere:   { s0: 0.15, leak: 'attack',      honesty: 2, desc: '电击型：冲动性伤害' },
  Gandere:    { s0: 0.15, leak: 'attack',      honesty: 2, desc: '枪型：fight-or-flight 冲动' },
  Gundere:    { s0: 0.20, leak: 'attack',      honesty: 3, desc: '军型：训斥掩盖' },
  Oranyan:    { s0: 0.10, leak: 'none',        honesty: 1, desc: '⚠️ 无独立定义页，仅 Vegeta 一例' },
};

// ────────────────────────────────────────────────
// ⭐ 情境影响（改变 s）
//
// ⚠️ 分三类（2026-10-12 修正）：
//   · state 状态类：描述"现在是什么场合"—— 【设定】而非累加
//        audience（有观众）/ alone（两人独处）
//     依据 wiki 逐字："acting all lovey-dovey when alone … when people are
//     watching they treat them coldly" ⇒ 这是场合切换，不是可叠加的事件
//   · event 事件类：描述"刚刚发生了什么"—— 【一次性偏移】，然后按疲劳衰减
//        calledOut / flustered / impulse / intimacy
//   · ⭐ attachment 对象类：描述"当前互动对象有多重要"—— 【连续量】
//        objectAttachment ∈ [0,1]
//
// ⭐⭐⭐ 2026-10-12 设定者裁定（覆盖 wiki 的限制）：
//   「傲娇对象并非恋爱对象，它是一种【人格特质】，
//     是一个对【人、事、物】的【反馈路径】」
//
//   ⇒ 故本层【不】把"对象特定"绑定到恋爱关系，而是抽象为【在意程度】：
//        越在意 → 越怕被看穿 → s 越低（抑制越强）
//        不在意 → 无所谓   → s 越高（不抑制）
//
//   ⭐ 这条反而解释了 wiki 的观察（"只对喜欢的人冷"），
//      而不需要"恋爱"这个额外假设 —— 它只是"在意程度"的一个特例。
//
//   s = clamp( s₀ + 状态偏移 + 事件累积 + 对象偏移 + 疲劳 )
// ────────────────────────────────────────────────
const TRIGGER = {
  /** ⭐ 状态：有观众在场 → 抑制增强（s 降低） */
  audience:      { kind: 'state', dS: -0.40, desc: '有他人在场' },
  /** ⭐ 状态：两人独处 → 抑制解除（s 升高）—— 对象在场且无观众 */
  alone:         { kind: 'state', dS: +0.55, desc: '只有两人独处（对象在场）' },
  /** ⭐ 状态：无人在场（对象可能也不在）→ 抑制【轻度】解除
   *   与 alone 的区别：alone 暗示"对象在场所以可以放心"，
   *   unobserved 只是"没人看着"，不暗示对象在场。
   *   ⚠️ 2026-10-12 加：桑多涅在"无人的庭园"（哥伦比娅失踪、无人在场）
   *   若按 alone 计会把 s 拉回中等，与文本的极强抑制不符。 */
  unobserved:    { kind: 'state', dS: +0.25, desc: '无人在场（对象也不在）' },
  /** ⭐ 事件：被戳中 → 抑制失效 —— 设定者的核心机制 */
  calledOut:     { kind: 'event', dS: +0.45, desc: '用户点到了心坎子上' },
  /** 事件：害羞/难为情 → 抑制增强 */
  flustered:     { kind: 'event', dS: -0.25, desc: '羞耻/慌' },
  /** 事件：冲动/生理唤醒 → 抑制被冲垮（Gandere: fight-or-flight） */
  impulse:       { kind: 'event', dS: +0.30, desc: '情绪冲动压倒抑制' },
  /** 事件：关系深化 → 抑制缓慢减弱（所有亚型 "over time … more honest"） */
  intimacy:      { kind: 'event', dS: +0.10, desc: '关系深化' },
};

/** 状态类触发的默认值（都不在场 = 中性场合） */
const STATE_DEFAULT = { audience: false, alone: false };

class Tsundere {
  /**
   * @param {object} o
   * @param {string|string[]} o.subtype  亚型（可叠加，取最强者；wiki 显示可 4 重）
   * @param {number} o.s0                覆盖基线抑制强度
   * @param {number} o.fatigueRate       抑制疲劳速率（我的推断：维持抑制要耗资源）
   */
  constructor({ subtype = ['Tsundere'], s0 = null, fatigueRate = 0.04, leak = null } = {}) {
    const subs = Array.isArray(subtype) ? subtype : [subtype];
    this.subtypes = subs.filter(s => SUBTYPE[s]);
    if (this.subtypes.length === 0) this.subtypes = ['Tsundere'];

    // 叠加取【最强抑制】（s₀ 最小）
    const base = Math.min(...this.subtypes.map(s => SUBTYPE[s].s0));
    this.s0 = s0 === null ? base : s0;
    this.leakId = leak || SUBTYPE[this.subtypes[0]].leak;
    this.leak = LEAK_CHANNEL[this.leakId] || LEAK_CHANNEL.none;

    this.fatigueRate = fatigueRate;
    this.reset();
  }

  reset() {
    this.s = this.s0;          // 当前抑制强度（含状态与事件偏移）
    this.fatigue = 0;          // 积累的疲劳（抑制维持的代价）
    this.state = { audience: false, alone: false, unobserved: false };  // ⭐ 情境状态
    this.eventOffset = 0;      // ⭐ 事件偏移的累积（按疲劳衰减）
    this.attachment = 0;       // ⭐ 对当前互动对象的在意程度 ∈ [0,1]
    this.attachmentGain = 0.35;// ⭐ 在意程度对抑制的权重
    this.history = [];
  }

  /**
   * ⭐⭐⭐ 设定对当前互动对象的在意程度（2026-10-12 设定者裁定）
   *
   * 「傲娇对象并非恋爱对象，它是一种人格特质，是一个对人事物的反馈路径」
   *
   * ⇒ 把"对象特定"抽象为【在意程度】：
   *      越在意 → 越怕被看穿 → s 越低（抑制越强）
   *      不在意 → 无所谓     → s 越高（不抑制）
   *
   * @param {number} v  ∈ [0,1]  0 = 不在意（路人），1 = 极在意（最重要的人）
   */
  setAttachment(v) {
    this.attachment = Math.min(1, Math.max(0, v));
    return this._recalc();
  }

  /**
   * ⭐ 重算 s = clamp(s₀ + 状态偏移 + 事件累积 + 对象偏移 + 疲劳)
   */
  _recalc() {
    let s = this.s0;
    for (const [k, on] of Object.entries(this.state)) {
      if (on && TRIGGER[k]) s += TRIGGER[k].dS;
    }
    s += this.eventOffset;
    // ⭐ 对象偏移：在意程度越高，抑制越强（s 越低）
    s -= this.attachmentGain * this.attachment;
    s += this.fatigue * 0.30;
    this.s = Math.min(1, Math.max(0, s));
    return this.s;
  }

  /**
   * 应用一个触发
   *   · 状态类（audience/alone）→ 设定状态后重算（幂等，不会累加）
   *   · 事件类（calledOut/…）  → 累加到 eventOffset 后重算
   */
  apply(triggerName, strength = 1) {
    const t = TRIGGER[triggerName];
    if (!t) return this.s;

    if (t.kind === 'state') {
      // ⭐ 幂等：反复应用同一状态不会叠加
      this.state[triggerName] = true;
      // 状态互斥：三者只能成立一个
      for (const k of Object.keys(this.state)) {
        if (k !== triggerName) this.state[k] = false;
      }
    } else {
      this.eventOffset = Math.max(-0.6, Math.min(0.6, this.eventOffset + t.dS * strength));
    }
    return this._recalc();
  }

  /** 清除某个状态（如"观众走了"） */
  clearState(triggerName) {
    if (triggerName in this.state) this.state[triggerName] = false;
    return this._recalc();
  }

  /**
   * ⭐ 推进一轮：抑制疲劳恢复 + 输出表层情绪
   * @param {number[]} eInner  里层情绪（A1/A2 算出的 E）
   * @param {number[]} mu      底情绪 μ
   */
  express(eInner, mu, opts = {}) {
    const { relax = true } = opts;

    // 抑制疲劳：事件偏移随时间消退；维持抑制耗资源 → 疲劳累积
    if (relax) {
      this.eventOffset *= 0.70;                        // 事件影响逐轮消退
      if (Math.abs(this.eventOffset) < 1e-4) this.eventOffset = 0;
      this.fatigue = Math.max(0, this.fatigue - 0.05); // 疲劳缓慢恢复
    }
    // ⭐ 抑制越强（s 低），维持代价越大 → 疲劳累积越快
    const suppressing = (this.s0 + 0.5) - this.s;
    if (suppressing > 0.2) this.fatigue = Math.min(1.0, this.fatigue + this.fatigueRate * suppressing);
    this._recalc();

    const dev = V.sub(eInner, mu);
    const eOuter = V.add(mu, V.mul(dev, this.s));

    const rec = {
      eInner: eInner.slice(),
      eOuter,
      s: this.s,
      sEff: this.s,
      fatigue: this.fatigue,
      eventOffset: this.eventOffset,
      state: { ...this.state },
      leak: this.leak.id,
      // 泄露量：里层与表层的差
      leakAmount: V.norm(V.sub(eInner, eOuter)),
    };
    this.history.push(rec);
    return rec;
  }

  /** 抑制造成的"内外落差" */
  gap(eInner, mu) {
    const eOuter = V.add(mu, V.mul(V.sub(eInner, mu), this.s));
    return V.norm(V.sub(eInner, eOuter));
  }

  /** 描述这个角色当前状态 */
  describe() {
    const st = Object.entries(this.state).filter(([, v]) => v).map(([k]) => k).join('+') || '中性场合';
    return `Tsundere(亚型=[${this.subtypes.join(',')}] s₀=${this.s0} s=${this.s.toFixed(2)} ` +
      `场合=${st} 事件偏移=${this.eventOffset.toFixed(2)} ` +
      `⭐在意度=${this.attachment.toFixed(2)} 疲劳=${this.fatigue.toFixed(2)} ` +
      `leak=${this.leak.id})`;
  }
}

module.exports = { Tsundere, SUBTYPE, TRIGGER, LEAK_CHANNEL };
