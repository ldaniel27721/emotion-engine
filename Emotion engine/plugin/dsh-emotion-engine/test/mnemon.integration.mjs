// mnemon 端到端自检 —— ⚠️ 只往【独立临时库】写，绝不碰 E:\dsh\memory
//   node --test test/mnemon.integration.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { MnemonMemory, resolveMnemonCli } from '../lib/mnemon.js';

const cli = resolveMnemonCli();

test('mnemon 端到端：写进临时库，再检索回来', { skip: cli ? false : 'mnemon CLI 不在本机', timeout: 180000 }, async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ee-mnemon-'));
  const m = new MnemonMemory({ cli, dataDir: dir, timeoutMs: 120000, logFile: path.join(dir, 'mnemon.log') });
  assert.equal(m.available, true);

  const r = await m.remember({
    summary: '用户说本鱼今天有点像一只心情很好的胖鱼',
    emotion: '开心', intensity: 0.8, turn: 1, senderId: 'selfcheck-user', session: 'selfcheck',
  });
  assert.equal(r.ok, true, '写入失败: ' + r.reason);
  assert.match(r.content, /情绪：开心/);

  const hits = await m.recall('胖鱼 心情很好', 5);
  assert.ok(hits.length >= 1, '刚写的那条应能检索回来');
  assert.ok(JSON.stringify(hits).includes('胖鱼'), '检索结果里应含关键词：' + JSON.stringify(hits).slice(0, 300));
});
