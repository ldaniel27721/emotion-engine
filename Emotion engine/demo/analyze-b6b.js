// B6 补充：行随机矩阵 A 的长期行为到底是"衰减到 0"还是"收敛到非零稳态"
'use strict';
const { V } = require('../src/space');
const f = (x, d = 6) => Number(x).toFixed(d);
const line = (n = 88) => '─'.repeat(n);
const matVec = (M, v) => M.map(row => row.reduce((s, x, j) => s + x * v[j], 0));

const A = [
  [0.86, 0.07, 0.07],
  [0.09, 0.45, 0.46],
  [0.06, 0.13, 0.81],
];

console.log('═'.repeat(88));
console.log('修正：行随机矩阵 A 的长期行为（跑 400 轮）');
console.log('═'.repeat(88));

// 稳态分布：行随机矩阵的左特征向量（A^T π = π ⇒ 迭代 A^T 收敛到 π）
let pi = [1 / 3, 1 / 3, 1 / 3];
for (let i = 0; i < 20000; i++) {
  const w = A[0].map((_, j) => A.reduce((s, row, k) => s + row[j] * pi[k], 0));
  const nw = w.reduce((a, b) => a + b, 0);
  pi = w.map(x => x / nw);
}
console.log('\n  A 的稳态分布 π = [' + pi.map(x => f(x, 4)).join(', ') + ']   （行随机的左特征向量）');

// 迭代
let E = [0.5, 0.3, -0.4];
console.log('\n  ' + '轮'.padEnd(7) + '‖E‖'.padEnd(14) + 'E');
console.log('  ' + '-'.repeat(62));
for (let t = 1; t <= 400; t++) {
  E = matVec(A, E);
  if ([1, 5, 10, 20, 50, 100, 200, 400].includes(t)) {
    console.log('  ' + String(t).padEnd(7) + f(V.norm(E)).padEnd(14) + V.fmt(E, 5));
  }
}

// ── 分解：沿稳态方向的分量与其余分量 ──
console.log('\n' + line());
console.log('为什么：把 E 分解到 π 方向与正交补上');
console.log(line());
{
  let e = [0.5, 0.3, -0.4];
  const proj = (v) => v.reduce((s, x, i) => s + x * pi[i], 0);   // 沿 π 的分量系数
  const normPi2 = pi.reduce((s, x) => s + x * x, 0);
  console.log('  ' + '轮'.padEnd(7) + '沿 π 的分量'.padEnd(16) + '正交补分量‖·‖');
  console.log('  ' + '-'.repeat(46));
  for (let t = 1; t <= 400; t++) {
    e = matVec(A, e);
    if ([1, 5, 10, 20, 50, 100, 200, 400].includes(t)) {
      const c = proj(e) / normPi2;
      const par = pi.map(x => x * c);
      const orth = V.norm(V.sub(e, par));
      console.log('  ' + String(t).padEnd(7) + f(c).padEnd(16) + f(orth));
    }
  }
}

console.log(`
  ⭐ 结论修正：
     行随机矩阵 A 的谱半径 = 1 ⇒ 有一个特征值恰好 = 1
     · 沿【稳态特征向量 π】的分量：【不衰减】，永久保留
     · 正交补上的分量：|λ|<1 ⇒ 衰减
     ⇒ E 的长期极限 = c·π ≠ 0（除非初始 E 恰好与 π 正交）

  ⚠️ 我上一版脚本只跑了 12 轮就断言"不收敛"，其实那时正交补还没衰减完，
     ‖E‖ 看起来在掉。**这个观察是对的，但解释错了** —— 正确说法是：
     它收敛到一个【非零的方向】，而不是收敛到 μ。
`);

console.log(line());
console.log('对照 A2 的要求');
console.log(line());
console.log('  A3 裁定：μ 是收敛终点  ⇒  无事件时 ‖E − μ‖ → 0');
console.log('  ⭐ 标量 ρ (0.927) 与 ρ·R(θ) 都满足（谱半径 = ρ < 1）');
console.log('  ❌ 行随机 A 不满足（谱半径 = 1 ⇒ 极限是非零的 c·π）');
console.log('  ⇒ ⚠️ 照搬 EmoChat 的 A 当演化算子，会让引擎【永不回落到 μ】');
