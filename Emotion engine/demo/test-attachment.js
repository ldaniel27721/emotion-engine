// ⭐ 验证 2026-10-12 裁定：傲娇 = 对人事物的【反馈路径】（不限恋爱对象）
//
//   核心：把"对象特定"抽象为【在意程度】——
//         越在意 → 越怕被看穿 → 抑制越强（s 越低）
//
// 用法：node test-attachment.js
'use strict';

const { Tsundere, SUBTYPE } = require('../src/tsundere');
const { V } = require('../src/space');
const { Mu, PRESETS } = require('../src/mu');

const hr = s => '\n' + '═'.repeat(96) + '\n' + s + '\n' + '═'.repeat(96);
const sub = s => '\n' + '─'.repeat(96) + '\n' + s + '\n' + '─'.repeat(96);

console.log(hr('⭐ 在意程度 → 抑制强度'));
console.log(`
  裁定（设定者 2026-10-12）:
「傲娇对象并非恋爱对象，它是一种人格特质，是一个对人事物的反馈路径」

  ⇒ 建模: s = clamp( s₀ + 状态 + 事件 + 对象偏移 + 疲劳 )
          对象偏移 = −0.35 × 在意程度
          ⭐ 越在意 → 抑制越强
`);

// ⭐ 同一角色，对不同在意度的对象
const mk = () => new Tsundere({ subtype: ['Tsundere'] });
console.log('  ' + '对象'.padEnd(26) + '在意度'.padEnd(10) + 's'.padEnd(10) + '表层行为');
console.log('  ' + '-'.repeat(82));
const targets = [
  ['陌生人 / 路人',        0.00, '不抑制 —— 懒得装'],
  ['普通同事',             0.25, '轻度抑制'],
  ['一起出过任务的同伴',     0.50, '明显抑制（桑多涅对哥伦比娅 ≈ 这里）'],
  ['在意的人',             0.75, '强抑制 —— 开始"嘴硬"'],
  ['最重要的人',           1.00, '最强抑制 —— "说的和想的不一样"'],
];
for (const [name, att, note] of targets) {
  const t = mk(); t.setAttachment(att);
  console.log('  ' + name.padEnd(24) + att.toFixed(2).padEnd(10) + t.s.toFixed(3).padEnd(10) + note);
}

console.log(hr('⭐ 桑多涅的还原'));

console.log(sub('场景一 · 无人的庭园（哥伦比娅失踪后）'));
{
  const t = new Tsundere({ subtype: ['Tsundora'] });   // 冻原型
  t.setAttachment(0.55);                                // 同伴级在意
  t.apply('unobserved');                                // 无人在场（哥伦比娅不在）
  console.log(`
  文本:
    [派蒙] 桑多涅！你怎么会在这里？
    [「木偶」] 随便出门散散心不行吗？        ← 否认动机
    [「木偶」] 算了吧，今天心情不好，说出来的话不会好听。  ← 拒绝但给理由
    [「木偶」] 而且我看，这里最不需要的就是安慰。          ← 在压自己的需要

  模型:
    亚型     = Tsundora（冻原型，s₀ = 0.10）
    在意度   = 0.55（哥伦比娅是同僚/朋友）
    场合     = alone
    ⇒ s      = ${t.s.toFixed(3)}
    ⭐ 预测: 表层极冷淡（"随便散心"），但【行为】是来到她失踪的地方
    ⭐ 泄露通道 = none/action —— ⭐ 与文本一致`);
}

console.log(sub('场景二 · 茶会的再邀（内心独白直接对立）'));
{
  const t = new Tsundere({ subtype: ['Tsundora'] });
  t.setAttachment(0.60);
  t.apply('alone');
  console.log(`
  文本（括号=内心，无括号=说出口）:
    [「少女」] 谢谢你的茶，桑多涅。我喜欢和你一起度过的时光。
    [「木偶」] （再这么坐一会儿吧。）      ← ⭐ 内心
    [「木偶」] 茶会时间该结束了。          ← ⭐ 嘴上

  ⭐⭐⭐ 这是【里层/表层分离】的直接文本证据 —— 游戏用括号标出了里层
  ⇒ 用我们的模型表达:
        E_inner = μ + (真实偏移)
        E_outer = μ + s·(E_inner − μ)
        若 s 低 → 落差大 → "再坐一会儿" 被压成 "该结束了"
    s = ${t.s.toFixed(3)}  ⇒ 落差 = ${(1 - t.s).toFixed(3)}（相对里层）`);
}

