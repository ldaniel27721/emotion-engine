'use strict';
// 会话回放器 —— 把一段对话的轮次喂进 Emotion Engine，
// 把【源码计算】与【情绪反馈】落成两份文件（md 给人看 / json 给机器看）。
//
// 用法（在项目根目录跑）：
//     node test/replay.js test/turns/session-20261013-qq.json
//     node test/replay.js test/turns/xxx.json --out test/runs
//
// 输入格式见 test/turns/*.json；输出落在 test/runs/，文件名带时间戳，不覆盖旧结果。

const fs = require('fs');
const path = require('path');
const { Character } = require('../src/engine');

const args = process.argv.slice(2);
const turnsArg = args[0];
if (!turnsArg) {
  console.error('用法: node test/replay.js <turns.json> [--out <dir>]');
  process.exit(1);
}
const outIdx = args.indexOf('--out');
const outDir = outIdx >= 0 && args[outIdx + 1] ? args[outIdx + 1] : 'test/runs';

const turnsPath = path.resolve(process.cwd(), turnsArg);
const outPath = path.resolve(process.cwd(), outDir);
if (!fs.existsSync(turnsPath)) {
  console.error('读不到轮次文件: ' + turnsPath);
  process.exit(1);
}
if (!fs.existsSync(outPath)) fs.mkdirSync(outPath, { recursive: true });

const spec = JSON.parse(fs.readFileSync(turnsPath, 'utf8'));
const cfg = spec.character || {};
const c = new Character({
  name: cfg.name || 'unnamed',
  sigma: cfg.sigma === undefined ? 0.5 : cfg.sigma,
  muPreset: cfg.muPreset || 'dependent',
});
const MU = c.mu.vector.slice();

// ── 小工具 ──
const f3 = v => '[' + v.map(x => (x >= 0 ? ' ' : '') + Number(x).toFixed(3)).join(', ') + ']';
const f4 = x => Number(x).toFixed(4);
const rad = v => Math.sqrt(v.reduce((s, x) => s + x * x, 0));
const sign3 = v => '(' + v.map(x => (x >= 0.04 ? '+' : (x <= -0.04 ? '−' : '0'))).join(',') + ')';
const pad = (s, n) => { s = String(s); let w = 0; for (const ch of s) w += (ch.charCodeAt(0) > 255 ? 2 : 1); return s + ' '.repeat(Math.max(0, n - w)); };
const esc = s => String(s).replace(/\|/g, '\\|');

// ── 逐轮回放 ──
const rows = [];
for (let i = 0; i < spec.turns.length; i++) {
  const t = spec.turns[i];
  const r = c.step({
    eventKey: t.key,
    appraisal: t.appraisal,
    context: { triggers: t.triggers || [], strategyScale: t.strategyScale },
  });
  const rel = r.E_inner.map((x, k) => x - MU[k]);
  rows.push({ index: i + 1, key: t.key, text: t.text, triggers: t.triggers || [], appraisal: t.appraisal, rec: r, rel, relR: rad(rel) });
}

const now = new Date();
const p2 = n => String(n).padStart(2, '0');
const stamp = now.getFullYear() + p2(now.getMonth() + 1) + p2(now.getDate()) + '-' + p2(now.getHours()) + p2(now.getMinutes());
const base = path.basename(turnsPath, '.json') + '-' + stamp;
const mdFile = path.join(outPath, base + '.md');
const jsonFile = path.join(outPath, base + '.json');

// ── 人类可读 ──
const L = [];
L.push('# 会话回放 · ' + (spec.session || path.basename(turnsPath)));
L.push('');
L.push('- 回放时间：' + now.toISOString().replace('T', ' ').slice(0, 19) + ' (+08:00 本地 ' + stamp + ')');
L.push('- 轮次来源：`' + path.relative(process.cwd(), turnsPath).replace(/\\/g, '/') + '`');
L.push('- 渠道 / 窗口：' + (spec.channel || '-') + ' / ' + (spec.window || '-'));
L.push('- 角色：' + c.name + '（σ=' + c.space.sigma + '，μ 预设=' + c.mu.label + '，ρ=' + c.dynamics.rho + '）');
L.push('- μ（底情绪）= ' + f3(MU));
L.push('');
if (spec.note) { L.push('> ' + spec.note); L.push(''); }

L.push('## 一、情绪反馈（结果层）');
L.push('');
L.push('| t | 事件 | 原文 | E−μ 方向 | \\|E−μ\\| | 八型 | E_inner（P,A,D） | s 抑制 | E_outer（说出来的） |');
L.push('|---|---|---|---|---|---|---|---|---|');
for (const x of rows) {
  L.push('| ' + x.index + ' | ' + esc(x.key) + ' | ' + esc(x.text) + ' | ' + sign3(x.rel) + ' | ' + f4(x.relR) + ' | ' + x.rec.octant + ' | ' + f3(x.rec.E_inner) + ' | ' + f4(x.rec.s) + ' | ' + f3(x.rec.E_outer) + ' |');
}
L.push('');

