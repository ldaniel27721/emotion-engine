# LLM 情绪对话 三篇 — 分析

> **阅读范围**：`E:\dsh\character-style\` 下三份 PDF 全文（由 `pdf-extract.py` 抽取为 txt）
> **抽取产物**：`E:\dsh\tmp-moe\papers4\{emochat,genagents,nihms2194640}.txt`
> **页码约定**：EmoChat 的 PDF 第 1 页是 ResearchGate 封面，正文在 PDF 第 2–10 页，印刷页码 213–221。
> 引用一律标 **PDF 页 / 印刷页**。genagents 与 nihms 标 PDF 页（无印刷页码，nihms 另有 `Mote et al. Page N` 稿页号）。
> **标记约定**：【原文】= 论文原话或直接数字；【推断】= 我基于原文的判断，论文没说。

---

## 〇、先给结论（执行摘要）

1. **⚠️ 选题预期与实际有重要偏差，必须先说**：三篇里**只有一篇（EmoChat）是"AI 做情绪对话"**，而它**不是 LLM 工作**（2019 年，CNN + TextCNN + HMM），且**它并不生成情绪回应**——它是一个**情绪识别器**，把识别到的情绪标签贴在人类互发的消息上，让**人对人**聊天时互相看见情绪。它没有生成模型、没有策略、没有回应质量评估。
2. **第二篇（genagents）是真正的 LLM 工作**，但它的目标是**用 LLM agent 做心理健康因果实验**（模拟环境压力 → 症状轨迹），不是做陪伴型对话。它的"角色设定→行为"映射和"LLM-as-judge 对话行为编码"是**可直接借用**的。
3. **第三篇（nihms-2194640）与"LLM 情绪对话"完全无关**，不是 LLM 工作、不是对话系统、不是预印本——是 NIH 作者稿件库版的一篇**人类临床试验二次分析**（精神分裂症患者 EMA 情绪与社交动机）。它对我们有用，但**作用是"给我们引擎的参数和假设提供人类实证基线"**，比如亲密关系、PA/NA 不对称、情绪自报的缺失率。
4. **对我们最有价值的单点**：EmoChat 用**人类对话日志估出的一阶情绪转移矩阵 A**，以及"**AI 只靠文字会漂移、加上下文才稳住（+5~7 个点）**"这条量化结论——这正好是 A2 里 ρ 项存在的实证理由和标定来源。
5. **最大的负面信号**：EmoChat 的**情绪类别识别只有 51.64%**（7 类），负面情绪（anger/sad）反而识别得好，而**中性类因为有上下文反而被污染**；genagents 自陈"神经质可能只是提示层先验"。两篇都在同一个地方警戒：**用 LLM/分类器测情绪，很容易测到的是"措辞风格"而不是"内部状态"**。

---

## 一、三篇各讲什么

### 1. EmoChat（PDF 1–10 页 = 印刷 213–221）
- **全称**：*EmoChat: Bringing Multimodal Emotion Detection to Mobile Conversation*
- **出处**：2019 5th International Conference on Big Data Computing and Communications (BIGCOM)，DOI 10.1109/BIGCOM.2019.00037；清华软件学院 + BNRist，作者 Luyao Chong / Meng Jin / Yuan He。
- **一句话**：一个手机聊天 App，利用**前置摄像头拍到的表情 + 输入的文字**，联合识别发送者**当下**的情绪，把情绪标签和置信度**贴在消息上发给对方**。
- **技术栈**：mini-Xception（表情，CNN）+ TextCNN（文本）+ **信息熵加权的多模态融合** + **HMM 上下文修正**（Viterbi）。
- **卖点**：不需要额外硬件、能在手机上跑，**端到端延迟 < 50ms**。
- 【原文·PDF 4/印刷 215】"This motivates a simple vision: Can we build machines that automatically sense our emotions during online communication?"
- ⚠️ **它不生成对话**。【原文·PDF 10/印刷 221】结尾只是说"本文的情感识别算法**也有助于**智能聊天机器人，使它们更感性、更人性化"——那是 future work，不是本文做的事。

### 2. LLM-Based Generative Agents（PDF 1–20 页）
- **全称**：*LLM-Based Generative Agents Simulate Mental-Health Trajectories Under Adverse Socio-Environmental Conditions*
- **形态**：**Research Square 预印本**，Posted Date April 28th, 2026，DOI 10.21203/rs.3.rs-9291631/v1，License CC BY 4.0，单作者 Joseph Kambeitz（University Hospital Cologne）。
- **一句话**：把 Park et al. 2023 的生成式 agent 框架搬进精神病学研究——25 个 agent 在虚拟小镇生活 5 天，第 4 天给 6 个 agent 注入**量身定制的负面生活事件**，用 **PHQ-9 / K10 临床量表**追踪症状变化，验证"压力–易感性"模型。
- **核心设计**：**反事实分支**——从第 3 天同一世界状态 fork 出低/中/高神经质三个平行分支，注入**完全相同**的负面事件，看症状轨迹差异。
- **结果**：暴露组 PHQ-9/K10 显著上升且持续；神经质显著调节（PHQ-9 χ²(2)=32.13, p<0.001, marginal R²=0.195；K10 χ²(2)=52.5, p<0.001, marginal R²=0.367）；并且**对话行为**也呈剂量–反应（高神经质 vs 低神经质：披露个人困难 27.3% vs 14.8%，表达负面情绪 28.8% vs 13.1%）。
- **代码开源**：`https://github.com/kambeitzlab/psyagent`（【原文·PDF 14】"open-source toolbox (psyagent)"，含 agent 配置、prompt 模板、仿真日志）。

### 3. nihms-2194640（PDF 1–17 页）
- **全称**：*Positive affect during social interactions predicts goal progress and social motivation in daily life for people with schizophrenia*
- **作者/出处**：Jasmine Mote, David E. Gard, Kim T. Mueser, Daniel Fulford；`Schizophr Res. 2026 October; 296: 54–59. doi:10.1016/j.schres.2026.07.005`，HHS Public Access / Author manuscript，PMC 2026 July 21。
- **形态判定**：【原文·PDF 1】"This is a PDF file of an **unedited manuscript that has been accepted for publication**"——**不是预印本**，是已被期刊接收、在 PMC 上提前公开的**作者稿件**（NIHMS = NIH Manuscript Submission）。所以它已经是同行评审过的正式论文，只是排版未定。
- **一句话**：30 名精神分裂症谱系患者参加一个 60 天的手机 App 社交动机干预（MASS），每天 2 次 EMA，研究"最近一次社交互动中体验到的正/负情绪"能否预测社交目标进展与动机。
- **结论**：只有 **正情绪（PA）** 预测目标进展与动机，**负情绪（NA）不预测**。【原文·PDF 7】"only PA (not NA) predicted social goal progress and motivation"。
- ⚠️ **与标题不符**：标题里没有 LLM，正文里也没有 LLM、没有对话系统、没有 AI 生成。这三篇被放在"用 LLM 做情绪/心理健康对话"这个框里，**只有 genagents 一篇名副其实，EmoChat 只能算半个（情绪识别+聊天场景，非 LLM），nihms 完全不沾**。

---

## 二、⭐ EmoChat 的情绪建模方法

### 2.1 情绪状态怎么表示：**离散隐状态，不是连续空间**

【原文·PDF 6/印刷 217】问题定义：给定观测序列 `S = {(f1,t1), (f2,t2), ..., (fT,tT)}` 与可能情绪状态集合 `C = {c1, c2, ..., cN}`，求 `(fT,tT)` 最可能的状态 `cj`。

**两套标签体系**（【原文·PDF 6/印刷 217】"There are two different standards to classify emotions"）：

| 体系 | 集合 | 名称 |
|---|---|---|
| C1 | {positive, negative} | emotion **polarity** recognition（极性） |
| C2 | {angry, disgust, fear, happy, sad, surprise, neutral} | emotion **category** recognition（类别） |

【原文·PDF 5/印刷 216】"the first six emotion categories is in accordance with Ekman's six basic emotions theory, and neutral means the emotional status of the user is quite calm"。

⭐ **关键判断**：EmoChat 的情绪状态**就是 0/1 分类或 7 选 1**。**没有强度（intensity）、没有效价/唤醒以外的维度、没有连续空间、没有情绪点、没有衰减系数**。它跟我们的 PAD 三维 + `r = ‖E−μ‖` 是**范式级不同**：我们是**连续状态 + 动力学**，它是**离散隐状态 + 转移概率**。

【推断】这一点对我们既是坏消息也是好消息。坏消息：它不能直接告诉我们"强度怎么建模"。好消息：它证明了**在真实聊天里，离散 7 类的识别率只有 51.64%**（见 §7），反过来说明"把情绪压成类别标签"这条路本身信息损失很大——我们保留连续强度是可辩护的。

### 2.2 三段式流水线

**Stage 1 — 双模态独立分类**（【原文·PDF 6/印刷 217】）：
- 表情：Android API 取人脸区域 → **mini-Xception**（fer2013 预训练 + 自采数据微调）
- 文本：**TextCNN**（NLP&CC 2013 预训练 + 自采数据微调）
- 输出：`P(cj|fT)` 与 `P(cj|tT)`

**Stage 2 — 信息熵加权融合**（【原文·PDF 6–7/印刷 217–218】）：

```
Hf(X) = −Σ_j P(cj|fT) log P(cj|fT)          (2)  表情结果的信息熵
Ht(X) = −Σ_j P(cj|tT) log P(cj|tT)          (3)  文本结果的信息熵

Wf = Ht(X) / (Hf(X) + Ht(X))                (4)  熵越小 → 权重越大（取倒数思想）
Wt = Hf(X) / (Hf(X) + Ht(X))                (5)

P(cj|fT,tT) = Wf·P(cj|fT) + Wt·P(cj|tT)     (6)  融合概率
```

⭐ 这是全文对我们**最有借鉴价值的一个公式**。它做的事是：**"哪一路更确信，就更多听哪一路"**，而且不需要训练权重、不需要超参。**这是"按置信度调制更新幅度"的教科书级轻量实现**。

