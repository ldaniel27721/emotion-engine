# Emotion Engine · 情绪引擎

**版本 `0.1.1-beta`**

一个把「刺激 → 评价 → 情绪 → 表达」形式化的情绪引擎，为一个陪伴型 AI 角色
（傲娇大肥鱼）提供可计算、可复现、可验证的情绪动力学。

> **状态**：beta。数学模型已定案（A1–A4），评价层与表达层为初版实现。
> 参数中 `ρ = 0.927` 为**工程取值，无文献依据**（已用 11 篇文献核对，均未给出可参照的衰减时间常数）。

---

## 版本记录

### `0.1.1-beta`（2026-10-12）

**⭐ 表达层的判据修正 + 两个状态补充**

| 改动 | 说明 |
|---|---|
| **`attachment`（在意程度）** | ⭐ 设定者裁定「傲娇对象**并非恋爱对象**，它是一种人格特质，是一个对**人事物**的**反馈路径**」⇒ 把"对象特定"抽象为连续量 `attachment ∈ [0,1]`；对象偏移 = `−0.35 × 在意程度`（越在意 → 越怕被看穿 → 抑制越强） |
| **`unobserved` 状态** | 「无人在场（对象可能也不在）」+0.25，与 `alone`（两人独处 +0.55）区分。理由是桑多涅在"无人的庭园"（哥伦比娅失踪、无人在场）若按 `alone` 计会把 s 拉回中等，与文本的极强抑制不符 |
| **状态互斥改为通用** | 三个情境状态（audience / alone / unobserved）互斥，不再硬编码两两关系 |
| **新增案例文档** | `docs/05-案例·桑多涅.md` —— 游戏原文 + 判据检验 + 引擎参数 |
| **新增测试** | `demo/test-attachment.js` |

**⭐ 修正后的判据**（覆盖 wiki 的第②条）

```
① intentional（故意的，不是失控）
② 对【在意的人 / 事 / 物】（在意程度调制）      ← 原为 "towards love interest"
③ 区分真实感受与公开形象                        ← 核心，保留
④ 在 tsun / dere 间切换
⑤ 是一种人格特质 = 对人事物的【反馈路径】
```

### `0.1.0-beta`（2026-10-12）

首个版本：A1–A4 四个子模型 + 评价层 + 表达层，17 文件 / 12,449 行。

---

## 快速开始

```bash
node demo/demo.js          # 三幕演示 + 5 组对照实验
node demo/test-lexicon.js  # 词库 × 评价层整合测试
```

```js
const EE = require('./src');

const feiyu = new EE.Character({
  name: '傲娇大肥鱼',
  sigma: 0.50,             // A1：情绪化程度
  muPreset: 'dependent',   // A3：底情绪（依赖型）
  subtype: ['Tsundere', 'Tsun-Ama', 'Tsuntere'],  // 傲娇表达层
  gainPos: 1.0, gainNeg: 1.3,
});

const r = feiyu.step({
  eventKey: '被戳中',
  context: { triggers: ['calledOut'] },
  appraisal: {
    relevance: 0.95, congruence: 0.80, importance: 0.85,
    agency: 'other', coping: 0.40, certainty: 0.90,
    expectancy: 0.30, intentionality: 1.0, currentArousal: 0.55,
  },
});

console.log(r.direction, r.octant, r.dE, r.E_inner, r.E_outer, r.s, r.concept);
// Caring  Dependent  [0.306, 0.301, -0.298]  …  0 概念「热恋」
```

---

## 一、链路总览

```
刺激（= change）
  │
  ├─ 事件过滤器 ────────── 只有部分事件有情感意义 → 大量 ΔE = 0
  │
  ├─ 评价层（两级）──────── ⭐ 本节是 #40 的核心
  │    一级：goal relevance · goal congruence · importance
  │          → 输出（价效, 强度）
  │    二级：agency · coping · certainty · expectancy · intentionality
  │          → 输出 12 方向类 → 八型
  │
  ├─ ΔE（乘法结构）──────── ΔE = α(精度) × ε(预测误差) × signature
  │
  ├─ A2 动力学 ─────────── E_t = μ + ρ(E_{t−1} − μ) + g(策略)·h(n)·ΔE
  │                        再经对数封顶 f(r) = 1 − (1+r)^(−k), k = 1/σ
  │
  ├─ E_inner ───────────── 里层真实情绪
  │
  ├─ 表达层（傲娇）──────── E_outer = μ + s·(E_inner − μ)
  │                        s = 抑制强度（18 亚型 + 情境触发）
  │
  └─ 行为 ───────────────  强度↑ → 尝试更多策略；但削弱"投入型策略"的效果
```

---

## 二、四个已定案的子模型

