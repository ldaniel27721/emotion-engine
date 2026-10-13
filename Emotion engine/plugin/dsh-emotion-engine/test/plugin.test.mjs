// 插件层自测 —— 用假 ctx 把 apply() 跑起来，不需要装进 DSH profile
//   node --test test/plugin.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { apply, name, inject, messageText } from '../lib/index.js';
import { buildDraft, sanitizeQuery, importanceFor, resolveMnemonCli } from '../lib/mnemon.js';

const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'ee-plugin-'));

function mockCtx() {
  const rec = { contexts: [], sections: [], tools: [], commands: [], listeners: {}, disposed: 0 };
  const ctx = {
    systemPrompt: {
      context: (c) => { rec.contexts.push(c); return () => { rec.disposed++; }; },
      section: (s) => { rec.sections.push(s); return () => { rec.disposed++; }; },
    },
    tools: { register: (t) => { rec.tools.push(t); return () => { rec.disposed++; }; } },
    commands: { register: (c) => { rec.commands.push(c); return () => { rec.disposed++; }; } },
    on: (ev, fn) => { (rec.listeners[ev] = rec.listeners[ev] || []).push(fn); return () => { rec.disposed++; }; },
    effect: (fn) => { rec.cleanup = fn(); },
    logger: { warn: () => {} },
  };
  return { ctx, rec };
}

const APPRAISAL = {
  summary: '用户点名要表情包', emotion: '害羞', intensity: 0.7,
  relevance: 0.8, congruence: 0.6, importance: 0.5, agency: 'other',
  coping: 0.8, certainty: 0.7, expectancy: 0.5, intentionality: 1.0, currentArousal: 0.4,
  triggers: 'audience, intimacy', senderId: 'user-1',
};

test('插件元信息与注入面', () => {
  assert.equal(name, 'dsh-emotion-engine');
  assert.deepEqual(inject, ['tools', 'systemPrompt', 'commands']);
});

test('apply 注册了 context / section / tool / 命令 / 事件监听', () => {
  const { ctx, rec } = mockCtx();
  apply(ctx, { stateDir: tmp(), mnemon: { enabled: false } });
  assert.equal(rec.contexts.length, 1);
  assert.equal(rec.contexts[0].name, 'emotion-engine');
  assert.equal(rec.sections.length, 1);
  assert.equal(rec.tools.length, 1);
  assert.equal(rec.tools[0].name, 'emotion_appraise');
  assert.ok(rec.commands.find((c) => c.name === 'emotion'));
  assert.ok(rec.listeners['agent/inbox/inserted']);
  // 参数用 defineTool 的 DSL：每个字段带 type
  assert.equal(rec.tools[0].parameters.summary.type, 'string');
  assert.equal(rec.tools[0].parameters.summary.required, true);
  assert.equal(rec.tools[0].parameters.intensity.type, 'number');
  assert.equal(typeof rec.tools[0].output.render, 'function');
});

test('⭐ 工具 execute 真的推进引擎，并把新状态回给模型', async () => {
  const { ctx, rec } = mockCtx();
  apply(ctx, { stateDir: tmp(), mnemon: { enabled: false } });
  const tool = rec.tools[0];

  const ctxText0 = ctx.systemPrompt.context({});
  const before = rec.contexts[0].text();
  assert.match(before, /emotion-engine \(dsh-emotion-engine\)/);
  assert.match(before, /轮次: 0/);

  const out = await tool.execute(APPRAISAL, {});
  assert.equal(out.ok, true);
  assert.match(out.message, /E_inner/, '工具返回里应带推进后的状态');
  assert.match(out.message, /轮次: 1/);

  const after = rec.contexts[0].text();
  assert.match(after, /轮次: 1/, '注入块应反映新一轮');

  const st = await tool.execute({ ...APPRAISAL, summary: '又一次', intensity: 0.2 }, {});
  assert.equal(st.ok, true);
  assert.match(st.message, /轮次: 2/);
  assert.ok(ctxText0 === undefined || true);
});

test('命令 /emotion 能报状态、账本路径与 mnemon 状态', async () => {
  const { ctx, rec } = mockCtx();
  const dir = tmp();
  apply(ctx, { stateDir: dir, mnemon: { enabled: false } });
  const cmd = rec.commands.find((c) => c.name === 'emotion');
  const r = await cmd.handler({ rawInput: '' });
  assert.equal(r.kind, 'success');
  assert.match(r.text, /ledger\.jsonl/);
  assert.match(r.text, /mnemon/);
  assert.ok(r.text.includes(dir));
  const reload = rec.commands.find((c) => c.name === 'emotion-reload');
  const r2 = await reload.handler({});
  assert.equal(r2.kind, 'success');
});

test('幂等卸载：effect 的 disposer 会摘掉所有注册', () => {
  const { ctx, rec } = mockCtx();
  apply(ctx, { stateDir: tmp(), mnemon: { enabled: false } });
  assert.equal(typeof rec.cleanup, 'function', 'apply 里 ctx.effect 应返回清理函数');
  rec.cleanup();
  assert.ok(rec.disposed >= 4, '实际 disposed=' + rec.disposed);
});

test('引擎找不到时不装死：注入块明说这一轮不是引擎算的', () => {
  const { ctx, rec } = mockCtx();
  apply(ctx, { engineRoot: 'Z:\\nope', stateDir: tmp(), mnemon: { enabled: false } });
  const text = rec.contexts[0].text();
  assert.match(text, /引擎没加载起来/);
  assert.match(text, /不是引擎算的/);
});

test('messageText 能吃字符串和 block 数组', () => {
  assert.equal(messageText({ content: 'hello' }), 'hello');
  assert.equal(messageText({ content: [{ type: 'text', text: 'a' }, { type: 'text', text: 'b' }] }), 'a b');
  assert.equal(messageText(null), '');
});

test('mnemon：draft 组装 + 重要度映射 + 查询清洗', () => {
  const { draft, content } = buildDraft({
    summary: '用户说本鱼可爱', emotion: '开心', intensity: 0.75, turn: 7, senderId: 'u9', session: 's1',
  }, 'ee');
  assert.equal(draft.schema_version, '1');
  const ins = draft.insights[0];
  assert.match(ins.content, /用户说本鱼可爱/);
  assert.match(content, /情绪：开心/);
  assert.equal(ins.importance, 4);            // 0.75*4+1 = 4
  assert.ok(ins.tags.includes('sender:u9'));
  assert.ok(ins.tags.includes('emotion:开心'));
  assert.ok(ins.entities.includes('u9'));
  assert.equal(ins.source, 'agent');

  assert.equal(importanceFor(0), 1);
  assert.equal(importanceFor(1), 5);
  assert.equal(importanceFor(2), 5, '越界要 clamp');

  assert.equal(sanitizeQuery('"quoted"; rm -rf / && echo $HOME'), 'quoted rm -rf echo HOME');
  assert.equal(sanitizeQuery('正常 中文 查询'), '正常 中文 查询');
  assert.ok(resolveMnemonCli() === null || resolveMnemonCli().endsWith('mnemon.js'));
});
