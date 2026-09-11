"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { curriculum, unitWords } from "@/content/curriculum";
import { storyById } from "@/content/curriculum";
import { srsStats } from "@/lib/progress/srs";
import { progressActions, useProgress } from "@/lib/progress/store";
import { sfx } from "@/lib/audio/sfx";
import { cn } from "@/lib/utils";
import { BiLabel } from "@/components/common/common";

export function HomeClient() {
  const p = useProgress();
  const [justCheckedIn, setJustCheckedIn] = useState(false);

  const dueCount = useMemo(() => srsStats(p.srs).dueToday, [p.srs]);

  const nextLesson = useMemo(() => {
    for (const u of curriculum.units) {
      if (u.index > p.maxUnlockedUnitIndex) break;
      const l = u.lessons.find((x) => !p.lessons[x.id]);
      if (l) return { unit: u, lesson: l };
      // 单元全完成但没触发解锁（理论上不会），仍取最后一课复习
    }
    return null;
  }, [p.lessons, p.maxUnlockedUnitIndex]);

  const nextStory = useMemo(() => {
    const unlocked = curriculum.stories.filter(
      (s) => !s.unitTag || curriculum.units.find((u) => u.id === s.unitTag)!.index <= p.maxUnlockedUnitIndex,
    );
    return unlocked.find((s) => !p.stories[s.id]) ?? unlocked[0] ?? null;
  }, [p.stories, p.maxUnlockedUnitIndex]);

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
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-3xl shadow">
          🧒
        </div>
        <div className="flex-1">
          <div className="text-xl font-black text-slate-700">{p.childName}，你好啊</div>
          <div className="text-sm font-bold text-slate-400">Hi! Let&apos;s learn English!</div>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow">
          <span className="text-xl">⭐</span>
          <span className="text-lg font-black text-grape">{p.stars}</span>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-white px-3 py-2 shadow">
          <span className="text-xl">{p.streak.current > 0 ? "🔥" : "💤"}</span>
          <span className="text-lg font-black text-coral">{p.streak.current}</span>
        </div>
        <Link href="/parent" aria-label="家长页" className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-xl shadow">
          ⚙️
        </Link>
      </header>

      {/* 今日计划 */}
      <section className="mb-6 rounded-[2rem] bg-white/80 p-5 shadow-lg backdrop-blur">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-black text-slate-700">
            📋 今日计划 <span className="text-sm font-bold text-slate-400">Today&apos;s Plan</span>
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
              <span className="text-3xl">{t.done ? "✅" : t.icon}</span>
              <span className="flex-1">
                <span className="block font-black text-slate-700">
                  {t.zh} <span className="text-xs font-bold text-slate-400">{t.en}</span>
                </span>
                <span className="block text-sm font-medium text-slate-400">{t.detail}</span>
              </span>
              {!t.done && <span className="rounded-full bg-butter px-3 py-1.5 text-sm font-black text-white">去完成 Go</span>}
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
          🗺️ 课程地图 <span className="text-sm font-bold text-slate-400">Learning Map</span>
        </h2>
        <div className="relative flex flex-col gap-3">
          {curriculum.units.map((u, i) => {
            const unlocked = u.index <= p.maxUnlockedUnitIndex;
            const stars = u.lessons.reduce((n, l) => n + (p.lessons[l.id]?.stars ?? 0), 0);
            const maxStars = u.lessons.length * 3;
            const isCurrent = unlocked && stars === 0 && curriculum.units.slice(0, u.index + 1).every((x) =>
              x.lessons.some((l) => p.lessons[l.id]) || x.index === u.index,
            );
            return (
              <motion.div key={u.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Link
                  href={unlocked ? `/unit/${u.id}` : "#"}
                  className={cn(
                    "flex items-center gap-4 rounded-[1.75rem] p-4 shadow-md",
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
                      {u.title} <span className="text-sm font-bold text-slate-400">{u.titleEn}</span>
                    </div>
                    <div className="text-sm font-bold text-slate-400">
                      {unitWords(u).length} 词 · {u.lessons.length} 课
                      {u.storyIds.length > 0 && ` · ${u.storyIds.length} 故事`}
                    </div>
                    <div className="mt-1 text-sm font-black text-butter">
                      {"⭐".repeat(Math.min(3, Math.ceil(stars / Math.max(1, maxStars / 3))))}
                      {unlocked && stars > 0 ? ` ${stars}/${maxStars}` : ""}
                    </div>
                  </div>
                  {unlocked && <span className="text-2xl text-slate-300">›</span>}
                </Link>
              </motion.div>
            );
          })}
        </div>
        <p className="mt-4 text-center text-sm font-medium text-slate-400">
          完成一个单元的全部课程，就会解锁下一个单元哦～
          <br />
          <BiLabel zh="学得越多，地图越远！" en="The more you learn, the further you go!" />
        </p>
      </section>
    </div>
  );
}
