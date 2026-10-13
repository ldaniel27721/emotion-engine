// Emotion Bridge —— 把 Emotion Engine 与「一轮对话」对接起来的薄层
//
// 设计要点（对应 docs/15 的裁定与 docs/13 的接入方案）：
//   ① 引擎是确定性的 ⇒ 状态可以【由账本重放得到】，不必序列化内部对象
//      （docs/15 §4：v1 公式下递推写法失效，事件账本从"附加模块"变成必需组件）
//   ② 情绪只有一条 E（不分对象）；记忆条目按 senderId 分桶
//   ③ 引擎不读文本：summary / emotion / intensity 全由评价层（模型）给
//
// 本文件不依赖 DSH，可单独用 node 跑测试（见 test/bridge.test.mjs）。
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

/** 默认角色配置（与 test/turns/session-20261013-qq.json 对齐） */
export const DEFAULT_CHARACTER = {
  name: '傲娇大肥鱼',
  sigma: 0.5,
  rho: 0.927,
  alpha: 0.95,
  muPreset: 'dependent',
};

export const DEFAULT_MEMORY = { S0: 30, k: 4, topK: 4, minR: 0.05 };

/**
 * 找 Emotion Engine 的 src 目录。顺序：显式配置 → 相对本包 → 已知绝对路径。
 * 找不到就抛，绝不静默降级（静默降级 = 演一场没有引擎的戏）。
 */
export function resolveEngineRoot(explicit = null) {
  const looksRight = (c) => {
    if (!c) return false;
    let dir = c;
    try { dir = decodeURIComponent(c); } catch { /* keep raw */ }
    dir = dir.replace(/^[/\\]([A-Za-z]:)/, '$1');           // Windows: 去掉 "/E:/..." 的前导斜杠
    return fs.existsSync(path.join(dir, 'src', 'index.js')) ? path.resolve(dir) : null;
  };

  // ① 显式指定的（配置 / 环境变量）：指错了就【大声报错】，不静默换一个
  const explicitList = [explicit, process.env.DSH_EMOTION_ENGINE_ROOT].filter(Boolean);
  if (explicitList.length) {
    for (const c of explicitList) {
      const hit = looksRight(c);
      if (hit) return hit;
    }
    throw new Error('engineRoot 指向的目录里没有 src/index.js：' + explicitList.join(' / '));
  }

  // ② 没指定：按已知位置找
  const candidates = [
    new URL('../../../', import.meta.url).pathname,   // lib/ → 上三级 = 仓库里的 "Emotion engine/"
    'E:\\dsh\\_herta-clone\\Emotion engine\\',
    'E:\\dsh\\_herta-plugin\\Emotion engine\\',
  ];
  for (const c of candidates) {
    const hit = looksRight(c);
    if (hit) return hit;
  }
  throw new Error('Emotion Engine 找不到 src/index.js；请设置 engineRoot 或 DSH_EMOTION_ENGINE_ROOT');
}

function loadEngine(root) {
  const entry = path.join(root, 'src', 'index.js');
  const EE = require(entry);
  if (!EE || typeof EE.Character !== 'function') throw new Error('Emotion Engine 入口异常：' + entry);
  return EE;
}

// ────────────────────────────────────────────────
// 账本（append-only JSONL）—— 唯一真相，状态由重放得到
// ────────────────────────────────────────────────
class Ledger {
  constructor(file) {
    this.file = file;
    fs.mkdirSync(path.dirname(file), { recursive: true });
  }

  /** 逐行读；容忍最后一行被截断（进程被杀时会发生） */
  read() {
    if (!fs.existsSync(this.file)) return [];
    const raw = fs.readFileSync(this.file, 'utf8');
    const out = [];
    for (const line of raw.split('\n')) {
      const s = line.trim();
      if (!s) continue;
      try { out.push(JSON.parse(s)); } catch { /* 半行：丢弃 */ }
    }
    return out;
  }

  append(row) {
    fs.appendFileSync(this.file, JSON.stringify(row) + '\n', 'utf8');
    return row;
  }

