"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { DailyTheme } from "@/content/daily300";
import { dailyAudioPath } from "@/content/daily300";
import { playAsset, stopAudio } from "@/lib/audio/play";
import { BigButton, FoxyFace } from "@/components/common/common";
import { shuffle } from "@/lib/utils";

/** 听力模式（磨耳朵）：自动连播 / 单句循环 / 随机 / 变速 / 中文显隐 */
export function DailyClient({ theme }: { theme: DailyTheme }) {
  const [listening, setListening] = useState(false);
  const [showZhList, setShowZhList] = useState(true);

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-28 pt-4 sm:pt-8">
      <div className="mb-4 flex items-center gap-3">
        <span className="text-5xl">{theme.emoji}</span>
        <div>
          <h1 className="text-2xl font-black text-slate-700">{theme.titleZh}</h1>
          <p className="text-sm font-bold text-slate-500">
            {theme.title} · {theme.sentences.length} 句
          </p>
        </div>
      </div>

      <BigButton
        zh="听力模式"
        en="Listening Mode"
        className="mb-4 w-full bg-grape py-4 text-2xl text-white"
        onClick={() => setListening(true)}
      />
      <button
        onClick={() => setShowZhList((v) => !v)}
        className="mb-3 text-sm font-bold text-slate-500"
      >
        {showZhList ? "隐藏中文 Hide Chinese" : "显示中文 Show Chinese"}
      </button>

      <div className="flex flex-col gap-2">
        {theme.sentences.map((s, i) => (
          <button
            key={s.id}
            onClick={() => playAsset(dailyAudioPath(s.id), s.text, { rate: 0.95 })}
            className="flex items-center gap-3 rounded-2xl bg-white p-4 text-left shadow-sm active:scale-[0.98]"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sm font-black text-sky-500">
              {i + 1}
            </span>
            <span className="flex-1">
              <span className="block text-lg font-bold text-slate-700">{s.text}</span>
              {showZhList && <span className="block text-sm text-slate-500">{s.zh}</span>}
            </span>
            <span className="text-2xl">🔊</span>
          </button>
        ))}
      </div>

      <AnimatePresence>
        {listening && (
          <ListeningOverlay theme={theme} onClose={() => setListening(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

function ListeningOverlay({ theme, onClose }: { theme: DailyTheme; onClose: () => void }) {
  const [order, setOrder] = useState(() => theme.sentences.map((_, i) => i));
  const [pos, setPos] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [loopOne, setLoopOne] = useState(false);
  const [shuffleMode, setShuffleMode] = useState(false);
  const [slow, setSlow] = useState(false);
  const [showZh, setShowZh] = useState(true);

  // 播放决策镜像：异步回调（onEnd 等）读取最新状态，避免闭包过期。
  // 在 effect 中同步（渲染期不可读写 ref —— React Compiler 规则）
  const stateRef = useRef({ playing: false, loopOne: false, pos: 0, order, slow: false });
  useEffect(() => {
    stateRef.current = { playing, loopOne, pos, order, slow };
  }, [playing, loopOne, pos, order, slow]);

  const idx = order[pos];
  const s = theme.sentences[idx];

  // 函数声明（提升）：允许 onEnd 里自引用续播
  function play(i: number) {
    const sent = theme.sentences[i];
    const st = stateRef.current;
    setPlaying(true);
    playAsset(dailyAudioPath(sent.id), sent.text, {
      rate: st.slow ? 0.75 : 0.95, // TTS 兜底语速
      assetRate: st.slow ? 0.8 : 1, // 真实 MP3 播放速度（慢速开关）
      onEnd: () => {
        const cur = stateRef.current;
        if (!cur.playing) return;
        if (cur.loopOne) {
          play(i);
        } else if (cur.pos + 1 < cur.order.length) {
          setPos(cur.pos + 1);
          play(cur.order[cur.pos + 1]);
        } else {
          setPlaying(false); // 播完一轮
        }
      },
    });
  }

  const start = () => play(stateRef.current.order[stateRef.current.pos]);
  const pause = () => {
    setPlaying(false);
    stopAudio();
  };
  const jump = (d: -1 | 1) => {
    const st = stateRef.current;
    const np = Math.min(st.order.length - 1, Math.max(0, st.pos + d));
    setPos(np);
    stopAudio();
    if (st.playing) play(st.order[np]);
  };
  const toggleShuffle = () => {
    stopAudio();
    const wasPlaying = stateRef.current.playing;
    if (!shuffleMode) {
      setOrder((o) => shuffle(o));
      setPos(0);
      if (wasPlaying) setTimeout(() => play(0), 50);
    } else {
      setOrder(theme.sentences.map((_, i) => i));
      setPos(0);
    }
    setShuffleMode((v) => !v);
  };

  const progress = useMemo(() => `${pos + 1} / ${order.length}`, [pos, order.length]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 60 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 60 }}
      className="fixed inset-0 z-40 flex flex-col bg-gradient-to-b from-grape/95 to-violet-900/95 px-6 pb-10 pt-6"
    >
      <div className="flex items-center justify-between text-white">
        <button onClick={onClose} className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-2xl" aria-label="关闭">
          ✕
        </button>
        <div className="text-center">
          <div className="text-lg font-black">
            {theme.emoji} {theme.titleZh} · 听力模式
          </div>
          <div className="text-sm opacity-70">{progress}</div>
        </div>
        <div className="h-12 w-12" />
      </div>

      {/* 当前句 */}
      <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
        <motion.div key={s.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <div className="text-4xl font-black leading-snug text-white sm:text-5xl">{s.text}</div>
          {showZh && <div className="mt-4 text-xl font-bold text-white/70">{s.zh}</div>}
        </motion.div>
        <FoxyFace mood={playing ? "cheer" : "idle"} size="text-5xl" />
      </div>

      {/* 控制区 */}
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => jump(-1)} className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-3xl text-white" aria-label="上一句">
            ⏮
          </button>
          <button
            onClick={() => (playing ? pause() : start())}
            className="flex h-24 w-24 items-center justify-center rounded-full bg-butter text-5xl text-amber-900 shadow-xl"
            aria-label={playing ? "暂停" : "播放"}
          >
            {playing ? "⏸" : "▶️"}
          </button>
          <button onClick={() => jump(1)} className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-3xl text-white" aria-label="下一句">
            ⏭
          </button>
        </div>
        <div className="flex flex-wrap justify-center gap-2 text-sm font-bold text-white">
          <Toggle on={loopOne} onClick={() => setLoopOne((v) => !v)}>🔁 单句 Loop</Toggle>
          <Toggle on={shuffleMode} onClick={toggleShuffle}>🔀 随机 Shuffle</Toggle>
          <Toggle on={slow} onClick={() => setSlow((v) => !v)}>🐢 慢速 Slow</Toggle>
          <Toggle on={showZh} onClick={() => setShowZh((v) => !v)}>🇨🇳 中文 Chinese</Toggle>
        </div>
        <p className="text-xs text-white/50">可以只听不看，也可以边听边跟读～ Listen or repeat!</p>
      </div>
    </motion.div>
  );
}

function Toggle({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-4 py-2 transition-colors ${on ? "bg-butter text-amber-900" : "bg-white/15 text-white/80"}`}
    >
      {children}
    </button>
  );
}
