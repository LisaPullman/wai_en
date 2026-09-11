"use client";

import Link from "next/link";
import { useEffect } from "react";

/** 全局错误边界：白屏改成 Foxy 安抚页，可重试可回首页 */
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[wai-en] 页面出错:", error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center">
      <span className="text-7xl">🦊</span>
      <h1 className="text-2xl font-black text-slate-700">哎呀，阿福踩空了一步！</h1>
      <p className="max-w-sm text-sm font-medium text-slate-500">
        页面出了点小问题，不是你的错哦～ 点下面的按钮再试一次。
        <br />
        Oops! Something went wrong. Try again!
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="rounded-full bg-butter px-8 py-4 text-lg font-black text-amber-900 shadow-lg active:scale-95"
        >
          再试一次 Retry
        </button>
        <Link
          href="/"
          className="rounded-full bg-white px-8 py-4 text-lg font-black text-slate-600 shadow-lg active:scale-95"
        >
          回首页 Home
        </Link>
      </div>
    </div>
  );
}