  /** 重写整本（只有 memory 修剪/迁移才用） */
  rewrite(rows) {
    const tmp = this.file + '.tmp';
    fs.writeFileSync(tmp, rows.map((r) => JSON.stringify(r)).join('\n') + (rows.length ? '\n' : ''), 'utf8');
    fs.renameSync(tmp, this.file);
  }
}

// ────────────────────────────────────────────────
// Bridge
// ────────────────────────────────────────────────
export class EmotionBridge {
  /**
   * @param {object} o
   * @param {string} [o.stateDir]   状态目录（默认 ~/.dsh/emotion-engine）
   * @param {string} [o.engineRoot] 引擎根目录
   * @param {object} [o.character]  角色配置
   * @param {object} [o.memory]     情绪记忆配置
   */
  constructor({ stateDir = null, engineRoot = null, character = {}, memory = {} } = {}) {
    this.root = resolveEngineRoot(engineRoot);
    this.EE = loadEngine(this.root);
    this.cfg = { ...DEFAULT_CHARACTER, ...character };
    this.memCfg = { ...DEFAULT_MEMORY, ...memory };
    this.dir = stateDir || path.join(os.homedir(), '.dsh', 'emotion-engine');
    this.ledger = new Ledger(path.join(this.dir, 'ledger.jsonl'));
    this.reset();
  }

  /** 建一条新角色 + 空记忆 */
  reset() {
    const c = this.cfg;
    this.character = new this.EE.Character({
      name: c.name, sigma: c.sigma, rho: c.rho, alpha: c.alpha, muPreset: c.muPreset,
    });
    this.memory = new this.EE.EmotionMemory({
      S0: this.memCfg.S0, k: this.memCfg.k, topK: this.memCfg.topK, minR: this.memCfg.minR,
    });
    this.mu = this.character.mu.vector.slice();
    this.last = null;
    return this;
  }

  /** ⭐ 从账本重放，恢复状态（引擎确定性 ⇒ 重放 = 恢复） */
  load() {
    this.reset();
    const rows = this.ledger.read();
    for (const row of rows) this._apply(row, { replay: true });
    return this;
  }

  _apply(row, { replay = false } = {}) {
    const rec = this.character.step({
      appraisal: row.appraisal || {},
      eventKey: row.eventKey || null,
      context: {
        triggers: row.triggers || [],
        // ⚠️ 必须把 null 归一成 undefined：engine 里写的是 `ctx.strategyScale === undefined ? 1 : …`，
        //    传 null 会让 gStrategy = null ⇒ g = 0 ⇒ ΔE 被乘成 0，E 永远不动（2026-10-13 实测踩到）
        strategyScale: (row.strategyScale === undefined || row.strategyScale === null) ? undefined : row.strategyScale,
        scene: row.scene || undefined,
      },
    });
    this.last = rec;
    if (row.summary || row.emotion) {
      this.memory.add({
        turn: rec.turn,
        at: row.at || null,
        summary: row.summary || '',
        emotion: row.emotion || '',
        intensity: row.intensity === undefined ? rec.intensity : row.intensity,
        keywords: row.keywords || null,
      });
    }
    return rec;
  }

  /**
   * ⭐ 推进一轮：评价层给的东西进来，引擎算出新的 E。
   * @param {object} input appraisal 九项 + summary/emotion/intensity/senderId/...
   */
  advance(input = {}) {
    const row = {
      turn: this.character.turn + 1,
      at: input.at || new Date().toISOString(),
      session: input.session || null,
      senderId: input.senderId || null,
      text: input.text ? String(input.text).slice(0, 400) : null,
      summary: input.summary || '',
      emotion: input.emotion || '',
      intensity: input.intensity === undefined ? null : Number(input.intensity),
      keywords: input.keywords || null,
      eventKey: input.eventKey || null,
      triggers: input.triggers || [],
      strategyScale: input.strategyScale === undefined || input.strategyScale === null ? null : Number(input.strategyScale),
      scene: input.scene || null,
      // 九项评价既可平铺在顶层，也可放在 appraisal 子对象里（两种都吃）
      appraisal: pickAppraisal({ ...input, ...(input.appraisal || {}) }),
    };
    this.ledger.append(row);
    const rec = this._apply(row);
    return { row, rec, state: this.state() };
  }

