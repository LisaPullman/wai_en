import type { Curriculum, Lesson, Story, Unit, Word } from "../types";
import wordsJson from "./words.json";
import u0 from "./u0-letters.json";
import u1 from "./u1-phonics-cvc.json";
import u2 from "./u2-colors.json";
import u3 from "./u3-animals.json";
import s01 from "../stories/s01-cat-and-dog.json";
import s02 from "../stories/s02-rainbow-fish.json";
import s03 from "../stories/s03-the-hat-and-the-cat.json";
import s04 from "../stories/s04-the-big-bear.json";

const units = [u0, u1, u2, u3] as unknown as Unit[];
const stories = [s01, s02, s03, s04] as unknown as Story[];
const words = wordsJson as Record<string, Word>;

/** 构建期校验：wordId 引用、lesson 引用、故事引用必须全部存在 */
function validate(c: Curriculum) {
  const errs: string[] = [];
  const unitById = new Map(c.units.map((u) => [u.id, u]));
  for (const u of c.units) {
    for (const wid of u.wordIds) if (!c.words[wid]) errs.push(`${u.id}: 词不存在 ${wid}`);
    for (const l of u.lessons) {
      if (l.unitId !== u.id) errs.push(`${l.id}: unitId 不匹配`);
      for (const wid of [...l.wordIds, ...l.reviewWordIds])
        if (!c.words[wid]) errs.push(`${l.id}: 词不存在 ${wid}`);
      for (const sid of l.sentenceIds)
        if (!u.sentences.some((s) => s.id === sid)) errs.push(`${l.id}: 句不存在 ${sid}`);
    }
    for (const sid of u.storyIds) if (!c.stories.some((s) => s.id === sid)) errs.push(`${u.id}: 故事不存在 ${sid}`);
  }
  for (const s of c.stories) {
    if (s.unitTag && !unitById.has(s.unitTag)) errs.push(`${s.id}: unitTag 无效`);
    for (const wid of s.newWordIds) if (!c.words[wid]) errs.push(`${s.id}: 生词不存在 ${wid}`);
  }
  if (errs.length) throw new Error(`内容校验失败:\n${errs.join("\n")}`);
}

// 补上 lesson.unitId（JSON 里省略，此处派生，保持内容文件精简）
for (const u of units) for (const l of u.lessons) l.unitId = u.id;

export const curriculum: Curriculum = { units, stories, words };
validate(curriculum);

export const unitById = (id: string) => curriculum.units.find((u) => u.id === id);
export const lessonById = (id: string): { unit: Unit; lesson: Lesson } | undefined => {
  for (const u of curriculum.units) {
    const l = u.lessons.find((x) => x.id === id);
    if (l) return { unit: u, lesson: l };
  }
};
export const storyById = (id: string) => curriculum.stories.find((s) => s.id === id);
export const wordById = (id: string) => curriculum.words[id];

/** 句子/故事页 token 是否命中词库（命中→可点图点音；否则 sight word 走 TTS） */
export const isPoolWord = (token: string) => Boolean(curriculum.words[token.toLowerCase()]);

/** 单元全部词（含该词被多个单元复用） */
export const unitWords = (u: Unit): Word[] => u.wordIds.map((id) => curriculum.words[id]).filter(Boolean);

/** 找干扰项：优先同单元，其次全局，排除正确答案（字母和普通词都可作干扰项） */
export function distractorsFor(wordId: string, pool: Word[], n: number): Word[] {
  const others = pool.filter((w) => w.id !== wordId);
  const global = curriculum.units
    .flatMap((u) => unitWords(u))
    .filter((w) => w.id !== wordId);
  const merged = [...others, ...global];
  const seen = new Set<string>();
  const out: Word[] = [];
  for (const w of merged) {
    if (out.length >= n) break;
    if (!seen.has(w.id)) {
      seen.add(w.id);
      out.push(w);
    }
  }
  return out.slice(0, n);
}
