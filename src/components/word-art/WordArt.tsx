"use client";

import type { JSX } from "react";

/**
 * 内联 SVG 单词图（fallback 资产）。
 * 当 /public/images/words/{id}.jpg 不存在时，<WordImage /> 会渲染 emoji；
 * 一些高频词（yellow 等）我们提供手绘 SVG，质感更可控、零资产依赖。
 *
 * 设计约束（spec §5.4）：
 *  - 儿童绘本扁平矢量
 *  - 明亮暖色
 *  - 圆线条
 *  - 纯色底（透明也可，父容器负责）
 *  - 无文字
 */

type Props = {
  wordId: string;
  className?: string;
};

/** 黄色单词图：一个金黄圆形气球，立体高光。 */
function YellowBalloon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      aria-label="Yellow balloon"
      role="img"
    >
      <defs>
        <radialGradient id="yellow-balloon" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#FFF59D" />
          <stop offset="55%" stopColor="#FFD95E" />
          <stop offset="100%" stopColor="#F5B82E" />
        </radialGradient>
      </defs>
      {/* 球体 */}
      <ellipse cx="60" cy="46" rx="34" ry="38" fill="url(#yellow-balloon)" stroke="#C68A1C" strokeWidth="2.5" />
      {/* 高光斑 */}
      <ellipse cx="46" cy="32" rx="9" ry="6" fill="#FFFDE7" opacity="0.85" />
      <ellipse cx="42" cy="26" rx="3" ry="2" fill="#FFFFFF" opacity="0.7" />
      {/* 气球结 */}
      <path
        d="M60 84 L57 90 L60 95 L63 90 Z"
        fill="#E8A317"
        stroke="#C68A1C"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* 飘带 */}
      <path
        d="M60 95 Q 56 102 62 108 Q 58 114 64 120"
        fill="none"
        stroke="#C68A1C"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

const REGISTRY: Record<string, (props: { className?: string }) => React.JSX.Element> = {
  yellow: YellowBalloon,
  // 后续可继续追加:red/blue/green/black/white...（直到 schnell 配额恢复）
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
