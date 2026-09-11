"use client";

import { useState } from "react";
import type { Word } from "@/content/types";
import { cn } from "@/lib/utils";
import { WordArt, hasWordArt } from "@/components/word-art/WordArt";

/** 单词图：优先级 1️⃣ /images/words/{id}.jpg → 2️⃣ 手绘 SVG(WordArt)→ 3️⃣ emoji 兜底；字母卡显示大写字母 */
export function WordImage({ word, className, emojiClass }: { word: Word; className?: string; emojiClass?: string }) {
  const [failed, setFailed] = useState(false);
  const showImg = word.kind === "word" && !failed;

  if (word.kind === "letter") {
    return (
      <div className={cn("flex flex-col items-center justify-center gap-1", className)}>
        <span className="text-6xl font-black tracking-wide text-grape sm:text-7xl">{word.text}</span>
        <span className={cn("text-4xl", emojiClass)}>{word.emoji}</span>
      </div>
    );
  }

  if (showImg) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- 本地静态资产，无需 Next Image
      <img
        src={`/images/words/${word.id}.jpg`}
        alt={word.zh}
        draggable={false}
        onError={() => setFailed(true)}
        className={cn("rounded-3xl object-contain", className)}
      />
    );
  }

  // 兜底层：手绘 SVG（高清 / 主题色可控）优先于 emoji
  if (hasWordArt(word.id)) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-full bg-white shadow-sm",
          className,
        )}
      >
        <WordArt wordId={word.id} className="h-3/4 w-3/4" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full bg-white shadow-sm",
        className,
      )}
    >
      <span className={cn("leading-none", emojiClass ?? "text-7xl")}>{word.emoji}</span>
    </div>
  );
}
