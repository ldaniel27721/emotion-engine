# dsh-emotion-engine

把 **Emotion Engine** 接进 DSH 会话的插件（实验接入层，随分支 `spec/emotion-engine-plugin` 走）。

它做的三件事，正好补上「驱动是假的」那一层钩子：

| # | 做什么 | 挂点 |
|---|---|---|
| ① | 每轮把引擎算出的 `E_inner / E_outer / s / 八型 / 残余情绪记忆` 注入 runtime-context | `systemPrompt.context()`（order 135，紧跟 time-context 的 130） |
| ② | 提供 `emotion_appraise` 工具：模型把本轮评价写回去 → 引擎推进 → 新状态回给模型 | `ctx.tools.register(defineTool(...))` |
| ③ | 每条情绪事件写进 **mnemon**（跨会话长期记忆）；本地账本仍是可重放的真相 | `mnemon import`（独立进程，不挡回复） |

外加三条 `/` 命令：`/emotion`（看状态）、`/emotion-reload`（从账本重放）、`/emotion-backup`（另存账本）。

---

## 一、为什么是「账本 + 重放」而不是「存档」

docs/15 §4 的裁定：v1 公式之下**递推写法失效**，事件账本从「附加模块」变成引擎的必需组件。
好消息是引擎**确定性**——所以状态根本不需要序列化：

```
~/.dsh/emotion-engine/ledger.jsonl    ← append-only，每轮一行（评价 + 摘要 + 触发词）
        │  启动/重放
        ▼
   Character（引擎）+ EmotionMemory（情绪残余）
        │
        ▼
   当前 E / s / 八型   →  注入 + 工具返回
```

进程被杀、DSH 重启、换个会话，都只是「再放一遍」而已；`/emotion-reload` 手动放。

---

## 二、安装（⚠️ 必须在**另一个会话/终端**做）

profile patch 是热加载的；在正在对话的会话里改配置，会把那条会话的工具面当场换掉（2026-10-12 出过一次）。

```powershell
# ① 把插件放到【没有空格】的稳定路径（pnpm 对带空格的 link 路径不友好）
git -C E:\dsh\_herta-clone worktree list          # 看清现有 worktree
Copy-Item -Recurse 'E:\dsh\_herta-plugin\Emotion engine\plugin\dsh-emotion-engine' 'E:\dsh\dsh-emotion-engine'

# ② 备份 profile 清单（pnpm 每次会顺带裁掉 lockfile 外的孤儿包）
$stamp = Get-Date -Format 'yyyyMMdd-HHmm'
Copy-Item C:\Users\Admin\.dsh\profiles\web\package.json "C:\Users\Admin\.dsh\profiles\web\package.json.bak-$stamp"

# ③ 装（会自动把包名追加进 dsh.profile.bundles，不用手改）
dsh plugin --profile web add link:E:\dsh\dsh-emotion-engine
```

**装完是惰性的**：bundle patch 里那条是 `disabled: true`，不启用就什么都不会发生。

## 三、启用 / 回滚

启用（在另一个会话或纯终端里做，改的是 profile 的 patch）：

```yaml
# C:\Users\Admin\.dsh\profiles\web\cordis.patch.yml  追加两行
- id: emotion-engine
  disabled: false
```

确认是否生效：新开一条会话，看系统提示里有没有 `emotion-engine (dsh-emotion-engine):` 块，
或直接敲 `/emotion`。**注意**：`system/message` 记录只在会话首建时写，不能拿它当判据。

回滚（三选一，从轻到重）：

```powershell
# ① 只停用：删掉上面加的那两行（改回 disabled 默认）
# ② 卸载包：
dsh plugin --profile web remove dsh-emotion-engine
# ③ 连清单一起还原（最干净）：
Copy-Item "C:\Users\Admin\.dsh\profiles\web\package.json.bak-<stamp>" C:\Users\Admin\.dsh\profiles\web\package.json -Force
```

状态数据（`~/.dsh/emotion-engine/`）**不会**被上述操作删掉，账本留着随时可重放；要清就手动删目录。

---

## 四、配置项（都可不写）

| 键 | 默认 | 说明 |
|---|---|---|
| `stateDir` | `~/.dsh/emotion-engine` | 账本与日志目录 |
| `engineRoot` | 自动找（本包的 `../../../` → `E:\dsh\_herta-clone\Emotion engine`） | 指错了会**大声报错**，不静默换一个 |
| `character` | `{ name:'傲娇大肥鱼', sigma:0.5, muPreset:'dependent' }` | 引擎角色参数 |
| `memory` | `{ S0:30, k:4, topK:4, minR:0.05 }` | 情绪残余（S 挂评价层） |
| `mnemon.enabled` | `true` | 关掉就只留本地账本 |
| `mnemon.blocking` | `false` | 默认不挡回复；写失败只记 `mnemon.log` |
| `mnemon.cli` | 自动找 | mnemon 的 `bin/mnemon.js`（**不是** .cmd/.ps1 shim） |
| `mnemon.dataDir` | `null`（用 CLI 默认 = `E:\dsh\memory`） | 测试时指向临时目录即可不污染真库 |

## 五、工具入参速查（`emotion_appraise`）

```
summary*  一句话摘要（进记忆账本）        emotion  情绪词（一个词）
intensity 0–1（S 挂在这个值上）           eventKey 事件类别（习惯化计数用）
九项评价：relevance / congruence(−1–1) / importance / agency(self|other|environment|none)
          coping / certainty / expectancy(0 极坏,1 极好) / intentionality / currentArousal
triggers  表达层触发词，逗号分隔：audience / alone / unobserved / calledOut / flustered / impulse / intimacy
strategyScale  策略缩放 g（间接回复 ≈0.35）    senderId  说话人（记忆按人分桶）
```

## 六、自测

```powershell
cd E:\dsh\dsh-emotion-engine      # 或仓库里的 plugin\dsh-emotion-engine
npm test                          # 或 node --test  —— 16 项，含引擎/重放/插件面
node --test test/mnemon.integration.mjs   # mnemon 端到端（只写临时库，不碰 E:\dsh\memory）
```

⚠️ 踩过的坑（已写成回归测试）：`strategyScale` 传 `null`（而不是 `undefined`）会让
`g = gNull` ⇒ `ΔE` 被乘成 0 ⇒ **E 永远不动**。账本里存的是 `null`，重放时必须归一。
