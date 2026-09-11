"use client";

import { motion } from "motion/react";
import type { SVGProps } from "react";

/* ============================================================
 * 内联 SVG 装饰组件 —— 童趣 / 高对比 / 零依赖 / 可被 CSS 着色
 * 设计原则：
 *  - 描边色用 currentColor，方便主题色控制
 *  - 节点用 rx="9999" 圆角统一，呈现圆润友好
 *  - 所有路径坐标基于 24x24 viewBox
 * ============================================================ */

type IconProps = SVGProps<SVGSVGElement>;

/* ----- 5 角星 ----- */
export function StarIcon({ filled = true, className, ...rest }: IconProps & { filled?: boolean }) {
  const path =
    "M12 2.5l2.95 6.27 6.85.74-5.1 4.66 1.45 6.73L12 17.6l-6.15 3.3 1.45-6.73-5.1-4.66 6.85-.74L12 2.5z";
  return (
    <svg viewBox="0 0 24 24" className={className} {...rest} aria-hidden>
      <path
        d={path}
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={filled ? 0 : 1.6}
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ----- 火焰（streak） ----- */
export function FlameIcon({ className, ...rest }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...rest} aria-hidden>
      <defs>
        <linearGradient id="flame-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFD95E" />
          <stop offset="60%" stopColor="#FF7B6B" />
          <stop offset="100%" stopColor="#FF5252" />
        </linearGradient>
      </defs>
      <path
        d="M12 2.2c.6 3.1-.8 4.5-2.2 5.7-1.7 1.5-3.6 3-3.6 6.3 0 4.3 3.5 7.8 7.8 7.8s7.8-3.5 7.8-7.8c0-2.8-1.3-4.4-2.7-5.7-.4 1.3-1 1.8-1.7 1.8-.9 0-1.5-.7-1.5-2.4 0-1.6-1-3.4-3.9-5.7z"
        fill="url(#flame-grad)"
        stroke="#C73030"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ----- 实心圆 + 高光（avatar 背景圆） ----- */
export function BubbleCircle({ color = "#FFD95E", size = 96, className }: { color?: string; size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={className} aria-hidden>
      <circle cx="50" cy="50" r="46" fill={color} />
      <ellipse cx="38" cy="34" rx="14" ry="8" fill="white" opacity="0.45" />
    </svg>
  );
}

/* ----- 翻页箭头（左 / 右） ----- */
export function ArrowIcon({ dir = "right", className, ...rest }: IconProps & { dir?: "left" | "right" | "up" | "down" }) {
  const transform = { left: "rotate(180 12 12)", right: "", up: "rotate(-90 12 12)", down: "rotate(90 12 12)" }[dir];
  return (
    <svg viewBox="0 0 24 24" className={className} {...rest} aria-hidden>
      <g transform={transform}>
        <path d="M8 5l8 7-8 7" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

/* ----- 喇叭（发音按钮） ----- */
export function SpeakerIcon({ className, ...rest }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...rest} aria-hidden>
      <path
        d="M4 9v6h4l5 4V5L8 9H4z"
        fill="currentColor"
      />
      <path
        d="M16 8c1.5 1 1.5 7 0 8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M19 6c2.5 1.6 2.5 10.4 0 12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

/* ----- 笑脸（鼓励/对错/中性）----- */
export function SmileyFace({ mood = "happy", className, ...rest }: IconProps & { mood?: "happy" | "sad" | "wink" }) {
  const eye = mood === "wink" ? { left: "M7 10c1 1 2 1 2 0", right: "M15 10c1 1 2 1 2 0" } : null;
  return (
    <svg viewBox="0 0 24 24" className={className} {...rest} aria-hidden>
      <circle cx="12" cy="12" r="10" fill="#FFD95E" stroke="#C9A227" strokeWidth="1.5" />
      {eye ? (
        <>
          <path d={eye.left} stroke="#3D2C1E" strokeWidth="2" strokeLinecap="round" fill="none" />
          <path d={eye.right} stroke="#3D2C1E" strokeWidth="2" strokeLinecap="round" fill="none" />
        </>
      ) : (
        <>
          <circle cx="9" cy="10" r="1.4" fill="#3D2C1E" />
          <circle cx="15" cy="10" r="1.4" fill="#3D2C1E" />
        </>
      )}
      <path
        d={mood === "sad" ? "M8 16c1.5-1.5 6.5-1.5 8 0" : "M8 14c1.5 2 6.5 2 8 0"}
        stroke="#3D2C1E"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

/* ----- 课程地图连线（用 path + motion 画线）----- */
export function MapDots({ count, activeIndex, className }: { count: number; activeIndex: number; className?: string }) {
  return (
    <svg viewBox="0 0 40 200" className={className} preserveAspectRatio="none" aria-hidden>
      <line
        x1="20" y1="20" x2="20" y2="180"
        stroke="#E0D8C8"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray="6 8"
      />
    </svg>
  );
}

/* ----- 装饰背景：云朵 ----- */
export function CloudShape({ className, ...rest }: IconProps) {
  return (
    <svg viewBox="0 0 100 60" className={className} aria-hidden {...rest}>
      <path
        d="M20 50c-10 0-18-7-18-16 0-8 7-15 15-15 1-9 9-15 18-15 10 0 18 7 19 16 8 0 14 6 14 14s-7 14-15 14H20z"
        fill="currentColor"
        opacity="0.6"
      />
    </svg>
  );
}

/* ----- Foxy 狐狸（自绘 SVG 版本，比 emoji 表情可控）----- */
export function FoxySvg({
  mood = "happy",
  size = 96,
  className,
}: {
  mood?: "happy" | "cheer" | "idle" | "think" | "sad";
  size?: number;
  className?: string;
}) {
  const eyeY = mood === "sleep" ? 36 : 36;
  const mouth =
    mood === "happy" ? "M 38 56 Q 50 64 62 56" :
    mood === "cheer" ? "M 36 54 Q 50 68 64 54" :
    mood === "sad" ? "M 38 60 Q 50 54 62 60" :
    mood === "think" ? "M 38 58 Q 50 60 62 58" :
    "M 38 56 Q 50 60 62 56"; // idle
  return (
    <motion.svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      animate={
        mood === "cheer"
          ? { y: [0, -6, 0], rotate: [0, -4, 4, 0] }
          : mood === "sad"
            ? { rotate: [0, -2, 2, 0] }
            : mood === "think"
              ? { rotate: [0, 5, 0] }
              : { y: [0, -3, 0] }
      }
      transition={{ repeat: Infinity, duration: mood === "cheer" ? 0.7 : 2.4 }}
      aria-label="Foxy 阿福"
    >
      {/* 耳朵外 */}
      <polygon points="22,18 14,38 32,32" fill="#E5783A" />
      <polygon points="78,18 86,38 68,32" fill="#E5783A" />
      {/* 耳朵内 */}
      <polygon points="22,22 17,34 30,30" fill="#FFD8C0" />
      <polygon points="78,22 83,34 70,30" fill="#FFD8C0" />
      {/* 头 */}
      <circle cx="50" cy="52" r="28" fill="#F48950" stroke="#C25A1A" strokeWidth="2" />
      {/* 脸白 */}
      <ellipse cx="50" cy="60" rx="20" ry="16" fill="#FFE8D6" />
      {/* 眼睛 */}
      {mood === "idle" ? (
        <>
          <circle cx="40" cy={eyeY} r="3" fill="#3D2C1E" />
          <circle cx="60" cy={eyeY} r="3" fill="#3D2C1E" />
        </>
      ) : (
        <>
          <circle cx="40" cy={eyeY} r="3.4" fill="#3D2C1E" />
          <circle cx="60" cy={eyeY} r="3.4" fill="#3D2C1E" />
          <circle cx="41" cy={eyeY - 1} r="1" fill="white" />
          <circle cx="61" cy={eyeY - 1} r="1" fill="white" />
        </>
      )}
      {/* 鼻子 */}
      <ellipse cx="50" cy="50" rx="3" ry="2.2" fill="#3D2C1E" />
      {/* 嘴 */}
      <path d={mouth} stroke="#3D2C1E" strokeWidth="2" strokeLinecap="round" fill="none" />
      {/* 腮红 */}
      <circle cx="32" cy="58" r="3.5" fill="#FF8FA3" opacity="0.6" />
      <circle cx="68" cy="58" r="3.5" fill="#FF8FA3" opacity="0.6" />
    </motion.svg>
  );
}

/* ----- 检查 ✓ 图标 ----- */
export function CheckIcon({ className, ...rest }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...rest} aria-hidden>
      <circle cx="12" cy="12" r="10" fill="#4ECDA5" />
      <path d="M7 12.5l3.2 3.2L17 9" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

/* ----- 进度圆环（环动画）----- */
export function ProgressRing({
  value,
  max,
  size = 48,
  stroke = 5,
  className,
}: {
  value: number;
  max: number;
  size?: number;
  stroke?: number;
  className?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.min(1, value / Math.max(1, max));
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} className={className} aria-hidden>
      <circle cx={size / 2} cy={size / 2} r={r} stroke="#E5E7EB" strokeWidth={stroke} fill="none" />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke="currentColor"
        strokeWidth={stroke}
        strokeLinecap="round"
        fill="none"
        strokeDasharray={c}
        initial={{ strokeDashoffset: c }}
        animate={{ strokeDashoffset: c * (1 - pct) }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </svg>
  );
}
