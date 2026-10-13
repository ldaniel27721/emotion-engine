# 引用文献清单（papers/）

> ⚠️ **本目录在公开镜像里只有这一份清单，没有 PDF。**
> 原始文献是第三方版权材料（Elsevier / Springer / IEEE / Nature 等），本项目**不分发**，
> 只在此登记「用了什么、用在哪、出处在哪」。本地研究工作副本里 `papers/` 才带原文。
>
> 填写规则：**只写本地文件里能核到的信息**；核不到的字段一律标 `【未核】`，不猜。
> 短键（如 `SMC2019` / `brainsci-13-01053`）是 `Emotion engine/docs/` 里引用的别名。

**怎么用**：`docs/` 里出现短键 → 来这里查完整引用 → 需要原文时按 DOI 自行获取。
**引用纪律**：证据分三级（见 `docs/07-证据分级与裁定权.md`）——学术层约束 A1–A4 机制；
wiki 之类亚文化语料只作行为判据；涉及人格的一切最终权威在设定者。

---

## A · 理论基座（AET / 评价 / 建构情绪 / 维度模型）

| 短键 | 完整引用 |
|---|---|
| **AET** | Weiss, H. M., & Cropanzano, R. *Affective Events Theory: A Theoretical Discussion of the Structure, Causes and Consequences of Affective Experiences at Work.* 出处【未核，书章/期刊】 |
| **moors2013** | Moors, A. (2013). *On the causal role of appraisal in emotion.* Emotion Review. DOI: 10.1177/1754073912468165 |
| **barrett2016** | Barrett, L. F. (2016). *The theory of constructed emotion: an active inference account of interoception and categorization.* 出处【未核】 |
| **topdown2025** | Mohanty, A., et al. (2025). *Top-down influences on the perception of emotional stimuli.* Nature Reviews Psychology. DOI: 10.1038/s44159-025-00446-w |
| **russell1980** | Russell, J. A. (1980). *A Circumplex Model of Affect.* Journal of Personality and Social Psychology, 39(6), 1161–1178. |
| **EvidenceforaThree-factorTheory** | Russell, J. A., & Mehrabian, A. (1977). *Evidence for a Three-Factor Theory of Emotions.* Journal of Research in Personality, 11(3), 273–294. |
| **mehrabian1991** | Mehrabian, A. (1991). *Outline of a General Emotion-Based Theory of Temperament.* 出处【未核】 |

本地文件：`Affective_Events_Theory_A_Theoretical_Discussion_o.txt` · `moors2013.txt` · `barrett2016.txt` ·
`Top-down-influences-on-the-perception-of-emotional-stimuli.txt` · `russell1980.pdf/.txt` ·
`EvidenceforaThree-factorTheory.pdf/.txt` · `mehrabian1991.pdf/.txt`

用途：A1 空间（PAD 三轴）· A2 动力学（评价→ΔE）· A3 μ 的 precision · 八型/12 类的维度依据。

---

## B · 情绪衰减 / 习惯化（A2 的定量依据）

| 短键 | 完整引用 |
|---|---|
| **SMC2019** | Sekoguchi, Sakai, & Yanagisawa (2019). IEEE SMC 会议论文（题名【未核】，PDF 元数据无标题）；主题：新颖性接受度、贝叶斯信息增益＝唤醒、Berlyne 唤醒势 |
| **brainsci-13-01053** | Zhang, X., Xu, M., Yang, X., & Yang, Y. (2023). *Individual Differences in Emotion Attenuation Brought by Indirect Replies Is Related to Resting-State Brain Activity.* Brain Sciences, 13(7), 1053. DOI: 10.3390/brainsci13071053 |
| **s00406** | Rösner, C., et al. (2023). *Resilience as a predictor of habituation.* European Archives of Psychiatry and Clinical Neuroscience. DOI: 10.1007/s00406-023-01658-y |
| **s13428** | Daniel, K. E., et al. (2022). *Stability and spread: A novel method for quantifying transitions within multivariate binary time series data.* Behavior Research Methods. DOI: 10.3758/s13428-022-01942-0 |
| **习惯化（Haj-Ali）** | Haj-Ali, H., et al. (2025). *Escalating risk-taking is linked to emotional habituation.* Communications Psychology. DOI: 10.1038/s44271-025-00319-1 |
| **习惯化（Déniz 2004）** | Déniz, O., Lorenzo, J., & Hernández, M. *A Simple Habituation Mechanism for Perceptual User Interfaces.* 出处【未核】（2004 年稿） |
| **强度（preprint）** | Müller, C. L., Zygar-Hoffmann, C., et al. (2025-09-29). *Emotional Intensity as a Predictor of Emotion Regulation Strategy Choice and Perceived Attenuation of Unpleasant Emotions.* **Preprint，未经同行评审** |
| **srep / HMM** | Chen, X., & Li, J. (2025). *Hidden markov modeling of emotional state transitions in interactive installation art.* Scientific Reports. DOI: 10.1038/s41598-025-20113-7 |
| **yin2021** | Yin, F., et al. (2021). *Modelling the dynamic emotional information propagation and guiding the public sentiment in the Chinese Sina-microblog.* Applied Mathematics and Computation, 396, 125884. DOI: 10.1016/j.amc.2020.125884 |

