// 评价层 —— 刺激 → 评价 → ΔE
//
// 理论依据（11 篇文献整合）：
//   · moors2013: "variable relation between stimuli and emotions,
//                 but a stable relation between appraisals and emotions"
//     ⇒ ⭐ ΔE 不能由事件直接算，必须由【评价】算
//   · AET (1996): 两级评价
//       一级 = goal relevance + goal congruence + importance → (价效, 强度)
//       二级 = 后果/归因/应对潜力/未来预期 → 具体离散情绪
//   · moors2013: 五核心变量 = goal relevance · goal congruence ·
//                certainty · agency · coping potential
//   · topdown2025: ΔE 可拆三旋钮（起点=μ / 漂移=注意 / 标准=期望）
//   · barrett2016: 精度门控（只有与生存/资源/奖励/威胁相关、或价值不确定的误差才被学）
//
// ⚠️ 设定者的裁定（2026-10-12）：
//   「评价计算得完全由 AI 自己来理解，这个限制性很小」
//   ⇒ 本模块的定位是【结构 + 参考实现】：
//       ① 定义评价变量（结构，必须固定 —— 否则每轮抽的特征不同）
//       ② 提供 rule-based 参考实现（可跑、可测、可对照）
//       ③ 留出 LLM 直填接口（aiAppraise()），让模型自己理解
//   这样"准"来自【模板稳定】，而不是【硬编码规则】。
'use strict';

const { V } = require('./space');

// ────────────────────────────────────────────────
// ⭐ 八型 → PAD 单位签名（A4 定案）
//    P = 愉悦 · A = 唤醒 · D = 支配
// ────────────────────────────────────────────────
const OCTANT = {
  Exuberant:  [ 1,  1,  1],   // 快乐/兴奋
  Dependent:  [ 1,  1, -1],   // 依恋/被照顾
  Relaxed:    [ 1, -1,  1],   // 平静/满足
  Docile:     [ 1, -1, -1],   // 温顺/服从（⚠️ 中文词库此类为空）
  Hostile:    [-1,  1,  1],   // 愤怒/敌意
  Anxious:    [-1,  1, -1],   // 恐惧/焦虑/受伤
  Disdainful: [-1, -1,  1],   // 轻蔑/鄙夷
  Bored:      [-1, -1, -1],   // 沮丧/厌倦
};

// ────────────────────────────────────────────────
// ⭐ 12 方向类 → 八型（A4 定案）
// ────────────────────────────────────────────────
const DIRECTION_TO_OCTANT = {
  Happiness:  'Exuberant',
  Caring:     'Dependent',
  Calm:       'Relaxed',
  Anger:      'Hostile',
  Fear:       'Anxious',
  Confusion:  'Anxious',
  Remorse:    'Anxious',
  Hurt:       'Anxious',
  Contempt:   'Disdainful',
  Depression: 'Bored',
  Loneliness: 'Bored',
  Inadequate: 'Bored',
};