| | 名称 | 核心 | 状态 |
|---|---|---|---|
| **A1** | 球体与正态互补 | 三维 PAD · 白化 · `r²/σ² ~ χ²(3)` · **对数封顶** | ✅ 定案 |
| **A2** | 情绪动力学 | `ρ` 自发回落 · `h(n)` 习惯化 · `g` 策略缩放 | ✅ 定案（三层拆分） |
| **A3** | 原点与底情绪 | `μ = (方向, precision)` · 慢漂移 | ✅ 定案（precision 为新增） |
| **A4** | 情绪词库 | 599 词 → **概念先验** | ✅ 定案 |

**另有表达层**（傲娇），**文献无据**，来自粉丝维基语料 + 设定者裁定。

---

## 三、模块清单

```
src/
  space.js       A1 · PAD 空间 · 白化 · χ²(3) 量程 · 对数封顶
  appraisal.js   评价层 · 两级评价 → ΔE · LLM 直填接口
  dynamics.js    A2 · 三层动力学（ρ / h(n) / g）
  mu.js          A3 · (方向, precision) · 贝叶斯解读 · 慢漂移
  tsundere.js    表达层 · 18 亚型 → 参数 · 情境触发 · 泄露通道
  lexicon.js     A4 · 599 词 → 概念先验 · 评价→候选概念匹配
  engine.js      组装 · Character · 主循环 · 心境开关
  index.js       统一出口
demo/
  demo.js        三幕演示 + 5 组对照
  test-lexicon.js 词库整合测试
docs/
  01-数学模型.md  全部公式与符号
  02-架构.md      模块职责与数据流
  03-文献依据.md  11 篇文献 + wiki 语料
  04-傲娇机制.md  18 亚型与表达层
```

---

## 四、核心公式

```
【A1 空间】
  白化       y = L⁻¹(x − μ)          （Cholesky）
  方向       γ = y / ‖y‖
  强度       r = ‖y‖
  量程       r² / σ² ~ χ²(3)          （σ = 角色参数）
  ⭐ 封顶     f(r) = 1 − (1+r)^(−k)     k = 1/σ
             lim(r→∞) f(r) = 1（永不到达）—— "球面"从阈值变成渐近极限

【评价层】
  一级:  价效 = congruence × relevance
         强度 = importance × relevance × (1 + 0.5(1 − expectancy)) × (1 + 0.3·arousal)
  二级:  (agency, coping, certainty, expectancy, intentionality) → 12 方向类 → 八型
  门控:  α = max( relevance × importance, (1 − certainty) × relevance )

【ΔE】
  ΔE = α × ε × signature
       ε = |valence − expectedValence| × 0.5 + 0.5(1 − certainty)

【A2 动力学】
  E_t = μ + ρ(E_{t−1} − μ) + g(策略) · h(n) · ΔE
        h(n) = α_habit^(n−1)           α_habit ≈ 0.93–0.96
  再经封顶
  ⚠️ 稳态（线性时）r_∞ = |ΔE| / (1 − ρ) —— ρ=0.927 时放大 13.7 倍，
     故封顶是必需的

【A3 底情绪】
  μ = (方向, precision)
  贝叶斯读数 后验 = (μ/var_prior + 事件/var_lik) / (1/var_prior + 1/var_lik)
  慢漂移：μ ← μ + rate · unit(Δ)，上限 0.35

【表达层】
  E_outer = μ + s · (E_inner − μ)
  s = clamp( s₀ + 状态偏移 + 事件累积 + 疲劳 )
  状态类：audience −0.40 · alone +0.55   （幂等，不叠加）
  事件类：calledOut +0.45 · flustered −0.25 · impulse +0.30 · intimacy +0.10
```

---

## 五、⚠️ 引用纪律

**本引擎的建设性依据分两层，引用时不可混淆：**

| 层 | 来源 | 可引用性 |
|---|---|---|
| **学术层** | 11 篇同行评审文献（AET · appraisal · 建构主义 · 知觉 · 习惯化 · 贝叶斯情绪模型…） | ✅ 可作理论依据 |
| **亚文化层** | the-dere-types / tsundere 粉丝维基（18 亚型 + 数值标注） | ⚠️ **只作工程语料，不可作学术依据** |

**另有三条已知的"不可用"：**
- `ρ = 0.927` 是工程取值，**无文献依据**（11 篇均未给出可参照的衰减常数）
- 词库只作**工程用概念先验**，不写成"情绪的本质"（AET pp.20-22 · Barrett p.21 的警告）
- 一篇题目为 "The Equation of Human Emotion" 的预印本经核查为**空壳**（ℱ 未定义、0 数据、
  自引约 97%、非同行评审），**已排除，不可引用**

---

## 六、已知限制

```
· ρ、σ、α_habit 的取值均为工程标定，非文献值
· 习惯化的时间尺度只有 trial 轴数值，无物理时间常数
· "被戳中"与"有观众"的相对强度未定（当前量级相近，观众效应略占优）
· 八型的 Docile (+,−,−) 在中文词库中为空
· 评价层目前是 rule-based 参考实现；生产环境应走 LLM 直填（见 APPRAISAL_SCHEMA）
```

---

## 七、许可与出处

见 `docs/03-文献依据.md` 的完整文献表。
粉丝维基内容遵循 CC-BY-SA。
