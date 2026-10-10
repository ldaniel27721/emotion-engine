# PAD 映射规格

> **方法来源**：Xu, W., Yao, Z., He, D. and Cao, L. (2023).
> *Understanding online review helpfulness: a pleasure-arousal-dominance (PAD) model perspective.*
> Aslib Journal of Information Management · DOI 见 `papers/finalversion.pdf`
> **文件**：`papers/finalversion.pdf`（22 页）· 抽取 → `papers/finalversion.txt`
> **落盘**：2026-10-10

**为什么用它**：这是找到的第一份**把中文情绪词映射到 PAD 空间、并给出完整可计算公式**的文献。
它提供的不是理论主张，而是**可直接实现的算法**。

---

## 一、公式（**论文原文**）

### 1.1 单个情绪词

> the PAD vector of the emotion word is calculated by **the product of its emotion intensity
> factor and PAD reference vector, i.e. `λ * γ`**, with the value of each component between
> −1 and 1.

```
μ(w) = λ(w) · γ(w)
```

| 符号 | 含义 | 取值 |
|---|---|---|
| **γ(w)** | **参考向量** —— 该词所属 PAD 八型的单位向量 | 三分量各取 **+1 或 −1**，八型共用 |
| **λ(w)** | **情绪强度因子** = 原始强度缩放后的**绝对值** | 原始 (−9,9) → 缩放 (−1,1)，取 abs |

> 原文：「the same type of PAD emotion has the **same unit vector**, but their specific
> **intensity values** in the three dimensions … may be different.」

### 1.2 一篇文本（含否定词与程度副词）

```
                  n
    μ(s) = (1/n) · Σ  (−1)^tj · weigh_j · λ(wj) · γ(wj)          (1)
                 j=1
```

| 符号 | 含义 |
|---|---|
| `n` | 文本中情绪词个数 |
| `λ(wj)` | 第 j 个词的强度因子 |
| `weigh_j` | 程度副词的**累计权重**；无程度副词时 = 1 |
| `t_j` | 第 j 个词前的**否定词个数**（`(−1)^tj` 实现极性翻转） |

**另有两条派生量**：
- **emotion diversity** = 文本中出现过的 **γ 类型数**（0–8，再标准化到 0–1）
- **emotion deviation** = 该文本整体情感倾向 与 公众平均倾向之差

---

## 二、八型参考向量（**论文 Table 2，逐字重建**）

| PAD 类型 | γ | 对应 EMO_LEXION 类目 |
|---|---|---|
| **Exuberant** | ( +1, +1, +1 ) | Happiness (PA), Love (PB), Praise (PH) |
| **Dependent** | ( +1, +1, −1 ) | Respect (PD), Trust (PG), Thinking (PF) |
| **Relaxed** | ( +1, −1, +1 ) | Wish (PK), Surprise (PC) |
| **Docile** | ( +1, −1, −1 ) | Ease (PE) |
| **Hostile** | ( −1, +1, +1 ) | Reproach (NN), Anger (NA) |
| **Anxious** | ( −1, +1, −1 ) | Panic (NI), Fear (NC) |
| **Disdainful** | ( −1, −1, +1 ) | Hate (ND), Jealousy (NK), Suspect (NL), Disappointment (NJ) |
| **Bored** | ( −1, −1, −1 ) | Sadness (NB), Guilt (NH), Shame (NG), Boredom (NE) |

译文（原文脚注）：Pleasure = 愉悦程度；Arousal = 唤醒程度；Dominance = 支配／掌控感。

---

## 三、⭐ 这条公式与「情绪动力学」的关系

> ⚠️ 本节以下**全部是助手的分析**，不是论文主张，也**不是设定者的裁定**。

### 3.1 它就是你裁定的球体模型

| 论文 | 情绪动力学（设定者 2026-10-10 01:18 裁定） |
|---|---|
| `μ = λ · γ`，γ 是**单位方向向量**，λ 是**标量强度** | 强度 = **到原点的径向距离**（球体模型），与方向正交 |
| 「each component between −1 and 1」→ **球面半径 1** | 「球面的表面 = 强度的极致」 |

**`μ = λ·γ` 正是极坐标形式**：λ 是半径、γ 是单位方向。
两者在数学上**同构**，且球面半径都被定为 1。

### 3.2 ⭐ 它调和了 Gunes (2013) 带来的冲突