**Stage 3 — HMM 上下文修正**（【原文·PDF 7–8/印刷 218–219】）：

情绪状态 = **隐状态**，`(表情, 文字)` 对 = **观测**：

- 状态转移矩阵：`A = [aij]`, `aij = P(ht+1 = qj | ht = qi)`，**从 20 名志愿者标注的真实对话日志里统计得到**：
```
aij = nij / Σ_j nij        (10)   # nij = 从状态 i 转到状态 j 的计数
```
- 初始分布：`πi = mi / Σi mi`（mi = 状态 i 出现次数）  (11)
- 发射概率：由 Stage 2 的融合概率反推
```
P(fk,tk|cj) = P(cj|fk,tk)·P(fk,tk) / P(cj)     (12)
bjk = P(cj|fk,tk) / πj                          (13)
```
- 解码：**Viterbi** 求最优隐状态序列。

⭐ **上下文窗口 = 30 分钟**：【原文·PDF 7/印刷 218】"we empirically select 30 minutes as a threshold to pick out the context information of the current sentence. That is, if the time interval between (fi,ti) and (fT,tT) is within 30 minutes, then (fi,ti) is considered as the context information"。

### 2.3 多轮情绪一致性怎么保持：**靠 HMM，不靠记忆**

【原文·PDF 5/印刷 216】动机写得很直白："people's inner emotion usually changes gradually. So, people usually keep a certain emotion state for several minutes to several hours before changing to another emotion state. In addition, the transition probability between different emotion is quite different. For example, the emotion sequence {disgust, angry, sad} obviously exhibit higher likelihood than the emotion sequence {disgust, happy, sad}. So, instead of considering each emotion in isolation, we should treat each emotion in the context of its predecessors in the time series."

⭐ 这是**唯一一篇真正讨论并量化"多轮情绪一致性"的**，做法是把一致性写成一个**显式一阶马尔可夫先验**。详见 §6。

【推断】它和我们 A2 的 `E_t = μ + ρ(E_{t−1}−μ) + g·h(n)·ΔE` 是**同一个思想的两种参数化**：
- EmoChat：`P(h_t | h_{t−1})` = **一阶马尔可夫转移矩阵 A**（学到的人类数据）
- 我们：`ρ(E_{t−1}−μ)` = **一阶自回归系数 ρ**（单一标量）

差异是：它把一个**矩阵**（N×N，7×7 或 2×2）塞进模型，我们把一个**标量**放进模型。**它用矩阵，我们丢掉了"情绪之间的方向性"**——比如"disgust→angry 比 disgust→happy 更可能"这种**非对称、有方向**的信息，一个标量 ρ 表达不了。

### 2.4 一个可直接落地的细节：融合权重 ↔ 我们的 ε

【推断】我们的评价层是 `ΔE = α × ε × signature`，其中 ε 是评价强度/显著性。EmoChat 的 `Wf = Ht/(Hf+Ht)` 本质上也是"**用不确定性调制信息权重**"——熵大（不确定）就少听它。

如果我们的"输入通道"不止一路（比如：文本语义评价 + 用户显式情绪词 + 用户打字节奏/停顿 等多路证据），EmoChat 的式 (4)(5)(6) 可以**原样搬来做多通道融合**，而且不需要额外训练。这是本论文里**成本最低、收益最直接**的一个可借部件。

---

## 三、⭐ LLM 生成式 agent 的模拟方法

### 3.1 角色设定 → 行为 的映射（这是本文的机制主线）

**（1）人格/角色 = 结构化文本档案，启动时载入记忆**

【原文·PDF 9】"Each of the 25 agents was initialised with a unique biographical profile specifying their **name, age, occupation, daily routines, relationships with other agents, and personality traits**. These profiles were stored as structured text files and loaded into each agent's memory at the start of the simulation."

⭐ 这就是"角色设定"的工程形态：**不是一段 persona prompt，而是一份含关系网与日程的结构化文件，进 agent 的 memory**。

**（2）四模块认知架构（继承 Park et al. 2023）**（【原文·PDF 9–10】，⭐ 参数齐全，可直接对照）

| 模块 | 机制 | 关键参数 |
|---|---|---|
| ① memory stream | 所有观察/行动/反思作为**带时间戳**条目，每条附 embedding + 重要性分 | 重要性分由 LLM 打 **1–10** |
| ② retrieval | 三因素加权检索 | **recency 指数衰减因子 0.995** + **importance**（存的分）+ **relevance**（embedding 余弦相似度） |
| ③ reflection | 累计重要性越阈值后**周期性合成高层洞察**，洞察**再写回记忆流** | 阈值 **150 分** |
| ④ planning | 生成层级日程，递归分解为动作 | 粒度约 **5–15 分钟** |

**（3）负面事件怎么注入：走"标准记忆插入通路"，且重要性由角色上下文决定**

【原文·PDF 11】"At the designated time step, the event description was added to the agent's memory stream via the standard memory-insertion pathway. The LLM assigned an **importance (poignancy) score** to each event by **evaluating the event description in the context of the agent's persona**, ensuring that emotional impact was assessed in a **character-specific** manner. ... Events were tagged with keywords (e.g., 'inadequacy,' 'self worth,' 'cognitive distortion,' 'rejection') to facilitate retrieval during future interactions and assessments. A **forced reflection** was triggered approximately 40 seconds (4 time steps) after each adverse event, prompting the agent to generate an introspective entry about their thoughts and feelings."

⭐⭐ **这段是我们最该抄的**：同一个外界事件，**不同角色拿到的重要性分不同**——即**"同一刺激，不同角色的 ΔE 不一样"**。这正是我们评价层 `ΔE = α × ε × signature` 里 `signature`（角色签名/方向）应该干的事。它给出了一个**可运行的实现**：把事件文本 + 角色档案一起喂给 LLM，让 LLM 给 1–10 的重要性分。

【推断】它的 `ΔE` 实现是"LLM 打分"，我们的 `ΔE` 实现是 `α·ε·signature`。**两者是同构的**：EmoChat/我们走解析式，genagents 走 LLM 生成式。可以互为 sanity check。

**（4）人格操纵 = 改文本，不改权重**

【原文·PDF 12】三个分支：
- *Default*：原始 profile
- *High neuroticism*：人格描述**加入**"heightened emotional reactivity, tendency toward worry and rumination, sensitivity to negative events"
- *Low neuroticism*：**加入**"emotional stability, resilience under stress, capacity to maintain equanimity"

⭐ 关键工程细节：【原文·PDF 12】"**all three branches inherited the complete memory state from the shared three-day baseline**, ensuring that any observed differences in post-event mental health scores could be attributed to the personality manipulation rather than divergent experiential histories."

→ **反事实分支法**：从**同一个世界状态** fork，只改一个变量，其余全继承。这是**验证"角色参数是否真的影响行为"的标准做法**——可用来验证我们 A3 的 `μ = (方向, precision)` 是否真的在起作用。

### 3.2 怎么"测量" agent 的心理状态：**把临床量表当问卷问 LLM**

【原文·PDF 12】"To administer these instruments, prompts were constructed that included the agent's **current persona description** along with **contextually relevant memories retrieved via the standard retrieval mechanism** (combining recency, importance, and relevance scores). The agent's **personality traits were included in the prompt** to ensure character-consistent responding. The LLM was then asked to respond to each questionnaire item on the standard response scale. **Responses were parsed and summed** to produce total scores."

- 工具：**PHQ-9**（9 项抑郁症状严重度，Kroenke et al. 2001）+ **K10**（10 项非特异性心理困扰，Kessler et al. 2002）
- 频率：每 12 小时仿真段一次 → 每天 2 次 → **5 天 10 次/量表/agent**
- ⚠️ 这是**自评式（self-report）**测量，而且是**同一个 LLM 生成又打分**。

### 3.3 评估方案：三层

**① 量表轨迹 + 混合效应模型**（【原文·PDF 13】）
- 暴露 vs 未暴露：**Welch t 检验**逐时点
- 轨迹：**线性混合效应模型**（lme4），固定效应 = time、group、time×group，**agent 身份为随机截距**
- 调节：post 分数 ~ 神经质条件 + 基线分，agent 随机截距；**Tukey 校正**事后比较；效应量 = **SMD**（emmeans）
- 逐条目：每一条目单独建模，**FDR 校正**；high-vs-low 的 SMD

**② LLM-as-judge 对话行为编码**（【原文·PDF 13】，⭐ 可复用）

【原文】"Each conversation was **classified by GPT-4.1** for **five behavioural features**: (1) personal difficulty mentioned, (2) negative emotion expressed, (3) support seeking, (4) partner empathy shown, and (5) partner practical help offered. Classification was performed at the **conversation level** using a structured prompt that presented the full conversation text and requested **binary (present/absent)** ratings for each feature. Rates of each feature were compared ... using **Pearson chi-squared** tests and **Fisher's exact** tests, with **phi coefficients and odds ratios** as effect size measures."

⭐⭐ 这五个特征里，**"Partner Empathy Shown" 和 "Partner Practical Help" 就是"情绪回应好不好"的一对可操作化指标**——而且它们是**对 AI 那一侧的回应打的分**，不是对用户打的分。这是我们 §5 里最值得拿走的评估件。

**③ 区分度/构念效度检验（这一招很聪明）**
【原文·PDF 4】"the increase in symptom scores varied depending on which questionnaire item but also depending on the type of adverse event ... suggesting that the present simulations exhibit variability in symptoms depending on the type of adverse events and the type of agent"
【原文·PDF 4】"The fact that the simulation reproduces this **differential sensitivity rather than uniformly inflating all items** provides evidence that manipulating neuroticism leads to some degree of **symptom specificity rather than acting as a nonspecific amplifier of distress scores**."
【原文·PDF 5】"**practical help offered** by conversation partners was the **only feature that did not differ significantly** between exposed and control agents in the average-neuroticism condition (p = 0.306), suggesting that the conversational classification captures meaningful variation **rather than uniformly inflating all social features**."

