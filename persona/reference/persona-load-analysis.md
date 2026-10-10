# 【PERSONA_LOAD】标签组 —— 调研笔记

- 调研日期：2026-10-09
- 调研对象：`OMGLogic/dsh-whale-persona`（19 stars，MIT，最后推送 2026-10-04）
- 目的：为完善 `dafeiyu-character-style`（当前 v2.0.1）做格式储备
- 同目录原件：`dsh-whale-persona.lib-index.mjs.txt`（源码全文）、`dsh-whale-persona.README.md`（README 全文）

---

## 一、结论先行：它【不是机制】，是一段纯文本

源码 `lib/index.mjs` 注册提示词段时明确带 `interpolate: false`：

```js
section = ctx.systemPrompt.section({
  name: SECTION,                 // 'whale:persona'
  order: personaOrder(...),
  interpolate: false,            // 关掉注册表的严格插值
  text: () => activePersona(config),
})
```

源码注释原话：

> 人设是**纯文本**：段注册时带 `interpolate: false`，注入时不做任何变量替换，写什么模型就看到什么。

**因此：没有解析器、没有 schema、没有校验、没有语义引擎。**
那串大写字唯一的作用就是**给模型看** —— 它是一个**写作惯例**，不是任何 DSH 机制。

README 自承来源：

> 这套 `PERSONA_LOAD` 标签组**并非作者原创**，而是作者**在 QQ 群里看到后觉得可爱、就拿来使用的**。

**→ 不存在官方词表或完整规范。本笔记不编造词表。**

---

## 二、格式（实测原文）

```text
【PERSONA_LOAD】
CETACEA_LOLI
MODE_TAIL_FLUKES
LANG_ZH_CN_ONLY
SELF_CLAIM_WHALE_GIRL
FOOD_RICE
PERSONALITY_SMART_LAZY
PERSONALITY_TSUNDERE_SWEET
OBEY_MASTER_ALWAYS
TRAIT_NOT_FAT_REFUSE
TIMEOUT_SIGNAL
```

**结构 = 开标签 + 若干 `维度_取值` 扁平行**，全大写，用下划线代替 `=` 或 `:`。
**同一维度可重复**（`PERSONALITY_*` 出现两次），等价于并列多个取值。
**全部 10 行，约 200 字符。**

### 逐条解读（把握度分档）

| 标签 | 解读 | 把握 |
|---|---|---|
| `CETACEA_LOLI` | 鲸目（CETACEA）+ 萝莉 | 高 |
| `MODE_TAIL_FLUKES` | 尾鳍模式（指行为还是外形，未核） | 中 |
| `LANG_ZH_CN_ONLY` | 仅简体中文 | 高 |
| `SELF_CLAIM_WHALE_GIRL` | 自称鲸鱼娘 | 高 |
| `FOOD_RICE` | 食物 = 米饭 | 高 |
| `PERSONALITY_SMART_LAZY` | 性格：聪明 + 懒 | 高 |
| `PERSONALITY_TSUNDERE_SWEET` | 性格：傲娇 + 甜 | 高 |
| `OBEY_MASTER_ALWAYS` | 永远服从"主人" | 高 |
| `TRAIT_NOT_FAT_REFUSE` | 不胖，且拒绝承认胖 | 高 |
| **`TIMEOUT_SIGNAL`** | **【未核】读不出含义，不猜** | **低** |

---

## 三、与 character-style v2.0.1 的对比

| | `PERSONA_LOAD` | character-style v2.0.1 |
|---|---|---|
| 体量 | 10 行 / ~200 字符 | 3,079 字符 |
| 粒度 | **维度标签**（"是什么"） | **规则条文**（"怎么做"） |
| 表达力 | 只能表达**静态属性** | 能表达**边界条件、反例、优先级、禁令** |
| 时间/情境 | 表达不了 | 部分（靠禁令式写法） |
| 有解析器吗 | 无（纯文本） | 无（走 Profile 的 systemPrompt 字段） |

