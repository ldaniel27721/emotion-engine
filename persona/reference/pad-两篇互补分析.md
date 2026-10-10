# PAD 两篇互补分析：Xu (2023) × Chen & Cui (2018)

> **A** = Xu, Yao, He & Cao (2023). *Understanding online review helpfulness: a PAD model perspective.*
> Aslib Journal of Information Management · `papers/finalversion.pdf`
> **B** = Chen, Y. & Cui, Y. (2018). *Describing the Emotional Model of PAD Based on Consistent Covering Granule.*
> Journal of Computers 29(1):99–111 · DOI `10.3966/199115992018012901009` · `papers/JOC2901-09.pdf`
> **分析时间**：2026-10-10 · 工具：`scripts/pdf-extract.py` + `scripts/chen24.js`

---

## 一、结论一句话

**A 给的是「函数形式」，B 给的是「函数在该空间里的实测落点」。**
**A 单独用不了（γ 只有 ±1，λ 没有来源）；B 单独也只是 24 个散点（无公式、无法推广）。合起来才是完整的「每个情绪应到什么位置」。**

---

## 二、互补对照

| 维度 | **A · Xu 2023** | **B · Chen 2018** | 合起来 |
|---|---|---|---|
| **公式** | ✅ `μ = λ·γ`，含否定词/程度副词修正 | ❌ 无 | **有形式** |
| **γ 的精度** | ⚠️ 只到**八型角点** (±1,±1,±1)，同型词全挤在角上 | ✅ **真实方向**，如 `angry` γ=(−0.623, 0.720, 0.305) | **可用真实方向** |
| **λ 的取值** | ❌ 需 EMO_LEXION，本仓库没有 | ✅ **坐标模长即 λ** | **λ 有来源了** |
| **象限覆盖** | 6/8（大肥鱼骨架所及） | ✅ **8/8 全覆盖** | **补全** |
| **复合情绪** | ❌ 描述不了 | ✅ **一致覆盖粒**（consistent covering granule） | **有解** |
| **不确定性** | ❌ 无 | ✅ **certainty / likelihood** 两个量 | **有解** |

### B 的解题思路（原文）

**B 自己先列出了 PAD 的四个缺陷**（L90–101），其中两条**正是大肥鱼骨架撞到的**：

> (2) The emotions are compound and delicate, which are comprised by more than two basic
> emotions while **the PAD model fails to describe the compound emotions** above.
> (3) The PAD model **cannot reflect the relationship among emotions accurately** due to the
> fact that there are differences when one emotion transfers from another…

**B 的解法**：把 PAD 空间当作论域，用**一致覆盖粒**覆盖其中的情绪点，
并给出 **certainty（确定性）** 与 **likelihood（似然性）** 两个量 ——
**「落在两型之间」的情绪因此可以描述了。** 这正是大肥鱼骨架里那 **173 个未映射词**需要的。

---

## 三、B 的 Table 1：24 个真实点（逐字）

| # | 情绪 | P | A | D | λ（模长） | 象限 |
|---:|---|---:|---:|---:|---:|---|
| 1 | admiration | 0.50 | 0.30 | −0.20 | 0.616 | **Dependent** |
| 2 | angry | −0.51 | 0.59 | 0.25 | 0.819 | Hostile |
| 3 | disgust | −0.40 | 0.20 | 0.10 | 0.458 | Hostile |
| 4 | disappoint | −0.30 | 0.10 | −0.40 | 0.510 | **Anxious** |
| 5 | pain | −0.40 | −0.20 | −0.50 | 0.671 | Bored |
| 6 | afraid | −0.64 | 0.60 | −0.43 | **0.977** | Anxious |
| 7 | fear | −0.50 | 0.30 | −0.70 | 0.911 | Anxious |
| 8 | gloat | 0.30 | −0.30 | −0.10 | 0.436 | **Docile** |
| 9 | satisfaction | 0.60 | 0.50 | 0.40 | 0.877 | Exuberant |
| 10 | grateful | 0.40 | 0.20 | −0.30 | 0.539 | **Dependent** |
| 11 | happy | 0.40 | 0.20 | 0.20 | 0.490 | Exuberant |
| 12 | hate | −0.60 | 0.60 | 0.30 | 0.900 | **Hostile** |
| 13 | hope | 0.20 | 0.20 | −0.10 | **0.300** | **Dependent** |
| 14 | delight | 0.40 | 0.20 | 0.10 | 0.458 | Exuberant |
| 15 | like | 0.40 | 0.16 | −0.24 | 0.493 | **Dependent** |
| 16 | love | 0.30 | 0.10 | 0.20 | 0.374 | Exuberant |
| 17 | sympathy | −0.40 | −0.20 | −0.50 | 0.671 | Bored |
| 18 | arrogance | 0.40 | 0.30 | 0.30 | 0.583 | Exuberant |
| 19 | relaxed | 0.20 | −0.30 | 0.40 | 0.539 | Relaxed |
| 20 | remorse | −0.30 | 0.10 | −0.60 | 0.678 | Anxious |
| 21 | reproach | −0.30 | −0.10 | 0.40 | 0.510 | **Disdainful** |
| 22 | resentment | −0.20 | −0.30 | −0.20 | 0.412 | Bored |
| 23 | contentment | 0.30 | −0.20 | 0.40 | 0.539 | Relaxed |
| 24 | shame | −0.30 | 0.10 | −0.60 | 0.678 | **Anxious** |

**八型分布**：Anxious 5 · Exuberant 5 · **Dependent 4** · Hostile 3 · Bored 3 · Relaxed 2 · **Docile 1** · Disdainful 1
→ **八个象限全部覆盖到了。**

