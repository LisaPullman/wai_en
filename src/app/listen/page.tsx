import Link from "next/link";
import { listenCollections, listenStoryCount } from "@/content/listen100";

export const metadata = { title: "听故事 · 外恩英语乐园" };

export default function Page() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-28 pt-4 sm:pt-8">
      <header className="mb-5">
        <h1 className="text-2xl font-black text-slate-700">
          🎧 听故事 <span className="text-sm font-bold text-slate-500">Story Time</span>
        </h1>
        <p className="text-sm font-medium text-slate-500">
          {listenCollections.length} 个专辑 · {listenStoryCount} 个英语小故事 · 磨耳朵必备
        </p>
      </header>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {listenCollections.map((c) => (
          <Link
            key={c.id}
            href={`/listen/${c.id}`}
            className="flex flex-col items-center gap-2 rounded-3xl bg-white p-5 shadow-md active:scale-95"
          >
            <span className="text-5xl">{c.emoji}</span>
            <span className="text-base font-black text-slate-700">{c.titleZh}</span>
            <span className="text-xs font-bold text-slate-500">{c.title}</span>
            <span className="rounded-full bg-grape/10 px-2 py-0.5 text-[10px] font-black text-grape">
              {c.stories.length} 个故事
            </span>
          </Link>
        ))}
      </div>
      <p className="mt-5 text-center text-xs font-medium text-slate-500">
        建议每天听 1-2 个专辑（15 分钟），先「只听」再「看文本」效果最好
      </p>
    </div>
  );
}
