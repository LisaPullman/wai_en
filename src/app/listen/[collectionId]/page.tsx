"use client";

import { AnimatePresence } from "motion/react";
import { Suspense, use, useState } from "react";
import {
  listenCollectionById,
  listenDurationEst,
  levelBadge,
} from "@/content/listen100";
import { ListenOverlay } from "@/components/listen/ListenPlayer";

export default function Page({ params }: { params: Promise<{ collectionId: string }> }) {
  return (
    <Suspense fallback={<div className="flex min-h-dvh items-center justify-center text-5xl"><span className="animate-float">🎧</span></div>}>
      <ListenPageInner params={params} />
    </Suspense>
  );
}

function ListenPageInner({ params }: { params: Promise<{ collectionId: string }> }) {
  const { collectionId } = use(params);
  const [listenFrom, setListenFrom] = useState<number | null>(null);
  const c = listenCollectionById(collectionId);

  if (!c) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 text-center">
        <span className="text-6xl">🤔</span>
        <p className="font-bold text-slate-400">找不到这个专辑 Collection not found</p>
      </div>
    );
  }

  const totalSec = c.stories.reduce((n, s) => n + listenDurationEst(s), 0);

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-28 pt-4 sm:pt-8">
      <header className="mb-4 flex items-center gap-3">
        <span className="text-5xl">{c.emoji}</span>
        <div>
          <h1 className="text-2xl font-black text-slate-700">{c.titleZh}</h1>
          <p className="text-sm font-bold text-slate-400">
            {c.title} · {c.stories.length} 个故事 · 约 {Math.round(totalSec / 60)} 分钟
          </p>
        </div>
      </header>

      <button
        onClick={() => setListenFrom(0)}
        className="mb-4 flex w-full items-center justify-center gap-2 rounded-full bg-grape py-4 text-xl font-black text-white shadow-lg active:scale-[0.98]"
      >
        ▶️ 连播整个专辑 Listen all
      </button>

      <div className="flex flex-col gap-2">
        {c.stories.map((s, i) => {
          const d = listenDurationEst(s);
          return (
            <button
              key={s.id}
              onClick={() => setListenFrom(i)}
              className="flex items-center gap-3 rounded-2xl bg-white p-4 text-left shadow-sm active:scale-[0.98]"
            >
              <span className="text-4xl">{s.emoji}</span>
              <span className="flex-1">
                <span className="block text-base font-black text-slate-700">{s.titleZh}</span>
                <span className="block text-xs font-bold text-slate-400">{s.title}</span>
              </span>
              <span className="text-right">
                <span className="block text-xs font-black text-slate-400">
                  ≈{d >= 60 ? `${Math.floor(d / 60)}分${d % 60}秒` : `${d}秒`}
                </span>
                <span className="block text-[10px] font-bold text-grape">{levelBadge(s.level)}</span>
              </span>
              <span className="text-2xl text-slate-300">▶️</span>
            </button>
          );
        })}
      </div>

      <AnimatePresence>
        {listenFrom !== null && (
          <ListenOverlay collection={c} startIdx={listenFrom} onClose={() => setListenFrom(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
