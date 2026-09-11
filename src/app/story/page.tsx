"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { curriculum } from "@/content/curriculum";
import { useProgress } from "@/lib/progress/store";
import { listCustomStories, deleteCustomStory, type CustomStory } from "@/lib/progress/customStories";

export default function Page() {
  const p = useProgress();
  const [customs, setCustoms] = useState<CustomStory[]>([]);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    setCustoms(listCustomStories());
  }, []);

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-28 pt-4 sm:pt-8">
      <header className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-700">
            📚 故事书架 <span className="text-sm font-bold text-slate-400">Story Shelf</span>
          </h1>
          <p className="text-sm font-medium text-slate-400">用学过的单词读小故事 Read with your words!</p>
        </div>
        <Link
          href="/story/new"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-grape text-3xl text-white shadow-lg"
          aria-label="添加自定义绘本"
        >
          ＋
        </Link>
      </header>

      {/* 自定义绘本 */}
      {(customs.length > 0 || editing) && (
        <h2 className="mb-2 px-1 text-base font-black text-slate-500">
          ✏️ 我们的绘本 <span className="text-xs font-bold text-slate-400">Our Stories</span>
        </h2>
      )}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {customs.map((s) => (
          <div key={s.id} className="relative flex flex-col items-center gap-2 rounded-3xl bg-white p-5 shadow-md">
            <Link href={`/story/${s.id}`} className="flex flex-col items-center gap-2">
              <span className="text-5xl">{s.emoji}</span>
              <span className="text-base font-black text-slate-700">{s.titleZh}</span>
              <span className="text-xs font-bold text-slate-400">{s.title}</span>
            </Link>
            <button
              onClick={() => {
                if (confirm(`删除绘本《${s.titleZh}》？`)) {
                  deleteCustomStory(s.id);
                  setCustoms(listCustomStories());
                }
              }}
              className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-sm text-slate-400"
              aria-label="删除"
            >
              🗑
            </button>
          </div>
        ))}
        <Link
          href="/story/new"
          className="flex min-h-36 flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-grape/40 text-grape"
        >
          <span className="text-4xl">➕</span>
          <span className="text-sm font-black">做一本绘本</span>
          <span className="text-[10px] font-bold opacity-60">Make your own</span>
        </Link>
      </div>

      {/* 内置绘本 */}
      <h2 className="mb-2 px-1 text-base font-black text-slate-500">
        🌟 课程绘本 <span className="text-xs font-bold text-slate-400">Course Stories</span>
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {curriculum.stories.map((s) => {
          const unit = curriculum.units.find((u) => u.id === s.unitTag);
          const unlocked = !unit || unit.index <= p.maxUnlockedUnitIndex;
          const read = p.stories[s.id];
          return unlocked ? (
            <Link
              key={s.id}
              href={`/story/${s.id}`}
              className="flex flex-col items-center gap-2 rounded-3xl bg-white p-5 shadow-md active:scale-95"
            >
              <span className="text-5xl">{s.emoji}</span>
              <span className="text-base font-black text-slate-700">{s.titleZh}</span>
              <span className="text-xs font-bold text-slate-400">{s.title}</span>
              {read ? (
                <span className="rounded-full bg-mint/20 px-2 py-0.5 text-[10px] font-black text-mint">
                  读过 {read.readCount} 次
                </span>
              ) : (
                <span className="rounded-full bg-butter/20 px-2 py-0.5 text-[10px] font-black text-butter">NEW</span>
              )}
            </Link>
          ) : (
            <div key={s.id} className="flex flex-col items-center gap-2 rounded-3xl bg-white/40 p-5">
              <span className="text-5xl opacity-40">🔒</span>
              <span className="text-sm font-bold text-slate-400">学完「{unit?.title}」解锁</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

