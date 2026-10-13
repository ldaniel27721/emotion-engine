// mnemon 记忆后端 —— 把「情绪事件」写进 Mnemon 的库，并从中检索
//
// 为什么走 CLI 而不是自己开 db：
//   mnemon 的写路径带【去重 / 冲突检测 / 图边构建 / 嵌入 / 生命周期打分】，
//   绕开它自己写 sqlite 会得到一堆没进图的孤儿行。
//
// 安全性：参数一律走 spawn(process.execPath, [cli, ...args]) 且 shell:false
//   ⇒ 模型给的 summary 里带引号/分号也不会被 shell 解释（本机 PowerShell 引号地狱的根治办法）。
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

/** mnemon CLI 的 JS 入口（绕开 .cmd/.ps1 shim，直接喂给 node） */
const CLI_CANDIDATES = [
  'E:\\node-v24.20.0-win-x64\\node-v24.20.0-win-x64\\node_modules\\@mnemon-dev\\mnemon\\bin\\mnemon.js',
  path.join(process.env.APPDATA || '', 'npm', 'node_modules', '@mnemon-dev', 'mnemon', 'bin', 'mnemon.js'),
];

export function resolveMnemonCli(explicit = null) {
  const list = [];
  if (explicit) list.push(explicit);
  if (process.env.DSH_MNEMON_CLI) list.push(process.env.DSH_MNEMON_CLI);
  for (const c of CLI_CANDIDATES) list.push(c);
  for (const c of list) {
    if (c && fs.existsSync(c)) return c;
  }
  return null;
}

