# 外恩英语乐园（wai_en）产品与技术规格书

> 面向一年级（6-7 岁、已认识字母、英语零基础）孩子的听说读训练网站。
> 部署：Vercel（国内使用需绑定自定义域名）。技术栈：Next.js + TypeScript + Tailwind CSS。
> 状态：M1 开发中（2026-09 启动）。**本文档随需求更新，始终对齐最新需求。**

---

## 0. 需求追踪表（家长需求 → 功能落点）

| # | 需求（原始提出） | 落点 |
|---|---|---|
| 1 | 一年级孩子练英语**听、说、读** | 课程五环节 Learn→Listen→Say→Read→Play（§3.2）；不涉及写 |
| 2 | **故事**功能 | 绘本阅读器：逐词 karaoke、插画、整页朗读、读后小测（§4.3） |
| 3 | **游戏**功能 | 六个小游戏 + 共用游戏引擎 + 游戏厅（§4.2） |
| 4 | **单词记忆卡片** | 一等功能：翻卡、点读、三档标记、SRS 间隔重复、错词本、每日复习（§4.1） |
| 5 | 孩子已**认识字母** | 课程从字母音复习起步（字母名≠字母音），快速进入自然拼读（§3.1 U0） |
| 6 | **可以互动**、强交互 | 所有内容点按必发声、翻卡/拖拽/点选放置、即时动画音效反馈，无静态展示页 |
| 7 | **主线人物**互动陪伴 | 小狐狸 **Foxy 阿福**：全局悬浮伙伴（点按说话、变表情、双语台词）+ 课内每环节引导（§4.5） |
| 8 | 页面**双按钮：中文和英语** | 所有操作按钮双语标注（「开始 Start」「下一题 Next」…），顺带浸润操作类英文词（§4.6） |
| 9 | **支持 iPad 触屏**与分辨率 | 触屏优先 + 手机/iPad 竖横屏响应式 + 安全区 + PWA 主屏添加（§4.7） |
| 10 | 插图和语音用**根目录两个 skill** 生成 | 图片：`schnell skill/foxai-batch-imagegen`（flux-1-schnell 免费文生图）；语音：`TTS skill/tts_skill`（Edge TTS，OpenAI 兼容接口）。开发期批量生成静态资产，运行时零外部依赖（§5.4） |
| 11 | 课程依据权威资源调研 | 拼读教学顺序 / Dolch 高频词 / 剑桥 Pre-A1 Starters / 人教新起点一年级（§2） |
| 12 | **每日学习计划打卡**，每日任务要明确 | 首页「今日计划 Today's Plan」四项任务（今天的课/复习卡片/读故事/玩游戏），每项显示明确进度与完成状态；全部完成 → 打卡成功 + 奖励 3 星（§4.4） |
| 13 | **日常英语 300 句 + 听力模式** | 15 生活主题 × 20 句 = 300 句独立内容库；听力模式（磨耳朵）：自动连播/单句循环/随机/变速/中英字幕显隐（§4.9） |
| 14 | **绘本阅读器支持自定义添加** | 家长可自制绘本：每页英文句+中文+emoji 或上传图片（自动压缩），存本机 localStorage，与内置绘本同架阅读；朗读自动 TTS（§4.3） |
| 15 | **上课节奏要有生气，不要生硬** | 课型重构为「学玩穿插」：学 5-6 张卡 → 立刻 3 题小游戏热身 → 下一组；卡片到即自动发音、Foxy 每张换台词串场；跟读只挑每组代表词（≤4）；结尾大奖赛 + 结算（§3.2） |
| 16 | **听故事模块：100 个一年级适听素材** | 10 专辑 × 10 故事 = 100 篇（经典童话/伊索寓言/动物/日常/数字颜色/友谊/家庭/自然/搞笑/睡前），整篇朗读 + 句子滚动高亮 + 连播 + 慢速 + 文本/中文大意显隐；语音用 TTS skill 批量生成（§4.10） |
| 17 | **网站需要密码才能进入**（20200108） | 全站访问锁：大号数字键盘（儿童可用），密码默认 20200108（可用 `NEXT_PUBLIC_SITE_PASSWORD` 环境变量覆盖）；sessionStorage 记住本次会话，刷新免输、关标签后需重输（§5.6） |
| 18 | 首页问候语 | 「张慎易（歪歪），你好啊」（昵称可在家长页修改；旧默认「小朋友」自动迁移） |

