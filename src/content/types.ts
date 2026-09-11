/** 内容数据模型 —— src/content 下的 JSON 是唯一事实源。
 *  资产命名约定（开发期由生成脚本产出，缺失时运行时自动降级：
 *  图片→emoji 兜底，音频→浏览器 speechSynthesis 兜底）：
 *   - 单词图  /images/words/{id}.png    单词音 /audio/words/{id}.mp3
 *   - 例句音  /audio/sentences/{wordId}-ex.mp3
 *   - 句型音  /audio/sentences/{id}.mp3
 *   - 单元封面 /images/units/{id}.png
 *   - 故事页图 /images/stories/{storyId}/p{n}.png  页音 /audio/stories/{storyId}/p{n}.mp3
 */

export type Skill = "listen" | "speak" | "read";

export interface Word {
  id: string;            // 全局唯一；普通词用单词本身（"cat"），字母用 "L-a"
  kind: "letter" | "word";
  text: string;          // 展示文本（字母显示 "Aa"）
  zh: string;
  emoji: string;         // 图片缺失时的兜底图标，也是轻量界面首选
  phonics?: string;      // 如 "/k/ /æ/ /t/"
  cvc?: { onset: string; vowel: string; rime: string }; // 拼读拆分（字母积木游戏用）
  sentence: string;      // 例句
  sentenceZh: string;
  tts?: string;          // 语音兜底朗读文本（默认读 text；字母卡读 "a is for apple"）
  level: 1 | 2 | 3;      // 1=入门 2=核心 3=拓展
}

export interface Sentence {
  id: string;            // "u3-s1"
  text: string;
  zh: string;
  /** 逐词切分（karaoke 高亮 / 句子火车）。token 若命中词库 id 则可点图点音，否则按 sight word 用 TTS */
  words: string[];
  pattern?: string;      // 句型说明（家长页展示）
}

export interface Lesson {
  id: string;            // "u3-l1"
  unitId: string;        // 由 index.ts 派生填充
  title: string;         // 中文课名
  wordIds: string[];     // 本课新词 3-5 个
  sentenceIds: string[];
  reviewWordIds: string[]; // 复习词（建议从 SRS 到期词挑，内容层先写死保底）
}

export interface Unit {
  id: string;            // "u3-animals"
  index: number;         // 解锁顺序，0 开始
  title: string;         // 中文标题
  titleEn: string;
  emoji: string;
  color: string;         // 主题色（Tailwind 类名，如 "bg-orange-100 text-orange-600"）
  wordIds: string[];     // 有序
  sentences: Sentence[];
  lessons: Lesson[];
  storyIds: string[];
}

export interface StoryPage {
  text: string;          // 本页 1 句
  zh: string;
  emoji: string;         // 图片缺失时兜底
  image?: string;        // 自定义绘本上传的图片（dataURL）；内置绘本用约定路径
  words: string[];       // 逐词切分
}

export interface Story {
  id: string;
  title: string;
  titleZh: string;
  emoji: string;
  level: 1 | 2 | 3;
  unitTag: string;       // 学完哪个单元解锁（"" 表示自由）
  newWordIds: string[];  // 生词预览
  pages: StoryPage[];
}

export interface Curriculum {
  units: Unit[];
  stories: Story[];
  words: Record<string, Word>;
}
