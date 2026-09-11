"use client";

import Link from "next/link";
import { useMemo } from "react";
import { curriculum, unitById, unitWords } from "@/content/curriculum";
import { buildDailyReview } from "@/lib/progress/srs";
import { progressActions, useProgress } from "@/lib/progress/store";
import { sfx } from "@/lib/audio/sfx";
import { DeckPlayer, type DeckSummary } from "./DeckPlayer";
import { Mascot } from "@/components/common/common";

/** deckId: "daily"（SRS 每日复习）/ "wrong"（错词本）/ 单元 id */
export function DeckClient({ deckId }: { deckId: string }) {
  const p = useProgress();

  const { words, title, titleEn } = useMemo(() => {
    if (deckId === "daily") {
      const candidates = curriculum.units
        .filter((u) => u.index <= p.maxUnlockedUnitIndex)
        .flatMap((u) => unitWords(u).filter((w) => w.kind === "word"));
      const ids = buildDailyReview(p.srs, candidates.map((w) => w.id));
      const ws = ids.map((id) => curriculum.words[id]).filter(Boolean);
      return { words: ws.length ? ws : candidates.slice(0, 5), title: "今日复习", titleEn: "Daily Review" };
    }
    if (deckId === "wrong") {
      const ws = p.wrongWords.map((id) => curriculum.words[id]).filter(Boolean);
      return { words: ws, title: "错词本", titleEn: "Wrong Words" };
    }
    const unit = unitById(deckId);
    const ws = unit ? unitWords(unit).filter((w) => w.kind === "word") : [];
    return { words: ws, title: unit ? `${unit.emoji} ${unit.title}` : "卡片", titleEn: "Unit Cards" };
  }, [deckId, p.srs, p.wrongWords, p.maxUnlockedUnitIndex]);

  const onDone = (s: DeckSummary) => {
    if (deckId !== "wrong" && s.got >= 3) progressActions.addStars(1);
    sfx.tada();
  };

  if (words.length === 0) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-6 px-4 py-24 text-center">
        <Mascot mood="happy" bubble="这里还是空的！" bubbleEn="Nothing here yet!" />
        <p className="font-medium text-slate-500">
          {deckId === "wrong"
            ? "太棒了，没有错词！Keep it up!"
            : "先去上课学新单词吧～ Go learn some new words!"}
        </p>
        <Link href="/" className="rounded-full bg-white px-8 py-4 font-black text-slate-600 shadow">
          回地图 Map
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md px-4 pb-28 pt-4 sm:pt-6">
      <header className="mb-4 text-center">
        <h1 className="text-2xl font-black text-slate-700">
          {title} <span className="text-sm font-bold text-slate-500">{titleEn}</span>
        </h1>
        <p className="text-sm font-medium text-slate-500">
          点卡片翻面发声，然后告诉阿福你会不会 Tap, flip, and tell Foxy!
        </p>
      </header>
      <DeckPlayer
        words={words}
        onDone={onDone}
        doneLabel={deckId === "daily" ? { zh: "复习完成", en: "All reviewed" } : { zh: "完成", en: "Done" }}
      />
    </div>
  );
}
