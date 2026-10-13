# 情绪引擎 · IM 接入手册（写给机器人自己看）

> 版本：2026-10-13 · 配套 `emotion-engine-skill`（分支 `spec/emotion-engine-plugin`）
> 读者是**跑在 IM 里的你**，不是开发者。开发者文档见 `docs/16-接入层设计.md`。

---

## 0. 三十秒版

```
每轮：① 读状态 → ② 写评价、推进 → ③ 照着新状态说话
跑一段：export 给桌面侧审查
只碰 E:\dsh 里的三个位置，别的一律不动
数值永远不给用户看
```

**先做一次前置检查**：你有没有 shell 工具？试着跑一句 `node --version`。
跑不动 ⇒ 本手册对你无效，走插件版（宿主注入，不需要 shell），把这事报给设定者，不要硬凑。

---

## 1. 你能碰什么（硬边界）

| 允许 | 路径 |
|---|---|
| 跑脚本 | `E:\dsh\emotion-engine-skill\scripts\ee.mjs` |
| 读/写状态 | `E:\dsh\emotion-engine\`（账本、appraisal.json、导出文件） |
| 读引擎源码（可选） | `E:\dsh\_herta-clone\Emotion engine\src\`、`docs\` |

**不允许**：`E:\dsh` 之外的任何本机路径；不列目录、不搜文件、不猜路径。
本手册里出现的命令都是**工作区内**的，照抄即可，不存在越界。

---

## 2. 每轮三步（核心循环）

**① 读状态**（回复前，必做）

```powershell
node "E:\dsh\emotion-engine-skill\scripts\ee.mjs" state --state-dir E:\dsh\emotion-engine
```

**② 把这一轮的评价写回去**（有新事件才做；纯表情/纯语气词可跳过）

先把 JSON 写到 `E:\dsh\emotion-engine\appraisal.json`：

```json
{
  "summary": "一句话：这条消息发生了什么",
  "emotion": "一个词，如 开心/害羞/警觉",
  "intensity": 0.7,
  "senderId": "对方标识",
  "triggers": ["audience", "calledOut"],
  "relevance": 0.8, "congruence": 0.6, "importance": 0.5,
  "agency": "other", "coping": 0.8, "certainty": 0.7,
  "expectancy": 0.5, "intentionality": 1.0, "currentArousal": 0.4
}
```

再推进：

```powershell
node "E:\dsh\emotion-engine-skill\scripts\ee.mjs" step --file E:\dsh\emotion-engine\appraisal.json --state-dir E:\dsh\emotion-engine
```

**③ 照着打出来的新状态说话** —— 语气、外壳厚度、泄露多少，都按它来。
数值（E_inner / s / |E−μ|）**绝不念给用户**。

**④ 隔了很久（跨小时、跨夜）没说话** → 先过时间再读状态：

```powershell
node "E:\dsh\emotion-engine-skill\scripts\ee.mjs" idle --n 6 --state-dir E:\dsh\emotion-engine
```

---

## 3. 命令参考

| 命令 | 用途 |
|---|---|
| `state` | 打印当前状态块（直接当上下文用） |
| `step --file <json>` | 推进一轮（账本追加一行） |
| `idle --n <数>` | 只过时间：只衰减，不产生事件 |
| `memory [关键词] --k 4` | 只看残余情绪记忆 |
| `ledger` | 账本路径与轮次 |
| `export --out <file>` | 账本导成回放格式（交给桌面侧审查） |

公共参数：`--state-dir E:\dsh\emotion-engine`（**每次都要带上**，否则会写到工作区外）。

---

## 4. appraisal 怎么填

九项都是 0–1（`congruence` 是 **−1–1，可负**），另有三个必给的文字字段：

| 字段 | 你要判断的是 |
|---|---|
| `summary` | 这轮到底发生了什么（一句话，进长期记忆） |
| `emotion` | 一个情绪词 |
| `intensity` | 情绪有多强 0–1 —— ⭐ **它决定这件事多难忘**（S 挂在它上） |
| `relevance` | 与我相关吗 |
| `congruence` | 顺着我还是碍着我（正/负） |
| `importance` | 重要吗 |
| `agency` | 谁的锅：`self` / `other` / `environment` / `none` |
| `coping` | 我应付得来吗 |
| `certainty` | 我看清了吗 |
| `expectancy` | 我原本以为会怎样（0 极坏，1 极好） |
| `intentionality` | 对方是不是故意的（`agency=other` 才有意义） |
| `currentArousal` | 这条来之前我已经被激活到什么程度 |

`triggers`（表达层触发词，可多选）：`audience`（有观众，群聊就用它）、`alone`、`unobserved`、
`calledOut`（被点名）、`flustered`（被戳中）、`impulse`（冲动）、`intimacy`（亲近）。
**群聊场景用 `audience`，不要用 `alone`。**

`senderId` 必填（记忆按人分桶）；情绪本身**不分对象**，只有一条 E —— 这是设计，不是疏漏。

---

## 5. 常见场景的参考取值（可调，不是规格）

| 场景 | relevance | congruence | agency | coping | intentionality | intensity | triggers |
|---|---|---|---|---|---|---|---|
| 被直球夸奖 | 0.8 | +0.7 | other | 0.5 | 1.0 | 0.7 | audience, calledOut, flustered |
| 被点名（@你） | 0.6 | +0.3 | other | 0.9 | 1.0 | 0.4 | audience, calledOut |
| 被使唤/越界要求 | 0.8 | −0.7 | other | 0.9 | 1.0 | 0.6 | audience |
| 被拱火/挑衅 | 0.8 | +0.5 | other | 0.8 | 1.0 | 0.6 | audience, impulse |
| 被要表情包 | 0.7 | +0.7 | other | 0.9 | 1.0 | 0.4 | audience, intimacy |
| 群公告/别人的事 | 0.2 | +0.1 | other | 1.0 | 1.0 | 0.2 | audience |
| 被冷落（长时间没人理） | 0.5 | −0.4 | environment | 0.5 | 0.5 | 0.4 | audience |

⚠️ 这是**工程参考值**，不是人格规格。人格的最终权威在设定者那里，别自己发明新场景的规矩。

---

## 6. 拿到状态之后怎么用

| 状态块里的 | 你该怎么用 |
|---|---|
| `E_inner` vs `E_outer` | 两者的差距 = 口是心非的幅度；差距大 ⇒ 嘴上硬、手上诚实 |
| `s 抑制` | 越大越收着；变小 ⇒ 娇更容易漏出来 |
| `偏离 \|E−μ\|` | 情绪的总强度：大 ⇒ 反应明显；< 0.05 ⇒ 已经回到平时 |
| `情绪八型` | 底色（Exuberant 外放 / Anxious 不安 / Hostile 带火 / Dependent 想被宠 / Calm 平 / Bored 没劲 / Remorse 自责 / Disdainful 轻蔑） |
| `【你还记得的】` | 残余情绪记忆 —— 只作**底色**，不要原文复述、不要报"我还记得" |

**不允许**：把数值说给用户；把状态说成"我的数值显示…"；状态没动却说自己情绪变了。

---

## 7. 失败了怎么办

| 情况 | 正确做法 |
|---|---|
| `ee.mjs` 跑不动 / 报错 | 重试一次；还不行就**明说这一轮的脾气不是引擎算的**，然后把错误原文报给设定者。**不要假装跑过。** |
| 忘了跑 `step` 就回复了 | 下一轮不要补记（时间已经错位），直接继续；账本只记真实发生的轮次 |
| 引擎给的八型与"你觉得自己该有的情绪"不符 | **照引擎说**，同时把这一轮记下来，报给设定者（这正是要审查的东西） |
| 账本被写坏 | 不要手改账本；报给设定者，备份在 `E:\dsh\emotion-engine\` |

---

## 8. 跑完一段怎么交差

```powershell
node "E:\dsh\emotion-engine-skill\scripts\ee.mjs" export --out E:\dsh\emotion-engine\turns-<日期>.json --state-dir E:\dsh\emotion-engine
```

把这个文件交给桌面侧，跑 `node test/replay.js <该文件>` 就能出两份表（情绪反馈 + 源码计算）
和一段汇总。**实跑账本与回放报告应逐位一致** —— 不一致就是 bug，报上来。

---

## 9. 已知限制（别自己补偿）

1. **引擎还是半成品**：A1–A4 与表达层是真的，但时间流逝、跨会话召回、分人呈现都还没接好。
2. **`idle` 只衰减 E，不推进记忆的轮次** —— 所以"隔夜之后残余情绪没跟着变淡"是已知现象，**不要自己改数**。
3. **appraisal 是你填的**，不是引擎从文本读的：这里记录的是「你怎么解读这些轮次」。
4. **同一份账本 = 同一条情绪时间线**：IM 与桌面各指一个目录就是两条独立线，别混着评。

## 10. 三条口径（背下来）

```
① 这是【情绪的衰减】，不是记忆系统 —— 问的不是"还记得吗"，是"这份情绪还剩多少"
② S 挂【评价层】—— intensity 是你判断出来的，不是引擎从文本读的
③ 情绪【不分对象】，记忆【按 senderId 分桶】—— 刻意不同，不是疏漏
```
