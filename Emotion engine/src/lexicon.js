// A4 —— 情绪词库接入层
//
//   599 个中文情绪词 → 【概念先验】
//
// 理论地位（barrett2016 建构主义 + topdown2025）：
//   ⭐ 词不是【标签】，是【特征提取器 / 知觉模板】
//      模板承载特征 + 知觉偏向，决定从输入里抽哪些特征（topdown2025 p.397）
//   ⭐ 评价标准应是【模板独特性】，不是分类正确率
//   ⭐ 词库字段重读为概念先验：
//        释义（gloss20） → 语义邻域
//        主题（theme）   → 目标维度
//        方向（category）→ 效价
//        强弱（intensity）→ 先验强度 / 精度
//      未归类 / 跨类词 = 先验接近均匀，等情境证据裁决
//
// ⚠️ 引用纪律（AET pp.20-22 + barrett2016 p.21 的警告）：
//   · AET 批评 Shaver 的语义聚类不能外推到"实际情绪类别"
//   · Barrett 点名批评"更细粒度的类型学"与"平均原型"
//   ⇒ 本词库只作为【工程用概念先验】使用，
//      不做互斥 one-hot、不做平均原型最近邻、不写成"情绪的本质"
'use strict';

const path = require('path');
const fs = require('fs');

// ⭐ 默认路径相对本模块定位（../data/emotion-lexicon-cn.json）
const DEFAULT_PATH = path.join(__dirname, '..', 'data', 'emotion-lexicon-cn.json');

// ────────────────────────────────────────────────
// ⭐ 八型 → PAD 单位签名（与 appraisal.js 保持一致）
// ────────────────────────────────────────────────
const OCTANT_SIGN = {
  Exuberant:  [ 1,  1,  1],
  Dependent:  [ 1,  1, -1],
  Relaxed:    [ 1, -1,  1],
  Docile:     [ 1, -1, -1],
  Hostile:    [-1,  1,  1],
  Anxious:    [-1,  1, -1],
  Disdainful: [-1, -1,  1],
  Bored:      [-1, -1, -1],
};

// ────────────────────────────────────────────────
// ⭐ 17 个主题 → 目标维度（goal relevance / goal congruence 的先验）
//
//   键名用【词库里的中文主题名】（2026-10-12 修正：原先误用英文键，
//   导致所有词的"关切"都落到"未知"）
//
//   这些是"事件牵涉了角色的哪一类关切"：
// ────────────────────────────────────────────────
const THEME_TO_GOAL = {
  '自我评价类':      { goal: '自我价值 / 规范',      valPrior: -0.55 },
  '悲伤（Sadness）': { goal: '失去 / 意义',          valPrior: -0.80 },
  '无力与绝望':      { goal: '控制感 / 能量',        valPrior: -0.85 },
  '愤怒（Anger）':   { goal: '边界 / 被侵犯',        valPrior: -0.70 },
  '快乐（Joy）':     { goal: '趋近 / 获得',          valPrior: +0.85 },
  '恐惧（Fear）':    { goal: '安全 / 生存',          valPrior: -0.80 },
  '爱与联结':        { goal: '依恋 / 被接纳',        valPrior: +0.65 },
  '平静与满足':      { goal: '安全 / 无威胁',        valPrior: +0.45 },
  '焦虑与压力':      { goal: '可预测性 / 控制感',    valPrior: -0.65 },
  '厌恶（Disgust）': { goal: '纯洁 / 排斥',          valPrior: -0.60 },
  '目标相关情绪':    { goal: '目标达成度',            valPrior:  0.00 },
  '动力与希望':      { goal: '探索 / 成长',          valPrior: +0.55 },
  '惊讶（Surprise）':{ goal: '可预测性',             valPrior:  0.00 },
  '孤独与疏离':      { goal: '联结 / 归属',          valPrior: -0.75 },
  '生理反应':        { goal: '躯体稳态',             valPrior: -0.30 },
  '社交场景':        { goal: '社会评价 / 面子',      valPrior: -0.40 },
  '人际互动类':      { goal: '关系 / 互惠',          valPrior:  0.10 },
};

