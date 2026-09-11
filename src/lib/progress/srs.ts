/** 简化 SM-2 间隔重复。grade: 0 不会 / 1 犹豫 / 2 会了 / 3 太简单 */

import { addDays, todayStr } from "../utils";

export type Grade = 0 | 1 | 2 | 3;
export type CardStage = "new" | "learning" | "review" | "mastered";

export interface CardState {
  wordId: string;
  stage: CardStage;
  ease: number; // 1.3–2.8，初始 2.5
  intervalDays: number; // 0 = 待学/学习中
  due: string; // YYYY-MM-DD
  reps: number; // 连续答对
  lapses: number; // 累计答错
  lastGradeAt?: string;
}

export const newCard = (wordId: string): CardState => ({
  wordId,
  stage: "new",
  ease: 2.5,
  intervalDays: 0,
  due: todayStr(),
  reps: 0,
  lapses: 0,
});

const clampEase = (e: number) => Math.min(2.8, Math.max(1.3, e));

export function applyGrade(s: CardState, g: Grade, today = todayStr()): CardState {
  const n: CardState = { ...s, lastGradeAt: today };
  switch (g) {
    case 0:
      n.reps = 0;
      n.lapses = s.lapses + 1;
      n.ease = clampEase(s.ease - 0.2);
      n.intervalDays = 0;
      n.due = today; // 本次会话末尾重现
      n.stage = "learning";
      break;
    case 1:
      n.ease = clampEase(s.ease - 0.15);
      n.intervalDays = Math.max(1, Math.round(s.intervalDays * 1.2) || 1);
      n.due = addDays(today, n.intervalDays);
      n.stage = "learning";
      break;
    case 2:
      n.reps = s.reps + 1;
      n.intervalDays =
        s.reps === 0 ? 1 : s.reps === 1 ? 3 : Math.max(1, Math.round(s.intervalDays * n.ease));
      n.due = addDays(today, n.intervalDays);
      n.stage = "review";
      break;
    case 3:
      n.reps = s.reps + 1;
      n.ease = clampEase(s.ease + 0.1);
      n.intervalDays = Math.max(1, Math.round((s.intervalDays || 1) * n.ease * 1.3));
      n.due = addDays(today, n.intervalDays);
      n.stage = "review";
      break;
  }
  if (n.intervalDays >= 21 && n.reps >= 4) n.stage = "mastered";
  return n;
}

/** 每日复习组：到期卡按（过期天数, 错误次数）优先；不足补新卡 */
export function buildDailyReview(
  cards: Record<string, CardState>,
  candidateWordIds: string[],
  today = todayStr(),
  size = 15,
): string[] {
  const dueIds = Object.values(cards)
    .filter((c) => c.stage !== "mastered" && c.due <= today)
    .sort((a, b) => {
      const od = (x: CardState) => Math.round((Date.parse(today) - Date.parse(x.due)) / 86400000);
      return od(b) - od(a) || b.lapses - a.lapses;
    })
    .map((c) => c.wordId);
  const fresh = candidateWordIds.filter((id) => !cards[id] || cards[id].stage === "new");
  return [...dueIds, ...fresh].slice(0, size);
}

export function srsStats(cards: Record<string, CardState>) {
  const stats = { new: 0, learning: 0, review: 0, mastered: 0, dueToday: 0 };
  const today = todayStr();
  for (const c of Object.values(cards)) {
    stats[c.stage]++;
    if (c.stage !== "mastered" && c.due <= today) stats.dueToday++;
  }
  return stats;
}
