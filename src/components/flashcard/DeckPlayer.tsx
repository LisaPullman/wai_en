"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import type { Word } from "@/content/types";
import { progressActions } from "@/lib/progress/store";
import { playWordAudio } from "@/lib/audio/play";
import { BigButton, Mascot } from "@/components/common/common";
import { Flashcard } from "./Flashcard";
import type { Grade } from "@/lib/progress/srs";

/** Foxy 串场台词（每张卡轮换，带节奏感） */
const FOXY_LINES = [
  { zh: "看这个！", en: "Look at this!", mood: "happy" as const },
  { zh: "听一听～", en: "Listen~", mood: "idle" as const },
  { zh: "跟着读！", en: "Say it!", mood: "cheer" as const },
  { zh: "你真棒！", en: "Super!", mood: "cheer" as const },
];

interface Item {
  word: Word;
  retest?: boolean; // 错词重现轮
}

export interface DeckSummary {
  total: number;
  got: number;
  miss: number;
}

/** 纯函数：给定当前 items/idx/grade/item，返回下一态 {items, idx}。
 *  首轮答错的词追加到末尾重现一次 → 等价于"在最后一题答错时把错词再放一次"。
 *  导出供单测。 */
export function computeNextDeck(
  items: Item[],
  idx: number,
  g: Grade,
  current: Item,
): { items: Item[]; idx: number } {
  const nextIdx = idx + 1;
  // 只有首轮、且正好答到最后一题、且答错 → 追加重轮卡
  const shouldRetest =
    g === 0 && !current.retest && idx === items.length - 1;
  const nextItems = shouldRetest ? [...items, { word: current.word, retest: true }] : items;
  return { items: nextItems, idx: nextIdx };
}

/** 卡组播放器：滑动换卡 + 三档标记（写入 SRS），错词本轮末尾重现 */
export function DeckPlayer({
  words,
  onDone,
  doneLabel = { zh: "完成", en: "Done" },
}: {
  words: Word[];
  onDone: (s: DeckSummary) => void;
  doneLabel?: { zh: string; en: string };
}) {
  const [items, setItems] = useState<Item[]>(() => words.map((word) => ({ word })));
  const [idx, setIdx] = useState(0);
  const [results, setResults] = useState<Record<string, Grade>>({});
  const [dir, setDir] = useState(1);

  // 换卡自动发音（学玩节奏：卡到→声音到，不用孩子先点）
  const currentWord = items[idx]?.word;
  useEffect(() => {
    if (!currentWord) return;
    const t = setTimeout(() => playWordAudio(currentWord.id, currentWord.tts ?? currentWord.text), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWord?.id, idx]);

  const finished = idx >= items.length;
  const summary = useMemo<DeckSummary>(() => {
    const vals = Object.values(results);
    return {
      total: words.length,
      got: vals.filter((g) => g >= 2).length,
      miss: vals.filter((g) => g === 0).length,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished]);

  const grade = (g: Grade) => {
    const item = items[idx];
    if (!item) return;
    progressActions.gradeCard(item.word.id, g);
    setResults((r) => ({ ...r, [item.word.id]: g }));
    setDir(1);
    const next = computeNextDeck(items, idx, g, item);
    setItems(next.items);
    setIdx(next.idx);
  };

  const nav = (d: -1 | 1) => {
    setDir(d);
    setIdx((i) => Math.min(items.length, Math.max(0, i + d)));
  };

  if (finished) {
    return (
      <div className="flex flex-col items-center gap-6 py-8">
        <Mascot mood="cheer" bubble={summary.miss === 0 ? "全部记住啦！" : "辛苦啦！"} bubbleEn={summary.miss === 0 ? "All done!" : "Nice work!"} />
        <div className="flex gap-4 text-center">
          <div className="rounded-3xl bg-mint/20 px-8 py-4">
            <div className="text-4xl font-black text-mint">{summary.got}</div>
            <div className="text-sm font-bold text-slate-500">会了 Got</div>
          </div>
          <div className="rounded-3xl bg-coral/20 px-8 py-4">
            <div className="text-4xl font-black text-coral">{summary.miss}</div>
            <div className="text-sm font-bold text-slate-500">还不会 Not yet</div>
          </div>
        </div>
        {summary.miss > 0 && (
          <p className="text-sm font-medium text-slate-400">还不会的词会安排到明天复习哦～</p>
        )}
        <BigButton zh={doneLabel.zh} en={doneLabel.en} className="bg-butter text-white" onClick={() => onDone(summary)} />
      </div>
    );
  }

  const item = items[idx];
  const foxy = FOXY_LINES[idx % FOXY_LINES.length];
  return (
    <div className="flex w-full flex-col items-center gap-4">
      {/* Foxy 串场 */}
      <div className="flex min-h-14 items-center justify-center">
        <Mascot mood={foxy.mood} bubble={foxy.zh} bubbleEn={foxy.en} />
      </div>
      {/* 进度 */}
      <div className="flex w-full items-center justify-between px-2">
        <button
          onClick={() => nav(-1)}
          disabled={idx === 0}
          className="h-12 w-12 rounded-full bg-white text-2xl shadow disabled:opacity-30"
          aria-label="上一张"
        >
          ←
        </button>
        <div className="text-lg font-bold text-slate-400">
          {idx + 1} / {items.length}
        </div>
        <button
          onClick={() => nav(1)}
          className="h-12 w-12 rounded-full bg-white text-2xl shadow"
          aria-label="下一张"
        >
          →
        </button>
      </div>

      {/* 卡片（可滑动） */}
      <div className="relative h-[26rem] w-full max-w-sm sm:h-[30rem]">
        {/* 下一张露出边 */}
        {items[idx + 1] && (
          <div className="absolute inset-x-4 top-2 h-full rounded-[2rem] bg-white/50" />
        )}
        <AnimatePresence mode="popLayout" custom={dir}>
          <motion.div
            // key 含 retest 标记 → 重轮卡会 unmount/mount,Flashcard 的 flipped 状态自然重置
            key={`${item.word.id}-${item.retest ? "r" : "n"}`}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.5}
            onDragEnd={(_, info) => {
              if (info.offset.x < -70) nav(1);
              else if (info.offset.x > 70) nav(-1);
            }}
            initial={{ x: dir >= 0 ? 120 : -120, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: dir >= 0 ? -120 : 120, opacity: 0 }}
            className="absolute inset-0 cursor-grab active:cursor-grabbing"
          >
            <Flashcard word={item.word} />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 三档标记 */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <BigButton zh="还不会" en="Not yet" className="bg-coral text-white" onClick={() => grade(0)} />
        <BigButton zh="会了" en="Got it" className="bg-mint text-white" onClick={() => grade(2)} />
        <BigButton zh="太简单" en="Too easy" className="bg-grape text-white" onClick={() => grade(3)} />
      </div>
      <p className="text-xs font-medium text-slate-400">也可以左右滑动卡片查看 Swipe to flip cards</p>
    </div>
  );
}