// ────────────────────────────────────────────────
// ⭐ 二级评价 → 12 方向类（参考规则）
//
// 依据：
//   · Lazarus 1991（moors2013 p.122 引）:
//       goal relevant + goal incongruent + difficult to cope → FEAR
//   · AET pp.38-39 引 Imada & Ellsworth 2011:
//       agency=self → shame；agency=other → anger
//   · 词库的 12 类来自 Emotion-Feelings 的语义分组
// ────────────────────────────────────────────────
function classifyDirection(a) {
  const { relevance, congruence, importance, agency, coping, certainty, intentionality } = a;

  // 不相关 → 无情绪（AET p.31: "Some, but by no means all, events have affective significance"）
  if (relevance < 0.15 || importance < 0.10) return { direction: null, octant: null, note: '无情感意义 → ΔE = 0' };

  const congruent = congruence > 0;

  if (congruent) {
    // ── 符合关切 ──
    // ⭐ Dependent（+,+,−）: 对方主动给予善意，而自己【无力/无需回报】
    //    依据设定者裁定：「激发软弱退化想被保护的状态」
    //    与 wiki 的 amae（甘え）= "wanting to be spoiled" 一致
    if (agency === 'other' && coping < 0.55 && intentionality > 0.5) {
      return { direction: 'Caring', octant: 'Dependent', note: '被主动善待且无力回报 → 依恋/想被宠' };
    }
    if (agency === 'other') return { direction: 'Happiness', octant: 'Exuberant', note: '他人带来的好事' };
    if (importance < 0.35)  return { direction: 'Calm',      octant: 'Relaxed',   note: '低强度的满足 → 平静' };
    return { direction: 'Happiness', octant: 'Exuberant', note: '符合关切' };
  }

  // ── 阻碍关切 ──
  if (agency === 'self') {
    return { direction: 'Remorse', octant: 'Anxious', note: '自责 → 内疚/羞耻' };
  }
  if (agency === 'other') {
    if (intentionality > 0.6) return { direction: 'Anger',    octant: 'Hostile',   note: '他人故意 → 愤怒' };
    if (coping > 0.6)         return { direction: 'Contempt', octant: 'Disdainful',note: '他人但可应对 → 轻蔑' };
    return { direction: 'Hurt', octant: 'Anxious', note: '他人无意但伤到 → 受伤' };
  }
  // agency = none / environment
  if (coping < 0.35)          return { direction: 'Depression', octant: 'Bored',   note: '无法应对 → 沮丧' };
  if (certainty < 0.4)        return { direction: 'Confusion',  octant: 'Anxious', note: '不确定 → 困惑' };
  return { direction: 'Depression', octant: 'Bored', note: '环境所致' };
}

// ────────────────────────────────────────────────
// ⭐ 一级评价 → (价效, 强度)
// ────────────────────────────────────────────────
function primaryAppraisal(a) {
  // 价效：方向 × 相关性 × 重要性
  const valence = a.congruence * a.relevance;

  // 强度：AET p.32 "intensity is directly correlated with the importance
  //        or desirability of the goal"，另加调制项
  const modUnexpected = 1 + 0.5 * (1 - a.expectancy);   // 意外↑
  const modArousal    = 1 + 0.3 * (a.currentArousal || 0);// 既有唤醒↑
  const intensity = Math.min(1, a.importance * a.relevance * modUnexpected * modArousal);

  return { valence, intensity };
}

// ────────────────────────────────────────────────
// ⭐ 精度门控（barrett2016 p.15）
//    只有与【生存/资源/奖励/威胁】相关、或价值不确定的误差才被学
// ────────────────────────────────────────────────
function precisionGate(a) {
  const survivalRelevant = a.relevance * a.importance;      // 与关切相关的程度
  const valueUncertain   = 1 - a.certainty;                 // 价值不确定
  // 二者取较大者（"或"）
  const alpha = Math.max(survivalRelevant, valueUncertain * a.relevance);
  return Math.min(1, Math.max(0, alpha));
}

