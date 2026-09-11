"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ListenCollection, ListenStory } from "@/content/listen100";
import { listenAudioPath } from "@/content/listen100";
import { playAsset, stopAudio } from "@/lib/audio/play";
import { progressActions } from "@/lib/progress/store";
import { FoxyFace } from "@/components/common/common";
import { cn } from "@/lib/utils";

/** 听故事播放器：整篇朗读 + 句子滚动高亮 + 连播 + 变速 + 文本/中文显隐 */
export function ListenOverlay({
  collection,
  startIdx = 0,
  onClose,
}: {
  collection: ListenCollection;
  startIdx?: number;
  onClose: () => void;
}) {
  const [si, setSi] = useState(startIdx);
  const [playing, setPlaying] = useState(false);
  const [autoNext, setAutoNext] = useState(true);
  const [slow, setSlow] = useState(false);
  const [showText, setShowText] = useState(true);
  const [showZh, setShowZh] = useState(false);
  const [activeSentence, setActiveSentence] = useState(-1);
  const [finishedIds, setFinishedIds] = useState<Set<string>>(new Set());

  const story = collection.stories[si];
  const wordCounts = useMemo(
    () => story.sentences.map((s) => s.trim().split(/\s+/).length),
    [story],
  );
  const totalWords = useMemo(() => wordCounts.reduce((a, b) => a + b, 0), [wordCounts]);

  // 播放状态放 ref，供计时器回调读取最新值
  const ref = useRef({ playing, autoNext, slow, si });
  ref.current = { playing, autoNext, slow, si };

  const stop = useCallback(() => {
    setPlaying(false);
    setActiveSentence(-1);
    stopAudio();
  }, []);

  // 卸载时停止
  useEffect(() => () => stopAudio(), []);

  const play = useCallback(
    (idx: number) => {
      const s = collection.stories[idx];
      setPlaying(true);
      // 句子高亮：按词数占比分配整篇时长（实测时长拿不到时用 0.42s/词估算）
      const perWord = ref.current.slow ? 0.55 : 0.42;
      const totalMs = s.sentences.join(" ").split(/\s+/).length * perWord * 1000;
      let acc = 0;
      const starts = wordCounts.map((w) => {
        const t = acc;
        acc += (w / Math.max(1, totalWords)) * totalMs;
        return t;
      });
      const t0 = Date.now();
      setActiveSentence(0);
      const tick = () => {
        if (!ref.current.playing) return;
        const el = Date.now() - t0;
        let i = 0;
        while (i < starts.length - 1 && el >= starts[i + 1]) i++;
        setActiveSentence((prev) => (prev === i ? prev : i));
        if (el < totalMs + 800) {
          requestAnimationFrame(tick);
        } else {
          setActiveSentence(-1);
        }
      };
      requestAnimationFrame(tick);

      playAsset(listenAudioPath(s.id), s.sentences.join(" "), {
        rate: ref.current.slow ? 0.75 : 0.92,
        onEnd: () => {
          setActiveSentence(-1);
          // 记完成 + 连播
          setFinishedIds((prev) => new Set(prev).add(s.id));
          progressActions.markDailyTask("story");
          const st = ref.current;
          if (st.playing && st.autoNext && st.si + 1 < collection.stories.length) {
            const next = st.si + 1;
            setSi(next);
            setTimeout(() => play(next), 700);
          } else if (st.playing && st.autoNext) {
            setPlaying(false); // 整专辑播完
          } else {
            setPlaying(false);
          }
        },
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [collection, wordCounts, totalWords],
  );

  const jump = (d: -1 | 1) => {
    const np = Math.min(collection.stories.length - 1, Math.max(0, ref.current.si + d));
    const wasPlaying = ref.current.playing;
    setSi(np);
    stop();
    if (wasPlaying) setTimeout(() => play(np), 150);
  };

  const storyDone = finishedIds.has(story.id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 60 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 60 }}
      className="fixed inset-0 z-40 flex flex-col bg-gradient-to-b from-indigo-950/95 to-violet-900/95 px-4 pb-8 pt-5"
    >
      {/* 头 */}
      <div className="flex items-center justify-between text-white">
        <button onClick={() => { stop(); onClose(); }} className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-2xl" aria-label="关闭">
          ✕
        </button>
        <div className="text-center">
          <div className="text-base font-black">
            {collection.emoji} {collection.titleZh}
          </div>
          <div className="text-xs opacity-60">
            {si + 1} / {collection.stories.length} · {autoNext ? "连播中" : "单篇"}
          </div>
        </div>
        <button onClick={() => setAutoNext((v) => !v)} className={cn("flex h-12 w-12 items-center justify-center rounded-full text-xl", autoNext ? "bg-butter" : "bg-white/15")} aria-label="连播开关">
          🔗
        </button>
      </div>

      {/* 正文 */}
      <div className="mt-4 flex flex-1 flex-col items-center overflow-y-auto">
        <div className="flex flex-col items-center gap-2 py-2">
          <motion.span
            key={story.id}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={cn("text-7xl", playing && "animate-float")}
          >
            {story.emoji}
          </motion.span>
          <div className="text-center">
            <div className="text-xl font-black text-white">{story.titleZh}</div>
            <div className="text-sm font-bold text-white/50">{story.title}{storyDone ? " · 已听完 ✓" : ""}</div>
          </div>
        </div>

        {showText ? (
          <div className="mt-3 flex w-full max-w-xl flex-col gap-1.5 rounded-3xl bg-white/10 p-4">
            {story.sentences.map((s, i) => (
              <div
                key={i}
                className={cn(
                  "rounded-xl px-3 py-2 text-base font-bold leading-snug transition-colors sm:text-lg",
                  activeSentence === i ? "bg-butter text-indigo-950" : "text-white/75",
                )}
              >
                {s}
              </div>
            ))}
            {showZh && (
              <p className="mt-2 rounded-xl bg-white/10 px-3 py-2 text-sm font-medium text-white/60">
                🇨🇳 {story.zh}
              </p>
            )}
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <FoxyFace mood={playing ? "idle" : "think"} size="text-7xl" />
            <p className="mt-2 text-sm font-bold text-white/40">闭上眼睛，只用耳朵听～ Just listen</p>
          </div>
        )}
      </div>

      {/* 控制区 */}
      <div className="mt-3 flex flex-col items-center gap-3">
        <div className="flex items-center gap-5">
          <button onClick={() => jump(-1)} className="flex h-14 w-14 items-center justify-center rounded-full bg-white/15 text-2xl text-white" aria-label="上一篇">
            ⏮
          </button>
          <button
            onClick={() => (playing ? stop() : play(si))}
            className="flex h-20 w-20 items-center justify-center rounded-full bg-butter text-4xl text-white shadow-xl"
            aria-label={playing ? "暂停" : "播放"}
          >
            {playing ? "⏸" : "▶️"}
          </button>
          <button onClick={() => jump(1)} className="flex h-14 w-14 items-center justify-center rounded-full bg-white/15 text-2xl text-white" aria-label="下一篇">
            ⏭
          </button>
        </div>
        <div className="flex flex-wrap justify-center gap-2 text-xs font-bold text-white">
          <T on={slow} onClick={() => { setSlow((v) => !v); if (ref.current.playing) { stop(); } }}>🐢 慢速</T>
          <T on={showText} onClick={() => setShowText((v) => !v)}>📄 文本</T>
          <T on={showZh} onClick={() => setShowZh((v) => !v)} disabled={!showText}>🇨🇳 大意</T>
        </div>
        <p className="text-[11px] text-white/40">听完一篇记一次「读故事」任务哦～</p>
      </div>
    </motion.div>
  );
}

function T({ on, onClick, children, disabled }: { on: boolean; onClick: () => void; children: React.ReactNode; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "rounded-full px-3.5 py-2 transition-colors",
        on ? "bg-butter text-white" : "bg-white/15 text-white/80",
        disabled && "opacity-30",
      )}
    >
      {children}
    </button>
  );
}