【推断】**这招对我们直接可用**：如果我们的引擎做对了，注入"高 intensity 事件"后**不该是所有情绪维度都齐刷刷上涨**，而应该有**方向性/选择性**。所以我们的测试断言应该是："只该涨该涨的那些，不该涨的不涨"——这比"涨了"强得多，能挡掉"整体放大"这种假阳性。

### 3.4 数据与规模（genagents）
| 项 | 值 | 出处 |
|---|---|---|
| agent 总数 | **25** | 【原文·PDF 2】 |
| 暴露组 / 对照组 | **6 / 19** | 【原文·PDF 3】 |
| 仿真时长 | **5 天**（3 天基线 + 第 4 天暴露 + 第 5 天随访） | 【原文·PDF 10】 |
| 时间步 | **1 步 = 10 秒仿真时间 = 360 步/小时** | 【原文·PDF 10】 |
| 评估点 | 每 agent 每量表 **10 次** | 【原文·PDF 10】 |
| 分支 | **3 个**（低/中/高神经质），共享基线记忆 | 【原文·PDF 12】 |
| 模型 | **gpt-3.5-turbo**，默认参数，**temperature = 1.0** | 【原文·PDF 10】 |
| judge 模型 | **GPT-4.1** | 【原文·PDF 13】 |
| embedding | OpenAI embedding endpoint | 【原文·PDF 10】 |
| 事件设计 | 6 个，覆盖家庭危机/财务威胁/职场冲突/医疗急救/住房不稳/奖学金危机；**逐个错开 10 分钟（60 时间步）**注入 | 【原文·PDF 11, Table 2】 |

---

## 四、nihms 那篇是什么

**结论：与"LLM 情绪对话"毫无关系。** 逐条排除：
- ❌ 不是 LLM 工作（全文无 LLM、无语言模型、无生成）
- ❌ 不是对话系统（是**人类**患者用手机 App 自评）
- ❌ 不是预印本（【原文·PDF 1】已被 `Schizophr Res` 接收，是 **accepted author manuscript**）
- ✅ 是**人类被试的 EMA（生态瞬时评估）研究**，MASS 手机干预的**二次数据分析**

**它做了什么**：
- **N = 32** 完成基线，**30** 人纳入分析（2 人因 EMA 完成率 < 10% 剔除）
- **60 天，每天 2 次**半随机 EMA（早/晚，各在 2.5 小时窗口内）→ 每人最多 **120** 个信号点
- 测量（【原文·PDF 12, Table 1】，⭐ **量表原文值得抄**）：
  - **Positive Affect**：「How **happy** / **excited** / **calm** did you feel about those conversations?」
  - **Negative Affect**：「How **sad** / **anxious** / **angry** did you feel about those conversations?」
  - Social Value：「How well did you communicate」「What did you think other people thought of you」「To what extent were those interactions worth the effort?」
  - 5 点量表（0 = not at all ~ 4 = extremely）；social value 用 4 点
- **内心一致性**（【原文·PDF 14, Table 3】）：PA 三项 **α = .88**（happy 2.20 / excited 1.84 / calm 2.25）；NA 三项 **α = .94**（sad 0.66 / anxious 0.73 / angry 0.47）

**它为什么对我们有一点点用**（详见 §9）：
1. **PA 与 NA 不是一根轴的两端**：【原文·PDF 6】"PA was **not significantly correlated with NA**, r = −.27, p = .15"。→ 支持我们**多维度**而不是单极 valence。
2. **PA 三项恰好是 happy(高唤醒正) / excited(高唤醒正) / calm(低唤醒正)**——【原文·PDF 8】"while we made attempts to **incorporate positive and negative emotions that varied in arousal/activation** in our composite affect measures"。→ **这是人类研究里成型的"效价 × 唤醒"取样**，与 PAD 的 V/A 两轴对应。
3. **只有 PA 预测动机，NA 不预测**：【原文·PDF 6–7】PA ↔ past goal progress r = .41, p = .03；↔ social goal motivation r = 0.43, p = 0.02；↔ social value r = .59, p < .001。而 NA ↔ goal progress r = −.07 (p = .73)、↔ motivation r = −.16 (p = .40)、↔ social value r = −.32 (p = **.08**, 边缘)。
   【原文·PDF 7】"for every one unit increase in positive affect an individual experienced from a recent social interaction, there was a **0.20-unit increase in motivation** towards a specific social goal"
   多层模型（【原文·PDF 16–17, Table 5/6】，*p < .001）：
   | 结果变量 | 个体间 b(PA) / b(NA) | 个体内 b(PA) / b(NA) |
   |---|---|---|
   | Past Goal Progress | 0.40* / −0.13 | 0.38* / −0.14 |
   | Social Goal Motivation | 0.26* / 0.06 | **0.20*** / 0.04 |
   | Social Value | 0.22* / −0.21* | 0.22* / −0.20* |
   → 【推断】对我们的表达层/陪伴策略：**"抬高正情绪"比"压住负情绪"更能驱动用户继续互动**。这与很多陪伴 AI 只做"安抚负面情绪"的默认策略是相反的。
4. **"放大正情绪"作为治疗策略**：【原文·PDF 8】"Rather than focus on **reducing NA**, which may be particularly intractable ... clinicians may get **'more bang for their buck' by amplifying the positives**"；【原文·PDF 7】提到 "helping people ... **reappraise** social interactions as more positive, **savor** past and present positive experiences"。
   → 「reappraise（重评价）」这个词几乎就是**我们评价层存在的理由**。

---

## 五、⭐ 评估方法汇总（可复用的指标）

### 5.1 三篇的评估方式对照

| 维度 | EmoChat | genagents | nihms |
|---|---|---|---|
| 评估对象 | **识别准确率** | 症状量表分数 + 对话行为率 | 人类自评 EMA + 临床量表 |
| 主要指标 | Accuracy、混淆矩阵 | PHQ-9/K10 总分、χ²、φ、OR、SMD、marginal R² | 相关系数 r、HLM 系数 b、ICC |
| 是否评估"情绪回应好不好" | ❌ **完全没有** | ✅ **间接：Partner Empathy / Practical Help** | ❌（是自评，不是对回应打分） |
| 人工评估 | 无（志愿者只做**标注**，不做**评分**） | 无人工；用 **GPT-4.1 自动编码** | 无（人类被试自报） |
| 自动评估 | 有（分类器） | 有（LLM-as-judge） | 无 |

⚠️ **诚实地说**：三篇里**没有任何一篇**给出"共情度 / 恰当性 / 情绪一致性"的**现成评分表**（比如 EmpathyScale、EPITOME、DEAM 那类）。EmoChat 根本没有回应生成，所以谈不上回应质量；genagents 有回应侧的编码但只有 2 个特征（empathy、practical help）且是**二分类 present/absent**；nihms 测的是自评情绪和动机。

### 5.2 可复用的具体指标（含出处）

**A. 分类侧（来自 EmoChat）**
1. **Accuracy + 混淆矩阵**（分极性/分类别两套）
2. **按模态的消融**：F / T / F+T / F+T+Context 四级 —— 【原文·PDF 8, Table I】

| Method | Polarity | Category |
|---|---|---|
| Facial expression | 64.89% | 35.11% |
| Text message | 67.99% | 41.14% |
| **F + T** | **71.08%** | **45.78%** |
| **F + T + Context** | **76.25%** | **51.64%** |

3. **单模态模型选择基准**（Vgg / Resnet / Xception / MobileNet / mini-Xception / tiny-Xception；Naive Bayes / Random Forest / TextCNN）——同时报告 **accuracy、模型体积(MB)、单次耗时(ms)**。这个"精度/体积/延迟"三元组的报告方式值得学。
4. **实时性指标**：端到端延迟（【原文·PDF 9/印刷 220】PC 上人脸 9.25ms、文本 1.99ms、融合 0.1ms、HMM 0.25ms；手机 124ms / 35ms / <1ms / 3ms；**满足实时的部分是文本+融合+HMM，< 50ms**）
5. **"多模态节奏"消融**：每 X 句抓一次脸的准确率曲线（X = 1..14）——【原文·PDF 9】X 从 1→4 时，类别 45.8%→41.8%，极性 71.1%→67.3%，之后趋于**纯文本基线**。
6. **微调数据比例消融**：0% ~ 90%。【原文·PDF 8】"the accuracy improves significantly **even with only 10% data** as finetuning set, for example, from 42.2% to 56.3% for facial expression and 59.1% to 70.4% for text messages on emotion polarity recognition ... On average, the performance is the best with taking **60%** of data as finetuning set"。
   ⭐ **可复用结论**：**领域内微调只需 10% 就能拿到大部分收益，60% 左右饱和**。

**B. 对话/行为侧（来自 genagents）** ⭐⭐ 最可复用
7. **5 项对话行为编码**（GPT-4.1，conversation-level，二分类 present/absent）：
   - (1) **personal difficulty mentioned** — 【对我们】用户是否在倾诉
   - (2) **negative emotion expressed** — 【对我们】情绪表达是否被引出来
   - (3) **support seeking** — 【对我们】用户是否来求安慰
   - (4) **partner empathy shown** — 【对我们】⭐⭐ **AI 侧是否共情**
   - (5) **partner practical help offered** — 【对我们】⭐ **AI 侧是否给了实际帮助**
8. **效应量三件套**：χ² + **φ 系数** + **OR（含 Fisher 精确检验）**；连续变量用 **SMD**；轨迹用 **marginal R²**
9. **剂量–反应检验**：把神经质分低/中/高，看特征率是否**单调**变化（13.1% → 17.1% → 28.8% for negative emotion）。→ **可复用为"强度旋钮"的验证**：我们的 `r` 变大时，应该看到可观测行为率**单调**上升，而不是跳变。
10. **区分度/负对照**（前文 §3.4）：不是所有指标都涨；用"某个不该动的特征没动"来证明编码器没在整体放大。
11. **构念效度的收敛证据**：量表（自我报告）与行为（对话）**两个层面同时成立**才算过。

