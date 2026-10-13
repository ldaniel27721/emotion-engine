// ⭐ 情绪记忆（修正版）—— 设定者 2026-10-13 第 2 次更正
//
// ⚠️⚠️ 本鱼此前把它当"记忆系统"，设定者更正：
//   「这个东西针对的是【情绪的衰减】而不是【记忆的问题】，大肥鱼你要清楚别绕进去了」
//
// ⇒ 它不是"这个事还记得吗"，而是「这个事带来的【情绪】现在还剩下多少」
//
// ⭐ 第二条更正：「S 那就挂评价层上，因为是评价得出结论的然后出的情绪」
//   ⇒ S 由评价层产出的 intensity 决定（不是引擎的 ‖E−μ‖，也不是词库的 strong/mild）
//
// ────────────────────────────────────────────────
// 条目仍只有四样（+ intensity），摘要与情绪词由模型自己提取：
//   { turn, at, summary, emotion, intensity }
//
// 情绪衰减：R = exp(−Δturn / S)     ⭐ R = 这条情绪事件【残余的情绪强度】
//           S = S0 · (1 + k · intensity)   ⭐ S 挂评价层
//
// ⚠️ 仍然【不做】的（设定者明确不要"他们那种复杂的构造"）：
//   复习通道 · 成功/失败双分支 · traits(记仇/记爱/记恨) · driftVector
'use strict';

class EmotionMemory {
  /**
   * @param {object} o
   * @param {number} o.S0     基准情绪稳定性（轮）—— intensity=0 时情绪多久散一半
   * @param {number} o.k      强度增益：intensity=1 的情绪，S 是基准的 (1+k) 倍
   * @param {number} o.topK   每次最多注入几条
   * @param {number} o.minR   情绪残余低于此则不再注入
   */
  constructor({ S0 = 30, k = 4, topK = 4, minR = 0.05 } = {}) {
    this.S0 = S0;
    this.k = k;
    this.topK = topK;
    this.minR = minR;
    /** @type {object[]} */
    this.entries = [];
  }

  /**
   * ⭐ S（情绪稳定性）—— 挂评价层
   * @param {number} intensity 评价层产出的情绪强度（0–1，由模型判断）
   */
  stabilityFor(intensity) {
    const i = Math.max(0, Math.min(1, Number(intensity) || 0));
    return this.S0 * (1 + this.k * i);
  }

  /**
   * ⭐ 录入一条【情绪事件】。摘要、情绪词、强度都由模型/评价层提供。
   *
   * @param {object} o
   * @param {number} o.turn       轮次步数
   * @param {string} o.at         时间戳（ISO）
   * @param {string} o.summary    事件摘要 —— ⭐ 模型提取
   * @param {string} o.emotion    情绪词   —— ⭐ 模型提取
   * @param {number} o.intensity  情绪强度 —— ⭐ 评价层产出
   * @param {string[]} [o.keywords] 触发关键词（不给则从 summary 切）
   */
  add({ turn, at = null, summary, emotion, intensity = 0, keywords = null }) {
    const e = {
      turn,
      at,
      summary: String(summary || '').trim(),
      emotion: String(emotion || '').trim(),
      intensity: Math.max(0, Math.min(1, Number(intensity) || 0)),
      keywords: keywords && keywords.length ? keywords.slice() : keywordsFrom(summary),
    };
    e.S = this.stabilityFor(e.intensity);      // ⭐ 写入时定下"这条情绪多难忘"
    this.entries.push(e);
    return e;
  }

  /**
   * ⭐ 情绪残余：R = exp(−Δturn / S)
   *   R = 1    情绪还是当初那么强
   *   R = 0.5  只剩一半
   */
  residual(entry, nowTurn) {
    return Math.exp(-Math.max(0, nowTurn - entry.turn) / entry.S);
  }

  /** 这条情绪"还能持续多久"（R 掉到 minR 的轮数） */
  emotionLife(entry) {
    return entry.S * Math.log(1 / this.minR);
  }

  /**
   * ⭐ 检索：关键词命中 + 情绪残余排序
   * @param {number} nowTurn
   * @param {string} hint   当前上下文/事件；null 则不过滤
   * @param {number} [k]
   */
  retrieve(nowTurn, hint = null, k = null) {
    const K = k === null ? this.topK : k;
    const alive = this.entries
      .map(e => ({ entry: e, R: this.residual(e, nowTurn) }))
      .filter(x => x.R >= this.minR);
    let pool = alive;
    if (hint) {
      const toks = tokenize(hint);
      const matched = alive.filter(x =>
        x.entry.keywords.some(w => toks.some(t => t.includes(w) || w.includes(t))));
      if (matched.length) pool = matched;
    }
    return pool.sort((a, b) => b.R - a.R).slice(0, K);
  }

  /** 自然语言注入（相对时间词；标出情绪还剩多少） */
  render(hits, nowTurn) {
    if (!hits.length) return '';
    const lines = hits.map(({ entry, R }) => {
      const faded = R >= 0.7 ? '' : R >= 0.4 ? '（心情已经淡了些）' : '（只记得个大概了）';
      return '· ' + relTime(nowTurn - entry.turn) + ' ' + entry.summary +
        (entry.emotion ? '（你当时' + entry.emotion + '）' : '') + faded;
    });
    return '【你还记得的】\n' + lines.join('\n');
  }

  all() { return this.entries.slice(); }
  get size() { return this.entries.length; }
}

// ────────────────────────────────────────────────
function tokenize(s) {
  const out = [];
  const t = String(s || '');
  for (const m of (t.match(/[A-Za-z][A-Za-z0-9_-]{1,}/g) || [])) out.push(m.toLowerCase());
  for (const seg of (t.match(/[\u4e00-\u9fa5]+/g) || [])) {
    if (seg.length === 1) { out.push(seg); continue; }
    for (let i = 0; i + 2 <= seg.length; i++) out.push(seg.slice(i, i + 2));
  }
  return [...new Set(out)];
}
function keywordsFrom(summary) {
  const out = [];
  for (const seg of (String(summary || '').match(/[\u4e00-\u9fa5]{2,}/g) || [])) {
    for (let i = 0; i + 2 <= seg.length; i++) out.push(seg.slice(i, i + 2));
  }
  return [...new Set(out)].slice(0, 12);
}
function relTime(d) {
  if (d <= 1) return '刚才';
  if (d <= 3) return '方才几轮';
  if (d <= 8) return '早些时候';
  if (d <= 20) return '之前一阵';
  if (d <= 50) return '很久以前';
  return '很早以前';
}

module.exports = { EmotionMemory, tokenize };