/** 检索用的关键词清洗：只留字词，去掉一切 shell / 路径味的东西 */
export function sanitizeQuery(q, max = 60) {
  return String(q || '')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/["'`$;&|<>()^%!{}[\]\\/*?~#:]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

/** 强度 → mnemon 的 1–5 重要度 */
export function importanceFor(intensity) {
  const v = Math.max(0, Math.min(1, Number(intensity) || 0));
  return Math.max(1, Math.min(5, Math.round(v * 4) + 1));
}

/**
 * ⭐ 组装 mnemon 的 import 草稿（schema_version 1，已用 `mnemon import --dry-run` 验过）
 * @returns {{draft: object, content: string}}
 */
export function buildDraft({ summary, emotion, intensity, S = null, turn = null, at = null, senderId = null, session = null, tags = [], entities = [] } = {}, tagPrefix = 'ee') {
  const text = String(summary || '').trim();
  const stamp = String(at || new Date().toISOString()).slice(0, 19).replace('T', ' ');
  const bits = [];
  if (emotion) bits.push('情绪：' + emotion);
  if (intensity !== null && intensity !== undefined) bits.push('强度：' + Number(intensity).toFixed(2));
  if (S !== null) bits.push('S：' + Number(S).toFixed(1) + ' 轮');
  if (turn !== null) bits.push('第 ' + turn + ' 轮');
  if (senderId) bits.push('对象：' + senderId);
  const content = '【情绪事件 ' + stamp + '】' + text + (bits.length ? '（' + bits.join('；') + '）' : '');

  const allTags = ['emotion-engine', tagPrefix];
  if (emotion) allTags.push('emotion:' + emotion);
  if (senderId) allTags.push('sender:' + String(senderId).slice(0, 40));
  if (session) allTags.push('session:' + String(session).slice(0, 40));
  for (const t of tags) if (t) allTags.push(String(t).slice(0, 40));

  const allEntities = [];
  if (senderId) allEntities.push(String(senderId).slice(0, 40));
  if (emotion) allEntities.push(emotion);
  for (const e of entities) if (e) allEntities.push(String(e).slice(0, 40));

  return {
    content,
    draft: {
      schema_version: '1',
      insights: [{
        content,
        category: 'context',
        importance: importanceFor(intensity),
        tags: [...new Set(allTags)].slice(0, 20),
        entities: [...new Set(allEntities)].slice(0, 50),
        source: 'agent',
      }],
    },
  };
}

export class MnemonMemory {
  /**
   * @param {object} o
   * @param {boolean} [o.enabled]  关掉就只留本地账本
   * @param {string}  [o.cli]      mnemon CLI 的 bin/mnemon.js 路径
   * @param {string}  [o.dataDir]  数据目录（默认沿用 CLI 自身的默认）
   * @param {string}  [o.store]    命名的 memory store
   * @param {string}  [o.tagPrefix]
   * @param {number}  [o.timeoutMs]
   * @param {string}  [o.logFile]  失败/成功都记一行 NDJSON
   */
  constructor({ enabled = true, cli = null, dataDir = null, store = null, tagPrefix = 'ee', timeoutMs = 30000, logFile = null } = {}) {
    this.enabled = !!enabled;
    this.cli = resolveMnemonCli(cli);
    this.dataDir = dataDir;
    this.store = store;
    this.tagPrefix = tagPrefix;
    this.timeoutMs = timeoutMs;
    this.logFile = logFile;
    this.available = this.enabled && !!this.cli;
    this.lastError = this.enabled && !this.cli ? 'mnemon CLI 找不到（可用 mnemon.cli 或 DSH_MNEMON_CLI 指定）' : null;
  }

  get status() {
    return { enabled: this.enabled, cli: this.cli, available: this.available, lastError: this.lastError };
  }

  _log(obj) {
    if (!this.logFile) return;
    try {
      fs.mkdirSync(path.dirname(this.logFile), { recursive: true });
      fs.appendFileSync(this.logFile, JSON.stringify({ at: new Date().toISOString(), ...obj }) + '\n', 'utf8');
    } catch { /* 日志失败不算失败 */ }
  }

  /** 跑一次 CLI；resolve {code, stdout, stderr}；永不 throw */
  _run(args, { input = null } = {}) {
    return new Promise((resolve) => {
      if (!this.available) { resolve({ code: -1, stdout: '', stderr: this.lastError || 'mnemon unavailable' }); return; }
      const argv = [this.cli, ...args];
      if (this.dataDir) argv.push('--data-dir', this.dataDir);
      if (this.store) argv.push('--store', this.store);
      let child;
      try {
        child = spawn(process.execPath, argv, { windowsHide: true, shell: false, stdio: ['pipe', 'pipe', 'pipe'] });
      } catch (e) {
        resolve({ code: -1, stdout: '', stderr: String(e && e.message || e) });
        return;
      }
      let out = '', err = '', done = false;
      const finish = (r) => { if (!done) { done = true; resolve(r); } };
      const timer = setTimeout(() => {
        try { child.kill(); } catch { /* ignore */ }
        finish({ code: -2, stdout: out, stderr: 'timeout after ' + this.timeoutMs + 'ms' });
      }, this.timeoutMs);
      child.stdout.on('data', (d) => { out += d.toString('utf8'); });
      child.stderr.on('data', (d) => { err += d.toString('utf8'); });
      child.on('error', (e) => { clearTimeout(timer); finish({ code: -1, stdout: out, stderr: String(e && e.message || e) }); });
      child.on('close', (code) => { clearTimeout(timer); finish({ code: code === null ? -1 : code, stdout: out, stderr: err }); });
      if (input !== null) {
        try { child.stdin.end(input); } catch { /* ignore */ }
      } else {
        try { child.stdin.end(); } catch { /* ignore */ }
      }
    });
  }

  /**
   * ⭐ 写一条情绪事件。summary/emotion/intensity 由评价层给。
   * @returns {Promise<{ok:boolean, reason?:string, content?:string}>}
   */
  async remember({ summary, emotion, intensity, S = null, turn = null, at = null, senderId = null, session = null, tags = [], entities = [] } = {}) {
    const text = String(summary || '').trim();
    if (!text) return { ok: false, reason: 'summary 为空，不写' };
    const { draft, content } = buildDraft(
      { summary, emotion, intensity, S, turn, at, senderId, session, tags, entities },
      this.tagPrefix,
    );
    const dir = this.dataDir || process.cwd();
    const file = path.join(dir, '.ee-mnemon-draft.json');
    try {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, JSON.stringify(draft, null, 2), 'utf8');
    } catch (e) {
      const r = { ok: false, reason: '写 draft 失败: ' + (e && e.message) };
      this._log({ op: 'remember', ...r });
      return r;
    }
    const res = await this._run(['import', file, '--no-diff']);
    const ok = res.code === 0;
    const reason = ok ? undefined : (res.stderr || res.stdout || '').trim().slice(0, 300);
    this._log({ op: 'remember', ok, code: res.code, reason, turn, senderId });
    try { fs.unlinkSync(file); } catch { /* 留着也无妨 */ }
    return { ok, reason, content };
  }

  /**
   * 检索：返回 mnemon 给的候选（不含本项目的 R，R 由本地账本算）
   * @returns {Promise<Array<{id,excerpt,category,score,confidence}>>}
   */
  async recall(query, limit = 5) {
    const q = sanitizeQuery(query);
    if (!q) return [];
    const res = await this._run(['recall', q, '--limit', String(limit), '--brief']);
    if (res.code !== 0) {
      this._log({ op: 'recall', ok: false, code: res.code, reason: (res.stderr || '').slice(0, 300), q });
      return [];
    }
    try {
      const parsed = JSON.parse(res.stdout);
      const items = Array.isArray(parsed.results) ? parsed.results : [];
      this._log({ op: 'recall', ok: true, q, n: items.length });
      return items;
    } catch {
      this._log({ op: 'recall', ok: false, reason: 'stdout 不是 JSON', q });
      return [];
    }
  }

  /** 简单的存活自检（给 /emotion 命令用） */
  async probe() {
    const res = await this._run(['status']);
    return { ok: res.code === 0, code: res.code, out: (res.stdout || res.stderr || '').trim().split('\n').slice(0, 6).join('\n') };
  }
}

export default MnemonMemory;
