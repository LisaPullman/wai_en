/** 进度 store：localStorage 持久化 + useSyncExternalStore 订阅 */

"use client";

import { useSyncExternalStore } from "react";
import { curriculum } from "@/content/curriculum";
import { todayStr } from "../utils";
import { applyGrade, newCard, type CardState, type Grade } from "./srs";

export type TaskId = "lesson" | "cards" | "story" | "game";

export interface Progress {
  v: 2;
  childName: string;
  stars: number;
  maxUnlockedUnitIndex: number; // 0 起；完成单元 n 的全部课后推进
  lessons: Record<string, { stars: 1 | 2 | 3; plays: number; lastAt: string }>;
  games: Record<string, { bestScore: number; plays: number }>;
  stories: Record<string, { readCount: number; lastAt: string }>;
  srs: Record<string, CardState>;
  daily: { date: string; tasks: Record<TaskId, boolean>; bonusClaimed: boolean };
  streak: { current: number; longest: number; lastDay: string };
  wrongWords: string[];
  settings: { sfx: boolean };
}

const KEY = "wai-en-progress";

function defaults(): Progress {
  return {
    v: 2,
    childName: "张慎易（歪歪）",
    stars: 0,
    maxUnlockedUnitIndex: 0,
    lessons: {},
    games: {},
    stories: {},
    srs: {},
    daily: {
      date: todayStr(),
      tasks: { lesson: false, cards: false, story: false, game: false },
      bonusClaimed: false,
    },
    streak: { current: 0, longest: 0, lastDay: "" },
    wrongWords: [],
    settings: { sfx: true },
  };
}

let cache: Progress | null = null;
const listeners = new Set<() => void>();
let saveTimer: ReturnType<typeof setTimeout> | undefined;

function load(): Progress {
  if (cache) return cache;
  if (typeof window === "undefined") return defaults();
  try {
    const raw = localStorage.getItem(KEY);
    cache = raw ? { ...defaults(), ...(JSON.parse(raw) as Progress) } : defaults();
    // 旧默认昵称迁移到新默认
    if (cache.childName === "小朋友") cache.childName = defaults().childName;
  } catch {
    cache = defaults();
  }
  return cache!;
}

function persist() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(cache));
    } catch {
      /* Safari 隐私模式等：保底内存态 */
    }
  }, 200);
}

function commit(mut: (p: Progress) => void) {
  const p = load();
  mut(p);
  ensureToday(p);
  cache = { ...p };
  persist();
  listeners.forEach((l) => l());
}

function ensureToday(p: Progress) {
  const today = todayStr();
  if (p.daily.date !== today) {
    p.daily = {
      date: today,
      tasks: { lesson: false, cards: false, story: false, game: false },
      bonusClaimed: false,
    };
  }
}

function touchStreak(p: Progress) {
  const today = todayStr();
  if (p.streak.lastDay === today) return;
  const yesterday = todayStr(new Date(Date.now() - 86400000));
  p.streak.current = p.streak.lastDay === yesterday ? p.streak.current + 1 : 1;
  p.streak.longest = Math.max(p.streak.longest, p.streak.current);
  p.streak.lastDay = today;
}

function markTask(p: Progress, task: TaskId) {
  if (!p.daily.tasks[task]) p.daily.tasks[task] = true;
}

/** 完成单元全部课 → 推进解锁（循环处理连续解锁） */
function advanceUnlock(p: Progress) {
  let advanced = true;
  while (advanced) {
    advanced = false;
    for (const u of curriculum.units) {
      if (u.index === p.maxUnlockedUnitIndex && u.lessons.every((l) => p.lessons[l.id])) {
        p.maxUnlockedUnitIndex = u.index + 1;
        advanced = true;
        break;
      }
    }
  }
}

/* ---------- 对外 actions ---------- */

export const progressActions = {
  addStars(n: number) {
    commit((p) => {
      p.stars += n;
      touchStreak(p);
    });
  },
  completeLesson(lessonId: string, stars: 1 | 2 | 3, wrongWordIds: string[]) {
    commit((p) => {
      const prev = p.lessons[lessonId];
      p.lessons[lessonId] = {
        stars: Math.max(prev?.stars ?? 0, stars) as 1 | 2 | 3,
        plays: (prev?.plays ?? 0) + 1,
        lastAt: new Date().toISOString(),
      };
      p.stars += stars;
      markTask(p, "lesson");
      touchStreak(p);
      for (const id of wrongWordIds) {
        p.srs[id] = applyGrade(p.srs[id] ?? newCard(id), 0);
        if (!p.wrongWords.includes(id)) p.wrongWords.push(id);
      }
      // 单元全部课完成 → 解锁下一单元
      advanceUnlock(p);
    });
  },
  completeStory(storyId: string) {
    commit((p) => {
      const prev = p.stories[storyId];
      p.stories[storyId] = { readCount: (prev?.readCount ?? 0) + 1, lastAt: new Date().toISOString() };
      p.stars += 2;
      markTask(p, "story");
      touchStreak(p);
    });
  },
  recordGame(gameId: string, score: number, stars: number, wrongWordIds: string[]) {
    commit((p) => {
      const prev = p.games[gameId];
      p.games[gameId] = { bestScore: Math.max(prev?.bestScore ?? 0, score), plays: (prev?.plays ?? 0) + 1 };
      p.stars += stars;
      markTask(p, "game");
      touchStreak(p);
      for (const id of wrongWordIds) {
        p.srs[id] = applyGrade(p.srs[id] ?? newCard(id), 0);
        if (!p.wrongWords.includes(id)) p.wrongWords.push(id);
      }
    });
  },
  /** 卡片盒/课中答题的 SRS 评级 */
  gradeCard(wordId: string, grade: Grade) {
    commit((p) => {
      p.srs[wordId] = applyGrade(p.srs[wordId] ?? newCard(wordId), grade);
      if (grade === 0) {
        if (!p.wrongWords.includes(wordId)) p.wrongWords.push(wordId);
      } else if (grade >= 2) {
        p.wrongWords = p.wrongWords.filter((w) => w !== wordId);
      }
      markTask(p, "cards");
    });
  },
  /** 课中答对/答错也计入 SRS（对=2 错=0） */
  markDailyTask(task: TaskId) {
    commit((p) => {
      markTask(p, task);
      touchStreak(p);
    });
  },
  /** 每日四项任务全部完成 → 打卡奖励 +3 星（每天一次） */
  claimDailyBonus(): boolean {
    let ok = false;
    commit((p) => {
      const all = Object.values(p.daily.tasks).every(Boolean);
      if (all && !p.daily.bonusClaimed) {
        p.daily.bonusClaimed = true;
        p.stars += 3;
        touchStreak(p);
        ok = true;
      }
    });
    return ok;
  },
  unlockUnit(index: number) {
    commit((p) => {
      p.maxUnlockedUnitIndex = Math.max(p.maxUnlockedUnitIndex, index);
    });
  },
  setChildName(name: string) {
    commit((p) => {
      p.childName = name.slice(0, 12) || "小朋友";
    });
  },
  reset() {
    cache = defaults();
    persist();
    listeners.forEach((l) => l());
  },
};

/* ---------- React 订阅 ---------- */

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useProgress(): Progress {
  return useSyncExternalStore(
    subscribe,
    () => load(),
    () => defaults(),
  );
}
