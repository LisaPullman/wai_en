"use client";

import Link from "next/link";
import { useMemo } from "react";
import { curriculum } from "@/content/curriculum";
import { srsStats } from "@/lib/progress/srs";
import { useProgress } from "@/lib/progress/store";

export default function Page() {
  const p = useProgress();
  const stats = useMemo(() => srsStats(p.srs), [p.srs]);

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-28 pt-4 sm:pt-8">
      <header className="mb-5">
        <h1 className="text-2xl font-black text-slate-700">
          🃏 单词卡片盒 <span className="text-sm font-bold text-slate-500">Card Box</span>
        </h1>
        <p className="text-sm font-medium text-slate-500">点卡片听发音，翻卡片看意思 Tap & flip!</p>
      </header>

      {/* 三大入口 */}
      <div className="mb-6 flex flex-col gap-3">
        <Link
          href="/flashcards/daily"
          className="flex items-center gap-4 rounded-3xl bg-gradient-to-r from-butter/90 to-orange-300/90 p-5 text-white shadow-lg active:scale-[0.98]"
        >
          <span className="text-5xl">🌟</span>
          <span className="flex-1">
            <span className="block text-xl font-black">
              今日复习 <span className="text-sm font-bold opacity-80">Daily Review</span>
            </span>
            <span className="block text-sm font-bold opacity-90">
              {stats.dueToday > 0 ? `${stats.dueToday} 张卡片到期了` : "今天没有到期卡片，学点新的吧"}
            </span>
          </span>
          <span className="text-3xl">›</span>
        </Link>

        <Link
          href="/flashcards/wrong"
          className="flex items-center gap-4 rounded-3xl bg-white p-5 shadow-md active:scale-[0.98]"
        >
          <span className="text-5xl">📝</span>
          <span className="flex-1">
            <span className="block text-xl font-black text-slate-700">
              错词本 <span className="text-sm font-bold text-slate-500">Wrong Words</span>
            </span>
            <span className="block text-sm font-bold text-slate-500">{p.wrongWords.length} 个词等你再来</span>
          </span>
          <span className="text-3xl text-slate-300">›</span>
        </Link>
      </div>

      {/* 按单元 */}
      <h2 className="mb-2 px-1 text-lg font-black text-slate-700">
        按单元浏览 <span className="text-sm font-bold text-slate-500">By Unit</span>
      </h2>
      <div className="flex flex-col gap-2">
        {curriculum.units.map((u) => {
          const unlocked = u.index <= p.maxUnlockedUnitIndex;
          return (
            <Link
              key={u.id}
              href={unlocked ? `/flashcards/${u.id}` : "#"}
              className={`flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm ${unlocked ? "active:scale-[0.98]" : "opacity-40"}`}
            >
              <span className={`flex h-12 w-12 items-center justify-center rounded-full text-2xl ${u.color}`}>
                {unlocked ? u.emoji : "🔒"}
              </span>
              <span className="flex-1 text-lg font-black text-slate-700">{u.title}</span>
              <span className="text-2xl text-slate-300">›</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