**C. 人类基线（来自 nihms）** ⭐ 用来校准我们的输出分布
12. **PA/NA 均值与离散度**（0–4 量表）：PA M = 2.10, SD = 0.88；NA M = 0.62, SD = 0.61；**Cohen's d = 1.20**（PA > NA）。
    → 【推断】真实临床人群在社交后自评的情绪分布**偏向正、且方差不大**。如果我们的角色输出总是极端情绪，可以拿这个当"真人不会这么飘"的对照。
13. **PA–NA 相关性 r = −.27 (n.s.)** → 两轴近似独立，支持多维模型。
14. **ICC > 0.10** 作为"必须用多层模型"的门槛（【原文·PDF 6】"All person-level intraclass correlations (ICC) for each model were > 0.10, indicating sufficient interdependence of responses to necessitate multilevel analyses"）。→ 我们分析多轮对话数据时同样适用。
15. **个体间 vs 个体内分开报告**（Table 5 / Table 6）。→ 对我们意味着：**"这个角色一贯偏冷" 和 "这个角色此刻变冷了" 是两回事**，我们的报告也该分开（正好对应 μ 和 E−μ）。
16. **组内一致性 α**：PA α = .88，**NA α = .94**。→ 负情绪三项更抱团。

### 5.3 ❌ 没有的东西（明确说清楚）
- ❌ 没有"共情度评分"的现成量表或 rubric（genagents 只有 2 个二分类特征）
- ❌ 没有"情绪恰当性"指标
- ❌ 没有"情绪一致性/漂移"的定量指标（EmoChat 的 HMM 是**方法**，不是**度量**；它没有定义"漂移量"并测量）
- ❌ 没有人类对 AI 情绪的偏好/满意度评分（三篇都没有 user study on response quality）
- ❌ 没有 LLM 输出的可重复性/稳定性指标（genagents 用 temperature=1.0，且自陈未做跨模型复现）

---

## 六、多轮情绪一致性

### 6.1 EmoChat：唯一有显式机制 + 唯一量化了收益的

**机制**：情绪隐状态 + **人类真实对话日志估出的转移矩阵 A** + Viterbi 全局最优 + 30 分钟上下文窗口。

**收益（消融）**：
- 极性：67.99%（纯文本）→ 71.08%（+表情）→ **76.25%（+上下文）**，上下文贡献 **+5.17 pt**；相对文本基线 **+8.26 pt**
- 类别：41.14% → 45.78% → **51.64%**，上下文贡献 **+5.86 pt**；相对文本基线 **+10.50 pt**

⚠️ **原文内部一处不一致**：【原文·PDF 8/印刷 219】说 "the accuracy improves about **3%** with multimodal fusion method and further improves about **5%** with the context aware method for the emotion polarity recognition. And for the emotion category recognition, accuracy improves **over 4%** with multimodal fusion method and further improves about **7%**"。
但按 Table I 算：极性 → +3.09 pt / +5.17 pt（与"3%""5%"吻合）；类别 → +4.64 pt / +5.86 pt（"over 4%" 吻合，但 **"+7%" 对不上**，表里是 5.86 pt）。【推断】类别那句 "+7%" 疑似**误写或指别的口径**（如相对增幅：45.78→51.64 是 **+12.8% 相对**，也不是 7%）。**引用该文时以 Table I 为准**。

**机制为什么有效（原文判断）**：【原文·PDF 5/印刷 216】"people usually keep a certain emotion state for **several minutes to several hours** before changing to another emotion state"——所以 30 分钟窗口内"上一条情绪"是有信息的先验。

### 6.2 ⚠️ EmoChat 自陈的一个一致性失败：**中性类是"吸收态地狱"**

【原文·PDF 9/印刷 220】"**Neutral** category also has a low accuracy, the reason may be that **neutral can be transferred to or from any other emotion categories, thus the context information bring confusion for its classification**."

【推断】这是**§7 中最该带走的一条警告**。若一个状态**可以双向连接所有其他状态**（中性/平静/无情绪），它就会在转移矩阵里变成一个**高连通节点**：任何一条真实情绪都可能被 Viterbi 路径"解释成"经过中性，于是它**既吃掉真阳性，也污染邻接状态**。对我们来说：如果 A1 里 `μ` 附近有个"平静/中性"的谷，且我们的更新允许"任何情绪都能平滑回中性"，那么**长对话里就会被拉向中性**——这正是"情绪漂移"的一种**结构性**成因（不是噪声，是拓扑）。

EmoChat 里的证据还有一条旁证：【原文·PDF 9】"The accuracy of the context aware method ... Surprise is difficult to be recognized, that may be because **data labeled with surprise is less**"——低频类被牺牲。

### 6.3 genagents：一致性靠**记忆**，不靠情绪状态；且漂移被当作**社会现象**研究

- **一致性机制**：memory stream（时间戳 + embedding + 1–10 重要性）+ reflection（阈值 150）——**保证"角色还是那个角色"**，但**没有情绪状态变量**，所以谈不上"情绪一致性"。
- **情绪传染被显式观测到**：【原文·PDF 5】"after hearing about others' adverse experiences, agents build memories of these events, indicating that **adverse events socially spread through the agent community** — a pattern consistent with evidence that **emotional states propagate through social networks** in human populations (Fowler and Christakis, 2008)."
- **记忆→行为的一致性证据**：【原文·PDF 4】"after hearing that her café is in financial trouble, Isabella Rodriguez is 'reviewing the letter regarding the insolvency review' and 'contacting the bank to address financial concerns'"；【原文·PDF 4】"agents store adverse experiences as memories and are **building secondary memories as a result of reflecting** about their current situation (e.g. John is '...feeling anxious about the upcoming disciplinary meeting')"
- **持续性**：【原文·PDF 4】"elevated scores **persisting across all subsequent assessment timepoints** (all p < 0.05)"

【推断】对我们的启发：**"情绪的持续"可以不由情绪状态本身实现，而可以由"记忆被反复检索到"实现**。这是一条 A2 之外的替代/补充路径——情绪不是靠 ρ 衰减维持，而是靠**相关记忆在每轮被检索回来**而维持。两者可以叠加，也可以互相验证。

### 6.4 nihms：对"一致性"无帮助，但提供一个反直觉的人类数据点

- **PA 和 NA 在 60 天干预里都没有显著变化**：【原文·PDF 6】"Neither PA (b = −0.0017, SE = 0.00099, p = 0.10) nor NA (b = −0.00024, SE = 0.0012, p = 0.84) significantly changed over the course of the intervention."
- 【推断】也就是说，**人类在 60 天尺度上的社交情绪基线是相当稳的**（基线没漂）。如果我们 A3 的 μ 需要设"漂移速度"，这是一个"人类 μ 基本不漂"的参照——**我们引擎里的"长期漂移"应该非常慢，慢到 60 天量级看不出来**。

### 6.5 小结：多轮一致性的三种解法（三篇各一）
| 解法 | 出处 | 本质 |
|---|---|---|
| **显式转移先验**（HMM 转移矩阵 A + Viterbi） | EmoChat | 状态层的**一阶马尔可夫约束** → 对应我们的 **ρ** |
| **记忆检索**（recency 0.995 + importance + relevance） | genagents | 靠**内容**复位，不靠状态方程 |
| **反事实分支**（同一世界状态 fork，只改一个变量） | genagents | 不是保持一致性，而是**在一致性前提下做可控实验** |

---

## 七、⚠️ 失败模式

### 7.1 EmoChat 自陈 / 数据直接体现

| # | 失败模式 | 原文依据 | 严重度 |
|---|---|---|---|
| E1 | **离散情绪类别识别率低到不可用**：7 类只有 **51.64%**（比 7 类随机的 14.3% 好，但远低于可产品化的水平） | 【原文·PDF 8, Table I】 | 高 |
| E2 | **跨域迁移精度崩溃**：公开数据集训练的模型直接用到聊天数据上"Severe loss of precision" | 【原文·PDF 8/印刷 219】"Severe loss of precision can be observed when transferring the pre-trained mini-Xception and TextCNN models to our own collected dataset since the training datasets and the testing dataset are **not in the same data distribution**" | 高 |
| E3 | **低频情绪类被牺牲**：surprise 识别差，因为"data labeled with surprise is less" | 【原文·PDF 9】 | 中 |
| E4 | ⭐ **中性/平静成为吸收态，被上下文"污染"而非改善** | 【原文·PDF 9】"neutral can be transferred to or from any other emotion categories, thus the context information **bring confusion** for its classification" | 高 |
| E5 | **类间混淆有结构性规律**：表情易混**同组内**（angry↔sad，因都有"眉"的动作）；文本易混**跨组**（disgust↔happy，因语言歧义） | 【原文·PDF 5/印刷 216】"facial expression more likely to confuse the emotion in the same group ... text message based model is more likely to confuse emotions on different groups due to the language ambiguity" | 中 |
| E6 | **聊天场景下表情幅度本身很小**，导致表情被识别成 neutral | 【原文·PDF 8/印刷 219】"the amplitude of facial expressions is relatively small in online chatting scenarios, thus the facial expressions tend to be recognized to neutral" | 中 |
| E7 | 数据规模极小且**自标注**（20 人、1495 样本，志愿者标注**自己的**消息）→ 标签本身可能有系统偏差；且用情绪**表演**（"act"）而非自然情绪 | 【原文·PDF 8/印刷 219】"we design six scenarios for volunteers to **act**" | 中 |
| E8 | **纯文本的歧义上限**：同一条文本（"I scored 85 points"）可以是满意也可以是糟糕 | 【原文·PDF 4/印刷 215】 | 中 |
| E9 | （旁证）**人体动作识别 61.3% ≈ 人类观察者 61.9%** —— 说明情绪识别的**人类天花板本身就低** | 【原文·PDF 3/印刷 214】引 Piana et al. | 高（对预期管理） |

### 7.2 genagents 自陈（作者写得很诚实，⚠️ 这部分含金量高）

