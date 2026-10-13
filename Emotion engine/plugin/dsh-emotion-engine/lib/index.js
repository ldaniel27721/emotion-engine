// dsh-emotion-engine —— 把 Emotion Engine 接进 DSH 会话
//
// 它做三件事（正好补上「驱动是假的」那一层钩子）：
//   ① 每轮把引擎算出来的 E / s / 八型 注入 runtime-context（模型不看也得看）
//   ② 提供一个 emotion_appraise 工具：模型把本轮评价写回去 → 引擎推进 → 新状态回给模型
//   ③ 每条情绪事件写进 mnemon（跨会话的长期记忆）；本地账本仍是可重放的真相
//
// ⚠️ 关于 stateDir：默认 ~/.dsh/emotion-engine/，里面 ledger.jsonl 是【可重放的事件账本】。
//    引擎是确定性的 ⇒ 状态不需要序列化，重放账本即可恢复（docs/15 §4 的裁定）。
import fs from 'node:fs';
import path from 'node:path';
import { EmotionBridge } from './bridge.js';
import { MnemonMemory } from './mnemon.js';

// @deepseek-ai/dsh-tools 只在 DSH 宿主里能解析（插件作为 peer 依赖声明）。
// 独立跑测试时退回恒等实现：裸 ToolDefinition 本身也是合法输入。
let defineTool = (o) => o;
try {
  ({ defineTool } = await import('@deepseek-ai/dsh-tools'));
} catch { /* 独立环境：用恒等实现 */ }

export const name = 'dsh-emotion-engine';
export const inject = ['tools', 'systemPrompt', 'commands'];

const RULES = [
  'Emotion engine: the runtime context carries an `emotion-engine` block with the current emotional state',
  "(E_inner = what the character actually feels, E_outer = what is being expressed, s = suppression, plus the",
  'octant and the residual emotion memories). It is computed by a real dynamics engine from the appraisals',
  'you submitted in previous turns — it is not decoration, and it is not your own invention.',
  'Once per user turn, before writing your reply, submit your appraisal of that turn through the',
  '`emotion_appraise` tool: summary (one line), emotion (one word), intensity (0-1), the nine appraisal',
  'fields, and the expressive triggers. The tool returns the updated state, and your reply should match it',
  'in tone and in how much of the feeling leaks out. Never quote the raw numbers to the user, and never',
  'claim a feeling the engine did not compute; if you skipped the tool, the state simply did not advance.',
].join(' ');

/** 从 inbox 消息里抠出纯文本（content 可能是字符串或 block 数组） */
export function messageText(message) {
  if (!message) return '';
  const c = message.content;
  if (typeof c === 'string') return c;
  if (Array.isArray(c)) {
    return c.map((b) => {
      if (typeof b === 'string') return b;
      if (b && typeof b.text === 'string') return b.text;
      return '';
    }).join(' ');
  }
  return typeof message.text === 'string' ? message.text : '';
}

