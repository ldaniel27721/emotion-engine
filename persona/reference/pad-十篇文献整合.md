# PAD 十篇文献整合

> **整合时间**：2026-10-10
> **材料**：设定者投喂的 10 篇新文献 + 之前已入库的 5 篇
> **工具**：`scripts/pdf-extract.py`（纯文本）+ `scripts/pdf-formula-extract.py`（坐标重建 + 渲染）
> **方法**：批量抽取 15 份 / 245 页；逐篇由子代理**读渲染图**取公式（文本层对公式不可靠）

---

## 零、这次整合解决/改变了什么

| 原来的状态 | 整合后 |
|---|---|
| 「底情绪 = 原点」是设定者的**直觉** | **三处文献支持**：Russell 1980 / Wen 2021 / Zhang 2024 |
| 「强度 = 径向距离」无出处 | **Russell 1980 有思想前身**（但语义需转换，见 §3.2） |
| 「球面 = 强度极致」无出处 | ⚠️ **仍无出处 —— 且文献里有【四种】不同的几何做法**（见 §5） |
| 「衰减/回复力」会违背「不归零」裁定 | ✅ **Peña 2011 的 MVS 给出兼容方案**：衰减到**人格位置**，不是原点（见 §3.5） |
| Xu 的 `μ = λ·γ` 乘法形式无依据 | ✅ **Russell 1980 p.1175 原文旁证**：有的情感状态是「**乘法**组合」（见 §3.3） |
| Xu 的 γ = (±1,±1,±1) 以为是 Mehrabian 的 | ⚠️ **Mehrabian 1991 一手核查：原文根本没有数值坐标或参考向量**，±1 是 Xu 的构造 |
| 「正交 vs 相关」冲突悬着 | ✅ **有实测数字了**：Mehrabian 1991 三因子方差 27/23/14，相关 **−.07 / .03 / .18**（见 §3.4） |
| 骨架缺 Dependent/Docile 那族 | ✅ **文献印证这是普遍空白**：Mehrabian 原文说 *"no representative measures … emphasizing the Docile end"* |

---

## 一、文献总览

| # | 文件 | 是什么 | 对我们的用处 |
|---|---|---|---|
| 1 | `ap2024143_341134453.pdf` | 熊瑛 2024《维度情感模型研究现状综述》（中文） | 指路 |
| 2 | `Hatice Gunes2013.pdf` | 维度 vs 分类、第 4/5 维定义 | 期望维/强度维的逐字定义 |
| 3 | `finalversion.pdf` | Xu et al. 2023 | `μ = λ·γ` 公式 |
| 4 | `JOC2901-09.pdf` | Chen & Cui 2018 | 24 个真实坐标；覆盖粒 `G = Σ\|C_i\|²/\|U\|²` |
| 5 | `2106.pdf` | Wen et al. 2021 | 情绪转移 `E_r = E_i + P·ΔE`；人格权重 |
| 6 | **`russell1980.pdf`** | Russell 1980 **环状模型** | ⭐ 原点=适应水平/中性；**乘法组合**旁证；空间是二维**圆盘** |
| 7 | **`mehrabian1991.pdf`** | Mehrabian 1991 **八型出处** | ⭐ 八型符号一手确认；**三因子近独立实测**；**情境70%/人格30%** |
| 8 | **`EvidenceforaThree-factorTheory.pdf`** | 三因子理论 | ⏳ 分析中 |
| 9 | **`ND_PAD_manuscript.pdf`** | Zhang et al. 2024 忆阻器 PAD 生成 | ⚠️ 用**超立方体** [−1,1]³；无演化项 |
| 10 | **`mti-10-00038-v2.pdf`** | Duan et al. 2026 MDPI 多模态情绪识别 | ⭐ 6 类情绪**实测** PAD 向量（1–7 标度）；D 维最难 |
| 11 | **`viewcontent.pdf`** | 待读 | ⏳ 分析中 |
| 12 | **`978-0-387-87685-6_18.pdf`** | Springer 章节 | ⏳ 分析中 |
| 13 | **`10.1007@978-3-642-24603-619.pdf`** | Peña et al. 2011 **Mood Vector Space** | ⭐⭐ 演化 + **衰减到人格位置**；立方体空间；最近邻分类 |
| 14 | **`pkpadmin,+…JSMS0601Hall.pdf`** | 待读 | ⏳ 分析中 |
| 15 | ~~`noller1980.pdf`~~ | 婚姻非言语沟通 | ❌ **错配**：全文不涉 PAD，零贡献 |