本地文件：`SMC2019_449.txt` · `brainsci-13-01053.txt` · `s00406-023-01658-y.txt` · `s13428-022-01942-0.txt` ·
`Escalating-risk-taking-is-linked-to-emotional-habituation.txt` · `habituation.txt` ·
`PrePrint_Manuscript_Emotional_Intensity_Choice_Success.txt` · `srep.txt` ·
`41598_2025_Article_20113-p7-transition-matrix.png`（srep 论文的插图）· `yin2021.txt`

用途：ρ 与 h(n) 的拆分（`docs/03` §二③）· 习惯化 β≈−0.06/trial、α≈0.93–0.96 · 策略缩放 g（间接回复 ≈0.35）。

---

## C · PAD / 维度模型的工程应用

| 短键 | 完整引用 |
|---|---|
| **robot-emotion-pad** | Gao, Q., Wang, K., & Liu, H. *A Robot Emotion Generation Mechanism Based on PAD Emotion Space.* Springer 书章 18（DOI: 10.1007/978-0-387-87685-6_18），年份【未核】 |
| **memristive-pad** | Zhang, M., Wang, C., Sun, Y., & Li, T. *Memristive PAD three-dimensional emotion generation system based on D-S evidence theory.* 期刊/年份【未核】（Springer 排版稿） |
| **mti / STEM-EVA** | Duan, S., Zhang, W., Li, L., Zhu, T., Zhao, F., Li, F., & Liang, H. *PAD-Guided Multimodal Hybrid Contrastive Emotion Recognition upon STEM-EVA Dataset.* Multimodal Technologies and Interaction（MDPI），年份【未核】 |
| **JOC2901-09** | Chen, Y., & Cui, Y. (2018). *Describing the Emotional Model of PAD Based on Consistent Covering Granule.* Journal of Computers, 29(1), 99–111. DOI: 10.3966/199115992018012901009 |
| **facebook-pad** | Hall, M., Elliott, K., & Meng, J. *Using the PAD (Pleasure, Arousal, and Dominance) Model to Explain Facebook Attitudes and Use Intentions.* The Journal of Social Media in Society, 6(1), p.144. 年份【未核】 |
| **online-review-pad** | Xu, W., Yao, Z., He, D., & Cao, L. *Understanding online review helpfulness: a pleasure-arousal-dominance (PAD) model perspective.* 出处与年份【未核】（AJIM 2023 投稿稿） |
| **artificial-emotion-model** | Tian, Z., Chen, X., & Jiang, D. (2021). *An Artificial Emotion Model for the Mutual Mapping Between Discrete State and Dimensional Space.* Journal of System Simulation, 33(5), Article 7. DOI: 10.16182/j.issn1004731x.joss.20-0007 |
| **pad-virtual-agent** | Peña, L., Peña, J.-M., & Ossowski, S. *Representing Emotion and Mood States for Virtual Agents.* Springer LNCS（DOI: 10.1007/978-3-642-24603-6_19），年份【未核】 |

本地文件：`978-0-387-87685-6_18.pdf/.txt` · `ND_PAD_manuscript.pdf/.txt` · `mti-10-00038-v2.pdf/.txt` ·
`JOC2901-09.pdf/.txt` · `pkpadmin,+Journal+manager,+JSMS0601Hall.pdf/.txt` · `finalversion.pdf/.txt` ·
`viewcontent.pdf/.txt` · `10.1007@978-3-642-24603-619.pdf/.txt`

用途：离散情绪 ⇄ 维度空间的互映（A4 的两轴映射）· PAD 在真实场景里的可测性。

---

## D · 对话系统 / 社交机器人（工程对照）

| 短键 | 完整引用 |
|---|---|
| **emochat** | *EmoChat: Bringing Multimodal Emotion Detection to Mobile Conversation.* 2019 5th Int. Conf. on Big Data Computing and Communications (BIGCOM). DOI: 10.1109/BIGCOM.2019.00037 |
| **p1908** | Xie, Y., Svikhnushina, E., & Pu, P. (2019). *A Multi-Turn Emotionally Engaging Dialog Model.* 出处【未核】（ACM 投稿稿） |
| **2106** | Wen, Z., Cao, J., Yang, R., Liu, S., & Shen, J. *Automatically Select Emotion for Response via Personality-affected Emotion Transition.* 出处/年份【未核】 |
| **fnbot** | Lara, B., et al. (2022). *Grounding Context in Embodied Cognitive Robotics.* Frontiers in Neurorobotics, 16, 843108. DOI: 10.3389/fnbot.2022.843108 |
| **tom-mental-state** | *A Systems-Theoretic Approach to Mental State Estimation for Theory-of-Mind-Aware Social Robots.* IEEE Access, 13 (2025). DOI: 10.1109/ACCESS.2025.3607165（作者【未核】） |
| **elmo-emotion** | *Emotion Analysis in Human–Robot Communication With ELMO Robot Using Deep Learning.* IEEE Access, 14 (2026). DOI: 10.1109/ACCESS.2026.3678983（作者【未核】；`docs/03` 称 Machova et al.） |
| **wardhana** | Wardhana, A. K., Ferdiana, R., & Hidayah, I. (2021). *Empathetic Chatbot Enhancement and Development: A Literature Review.* 2021 Int. Conf. on AI and Mechatronics Systems (AIMS). DOI: 10.1109/AIMS52415.2021.9466027 |
| **nihms2194640** | Mote, J., Gard, D. E., Mueser, K. T., & Fulford, D. (2026). *Positive affect during social interactions predicts goal progress and social motivation in daily life for people with schizophrenia.* Schizophrenia Research, 296, 54–59. DOI: 10.1016/j.schres.2026.07.005 |

