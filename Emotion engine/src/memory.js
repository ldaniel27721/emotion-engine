// ⭐ 情绪记忆（简化版）—— 设定者 2026-10-13 最终规格
//
// 设定者原话：
//   「就是模型本身对事件的判断，然后把事件精简成某些提示词或者情绪词录入记忆系统，
//     打上时间戳或者轮次步数，我们这个记忆系统只需要模型自己去提取关于这个事件的
//     摘要和情绪就可以了，我们不需要他们那种复杂的系统构造。」
//
// ⇒ ⭐ 条目只有四样：轮次 / 时间戳 / 摘要 / 情绪词
//   · 摘要与情绪词【由模型自己提取】—— 本模块不做任何判断
//   · 没有 S、没有 kEmotion、没有 kRecall、没有 traits、没有复习、没有失败分支
//
// ⭐ 遗忘曲线在这里的唯一用途：**注入时按轮次远近排序**
//   R(t) = exp(−λ · Δturn)
//   λ 由「ρ 按轮次衰减」标定 ⇒ 与引擎同一个时间轴（设定者说的"解析 ρ 轮次问题"）
//   ρ = 0.927 ⇒ λ = −ln(ρ) = 0.07581 ⇒ 半衰期 9.14 轮
'use strict';

class EmotionMemory {
  /**
   * @param {object} o
   * @param {number} o.lambda  按轮次的遗忘速率；默认对齐引擎的 ρ=0.927
   * @param {number} o.topK    每次最多注入几条
   * @param {number} o.minR    可提取性低于此则不再注入（真遗忘）
   */
  constructor({ lambda = 0.07581, topK = 4, minR = 0.05 } = {}) {
    this.lambda = lambda;
    this.topK = topK;
    this.minR = minR;
    /** @type {object[]} */
    this.entries = [];
  }

  /** 半衰期（轮）—— 供审计 */
  get halfLife() { return Math.log(2) / this.lambda; }

  /**
   * ⭐ 录入一条记忆。摘要与情绪词【由模型提供】，本模块只是存下来。
   *
   * @param {object} o
   * @param {number} o.turn    轮次步数
   * @param {string} o.at      时间戳（ISO）
   * @param {string} o.summary 事件摘要 —— ⭐ 模型提取
   * @param {string} o.emotion 情绪词 —— ⭐ 模型提取
   * @param {string[]} [o.keywords] 触发用关键词（不给则从 summary 里切）
   */
  add({ turn, at = null, summary, emotion, keywords = null }) {
    const e = {
      turn,
      at,
      summary: String(summary || '').trim(),
      emotion: String(emotion || '').trim(),
      keywords: keywords && keywords.length ? keywords.slice() : keywordsFrom(summary),
    };
    this.entries.push(e);
    return e;
  }

  /** ⭐ 遗忘曲线 R = exp(−λ·Δturn) */
  retrievability(entry, nowTurn) {
    return Math.exp(-this.lambda * Math.max(0, nowTurn - entry.turn));
  }

  /**
   * ⭐ 检索：关键词命中 + 遗忘曲线排序
   *
   * @param {number} nowTurn
   * @param {string} hint      当前上下文/事件（用于关键词匹配）；给 null 则不过滤
   * @param {number} [k]
   */
  retrieve(nowTurn, hint = null, k = null) {
    const K = k === null ? this.topK : k;
    const alive = this.entries
      .map(e => ({ entry: e, R: this.retrievability(e, nowTurn) }))
      .filter(x => x.R >= this.minR);
    // ⭐ 关键词触发（设定者："只要模型还留有记忆那按关键词或者摘要触发即可"）
    let pool = alive;
    if (hint) {
      const toks = tokenize(hint);
      const matched = alive.filter(x =>
        x.entry.keywords.some(w => toks.some(t => t.includes(w) || w.includes(t))));
      // ⭐ 命中就用命中的；一条都没命中就退回全体（仍按遗忘曲线）
      if (matched.length) pool = matched;
    }
    return pool.sort((a, b) => b.R - a.R).slice(0, K);
  }

  /** 自然语言注入（相对时间词，非时间戳） */
  render(hits, nowTurn) {
    if (!hits.length) return '';
    const lines = hits.map(({ entry }) =>
      '· ' + relTime(nowTurn - entry.turn) + ' ' + entry.summary +
      (entry.emotion ? '（你当时' + entry.emotion + '）' : ''));
    return '【你还记得的】\n' + lines.join('\n');
  }

  /** 全部条目（供落盘/调试） */
  all() { return this.entries.slice(); }
  get size() { return this.entries.length; }
}

// ────────────────────────────────────────────────
// 小工具
// ────────────────────────────────────────────────

/** 中文按 2-gram 切，英文按词切 —— 足够做"关键词或摘要触发" */
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

/** 没给 keywords 时，从摘要里取 2-gram 当关键词 */
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
