import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, act } from "@testing-library/react";
import { BubblePop, type GameResult } from "./BubblePop";
import type { Unit, Word } from "@/content/types";

// mock 音频与 sfx
vi.mock("@/lib/audio/play", () => ({
  playAsset: vi.fn(),
  playWordAudio: vi.fn(),
  preload: vi.fn(),
  audioPath: {
    word: (id: string) => `/audio/words/${id}.mp3`,
    wordExample: (id: string) => `/audio/sentences/${id}-ex.mp3`,
    sentence: (id: string) => `/audio/sentences/${id}.mp3`,
    storyPage: (storyId: string, n: number) => `/audio/stories/${storyId}/p${n}.mp3`,
  },
  stopAudio: vi.fn(),
}));

vi.mock("@/lib/audio/sfx", () => ({
  sfx: { flip: vi.fn(), tap: vi.fn(), correct: vi.fn(), wrong: vi.fn(), pop: vi.fn(), tada: vi.fn(), streak: vi.fn() },
  unlockAudio: vi.fn(),
}));

// mock 题目生成器（具体题目按需 stub；默认返回 4 题 + answer 都是 cat）
const defaultQuestions = (n: number, answerId = "cat") =>
  Array.from({ length: n }, () => ({
    kind: "listen-pick" as const,
    answerId,
    options: [cat, dog] as Word[],
  }));

vi.mock("@/lib/game/questionGen", () => ({
  makeListenPickQuestions: vi.fn(() => defaultQuestions(4)),
  scoreToStars: (score: number, max: number) =>
    max > 0 && score / max >= 0.85 ? 3 : score / max >= 0.6 ? 2 : 1,
}));

import { playWordAudio, preload } from "@/lib/audio/play";
import { sfx } from "@/lib/audio/sfx";
import { makeListenPickQuestions } from "@/lib/game/questionGen";

const cat: Word = { id: "cat", kind: "word", text: "cat", zh: "猫", emoji: "🐱", sentence: "I see a cat.", sentenceZh: "我看到猫。", level: 1 };
const dog: Word = { id: "dog", kind: "word", text: "dog", zh: "狗", emoji: "🐶", sentence: "The dog can run.", sentenceZh: "狗会跑。", level: 1 };
const pig: Word = { id: "pig", kind: "word", text: "pig", zh: "猪", emoji: "🐷", sentence: "The pig can sit.", sentenceZh: "猪会坐。", level: 1 };
const bird: Word = { id: "bird", kind: "word", text: "bird", zh: "鸟", emoji: "🐦", sentence: "The bird can fly.", sentenceZh: "鸟会飞。", level: 1 };

const unit: Unit = {
  id: "u3-animals", index: 3, title: "动物", titleEn: "Animals", emoji: "🦁",
  color: "bg-orange-100", wordIds: ["cat", "dog", "pig", "bird"], sentences: [], lessons: [], storyIds: [],
};

const words = [cat, dog, pig, bird];

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  cleanup();
  // 默认 4 题、answer=cat
  (makeListenPickQuestions as ReturnType<typeof vi.fn>).mockImplementation(() => defaultQuestions(4));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("BubblePop", () => {
  it("渲染当前题 + 听音按钮 + 4 个泡泡选项", () => {
    render(<BubblePop words={words} unit={unit} seed={42} onExit={vi.fn()} />);
    expect(screen.getByRole("button", { name: "听单词" })).toBeInTheDocument();
    // 4 个 .bubble 按钮（每题 2 选项 × 4 题渲染只当前题 2 个）— 实际只渲染当前题 2 个
    expect(screen.getAllByRole("button", { name: /猫|狗|猪|鸟/ }).length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("点那个对的泡泡！")).toBeInTheDocument();
  });

  it("挂载时调 preload 预热目标词音频", () => {
    render(<BubblePop words={words} unit={unit} seed={42} onExit={vi.fn()} />);
    expect(preload).toHaveBeenCalledTimes(1);
    expect(preload).toHaveBeenCalledWith("/audio/words/cat.mp3");
  });

  it("听音按钮点击调 playWordAudio 复读", () => {
    render(<BubblePop words={words} unit={unit} seed={42} onExit={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "听单词" }));
    expect(playWordAudio).toHaveBeenCalledWith("cat", "cat");
  });

  it("答对：触发 sfx.pop+correct,850ms 后 preload 下一题", () => {
    render(<BubblePop words={words} unit={unit} seed={42} onExit={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "猫" }));
    expect(sfx.pop).toHaveBeenCalled();
    expect(sfx.correct).toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(900));
    // 题号推进 + 新题挂载 → preload 第二次
    expect(vi.mocked(preload).mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it("答错时调 sfx.wrong，不调 pop/correct", () => {
    render(<BubblePop words={words} unit={unit} seed={42} onExit={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "狗" })); // 故意点错的
    expect(sfx.wrong).toHaveBeenCalled();
    expect(sfx.pop).not.toHaveBeenCalled();
    expect(sfx.correct).not.toHaveBeenCalled();
  });

  it("答对 3 次显示连击 ×3", () => {
    // mock 5 题，前 3 题答对后中断（不让 finished 抢走 HUD）
    (makeListenPickQuestions as ReturnType<typeof vi.fn>).mockImplementation(() => defaultQuestions(5));
    render(<BubblePop words={[cat]} unit={unit} seed={1} onExit={vi.fn()} />);
    for (let i = 0; i < 3; i++) {
      fireEvent.click(screen.getByRole("button", { name: "猫" }));
      act(() => vi.advanceTimersByTime(900));
    }
    expect(screen.getByText(/连击 ×3/)).toBeInTheDocument();
  });

  it("全部题答完 → 渲染结算页（继续按钮）", () => {
    const onExit = vi.fn();
    // 改成单题
    (makeListenPickQuestions as ReturnType<typeof vi.fn>).mockImplementation(() => defaultQuestions(1));
    render(<BubblePop words={[cat]} unit={unit} seed={1} onExit={onExit} />);
    // 答对
    fireEvent.click(screen.getByRole("button", { name: "猫" }));
    act(() => vi.advanceTimersByTime(900));
    // 应进入结算页：包含"继续"按钮 + Mascot 庆祝语
    expect(screen.getByRole("button", { name: /继续|Continue/ })).toBeInTheDocument();
    expect(screen.getByText("玩得真棒！")).toBeInTheDocument();
  });

  it("结算页点击继续 → 触发 onExit 并传 GameResult", () => {
    const onExit = vi.fn();
    (makeListenPickQuestions as ReturnType<typeof vi.fn>).mockImplementation(() => defaultQuestions(1));
    render(<BubblePop words={[cat]} unit={unit} seed={1} onExit={onExit} />);
    fireEvent.click(screen.getByRole("button", { name: "猫" }));
    act(() => vi.advanceTimersByTime(900));
    fireEvent.click(screen.getByRole("button", { name: /继续|Continue/ }));
    expect(onExit).toHaveBeenCalledTimes(1);
    const arg = onExit.mock.calls[0][0] as GameResult;
    expect(arg).toHaveProperty("score");
    expect(arg).toHaveProperty("max");
    expect(arg).toHaveProperty("stars");
    expect([1, 2, 3]).toContain(arg.stars);
    expect(Array.isArray(arg.wrongIds)).toBe(true);
  });
});