// ────────────────────────────────────────────────
// 词条 → 概念先验
// ────────────────────────────────────────────────
class ConceptPrior {
  constructor(e) {
    this.word = e.word;
    this.gloss = e.gloss20 || e.gloss || '';
    this.theme = e.theme;
    this.themeSection = e.themeSection;
    this.category = e.category;
    this.octant = e.octant;
    this.sign = e.sign;
    this.kind = e.kind;              // emotion | perception
    this.intensity = e.intensity;    // strong | mild

    // ⭐ 概念先验的四个分量
    this.pad = OCTANT_SIGN[this.octant] || [0, 0, 0];
    this.goal = (THEME_TO_GOAL[this.theme] || {}).goal || '（未知关切）';
    this.valPrior = (THEME_TO_GOAL[this.theme] || {}).valPrior ?? 0;

    // ⭐ 先验精度：strong 给高精度，mild 给低精度
    //    mild 词 = "模棱两可"，交由模型判断（设定者裁定）
    this.precision = this.intensity === 'strong' ? 0.85 : 0.45;

    // ⭐ kind=perception 的词移出情绪强度空间，只作知觉模板
    this.isPerception = this.kind === 'perception';
  }

  /** 概念先验 → 评价层的默认值（可作为 LLM 直填的"锚"） */
  toAppraisalSeed() {
    return {
      relevance: 0.5,
      congruence: this.valPrior,
      importance: this.intensity === 'strong' ? 0.75 : 0.45,
      agency: 'none',
      coping: 0.5,
      certainty: this.precision,
      expectancy: 0.5,
      intentionality: 0.5,
      currentArousal: 0.3,
    };
  }

  /** 概念签名（PAD 单位向量） */
  get signature() {
    const n = Math.hypot(...this.pad) || 1;
    return this.pad.map(x => x / n);
  }

  toString() {
    return `${this.word}（${this.category}→${this.octant}，${this.intensity}）${this.gloss}`;
  }
}

// ────────────────────────────────────────────────
// 词库
// ────────────────────────────────────────────────
class Lexicon {
  constructor(filePath = DEFAULT_PATH) {
    const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    this.meta = {
      name: raw.name, purpose: raw.purpose, built: raw.built,
      total: raw.total, counts: raw.counts,
    };
    this.entries = raw.entries.map(e => new ConceptPrior(e));
    this.byWord = new Map(this.entries.map(e => [e.word, e]));
    this.byCategory = new Map();
    this.byTheme = new Map();
    this.byOctant = new Map();
    for (const e of this.entries) {
      const push = (m, k) => { if (!m.has(k)) m.set(k, []); m.get(k).push(e); };
      push(this.byCategory, e.category);
      push(this.byTheme, e.theme);
      push(this.byOctant, e.octant);
    }
  }

  get size() { return this.entries.length; }

  lookup(word) { return this.byWord.get(word) || null; }

  /**
   * ⭐ 模糊查词：按 词 / 释义 子串
   */
  search(q, limit = 10) {
    if (!q) return [];
    const hits = [];
    for (const e of this.entries) {
      let score = 0;
      if (e.word === q) score = 100;
      else if (e.word.includes(q)) score = 60;
      else if (e.gloss.includes(q)) score = 30;
      if (score > 0) hits.push({ e, score });
    }
    return hits.sort((a, b) => b.score - a.score).slice(0, limit).map(h => h.e);
  }

