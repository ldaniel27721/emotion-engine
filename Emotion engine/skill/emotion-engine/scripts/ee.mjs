#!/usr/bin/env node
// ee.mjs —— 轻量版情绪引擎驱动（不碰任何 DSH 配置）
//
//   node ee.mjs state                    打印【当前状态块】（可直接贴进推理里）
//   node ee.mjs step --file <appraisal.json>   推进一轮（账本追加一行）
//   node ee.mjs memory [关键词] [--k 4]  只看残余情绪记忆
//   node ee.mjs ledger                   账本路径与轮次数
//   node ee.mjs step --file x.json --mnemon    同时写进 mnemon
//
// ⚠️ appraisal 请一律走 --file：本机 PowerShell 的引号会把内联 JSON 吃掉。
// 这个脚本和插件共用同一个账本目录（~/.dsh/emotion-engine/ledger.jsonl），
// 所以「轻量版」和「插件版」看到的是同一份状态，随时可互换。
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const HERE = path.dirname(pathToFileURL(process.argv[1]).pathname.replace(/^\/([A-Za-z]:)/, '$1'));

/** 找到插件的 lib/bridge.js（先环境变量，再相对仓库，再几个已知位置） */
function resolveBridgeDir() {
  const cands = [
    process.env.DSH_EE_PLUGIN || null,
    path.join(HERE, '..', '..', '..', 'plugin', 'dsh-emotion-engine'),   // 仓库内：skill/emotion-engine/scripts → plugin/
    'E:\\dsh\\_herta-plugin\\Emotion engine\\plugin\\dsh-emotion-engine',
    'E:\\dsh\\dsh-emotion-engine',
    'E:\\dsh\\_herta-clone\\Emotion engine\\plugin\\dsh-emotion-engine',
  ].filter(Boolean);
  for (const c of cands) {
    if (fs.existsSync(path.join(c, 'lib', 'bridge.js'))) return c;
  }
  console.error('找不到 dsh-emotion-engine 的 lib/bridge.js；请设置 DSH_EE_PLUGIN 指向插件目录。');
  console.error('试过：' + cands.join('  |  '));
  process.exit(2);
}

const pluginDir = resolveBridgeDir();
const { EmotionBridge } = await import(pathToFileURL(path.join(pluginDir, 'lib', 'bridge.js')).href);

// ── 极简参数解析 ──
const argv = process.argv.slice(2);
const cmd = argv[0] || 'state';
const opt = {};
const pos = [];
for (let i = 1; i < argv.length; i++) {
  const a = argv[i];
  if (a === '--mnemon') { opt.mnemon = true; continue; }
  if (a === '--k') { opt.k = Number(argv[++i]); continue; }
  if (a === '--file') { opt.file = argv[++i]; continue; }
  if (a === '--state-dir') { opt.stateDir = argv[++i]; continue; }
  if (a === '--engine-root') { opt.engineRoot = argv[++i]; continue; }
  pos.push(a);
}

const stateDir = opt.stateDir || process.env.DSH_EE_STATE_DIR || path.join(os.homedir(), '.dsh', 'emotion-engine');
const bridge = new EmotionBridge({ stateDir, engineRoot: opt.engineRoot || null }).load();

const SKILL_ADVICE = '- 本轮若有新事件：把评价写成一个 json 文件，跑 `node ee.mjs step --file <该文件>`，再照更新后的状态开口。';

if (cmd === 'state') {
  console.log(bridge.render({ hint: pos.join(' ') || null, k: opt.k === undefined ? null : opt.k, advice: SKILL_ADVICE }));
} else if (cmd === 'memory') {
  const hits = bridge.memoryHits(pos.join(' ') || null, opt.k === undefined ? null : opt.k);
  if (!hits.length) console.log('（没有残余在阈值之上的情绪记忆）');
  for (const h of hits) {
    console.log('· R=' + h.R.toFixed(3) + '  S=' + h.S.toFixed(1) + '  第' + h.turn + '轮  ' + h.summary +
      (h.emotion ? '（' + h.emotion + '）' : ''));
  }
} else if (cmd === 'ledger') {
  console.log('账本: ' + bridge.ledger.file);
  console.log('轮次: ' + bridge.state().turn + '   记忆条目: ' + bridge.memory.size);
} else if (cmd === 'step') {
  let input = null;
  if (opt.file) {
    const p = path.resolve(process.cwd(), opt.file);
    if (!fs.existsSync(p)) { console.error('读不到 appraisal 文件: ' + p); process.exit(2); }
    input = JSON.parse(fs.readFileSync(p, 'utf8'));
  } else if (pos.length) {
    input = JSON.parse(pos.join(' '));
  } else {
    console.error('用法: node ee.mjs step --file <appraisal.json> [--mnemon]');
    console.error('appraisal 至少给 summary；九项评价见插件 README。');
    process.exit(2);
  }
  const r = bridge.advance(input);
  console.log(bridge.render({ hint: input.summary || null, advice: SKILL_ADVICE }));
  console.log('\n（已写入账本：第 ' + r.rec.turn + ' 轮）');
  if (opt.mnemon) {
    const { MnemonMemory } = await import(pathToFileURL(path.join(pluginDir, 'lib', 'mnemon.js')).href);
    const m = new MnemonMemory({ logFile: path.join(stateDir, 'mnemon.log') });
    const out = await m.remember({
      summary: input.summary, emotion: input.emotion, intensity: input.intensity,
      turn: r.rec.turn, at: r.row.at, senderId: input.senderId || null,
    });
    console.log(out.ok ? '（已写进 mnemon）' : '（⚠️ mnemon 写入失败：' + out.reason + '）');
  }
} else {
  console.error('子命令：state | step | memory | ledger');
  process.exit(2);
}