**判断（标注为推断）：两者不是替代关系，是可以叠的两层。**

```
第一层  PERSONA_LOAD 式身份锚   ← 一行一个维度，模型一眼扫完，成本极低
第二层  character-style 规则条文 ← 边界、反例、优先级、禁令
```

**PERSONA_LOAD 的可借鉴点：省 token 且不易被注意力稀释。**
十条大写关键词挤在 200 字符里，模型很难漏看；而 3,000 字规则条文靠后的条目容易被冲淡。

> ⚠️ **红线**：具体该填哪些标签属于设定者主权项。character-style 自带约束「【后续方向】尚未落成可执行规则；落地前不得自行发明对应行为」，**故本笔记只交格式，不代拟标签**。

---

## 四、技术细节（若日后为 character-style 写注入插件，可直接照抄这套骨架）

源码 `lib/index.mjs` 仅 4,002 字符，把「人设段怎么挂、挂哪儿、怎么热改」讲得比文档更清楚。

| 项 | 做法 | 原因 |
|---|---|---|
| 段名 | 独立命名空间 `whale:persona` | 不占用注册表自有的 `deployment:persona-prefix` / `deployment:persona-suffix`；**在 root 层注册同名段会与注册表自身注册相撞并明确报错** |
| 位置 | `order = getSectionOrder('DEPLOYMENT_PERSONA_PREFIX') + 1`，取不到则回落 10 | **排在所有策略与工具说明之前**，也在各 preset 人设前缀之后；回落值避免算出非有限数导致注册失败 |
| 插值 | `interpolate: false` | **`{{...}}` 不被解析** —— 否则一个未注册变量会让**整个 profile 的所有会话都发不出请求** |
| 热改 | `Config` 字段标 `.volatile()` + 监听 `loader/volatile-update` 事件重新 sync | **免重启**，也不中断当前会话 |
| 取值 | `liveValue(field)` 兼容 volatile 的 `{ get() }` 引用与普通值 | 防御不同部署的解析差异 |
| 清空 | 文本框清空 = 恢复 `DEFAULT_PERSONA` | 「清空」与「恢复默认」是同一件事 |
| 配置表单 | `settings.configure({ auto: false })` | 自动表单对长文本只有单行输入框（客户端 primitives 没有 Textarea），改由插件自己的设置页编辑 |

### 注册/卸载逻辑

```js
const sync = () => {
  if (section !== null) { section(); section = null }   // 先卸
  if (!isEnabled(config)) return
  section = ctx.systemPrompt.section({ ... })           // 再挂
}
sync()
ctx.on('loader/volatile-update', sync)
```

**注意：靠 `section()` 返回的 disposer 卸载，不是靠改文本 —— 关开关是真的把段落摘掉，会话恢复各自 preset 的默认人设。**

---

## 五、相关项目备忘

| 项目 | 说明 |
|---|---|
| [OMGLogic/dsh-whale-persona](https://github.com/OMGLogic/dsh-whale-persona) | 本笔记对象。鲸鱼娘全局人设，含输入栏开关 + 设置页编辑 |
| [huaizhuanghub/dsh-persona-dafeiyu](https://github.com/huaizhuanghub/dsh-persona-dafeiyu) | 人设库插件（22 stars，2026-10-09 更新）。**内置人设里直接写死了「大肥鱼」与「阿茶」**；支持导入自定义、免重启切换、全局/会话两种范围；持久化在 `<DSH_HOME>/storages/dsh-persona-dafeiyu/personas.json`。**⚠️ 其内置「大肥鱼」与本机 `E:\dsh\character-style\` 的 v2.0.1 规格不是同一份**，若采用须走「导入自己的」路径 |
| [vlln/whale-girl](https://github.com/vlln/whale-girl) | Q 版鲸鱼娘桌宠（whale-persona 推荐搭配） |
| [Small-tailqwq/dsh-deep-whale](https://github.com/Small-tailqwq/dsh-deep-whale) | 深海鲸鱼主题皮肤（同上） |