  /** 只过时间、无事件（例如用户长时间没说话） */
  idle(n = 1) {
    this.character.idle(n);
    this.ledger.append({ turn: this.character.turn, at: new Date().toISOString(), idle: n, appraisal: null });
    return this.state();
  }

  /** 当前状态（给注入用） */
  state() {
    const E = this.character.E;
    const V = this.EE.V;
    const rel = V.sub(E, this.mu);
    const rec = this.last || {};
    return {
      turn: this.character.turn,
      name: this.character.name,
      E_inner: E.slice(),
      E_outer: rec.E_outer ? rec.E_outer.slice() : E.slice(),
      mu: this.mu.slice(),
      rel,
      r: V.norm(rel),
      octant: rec.octant || null,
      direction: rec.direction || null,
      valence: rec.valence === undefined ? null : rec.valence,
      intensity: rec.intensity === undefined ? null : rec.intensity,
      s: rec.s === undefined ? null : rec.s,
      sEff: rec.sEff === undefined ? null : rec.sEff,
      leak: rec.leak || null,
      h: rec.h === undefined ? null : rec.h,
      rho: rec.rho === undefined ? null : rec.rho,
      percentile: rec.percentile === undefined ? null : rec.percentile,
      entries: this.memory.size,
    };
  }

  /** ⭐ 注入块：E / s / 八型 + 残余最高的几条情绪记忆 */
  render({ hint = null, k = null, includeMemory = true, advice = null } = {}) {
    const st = this.state();
    const V = this.EE.V;
    const L = [];
    L.push('emotion-engine (dsh-emotion-engine):');
    L.push(`- 角色: ${st.name}   轮次: ${st.turn}   情绪八型: ${st.octant || '（还没推进过）'}`);
    L.push(`- E_inner（真感觉）: ${V.fmt(st.E_inner)}   E_outer（说出来的）: ${V.fmt(st.E_outer)}`);
    L.push(`- μ（底情绪）: ${V.fmt(st.mu)}   偏离 |E−μ| = ${st.r.toFixed(3)}   s 抑制 = ${st.s === null ? '-' : st.s.toFixed(3)}`);
    if (st.intensity !== null) {
      L.push(`- 上一轮: 效价 ${st.valence === null ? '-' : st.valence.toFixed(3)} · 强度 ${st.intensity.toFixed(3)} · 习惯化 h ${st.h === null ? '-' : st.h.toFixed(3)}`);
    }
    L.push('- 这份状态是引擎算出来的，不是演出来的：说之前先按它调整语气，不要直读数值。');
    L.push(advice || '- 若本轮有新事件，先用 emotion_appraise 工具把评价写回去，再开口。');
    if (includeMemory) {
      const hits = this.memory.retrieve(st.turn, hint, k === null ? this.memCfg.topK : k);
      const text = this.memory.render(hits, st.turn);
      if (text) L.push('', text);
    }
    return L.join('\n');
  }

  /** 情绪记忆检索（给 mnemon 后端或调试用） */
  memoryHits(hint = null, k = null) {
    const st = this.state();
    return this.memory.retrieve(st.turn, hint, k).map(({ entry, R }) => ({ ...entry, R }));
  }
}

/** 只挑 appraisal 的九个字段（防止把整包输入塞进账本） */
export function pickAppraisal(input = {}) {
  const keys = ['relevance', 'congruence', 'importance', 'agency', 'coping', 'certainty', 'expectancy', 'intentionality', 'currentArousal'];
  const out = {};
  for (const k of keys) if (input[k] !== undefined && input[k] !== null && input[k] !== '') out[k] = input[k];
  return out;
}

export default EmotionBridge;
