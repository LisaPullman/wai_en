"use client";

import { motion } from "motion/react";
import { useState } from "react";
import type { Word } from "@/content/types";
import { playAsset, playWordAudio } from "@/lib/audio/play";
import { sfx, unlockAudio } from "@/lib/audio/sfx";
import { audioPath } from "@/lib/audio/play";
import { cn } from "@/lib/utils";
import { WordImage } from "@/components/common/WordImage";

/** 单词记忆卡：点击翻面 + 发声；正面图/字母 + 单词，背面中文 + 例句 */
export function Flashcard({ word, className }: { word: Word; className?: string }) {
  const [flipped, setFlipped] = useState(false);

  const flip = () => {
    unlockAudio();
    sfx.flip();
    // 用 updater 取最新值，避免读到旧闭包
    setFlipped((f) => {
      const next = !f;
      // 当前要展示的一面 = next 的反面（即"翻过去看到的那一面"）：
      // next === false → 翻回正面（之前是背面），重读单词
      // next === true  → 翻到背面（之前是正面），重读例句
      if (next) {
        playAsset(audioPath.wordExample(word.id), word.sentence, { rate: 0.9 });
      } else {
        playWordAudio(word.id, word.tts ?? word.text);
      }
      return next;
    });
  };

  return (
    <div className={cn("[perspective:1200px]", className)}>
      <motion.div
        className="card-3d relative h-full w-full"
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.45, ease: [0.34, 1.2, 0.64, 1] }}
        onClick={flip}
      >
        {/* 正面 */}
        <div className="card-face absolute inset-0 flex cursor-pointer flex-col items-center justify-center gap-3 rounded-[2rem] bg-white p-6 shadow-xl">
          <WordImage word={word} className="h-40 w-40 sm:h-52 sm:w-52" />
          <div className="text-center">
            <div className="text-4xl font-black text-slate-800 sm:text-5xl">{word.text}</div>
            {word.phonics && (
              <div className="mt-1 text-lg font-medium text-slate-500">{word.phonics}</div>
            )}
          </div>
          <div className="text-sm font-semibold text-slate-300">点我翻面 Flip</div>
        </div>
        {/* 背面 */}
        <div className="card-face card-back absolute inset-0 flex cursor-pointer flex-col items-center justify-center gap-4 rounded-[2rem] bg-grape/90 p-6 text-white shadow-xl">
          <div className="text-5xl font-black">{word.zh}</div>
          <div className="text-2xl">{word.emoji}</div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              playAsset(audioPath.wordExample(word.id), word.sentence, { rate: 0.9 });
            }}
            className="flex items-center gap-2 rounded-full bg-white/20 px-5 py-3 text-lg font-bold"
          >
            🔊 {word.sentence}
          </button>
          <div className="text-sm opacity-70">{word.sentenceZh}</div>
        </div>
      </motion.div>
    </div>
  );
}