上一轮从 Gunes & Schuller (2013) 读到的说法是：
> arousal, valence and power dimensions have been **assumed to be independent**…
> **Dietz and Lang reported that these emotion dimensions are correlated**.

与本设定的「强度与方向**正交**」看似矛盾。**在这篇的形式化下并不矛盾：**

```
方向上   γ 的三个分量【同时】取正负 —— 只有 8 种组合，不存在任意搭配
         → 这就是 Gunes 说的"维与维相关"（方向分量之间有联动）
强度上   λ 是【单独一个标量】，与 γ 分离
         → 这就是本设定的"径向距离"，与方向正交

∴ 「强度与方向正交」在此形式化下成立；
   Gunes 的"相关"指的是【方向分量之间】的相关，不是【强度与方向】的相关。
```

**→ 两者说的不是同一件事。冲突不成立。**

### 3.3 ⚠️ 但 λ 没有来源

论文的 λ 来自 **EMO_LEXION**（一个带 1/3/5/7/9 五级强度的中文情绪词典）。
**本仓库没有这个词典**，所以 λ 目前**无法计算**。

**本次采用 λ = 1（纯方向版本）**：所有词只定位到所属八型的**角点**，不区分同类词内部的强度差。

**⭐ 而「λ 从哪来」恰好就是待裁定项 —— 强度如何离散成档。**
两者是同一个问题的两面：
- 若 λ 由**外部词典**提供 → 需要引入或构建一份带强度的中文情绪词典
- 若 λ 由**设定者按直觉分档** → 那就是「1–10 七档滑动区间」要解决的
- 若 λ 由**上下文动态计算** → 那就回到「强度不能纯由间隔算出」那条缝

---

## 四、映射结果（λ = 1）

**605 词 → 432 词（71.4%）自动落到八型。**

| 八型 | γ | 词数 | 例 |
|---|---|---:|---|
| Exuberant | (+,+,+) | 115 | 喜悦、欢欣、愉悦、畅快、欣喜 |
| Bored | (−,−,−) | 104 | 心碎、忧郁、失落、沮丧、绝望 |
| Anxious | (−,+,−) | 77 | 胆怯、惊恐、焦虑、畏惧、恐慌 |
| Relaxed | (+,−,+) | 56 | 震惊、愕然、诧异、错愕、意外 |
| Hostile | (−,+,+) | 55 | 恼火、暴怒、愤恨、敌意、烦躁 |
| Disdainful | (−,−,+) | 25 | 恶心、嫌弃、鄙夷、作呕、抵触 |
| **Dependent** | (+,+,−) | **0** | — |
| **Docile** | (+,−,−) | **0** | — |

未映射 **173 词**（所在子类正负混杂）：自我评价类 75 · 中性情绪 33 · 目标相关情绪 25 ·
生理反应 14 · 社交场景 12 · 人际互动类 8 · 中文特有 3 · 西方特有 3。

### ⚠️ 两个必须报的异常

**① 骨架只覆盖了 8 个象限中的 6 个。**
`Dependent (+,+,−)` 与 `Docile (+,−,−)` **一个词都没有**。
论文里它们分别对应 `Respect / Trust / Thinking` 与 `Ease` —— 都是**「高愉悦 + 低支配」**那一族
（被安抚、被照顾、放心的状态）。**大肥鱼的骨架目前没有这一类词。**

**② 论文把 `Surprise` 归到 `Relaxed (+,−,+)` —— 即【低唤醒】。**
这在本仓库的分类下会造成「震惊、愕然、错愕」全部落到低唤醒象限，**语义上明显不对**
（惊讶按常理是高唤醒）。**本次照论文原样落，未自行更正 —— 作为异常报出，待裁定。**

---

## 五、待裁定

1. **λ 从哪来？**（见 §3.3 三条路）—— 与「强度如何离散成档」是同一问题
2. **§二 的类目 → 八型映射，是否照搬论文？** 尤其是 `Surprise → Relaxed` 这条
3. **未映射的 173 词（7 个子类）如何逐词定位？**
4. **要不要补 `Dependent` / `Docile` 那一族的词？**（高愉悦 + 低支配：安心、被保护、放心…）
5. **三、中性情绪要不要显式定为「原点附近（λ ≈ 0）」？**
   若定，则「中性」与「底情绪 = 原点」的关系需要说清。

---

## 六、复现

```bash
py -3 scripts/pdf-extract.py "papers/finalversion.pdf" finalversion.txt
node scripts/pad-map.js 1        # 参数为 λ，默认 1
```