| # | 失败模式 | 原文依据 |
|---|---|---|
| G1 | ⭐⭐ **"神经质"可能只是提示层先验**，改变的是自评的措辞风格与效价，然后机械地映射成更高的症状分 | 【原文·PDF 8】"A plausible alternative is that 'neuroticism' acts primarily as a **prompt-level prior that shifts the linguistic style and valence of self-report**, which then **mechanically maps onto higher symptom scores** (Coda-Forno et al., 2023)." |
| G2 | ⭐⭐ **合成被试对分析选择高度敏感**：模型选择、提示策略、temperature、persona 规格，任一改动都会实质影响与人类数据的吻合度 | 【原文·PDF 8】"silicon-sample approaches have been shown to be **sensitive to analytic choices** — including model selection, prompting strategy, temperature, and persona specification — such that **small configuration differences can substantially alter correspondence with human data** (Cummins, 2025)." |
| G3 | ⭐ **LLM 被试能绕过标准数据质量检查** | 【原文·PDF 8】"autonomous LLM-based respondents can **evade standard data-quality checks** (Westwood, 2025)" |
| G4 | **LLM 的集成反而加剧了 agent-based model 的验证难题**：黑箱、文化偏差、随机输出 | 【原文·PDF 8】"the integration of LLMs may **exacerbate rather than alleviate** long-standing challenges of validating agent-based models, given their **black-box structure, cultural biases, and stochastic outputs** (Larooij and Törnberg, 2026)" |
| G5 | **样本量极小**（6 个暴露 agent），统计功效与泛化性受限 | 【原文·PDF 8】"The sample comprised only **six exposed agents**, limiting statistical power and generalisability." |
| G6 | **单一模型**（GPT-3.5-turbo），未跨供应商复现 | 【原文·PDF 8】"All simulations used a **single LLM (GPT-3.5-turbo)**, and results may differ across model providers or parameter settings." |
| G7 | **时长太短**（5 天），无法判断是否会恢复/慢性化 | 【原文·PDF 8】"The simulation spanned **five days**, leaving open whether longer trajectories would show recovery, chronicity, or other clinically relevant patterns." |
| G8 | **LLM 只能在语言域**，抓不到非言语/生理/神经层面 | 【原文·PDF 8】"LLMs operate within the domain of language and **cannot capture non-verbal, physiological, or neurobiological aspects** of mental health." |
| G9 | **没有个体级校准**：agent 来自**虚构**传记，不是真实被试数据 | 【原文·PDF 8】"The present study **did not incorporate individual-level calibration**, as agents were initialised from **fictional biographical profiles** rather than real participant data" |
| G10 | **未做负对照与跨模型复现**，无法排除"仅是风格解释" | 【原文·PDF 8】"distinguishing these interpretations fully will require **negative-control manipulations** ... and **cross-model replication**" |
| G11 | **测量循环**：量表由同一个 LLM 既答又汇总（【推断】作者未把这列为 limitation，但是结构性隐患） | 【原文·PDF 12】"The LLM was then asked to respond to each questionnaire item ... Responses were **parsed and summed**" |

### 7.3 nihms 自陈的局限（方法学层面，可迁移到我们做任何用户研究时）
- **社会 vs 非社会情绪未区分**（【原文·PDF 8】"we did not compare social with nonsocial affective experiences"）
- **回溯报告偏差**（问的是"过去几小时"的互动，不是当下）（【原文·PDF 8】）
- **同源同时点 → 共同方法偏差/正性偏差**（【原文·PDF 9】"reporting more PA ... may have reflected a **general positivity bias** for some participants, making it more likely for them to **also** report more progress ... **during the same response window**"）
- **生态瞬时评估的非随机作答**（人更可能在心情好时回问卷）（【原文·PDF 9】"participants may have responded to prompts in a **non-random fashion**"）
- **因果不能定**（【原文·PDF 5】"we tested **contemporaneous** associations ... we did not examine lagged relationships; thus, **causality cannot be determined**"）
- **样本自选偏正**：报名者本来就更想改善社交（【原文·PDF 8】）
- ⭐ **真实数据缺失率**：【原文·PDF 6】"Approximately **52% of the observations were missing** (1882 out of a possible 3600)"；完成率区间 12–89%，均值 M = 0.48。【推断】**这是"人类情绪自报"的真实留存水位**——任何声称用户会乖乖报情绪的假设都要打对折。

### 7.4 三篇共同指向的一条**结构性**失败模式（我们最该警惕）
【原文·EmoChat PDF 9】"neutral ... the context information bring confusion"
【原文·genagents PDF 8】"neuroticism acts primarily as a prompt-level prior that shifts the linguistic style and valence of self-report"

【推断】**两条合起来是一个警告**：
> 情绪系统做错时，**不会报错，只会"看起来对"**——它要么被中性吸收态悄悄归零（EmoChat 的 E4），要么被风格先验整齐地抬升（genagents 的 G1）。
两种都是**"结果看起来合理但机制是假的"**。所以我们要的验证手段必须是 **§3.4 的区分度/负对照**（"不该动的没动"），而不是"动了，很好"。

---

## 八、数据与规模

| 项 | EmoChat | genagents | nihms |
|---|---|---|---|
| 类型 | 系统论文（无 LLM） | 预印本（LLM 仿真） | 人类临床研究（无 AI） |
| 人类被试 | **20** 人（19–25 岁），分 **10 组**两两对聊 | 无人类被试 | **32** 完成基线，**30** 人分析（男 15 / 女 14 / 其他 1；分裂症 16 / 分裂情感 14） |
| 数据量 | **1495** 个样本（1 表情图 + 1 文本 + 类别/极性标签） | 25 agents × 5 天 | 30 人 × 60 天 × 2 次 = 理论 **3600** 观测，**缺 52%**（1882），实得约 1718 |
| 标注 | 志愿者**自标**自己的消息 | 自动（LLM 打重要性分）+ GPT-4.1 编码对话 | 被试自评（EMA） |
| 情绪标签体系 | 2 类极性 / 7 类类别 | 无情绪标签（用 PHQ-9/K10 症状分） | 6 项情绪（PA: happy/excited/calm；NA: sad/anxious/angry），0–4 |
| 场景/设置 | **6 个设计场景**（吵架、约看电影等），要求"表演" | 虚拟小镇 Smallville（房子、咖啡馆、药房、宿舍、公共空间） | 真实日常 + MASS 手机 App 干预 |
| 模型规模 | mini-Xception + TextCNN（轻量，MB 级）+ HMM | **18×** gpt-3.5-turbo（详细说明见 §3.4）；judge = GPT-4.1 | 无 |
| 训练/测试划分 | 60% 微调 / 40% 测试 | 3 分支 × (6 目标 + 19 对照) | HLM（个体内 Level1 / 个体间 Level2） |
| 统计 | 准确率/混淆矩阵 | Welch t、lmer、Tukey、FDR、χ²、Fisher、φ、OR、SMD | 配对 t、Pearson r、HLM 7.03、ICC |
| 开源 | 无 | ✅ `github.com/kambeitzlab/psyagent` | 数据不公开（二次分析） |
| 时间跨度 | 单次聊天会话 | **5 天**仿真（10 秒/步） | **60 天**，120 个信号点 |

**值得一提的对照数字**：
- 【原文·EmoChat PDF 5/印刷 216】面部单模态 fer2013 测试 **65.51%**；文本单模态 NLP&CC 2013 测试 **62.61%**
- 【原文·EmoChat PDF 3/印刷 214】前人工作基线：语音 5 类 **42.3%**（Kwon）、DNN+ELM **54.3%**（Han，SOTA 45.1%）、EEG 二分类 **87.62%**（Zheng）、LBP 表情 **92.6%**（Shan, CK 库）、SemEval 句子情感 precision 简单句 **56.37%** / 复合句 **42.71%** / 复杂句 **27.68%**（Dey）
- 【原文·EmoChat PDF 4/印刷 215】问卷回收 **100** 份：多数人愿意对**恋人/亲密朋友**分享真实情绪，对**普通朋友/同事**较不愿意 →【推断】**"情绪可见性"是关系亲密度函数**——这对陪伴型角色的"傲娇/外层表情"分层极有参考价值（越亲近才越露 inner）

---

## 九、⭐ 对我们引擎的可用之处

先给总判：**三篇没有一篇能直接给出一个"情绪引擎"的实现**。但它们分别提供了 **一个动力学先验（EmoChat 的转移矩阵）**、**一个角色调制机制 + 一套评估装配（genagents）**、**一组人类实证参数与策略结论（nihms）**。下面分条，**没用就直说**。

### 9.1 对 A1（PAD 三维 + `r = ‖E−μ‖`, `r²/σ² ~ χ²(3)`）—— 间接支持，无直接可用件
- ✅ **可用**：nihms 的 PA 三项（happy 高唤醒正 / excited 高唤醒正 / calm **低唤醒正**）与 NA 三项（sad 低唤醒负 / anxious 高唤醒负 / angry 高唤醒负）是**人类研究里成型的"效价 × 唤醒"正交取样**。【原文·PDF 8】明确说这是为了 "incorporate ... emotions that **varied in arousal/activation**"。【推断】→ 这**支持"至少两轴独立"**，与我们的 V/A 一致；并提示**"calm" 是低唤醒正情绪，不能和 "happy" 合并**——我们的 599 词表里要保证"平静"落在 V>0, A<0 区域，而不是原点。
- ⚠️ **无直接可用**：三篇**都没有强度的连续度量**，更没有 `r²/σ² ~ χ²` 这种分布假设。EmoChat 只有离散类别；genagents 的症状分是序数量表（PHQ-9 0–27）。**没有任何一篇能验证或反驳我们的 χ²(3) 封顶。**
- ❌ **EmoChat 的离散表示与我们范式不同**，不要试图混用；但它的失败（7 类 51.64%）**反过来支持我们保留连续强度**（信息不丢）。

