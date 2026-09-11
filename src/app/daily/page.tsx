import Link from "next/link";
import { dailyThemes, dailyTotal } from "@/content/daily300";

export const metadata = { title: "日常英语300句 · 外恩英语乐园" };

export default function Page() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-28 pt-4 sm:pt-8">
      <header className="mb-5">
        <h1 className="text-2xl font-black text-slate-700">
          💬 日常英语 300 句 <span className="text-sm font-bold text-slate-500">Daily English</span>
        </h1>
        <p className="text-sm font-medium text-slate-500">
          {dailyThemes.length} 个主题 · 共 {dailyTotal} 句 · 每句都有听力模式
        </p>
      </header>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {dailyThemes.map((t) => (
          <Link
            key={t.id}
            href={`/daily/${t.id}`}
            className="flex flex-col items-center gap-2 rounded-3xl bg-white p-5 shadow-md active:scale-95"
          >
            <span className="text-5xl">{t.emoji}</span>
            <span className="text-base font-black text-slate-700">{t.titleZh}</span>
            <span className="text-xs font-bold text-slate-500">{t.title} · {t.sentences.length}句</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