---

## 二、⭐ 已确认的（可以写进规格）

### 2.1 八型符号（一手确认）

**Mehrabian 1991 p.79 逐字**：

```
Exuberant  (+P +A +D)   vs   Bored      (−P −A −D)
Relaxed    (+P −A +D)   vs   Anxious    (−P +A −D)
Hostile    (−P +A +D)   vs   Docile     (+P −A −D)
Disdainful (−P −A +D)   vs   Dependent  (+P +A −D)
```

术语：`+A` = **arousable**（易激惹/高唤醒倾向），`−A` = unarousable；
`+D` = dominant，`−D` = submissive。

**→ 与 Xu 2023 用的八型符号表逐字一致。符号层得到一手确认。**
**→ 判别规则（原文）：*"Disdainful and Hostile are distinguished by low trait arousability in the former and high in the latter."*（两者仅 A 分量符号相反）**

### 2.2 原点 = 中性（三处独立支持）

| 出处 | 原话 |
|---|---|
| **Russell 1980 p.1170** | *"affective states of **moderate intensity would fall toward the middle of the space**, with the **origin presumably corresponding to adaptation level or a neutral feeling**."* |
| **Wen 2021** | *"utterances with no explicit emotion, we use the **Neutral with (0.00, 0.00, 0.00)**"* |
| **Zhang 2024** | *"the **coordinate origin (0V, 0V, 0V)** in the space is **neutral emotion**"* |

**→ 「底情绪 = 原点」有据。** 且 Russell 那句同时说明「**中等强度落在中间**」——
即**离中心的距离 = 强度**。

---

## 三、⭐⭐ 整合带来的关键发现

### 3.1 「强度 = 径向距离」的思想前身（但要小心语义）

**Russell 1980 p.1166 逐字**：
> *"**P is the length of the vector from the origin** and is a measure of the precision of the angle given."*

**⚠️ 严重警告**：这里的 `P` 在原文是**排序一致性/角度精确度**指标（0 = 被试随机分类，1 = 全体一致），
**不是情绪强度**。取值 .71–.97。

**但同一篇 p.1170 那句"moderate intensity would fall toward the middle"才是真正的强度-距离依据。**

**→ 引用时必须区分：p.1170 支持"强度=离中心距离"；p.1166 的 P 只是几何量的思想史来源，不可当强度公式。**

### 3.2 「乘法组合」有原文旁证 ⭐

**Russell 1980 p.1175 逐字**：
> *"in which some affective states were found to be definable **not as linear combinations but as
> multiplicative combinations** of the pleasure and arousal dimensions"*

**→ 这是 `μ = λ·γ`（强度 × 方向）的原文旁证。** 不只是几何类比，Russell 本人写过"有的情感状态是乘法组合"。

### 3.3 三因子近独立的实测数字

**Mehrabian 1991 p.76**：
```
三因子方差：pleasure 27% / arousal 23% / dominance 14%   合计 64%
量表间相关：P–A = −.07    P–D = .03    A–D = .18
```

**Russell 1980**：pleasure 与 arousal 在 28 词样本上实际相关 **.03**。

**trait 层（Mehrabian 1991 p.79）**：P–D = **.19** (p<.01)，P–A = **−.07**，A–D = **.11**。

**→ 「维度实测相关」确实存在，但量级很小（|r| ≤ .19）。**
**→ 这支持设定者的「正交」裁定，同时给 Gunes 2013 的"相关"一个具体量级。**

### 3.4 情境 70% / 人格 30%（可加权重）

**Mehrabian 1991 p.83 逐字**：
```
[.7 × P + .3 × (−P + A + D) = .4P + .3A + .3D]
```
> *"This follows simply from a **70% weighting of the situation versus a 30% weighting of temperament**."*