  /**
   * ⭐⭐ 评价 → 候选概念（词库与评价层的对接点）
   *
   * ⚠️ 返回【候选集】而非单一答案 —— 因为"模棱两可"是常态
   *    （设定者裁定："大多数情绪体验是模棱两可的交由模型自行判断"）
   *
   * 评分项（2026-10-12 修正：原先只靠 octant + 价效 + 精度，
   * 导致 Anxious 的 173 个词里挑出"最强"而非"最贴切"的）：
   *   ① categoryHint 命中      —— 最强信号（评价层已给出方向类）
   *   ② octantHint 命中        —— 次强（八型是粗粒度）
   *   ③ P 轴符号一致
   *   ④ 主题价先验与价效的接近度
   *   ⑤ 先验精度（strong 优先，但权重降低）
   *
   * @param {object} appraisal  评价层输出
   * @param {object} opts
   * @param {number}  opts.valence      价效（不给则从 appraisal 推）
   * @param {string}  opts.octantHint   八型提示
   * @param {string}  opts.categoryHint 方向类提示（⭐ 新）
   * @param {number}  opts.top
   * @param {boolean} opts.includePerception
   *        ⭐ 默认 true（2026-10-12 修正）：
   *        Hurt 类的 10 个词里许多是 perception（哀怨/吐气/抱屈…），
   *        若排除则整个"Hurt"方向类被清空。
   *        设定者裁定「受伤是知觉，是情绪的前置物和副产物」——
   *        角色确实会【感到】受伤，故 perception 词应当参与匹配，
   *        同时保留 kind 标记供上层区分（知觉层 vs 情绪层）。
   * @param {number}  opts.intensityPref 'strong'|'mild'|null —— 偏好哪种强度
   */
  matchAppraisal(appraisal, opts = {}) {
    const {
      top = 8, valence = null, octantHint = null, categoryHint = null,
      includePerception = true, intensityPref = null, perceptionOnly = false,
    } = opts;

    const v = valence !== null ? valence
      : (appraisal.congruence ?? 0) * (appraisal.relevance ?? 1);

    const scored = [];
    for (const e of this.entries) {
      if (perceptionOnly && !e.isPerception) continue;
      if (!includePerception && e.isPerception) continue;
      let s = 0, why = [];

      // ① 方向类命中 —— 最强
      if (categoryHint && e.category === categoryHint) { s += 2.0; why.push('类'); }
      else if (categoryHint) s -= 0.5;

      // ② 八型命中
      if (octantHint) {
        if (e.octant === octantHint) { s += 0.8; why.push('型'); }
        else s -= 0.4;
      }

      // ③ P 轴符号一致
      const eSign = e.pad[0];
      if (Math.abs(v) > 0.15) {
        if (Math.sign(v) === Math.sign(eSign)) { s += 0.6; why.push('号'); }
        else s -= 0.9;
      }

      // ④ 主题价先验与价效的接近度
      s += 0.8 * (1 - Math.abs(e.valPrior - v) / 2);

      // ⑤ 先验精度
      if (intensityPref) {
        if (e.intensity === intensityPref) s += 0.5;
      } else {
        s += e.precision * 0.25;
      }

      scored.push({ e, s, why });
    }
    return scored.sort((a, b) => b.s - a.s).slice(0, top).map(x => x.e);
  }

  /** 按方向类取词 */
  byCategory_(cat) { return this.byCategory.get(cat) || []; }

  /** 统计信息 */
  describe() {
    const lines = [
      `Lexicon「${this.meta.name}」 共 ${this.size} 词`,
      `  方向类 ${this.byCategory.size} · 主题 ${this.byTheme.size} · 八型 ${this.byOctant.size}`,
    ];
    const oct = [...this.byOctant.entries()].sort((a, b) => b[1].length - a[1].length)
      .map(([k, v]) => `${k} ${v.length}`).join(' · ');
    lines.push(`  八型分布: ${oct}`);
    const kinds = {};
    for (const e of this.entries) kinds[e.kind] = (kinds[e.kind] || 0) + 1;
    lines.push(`  kind: ${Object.entries(kinds).map(([k, v]) => `${k} ${v}`).join(' · ')}`);
    const inten = {};
    for (const e of this.entries) inten[e.intensity] = (inten[e.intensity] || 0) + 1;
    lines.push(`  强度: ${Object.entries(inten).map(([k, v]) => `${k} ${v}`).join(' · ')}`);
    return lines.join('\n');
  }
}

module.exports = { Lexicon, ConceptPrior, OCTANT_SIGN, THEME_TO_GOAL, DEFAULT_PATH };
