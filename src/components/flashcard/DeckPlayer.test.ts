import { describe, it, expect } from "vitest";
import { computeNextDeck } from "./DeckPlayer";
import type { Word } from "@/content/types";

const cat: Word = {
  id: "cat", kind: "word", text: "cat", zh: "猫", emoji: "🐱",
  phonics: "/k/ /æ/ /t/", sentence: "I see a cat.", sentenceZh: "我看到猫。", level: 1,
};
const dog: Word = {
  id: "dog", kind: "word", text: "dog", zh: "狗", emoji: "🐶",
  phonics: "/d/ /ɒ/ /g/", sentence: "The dog can run.", sentenceZh: "狗会跑。", level: 1,
};
const pig: Word = {
  id: "pig", kind: "word", text: "pig", zh: "猪", emoji: "🐷",
  phonics: "/p/ /ɪ/ /g/", sentence: "The pig can sit.", sentenceZh: "猪会坐。", level: 1,
};

const items = [{ word: cat }, { word: dog }, { word: pig }];

describe("computeNextDeck", () => {
  it("答对（grade=2）下一题不变 items 长度", () => {
    const r = computeNextDeck(items, 0, 2, items[0]);
    expect(r.idx).toBe(1);
    expect(r.items).toHaveLength(3);
  });

  it("答错（grade=0）非末尾：不追加重轮卡", () => {
    const r = computeNextDeck(items, 0, 0, items[0]);
    expect(r.idx).toBe(1);
    expect(r.items).toHaveLength(3);
    expect(r.items.find((it) => it.retest)).toBeUndefined();
  });

  it("答错（grade=0）恰好末尾且首轮：追加重轮卡", () => {
    // idx=2 是最后一题（pig），且当前不是 retest
    const r = computeNextDeck(items, 2, 0, items[2]);
    expect(r.idx).toBe(3);
    expect(r.items).toHaveLength(4);
    const retest = r.items[3];
    expect(retest.retest).toBe(true);
    expect(retest.word.id).toBe("pig");
  });

  it("答错但已经是 retest 卡：不重复追加", () => {
    const retestItem = { word: pig, retest: true };
    const itemsWithRetest = [...items, retestItem];
    const r = computeNextDeck(itemsWithRetest, 3, 0, retestItem);
    expect(r.idx).toBe(4);
    expect(r.items).toHaveLength(4); // 没追加
  });

  it("太简单（grade=3）从不当末尾错词也绝不追加", () => {
    const r = computeNextDeck(items, 2, 3, items[2]);
    expect(r.idx).toBe(3);
    expect(r.items).toHaveLength(3);
  });

  it("犹豫（grade=1）不追加", () => {
    const r = computeNextDeck(items, 2, 1, items[2]);
    expect(r.idx).toBe(3);
    expect(r.items).toHaveLength(3);
  });

  it("末尾答对 → 结束态（idx === items.length 表示 finished）", () => {
    const r = computeNextDeck(items, 2, 2, items[2]);
    expect(r.idx).toBe(3);
    expect(r.idx).toBe(r.items.length);
  });
});
