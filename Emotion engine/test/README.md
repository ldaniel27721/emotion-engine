# `test/` —— 会话回放与审查

把**真实对话**喂进 Emotion Engine，把每一次的**源码计算**与**情绪反馈**落盘，供以后逐次审查。

```
test/
├─ replay.js                     回放器
├─ turns/                        输入：对话轮次 + appraisal
│   └─ session-20261013-qq.json
└─ runs/                         输出：每次回放一份，文件名带时间戳，不覆盖
    ├─ session-20261013-qq-<stamp>.md     人类可读（两张表 + 汇总）
    └─ session-20261013-qq-<stamp>.json   机器可读（全因子）
```

## 用法

在**项目根目录**跑：

```
node test/replay.js test/turns/session-20261013-qq.json
node test/replay.js test/turns/xxx.json --out test/runs
```

## 约定（审查前先读）

| 项 | 说明 |
|---|---|
| **appraisal 谁填** | **模型逐轮直填**，引擎不做文本理解。所以这里记录的是「模型怎么解读这些轮次」，**不是**引擎自动读出的情绪 |
| `congruence` 取值 | **可负**。`valence = congruence × relevance`，负效价必须给负 congruence |
| `triggers` | 表达层触发词，见 `src/tsundere.js` 的 `TRIGGER`：`audience` / `alone` / `unobserved` / `calledOut` / `flustered` / `impulse` / `intimacy` |
| 群聊场景 | 用 `audience`（有观众 ⇒ 抑制增强）。**不要**用 `alone` |
| 一份 turns | 可反复回放；每次生成新的 `runs/` 文件，旧结果保留 |
| 目的 | 「每次对话后」落一份，方便回看引擎在某段真实互动里算出了什么 |

## 输出包含什么

- **结果层**：每轮的 `E_inner`（真感觉）、`E_outer`（说出来的）、`E−μ` 方向与径向强度、八型、抑制 `s`
- **因子层**：`valence` / `intensity` / `α` / `ε` / `ΔE` / `g` / `ρ` / `r` / `h` / `exposure`
- **汇总**：末态、离 μ 最远/最近的两轮、半衰期
