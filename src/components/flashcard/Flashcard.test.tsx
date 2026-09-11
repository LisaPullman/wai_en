import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { Flashcard } from "./Flashcard";
import type { Word } from "@/content/types";

// mock 音频模块，避免实际播放
vi.mock("@/lib/audio/play", () => ({
  playAsset: vi.fn(),
  playWordAudio: vi.fn(),
  audioPath: {
    word: (id: string) => `/audio/words/${id}.mp3`,
    wordExample: (id: string) => `/audio/sentences/${id}-ex.mp3`,
    sentence: (id: string) => `/audio/sentences/${id}.mp3`,
    storyPage: (storyId: string, n: number) => `/audio/stories/${storyId}/p${n}.mp3`,
  },
  preload: vi.fn(),
  stopAudio: vi.fn(),
}));

vi.mock("@/lib/audio/sfx", () => ({
  sfx: { flip: vi.fn(), tap: vi.fn(), correct: vi.fn(), wrong: vi.fn(), pop: vi.fn(), tada: vi.fn(), streak: vi.fn() },
  unlockAudio: vi.fn(),
}));

import { playAsset, playWordAudio } from "@/lib/audio/play";

const word: Word = {
  id: "cat", kind: "word", text: "cat", zh: "猫", emoji: "🐱",
  phonics: "/k/ /æ/ /t/", sentence: "I see a cat.", sentenceZh: "我看到一只猫。",
  tts: "cat", level: 1,
};

beforeEach(() => {
  vi.clearAllMocks();
  cleanup();
});

describe("Flashcard", () => {
  it("初始显示正面（单词 + 提示翻卡）", () => {
    render(<Flashcard word={word} />);
    expect(screen.getByText("cat")).toBeInTheDocument();
    expect(screen.getByText(/点我翻面|Flip/i)).toBeInTheDocument();
  });

  it("首次点击卡面 → 翻到背面（语义：读例句）", () => {
    const { container } = render(<Flashcard word={word} />);
    const card = container.querySelector(".card-3d")!;
    fireEvent.click(card);
    // B3 修复后语义：首翻 = 翻到背面 = 读例句
    expect(playAsset).toHaveBeenCalledTimes(1);
    expect(playAsset).toHaveBeenCalledWith(
      "/audio/sentences/cat-ex.mp3",
      "I see a cat.",
      expect.objectContaining({ rate: 0.9 }),
    );
    expect(playWordAudio).not.toHaveBeenCalled();
  });

  it("再次点击翻回正面 → 触发 playWordAudio 重读单词", () => {
    const { container } = render(<Flashcard word={word} />);
    const card = container.querySelector(".card-3d")!;
    fireEvent.click(card); // 翻到背面
    vi.clearAllMocks();
    fireEvent.click(card); // 翻回正面
    expect(playWordAudio).toHaveBeenCalledTimes(1);
    expect(playWordAudio).toHaveBeenCalledWith("cat", "cat");
    expect(playAsset).not.toHaveBeenCalled();
  });

  it("背面例句按钮点击只触发 playAsset 不翻面（stopPropagation）", () => {
    render(<Flashcard word={word} />);
    // 翻到背面
    fireEvent.click(screen.getByText("cat").closest(".card-3d")!);
    vi.clearAllMocks();
    const sentenceBtn = screen.getByRole("button", { name: /🔊 I see a cat/ });
    fireEvent.click(sentenceBtn);
    expect(playAsset).toHaveBeenCalledTimes(1);
    expect(playWordAudio).not.toHaveBeenCalled();
  });

  it("字母卡显示 Aa 大字 + emoji（不走图片分支）", () => {
    const letter: Word = {
      id: "L-a", kind: "letter", text: "Aa", zh: "字母 A", emoji: "🍎",
      phonics: "/æ/", sentence: "A is for apple.", sentenceZh: "A 代表苹果。",
      tts: "a is for apple.", level: 1,
    };
    const { container } = render(<Flashcard word={letter} />);
    // Aa 显示在带 tracking-wide 的 span 内
    const aaSpan = container.querySelector("span.tracking-wide");
    expect(aaSpan).toHaveTextContent("Aa");
    // emoji 单独一个 span
    expect(container.querySelector("span.text-4xl")).toHaveTextContent("🍎");
    // 不应该有 <img> 标签（字母卡走纯 emoji）
    expect(container.querySelector("img")).toBeNull();
  });

  it("显示 phonics（音标）", () => {
    render(<Flashcard word={word} />);
    expect(screen.getByText("/k/ /æ/ /t/")).toBeInTheDocument();
  });
});
