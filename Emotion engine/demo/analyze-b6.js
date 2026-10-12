// B6 分析：EmoChat 的转移矩阵 A 能不能直接replace ρ？
//
// docs/06 的 B6 补法原文：「ρ 升级为 3×3（P/A/D）或 8×8（八型）转移矩阵；起步可用八型」
// 本脚本检验该移植在数学上是否成立。
'use strict';
const { V } = require('../src/space');

const line = (n = 88) => '─'.repeat(n);
const f = (x, d = 6) => Number(x).toFixed(d);
const hr = s => '\n' + '═'.repeat(88) + '\n' + s + '\n' + '═'.repeat(88);

// ── 线性代数小工具（不引依赖）──
function matVec(M, v) { return M.map(row => row.reduce((s, x, j) => s + x * v[j], 0)); }
/** 幂法求谱半径（|最大特征值|） */
function spectralRadius(M, iters = 20000) {
  let v = new Array(M.length).fill(0).map((_, i) => 1 / Math.sqrt(M.length) * (i % 2 ? -1 : 1));
  let lam = 0;
  for (let k = 0; k < iters; k++) {
    const w = matVec(M, v);
    const nw = Math.hypot(...w);
    if (nw < 1e-300) return 0;
    lam = nw;
    v = w.map(x => x / nw);
  }
  return lam;
}

console.log(hr('核心问题：EmoChat 的 A 与我们 A2 的 ρ 是同一类数学对象吗'));

// ── 造一个"像 EmoChat 那样"的转移矩阵 ──
// 原文：从 20 人标注的真实对话按【行归一化】⇒ 行随机矩阵
const A = [
  [0.86, 0.07, 0.07],   // 正性态：主要留在自己，少量转到其他
  [0.09, 0.45, 0.46],   // 负性态：停留短（对应 B1 的 0.451）
  [0.06, 0.13, 0.81],   // 另一正性态
];
console.log('\n  模拟 EmoChat 的 A（3×3，行归一化）：');
for (const r of A) console.log('    [' + r.map(x => f(x, 2).padStart(6)).join('') + ' ]');
const rowSums = A.map(r => r.reduce((a, b) => a + b, 0));
console.log('  行和 = [' + rowSums.map(x => f(x, 3)).join(', ') + ']   ← 行随机');

const rhoA = spectralRadius(A);
console.log('\n  ⭐ 谱半径 ρ(A) = ' + f(rhoA, 8));
console.log('  ⭐ 而 A2 的 ρ 必须 < 1（才能衰减回 μ）');
console.log('  ⚠️ ⇒ ρ(A) = 1 意味着【不衰减】—— 状态在其中守恒游走，永不收敛到一点');

// ── 数值验证：用 A 迭代会怎样 ──
console.log('\n' + line());
console.log('数值验证：用 A 当演化算子，E 会收敛到 μ 吗');
console.log(line());
{
  const MU = [0, 0, 0];
  let E = [0.5, 0.3, -0.4];
  console.log('  ' + '轮'.padEnd(6) + 'E'.padEnd(34) + '‖E‖');
  for (let t = 1; t <= 12; t++) {
    E = matVec(A, E);
    if (t <= 5 || t === 12) {
      console.log('  ' + String(t).padEnd(6) + V.fmt(E, 4).padEnd(34) + f(V.norm(E)));
    }
  }
  console.log('  ⚠️ ‖E‖ 不趋于 0 —— 它在状态间游走，不是回落到 μ');
}

