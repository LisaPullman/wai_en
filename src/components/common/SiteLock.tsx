"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { sfx } from "@/lib/audio/sfx";

const KEY = "wai-en-site-unlocked";
const PASSWORD = process.env.NEXT_PUBLIC_SITE_PASSWORD || "20200108";

/** 全站访问锁：进入需输入密码（数字键盘），本次会话内免再次输入 */
export function SiteLock({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<"checking" | "locked" | "open">("checking");
  const [code, setCode] = useState("");
  const [wrong, setWrong] = useState(false);

  useEffect(() => {
    try {
      setState(sessionStorage.getItem(KEY) === "1" ? "open" : "locked");
    } catch {
      setState("locked");
    }
  }, []);

  const tryUnlock = () => {
    if (code === PASSWORD) {
      sfx.streak();
      try {
        sessionStorage.setItem(KEY, "1");
      } catch {
        /* 隐私模式：仅本次内存态 */
      }
      setState("open");
    } else {
      sfx.wrong();
      setWrong(true);
      setTimeout(() => {
        setWrong(false);
        setCode("");
      }, 600);
    }
  };

  const press = (n: string) => {
    sfx.tap();
    setCode((c) => (c.length >= 8 ? c : c + n));
  };

  if (state === "checking") return <div className="min-h-dvh" />;
  if (state === "open") return <>{children}</>;

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-gradient-to-b from-sky-100 to-amber-50 px-6">
      <motion.div
        animate={wrong ? { x: [0, -10, 10, -8, 8, 0] } : { y: [0, -6, 0] }}
        transition={{ repeat: wrong ? 0 : Infinity, duration: 2.4 }}
        className="flex flex-col items-center gap-3 text-center"
      >
        <span className="text-7xl">🔒</span>
        <h1 className="text-2xl font-black text-slate-700">歪歪的英语乐园</h1>
        <p className="text-sm font-bold text-slate-400">
          请输入密码进入 Enter password
        </p>
      </motion.div>

      {/* 密码点 */}
      <motion.div animate={wrong ? { rotate: [0, -3, 3, 0] } : {}} className="flex h-14 items-center gap-3">
        {Array.from({ length: Math.max(6, code.length) }).map((_, i) => (
          <span
            key={i}
            className={`h-4 w-4 rounded-full transition-colors ${i < code.length ? "bg-grape" : "bg-white shadow-inner"}`}
          />
        ))}
      </motion.div>

      {/* 数字键盘 */}
      <div className="grid w-full max-w-xs grid-cols-3 gap-3">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((n) => (
          <motion.button
            key={n}
            whileTap={{ scale: 0.9 }}
            onClick={() => press(n)}
            className="flex h-16 items-center justify-center rounded-2xl bg-white text-3xl font-black text-slate-700 shadow-md"
          >
            {n}
          </motion.button>
        ))}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            sfx.tap();
            setCode("");
          }}
          className="flex h-16 items-center justify-center rounded-2xl bg-white/70 text-xl font-black text-slate-400 shadow"
          aria-label="清除"
        >
          ⌫
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => press("0")}
          className="flex h-16 items-center justify-center rounded-2xl bg-white text-3xl font-black text-slate-700 shadow-md"
        >
          0
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={tryUnlock}
          className="flex h-16 items-center justify-center rounded-2xl bg-butter text-2xl font-black text-white shadow-md"
          aria-label="进入"
        >
          ➜
        </motion.button>
      </div>

      {wrong && <p className="text-sm font-bold text-coral">密码不对，再试试哦～ Try again</p>}
      <p className="text-xs font-medium text-slate-300">WaiEn English Garden · Private</p>
    </div>
  );
}