**并且原文明确：情绪状态 = f(情境, 人格)，两者效应"主要是可加的（largely additive）"。**

**→ 这是 Wen 2021 的 `E_r = E_i + P·ΔE` 里那个 `P` 的**先验值**。**

### 3.5 ⭐⭐ 演化与衰减：Peña 2011 的 Mood Vector Space

**空间**：`M = [−1, 1]³`（**立方体**，不是球）

**四条核心方程（逐字）**：

```
(3) t = 0:  u_i(0) = m₀(A_i)                        ← 初始 = 人格决定的默认心情
(4) t > 0:  u_i(t) = u_i(t−1) ⊕ E_{A_i,t}           ← 无衰减（= Wen 的 E_r = E_i + ΔE）
(5) E = α₁v₁ ⊕ … ⊕ α_m v_m                           ← 多个情绪按强度 α 聚合
(6) t > 0:  u_i(t) = a_v( u_i(t−1) ⊕ E_{A_i,t} )     ← ★ 加衰减
    v = m₀(A_i)，a_v(·) 定义的序列【收敛到 v】
```

**⭐⭐⭐ 并且原文明确【否定】了"回到空间中心"的做法：**
> *"The **ALMA** model assumes that the mood movement is based on a **pull-push strategy** which takes
> **the centre of the PAD space** as reference… In our approach, the PAD space is homogeneous…
> The relevance of a point in the mood space is according to **the distance to the DEFAULT MOOD POINT
> derived by the personality**."*

**→ 这几乎就是设定者「没有回到原点这回事」的文献版本：**
**衰减存在，但收敛到【人格默认点】，不是原点。**

**⭐ 分类机制（R3）**：`f_ν : M → M^τ`，取**最小范数距离**的 mood tag。

### 3.6 Docile 那一族的空白 —— 文献印证

**Mehrabian 1991 原文**：
> *"There were **no representative measures** in the study emphasizing the **Docile** end of the diagonal."*

**→ 我们发现的"骨架缺 Dependent/Docile 那一族（高愉悦+低支配）"不是我们的疏漏，
而是整个测量文献的空白。** Mehrabian 本人当年也没能测到。

### 3.7 ⭐⭐⭐ 「正交 vs 相关」冲突的**三层分解** —— 悬案可以结案

整合后看清：这不是一个冲突，而是**三个不同层次的问题被混在了一起**。

| 层次 | 主张 | 出处 | 数值 |
|---|---|---|---|
| **几何层** | 强度 ⊥ 方向 | **本项目的裁定** | 球坐标 `(λ, γ)` 天然分离 |
| **测量层** | 三轴**近独立** | **Mehrabian 1991 p.76** | 零阶相关 **\|r\| ≤ .18**（P–A −.07 / P–D .03 / A–D .18） |
| **因果层** | 三轴**互相影响** | **Hall et al. 2017**（SEM 路径系数） | β = **.27 ~ .48**（全部 p<.001） |

**Hall 2017 的立场（逐字）**：
> *"Many studies that have employed the PAD model have considered the three components to be
> **independent** of each other. However, some have made the claim, and found empirical support for,
> the notion that the components **may affect each other**."*
> *"Studies in which the three components are treated as being completely independent of each other
> may be **missing much of the complexity, richness, and explanatory power** of the PAD model."*

**Hall 2017 的路径系数**（p.16 Figure 2，全部 \*\*\*p<.001）：
```
Dominance → Arousal   .48        Pleasure  → Attitude    .50
Dominance → Pleasure  .27        Attitude  → Intentions  .95
Arousal   → Pleasure  .33
```

**⭐⭐⭐ 关键：这 5 个是【结构路径系数 β】，不是【零阶相关 r】。**
**弱相关的三个变量之间完全可以存在强因果路径 —— 两者不矛盾。**

**→ 三层同时成立，冲突消解。**
**→ 此前 Gunes 2013 说的"实测相关"属于【测量层】，量级以 Mehrabian 1991 的 |r| ≤ .18 为准。**

**⚠️ 另记一处题项污染**：Hall 2017 的 `Relaxed` 在 pleasure 与 arousal 两个子量表里**各出现一次**
（`Relaxed 1-5 Bored` 与 `Stimulated 1-5 Relaxed`）—— 这会人为抬高 P–A 相关。

