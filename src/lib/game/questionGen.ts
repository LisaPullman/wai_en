/** 游戏题目生成器与计分（纯函数，便于 ?seed= 复现测试） */

import { distractorsFor, unitWords } from "@/content/curriculum";
import type { Unit, Word } from "@/content/types";
import { mulberry32, shuffle } from "../utils";

export interface ListenPickQuestion {
  kind: "listen-pick";
  answerId: string;
  options: Word[]; // 含正确项，已打乱
}

/** 听音选图题：answer 来自目标词池，干扰项优先同单元 */
export function makeListenPickQuestions(
  targets: Word[],
  poolUnit: Unit,
  count: number,
  seed?: number,
): ListenPickQuestion[] {
  const rng = seed != null ? mulberry32(seed) : Math.random;
  const shuffled = shuffle(targets);
  const qs: ListenPickQuestion[] = [];
  const used = new Set<string>();
  let i = 0;
  while (qs.length < Math.min(count, targets.length)) {
    const target = shuffled[i % shuffled.length];
    i++;
    if (used.has(target.id) && used.size < targets.length) continue;
    used.add(target.id);
    const nOpts = 3 + Math.floor(rng() * 2); // 3-4 选项
    const distractors = distractorsFor(target.id, unitWords(poolUnit), nOpts - 1);
    const options = shuffle([target, ...distractors]);
    qs.push({ kind: "listen-pick", answerId: target.id, options });
  }
  return qs;
}

/** 分数 → 星星 */
export function scoreToStars(score: number, max: number): 1 | 2 | 3 {
  const r = max > 0 ? score / max : 0;
  if (r >= 0.85) return 3;
  if (r >= 0.6) return 2;
  return 1;
}
