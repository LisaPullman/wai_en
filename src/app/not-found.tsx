import Link from "next/link";

/** 全局 404：Foxy 带路回家 */
export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center">
      <span className="text-7xl">🦊🗺️</span>
      <h1 className="text-2xl font-black text-slate-700">这条路不通，阿福带你去地图～</h1>
      <p className="text-sm font-medium text-slate-500">
        Page not found. Let&apos;s go back!
      </p>
      <Link
        href="/"
        className="rounded-full bg-butter px-8 py-4 text-lg font-black text-amber-900 shadow-lg active:scale-95"
      >
        回首页 Home
      </Link>
    </div>
  );
}