### 9.2 对 A2（`E_t = μ + ρ(E_{t−1}−μ) + g·h(n)·ΔE`）—— ⭐⭐ 这是收益最大的一条
- ⭐⭐ **转移矩阵 A 可以作为 ρ 的经验标定来源**。【原文·EmoChat PDF 7/印刷 218】给了估算方法（式 10）：用真实对话日志统计 `nij`、按行归一化。**我们的 ρ 是一个标量，是 A 的粗糙投影**。
- ⭐ **具体可做的三件事**：
  1. **用 A 的对角线均值来定 ρ 的量级**：`a_ii` 越大 = 情绪越黏 = ρ 越大。若能复现/获取同类人类对话数据，可估出"聊天场景下 ρ 大概是多少"。
  2. **把标量 ρ 升级为方向相关的**：`ρ(c)` 或 `ρ(direction)`。论文的 `{disgust, angry, sad}` 例子说明转移概率**强非对称**，一个标量表达不了。最低成本方案：**按效价象限给不同 ρ**（例如负→负的黏性 > 正→负的黏性）。
  3. **上下文窗口 30 分钟**（【原文】）作为 `h(n)` 里 n 的时间轴口径参考：**超过 30 分钟的对话，历史情绪不该再算"当前上下文"**。
- ⭐ **EmoChat 的实验直接证明了 ρ 项的价值**：去掉上下文，识别率掉 5~7 个点（§5.2 A2）。【推断】这正是我们需要向自己证明 `ρ` 存在理由时可以引用的**同类证据**（虽然它是识别任务不是状态维护任务）。
- ⭐ **genagents 提供了 ρ 之外的第二条"持续性"路径**：情绪持续性可以由**记忆被反复检索**实现（recency 0.995 + importance + relevance），而不必靠状态方程。【推断】→ 我们可以做了 ρ 之后，再叠一层"情绪相关记忆在每轮被检索回来、重新施加少量 ΔE"，用来产生"同一件事反复被想起"的效果（这是纯 ρ 做不到的：ρ 只让情绪衰减，不让它回潮）。

### 9.3 对 A3（`μ = (方向, precision)`）—— ⭐ 有直接可借的**实验方法**
- ⭐⭐ **反事实分支法**（【原文·genagents PDF 12】）：从同一基线记忆状态 fork，**只改 persona 文本**，其余全继承，然后注入**完全相同**的事件，比较输出差异。
  → **这是检验"μ 真的起作用了吗"的标准做法**。落地：跑两个分支，μ 只差方向（比如"傲娇向" vs "温顺向"），输入同一串对话，对比 `E_inner` 轨迹与表达输出。若两者输出无差异，说明 μ 只是装饰。
- ⭐ **人格操纵的工程形态 = 改结构化文本**，不改权重（【原文·PDF 12】"The personality descriptions of the six target agents were **modified to include** ... "）。
  → 对我们 A3 的 `precision`（精度/敏感度）有个直接映射：**"高神经质 = heightened emotional reactivity + sensitivity to negative events"** vs **"低神经质 = emotional stability, resilience under stress, capacity to maintain equanimity"**。
  【推断】这与 `precision` 的语义**高度一致**：低 precision ≈ 反应迟钝/稳定（同样刺激下 ΔE 小），高 precision ≈ 敏感（ΔE 大）。**genagents 是用自然语言改，我们是用参数改；效果应当同向**——这是一个可做的交叉验证实验。
- ⭐ **情感惯犯的"社交可见性"数据**（【原文·EmoChat PDF 4/印刷 215】问卷 100 人）：愿意分享情绪的程度是**关系亲密度的函数**（恋人/密友 > 家人 > 普通朋友/同事）。
  → 这对我们的**表达层（傲娇）**是**极有价值的实证支持**：【推断】傲娇的 `E_outer = μ + s(E_inner−μ)` 中，**`s` 应该随关系亲密度而变**（对陌生 `s→1` 反向遮蔽，对亲密者 `s→1` 恢复原样，甚至 `s>1` 放大）。EmoChat 的问卷给了"关系分级"这个调节变量的经验证据。

### 9.4 对 A4（599 中文情绪词 → 概念先验）—— ⭐ 有**强支持**
- ⭐⭐ **EmoChat 的 E2 就是我们的反面教材兼支持证据**：【原文·PDF 8/印刷 219】"Severe loss of precision ... since the training datasets and the testing dataset are **not in the same data distribution**"。
  → 【推断】通用语料（fer2013 / NLP&CC 2013 是微博语料）**不能替代聊天场景的领域先验**。我们做 599 词中文概念先验，方向是对的；论文还给出"**只需 10% 领域数据微调就拿到大部分收益**"的量化支持（§5.2 A6）。
- ⭐ **EmoChat 的标注规模给了我们一个规模感**：**20 人、1495 条**就发了一篇论文。→【推断】我们的 599 词表在规模上**远超**它，不必因为"标注不够多"而不敢定稿。
- ⚠️ **但要注意 E3/E7**：EmoChat 的标签是**志愿者给自己"表演"出来的对话**做的自标注 → 标签质量有疑问。我们做 599 词时若也走自标/内省路径，会踩同一个坑。**必须用外部评分者或交叉一致性检验**。

### 9.5 对评价层（`ΔE = α × ε × signature`）—— ⭐⭐ 两个直接映射
- ⭐⭐ **`signature` 的现成实现**（【原文·genagents PDF 11】）：把**事件文本 + 角色档案**一起喂给 LLM，让 LLM 给一个 **1–10 的重要性/刺点分**（importance/poignancy），关键词打标（inadequacy, self worth, cognitive distortion, rejection）用于后续检索。
  → 同一事件、不同角色 → 不同刺点分。**这正好是 `signature` 的定义**。可以直接对标：我们的 `signature` 应该由"事件 × 角色先验"共同决定，而不是事件单独决定。
- ⭐⭐ **`ε`（权重）的现成公式**：EmoChat 的**信息熵倒数加权**（【原文·PDF 6–7，式 2–6】）。
  → 如果我们的 ΔE 有多路证据来源（文本评价、用户显式情绪词、行为信号…），可以直接抄式 (4)(5)(6)：`W = 1/H 归一化`。**零训练成本，且天然做"越不确定越保守"。**
- ⭐ **「重评价 / reappraise」这个词的政策含义**（【原文·nihms PDF 8】）："Rather than focus on **reducing NA** ... get 'more bang for your buck' by **amplifying the positives**"；并建议 "**reappraise** social interactions as more positive, **savor** past and present positive experiences"。
  → 【推断】我们的评价层不该只做"负事件 → 负 ΔE"和"负情绪 → 更快回中性"。**对陪伴场景，ΔE 的正向注入（放大一次好互动）其行为收益更高**（nihms 数据：PA 预测动机 b=0.20~0.43，NA 不预测）。
  → 具体建议：**`α` 对正效价事件给一个略大于负效价事件的增益**，或在表达层做一个"**savor（回味）**"机制（把过去的高 PA 记忆在后续轮次里重放小幅正 ΔE）。这是三篇里唯一给出的**策略级**建议。

### 9.6 对表达层（`E_outer = μ + s(E_inner−μ)`）—— ⭐ 有间接但有价值的支持
- ⭐ **EmoChat 的问卷（关系分级 → 是否愿意暴露情绪）**给了 `s` 随关系变化的经验依据（见 §9.3 最后一条）。这是**三篇里唯一能和"傲娇=内外不一致"直接对话的证据**——【推断】它的意思是：**情绪遮蔽是关系亲密度的函数，而不是角色固定的性格缺陷**。所以我们 `s` 应该同时是 `s(角色, 关系)`，而不只是角色常量。
- ⭐ **genagents 的 `E_outer` 类比**：agent 公开对话里表现的行为（disclosure / negative emotion / support seeking）与内部量表分数**是两个可分别测量的层**，且**两者都要测**（【原文·PDF 5】"convergence between standardised symptom measures and naturalistic conversational behaviour"）。
  → 【推断】这**直接支持"内层/外层分离"是合理的建模选择**，并告诉我们：**验证时必须同时测内层（E_inner）和外层（E_outer）**，只测一个会被骗。

### 9.7 对评估体系 —— ⭐⭐ 可直接装配的一套
我们目前缺评估。三篇拼起来能拼出一套**够用的**：
1. **行为层编码**（抄 genagents 的 5 项，用 LLM-as-judge，conversation-level 二分类）：personal difficulty mentioned / negative emotion expressed / support seeking / **partner empathy shown** / **partner practical help offered**。⭐ 后两项就是"情绪回应好不好"的操作化。
2. **内层状态层**：用**区分度检验**（§3.4）——"该动的手动，不该动的手没动"，挡掉"整体放大"的假阳性。
3. **剂量–反应**：把我们的强度旋钮（`r` / 事件的 importance 分）分档，看行为率是否**单调**上升（genagents 的 13.1%→17.1%→28.8% 就是范式）。
4. **收敛效度**：内层指标与外层行为率**同时**成立才算过。
5. **人类基线对照**（抄 nihms）：拿 PA M=2.10/SD=0.88、NA M=0.62/SD=0.61、PA–NA r=−.27 当"真人分布"参照，检查我们的输出分布是不是**飘得不像人**。
6. **负对照**：故意改一个**不该影响情绪**的角色参数（genagents 建议的 negative control），确认情绪指标不动。
7. **统计报告规范**：χ² + φ + OR（Fisher）+ SMD + marginal R²；个体间/个体内**分开报**（Table 5 vs Table 6 范式）；多层数据先算 **ICC > 0.10**。

### 9.8 ❌ 明确没有用的部分
- ❌ **EmoChat 的 mini-Xception 表情识别**：我们没有摄像头模态，且它本身就是失败项（表情在聊天中"幅度过小"，会被识别成 neutral）。
- ❌ **EmoChat 的 7 类 Ekman 标签体系**：与 PAD 连续空间不兼容，且 51.64%。**不要为了对齐它而把情绪离散化。**
- ❌ **nihms 的精神分裂症临床结论本身**：不适用于通用陪伴角色。**只有它的情绪测量结构和 PA/NA 不对称性**有参考价值，**不要引用它的临床结论**去设计产品。
- ❌ **nihms 的 MASS/EMA 干预设计**：60 天每天 2 次打断用户，是临床研究范式，不是陪伴产品范式。
- ❌ **genagents 的 PHQ-9/K10 量表**：给一个傲娇角色做 PHQ-9 是范畴错误。
- ⚠️ **genagents 的整体结论不可直接采信**：单模型（GPT-3.5-turbo）、n=6、5 天、无负对照、作者自陈"可能只是风格先验"。**它值得抄的是机制和评估装配，不是它的结论。**

