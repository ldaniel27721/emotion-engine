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

  // 表达层（傲娇）
  Tsundere: tsundere.Tsundere,
  SUBTYPE: tsundere.SUBTYPE,
  TRIGGER: tsundere.TRIGGER,
  LEAK_CHANNEL: tsundere.LEAK_CHANNEL,

  // A4 词库
  Lexicon: lexicon.Lexicon,
  ConceptPrior: lexicon.ConceptPrior,
  THEME_TO_GOAL: lexicon.THEME_TO_GOAL,

  // 组装
  Character: engine.Character,

  /** 版本 */
  VERSION: '0.1.0-beta',
};
