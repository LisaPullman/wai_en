"use client";

import type { JSX } from "react";

/**
 * 内联 SVG 单词图（fallback 资产）。
 * 当 /public/images/words/{id}.jpg 不存在时，<WordImage /> 会渲染 emoji；
 * 高频颜色词（red/blue/yellow...）我们提供手绘 SVG，质感更可控、零资产依赖。
 *
 * 设计约束（spec §5.4）：
 *  - 儿童绘本扁平矢量
 *  - 明亮暖色
 *  - 圆线条
 *  - 无文字
 */

type Props = {
  wordId: string;
  className?: string;
};

/* --------- 通用气球工厂（颜色 → gradient + stroke + 高光位置）--------- */
function Balloon({
  id,
  light,
  base,
  dark,
  stroke,
  className,
  label,
}: {
  id: string;
  light: string;
  base: string;
  dark: string;
  stroke: string;
  className?: string;
  label: string;
}) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-label={label} role="img">
      <defs>
        <radialGradient id={`balloon-${id}`} cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor={light} />
          <stop offset="55%" stopColor={base} />
          <stop offset="100%" stopColor={dark} />
        </radialGradient>
      </defs>
      <ellipse cx="60" cy="46" rx="34" ry="38" fill={`url(#balloon-${id})`} stroke={stroke} strokeWidth="2.5" />
      <ellipse cx="46" cy="32" rx="9" ry="6" fill="#FFFDE7" opacity="0.85" />
      <ellipse cx="42" cy="26" rx="3" ry="2" fill="#FFFFFF" opacity="0.7" />
      <path d="M60 84 L57 90 L60 95 L63 90 Z" fill={dark} stroke={stroke} strokeWidth="2" strokeLinejoin="round" />
      <path d="M60 95 Q 56 102 62 108 Q 58 114 64 120" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/* --------- 9 个颜色词手绘 SVG --------- */
const YellowBalloon = (p: { className?: string }) => (
  <Balloon id="yellow" light="#FFF59D" base="#FFD95E" dark="#F5B82E" stroke="#C68A1C" label="Yellow balloon" {...p} />
);
const RedBalloon = (p: { className?: string }) => (
  <Balloon id="red" light="#FFB199" base="#FF5A4D" dark="#C73030" stroke="#8B1A1A" label="Red balloon" {...p} />
);
const BlueBalloon = (p: { className?: string }) => (
  <Balloon id="blue" light="#B3DAFE" base="#4A8BFF" dark="#1E40AF" stroke="#1E3A8A" label="Blue balloon" {...p} />
);
const GreenBalloon = (p: { className?: string }) => (
  <Balloon id="green" light="#BFE9C9" base="#4ADE80" dark="#15803D" stroke="#14532D" label="Green balloon" {...p} />
);
const OrangeBalloon = (p: { className?: string }) => (
  <Balloon id="orange" light="#FFD9A8" base="#FF9F45" dark="#C2410C" stroke="#7C2D12" label="Orange balloon" {...p} />
);
const PurpleBalloon = (p: { className?: string }) => (
  <Balloon id="purple" light="#E0C3FC" base="#A855F7" dark="#6B21A8" stroke="#3B0764" label="Purple balloon" {...p} />
);
const PinkBalloon = (p: { className?: string }) => (
  <Balloon id="pink" light="#FFD6E7" base="#FF80B5" dark="#BE185D" stroke="#831843" label="Pink balloon" {...p} />
);
const BrownBalloon = (p: { className?: string }) => (
  <Balloon id="brown" light="#D6B493" base="#9A6A3D" dark="#5C3A1A" stroke="#3B2412" label="Brown balloon" {...p} />
);
/* 黑色气球：灰高光+深底色，避免一块死黑 */
const BlackBalloon = (p: { className?: string }) => (
  <Balloon id="black" light="#9CA3AF" base="#2D2D2D" dark="#000000" stroke="#000000" label="Black balloon" {...p} />
);
/* 白色：用云朵形状，避免死白看不出边界 */
const WhiteCloud = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 120 120" className={className} aria-label="White cloud" role="img">
    <defs>
      <radialGradient id="white-cloud" cx="35%" cy="30%" r="80%">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="100%" stopColor="#DCE6F0" />
      </radialGradient>
    </defs>
    <path
      d="M30 78 C 18 78 12 68 18 58 C 12 48 22 38 32 42 C 36 30 50 28 58 36 C 66 28 82 32 84 44 C 96 44 104 56 100 66 C 104 76 96 86 84 84 L 30 84 Z"
      fill="url(#white-cloud)"
      stroke="#9CA3AF"
      strokeWidth="2.5"
      strokeLinejoin="round"
    />
    <ellipse cx="44" cy="50" rx="8" ry="4" fill="#FFFFFF" opacity="0.7" />
  </svg>
);

const REGISTRY: Record<string, (props: { className?: string }) => JSX.Element> = {
  yellow: YellowBalloon,
  red: RedBalloon,
  blue: BlueBalloon,
  green: GreenBalloon,
  orange: OrangeBalloon,
  purple: PurpleBalloon,
  pink: PinkBalloon,
  brown: BrownBalloon,
  black: BlackBalloon,
  white: WhiteCloud,
};

export function WordArt({ wordId, className }: Props) {
  const Comp = REGISTRY[wordId];
  if (!Comp) return null;
  return <Comp className={className} />;
}

/** 是否有手绘 SVG（让 WordImage 决定走 emoji 还是 SVG） */
export function hasWordArt(wordId: string): boolean {
  return wordId in REGISTRY;
}
