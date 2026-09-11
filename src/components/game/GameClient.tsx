"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { curriculum, unitWords } from "@/content/curriculum";
import { useProgress, progressActions } from "@/lib/progress/store";
import { BubblePop } from "./BubblePop";
import { BigButton, Mascot } from "@/components/common/common";
import { sfx } from "@/lib/audio/sfx";

/** 游戏页：选词库 → 玩 → 记成绩（M1 仅泡泡爆爆） */
export function GameClient({ gameId }: { gameId: string }) {
  const router = useRouter();
  const p = useProgress();
  const [started, setStarted] = useState(false);
  const [seed] = useState(() => Math.floor(Math.random() * 1e9));

  const unlockedUnits = useMemo(
    () => curriculum.units.filter((u) => u.index <= p.maxUnlockedUnitIndex),
    [p.maxUnlockedUnitIndex],
  );
  const pool = useMemo(
    () =>
      unlockedUnits
        .flatMap((u) => unitWords(u))
        .filter((w) => w.kind === "word"),
    [unlockedUnits],
  );
  const lastUnit = unlockedUnits[unlockedUnits.length - 1];

  if (!started) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-6 px-4 pb-28 pt-8 text-center">
        <span className="text-7xl">🫧</span>
        <h1 className="text-2xl font-black text-slate-700">
          泡泡爆爆 <span className="text-sm font-bold text-slate-500">Bubble Pop</span>
        </h1>
        <Mascot bubble="听单词，点破对的泡泡！" bubbleEn="Listen and pop!" />
        <p className="font-medium text-slate-500">
          用你学过的 {pool.length} 个单词玩
          <br />
          Playing with {pool.length} words
        </p>
        <BigButton
          zh="开始玩"
          en="Play"
          className="bg-butter px-12 text-2xl text-amber-900"
          onClick={() => setStarted(true)}
        />
        <button onClick={() => router.back()} className="text-sm font-bold text-slate-500">
          返回 Back
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-28 pt-4">
      <BubblePop
        words={pool}
        unit={lastUnit}
        seed={seed}
        onExit={(r) => {
          progressActions.recordGame(gameId, r.score, r.stars, r.wrongIds);
          sfx.tada();
          setStarted(false);
          router.push("/games");
        }}
      />
    </div>
  );
}
