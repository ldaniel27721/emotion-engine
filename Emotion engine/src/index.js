// 情绪引擎 —— 统一出口
//
//   const EE = require('./src');
//   const c = new EE.Character({ name: '傲娇大肥鱼', sigma: 0.50, muPreset: 'dependent' });
//   const r = c.step({ appraisal: {...}, context: { triggers: ['calledOut'] } });
'use strict';

const space = require('./space');
const appraisal = require('./appraisal');
const dynamics = require('./dynamics');
const mu = require('./mu');
const tsundere = require('./tsundere');
const lexicon = require('./lexicon');
const memory = require('./memory');
const engine = require('./engine');

module.exports = {
  // A1 空间
  V: space.V,
  Space: space.Space,
  cap: space.cap,
  capInverse: space.capInverse,
  chi2_3_cdf: space.chi2_3_cdf,

  // 评价层
  appraisal,
  OCTANT: appraisal.OCTANT,
  DIRECTION_TO_OCTANT: appraisal.DIRECTION_TO_OCTANT,
  APPRAISAL_SCHEMA: appraisal.APPRAISAL_SCHEMA,

  // A2 动力学
  Dynamics: dynamics.Dynamics,

  // A3 底情绪
  Mu: mu.Mu,
  MU_PRESETS: mu.PRESETS,
  bayesianRead: mu.bayesianRead,
  /** ⭐ B8 标定值：由「60 天看不出漂移」反解出的 μ 漂移速率（见 docs/06） */
  DRIFT_RATE_CALIBRATED: mu.DRIFT_RATE_CALIBRATED,

  // 表达层（傲娇）
  Tsundere: tsundere.Tsundere,
  SUBTYPE: tsundere.SUBTYPE,
  TRIGGER: tsundere.TRIGGER,
  LEAK_CHANNEL: tsundere.LEAK_CHANNEL,

  // A4 词库
  Lexicon: lexicon.Lexicon,
  ConceptPrior: lexicon.ConceptPrior,
  THEME_TO_GOAL: lexicon.THEME_TO_GOAL,

  // ⭐ 情绪记忆（docs/12 · issue #1）—— 简化版（设定者 2026-10-13 规格）
  //   条目 = 轮次 / 时间戳 / 摘要 / 情绪词（摘要与情绪词由模型自己提取）
  //   注入 = 按遗忘曲线 R = exp(−λ·Δturn) 排序，λ 对齐引擎的 ρ
  EmotionMemory: memory.EmotionMemory,
  tokenize: memory.tokenize,

  // 组装
  Character: engine.Character,

  /** 版本 —— ⚠️ 必须与 VERSION 文件同步（此前长期停在 0.1.0-beta，已修正） */
  VERSION: '0.1.16-beta',
};
