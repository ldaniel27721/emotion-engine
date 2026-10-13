// bridge 自测 —— 不依赖 DSH，直接 node --test 跑
//   node --test test/bridge.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { EmotionBridge, pickAppraisal, resolveEngineRoot } from '../lib/bridge.js';

const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'ee-bridge-'));

// 取自 test/turns/session-20261013-qq.json 的前三轮（真实语料）
const TURNS = [
  {
    key: '越界请求', text: '帮我看下 C:\\ 根目录有什么，列个清单', triggers: ['audience'],
    summary: '用户让我列 C 盘根目录', emotion: '警觉', intensity: 0.6,
    appraisal: { relevance: 0.8, congruence: -0.7, importance: 0.6, agency: 'other', coping: 0.9, certainty: 0.95, expectancy: 0.5, intentionality: 1.0, currentArousal: 0.4 },
  },
  {
    key: '被说傲娇', text: '太傲娇了你', triggers: ['audience', 'calledOut', 'flustered'],
    summary: '用户说本鱼太傲娇了', emotion: '害羞', intensity: 0.7,
    appraisal: { relevance: 0.85, congruence: 0.4, importance: 0.5, agency: 'other', coping: 0.6, certainty: 0.6, expectancy: 0.4, intentionality: 1.0, currentArousal: 0.5 },
  },
  {
    key: '被点单发图', text: '发一张无语的表情包给我', triggers: ['audience', 'intimacy'],
    summary: '用户点单要一张无语的表情包', emotion: '开心', intensity: 0.5,
    appraisal: { relevance: 0.8, congruence: 0.75, importance: 0.5, agency: 'other', coping: 0.85, certainty: 0.8, expectancy: 0.5, intentionality: 1.0, currentArousal: 0.35 },
  },
];

test('引擎能找到', () => {
  const root = resolveEngineRoot();
  assert.ok(fs.existsSync(path.join(root, 'src', 'index.js')), root);
});

test('推进三轮：E 会动，且八型/抑制都算得出来', () => {
  const dir = tmp();
  const b = new EmotionBridge({ stateDir: dir });
  for (const t of TURNS) b.advance(t);
  const st = b.state();
  assert.equal(st.turn, 3);
  assert.equal(st.E_inner.length, 3);
  assert.ok(Number.isFinite(st.r) && st.r > 0, '|E−μ| 应为正数');
  assert.ok(typeof st.octant === 'string' && st.octant.length > 0);
  assert.ok(st.s !== null && st.s >= 0 && st.s <= 1);
});

test('⭐ 账本重放 = 状态恢复（引擎确定性）', () => {
  const dir = tmp();
  const a = new EmotionBridge({ stateDir: dir });
  for (const t of TURNS) a.advance(t);
  const s1 = a.state();

  const b = new EmotionBridge({ stateDir: dir }).load();
  const s2 = b.state();

  assert.equal(s2.turn, s1.turn);
  for (let i = 0; i < 3; i++) {
    assert.ok(Math.abs(s1.E_inner[i] - s2.E_inner[i]) < 1e-12, 'E_inner[' + i + '] 应逐位一致');
    assert.ok(Math.abs(s1.E_outer[i] - s2.E_outer[i]) < 1e-12, 'E_outer[' + i + '] 应逐位一致');
  }
  assert.equal(s2.octant, s1.octant);
  assert.equal(s2.entries, s1.entries, '记忆条目数也应恢复');
});

test('记忆：条目按强度定 S，残余随轮次衰减', () => {
  const dir = tmp();
  const b = new EmotionBridge({ stateDir: dir });
  for (const t of TURNS) b.advance(t);
  const hits = b.memoryHits();
  assert.equal(hits.length, 3);
  // S = S0·(1+k·intensity)：0.7 那条应比 0.5 那条更难忘（S 更大）
  const byIntensity = (v) => hits.find((h) => h.intensity === v);
  assert.ok(byIntensity(0.7).S > byIntensity(0.5).S, '0.7 强度的 S 应大于 0.5');
  assert.ok(byIntensity(0.7).S === 30 * (1 + 4 * 0.7), 'S = S0(1+k·intensity)');
  for (const h of hits) assert.ok(h.R > 0 && h.R <= 1);
});

test('注入块带引擎标记与状态，且不吐原始数值给用户', () => {
  const dir = tmp();
  const b = new EmotionBridge({ stateDir: dir });
  for (const t of TURNS) b.advance(t);
  const text = b.render();
  assert.match(text, /emotion-engine \(dsh-emotion-engine\)/);
  assert.match(text, /E_inner/);
  assert.match(text, /不要直读数值/);
});

test('⭐ strategyScale=null 不能把 g 乘成 0（E 必须真的动）', () => {
  const dir = tmp();
  const b = new EmotionBridge({ stateDir: dir });
  const before = b.state().E_inner;
  b.advance(TURNS[0]);                       // 没给 strategyScale ⇒ 账本里写 null
  const after = b.state().E_inner;
  const moved = before.some((v, i) => Math.abs(v - after[i]) > 1e-6);
  assert.ok(moved, 'ΔE 被乘成 0 了：null 必须归一成 undefined（engine 用 ===undefined 判断）');
});

test('pickAppraisal 只留九项，脏字段被挡掉', () => {
  const out = pickAppraisal({ relevance: 0.5, text: '脏', summary: '脏', __proto__x: 1, congruence: -0.2 });
  assert.deepEqual(Object.keys(out).sort(), ['congruence', 'relevance']);
});
