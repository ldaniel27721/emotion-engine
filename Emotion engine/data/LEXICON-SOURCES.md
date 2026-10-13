# 词库来源与再分发说明

本文件说明 `emotion-lexicon-cn.json` 的原料来自哪里，以及为什么一些原始材料不在本仓。

## 原料（均为第三方已发表材料）

| 原料 | 提供 | 原始材料 |
|---|---|---|
| 605 词表 | 主题轴（19 类） | 整理稿见 `persona/reference/情绪词汇表.md` |
| Emotion-Feelings | 方向轴（10 类 + Calm），10 大类 × 3 强度档 | 原始 PDF **不随本仓分发** |
| EmotionWordsChecklist | 37 个细族 | 原始 PDF **不随本仓分发** |
| R&M 1977 Table 4（Mehrabian & Russell 1977） | 151 词 (P,A,D) 实测坐标 | 原始论文 PDF **不随本仓分发**；抽取结果见 `persona/reference/rm1977-table4.json` |

## 本仓里的到底是什么

`emotion-lexicon-cn.json` 是**二次编译产物**——两轴合并 + 中文映射 + 一致性校验，
不是任何一份原始词表的逐字副本。复现链见 `persona/reference/A4-情绪词库.md` §七。

## 再分发提示

- 原始 PDF 因版权原因**不随本仓分发**（`papers/` 不在公开镜像内）。
- 词库文件按**研究 / 参考用途**保留。若要用于商业场景，请自行核对上列各原料的许可条款。
- `rm1977-table4.json` 是从 1977 年论文表 4 抽取的**数值摘录**，用于交叉校验与复现。
- 本仓不含任何真实会话记录与第三方个人标识；文档中出现的 ID 已替换为占位符。

## 引用

若你在工作中用到 PAD 维度的坐标体系，请引用原文：

> Mehrabian, A., & Russell, J. A. (1974). *An Approach to Environmental Psychology*. MIT Press.
> Russell, J. A., & Mehrabian, A. (1977). Evidence for a three-factor theory of emotions.
> *Journal of Research in Personality*, 11(3), 273–294.
