// ⭐ 情绪记忆模块（docs/12 的第 1 步）
//
// 遗忘曲线：R = exp(−t / S)
//   出处：SuperMemo，Wozniak, Gorzelanczyk, Murakowski (1995)
//         https://supermemo.guru/wiki/Forgetting_curve
//     R - probability of recall (retrievability of memory)
//     S - strength of a memory trace (stability of memory)
//     t - time
//
// ⭐ 原文要点（逐字）：
//   · "if all words are reviewed again, their stability will increase and
//      retention time will be extended. This is used in spaced repetition"
//   · "Forgetting is exponential, however, superposition of forgetting rates
//      for different stabilities will make forgetting follow the power law."
//
// ⭐⭐ 本项目的落法（设定者 2026-10-13 裁定）：
//   · t 用【轮次】（记忆只在本会话保留；且引擎的 ρ 也按轮次，两者同轴）
//   · 情绪强度 r 进【S】—— "更容易记住让大肥鱼体验强烈的情绪及其事件"
//   · 记仇/记爱/记恨 = 人格特质调制（加权 S），它们【影响漂移】
//
// ⚠️ 诚实标注：R = exp(−t/S) 是 SuperMemo 的；
//    而 "S 怎么随情绪强度变"（S = f(r)）**没有文献公式**，是本项目的设计。
'use strict';

const V = require('./space').V;

/** 效价的符号：正 / 负 / 中 */
function valenceSign(v) {
  if (v > 0.05) return 'pos';
  if (v < -0.05) return 'neg';
  return 'mid';
}

class EmotionMemory {
  /**
   * @param {object} o
   * @param {number} o.S0          基准记忆稳定性（轮）。R=0.5 时 t = S·ln2
   * @param {number} o.kEmotion    情绪强度对 S 的放大系数：S = S0·(1 + k·r)
   * @param {number} o.kRecall     每次被想起 ⇒ S 增长系数（间隔重复的核心）
   * @param {number} o.minR        低于此可提取性则不再注入（真遗忘）
   * @param {object} o.traits      人格特质：{ neg, pos, object }
   *                               记仇=neg · 记爱=pos · 记恨=object
   * @param {number} o.maxS        S 上限（防反复想起导致失控）
   */
  constructor({
    S0 = 30, kEmotion = 4, kRecall = 0.5, minR = 0.05,
    traits = { neg: 1.0, pos: 1.0, object: 1.0 },
    maxS = null,                 // 默认 S0·(1+kEmotion)·max(traits)
  } = {}) {
    this.S0 = S0;
    this.kEmotion = kEmotion;
    this.kRecall = kRecall;
    this.minR = minR;
    this.traits = Object.assign({ neg: 1.0, pos: 1.0, object: 1.0 }, traits);
    this.maxS = maxS === null
      ? S0 * (1 + kEmotion) * Math.max(this.traits.neg, this.traits.pos, this.traits.object)
      : maxS;
    /** @type {object[]} 记忆条目（按写入顺序） */
    this.entries = [];
    /** 统计：被检索命中过几次（供审计） */
    this.recallCount = 0;
  }

  // ═══════════════════════════════════════════════════════════
  // S（稳定性）：由【当时的情绪强度】与【人格特质】共同决定
  // ═══════════════════════════════════════════════════════════
  /**
   * @param {number} r          当时的情绪强度 ‖E−μ‖
   * @param {string} vSign      效价符号 pos / neg / mid
   * @param {boolean} toObject  是否针对"在意的人/事/物"
   */
  stabilityFor(r, vSign, toObject = false) {
    const base = this.S0 * (1 + this.kEmotion * Math.max(0, Math.min(1, r)));
    const tm = (vSign === 'neg' ? this.traits.neg : vSign === 'pos' ? this.traits.pos : 1.0)
      * (toObject ? this.traits.object : 1.0);
    return Math.min(this.maxS, base * tm);
  }

  /** ⭐ 可提取性 R = exp(−t/S)；t 用【轮次差】 */
  retrievability(entry, nowTurn) {
    const t = Math.max(0, nowTurn - entry.turn);
    return Math.exp(-t / entry.S);
  }

  // ═══════════════════════════════════════════════════════════
  // 写入
  // ═══════════════════════════════════════════════════════════
  /**
   * @param {object} o
   * @param {number}   o.turn        轮次
   * @param {string}   o.at          真实时间（ISO）—— 本会话保留，暂不参与打分
   * @param {string}   o.event       事件摘要（自然语言）
   * @param {string}   o.eventKey    事件类别
   * @param {object}   o.emotion     { direction, octant, valence, r, E }
   * @param {number}   o.importance  AET 一级评价的 importance
   * @param {boolean}  o.toObject    是否针对在意的人/事/物
   */
  add({ turn, at = null, event, eventKey = null, emotion, importance = 0.5, toObject = false }) {
    const vSign = valenceSign(emotion.valence ?? 0);
    const S = this.stabilityFor(emotion.r ?? 0, vSign, toObject);
    const e = {
      turn, at, event, eventKey,
      emotion: Object.assign({}, emotion),
      importance,
      vSign, toObject,
      S,                       // ⭐ 写入时定下稳定性
      recalls: 0,              // 被想起几次
    };
    this.entries.push(e);
    return e;
  }