L.push('## 二、源码计算（因子层）');
L.push('');
L.push('| t | valence | E[val] | intensity | α | ε | ΔE（乘 g 前） | g | ρ | r | h | exposure |');
L.push('|---|---|---|---|---|---|---|---|---|---|---|---|');
for (const x of rows) {
  const r = x.rec;
  L.push('| ' + x.index + ' | ' + f4(r.valence) + ' | ' + f4((x.appraisal.expectancy - 0.5) * 2) + ' | ' + f4(r.intensity) + ' | ' + f4(r.alpha) + ' | ' + f4(r.eps) + ' | ' + f3(r.dE) + ' | ' + f4(r.g) + ' | ' + f4(r.rho) + ' | ' + f4(r.r) + ' | ' + f4(r.h) + ' | ' + f4(r.exposure) + ' |');
}
L.push('');

const last = rows[rows.length - 1];
L.push('## 三、汇总');
L.push('');
L.push('- 末态 E_inner = ' + f3(last.rec.E_inner) + '，E_outer = ' + f3(last.rec.E_outer));
L.push('- 末态相对 μ 偏移 = ' + sign3(last.rel) + '，径向强度 = ' + f4(last.relR) + '，量程百分位 = ' + f4(last.rec.percentile));
L.push('- 末态抑制 s = ' + f4(last.rec.s) + '，泄露通道 = ' + JSON.stringify(last.rec.leak) + '，泄露量 = ' + f4(last.rec.leakAmount));
let hi = rows[0], lo = rows[0];
for (const x of rows) { if (x.relR > hi.relR) hi = x; if (x.relR < lo.relR) lo = x; }
L.push('- 离 μ 最远：t' + hi.index + ' ' + hi.key + '（' + f4(hi.relR) + '，' + sign3(hi.rel) + '）');
L.push('- 离 μ 最近：t' + lo.index + ' ' + lo.key + '（' + f4(lo.relR) + '，' + sign3(lo.rel) + '）');
L.push('- ρ = ' + last.rec.rho + '（半衰期 ' + f4(Math.log(0.5) / Math.log(last.rec.rho)) + ' 轮）');
L.push('');
L.push('---');
L.push('');
L.push('*本文件由 `test/replay.js` 生成。appraisal 由模型逐轮直填，引擎未做文本理解 —— 故这里记录的是「模型怎么解读这些轮次」。*');
L.push('');

fs.writeFileSync(mdFile, L.join('\n'), 'utf8');

// ── 机器可读 ──
const out = {
  session: spec.session || null,
  channel: spec.channel || null,
  window: spec.window || null,
  replayedAt: now.toISOString(),
  engine: { version: require('../src/index').VERSION, character: c.name, sigma: c.space.sigma, muPreset: c.mu.label, rho: c.dynamics.rho, alpha: c.dynamics.alpha },
  mu: MU,
  turns: rows.map(x => ({
    index: x.index, key: x.key, text: x.text, triggers: x.triggers,
    appraisal: x.appraisal,
    appraisalOut: x.rec.appraisal,
    direction: x.rec.direction, octant: x.rec.octant,
    valence: x.rec.valence, intensity: x.rec.intensity, alpha: x.rec.alpha, eps: x.rec.eps,
    dE: x.rec.dE,
    h: x.rec.h, exposure: x.rec.exposure, g: x.rec.g, rho: x.rec.rho, r: x.rec.r, rRaw: x.rec.rRaw,
    EInner: x.rec.E_inner, EOuter: x.rec.E_outer,
    s: x.rec.s, sEff: x.rec.sEff, leak: x.rec.leak, leakAmount: x.rec.leakAmount,
    percentile: x.rec.percentile,
    rel: x.rel, relR: x.relR,
    note: x.rec.note || null,
  })),
};
fs.writeFileSync(jsonFile, JSON.stringify(out, null, 2), 'utf8');

console.log('回放完成：' + rows.length + ' 轮');
console.log('  ' + path.relative(process.cwd(), mdFile).replace(/\\/g, '/'));
console.log('  ' + path.relative(process.cwd(), jsonFile).replace(/\\/g, '/'));
console.log('  末态 ' + sign3(last.rel) + ' |E−μ|=' + f4(last.relR) + ' 八型=' + last.rec.octant + ' s=' + f4(last.rec.s));
