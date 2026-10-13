// ⭐⭐ 情绪衰减公式：把「情绪衰减理论」(A2 的 ρ) 与「记忆衰减理论」(SuperMemo 的 S) 糅合
//
// 观察：
//   A2（情绪）:   E_t − μ = Σ_i ΔE_i · ρ^(t − t_i)          ρ 全局常量
//   SuperMemo（记忆）: R = exp(−Δ/S)                          S 逐事件
//
//   ⭐ 而  ρ^Δt = exp(−λ·Δt)  ⇒  λ = −ln(ρ)
//      ⇒ 两式【同族】—— 差别只在 ρ 是"全局"还是"逐事件"
//
//   ⇒ ⭐⭐ 糅合 = 让 ρ 逐事件，由情绪强度决定：
//        ρ_i = exp(−1 / S_i)     ，S_i = S0·(1 + k·intensity_i)
'use strict';
const f = (x, d = 6) => Number(x).toFixed(d);
const hr = s => '\n' + '═'.repeat(90) + '\n' + s + '\n' + '═'.repeat(90);

const RHO = 0.927;                       // A2 的全局 ρ
const LAMBDA = -Math.log(RHO);           // = 0.07581
const S_EQUIV = 1 / LAMBDA;              // ⭐ 等价稳定性

console.log(hr('① 两种写法是同一件事'));
console.log('  A2:        E 按 ρ^Δt 衰减            ρ = ' + RHO);
console.log('  记忆理论:  R = exp(−Δt/S)');
console.log('');
console.log('  换写：ρ^Δt = exp(Δt·ln ρ) = exp(−Δt·(−ln ρ)) = exp(−Δt·λ)');
console.log('        λ = −ln(' + RHO + ') = ' + f(LAMBDA));
console.log('        ⭐ 等价稳定性 S = 1/λ = ' + f(S_EQUIV, 3) + ' 轮');
console.log('');
console.log('  ⇒ ⭐ 半衰期核对：ρ 的半衰期 = ' + f(Math.log(0.5) / Math.log(RHO), 3) +
  ' ｜ S 的半衰期 = ' + f(S_EQUIV * Math.LN2, 3) + '  ⇒ 一致');

console.log(hr('② ⭐⭐⭐ 糅合公式'));
console.log(`
  【情绪衰减公式 v1】

     E_t − μ  =  Σ_i  ΔE_i · exp( −(t − t_i) / S_i )

     其中：
       ΔE_i  = 第 i 个事件的冲击        （评价层产出 —— A2 的现有部分）
       S_i   = 第 i 个事件的【情绪稳定性】= S0 · (1 + k · intensity_i)
       t_i   = 事件发生的轮次
       intensity_i = 该事件的情绪强度    （评价层产出）

  ⭐ 与原 A2 的唯一差别：
       A2:  ρ 是【全局常量】
       v1:  ρ_i = exp(−1/S_i) 是【逐事件】的
  ⇒ ⭐ A2 是 v1 在「所有事件强度相同」时的特例
`);

console.log(hr('③ 数值验证：强度全相同时，v1 必须退化成 A2'));
{
  const S0 = S_EQUIV;   // ⭐ 取 S0 = 42.3，使 intensity=0 时 S=S0 正好等价于 ρ=0.927
  const k = 0;          // k=0 ⇒ S 恒为 S0 ⇒ 应精确等于 A2
  const T = 12;
  const events = [[1, 0.5], [4, -0.3], [7, 0.8]];   // [轮次, ΔE 的 P 分量]

  // v1 计算
  const v1 = (rhoGlobal) => {
    let acc = 0;
    for (const [ti, dE] of events) {
      const S = S0 * (1 + k);
      acc += dE * Math.exp(-(T - ti) / S);
    }
    return acc;
  };
  // A2 计算
  const a2 = () => {
    let acc = 0;
    for (const [ti, dE] of events) acc += dE * Math.pow(RHO, T - ti);
    return acc;
  };
  console.log('  S0 = ' + f(S0, 4) + '（= 1/λ）· k = ' + k + '（强度不影响 → 应等价）');
  console.log('  v1(T=' + T + ') = ' + f(v1(), 10));
  console.log('  A2(T=' + T + ') = ' + f(a2(), 10));
  const diff = Math.abs(v1() - a2());
  console.log('  差 = ' + diff.toExponential(3) + '   ' + (diff < 1e-12 ? '✅ 精确退化' : '⚠️ 不等'));
}

console.log(hr('④ ⭐⭐ 强度不同时，行为差异'));
{
  const S0 = 42.27, k = 4;
  console.log('  两个事件，ΔE 大小相同，但强度不同：');
  console.log('    事件 A @轮1   intensity=0.1  ⇒ S = ' + f(S0 * (1 + 4 * 0.1), 2));
  console.log('    事件 B @轮1   intensity=1.0  ⇒ S = ' + f(S0 * (1 + 4 * 1.0), 2));
  console.log('');
  console.log('  ' + 'Δ轮'.padEnd(8) + 'A 的残余'.padEnd(14) + 'B 的残余'.padEnd(14) + 'B/A');
  console.log('  ' + '-'.repeat(48));
  for (const d of [0, 10, 20, 40, 60, 100, 150]) {
    const a = Math.exp(-d / (S0 * (1 + 4 * 0.1)));
    const b = Math.exp(-d / (S0 * (1 + 4 * 1.0)));
    console.log('  ' + String(d).padEnd(8) + f(a, 4).padEnd(14) + f(b, 4).padEnd(14) + f(b / a, 3));
  }
  console.log('');
  console.log('  ⭐ 同样大的冲击，强情绪的那份【留得久得多】—— 这正是"情绪衰减"该有的样子');
}

console.log(hr('⑤ ⭐⭐ 与引擎现有实现的关系'));
console.log(`
  引擎现在（A2 · dynamics.js）:
     E_t = μ + ρ(E_{t−1} − μ) + g·h(n)·ΔE
     ⇒ 这是【递推】写法，等价于 Σ ΔE_i · ρ^(t−t_i)
     ⇒ ⚠️ 但它【不区分事件】—— 所有历史事件共用同一个 ρ

  糅合后（v1）:
     E_t − μ = Σ_i ΔE_i · exp(−(t−t_i)/S_i)
     ⇒ ⭐ 每个事件带自己的 S_i（由 intensity 定）
     ⇒ ⭐ 而 ρ 成为【每个事件的 ρ_i = exp(−1/S_i)】

  ⚠️ 实现上要注意的：
     ① 递推写法【不再适用】—— 因为每个事件的衰减率不同，
        不能只用"上一轮的 E"推下一轮，必须保留事件账本
     ② ⭐ 所以【情绪记忆账本】正好是 v1 的必需组件 —— 不是附加功能！
     ③ 封顶（A1 的球面约束）仍作用在合成后的 r = ‖E − μ‖ 上
`);

console.log(hr('⑥ ⭐ 三个层次的关系（理清）'));
console.log(`
  ┌ ρ（全局常量，A2 现状）
  │   管"混在一起的一团情绪怎么散"
  │   ⚠️ 是所有事件情绪强度的【平均场近似】
  │
  ├ R = exp(−Δ/S)（记忆衰减理论，SuperMemo）
  │   管"单条记忆/单条情绪的残余"
  │   S 逐事件
  │
  └ ⭐ 糅合 v1 = 用逐事件的 S 取代全局 ρ
      管"每个历史事件的情绪各自还剩多少，然后合成当下情绪"
      ⇒ ⭐ 而 A2 是它强度全同时的特例（已数值验证）
`);
