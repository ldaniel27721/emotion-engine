# 贡献流程 · 所有改动须在 Project 体现

> 本仓库的 Project：**[Herta AI github libary](https://github.com/users/ldaniel27721/projects/2)**
> 规矩：**此后所有改动，都必须在看板上留下痕迹。**

---

## 为什么是双轨制

GitHub 的 Project workflow **只能看见两样东西：issue 和 PR**。
**裸 commit 它看不见。** 所以直接 `push main` 的改动，在看板上不会有任何记录。

```
issue   → 自动收进看板（Auto-add to project，filter: is:issue,pr is:open）
PR      → 同上，且触发 Pull request linked to issue / Pull request merged
关闭    → 触发 Item closed
```

---

## 轨道一 · 待办与裁定（issue）

**所有待办、待裁定项都是 issue。**

- 新建 issue → **自动进看板**（已开启，无需手动操作）
- 标签约定：

| 标签 | 含义 |
|---|---|
| `persona` | 大肥鱼人格规格相关 |
| `todo` | 待裁定 / 待办 |
| `blocked` | 阻塞项 |

- **关掉一项 = 关 issue**，看板会自动流转状态

---

## 轨道二 · 实际改动（PR）

**不再直接 push `main`。** 每次改动走这条：

```bash
# 1. 从最新的 main 开分支
git checkout main && git pull
git checkout -b <type>/<slug>          # 例：chore/contributing-flow

# 2. 改动 + 提交（commit message 里引用 issue）
git add -A
git commit -m "<简述>

Refs #<issue号>"

# 3. 推分支
git push -u origin <type>/<slug>

# 4. 开 PR（描述里写 Closes）
#    Closes #<issue号>
```

**合并后**：`Pull request merged` 工作流触发 → 看板状态自动流转 → 关联 issue 自动关闭。

### 分支命名

| 前缀 | 用途 |
|---|---|
| `feat/` | 新增内容 |
| `fix/` | 修正 |
| `chore/` | 杂务（流程、配置、文件卫生） |
| `spec/` | 人格规格内容改动 |

---

## 例外：允许直接提交 `main`

**仅限纯机械修正** —— 错字、格式、行尾、`.gitignore` 之类。

即便如此，**也应在相关 issue 下留一条评论说明**，让看板有记录。

---

## 硬约束（人格规格专属）

**人格规格不是普通人写文档，它有额外的纪律：**

1. **未裁定项一律留空**，落地前**不得自行发明对应行为**
2. **一个区一个区过，未完成打标注** ⬜
3. 每项改动**先把生成好的句子展示给设定者，确认后才落盘**
4. 「实测」与「推测」分开放，推测须标【待核】【未核】【这是假设，未证实】
5. **现阶段只改 md，json 等 md 定稿校验后再同步**
6. 改动前先备份

---

## 分工

| | 谁 |
|---|---|
| 建 issue / 建分支 / 改文件 / 提交 / 开 PR / 合并 | **助手可完成** |
| **内容裁定** | **设定者**（助手不自行发明规则） |

---

## 附：当前 Project 已启用的 workflow

```
✅ Auto-add to project              过滤 is:issue,pr is:open → 新 issue/PR 自动进看板
✅ Auto-add sub-issues to project   父项进看板时，子 issue 一并进
✅ Pull request linked to issue
✅ Pull request merged
✅ Item closed / Item reopened
✅ Auto-close issue
✅ Auto-archive items
```
