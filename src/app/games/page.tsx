"use client";

import Link from "next/link";

const GAMES = [
  { id: "bubble-pop", zh: "泡泡爆爆", en: "Bubble Pop", icon: "🫧", skill: "听 Listen", ready: true, color: "bg-sky-100" },
  { id: "memory-match", zh: "记忆翻牌", en: "Memory", icon: "🃏", skill: "读 Read", ready: false, color: "bg-mint/20" },
  { id: "word-blocks", zh: "单词积木", en: "Word Blocks", icon: "🧱", skill: "拼 Phonics", ready: false, color: "bg-amber-100" },
  { id: "sentence-train", zh: "句子火车", en: "Sentence Train", icon: "🚂", skill: "读 Read", ready: false, color: "bg-violet-100" },
  { id: "echo-mic", zh: "跟读话筒", en: "Echo Mic", icon: "🎤", skill: "说 Speak", ready: false, color: "bg-coral/20" },
  { id: "whack-a-mole", zh: "打地鼠", en: "Whack-a-mole", icon: "🔨", skill: "听 Listen", ready: false, color: "bg-lime-100" },
];

export default function Page() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-28 pt-4 sm:pt-8">
      <header className="mb-5">
        <h1 className="text-2xl font-black text-slate-700">
          🎮 游戏厅 <span className="text-sm font-bold text-slate-500">Game House</span>
        </h1>
        <p className="text-sm font-medium text-slate-500">用你学过的单词来玩游戏！Play with your words!</p>
      </header>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {GAMES.map((g) =>
          g.ready ? (
            <Link
              key={g.id}
              href={`/games/${g.id}`}
              className={`flex flex-col items-center gap-2 rounded-3xl ${g.color} p-5 shadow-md active:scale-95`}
            >
              <span className="text-5xl">{g.icon}</span>
              <span className="text-lg font-black text-slate-700">{g.zh}</span>
              <span className="text-xs font-bold text-slate-500">{g.en}</span>
              <span className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-black text-slate-500">{g.skill}</span>
            </Link>
          ) : (
            <div
              key={g.id}
              className={`flex flex-col items-center gap-2 rounded-3xl ${g.color} p-5 opacity-50 shadow-sm`}
            >
              <span className="text-5xl grayscale">{g.icon}</span>
              <span className="text-lg font-black text-slate-500">{g.zh}</span>
              <span className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-black text-slate-500">
                即将推出 Soon
              </span>
            </div>
          ),
        )}
      </div>
    </div>
  );
}
