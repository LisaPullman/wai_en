"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { FoxyBuddy } from "./Foxy";

const TABS = [
  { href: "/", zh: "地图", en: "Map", icon: "🗺️" },
  { href: "/flashcards", zh: "卡片", en: "Cards", icon: "🃏" },
  { href: "/daily", zh: "300句", en: "Daily", icon: "💬" },
  { href: "/games", zh: "游戏", en: "Play", icon: "🎮" },
  { href: "/story", zh: "故事", en: "Story", icon: "📚" },
  { href: "/listen", zh: "听故事", en: "Listen", icon: "🎧" },
];

/** 底部导航（双语，课程页隐藏以免分心）；Foxy 悬浮其上 */
export function TabBar() {
  const pathname = usePathname();
  const inLesson = pathname?.startsWith("/lesson");
  if (inLesson) return null;

  return (
    <>
      {!inLesson && <FoxyBuddy />}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-white/60 bg-white/90 backdrop-blur"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="mx-auto flex max-w-2xl">
          {TABS.map((t) => {
            const active = t.href === "/" ? pathname === "/" : pathname?.startsWith(t.href);
            return (
              <Link
                key={t.href}
                href={t.href}
                className={cn(
                  "flex flex-1 flex-col items-center gap-0.5 py-2.5",
                  active ? "text-grape" : "text-slate-500",
                )}
              >
                <motion.span whileTap={{ scale: 0.85 }} className="text-3xl leading-none">
                  {t.icon}
                </motion.span>
                <span className="text-[11px] font-bold leading-tight">{t.zh}</span>
                <span className="text-[9px] font-semibold leading-none opacity-60">{t.en}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