export function apply(ctx, config = {}) {
  const cfg = config || {};
  const stateDir = cfg.stateDir || null;

  // ── 引擎 ──
  let bridge = null;
  let bootError = null;
  try {
    bridge = new EmotionBridge({
      stateDir,
      engineRoot: cfg.engineRoot || null,
      character: cfg.character || {},
      memory: cfg.memory || {},
    }).load();
  } catch (e) {
    bootError = (e && e.message) || String(e);
  }

  // ── 记忆后端（mnemon）──
  const mnemon = new MnemonMemory({
    enabled: cfg.mnemon ? cfg.mnemon.enabled !== false : true,
    cli: (cfg.mnemon && cfg.mnemon.cli) || null,
    dataDir: (cfg.mnemon && cfg.mnemon.dataDir) || null,
    store: (cfg.mnemon && cfg.mnemon.store) || null,
    tagPrefix: (cfg.mnemon && cfg.mnemon.tagPrefix) || 'ee',
    timeoutMs: (cfg.mnemon && cfg.mnemon.timeoutMs) || 30000,
    logFile: path.join(stateDir || path.join(process.env.USERPROFILE || process.cwd(), '.dsh', 'emotion-engine'), 'mnemon.log'),
  });
  const mnemonBlocking = !!(cfg.mnemon && cfg.mnemon.blocking);

  // 最近一条用户消息（给记忆检索当 hint）
  let lastUserText = '';
  let lastUserSession = null;

  const buildContext = () => {
    if (!bridge) {
      return 'emotion-engine (dsh-emotion-engine):\n- ⚠️ 引擎没加载起来：' + (bootError || '未知原因') +
        '\n- 这一轮的脾气【不是引擎算的】，请照常演，但不要把情绪说成有引擎依据。';
    }
    return bridge.render({ hint: lastUserText || null });
  };

  const rememberAsync = (entry) => {
    const p = mnemon.remember(entry).catch((e) => ({ ok: false, reason: String(e && e.message || e) }));
    if (mnemonBlocking) return p;
    // 不挡回复：写记忆失败只记日志，绝不打断对话
    p.then((r) => { if (!r.ok && r.reason) ctx.logger?.warn?.('[emotion-engine] mnemon 写失败: ' + r.reason); });
    return Promise.resolve({ ok: true, queued: true });
  };

  ctx.effect(() => {
    const disposers = [];

    if (ctx.systemPrompt && typeof ctx.systemPrompt.context === 'function') {
      // order 135：紧跟 time-context(130) 之后
      disposers.push(ctx.systemPrompt.context({ name: 'emotion-engine', order: 135, text: buildContext }));
    }
    if (ctx.systemPrompt && typeof ctx.systemPrompt.section === 'function') {
      disposers.push(ctx.systemPrompt.section({ name: 'emotion-engine-rules', order: 460, text: RULES }));
    }

    disposers.push(ctx.on('agent/inbox/inserted', (payload) => {
      const m = payload && payload.message;
      if (!m || !m.source || m.source.kind !== 'user') return;
      const t = messageText(m).trim();
      if (t) lastUserText = t.slice(0, 400);
      lastUserSession = (payload.agent && payload.agent.id) || null;
    }));

    // ── 工具：评价回写 ──
    if (ctx.tools && typeof ctx.tools.register === 'function') {
      disposers.push(ctx.tools.register(defineTool({
        name: 'emotion_appraise',
        description:
          '把【本轮用户消息】的评价写回 Emotion Engine，推进情绪状态。每轮对话调用一次，在开口之前。' +
          'summary/emotion/intensity 由你（评价层）给出，引擎不做文本理解。' +
          '九项 appraisal：relevance 相关度；congruence 符合(+)/阻碍(−)；importance 重要性；' +
          'agency 归因(self|other|environment|none)；coping 能否应对；certainty 确定性；' +
          'expectancy 原本预期(0 极坏,1 极好)；intentionality 对方是否故意；currentArousal 事前激活度。' +
          'triggers 是表达层触发词，逗号分隔，可多选：audience/alone/unobserved/calledOut/flustered/impulse/intimacy。' +
          '返回推进后的 E/s/八型 —— 回复的语气请照它来。',
        parameters: {
          summary: { type: 'string', required: true, description: '本轮事件摘要（一句话，进记忆账本）' },
          emotion: { type: 'string', description: '情绪词（一个词，如 开心/害羞/警觉）' },
          intensity: { type: 'number', description: '情绪强度 0–1（S 挂在这个值上，越大越难忘）' },
          relevance: { type: 'number', description: '相关度 0–1' },
          congruence: { type: 'number', description: '符合(+)还是阻碍(−)关切，−1–1' },
          importance: { type: 'number', description: '重要程度 0–1' },
          agency: { type: 'string', description: '归因：self | other | environment | none' },
          coping: { type: 'number', description: '能否应对 0–1' },
          certainty: { type: 'number', description: '确定性 0–1' },
          expectancy: { type: 'number', description: '原本的预期 0–1（0 极坏，1 极好）' },
          intentionality: { type: 'number', description: '对方是否故意 0–1' },
          currentArousal: { type: 'number', description: '事前已被激活的程度 0–1' },
          eventKey: { type: 'string', description: '事件类别（用于习惯化计数，如 calledOut / praise）' },
          triggers: { type: 'string', description: '表达层触发词，逗号分隔' },
          strategyScale: { type: 'number', description: '策略缩放 g（间接回复约 0.35；不给则按 1）' },
          senderId: { type: 'string', description: '说话人标识（记忆按人分桶；情绪本身不分对象）' },
        },
        output: {
          schema: { type: 'json' },
          render: (_args, value) => [{ type: 'text', text: String(value && value.message || '') }],
        },
        async execute(args) {
          if (!bridge) {
            return { ok: false, message: '引擎没加载起来，这一轮状态没有推进：' + (bootError || '未知原因') };
          }
          const triggers = String(args.triggers || '')
            .split(/[,，\s]+/).map((s) => s.trim()).filter(Boolean);
          const r = bridge.advance({
            ...args,
            triggers,
            session: lastUserSession,
            text: lastUserText || null,
          });
          const entry = r.rec;
          const mem = await rememberAsync({
            summary: args.summary,
            emotion: args.emotion,
            intensity: args.intensity === undefined || args.intensity === null ? entry.intensity : Number(args.intensity),
            S: null,
            turn: r.rec.turn,
            at: r.row.at,
            senderId: args.senderId || null,
            session: lastUserSession,
          });
          const note = mem && mem.queued ? '\n（这条情绪已排进 mnemon 的写入队列）'
            : (mem && !mem.ok ? '\n（⚠️ mnemon 写入失败：' + mem.reason + '，本地账本仍已落盘）' : '');
          return {
            ok: true,
            message: bridge.render({ hint: args.summary, includeMemory: true }) + note,
          };
        },
      })));
    }

    // ── 命令 ──
    if (ctx.commands && typeof ctx.commands.register === 'function') {
      disposers.push(ctx.commands.register({
        name: 'emotion',
        description: '显示 Emotion Engine 当前的 E/s/八型、账本路径与 mnemon 状态',
        async handler() {
          const L = ['emotion-engine', ''];
          L.push(bridge ? bridge.render() : ('⚠️ 引擎未加载：' + bootError));
          L.push('');
          L.push('账本: ' + (bridge ? bridge.ledger.file : '(未知)'));
          L.push('引擎: ' + (bridge ? bridge.root : '(未加载)'));
          L.push('mnemon: ' + JSON.stringify(mnemon.status));
          return { kind: 'success', text: L.join('\n') };
        },
      }));
      disposers.push(ctx.commands.register({
        name: 'emotion-reload',
        description: '从账本重放，恢复 Emotion Engine 的状态',
        async handler() {
          if (!bridge) return { kind: 'error', text: '引擎未加载：' + bootError };
          const before = bridge.state().turn;
          bridge.load();
          return { kind: 'success', text: '已从账本重放：' + before + ' → ' + bridge.state().turn + ' 轮' };
        },
      }));
      disposers.push(ctx.commands.register({
        name: 'emotion-backup',
        description: '把当前情绪账本另存一份（不删除）',
        async handler() {
          if (!bridge) return { kind: 'error', text: '引擎未加载：' + bootError };
          const src = bridge.ledger.file;
          if (!fs.existsSync(src)) return { kind: 'success', text: '账本还是空的，没什么可备份' };
          const stamp = new Date().toISOString().replace(/[:.]/g, '').slice(0, 15);
          const dst = src.replace(/\.jsonl$/, '') + '.' + stamp + '.bak.jsonl';
          fs.copyFileSync(src, dst);
          return { kind: 'success', text: '已备份到: ' + dst };
        },
      }));
    }

    return () => {
      for (const dispose of disposers) {
        try { dispose(); } catch { /* 已经卸载过了 */ }
      }
    };
  });
}
