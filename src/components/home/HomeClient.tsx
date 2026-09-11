"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { useState } from "react";
import { curriculum, unitWords } from "@/content/curriculum";
import { srsStats } from "@/lib/progress/srs";
import { progressActions, useProgress } from "@/lib/progress/store";
import { sfx } from "@/lib/audio/sfx";
import { cn } from "@/lib/utils";
import { BiLabel } from "@/components/common/common";
import { StarIcon, FlameIcon, FoxySvg, ArrowIcon, CheckIcon } from "@/components/common/Svg";

export function HomeClient() {
  const p = useProgress();
  const [justCheckedIn, setJustCheckedIn] = useState(false);

  // 先解构再 memo（保持 memoization 可被编译器保留）
  const { lessons, stories: storyReads, srs, maxUnlockedUnitIndex } = p;
  const dueCount = srsStats(srs).dueToday; // 纯函数轻计算，无需 memo

  const nextLesson = (() => {
    for (const u of curriculum.units) {
      if (u.index > maxUnlockedUnitIndex) break;
      const l = u.lessons.find((x) => !lessons[x.id]);
      if (l) return { unit: u, lesson: l };
      // 单元全完成但没触发解锁（理论上不会），仍取最后一课复习
    }
    return null;
  })();

  // 轻计算不 memo（编译器无法保留手动 memoization 时反而报警）
  const nextStory = (() => {
    const unlocked = curriculum.stories.filter(
      (s) => !s.unitTag || (curriculum.units.find((u) => u.id === s.unitTag)?.index ?? 99) <= maxUnlockedUnitIndex,
    );
    return unlocked.find((s) => !storyReads[s.id]) ?? unlocked[0] ?? null;
  })();

  const tasks: { key: string; icon: string; zh: string; en: string; detail: string; done: boolean; href: string }[] = [
    {
      key: "lesson",
      icon: "📖",
      zh: "上课",
      en: "Lesson",
      detail: nextLesson ? `今天的课：${nextLesson.lesson.title}` : "复习任意一节课",
      done: p.daily.tasks.lesson,
      href: nextLesson ? `/lesson/${nextLesson.lesson.id}` : "/flashcards",
    },
    {
      key: "cards",
      icon: "🃏",
      zh: "复习卡片",
      en: "Cards",
      detail: dueCount > 0 ? `复习 ${dueCount} 张到期卡片` : "学一组新卡片",
      done: p.daily.tasks.cards,
      href: "/flashcards/daily",
    },
    {
      key: "story",
      icon: "📚",
      zh: "读故事",
      en: "Story",
      detail: nextStory ? `读《${nextStory.titleZh}》` : "暂无解锁故事",
      done: p.daily.tasks.story,
      href: nextStory ? `/story/${nextStory.id}` : "/story",
    },
    {
      key: "game",
      icon: "🎮",
      zh: "玩游戏",
      en: "Game",
      detail: "玩一局小游戏",
      done: p.daily.tasks.game,
      href: "/games",
    },
  ];

  const allDone = tasks.every((t) => t.done);
  const canCheckIn = allDone && !p.daily.bonusClaimed;

  const checkIn = () => {
    if (progressActions.claimDailyBonus()) {
      sfx.streak();
      setJustCheckedIn(true);
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-28 pt-4 sm:pt-6">
      {/* 顶栏 */}
      <header className="mb-4 flex items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow ring-2 ring-butter/40">
          <FoxySvg mood="happy" size={48} />
        </div>
        <div className="flex-1">
          <div className="text-xl font-black text-slate-700">{p.childName}，你好啊</div>
          <div className="text-sm font-bold text-slate-500">Hi! Let&apos;s learn English!</div>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 shadow">
          <StarIcon className="h-5 w-5 text-butter" />
          <span className="text-lg font-black text-grape">{p.stars}</span>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-white px-2.5 py-1.5 shadow">
          {p.streak.current > 0 ? (
            <FlameIcon className="h-5 w-5" />
          ) : (
            <span className="text-base opacity-40">💤</span>
          )}
          <span className="text-lg font-black text-coral">{p.streak.current}</span>
        </div>
        <Link
          href="/parent"
          aria-label="家长页"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-xl shadow"
        >
          ⚙️
        </Link>
      </header>

      {/* 今日计划 */}
      <section className="mb-6 rounded-[2rem] bg-white/80 p-5 shadow-lg backdrop-blur">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-black text-slate-700">
            📋 今日计划 <span className="text-sm font-bold text-slate-500">Today&apos;s Plan</span>
          </h2>
          {allDone && (
            <span className="rounded-full bg-mint/20 px-3 py-1 text-sm font-black text-mint">
              全部完成 All done!
            </span>
          )}
        </div>
        <div className="flex flex-col gap-2">
          {tasks.map((t) => (
            <Link
              key={t.key}
              href={t.href}
              className={cn(
                "flex items-center gap-3 rounded-2xl p-3 transition-colors",
                t.done ? "bg-mint/10" : "bg-sky-50 active:bg-sky-100",
              )}
            >
              {t.done ? (
                <CheckIcon className="h-8 w-8" />
              ) : (
                <span className="text-3xl">{t.icon}</span>
              )}
              <span className="flex-1">
                <span className="block font-black text-slate-700">
                  {t.zh} <span className="text-xs font-bold text-slate-500">{t.en}</span>
                </span>
                <span className="block text-sm font-medium text-slate-500">{t.detail}</span>
              </span>
              {!t.done && <span className="rounded-full bg-butter px-3 py-1.5 text-sm font-black text-amber-900">去完成 Go</span>}
            </Link>
          ))}
        </div>
        {canCheckIn && (
          <motion.button
            initial={{ scale: 0.9 }}
            animate={{ scale: [1, 1.04, 1] }}
            transition={{ repeat: Infinity, duration: 1.6 }}
            onClick={checkIn}
            className="mt-4 flex w-full items-center justify-center rounded-full bg-gradient-to-r from-coral to-butter py-4 text-2xl font-black text-white shadow-xl"
          >
            🔥 打卡领奖 Check in! +⭐3
          </motion.button>
        )}
        {justCheckedIn && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 text-center text-lg font-black text-coral"
          >
            🎉 打卡成功！连续 {p.streak.current} 天！Keep going!
          </motion.div>
        )}
      </section>

      {/* 课程地图 */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 px-1 text-lg font-black text-slate-700">
          🗺️ 课程地图 <span className="text-sm font-bold text-slate-500">Learning Map</span>
        </h2>
        <div className="relative flex flex-col gap-3">
          {curriculum.units.map((u, i) => {
            const unlocked = u.index <= p.maxUnlockedUnitIndex;
            const stars = u.lessons.reduce((n, l) => n + (p.lessons[l.id]?.stars ?? 0), 0);
            const maxStars = u.lessons.length * 3;
            const isCurrent = unlocked && stars === 0 && curriculum.units.slice(0, u.index + 1).every((x) =>
              x.lessons.some((l) => p.lessons[l.id]) || x.index === u.index,
            );
            const isLast = i === curriculum.units.length - 1;
            // 节点连线：上一个 unit 解锁 + 当前未解锁 → 画虚线；都解锁 → 画实线
            const prevUnlocked = i > 0 && curriculum.units[i - 1].index <= p.maxUnlockedUnitIndex;
            const connectorStyle: "solid" | "dashed" | "locked" | null = isLast
              ? null
              : unlocked && prevUnlocked
                ? "solid"
                : unlocked
                  ? "dashed"
                  : "locked";
            return (
              <motion.div key={u.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="relative">
                {/* 节点连线 SVG：挂在卡片左边的圆形头像轴上 */}
                {connectorStyle && (
                  <svg
                    viewBox="0 0 16 24"
                    className="pointer-events-none absolute -top-3 left-[1.4rem] z-0 h-6 w-4 -translate-y-full"
                    aria-hidden
                  >
                    <line
                      x1="8" y1="0" x2="8" y2="24"
                      stroke={connectorStyle === "solid" ? "#4ECDA5" : "#D6D3D1"}
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeDasharray={connectorStyle === "dashed" ? "4 5" : undefined}
                      opacity={connectorStyle === "locked" ? 0.35 : 1}
                    />
                  </svg>
                )}
                <Link
                  href={unlocked ? `/unit/${u.id}` : "#"}
                  className={cn(
                    "relative flex items-center gap-4 rounded-[1.75rem] p-4 shadow-md",
                    unlocked ? "bg-white active:scale-[0.98]" : "bg-white/40",
                    isCurrent && "ring-4 ring-butter/60",
                  )}
                >
                  <div
                    className={cn(
                      "flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-4xl",
                      u.color,
                      !unlocked && "grayscale",
                    )}
                  >
                    {unlocked ? u.emoji : "🔒"}
                  </div>
                  <div className="flex-1">
                    <div className="text-lg font-black text-slate-700">
                      {u.title} <span className="text-sm font-bold text-slate-500">{u.titleEn}</span>
                    </div>
                    <div className="text-sm font-bold text-slate-500">
                      {unitWords(u).length} 词 · {u.lessons.length} 课
                      {u.storyIds.length > 0 && ` · ${u.storyIds.length} 故事`}
                    </div>
                    <div className="mt-1 flex items-center gap-1.5">
                      {Array.from({ length: 3 }).map((_, n) => (
                        <StarIcon
                          key={n}
                          filled={n < Math.ceil(stars / Math.max(1, maxStars / 3))}
                          className={cn(
                            "h-4 w-4",
                            n < Math.ceil(stars / Math.max(1, maxStars / 3)) ? "text-butter" : "text-slate-200",
                          )}
                        />
                      ))}
                      {unlocked && stars > 0 && (
                        <span className="text-sm font-black text-butter">{stars}/{maxStars}</span>
                      )}
                    </div>
                  </div>
                  {unlocked && <ArrowIcon dir="right" className="h-5 w-5 text-slate-300" />}
                </Link>
              </motion.div>
            );
          })}
        </div>
        <p className="mt-4 text-center text-sm font-medium text-slate-500">
          完成一个单元的全部课程，就会解锁下一个单元哦～
          <br />
          <BiLabel zh="学得越多，地图越远！" en="The more you learn, the further you go!" />
        </p>
      </section>
    </div>
  );
}