### 3.8 ⭐⭐ 实测模长分布 —— 给「球面半径」提供数字

对 **39 个实测点**（Chen 2018 的 24 个 + Wen 2021 的 7 个 + Zhang 2024 的 8 个）统一计算 `|E|`：

```
min = 0.000   25% = 0.482   中位 = 0.671   75% = 0.819   max = 1.253

分来源：
  Chen2018   n=24   中位 0.539   max 0.977   ← 【全部在单位球内】，几乎触顶未破
  Wen2021    n= 7   中位 0.791   max 1.114   ← 2 个越界（Fear 1.114 / Joy 1.062）
  Zhang2024  n= 8   中位 0.688   max 1.253   ← 3 个越界（Relaxed/Anger/Happy）
```

**⭐⭐⭐ 规律非常干净：越界的全部来自【硬件/工程谱系】。**

| 谱系 | 数值范围 | 几何约定 |
|---|---|---|
| **Russell → Chen 谱系**（纯心理学坐标） | 每维典型 ≤ 0.7，`\|E\|` **≤ 0.977** | 与「球面 = 强度极致」**兼容** |
| **硬件/工程谱系**（Zhang 的电路输出、Peña 的 MVS） | 各维独立拉满，出现 `\|E\| = 1.25` | **立方体**，与球面数学上不可同时成立 |

**⭐ 这不是矛盾，是两套几何约定。**
**⭐ 且 Chen 谱系的 max = 0.977 —— 几乎触及但没破 1，支持「球面是理论上限，现实到不了」的读法。**

### 3.9 ⭐⭐⭐ 第 4 个坐标源 + 人格系数矩阵的中文出处（田智行 2021）

**文献**：田智行、陈夏铭、姜大志《一种离散状态与维度空间互映射的人工情感模型》，
**系统仿真学报 2021, 33(5): 1062–1069**，DOI `10.16182/j.issn1004731x.joss.20-0007` · 16 条公式。

**表 1（6 种基本情感的真实 PAD 坐标）**：
```
高兴 ( 0.40,  0.20,  0.15)      悲伤 (−0.40, −0.20, −0.50)
惊奇 ( 0.20,  0.10,  0.10)      愤怒 (−0.51,  0.59,  0.25)  ← 与 Chen/Wen/Mehrabian 完全一致
恐惧 (−0.64,  0.60, −0.43)  ← 与 Chen 的 afraid 完全一致
厌恶 (−0.40,  0.20,  0.10)  ← 与 Chen 的 disgust 完全一致
```

**⭐ 这是第 4 个独立坐标源，且与前三源一致 —— 坐标层的证据链现在是四条腿。**

**式(14)/(16) 的 3×5 人格系数矩阵**（列序 **Ex, Ag, Ne, Op, Co** —— 注意不是 OCEAN 序）：
```
[ 0.21,  0.59,  0.19,  0,     0   ]
[ 0,     0.30, −0.56,  0.15,  0    ]
[ 0.60, −0.32,  0,     0.25,  0.17 ]
```

**⭐⭐ 与 Wen 2021 的 Eq(2) 逐项对上**：
| 项 | 本文 | Wen 2021 |
|---|---|---|
| P_V | `0.21Ex + 0.59Ag + 0.19Ne` | `0.21E + 0.59A + 0.19N` ✓ |
| P_A | `0.30Ag − 0.56Ne + 0.15Op` | `0.15O + 0.30A − 0.57N` ✓（四舍五入差） |
| P_D | `0.60Ex − 0.32Ag + 0.25Op + 0.17Co` | `0.25O + 0.17C + 0.60E − 0.32A` ✓ |

**→ 两篇独立文献用同一个 Mehrabian 系数矩阵。既交叉验证，也提供了中文出处。**

**演化机制**：
```
式(7)   ψ_t = 1/(2(e−1)) × [(1+t)^t − 1]
        t→0 时 ψ→0；t→∞ 时 ψ→1/2     ← 【有界阻尼因子，演化幅度随时间递减、趋于饱和】
式(5)(6) 显式的转移矩阵修正公式（含 ψ_t）
式(8)   P = Σ_{i=1..n} PAD_i · e_i，约束 Σe_i = 1   ← 【凸组合，结果落在凸包内】
```