// ────────────────────────────────────────────────
// ⭐ 评价 → ΔE（乘法结构）
//
//   ΔE = α(精度) × ε(预测误差) × signature(签名)
//
//   其中 ε 可拆三旋钮（topdown2025）：
//     起点项 = μ（先验）· 漂移项 = 显著度/注意 · 标准项 = 期望
// ────────────────────────────────────────────────
function appraisalToDeltaE(a, ctx) {
  const { mu, space, attention = 1.0, muPrecision = 1.0 } = ctx;

  const dir = classifyDirection(a);
  if (!dir.direction) {
    // ⚠️ 2026-10-13 修正：这个 early return 原先【缺 valence 与 intensity】——
    //    导致"无情感意义"那一轮的记录里这两项是 undefined，
    //    审计时看不出"是相关性本来就近 0，还是别的原因"。
    //    ⭐ 这两个量只是算术，照算即可；归零的是 ΔE，不是它们。
    const primZero = primaryAppraisal(a);
    return {
      dE: [0, 0, 0], direction: null, octant: null,
      alpha: 0, eps: 0, priorStrength: 0,
      valence: primZero.valence, intensity: primZero.intensity,
      note: dir.note,
    };
  }

  const prim = primaryAppraisal(a);
  const alpha = precisionGate(a);

  // signature：八型的单位向量
  const signature = V.unit(OCTANT[dir.octant]);

  // ε（预测误差）：期望与现实的差 —— 用期望值(expectancy)与价效的一致性度量
  //   期望为正而现实为负（或反之）→ 误差大
  const expectedValence = (a.expectancy - 0.5) * 2;      // [−1,1]
  const eps = Math.abs(prim.valence - expectedValence) * 0.5 + 0.5 * (1 - a.certainty);

  // 起点项：把 ΔE 朝 μ 的方向拉 —— 先验的"锚"
  //
  // ⚠️ 2026-10-12 修正（Codex 审计：precision 未接入主循环）：
  //   topdown2025 说 μ 的 precision 是【知觉层的先验】，
  //   "先验因不确定性更低而支配知觉"（Box 2, p.393）
  //   ⇒ precision 越高，模糊事件越是【被读成符合先验】。
  //   原先这里写死 0.15，precision 完全不参与 ⇒ 现改为按 precision 缩放。
  const priorStrength = 0.15 * (1 - a.certainty) * (muPrecision / 3);
  const priorPull = V.mul(V.unit(mu), priorStrength);

  // 强度：一级评价的 intensity
  const mag = prim.intensity;

  // 组合
  let dE = V.mul(signature, alpha * eps * mag * attention);
  dE = V.add(dE, V.mul(priorPull, mag));

  return {
    dE,
    dir,
    direction: dir.direction,
    octant: dir.octant,
    alpha,
    eps,
    valence: prim.valence,
    intensity: prim.intensity,
    priorStrength,
    note: dir.note,
  };
}

// ────────────────────────────────────────────────
// ⭐ LLM 直填接口（设定者裁定：评价由 AI 自己理解）
//
//   模型只需输出这个结构，其余交给引擎。
//   字段名与上面的 rule-based 版一致 —— 两条路可互换、可对照。
// ────────────────────────────────────────────────
function aiAppraise(llmOutput) {
  const D = {
    relevance: 0.5, congruence: 0, importance: 0.5,
    agency: 'none', coping: 0.5, certainty: 0.5,
    expectancy: 0.5, intentionality: 0.5, currentArousal: 0,
  };
  if (typeof llmOutput !== 'object' || llmOutput === null) return { ...D };
  const out = { ...D };
  for (const k of Object.keys(D)) {
    if (llmOutput[k] !== undefined) out[k] = llmOutput[k];
  }
  return out;
}

/** 提示词骨架：让模型按固定字段产出评价（模板稳定 → 结果可复现） */
const APPRAISAL_SCHEMA = `{
  "relevance":     0..1   // 该事件与角色关切的【相关程度】
  "congruence":   -1..1   // 符合(+)还是阻碍(−)关切
  "importance":    0..1   // 对角色的【重要程度】
  "agency":        "self"|"other"|"environment"|"none"
  "coping":        0..1   // 角色【能否应对】
  "certainty":     0..1   // 角色对情况【有多确定】
  "expectancy":    0..1   // 角色【原本预期】会发生什么(0=极坏,1=极好)
  "intentionality":0..1   // 对方【是否故意】(仅 agency=other 时有意义)
  "currentArousal":0..1   // 事件发生前角色【已被激活的程度】
}`;

module.exports = {
  OCTANT,
  DIRECTION_TO_OCTANT,
  classifyDirection,
  primaryAppraisal,
  precisionGate,
  appraisalToDeltaE,
  aiAppraise,
  APPRAISAL_SCHEMA,
};