  // ═══════════════════════════════════════════════════════════
  // 检索
  // ═══════════════════════════════════════════════════════════
  /**
   * ⭐ 打分 = 可提取性 R × 重要性 importance
   *    （设定者："按遗忘曲线分析记忆注入强度" ⇒ 主项是 R）
   */
  score(entry, nowTurn) {
    return this.retrievability(entry, nowTurn) * entry.importance;
  }

  /** 当前所有记忆的 (条目, R, 分数)，按分数降序 */
  ranked(nowTurn) {
    return this.entries
      .map(e => ({ entry: e, R: this.retrievability(e, nowTurn), score: this.score(e, nowTurn) }))
      .sort((a, b) => b.score - a.score);
  }

  /**
   * ⭐ 取 top-k 用于注入。被选中的记忆会【S 增长】（间隔重复）
   * @param {number} nowTurn
   * @param {number} k
   * @param {object} o
   * @param {boolean} o.rehearse  是否把"被注入"当作一次复习（默认 true）
   */
  retrieve(nowTurn, k = 4, { rehearse = true } = {}) {
    const all = this.ranked(nowTurn);
    // ⚠️ 真遗忘：低于 minR 的不再注入
    const alive = all.filter(x => x.R >= this.minR);
    const top = alive.slice(0, k);
    if (rehearse) {
      for (const x of top) {
        x.entry.recalls++;
        x.entry.S = Math.min(this.maxS, x.entry.S * (1 + this.kRecall));  // ⭐ 间隔重复
        this.recallCount++;
      }
    }
    return top;
  }

  // ═══════════════════════════════════════════════════════════
  // 注入渲染（自然语言，非 JSON）
  // ═══════════════════════════════════════════════════════════
  /**
   * @param {object[]} hits  retrieve() 的返回值
   * @param {number}   nowTurn
   */
  render(hits, nowTurn) {
    if (!hits.length) return '';
    const relTime = (t) => {
      const d = nowTurn - t;
      if (d <= 1) return '刚才';
      if (d <= 3) return '方才几轮';
      if (d <= 8) return '早些时候';
      if (d <= 20) return '之前一阵';
      return '很久以前';
    };
    const lines = hits.map(({ entry }) => {
      const emo = entry.emotion;
      const dirCN = {
        Happiness: '开心', Caring: '软下来', Calm: '平静', Anger: '生气',
        Fear: '害怕', Confusion: '困惑', Remorse: '自责', Hurt: '难受',
        Contempt: '看不上', Depression: '沮丧', Loneliness: '孤单', Inadequate: '觉得自己不够好',
      }[emo.direction] || emo.direction || '说不清';
      const strength = emo.r >= 0.7 ? '特别' : emo.r >= 0.4 ? '挺' : '有点';
      return '· ' + relTime(entry.turn) + ' ' + entry.event + ' → 你当时' + strength + dirCN;
    });
    return '【你还记得的】\n' + lines.join('\n');
  }

  // ═══════════════════════════════════════════════════════════
  // 供 μ 漂移用：记忆的加权向量和
  // ═══════════════════════════════════════════════════════════
  /**
   * ⭐ 漂移输入 = Σ R(now) · 情绪向量
   *    ⚠️ 注意：这是【喂 μ.drift()】用的，与注入 LLM 是两条独立路径（docs/12 §2 铁律）
   */
  driftVector(nowTurn) {
    let acc = [0, 0, 0];
    for (const e of this.entries) {
      const R = this.retrievability(e, nowTurn);
      if (R < this.minR) continue;
      const vec = e.emotion.E || [0, 0, 0];
      acc = V.add(acc, V.mul(V.unit(vec), R * e.importance));
    }
    return acc;
  }

  /** 供审计的摘要 */
  describe(nowTurn) {
    const r = this.ranked(nowTurn);
    return r.map(x => '[' + x.entry.turn + '] R=' + x.R.toFixed(4) +
      ' S=' + x.entry.S.toFixed(2) + ' score=' + x.score.toFixed(4) +
      ' recalls=' + x.entry.recalls + '  ' + x.entry.event.slice(0, 20));
  }
}

module.exports = { EmotionMemory, valenceSign };
