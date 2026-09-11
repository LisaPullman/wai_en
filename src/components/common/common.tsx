"use client";

import { motion } from "motion/react";
import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { sfx, unlockAudio } from "@/lib/audio/sfx";

/** 双语按钮内容：中文大字 + 英文小字 */
export function BiLabel({ zh, en }: { zh: string; en: string }) {
  return (
    <span className="flex flex-col items-center leading-tight">
      <span>{zh}</span>
      <span className="text-sm font-semibold opacity-70">{en}</span>
    </span>
  );
}

/** 大号触屏按钮（热区 ≥64px），默认双语标注 */
export function BigButton({
  children,
  zh,
  en,
  onClick,
  className,
  disabled,
  sound = "tap",
}: {
  children?: React.ReactNode;
  zh?: string;
  en?: string;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  sound?: "tap" | "none";
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.94 }}
      disabled={disabled}
      onClick={() => {
        unlockAudio();
        if (sound !== "none") sfx.tap();
        onClick?.();
      }}
      className={cn(
        "inline-flex min-h-16 items-center justify-center gap-2 rounded-full px-8 text-xl font-bold",
        "bg-white text-slate-700 shadow-[0_6px_0_rgba(0,0,0,0.08)] active:shadow-none",
        "disabled:opacity-40",
        className,
      )}
    >
      {zh && en ? <BiLabel zh={zh} en={en} /> : children}
    </motion.button>
  );
}

/** 喇叭按钮：点按发声 */
export function SpeakButton({
  onClick,
  className,
  size = "md",
  label,
}: {
  onClick: () => void;
  className?: string;
  size?: "sm" | "md" | "lg";
  label?: string;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      aria-label={label ?? "播放发音"}
      onClick={(e) => {
        e.stopPropagation();
        unlockAudio();
        onClick();
      }}
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-butter text-white shadow-md",
        size === "sm" && "h-10 w-10 text-lg",
        size === "md" && "h-14 w-14 text-2xl",
        size === "lg" && "h-20 w-20 text-4xl",
        className,
      )}
    >
      🔊
    </motion.button>
  );
}

export type Mood = "happy" | "idle" | "cheer" | "sad" | "think";

/** 吉祥物小狐狸 Foxy（阿福）的基础形象 */
export function FoxyFace({ mood = "happy", size = "text-6xl" }: { mood?: Mood; size?: string }) {
  return (
    <motion.span
      animate={
        mood === "cheer"
          ? { y: [0, -12, 0], rotate: [0, -8, 8, 0] }
          : mood === "sad"
            ? { rotate: [0, -3, 3, 0] }
            : mood === "think"
              ? { rotate: [0, 6, 0] }
              : { y: [0, -4, 0] }
      }
      transition={{ repeat: Infinity, duration: mood === "cheer" ? 0.7 : 2.4 }}
      className={cn("inline-block select-none", size)}
    >
      🦊
    </motion.span>
  );
}

/** 课内引导用的 Foxy + 气泡（双语台词） */
export function Mascot({
  mood = "happy",
  bubble,
  bubbleEn,
  className,
}: {
  mood?: Mood;
  bubble?: string;
  bubbleEn?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-end gap-2", className)}>
      {bubble && (
        <div className="relative mb-3 rounded-2xl bg-white px-4 py-2 shadow-md">
          <div className="text-base font-bold text-slate-700">{bubble}</div>
          {bubbleEn && <div className="text-sm font-medium text-slate-400">{bubbleEn}</div>}
          <div className="absolute -right-2 bottom-3 h-4 w-4 rotate-45 bg-white" />
        </div>
      )}
      <FoxyFace mood={mood} />
    </div>
  );
}

/** 得星动画：1-3 颗星星依次弹出 */
export function Stars({ count, className }: { count: 1 | 2 | 3; className?: string }) {
  return (
    <div className={cn("flex justify-center gap-2", className)}>
      {[1, 2, 3].map((i) => (
        <motion.span
          key={i}
          initial={{ scale: 0, rotate: -30 }}
          animate={i <= count ? { scale: 1, rotate: 0 } : { scale: 0.8, opacity: 0.25 }}
          transition={{ delay: i * 0.25, type: "spring", stiffness: 300, damping: 12 }}
          className="text-5xl"
        >
          ⭐
        </motion.span>
      ))}
    </div>
  );
}

/** 顶部进度条 */
export function ProgressBar({ value, max }: { value: number; max: number }) {
  return (
    <div className="h-3 w-full overflow-hidden rounded-full bg-white/70">
      <motion.div
        className="h-full rounded-full bg-mint"
        animate={{ width: `${Math.min(100, (value / Math.max(1, max)) * 100)}%` }}
      />
    </div>
  );
}

/** 答对星星飞溅 */
export function StarBurst({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.span
          key={i}
          initial={{ scale: 0, x: 0, y: 0 }}
          animate={{
            scale: [0, 1.2, 0.8],
            x: Math.cos((i / 5) * Math.PI * 2) * 90,
            y: Math.sin((i / 5) * Math.PI * 2) * 90,
            opacity: [1, 1, 0],
          }}
          transition={{ duration: 0.7 }}
          className="absolute text-3xl"
        >
          ⭐
        </motion.span>
      ))}
    </div>
  );
}

/** 首次手势解锁音频（挂载在根布局的隐形层） */
export function AudioUnlock() {
  useEffect(() => {
    const h = () => unlockAudio();
    window.addEventListener("pointerdown", h, { once: true });
    return () => window.removeEventListener("pointerdown", h);
  }, []);
  return null;
}