本地文件：`emochat.txt` · `p1908.txt` · `2106.pdf/.txt` · `fnbot-843108.txt` ·
`tom-mental-state.txt` · `elmo-emotion.txt` · `wardhana.txt` · `nihms2194640.txt`

用途：对话引擎的情绪选择、共情策略、ToM 状态估计——**对照**用途，不构成 A1–A4 的机制依据。

---

## E · 情感分析方法与通信行为（旁证）

| 短键 | 完整引用 |
|---|---|
| **Hatice Gunes2013** | Gunes, H., & Schuller, B. (2013). *Categorical and dimensional affect analysis in continuous input: Current trends and future directions.* Elsevier（期刊名【未核】） |
| **noller1980** | Noller, P. (1980). *Misunderstandings in Marital Communication: A Study of Couples' Nonverbal Communication.* Journal of Personality and Social Psychology, 39(6), 1135–1148. |
| **clore1975** | Clore, G. L., Wiggins, N. H., & Itkin, S. (1975). *Gain and Loss in Attraction: Attributions from Nonverbal Behavior.* Journal of Personality and Social Psychology, 31(4), 706–712. |
| **fcomp** | Corrales-Paredes, A., et al. (2022). *The emotions effect on a virtual characters design – A student perspective analysis.* Frontiers in Computer Science, 4, 892597. DOI: 10.3389/fcomp.2022.892597 |
| **applsci** | Wang, X., & Zhang, L. (2025). *Emotional Dynamics in Social Interactions: A Multi-Strategy Synergy Model.* Applied Sciences, 15, 4960. DOI: 10.3390/app15094960（卷期据文件名 applsci-15-04960） |
| **genagents** | *LLM-Based Generative Agents Simulate Mental-Health Trajectories Under Adverse Socio-Environmental Conditions.* **Preprint**（Research Square）. DOI: 10.21203/rs.3.rs-9291631/v1 |

本地文件：`Hatice Gunes2013.pdf/.txt` · `noller1980.pdf/.txt` · `clore1975.pdf/.txt` · `fcomp.txt` ·
`applsci.txt` · `genagents.txt`

---

## ⚠️ F · 明确**不可**作为权威引用的

| 短键 | 情况 |
|---|---|
| **The Equation of Human Emotion（Mageed）** | 非同行评审的自助预印本（Zenodo record 18319415）。全篇仅 1 条编号方程且右端算子 ℱ **完全未定义**；零处 decay / half-life / 拟合；56 页里 36 页是参考文献且自引 ≈97%；Mehrabian / Russell / Scherer / Ekman / Barrett / Lazarus / Frijda 等经典情绪理论引用**全为 0**。⇒ **绝不可列为 A2/A3 的权威引用**（详见 `docs/03` §五） |
| **Equation 里的 Fig.24 阈值** | 图内 `\|i\|>0.75` 是**单轴硬阈值**，与本项目的「向量范数 + 卡方置信椭球」层次不同，混用会导致量纲错误 |

本地文件：`TheEquationofHumanEmotion-DemystifyingLatentFeelingsThroughMathematics.txt`

---

## G · 尚未识别（需人工确认）

| 文件 | 情况 |
|---|---|
| `ap2024143_341134453.pdf` | 只有 PDF、无文本抽取，元数据不足以确认题名与出处 ⇒ 【未核】 |

---

## 复现链（怎么从 PDF 得到上面的清单）

```bash
py -3 scripts/pdf-extract.py <pdf> <out.txt>            # 普通文本
py -3 scripts/pdf-formula-extract.py <pdf> <outdir>     # 多列表必须用 bbox 版
```

⚠️ 方法教训（`docs/09` 记过）：**多列表 PDF 必须用 bbox 抽取器**——`get_text()` 会把族标题排到文件末尾、
把词错归给前一个族。抽取出来的 `.txt` 头部通常保留 PDF 元数据（title / author / DOI），
本清单的引用信息就是这么核出来的。