**判定**：
- **无复位/归零 ✅ 与裁定兼容**（全概率递推，无回复力项）
- ⚠️ **ψ_t 有界（≤1/2）→ 演化幅度递减**；若项目要「强度可持续增长」，两者存在张力
- ⚠️ **本文无任何「强度 = 径向距离 / 球面 = 极致」的对应公式**（否定性结论，高置信）
- ⭐ 表 1 的 6 型**只覆盖 4 个八型**（高兴/惊奇=Exuberant、愤怒/厌恶=Hostile、恐惧=Anxious、悲伤=Bored）；
  **Dependent / Relaxed / Docile / Disdainful 四型无对应** → 这四型须由 Chen 2018 的 24 坐标补齐

### 3.10 ⭐⭐⭐⭐ 正交之争的**本源答案**（Russell & Mehrabian 1977）

**文献**：Russell, J. A. & Mehrabian, A. (1977). *Evidence for a Three-Factor Theory of Emotions.*
**Journal of Research in Personality, 11, 273–294**（22 页）· 这是 PAD 三因子理论的**原始出处**。

#### 它定义的 "independent" 是【生成性独立】，不是【统计独立】

```
p.274  "independent in that 【any value along one dimension can occur simultaneously
        with any value on either of the other two dimensions】"
p.279  "The intercorrelations … are 【not incompatible with their assumed independence】.
        Generally, across any particular sample of emotional states, nonzero linear or
        curvilinear relationships may be seen…"
p.292  "【all eight possible combinations】 of high and low values along each of the
        three dimensions actually occur"
```

#### 它自己报的实测相关

```
P–A = .03      P–D = .40      A–D = .15        ← 同页后文又写 P–A = .04（原文自相矛盾）
二次项系数 = −.16（倒 U）；线性 + 曲线合计 < 5% 的 pleasure 方差
作者自评 P–D = .40 为 "unexpectedly high in the present data"
```

#### ⭐⭐⭐⭐ 冲突的完整分解（六个来源，说的其实是不同的事）

| 出处 | 说的是 | 实际意思 | 层次 |
|---|---|---|---|
| **R&M 1977（定义）** | "independent" | **任意取值可同时出现、八种组合都真实存在** | **生成性/组合性** |
| **R&M 1977（实测）** | P–D = .40 / P–A = .03 / A–D = .15 | 有相关，但 *"not incompatible with independence"* | 测量 |
| **Mehrabian 1991** | \|r\| ≤ .18 | 另一批样本上的实测 | 测量 |
| **Gunes 2013** | "实测相关" | 引用的是**实测相关**，不是否定生成性独立 | 测量 |
| **Hall 2017** | β = .27 ~ .48 | **因果层**路径系数 | 因果 |
| **本项目裁定** | 强度 ⊥ 方向 | **几何层**构造 | 几何 |

**→ Gunes 的"相关"与 R&M 的"independent"不是同一件事 —— 【表述差异，不是推翻】。**
**→ 此前的"冲突"可以结案：降级为措辞问题。**

#### ⭐⭐ 本源文献的三维**全是方向轴，没有强度轴**

```
三维 = pleasure / 【degree of arousal】 / dominance        ← 全部是双极方向轴
"intensity" 一词全文未出现
"orthogonal" 一词全文未出现
八型命名（Exuberant 等）全文未出现
```

**→ 「强度 = 径向距离」是本项目**额外加的一维**，文献里没有对应 —— 不构成冲突，是补充。**

#### ⭐⭐ `μ = λ·γ` 在本源的原型

Table 1 是 **42 条标准化回归方程**，形式为：

```
Scale = b_P·P + b_A·A + b_D·D + b_PA·(P×A) + b_PD·(P×D) + b_Aq·Acquiescence
```

- **存在交互项**：Eq(15) 含 `−.10 PD`，Eq(32) 含 `+.05 PD`，Eq(1) Happiness 含 `+.29 PA`
- **→ 这是 Russell 1980 所说"乘法组合"的实证来源。**

