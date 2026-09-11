"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import type { Story } from "@/content/types";
import { curriculum } from "@/content/curriculum";
import { playAsset, speak, stopAudio, audioPath } from "@/lib/audio/play";
import { sfx } from "@/lib/audio/sfx";
import { progressActions } from "@/lib/progress/store";
import { BigButton, Mascot } from "@/components/common/common";
import { cn } from "@/lib/utils";

/** 插画：自定义 dataURL / 内置生成图（缺失自动 emoji） */
function StoryArt({ story, pageIndex }: { story: Story; pageIndex: number }) {
  const pg = story.pages[pageIndex];
  const [imgFailed, setImgFailed] = useState(false);
  const custom = (story as { custom?: boolean }).custom === true;
  const src = pg.image ?? (custom ? undefined : `/images/stories/${story.id}/p${pageIndex + 1}.jpg`);
  if (src && !imgFailed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- dataURL / 本地静态资产
      <img
        src={src}
        alt={pg.zh}
        draggable={false}
        onError={() => setImgFailed(true)}
        className="h-full w-full object-cover"
      />
    );
  }
  return (
    <motion.span
      key={pageIndex}
      initial={{ scale: 0.7, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 16 }}
      className="text-9xl"
    >
      {pg.emoji}
    </motion.span>
  );
}

/** 绘本阅读器：整页朗读 + 逐词 karaoke + 点词发声 + 自动翻页（内置与自定义绘本通用） */
export function StoryReader({ story }: { story: Story }) {
  const [page, setPage] = useState(0);
  const [activeWord, setActiveWord] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [finished, setFinished] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const pg = story.pages[page];
  const last = page === story.pages.length - 1;

  const stopKaraoke = useCallback(() => {
    clearInterval(timerRef.current);
    setActiveWord(-1);
    setPlaying(false);
  }, []);

  // 先定义翻页（供 playPage 的自动连播回调引用，避免声明前访问）
  const goNext = useCallback(() => {
    stopKaraoke();
    sfx.flip();
    if (last) {
      setFinished(true);
      progressActions.completeStory(story.id);
      sfx.tada();
    } else {
      setPage((i) => i + 1);
    }
  }, [last, stopKaraoke, story.id]);
  const goPrev = useCallback(() => {
    stopKaraoke();
    sfx.flip();
    setPage((i) => Math.max(0, i - 1));
  }, [stopKaraoke]);

  const playPage = useCallback(
    (autoNext: boolean) => {
      stopAudio();
      clearInterval(timerRef.current);
      setPlaying(true);
      const perWord = Math.max(320, Math.min(900, 3200 / pg.words.length));
      let i = 0;
      setActiveWord(0);
      timerRef.current = setInterval(() => {
        i++;
        if (i >= pg.words.length) {
          clearInterval(timerRef.current);
          setActiveWord(-1);
          setPlaying(false);
          if (autoNext && !last) setTimeout(() => goNext(), 600);
        } else {
          setActiveWord(i);
        }
      }, perWord);
      playAsset(audioPath.storyPage(story.id, page + 1), pg.text, {
        rate: 0.95,
        onEnd: () => {
          clearInterval(timerRef.current);
          setActiveWord(-1);
        },
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pg, page, last],
  );

  const tapWord = (tok: string) => {
    const w = curriculum.words[tok.toLowerCase()];
    if (w) playAsset(`/audio/words/${w.id}.mp3`, w.tts ?? w.text, { rate: 0.8 });
    else speak(tok, { rate: 0.85 });
  };

  if (finished) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-6 px-4 py-20 text-center">
        <Mascot mood="cheer" bubble="故事读完啦！" bubbleEn="The end! Great job!" />
        <div className="text-6xl">🎉</div>
        <p className="text-lg font-black text-slate-500">+2 ⭐ 你真棒！You did it!</p>
        <div className="flex gap-3">
          <BigButton
            zh="再读一次"
            en="Again"
            onClick={() => {
              setFinished(false);
              setPage(0);
            }}
          />
          <Link href="/story">
            <BigButton zh="书架" en="Shelf" className="bg-mint text-white">
              书架 Shelf
            </BigButton>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="mx-auto flex min-h-dvh w-full max-w-2xl touch-pan-y flex-col px-4 pb-28 pt-4"
      onPointerDown={(e) => {
        // 滑动翻页：记录起点，在 pointerup 判断
        const startX = e.clientX;
        const up = (ev: PointerEvent) => {
          const dx = ev.clientX - startX;
          if (dx < -60) goNext();
          else if (dx > 60) goPrev();
          window.removeEventListener("pointerup", up);
        };
        window.addEventListener("pointerup", up, { once: true });
      }}
    >
      {/* 头 */}
      <div className="mb-3 flex items-center justify-between">
        <Link href="/story" className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-xl shadow" aria-label="返回书架">
          ✕
        </Link>
        <div className="text-center">
          <div className="text-lg font-black text-slate-700">{story.titleZh}</div>
          <div className="text-xs font-bold text-slate-500">{story.title}</div>
        </div>
        <div className="text-sm font-black text-slate-500">
          {page + 1}/{story.pages.length}
        </div>
      </div>

      {/* 插画区：自定义图片 > 内置生成图 > emoji 兜底 */}
      <div className="flex h-64 items-center justify-center overflow-hidden rounded-[2rem] bg-white shadow-lg sm:h-80">
        <StoryArt key={page} story={story} pageIndex={page} />
      </div>

      {/* 逐词文本 */}
      <div className="mt-5 flex flex-wrap items-center justify-center gap-1.5">
        {pg.words.map((tok, i) => (
          <motion.button
            key={i}
            animate={
              activeWord === i ? { scale: 1.18, backgroundColor: "#8f7bff", color: "#fff" } : { scale: 1 }
            }
            onClick={() => tapWord(tok)}
            className="rounded-2xl bg-white/80 px-3 py-2 text-2xl font-black text-slate-700 shadow-sm sm:text-3xl"
          >
            {tok}
          </motion.button>
        ))}
      </div>
      <p className="mt-3 text-center text-base font-bold text-slate-500">{pg.zh}</p>

      {/* 控制 */}
      <div className="mt-auto flex items-center justify-center gap-3 pt-6">
        <button
          onClick={goPrev}
          disabled={page === 0}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-2xl shadow disabled:opacity-30"
          aria-label="上一页"
        >
          ⬅️
        </button>
        <BigButton
          zh={playing ? "停止" : "读这页"}
          en={playing ? "Stop" : "Read"}
          className={cn("min-w-36", playing ? "bg-slate-200" : "bg-butter text-amber-900")}
          onClick={() => (playing ? stopKaraoke() : playPage(false))}
        />
        <button
          onClick={goNext}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-2xl shadow"
          aria-label="下一页"
        >
          ➡️
        </button>
      </div>
      <button
        onClick={() => (playing ? stopKaraoke() : playPage(true))}
        className="mx-auto mt-2 text-sm font-bold text-grape underline"
      >
        {playing ? "停止自动播放" : "▶️ 自动读完整本 Auto-read all"}
      </button>
    </div>
  );
}
