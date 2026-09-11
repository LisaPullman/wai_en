"use client";

import Link from "next/link";
import { motion } from "motion/react";
import type { Unit } from "@/content/types";
import { unitWords, storyById } from "@/content/curriculum";
import { playWordAudio } from "@/lib/audio/play";
import { useProgress } from "@/lib/progress/store";
import { cn } from "@/lib/utils";

export function UnitClient({ unit }: { unit: Unit }) {
  const p = useProgress();
  const unlocked = unit.index <= p.maxUnlockedUnitIndex;
  const words = unitWords(unit);
  const stories = unit.storyIds.map((id) => storyById(id)!).filter(Boolean);

  if (!unlocked) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-6 px-4 py-24 text-center">
        <span className="text-8xl">🔒</span>
        <h1 className="text-2xl font-black text-slate-600">{unit.title} 还没解锁</h1>
        <p className="font-medium text-slate-500">完成前面的单元，就能来这里玩啦！Finish the earlier units first!</p>
        <Link href="/" className="rounded-full bg-white px-8 py-4 font-black text-slate-600 shadow">
          回地图 Map
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-28 pt-4 sm:pt-6">
      {/* 单元头 */}
      <header className={cn("mb-5 flex items-center gap-4 rounded-[2rem] p-5 shadow-lg", unit.color)}>
        <span className="text-6xl">{unit.emoji}</span>
        <div>
          <h1 className="text-2xl font-black">{unit.title}</h1>
          <p className="text-sm font-bold opacity-70">{unit.titleEn} · {words.length} words</p>
        </div>
      </header>

      {/* 课程列表 */}
      <h2 className="mb-2 px-1 text-lg font-black text-slate-700">📖 上课 Lessons</h2>
      <div className="mb-6 flex flex-col gap-2">
        {unit.lessons.map((l, i) => {
          const done = p.lessons[l.id];
          return (
            <motion.div key={l.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Link
                href={`/lesson/${l.id}`}
                className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow active:scale-[0.98]"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-butter/20 text-xl font-black text-butter">
                  {i + 1}
                </span>
                <span className="flex-1 text-lg font-black text-slate-700">{l.title}</span>
                {done && (
                  <span className="text-sm font-black text-mint">
                    {"⭐".repeat(done.stars)}
                  </span>
                )}
                <span className="text-2xl text-slate-300">›</span>
              </Link>
            </motion.div>
          );
        })}
        <Link
          href={`/flashcards/${unit.id}`}
          className="flex items-center gap-3 rounded-2xl bg-white/70 p-4 shadow-sm active:scale-[0.98]"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-grape/15 text-2xl">🃏</span>
          <span className="flex-1 text-lg font-black text-slate-600">
            本单元卡片 <span className="text-sm font-bold text-slate-500">Unit Cards</span>
          </span>
          <span className="text-2xl text-slate-300">›</span>
        </Link>
      </div>

      {/* 单词速览：点哪个读哪个 */}
      <h2 className="mb-2 px-1 text-lg font-black text-slate-700">
        🐾 单词摸摸看 <span className="text-sm font-bold text-slate-500">Tap to hear</span>
      </h2>
      <div className="mb-6 grid grid-cols-3 gap-2 sm:grid-cols-5">
        {words.map((w) => (
          <button
            key={w.id}
            onClick={() => playWordAudio(w.id, w.tts ?? w.text)}
            className="flex flex-col items-center gap-1 rounded-2xl bg-white p-3 shadow-sm active:scale-95"
          >
            <span className="text-4xl">{w.emoji}</span>
            <span className="text-sm font-black text-slate-600">{w.text}</span>
          </button>
        ))}
      </div>

      {/* 单元故事 */}
      {stories.length > 0 && (
        <>
          <h2 className="mb-2 px-1 text-lg font-black text-slate-700">📚 单元故事 Story</h2>
          <div className="flex flex-col gap-2">
            {stories.map((s) => (
              <Link
                key={s.id}
                href={`/story/${s.id}`}
                className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow active:scale-[0.98]"
              >
                <span className="text-4xl">{s.emoji}</span>
                <span className="flex-1">
                  <span className="block text-lg font-black text-slate-700">{s.titleZh}</span>
                  <span className="block text-sm font-bold text-slate-500">{s.title}</span>
                </span>
                <span className="text-2xl text-slate-300">›</span>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
