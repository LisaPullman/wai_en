"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { playAsset } from "@/lib/audio/play";
import { unlockAudio } from "@/lib/audio/sfx";
import { FoxyFace, type Mood } from "./common";

/** Foxy 的台词：中英双语 + 语音资产键（public/audio/ui/，缺失走 TTS 兜底） */
export interface FoxyLine {
  zh: string;
  en: string;
  /** /audio/ui/foxy-{key}.mp3，例如 key="hello" → /audio/ui/foxy-hello.mp3 */
  audio?: string;
  mood: Mood;
}

const LINES: FoxyLine[] = [
  { zh: "你好呀！我是阿福！", en: "Hi! I'm Foxy!", audio: "/audio/ui/foxy-line-1.mp3", mood: "cheer" },
  { zh: "我们一起学英语吧！", en: "Let's learn English!", audio: "/audio/ui/foxy-line-2.mp3", mood: "happy" },
  { zh: "点一点，听一听！", en: "Tap and listen!", audio: "/audio/ui/foxy-line-3.mp3", mood: "happy" },
  { zh: "你可以的！", en: "You can do it!", audio: "/audio/ui/foxy-line-4.mp3", mood: "cheer" },
  { zh: "休息一下也可以哦～", en: "Take a little break~", audio: "/audio/ui/foxy-line-5.mp3", mood: "idle" },
  { zh: "我最喜欢讲故事啦！", en: "I love stories!", audio: "/audio/ui/foxy-line-6.mp3", mood: "happy" },
];

/** 默认打招呼音频（首次进站播一次） */
export const FOXY_DEFAULT_AUDIO = "/audio/ui/foxy-hello.mp3";

/** 全局陪伴的 Foxy：悬浮在左下角（TabBar 上方），点按说话互动 */
export function FoxyBuddy() {
  const [idx, setIdx] = useState(0);
  const [showBubble, setShowBubble] = useState(false);
  const line = LINES[idx];

  useEffect(() => {
    // 进站 1.2 秒后主动打个招呼
    const t = setTimeout(() => setShowBubble(true), 1200);
    return () => clearTimeout(t);
  }, []);

  const talk = useCallback(() => {
    unlockAudio();
    setIdx((i) => (i + 1) % LINES.length);
    setShowBubble(true);
    const cur = LINES[(idx + 1) % LINES.length];
    // 优先用生成的资产；缺失时 TTS 兜底
    playAsset(cur.audio ?? FOXY_DEFAULT_AUDIO, cur.en, { rate: 0.9 });
    // 英文说完补一句中文（同样优先用资产，缺失时 TTS 兜底）
    if (cur.audio) {
      const t = setTimeout(() => {
        playAsset(cur.audio!.replace(/-(\d+)\.mp3$/, "-$1-zh.mp3"), cur.zh, { lang: "zh-CN", rate: 0.95 });
      }, 2600);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [idx]);

  return (
    <div className="pointer-events-none fixed bottom-24 left-3 z-30 sm:bottom-28">
      <div className="pointer-events-auto flex items-end gap-2">
        <AnimatePresence>
          {showBubble && (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 8, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              className="relative mb-2 max-w-44 rounded-2xl bg-white px-3 py-2 shadow-lg"
            >
              <div className="text-sm font-bold text-slate-700">{line.zh}</div>
              <div className="text-xs font-medium text-slate-400">{line.en}</div>
              <div className="absolute -left-1.5 bottom-3 h-3 w-3 rotate-45 bg-white" />
            </motion.div>
          )}
        </AnimatePresence>
        <motion.button
          aria-label="Foxy 阿福"
          whileTap={{ scale: 0.88 }}
          onClick={talk}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-white/80 shadow-lg backdrop-blur"
        >
          <FoxyFace mood={line.mood} size="text-4xl" />
        </motion.button>
      </div>
    </div>
  );
}