#### ⭐⭐ D 轴存在的唯一理由 = 八型的四组对角

```
p.292  "Only dominance makes it possible to distinguish
        【angry from anxious】, 【alert from surprised】,
        【relaxed from protected】, and 【disdainful from impotent】."
```

#### ⚠️ 两个象限是**测量史上的空白**

- **Disdainful (−,−,+) 最薄弱**：原文自承 *"failed to provide **any instances** combining
  displeasure, low arousal, and dominance … although the **magnitudes of the components were small**"*
  （实测 −.32\*, −.11, .09\*）
- **Docile (+ ,−,−) 亦无**（见 §3.6：Mehrabian 1991 自承 *"no representative measures … emphasizing the Docile end"*）

**→ 八型里 Docile 与 Disdainful 两个象限，整个测量文献都是空白。这**不是**我们骨架的缺陷。**

#### ⭐ Table 4 = 151 词的完整 PAD 坐标表

**（本项目坐标层的**一手依据**，即 §3.1「需另找」的那份表）**

| 八型（**推断**，非原文表） | Table 4 中的代表词（P, A, D） |
|---|---|
| Exuberant | Happy (.81\*, .51\*, .46\*) / Joyful / Elated / Triumphant / Excited / Vigorous |
| **Dependent** | Loved (.87\*, .54\*, −.18\*) / In love / Sexually excited / Impressed / Grateful / Awed |
| **Relaxed** | Relaxed (.68\*, −.46\*, .06) / Leisurely / Untroubled / Secure |
| **Docile** | Sheltered (.14, −.36\*, −.44\*) / Protected / Consoled / Humble / Reverent |
| Hostile | Angry (−.51\*, .59\*, .25\*) / Hostile / Cruel / Cold anger / Enraged / Contempt |
| Anxious | Fearful / Terrified / Startled / Humiliated / Embarrassed / Guilty / Pain |
| Bored | Bored (−.65\*, −.62\*, −.33\*) / Depressed / Despairing / Lonely / Nauseated / Sad |
| **Disdainful** | 仅实例，且分量小（−.32\*, −.11, .09\*）—— **低置信** |

**⭐ 注意**：`Anxious` 一词自身的 P = .01 **不显著**，原文裁定该词是**不恰当的标签**。

---

## 四、⚠️ 冲突与缺口

### 4.1 ⚠️ Xu 的 γ = (±1,±1,±1) 没有一手依据

**Mehrabian 1991 一手核查结论**：
- 八型只是把三轴各自**二分化**得到的**八分体符号标签**；
- **原文没有任何数值坐标、参考向量、λ 或 γ 的概念**；
- `γ` 三分量取 ±1 **是 Xu 的规范化约定**。

**→ 规格里引用 `μ = λ·γ` 时必须写明：符号位可上溯到 Mehrabian 1991，
数值约定（±1）与 λ 是 Xu 2023 的构造。**

### 4.2 ⚠️ D 轴的理论代价

**Russell 1980 p.1163 / p.1171 逐字**：
> *"Russell and Mehrabian's (1974, 1977) factor of **dominance-submission** … can be interpreted as
> referring to **perceived aspects of the antecedents or consequences of the emotion rather than to
> the emotion per se**."*

**但同篇 p.1175 承认**：
> *"a dominance–submission dimension accounted for a **small but significant** proportion of variance
> in affect scales **beyond** that accounted for by pleasure and arousal"*

**→ 用 PAD 三维，需要自行承担"D 轴进入情感空间"这一步的理论代价。**
**→ 且 mti 2026 的实测说 D 维**最难标定/回归**（RMSE 最高，作者自陈"fails to adequately extract dominance"）。**

### 4.3 ⚠️ 人格层的 A 轴 ≠ 状态层的 A 轴

**Mehrabian 1991 逐字**：
> *"Although the resulting trait pleasure and trait dominance measures were satisfactory,
> **a reliable trait arousal measure was not obtained**."*

**→ 人格层的 A 轴改用 `arousability`（刺激筛选）概念，与状态层的 `arousal` **不是同一构念**。**
**→ 大肥鱼若要"人格调制情绪"，这个不对称必须先处理。**