---

## 十、原文值得逐字保留的句子（带页码）

> 页码格式：**[PDF 页 / 印刷页]**（EmoChat 第 1 页是 ResearchGate 封面，正文自 PDF 第 2 页 = 印刷 213 起）

### EmoChat

1. **[PDF 4 / 215]** — 全文愿景（也是我们做情绪引擎的同一句问句）
   > "This motivates a simple vision: **Can we build machines that automatically sense our emotions during online communication?**"

2. **[PDF 4 / 215]** — 纯文本歧义的最小反例（可以直接做我们词表的测试用例）
   > "when someone says '**I scored 85 points**', he/she may mean 'I am very satisfied with this achievement', or 'I think it was awful', which causes ambiguity when one tries to infer the emotion of the other person solely based on the text information."

3. **[PDF 5 / 216]** ⭐ 多轮情绪一致性的动机（**A2 的 ρ 项存在的实证理由**）
   > "people's inner emotion usually changes gradually. So, people usually keep a certain emotion state for **several minutes to several hours** before changing to another emotion state. In addition, the transition probability between different emotion is quite different. For example, the emotion sequence **{disgust, angry, sad} obviously exhibit higher likelihood than the emotion sequence {disgust, happy, sad}**. So, instead of considering each emotion in isolation, we should treat each emotion in the context of **its predecessors in the time series**."

4. **[PDF 5 / 216]** ⭐ 两种模态的**互补性有结构规律**（不是随便互补）
   > "facial expression based model exhibits higher accuracy in distinguishing positive and negative emotions since these two groups of emotions have quite different facial features. **However, facial expression more likely to confuse the emotion in the same group.** For example, facial expression based model seldom confuses 'happy' and 'sad', but always confuse '**angry**' and '**sad**'. While, compared with facial expression based model **text message based model is more likely to confuse emotions on different groups due to the language ambiguity**."

5. **[PDF 6–7 / 217–218]** ⭐⭐ 信息熵倒数加权（**可直接抄的融合公式**）
   > "Since larger information entropy means less confidence, we use the **reciprocal of the information entropy as the weight** of the classification result."
   > `Wf = Ht(X) / (Hf(X) + Ht(X))`  (4)
   > `P(cj|fT, tT) = Wf ∗ P(cj|fT) + Wt ∗ P(cj|tT)`  (6)

6. **[PDF 7 / 218]** ⭐ 30 分钟上下文窗口
   > "Note that we empirically select **30 minutes as a threshold** to pick out the context information of the current sentence. That is, if the time interval between (fi, ti) and (fT, tT) is within 30 minutes, then (fi, ti) is considered as the context information of (fT, tT)."

7. **[PDF 7 / 218]** ⭐ 转移矩阵的**估法**（我们标定 ρ 的方法论模板）
   > "To calculate the state transition matrix A, we use our own collected data ... We ask 20 volunteers label their recent conversation logs with emotion category and emotion polarity. We count all of the transition relationships, and get nij represented the count that from the i-th emotional status to the j-th emotional status. And then we **normalize nij for each i** to get aij."

8. **[PDF 8 / 219]** ⭐ 消融主结果表（**注意与正文 "+7%" 不一致，见表**）
   > "we get the overall accuracy of **76.25% for emotion polarity recognition** and **51.64% for emotion category recognition**."
   > "the accuracy improves about **3%** with multimodal fusion method and further improves about **5%** with the context aware method for the emotion polarity recognition. And for the emotion category recognition, accuracy improves **over 4%** with multimodal fusion method and further improves about **7%** with context aware method."
   > ⚠️ Table I 实际值：Polarity 64.89 / 67.99 / 71.08 / **76.25**；Category 35.11 / 41.14 / 45.78 / **51.64** → 类别那一段实为 **+4.64 pt / +5.86 pt**，正文 "+7%" 与表格不符。

9. **[PDF 8 / 219]** ⚠️ 领域分布不匹配（**我们做 599 词表的最强外部理由**）
   > "**Severe loss of precision** can be observed when transferring the pre-trained mini-Xception and TextCNN models to our own collected dataset since the training datasets and the testing dataset are **not in the same data distribution**."

10. **[PDF 8 / 219]** ⭐ 微调比例的量化结论
    > "the accuracy improves significantly **even with only 10% data as finetuning set**, for example, from 42.2% to 56.3% for facial expression and 59.1% to 70.4% for text messages on emotion polarity recognition ... On average, the performance is the best with taking **60% of data as finetuning set**."

11. **[PDF 8 / 219]** ⚠️ 聊天场景下表情幅度小 → 退化为 neutral
    > "the amplitude of facial expressions is relatively small in online chatting scenarios, thus the facial expressions tend to be **recognized to neutral**."

12. **[PDF 9 / 220]** ⚠️⚠️ **中性吸收态**（最值得记住的失败模式）
    > "**Neutral** category also has a low accuracy, the reason may be that **neutral can be transferred to or from any other emotion categories, thus the context information bring confusion for its classification**."

13. **[PDF 9 / 220]** ⚠️ 低频类被牺牲
    > "**Surprise is difficult to be recognized**, that may be because **data labeled with surprise is less**."

14. **[PDF 9 / 220]** ⭐ 模态节奏消融（**"性价比"曲线**）
    > "The accuracy declines faster when X increases from 1 to 4, that is, from **45.8% to 41.8%** for category recognition and from **71.1% to 67.3%** for polarity recognition, and then the accuracy tends to be stable, **close to the accuracy using only text messages**."

15. **[PDF 9 / 220]** ⭐ 实时性账本
    > "On the laptop device, processing one facial expression image costs the longest time, **9.25ms**. The analysis of one sentence using TextCNN uses **1.99ms**. The time cost of multimodal fusion is **0.1ms** and the estimation of current emotional status with Hidden Markov Model is **0.25ms**." / "On the mobile phone, facial expression analysis also costs the most time, **124ms**. And the text analysis costs **35ms** ... the estimation of current emotional status with Hidden Markov Model is **3ms**." / "So that the time delay only consists of text messages processing, multimodal fusion and final prediction with context information. These three stages take less than **50ms**."

16. **[PDF 10 / 221]** — 它的边界（**它不生成对话**）
    > "Besides, the emotion recognition algorithm proposed in this paper is **also helpful for** intelligent chatbots, making them more emotional and more humane."
    → 【注意】"also helpful for" = 未来工作，非本文成果。

### genagents

17. **[PDF 3]** ⭐⭐ **研究纲领**（我们如果要做"用 agent 验证情绪引擎"，就是这句话的下游）
    > "We recently proposed that such agents could be **embedded in virtual environments and assessed using standardised mental health instruments** to investigate socio-environmental determinants of mental health **under full experimental control**."

18. **[PDF 4]** ⭐⭐ **角色特异性刺点**（§9.5 的 `signature`）
    > "The LLM assigned an **importance (poignancy) score** to each event by evaluating the event description **in the context of the agent's persona**, ensuring that **emotional impact was assessed in a character-specific manner**."

19. **[PDF 4]** ⭐ 记忆的**二次生成**（情绪持续可以由记忆回潮实现）
    > "agents store adverse experiences as memories and are **building secondary memories as a result of reflecting about their current situation** (e.g. John is '...feeling anxious about the upcoming disciplinary meeting')."

20. **[PDF 5]** ⭐ 情绪在 agent 社群里的**传播**
    > "after hearing about others' adverse experiences, agents build memories of these events, indicating that **adverse events socially spread through the agent community** — a pattern consistent with evidence that **emotional states propagate through social networks** in human populations."

21. **[PDF 5]** ⭐⭐ **收敛效度**（内层量表 + 外层对话**都要测**）
    > "This **convergence between standardised symptom measures and naturalistic conversational behaviour** suggests that the neuroticism manipulation propagates beyond questionnaire responses into social interaction patterns."

22. **[PDF 9–10]** ⭐ 四模块与全部参数（**可逐字对照我们的记忆/检索层**）
    > "First, a **memory stream** records all observations, actions, and reflections as timestamped entries, each tagged with an embedding vector and an **importance score (rated 1–10** by the LLM). Second, a **retrieval mechanism** selects relevant memories ... by computing a weighted combination of three factors: **recency (exponential decay with a factor of 0.995)**, **importance** (the stored score), and **relevance** (cosine similarity ...). Third, a **reflection module** periodically synthesises higher-level insights from accumulated memories once their cumulative importance exceeds a threshold of **150 points** ... Fourth, a **planning module** generates hierarchical daily schedules ... at approximately **5–15 minute** granularity."
    > "All language generation and scoring calls were routed through OpenAI's **gpt-3.5-turbo** (ChatGPT) API ... Default API parameters were used throughout (**temperature = 1.0**)."

23. **[PDF 11]** ⭐ 事件注入的完整工程流程（**我们做"事件注入"的模板**）
    > "At the designated time step, the event description was added to the agent's memory stream via the **standard memory-insertion pathway** ... Events were **tagged with keywords** (e.g., 'inadequacy,' 'self worth,' 'cognitive distortion,' 'rejection') to facilitate retrieval during future interactions and assessments. A **forced reflection** was triggered approximately **40 seconds (4 time steps)** after each adverse event, prompting the agent to generate an introspective entry about their thoughts and feelings."

24. **[PDF 12]** ⭐⭐ **反事实分支法**（验证 μ 的标准做法）
    > "Starting from the shared baseline state at the end of Day 3, the simulation was **forked into three parallel branches** for the six target agents."
    > "Importantly, **all three branches inherited the complete memory state from the shared three-day baseline**, ensuring that any observed differences in post-event mental health scores could be attributed to the personality manipulation **rather than divergent experiential histories**."