// ── 对照：ρ 标量 / ρ·R(θ) 都会收敛 ──
console.log('\n' + line());
console.log('对照：三种算子的‖E‖轨迹（同一初始 E）');
console.log(line());
{
  const E0 = [0.5, 0.3, -0.4];
  const RHO = 0.927;
  // 旋转 θ 的 2D 块（作用在 P/A 平面），D 轴不变
  const th = 0.35;
  const R = [
    [Math.cos(th), -Math.sin(th), 0],
    [Math.sin(th), Math.cos(th), 0],
    [0, 0, 1],
  ];
  const M = R.map(row => row.map(x => x * RHO));

  let eS = E0.slice(), eR = E0.slice(), eA = E0.slice();
  console.log('  ' + '轮'.padEnd(6) + '标量 ρ'.padEnd(14) + 'ρ·R(θ)'.padEnd(16) + 'EmoChat A');
  console.log('  ' + '-'.repeat(50));
  for (let t = 1; t <= 10; t++) {
    eS = eS.map(x => x * RHO);
    eR = matVec(M, eR);
    eA = matVec(A, eA);
    if (t <= 4 || t === 10) {
      console.log('  ' + String(t).padEnd(6) + f(V.norm(eS)).padEnd(14) + f(V.norm(eR)).padEnd(16) + f(V.norm(eA)));
    }
  }
  console.log('\n  ⭐ 标量 ρ 与 ρ·R(θ) 都收敛到 0（衰减），A 【不收敛】');
  console.log('  ⭐ ρ·R(θ) 的额外好处：方向会漂（旋转）—— 这正是 B6 想要的新能力');
}

// ── ρ·R(θ) 的性质检查 ──
console.log('\n' + hr('若改用 ρ·R(θ)：性质检查'));
{
  const RHO = 0.927, th = 0.35;
  const R = [
    [Math.cos(th), -Math.sin(th), 0],
    [Math.sin(th), Math.cos(th), 0],
    [0, 0, 1],
  ];
  const M = R.map(row => row.map(x => x * RHO));
  console.log('  谱半径 ρ(M) = ' + f(spectralRadius(M), 8) + '   ⭐ = ρ（压缩，球面约束不破）');

  // 每轮 ‖M·v‖ / ‖v‖ 恒等于 ρ
  let ratios = [];
  for (const v of [[1, 0, 0], [0, 1, 0], [0.3, -0.7, 0.5], [1, 1, 1]]) {
    ratios.push(V.norm(matVec(M, v)) / V.norm(v));
  }
  console.log('  ‖M·v‖/‖v‖ = [' + ratios.map(x => f(x, 6)).join(', ') + ']');
  console.log('  ⭐ 对所有方向恒等于 ρ ⇒ 【保范数】，只改方向不改幅度');

  // 方向漂移
  let v = [1, 0, 0], v0 = v.slice();
  const ang = (a) => Math.atan2(a[1], a[0]);
  console.log('\n  方向漂移（从 P 轴出发）：');
  for (let t = 1; t <= 6; t++) {
    v = matVec(M, v);
    const deg = (ang(v) - ang(v0)) * 180 / Math.PI;
    console.log('    轮 ' + t + '  角度 ' + f(deg, 2).padStart(7) + '°   ‖E‖=' + f(V.norm(v)));
  }
  console.log('  ⭐ 幅度按 ρ 衰减，角度线性漂移 —— 二者【可分别调】');
}

// ── 与 B4 裁定（两轴）的关系 ──
console.log('\n' + hr('与 B4 裁定（ρ / h(n) 两轴）的关系'));
console.log(`
  B4 裁定：ρ 的轴 = 对话轮次（时间轴）· h(n) 的轴 = 同类事件次数（事件轴）

  ⚠️ 若把 ρ 换成 EmoChat 的 A：
     · A 仍是"每轮过一次" ⇒ 时间轴没变 ⇒ 与 B4 不冲突
     · ⚠️ 但 A 的谱半径 1 ⇒ 时间轴上【不衰减】⇒ 直接与 A2/A3 冲突
       （A3 裁定：μ 是收敛终点）

  ⭐ 若换成 ρ·R(θ)：
     · 仍每轮过一次 ⇒ 时间轴不变 ⇒ 与 B4 不冲突
     · 谱半径仍 = ρ ⇒ 衰减语义保住 ⇒ 与 A2/A3 相容
     · ⭐ 新增的是【方向轴】—— 严格说这是【第三根轴】，不是替换 ρ
`);