### 4.4 ⚠️ Surprise 的象限（三方冲突）

| 出处 | 归属 |
|---|---|
| Xu 2023 | `Relaxed (+,−,+)` —— **低唤醒** |
| Wen 2021 坐标 `(0.40, 0.67, −0.13)` | `Dependent (+,+,−)` —— **高唤醒** |
| Russell 1980 图 2 | `astonished` 在 **NE 象限**（高唤醒） |

**→ 三方中两方支持高唤醒。Xu 那条孤例。**

---

## 五、🔴 核心新问题：几何形状有【四种】做法

| 做法 | 出处 | 边界含义 |
|---|---|---|
| **二维圆盘** | Russell 1980 | *"a **disk or a wheel** would be a better image"*；最大值落在**圆的周长**上 |
| **三维立方体** `[−1,1]³` | Peña 2011 MVS；Zhang 2024 ND_PAD | 各维**独立**限幅，允许 (1,1,1) 存在 |
| **三维球体** `\|E\| ≤ 1` | **本项目的设定** | 球面 = 强度极致；方向与强度分离 |
| 无显式几何 | Wen 2021 | 只给坐标，不约束边界 |

**⭐⭐ 关键：立方体与球体数学上不可同时成立。**
`(1,1,1)` 在立方体里是合法的（模长 √3 ≈ 1.732），在球体里不存在。
**Zhang 2024 的实测数据里就有 `(−0.503, 0.781, 0.797)` 这类点 —— 模长 1.224 > 1。**

**⭐ 39 个实测点的模长数据（见 §3.8）给出了判据：**

```
越界的 5 个点【全部】来自硬件/工程谱系（Zhang 2024 的 3 个 + Wen 2021 转引的 2 个）
Chen 2018 谱系的 24 个点【全部】在单位球内，max = 0.977（几乎触顶未破）

→ 球体约定与 Russell→Chen 谱系天然兼容；立方体约定是硬件侧的选择。
```

**⭐ 要问设定者的：**
1. **大肥鱼用球体还是立方体？**
   - 球体：方向与强度严格可分离（`μ = λ·γ`），但**排除了"三维同时拉满"的状态**
   - 立方体：允许各维独立拉满，但**强度不能定义为单一的径向距离**（会随方向变化）
2. **若坚持球体**：最大实测模长 1.15（Zhang）/ 0.977（Chen）意味着
   **要么球面半径不是 1，要么这些文献的状态空间与本项目不同层**。

---

## 六、待裁定清单（更新版）

> 全部已并入 issue **#31【总待办】**，此处只列新增项。

| 新 # | 问题 | 来源 |
|---|---|---|
| **N1** | **几何形状**：球体 / 立方体？若球体，半径是多少？ | §五（Russell 圆盘 / Peña+Zhang 立方体 / 本项目球体） |
| **N2** | **「原点」是几何原点还是人格默认点？** MVS 说角色停在人格点，不是中心 | §3.5 |
| **N3** | **衰减：要式(4)（永不衰减）还是式(6)（衰减到人格位置）？** | §3.5 —— 这是 A1 的精化版 |
| **N4** | **人格调制要不要用 Mehrabian 的 70/30 先验？** | §3.4 |
| **N5** | **人格层用 arousability 还是 arousal？**（二者不同构） | §4.3 |
| **N6** | **D 轴的理论代价是否接受？** | §4.2 |
| **N7** | **Surprise 归高唤醒（Wen+Russell）还是低唤醒（Xu）？** | §4.4 |
| **N8** | **要不要补 Docile 那一族？**（连 Mehrabian 都没测到） | §3.6 |
| **N9** | 覆盖粒的实测取值用 mti 表 8 吗？（**需先做 `v' = (v−4)/3` 中心化换算**） | mti 2026 |

---

## 七、复现

```bash
# 批量抽取（两个抽取器一起用）
py -3 batch-papers.py "E:\dsh\character-style" out/papers --dpi 120
#   产出：out/papers/<stem>.txt（纯文本）
#         out/papers/<stem>/page-NN.txt（坐标重建） + page-NN.png（渲染，公式必看这个）
# 单篇：
py -3 scripts/pdf-extract.py        "papers/X.pdf" X.txt        # 纯文本（公式会碎）
py -3 scripts/pdf-formula-extract.py "papers/X.pdf" out/X        # 坐标重建 + 渲染 PNG
```