25. **[PDF 12]** ⭐ 三个神经质分支的**原文措辞**（可直接改写为 A3 的 precision 描述）
    > High: "**heightened emotional reactivity, tendency toward worry and rumination, sensitivity to negative events**"
    > Low: "**emotional stability, resilience under stress, capacity to maintain equanimity**"

26. **[PDF 13]** ⭐⭐ **LLM-as-judge 的 5 项对话行为编码**（我们评估体系的核心件）
    > "Each conversation was **classified by GPT-4.1** for **five behavioural features**: (1) **personal difficulty mentioned**, (2) **negative emotion expressed**, (3) **support seeking**, (4) **partner empathy shown**, and (5) **partner practical help offered**. Classification was performed at the conversation level using a structured prompt ... and requested **binary (present/absent)** ratings for each feature."

27. **[PDF 4–5]** ⭐⭐⭐ **区分度证据**（挡"整体放大"的假阳性；**我们最该抄的验证逻辑**）
    > "The fact that the simulation reproduces this **differential sensitivity rather than uniformly inflating all items** provides evidence that manipulating neuroticism leads to some degree of **symptom specificity rather than acting as a nonspecific amplifier of distress scores**."
    > "**practical help offered** by conversation partners was the **only feature that did not differ significantly** between exposed and control agents in the average-neuroticism condition (p = 0.306), suggesting that the conversational classification captures **meaningful variation rather than uniformly inflating all social features**."

28. **[PDF 8]** ⚠️⚠️ **"可能只是提示层先验"**（LLM 情绪模拟的头号怀疑）
    > "A plausible alternative is that 'neuroticism' acts primarily as a **prompt-level prior that shifts the linguistic style and valence of self-report**, which then **mechanically maps onto higher symptom scores**."

29. **[PDF 8]** ⚠️⚠️ **对分析选择敏感**（换模型/提示/温度/persona 就会变）
    > "silicon-sample approaches have been shown to be **sensitive to analytic choices** — including **model selection, prompting strategy, temperature, and persona specification** — such that **small configuration differences can substantially alter correspondence with human data**."

30. **[PDF 8]** ⚠️ **能绕过数据质量检查**
    > "autonomous LLM-based respondents can **evade standard data-quality checks**."

31. **[PDF 8]** ⚠️ **黑箱/文化偏差/随机性**（验证难题被加剧而非缓解）
    > "the integration of LLMs may **exacerbate rather than alleviate** long-standing challenges of validating agent-based models, given their **black-box structure, cultural biases, and stochastic outputs**."

32. **[PDF 8]** ⚠️ 四条 limitation 全文（**引用时务必连这段一起引**）
    > "The sample comprised only **six exposed agents**, limiting statistical power and generalisability. All simulations used a **single LLM (GPT-3.5-turbo)**, and results may differ across model providers or parameter settings. The simulation spanned **five days**, leaving open whether longer trajectories would show recovery, chronicity, or other clinically relevant patterns. Finally, LLMs operate within the domain of language and **cannot capture non-verbal, physiological, or neurobiological aspects** of mental health."

33. **[PDF 8]** ⭐ **未来必须做的三件事**（我们做任何 LLM 仿真研究都应内建）
    > "First, **robustness should be quantified across model providers and prompt perturbations**, and simulation outputs should be **benchmarked against human reference datasets**." ... "will require **negative-control manipulations** ... and **cross-model replication**."

34. **[PDF 14 / 数据可得性]** ⭐ 开源（**有代码可读，别只看论文**）
    > "The simulation and analysis pipeline is implemented as an **open-source toolbox (psyagent)** and is available together with all agent configuration files, prompt templates, and simulation logs at **https://github.com/kambeitzlab/psyagent**."

### nihms-2194640

35. **[PDF 1]** — 形态判定（**不是预印本**）
    > "**Publisher's Disclaimer**: This is a PDF file of an **unedited manuscript that has been accepted for publication**. As a service to our customers we are providing this early version of the manuscript."
    > "HHS Public Access / Author manuscript / Schizophr Res. Author manuscript; available in PMC 2026 July 21. Published in final edited form as: **Schizophr Res. 2026 October; 296: 54–59. doi:10.1016/j.schres.2026.07.005**."

36. **[PDF 1 / Abstract]** ⭐ 核心结论一句话
    > "Results showed that participants reported more positive than negative affect in response to social interactions. However, **only positive (not negative) affect predicted greater social goal progress and social motivation** towards one's goal across the intervention. These results suggest that **facilitating positive affect experiences during social interactions, over and above reducing negative affect**, may be important for improving social motivation in this population."

37. **[PDF 4 / Table 1 前文]** ⭐ EMA 情绪条目原文（**PA 三项是 高唤醒正/高唤醒正/低唤醒正**）
    > Positive Affect: "**How happy did you feel about those conversations?**" "**How excited did you feel about those conversations?**" "**How calm did you feel about those conversations?**"
    > Negative Affect: "**How sad did you feel about those conversations?**" "**How anxious did you feel about those conversations?**" "**How angry did you feel about those conversations?**"

38. **[PDF 8]** ⭐ 情绪取样的**唤醒设计意图**（**支持 PAD 的 V/A 两轴**）
    > "while we made attempts to **incorporate positive and negative emotions that varied in arousal/activation** in our composite affect measures"

39. **[PDF 6]** ⭐ **PA 与 NA 近似独立**（→ 不要用单根效价轴）
    > "**PA was not significantly correlated with NA, r = −.27, p = .15.** Neither PA nor NA were correlated with the number of social interactions reported at each time point."

40. **[PDF 6]** ⭐ 基线统计量（**人类参照分布**）
    > "participants reported more PA overall in response to social interactions (**M = 2.10, SD = 0.88**) than NA (**M = 0.62, SD = 0.61**), t(29) = 6.71, p < .001, **Cohen's d = 1.20**."

41. **[PDF 6]** ⭐ 情绪基线**在 60 天内不漂**
    > "Neither PA (b = −0.0017, SE = 0.00099, p = 0.10) nor NA (b = −0.00024, SE = 0.0012, p = 0.84) **significantly changed over the course of the intervention**."

42. **[PDF 6]** ⚠️ 真实缺失率（**对"用户会乖乖报情绪"最有力的反驳**）
    > "All person-level intraclass correlations (**ICC) for each model were > 0.10**, indicating sufficient interdependence of responses to necessitate multilevel analyses. **Approximately 52% of the observations were missing (1882 out of a possible 3600).**"
    > （[PDF 5]）"**EMA adherence ranged from 12–89% (M = 0.48, SD = 0.25).**"

43. **[PDF 7]** ⭐⭐ 策略级结论（**指导我们 α 的不对称**）
    > "for every one unit increase in positive affect an individual experienced from a recent social interaction, there was a **0.20-unit increase in motivation** towards a specific social goal."
    > "**PA may be part of an important feedback loop** ... The more PA one experiences from social interactions, the more they will make progress towards their social goals, **resulting potentially in more positive interactions in the future**."
    > "Therapeutic strategies such as helping people ... **reappraise** social interactions as more positive, **savor** past and present positive experiences with others, and/or focus on what they are looking forward to ... could increase PA specific to social experiences in this population."

44. **[PDF 8]** ⭐⭐ **"放大正向 > 压制负向"**（与我们默认策略相反）
    > "Rather than focus on **reducing NA**, which may be particularly **intractable** for the majority of this population, clinicians may get **'more bang for their buck' by amplifying the positives** in helping people ... improve their ability to accomplish their social goals as well as improve broad and specific aspects of social motivation."

45. **[PDF 16–17 / Table 5 & 6]** ⭐ **个体间 vs 个体内分开报告**（μ 与 E−μ 的统计对应）
    > Table 5（Between-subjects）/ Table 6（Within-subjects），Outcome × {Positive Affect b, SE | Negative Affect b, SE}，注 "*p < .001"
    > 数值：Goal Progress 0.40 / −0.13（间），0.38 / −0.14（内）；Goal Motivation 0.26 / 0.06（间），**0.20** / 0.04（内）；Social Value 0.22 / −0.21（间），0.22 / −0.20（内）。

46. **[PDF 9]** ⭐ 效度警告（**共同方法偏差**，我们做用户研究时会踩）
    > "reporting more PA in response to recent social interactions may have reflected a **general positivity bias** for some participants, making it more likely for them to **also** report more progress on their social goal and more motivation for that goal **during the same response window**."

47. **[PDF 5]** ⚠️ 因果不能定（**同时点测量**）
    > "In all models we tested **contemporaneous** associations, within the same time point (i.e., we did **not** examine **lagged** relationships); thus, **causality cannot be determined** between predictors and outcomes."

---

## 附：本次分析的方法与局限

- **抽取方式**：`py -3 E:\dsh\tmp-moe\pdf-extract.py <pdf> <txt>`，输出至 `E:\dsh\tmp-moe\papers4\`。
  - `emochat.txt`（53,128 字符 / 10 页）、`genagents.txt`（48,994 字符 / 20 页）、`nihms2194640.txt`（42,839 字符 / 17 页）。
  - `E:\dsh\scripts\pdf-extract.py` **不存在**，使用了你提示的备选路径 `E:\dsh\tmp-moe\pdf-extract.py`。
- **图表未读取**：三篇的图（Fig. 2–10、Fig. 1–4、Table 2–4）中**只有被正文文字复述的数字**进入了本分析。**图内的具体矩阵值（如 EmoChat Fig. 4 的 7×7 转移概率矩阵、Fig. 6 的完整混淆矩阵、Fig. 2B/2C 的 item 级热图）没有逐一读出**，需要精确数值时应直接看原图。
- **一处原文内部矛盾已标注**：EmoChat 正文类别识别的 "+7%" 与 Table I 的 5.86 pt 不符（见 §6.1 / §10 第 8 条）。
- **最大的一处与预期的偏差已在前文多处标注**：nihms-2194640 与"LLM 情绪对话"无关；EmoChat 非 LLM 且不生成回应。**只有 genagents 完全符合"用 LLM 做情绪/心理健康对话（仿真）"这个描述。**