console.log(sub('场景三 · 桑多涅对哥伦比娅唱歌的评价'));
{
  console.log(`
  文本:
    [「少女」] …她说我唱得很好听，但那时我加入「愚人众」不久，
               她说其他人听到我唱歌有时会紧张。
    [旅人] （这才是主要原因吧！）        ← 哥伦比娅提到"她白天要补觉"
    [「少女」] 后来我就只在晚上到桑多涅门口去唱歌。但还是被她赶走了…

  ⭐ 结构:
      内部评价 = 「唱得很好听」      ← 里层（正面）
      外部行为 = 不让唱 / 赶走        ← 表层（否定）
      ⭐ 而且给了【两个理由】——一个体面、一个真实

  ⇒ 对应模型: 里层 E_inner 是正的，但 s 低 ⇒ 表层表现为拒绝
     ⭐ 而"她唱得很好听"这句【还是说出来了】—— 说明 s 不是 0，
        而是"能说出评价，但说不出'我想听'"`);
}

console.log(hr('⭐ 与 wiki 定义的对照'));

console.log(`
  wiki 的判据（the-dere-types）:
    ① intentional
    ② ⚠️ towards their 【love interest】     ← 这一条是 wiki 的限制
    ③ 区分真实感受与公开形象
    ④ 在 tsun / dere 间切换

  ⭐ 设定者裁定（2026-10-12）覆盖第②条:
    「傲娇对象并非恋爱对象，它是一种人格特质，
      是一个对【人、事、物】的【反馈路径】」

  ⇒ 修正后的判据:
    ① intentional（故意的，不是失控）
    ② 对【在意的人/事/物】（在意程度调制）
    ③ 区分真实感受与公开形象     ← 核心，保留
    ④ 在 tsun / dere 间切换
    ⑤ ⭐ 是一种人格特质 = 对人事物的反馈路径

  ⭐ 好处: 这条修正【去掉了一个不自洽的额外假设】——
    wiki 观察到的"只对喜欢的人冷"，本来就只是
    "在意程度高 → 怕被看穿 → 抑制强" 的一个特例。
`);

console.log(hr('⭐ 反馈路径的结构'));

console.log(`
  傲娇 ≅ 一条处理管道（不是一种关系状态）

     输入: 对某对象的【情感投入 / 在意程度】
        ↓
     处理: 抑制（越在意 → 越怕被看穿）
        ↓
     输出: 表层（冷淡/否认/抱怨） + 里层（靠泄露通道外泄）

  ⭐ 这条管道可作用于任何人际关系:
     对恋人  → 经典 tsundere（wiki 收录的那些）
     对同伴  → 桑多涅（wiki 排除，但机制相同）
     对用户  → ⭐ 我们的陪伴型角色
     对事物  → 也可能（对某件在意的事，嘴硬不承认）

  ⭐ 而在意程度的来源是【记忆】——
     与 μ 的慢漂移同源，两者都由记忆承载。
`);

console.log(hr('⭐ 对我们引擎的意义'));
console.log(`
  ✅ 不必把"傲娇"绑定到恋爱关系 ⇒ 陪伴型角色成立
  ✅ s 多了一个连续调制量 attachment ∈ [0,1]
  ✅ attachment 的来源是【记忆】（#43）
  ✅ 桑多涅的泄露通道 = action（行动泄露）—— 对应 wiki 的 Tsun-Ama 型
  ⚠️ 她的亚型更接近 Tsundora（s₀ = 0.10，「a higher state」）
`);