---

## 四、⭐ B 补上了大肥鱼骨架缺的两个象限

| 缺失象限 | B 里的词 | 语义 |
|---|---|---|
| **Dependent (+,+,−)** | admiration、grateful、hope、like | **高愉悦 + 高唤醒 + 低支配** —— 仰慕、感激、期望、喜欢 |
| **Docile (+,−,−)** | gloat | 高愉悦 + 低唤醒 + 低支配 |

**「高愉悦 + 低支配」这一族 = 被安抚、被照顾、依靠、放心的状态。**
大肥鱼骨架目前**一个词都没有** —— 而它正是「傲娇被顺毛之后」最该有的那一族。

---

## 五、⚠️ 两篇的 4 处归属冲突（**交设定者定夺**）

**这不是我解析出的噪声，是两篇文献对同一个词的象限判断不一致：**

| 情绪 | **A(Xu) 的 γ** | **B(Chen) 的坐标推得** | B 的坐标 |
|---|---|---|---|
| `disappoint` | Disdainful (−,−,+) | **Anxious** (−,+,−) | (−0.3, 0.1, −0.4) |
| `hate` | Disdainful (−,−,+) | **Hostile** (−,+,+) | (−0.6, 0.6, 0.3) |
| `reproach` | Hostile (−,+,+) | **Disdainful** (−,−,+) | (−0.3, −0.1, 0.4) |
| `shame` | Bored (−,−,−) | **Anxious** (−,+,−) | (−0.3, 0.1, −0.6) |

**⭐ 注意 `hate` 与 `reproach` 是【对调】的**：
A 说 hate=Disdainful / reproach=Hostile；B 说 hate=Hostile / reproach=Disdainful。
**两者互为镜像，必有一方错，或两者对这两个词的定义不同。**

### 助手倾向（**是推测，不是裁定**）

- `hate`（恨）→ 语义上 **Hostile** 更合理（恨是强势的、带攻击性的），**B 对**。
- `reproach`（责备）→ 责备是**居高临下的轻蔑**，**Disdainful 更合理**，**B 对**。
- `shame`（羞愧）→ 羞愧是**低唤醒的自我贬抑**，**B 把它归 Anxious 反而可疑**（A 的 Bored 更贴）。
- `disappoint`（失望）→ 失望是**低唤醒的消极**，**B 的 Anxious 可疑**（A 的 Disdainful 也未必对）。

**即：4 处里助手的推测是「前两处 B 对、后两处 A 对」—— 但这是猜，须裁定。**

---

## 六、⚠️ B 的数据里两处可疑的重复

| 词对 | 坐标 | 问题 |
|---|---|---|
| `pain` / `sympathy` | 两者都是 (−0.4, −0.2, −0.5) | **完全相同** —— 痛苦与同情同点？疑为录入重复 |
| `remorse` / `shame` | 两者都是 (−0.3, 0.1, −0.6) | **完全相同** —— 悔恨与羞愧同点？疑为录入重复 |

**若这两处是录入疏忽，则 24 点实际只有 22 个独立点。** 请核对原表。

---

## 七、🔴 最大的一个：λ 的实测范围挑战「球面 = 强度极致」

**B 的 24 个点，λ 从 0.300 到 0.977，中位 0.539，一个都没到 1。**

| 读法 | 含义 | 后果 |
|---|---|---|
| **(a) 球面是理论上限，现实到不了** | 「球面 = 极致」成立，只是没有情绪能达到 | 设定不动，但 **λ 的实用上限要另行规定** |
| **(b) 球面半径应该缩小** | 实测最大 0.977 → 球面半径约 ≈0.98？或按中位 0.54？ | **要改设定的球体半径** |
| **(c) B 的坐标本身就不是「极致强度」的样本** | 24 个词是**典型情绪**，不是**极端情绪** | 设定不动，但需要**极端情绪的坐标**才能验证球面 |

**⭐ 助手倾向 (c)** —— B 的 24 词都是**日常典型情绪**（admiration、hope、love…），
本来就不该贴着球面。**但没有极端情绪的坐标就无法验证，这是数据缺口，不是我推理能补的。**

**→ 交设定者定夺。**

---

## 八、可立即落地的增强

**用 B 的真实方向替换 A 的角点方向：**

```
原先（A 的纯方向版）：大肥鱼词表里所有「愤怒」词 → γ = (−1, +1, +1)
现在（B 的真实方向）：           所有「愤怒」词 → γ = angry 的方向 = (−0.623, 0.720, 0.305)
```

**这会把 8 个角点细化成 8 条真实方向，同型词之间不再全部重叠。**
**代价**：一个 PAD 型只有一个方向，仍无法区分同型词内部的强度差 —— **那仍需 λ。**

---

## 九、待裁定汇总

1. **§五 的 4 处冲突** —— 采信 A 还是 B？（助手推测：hate/reproach 依 B，shame/disappoint 依 A）
2. **§六 的两处重复** —— 是录入疏忽吗？24 点还是 22 点？
3. **§七 的球面问题** —— (a) 理论上限 / (b) 缩小半径 / (c) 缺极端情绪样本？
4. **要不要用 B 的真实方向替换 A 的角点方向？**（§八）
5. **要不要补 Dependent / Docile 那一族的词？**（B 给了 5 个可作种子：admiration、grateful、hope、like、gloat）
6. **要不要引入 B 的「一致覆盖粒」来处理那 173 个复合/非典型情绪词？**

---

## 十、复现

```bash
py -3 scripts/pdf-extract.py "papers/JOC2901-09.pdf" joc2901.txt
node scripts/chen24.js
```