**⭐ 最强校验组合**：原始 PDF 在场时，用 **PyMuPDF `rawdict` 取字符级坐标 + 300dpi 局部放大图**交叉核对，
比只看渲染 PNG 更可靠（田智行 2021 那篇靠这一步纠正了三处致命碎片）。

---

## 八、完成情况

**全部 15 份已处理完毕，11 篇出报告（1 篇判为错配）。**

| 文件 | 状态 |
|---|---|
| `ap2024143_341134453.pdf` | ✅ |
| `Hatice Gunes2013.pdf` | ✅ |
| `finalversion.pdf`（Xu 2023） | ✅ |
| `JOC2901-09.pdf`（Chen 2018） | ✅ |
| `2106.pdf`（Wen 2021） | ✅ |
| `russell1980.pdf` | ✅ |
| `mehrabian1991.pdf` | ✅ |
| `EvidenceforaThree-factorTheory.pdf`（R&M 1977） | ✅ **本源文献** |
| `ND_PAD_manuscript.pdf`（Zhang 2024） | ✅ |
| `mti-10-00038-v2.pdf`（Duan 2026） | ✅ |
| `viewcontent.pdf`（田智行 2021） | ✅ |
| `978-0-387-87685-6_18.pdf`（Gao 2008） | ✅ |
| `10.1007@978-3-642-24603-619.pdf`（Peña 2011） | ✅ |
| `pkpadmin,+…JSMS0601Hall.pdf`（Hall 2017） | ✅ |
| ~~`noller1980.pdf`~~ | ❌ **错配**：婚姻非言语沟通，全文不涉 PAD |

### ⚠️ 文本层陷阱汇总（供后续引用避坑）

| 文献 | 陷阱 |
|---|---|
| R&M 1977 | Table 1/2/3/4 全被打散错位；Table 1 的 "R2" **不是决定系数**，是单位权重方程的多重相关 |
| Chen 2018 | Granule 那套公式必须看图 |
| Gao 2008 | §2.2–§3 公式区碎片化；`ǻ` = Δ、`'` = Δ |
| Hall 2017 | 疑似"公式页 25/26"实为人口统计表；真数值在图 1/图 2 |
| mti 2026 | 疑似"公式页 23/24"无公式；真公式页是 11/12/13/19/20/21 |
| 田智行 2021 | 式(7) 实为 `(1+t)^t`，极易误读成 `(1+1/t)^t`；式(5) 的 A₁ 分母下限是 `k=n₁+1`；式(14) 人格分量序是 **Ex,Ag,Ne,Op,Co**，按 OCEAN 序代入会整体错位 |
| noller1980 | Table 9 相关系数**不是** PAD 维度相关，勿张冠李戴 |
| mehrabian1991 | `jearjul` = fearful（OCR 破损）；Docile 行丢失 |

### ⚠️ 原文自身的矛盾/笔误（照实记录，不替作者修正）

| 文献 | 问题 |
|---|---|
| R&M 1977 | 同页 P–A 先写 .03 后写 .04 |
| Gao 2008 | (3.2) 印刷为 `ΔE_t`，按语义应为 `ΔE*_t`；p.146 图号 4.3/4.4 互换重复；"t = 60" 疑为 600 |
| mti 2026 | 式(3) 常数项 0.930 vs 表 7 的 0.093；式(14) 标签与内容错位；`L_IeCL` 大小写不一致 |
| Zhang 2024 | p.4 称 fear 在"第六象限"、anger 在"第二象限"，与 Table 7 实测不符；Meek 与 Sad 极性组合相同 |
| Hall 2017 | `Relaxed` 在 pleasure 与 arousal 子量表各出现一次（题项重叠）；χ²/df = 10.82、RMSEA = .10 按通行标准属拟合不佳 |
| 田智行 2021 | 式(1) 右端下标重复；式(9) 两个连乘符号不一致；C 矩阵行标注不统一 |