---

## 1. 背景与目标

家长为孩子自建英语学习工具。成功标准：

- 孩子能独立完成一节课（8-12 分钟），无需家长陪同操作
- 每天 10-15 分钟，形成打卡习惯（streak）
- 答错的词自动进入复习循环，第二次见到能认出/读出
- 图片精美、语音地道（AI 生成资产），孩子愿意主动打开

---

## 2. 教学设计依据（外部资源调研）

| 来源 | 采用方式 |
|---|---|
| 拼读教学顺序（[Reading Rockets](https://www.readingrockets.org/classroom/scope-and-sequence)、[Reach All Readers](https://www.reachallreaders.com/what-order-should-you-teach-phonics-skills/)、[A Teachable Teacher](https://www.ateachableteacher.com/phonics-scope-and-sequence/)） | 主线：**字母音 → CVC 短元音词族（-at/-ap/-ed/-og/-ig/-ug…）→（v2）辅音组合 sh/ch/th、Magic E** |
| Dolch 高频词（[SightWords.com](https://sightwords.com/sight-words/dolch/)、[Mrs. Perkins](https://mrsperkins.com/dolch.htm)） | Pre-Primer 40 + Primer 52 中高频子集嵌入句型反复出现，可点读 |
| 剑桥少儿英语 Pre-A1 Starters（[官网](https://www.cambridgeenglish.cn/exams-and-tests/young-learners/starters/)） | 主题选词池（约 400 词）：动物、颜色、家庭、食物、身体、玩具、学校、天气、数字 |
| 人教版新起点一年级（[PEP 词汇表](https://www.koolearn.com/dict/tag_1822_1.html)、[Unit 5 Colours 教案](https://bbs.csdn.net/weixin_34138585/article/details/100244022)） | 句型难度参考；U8 学校单元选词向教材靠拢 |

---

## 3. 课程体系

### 3.1 单元地图（M1 覆盖 U0-U3，M3 补齐 U4-U8）

| # | 单元 | 内容 | 词量 | 课时 | 故事 |
|---|---|---|---|---|---|
| U0 | 字母音快闪 🔤 | 26 字母音（字母名≠字母音，快过） | 26 | 1 | — |
| U1 | 拼读小魔法 🪄 | CVC 词族：-at/-ap/-ed/-en/-og/-ot/-ig/-it/-un/-ug/-ox | 13 | 3 | — |
| U2 | 颜色变变变 🌈 | 10 色 | 10 | 2 | — |
| U3 | 动物大聚会 🦁 | 10 动物 | 10 | 3 | 1 本 |
| U4 | 我的家人 👨‍👩‍👧 | 8-10 | 2 | 1 本 |
| U5 | 数字和玩具 🔢🪀 | 14 | 3 | 1 本 |
| U6 | 身体真有用 👀 | 10 | 2 | 1 本 |
| U7 | 好吃的 🍎 | 10 | 2 | 1 本 |
| U8 | 学校和小天气 🏫 | 12 | 2 | 1 本 |

螺旋复习：新课自动混入旧词；句型递进 `I see a… → It is a… → What is it? → What color is it? → … can … → I like… → The … has …`。

### 3.2 一节课的流程（8-12 分钟，学玩穿插）

```
INTRO（Foxy 开场，词卡 emoji 逐个弹出）
→ × N 组【学 5-6 张新词卡（卡到自动发音 + Foxy 轮换台词 + 三档标记）
          → 立刻玩 3 题泡泡爆爆热身（用刚学的词）】
→ SAY    跟读：每组代表词（≤4 个）示范→录音→回放对比
→ READ   句子阅读：逐词点读 + karaoke 高亮跟读
→ PLAY   大奖赛：本课全部词 + 复习词玩 6 题
→ DONE   星星结算（1-3 星）→ 写进度 → 错词入 SRS
```

大词量课（如 26 字母）自动按 6 个一组切成 4 轮学玩循环，避免机械连翻。

---

## 4. 功能规格

### 4.1 单词记忆卡片（一等公民）
- **卡面**：正面 = 插图 + 单词（+音标）；背面 = 中文 + 例句（可点读）；字母卡 = 大字母 + 例词 emoji
- **交互**：点卡片任意处 = 翻面 + 发声；左右滑动换卡（大箭头兜底）
- **标记**：三档 —— 「还不会」(0) /「会了」(2) /「太简单」(3)
- **卡片盒**（独立入口）：① 每日复习（SRS 到期 ≤15 张）② 按单元浏览 ③ 错词本（答错自动进、掌握自动出）
- **SRS**（简化 SM-2，算法见 §5.3）；卡片盒是唯一调度入口，课/游戏结果单向写入

### 4.2 六个小游戏（共用引擎）

| 游戏 | 练习 | 玩法 |
|---|---|---|
| 泡泡爆爆 | 听 | 播单词音，4-6 个图文泡泡漂浮，点破正确的 |
| 记忆翻牌 | 读+记忆 | 图↔词配对（6 对），按步数计星 |
| 单词积木 | 听+拼读 | 看图听音，乱序字母块点选/拖入槽位拼词（CVC 三色提示） |
| 句子火车 | 读 | 播句音，乱序词卡依序挂上车厢 |
| 跟读话筒 | 说 | 示范→按住录音→回放+评分 |
| 打地鼠 | 听+TPR | 听指令 "Touch the cat!"，3×3 地洞限时点对 |

通用：生命❤️×3、连击、答对星星粒子、答错鼓励不惩罚、`?seed=` 复现题序；游戏厅自由玩（选词库：单元/混合/错词本）。

### 4.3 故事（绘本阅读器 + 自定义绘本）
- **内置绘本**：每本 6-8 页、每页 1 句（已学词为主）；逐词 karaoke 高亮；点词发声（词库内出插图，库外 TTS）；滑动/箭头翻页 + 自动播放；读后小测（M3）；学完关联单元解锁
- **自定义绘本（家长制作）**：书架「＋」进入 → 算术门验证 → 填中英文名、选封面 emoji、逐页编辑（英文句 + 中文 + emoji 或上传插图，图片自动压缩至 ≤900px jpeg 存 dataURL）→ 保存即入书架「我们的绘本」分区，可删除重做；朗读与点词自动走 TTS；支持任意难度句子（家长可按孩子水平定制）

### 4.4 每日计划打卡 + 游戏化
**今日计划 Today's Plan**（首页常驻，任务明确可见）：

| 任务 | 目标（动态明确） | 完成条件 |
|---|---|---|
| 📖 上课 | 「今天的课：U3-L1 好朋友」（自动指向下一节未完成课） | 完成任意一节课 |
| 🃏 复习卡片 | 「复习 N 张」（N=当日 SRS 到期数，无到期时提示学新卡） | 完成一组卡片复习 |
| 📚 读故事 | 「读 1 本」（指向已解锁的下一本） | 读完一本故事 |
| 🎮 玩游戏 | 「玩 1 局」 | 完成一局游戏 |

- 四项全部完成 → **打卡成功**：庆祝动画 + 火焰 +1 + 奖励 ⭐×3（每日一次）
- streak 以本地日界计算，中断重新从 1 开始
- 星星总量驱动故事解锁与（v2）Foxy 装扮商店

### 4.4b 游戏化
星星（课/游戏/故事/每日任务）、连击、streak 火焰、星星换装扮（v2）。

### 4.5 主线人物：小狐狸 Foxy 阿福 🦊
- **形象**：一只橙色小狐狸（emoji 🦊 起步，后续用图片 skill 生成 Foxy 插画系列）
- **全局陪伴**：悬浮在所有页面左下角（TabBar 上方）——点按会说话（双语台词随机轮换：鼓励/引导/闲聊），有表情变化（开心/欢呼/思考/委屈），进站主动打招呼
- **课内引导**：每个环节由 Foxy 气泡双语引导（「听一听，点一点！ Listen and tap!」）；答对时 Foxy 欢呼、答错时 Foxy 鼓励「再试一次 Try again」（永不批评）
- **声音**：Foxy 台词预生成双语语音（英文童声 + 中文活泼女声），点按可重播

### 4.6 双语按钮规范
- 所有操作按钮 = **中文大字 + 英文小字** 双行标注（开始 Start / 下一题 Next / 再来一次 Again / 会了 Got it / 还不会 Not yet / 听一听 Listen / 跟我读 Repeat / 返回 Back…）
- Foxy 台词、题目指令均中英双语呈现（中文为主、英文渗透）
- 目的：界面语言本身就是操作类英文的浸润输入

### 4.7 iPad 触屏与分辨率适配
- **触屏优先**：Pointer Events 点选/拖拽；热区 ≥64px；`touch-action: manipulation` 防双击缩放；无 hover 依赖（hover 仅作增强）
- **响应式断点**：手机（<640）→ iPad 竖屏（768×1024/820×1180）→ iPad 横屏（1024-1366）；网格类界面（泡泡/翻牌/地鼠）随宽度 2→3→4 列自适应；文字尺寸 `sm:` 档放大
- **安全区**：`viewport-fit=cover` + TabBar 底部 `env(safe-area-inset-bottom)` padding
- **PWA**：apple-mobile-web-app-capable，可「添加到主屏幕」全屏运行
- 拖拽主路径一律「点选放置」，拖拽为增强路径（任何触屏设备可完成）

### 4.8 家长页
算术门（两位数加法，防孩子误入）：报告（总星星、streak 日历、单元完成度、SRS 掌握分布、错词本可点听）；管理（跳过/解锁单元、昵称、语速、重置二次确认）。

### 4.10 听故事（100 篇听力素材，磨耳朵）
- **内容**：10 专辑 × 10 故事 = 100 篇（`src/content/listen100/`）：经典童话（简化版）、伊索寓言、动物朋友们、我的一天、数字和颜色、好朋友、温暖的家、大自然、开心一笑、睡前故事；每篇 8-10 句、句长 3-8 词（一年级听力适配），标注难度（入门/简单/进阶）与中文大意（家长参考）
- **听法分层**：① 只听不看（闭眼磨耳朵模式）② 边听边看文本（句子随朗读滚动高亮）③ 展开中文大意
- **播放器**：整篇朗读 MP3（Ana 儿童音色 0.92x）；播放/暂停、上/下一篇、**专辑连播**（自动下一篇）、慢速 0.75x、文本/中文显隐
- **数据**：`public/audio/listen/{id}.mp3`（TTS skill 批量生成）；听完一篇计入每日「读故事」任务
- **入口**：底部 TabBar「🎧 听故事 Listen」

### 4.9 日常英语 300 句（听力模式）

- **内容**：15 个生活主题 × 20 句 = 300 句（问候 Greetings / 自我介绍 / 家庭 / 学校 / 课堂用语 / 吃饭 / 食物水果 / 玩耍 / 玩具游戏 / 身体感受 / 作息时间 / 穿衣洗漱 / 天气季节 / 出门在外 / 礼貌用语），句长适配一年级（3-8 词为主）
- **浏览**：主题卡片 → 句子列表（点单句播放、显示中英）
- **听力模式（磨耳朵）**：全屏播放器，自动连播当前主题（或全部）；控制：播放/暂停、上/下一句、单句循环、随机播放、语速（0.75/1.0）、中文显示开关；每句播放时英文大字 + 中文可选，适配「只听不看」和「边听边读」两种用法
- **数据**：`src/content/daily300/daily300.json`（主题+句子+中文），音频 `/audio/daily/{id}.mp3`（TTS 批量生成）
- **入口**：底部 TabBar 独立页签「300句 Daily」

### 4.9 页面路由与导航

| 路由 | 内容 |
|---|---|
| `/` | 课程地图 + 每日任务 + streak/星星 + Foxy |
| `/unit/[unitId]` | 单元课列表 + 词卡速览 + 单元故事 |
| `/lesson/[lessonId]` | 上课流程（状态机） |
| `/flashcards`、`/flashcards/[deckId]` | 卡片盒（`daily` / `wrong` / 单元 id） |
| `/games`、`/games/[gameId]` | 游戏厅、单个游戏 |
| `/story`、`/story/[storyId]`、`/story/new` | 书架（内置+自定义）、阅读器、自定义绘本创作页 |
| `/daily`、`/daily/[themeId]` | 300 句主题列表、句子列表 + 听力模式播放器 |
| `/listen`、`/listen/[collectionId]` | 听故事专辑列表、故事列表 + 播放器（连播/高亮/显隐） |
| `/parent` | 家长页 |

底部 TabBar 常驻（双语标注，6 项）：地图 Map / 卡片 Cards / 300句 Daily / 游戏 Play / 故事 Story / 听故事 Listen；Foxy 悬浮其上；家长入口 = 首页右上角齿轮。

---

## 5. 技术架构

```
Next.js 16 (App Router, 静态生成) + TypeScript + Tailwind v4 + motion
public/{audio,images}/*        ← 开发期用两个 skill 批量生成
src/content/                   ← JSON 唯一事实源 + types（构建期校验引用完整性）
src/lib/{audio,speech,progress,game}/
src/components/{common,flashcard,lesson,game,story,home}/
scripts/gen-audio.py           ← 对接 TTS skill 批量合成
scripts/gen-images.py          ← 对接 batch-imagegen skill 批量生成插图
```

### 5.1 音频策略（三级降级，任何环境有声）
1. **预生成 MP3**（TTS skill 产出；词 0.8×慢速、例句/故事 0.95×；英文=en-US 童声向、中文 UI 提示=zh-CN-XiaoyiNeural 活泼女声）
2. 缺失 → 浏览器 `speechSynthesis`（支持中英双语语音选择）
3. UI 音效（对/错/庆祝/爆裂）→ WebAudio 现场合成（零资产）

iOS 对策：首个手势解锁音频上下文；播放均由点按触发；预加载下一题音频。

### 5.2 口语方案（SpeechAssessor 适配器）
`WebSpeechAssessor`（Chrome/Edge 可用：识别 vs 目标编辑距离 ≥0.8 判过）→ `ManualAssessor`（录音回放自评）；v2 预留 `CloudAssessor`（Azure/讯飞）。

### 5.3 SRS 数据（localStorage `wai-en-progress` v2）
grade 0：reps=0、lapses++、ease-0.2、当日重现；grade 2：interval 1→3→round(interval×ease)；grade 3：ease+0.1、interval×1.3；`interval≥21 && reps≥4 → mastered`；每日复习 = due≤today 取 15 张（过期+错误次数优先）。

### 5.4 素材管线（对接根目录两个 skill）

| 素材 | 工具 | 参数 |
|---|---|---|
| 单词插图、单元封面、故事页插图、Foxy 形象 | `schnell skill/foxai-batch-imagegen/scripts/generate.py`（flux-1-schnell，免费） | 1024²、统一风格模板：儿童绘本扁平矢量、明亮暖色、圆线条、无文字；`--prompts-file` 批量、`--verify` 校验、`--regenerate` 局部重跑 |
| 单词音、例句音、句型音、故事页朗读、Foxy 双语台词、中文界面提示 | `TTS skill/tts_skill`（Edge TTS，tts.qifei2035.eu.cc，OpenAI 兼容） | 英文内容 en-US（优先童声音色）、中文 zh-CN-XiaoyiNeural；批量并发 4；speed 词 0.8 / 句 0.95 |

- 脚本幂等（已存在跳过、断点重跑）、按内容 JSON 派生生成清单、产出后归一到约定路径（`/audio/...`、`/images/...`）
- 图片产出为 jpg → 路径约定 `/images/{words|units|stories|foxy}/{id}.jpg`
- 运行时**零外部依赖**：不请求任何 AI API/谷歌服务，静态资产同域加载（国内可用性优先）
- `gen-manifest` 校验：内容引用资产缺失 → 报告清单（开发期允许缺失，运行时自动 emoji/TTS 降级）

### 5.5 关键风险对策
| 风险 | 对策 |
|---|---|
| 国内访问 `*.vercel.app` 不稳 | 上线绑定自定义域名；全静态、无运行时第三方请求 |
| iOS 音频自动播放限制 | 手势解锁 + 点按触发 + 预加载 |
| 触屏拖拽不可靠 | 点选放置为主路径；Pointer Events 自研 |
| 麦克风权限被拒 | 引导弹窗 + 跳过录音降级 |
| 生成服务不可用/配额尽 | 两个 skill 均支持局部重跑；资产缺失自动降级不阻断 |

### 5.6 全站访问锁（SiteLock）
- 根布局包裹 `<SiteLock>`：进入任何页面前需输入密码（默认 `20200108`，部署时可设环境变量 `NEXT_PUBLIC_SITE_PASSWORD` 覆盖，Vercel → Settings → Environment Variables）
- 大号数字键盘 + 密码圆点反馈；错误抖动提示，不惩罚
- `sessionStorage` 记住解锁状态：刷新/页间跳转免输，关闭标签页/浏览器后需重输

---

## 6. 里程碑

| 阶段 | 范围 | 验收 |
|---|---|---|
| **M1** 骨架+核心学习环 | U0-U3 内容、进度 store、Lesson 状态机（Learn/Listen/Say/Read/Play）、泡泡爆爆、首页地图、Foxy、双语文按钮、**用两个 skill 实际生成 U0-U3 音频+插图** | dev 走通 首页→上课→得星→写进度；chrome-devtools 全流程无报错；音频可播、插图可显 |
| **M2** 卡片盒+全游戏+每日计划+300句 | Flashcard/SRS/错词本、其余 5 游戏、游戏厅、今日计划打卡、日常 300 句 + 听力模式（含全部音频生成） | 复习一组卡 SRS due 正确推进；答错词进错词本；四项任务完成打卡奖励；听力模式连播/循环/变速可用 |
| **M3** 故事+素材管线+全内容 | U4-U8、故事阅读器/书架、读后小测、全量资产生成 | manifest 0 缺失；karaoke 高亮正确 |
| **M4** 家长页+上线 | 家长页、音效打磨、PWA、Vercel 部署（自定义域名） | 生产域名可用；移动端 Lighthouse ≥90；iPad 真机冒烟 |

v2 预留：Supabase 云端进度、云端发音评分、AI 个性化故事、更多词族（digraphs/Magic E）、Foxy 装扮。

---

## 7. 参考资料

- [Reading Rockets – Scope and Sequence](https://www.readingrockets.org/classroom/scope-and-sequence) · [Reach All Readers](https://www.reachallreaders.com/what-order-should-you-teach-phonics-skills/) · [A Teachable Teacher](https://www.ateachableteacher.com/phonics-scope-and-sequence/)
- [SightWords.com – Dolch Lists](https://sightwords.com/sight-words/dolch/) · [Mrs. Perkins](https://mrsperkins.com/dolch.htm)
- [剑桥少儿英语 Pre A1 Starters](https://www.cambridgeenglish.cn/exams-and-tests/young-learners/starters/)
- [人教版 PEP 一年级起点词汇表](https://www.koolearn.com/dict/tag_1822_1.html) · [新起点一上 Unit 5 Colours 教案](https://bbs.csdn.net/weixin_34138585/article/details/100244022)
- 项目内素材工具：`schnell skill/foxai-batch-imagegen/`（图片）、`TTS skill/tts_skill/`（语音）
