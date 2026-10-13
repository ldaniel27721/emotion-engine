---
name: emotion-engine
description: 在会话里手动驱动 Emotion Engine —— 读当前情绪状态（E_inner/E_outer/抑制 s/八型/残余情绪记忆）、把本轮评价写回账本推进状态、按需把情绪事件写进 mnemon。不修改任何 DSH 配置，靠每轮自觉调用；装上 dsh-emotion-engine 插件后同样的状态会自动注入，本 skill 则是它的轻量替身。当用户说「跑一下情绪引擎」「按引擎的情绪说」「看看现在 E 是多少」「接上引擎」或要在对话里实际使用情绪状态时使用。
whenToUse: 需要在当前会话里真正使用（而不是演绎）Emotion Engine 的情绪状态时；或用户要求把某轮对话的 appraisal 落进引擎、查看残余情绪记忆、核对某个角色参数/公式的实际输出时。纯闲聊或与情绪模型无关的开发任务不需要。
---

# Emotion Engine · 轻量驱动

**一句话**：三条命令让你在这一轮真的读引擎、真的写回评价 —— 而不是「演得像有引擎」。

## 它不是什么（先看这条）

```
① 引擎是真的   —— 它算的数就是它算的，可复现
② 喂料是你填的 —— appraisal 九项由你（模型）给，引擎【不读文本】
③ 驱动靠自觉   —— 本 skill 不会自动注入；你不跑它，状态就不推进
```

想让它变成「自动」的，那是插件版的活（`plugin/dsh-emotion-engine`，见其 README）。
两者共用同一个账本目录，所以随时可以互换、互不冲突。

## 位置

| 项 | 路径 |
|---|---|
| 引擎源码 | `E:\dsh\_herta-clone\Emotion engine\src\`（v0.1.16-beta，`VERSION` 文件为准） |
| 本 skill 脚本 | 本目录 `scripts/ee.mjs` |
| 状态与账本 | `~/.dsh/emotion-engine/ledger.jsonl`（append-only，可重放） |
| 插件版（如果装了） | `E:\dsh\dsh-emotion-engine\`（分支 `spec/emotion-engine-plugin`） |

脚本会自动找插件的 `lib/bridge.js`；找不到时设 `DSH_EE_PLUGIN=<插件目录>`。

## 四条命令

```powershell
# ① 看当前状态（把输出直接当上下文用）
node scripts/ee.mjs state

# ② 推进一轮 —— ⚠️ appraisal 走文件，不要内联 JSON（PowerShell 会吃引号）
node scripts/ee.mjs step --file examples/appraisal-sample.json
node scripts/ee.mjs step --file x.json --mnemon      # 同时写进 mnemon 长期记忆

# ③ 只看残余情绪记忆（按 R = exp(−Δturn/S) 排序）
node scripts/ee.mjs memory 表情包 --k 4

# ④ 账本路径与轮次
node scripts/ee.mjs ledger
```

`step` 会把新状态整块打出来 —— **照它说话**，不要直读数值给用户。

## appraisal 怎么写（九项 + 三样）

| 字段 | 范围 | 含义 |
|---|---|---|
| `relevance` | 0–1 | 事件与角色关切的相关度 |
| `congruence` | −1–1 | 符合(+)还是阻碍(−)关切 —— **可负**，`valence = congruence × relevance` |
| `importance` | 0–1 | 对角色的重要程度 |
| `agency` | self/other/environment/none | 归因 |
| `coping` | 0–1 | 能否应对 |
| `certainty` | 0–1 | 对情况有多确定 |
| `expectancy` | 0–1 | 原本预期（0 极坏，1 极好） |
| `intentionality` | 0–1 | 对方是否故意（`agency=other` 时才有意义） |
| `currentArousal` | 0–1 | 事件前已被激活的程度 |
| `summary` | 字符串 | 一句话摘要，进记忆账本 |
| `emotion` | 一个词 | 情绪词（开心/害羞/警觉…） |
| `intensity` | 0–1 | 情绪强度 —— ⭐ **S 挂在这个值上**（`S = S0(1+k·intensity)`） |

可选：`eventKey`（事件类别，习惯化计数）、`triggers`、`strategyScale`（间接回复 ≈0.35）、`senderId`。
`triggers` 取值见 `src/tsundere.js` 的 `TRIGGER`：`audience` / `alone` / `unobserved` / `calledOut` / `flustered` / `impulse` / `intimacy`。

## 三条口径（别绕进去）

```
① 这是【情绪的衰减】，不是记忆系统 —— 问的不是「还记得吗」，是「这份情绪还剩多少」
   ⇒ 残余用 R = exp(−Δturn / S)，S 是情绪稳定性
② S 挂【评价层】—— intensity 是模型判断出来的，不是引擎从文本读的
③ 情绪【不分对象】，记忆【按 senderId 分桶】—— 两者作用域刻意不同，不是疏漏
```

## 每次用完自检

- 这一轮**真的**跑了 `step` 吗？没跑就说「按引擎的情绪」，那是演。
- 期望值先算一遍再断言（历史上被「残余最高的第一」打脸过两次）。
- 账本是 append-only：要反悔就 `/emotion-backup` 或直接删目录重来，别手改中间行。

## 相关文档

| 文档 | 内容 |
|---|---|
| `Emotion engine/docs/01-数学模型.md` | A1 空间 / A2 动力学 / A3 底情绪 |
| `Emotion engine/docs/12-情绪记忆插件设计.md` | 情绪残余（S 挂评价层）的完整规格 |
| `Emotion engine/docs/14-情绪衰减公式.md` | v1 公式：E_t − μ = Σ ΔE_i·exp(−Δt/S_i)，为什么必须留事件账本 |
| `Emotion engine/docs/15-会话交接-20261013.md` | 会话交接与三条裁定原文 |
| `Emotion engine/test/README.md` | 离线回放器（把一段真实对话喂进引擎落盘） |
