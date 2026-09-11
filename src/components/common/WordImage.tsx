"use client";

import { useState } from "react";
import type { Word } from "@/content/types";
import { cn } from "@/lib/utils";

/** 单词图：优先 /images/words/{id}.jpg，缺失自动降级为 emoji 大圆；字母卡显示大写字母 */
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
