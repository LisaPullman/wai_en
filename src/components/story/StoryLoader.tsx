"use client";

import { useEffect, useState } from "react";
import { storyById } from "@/content/curriculum";
import { getCustomStory, type CustomStory } from "@/lib/progress/customStories";
import type { Story } from "@/content/types";
import { StoryReader } from "./StoryReader";

/** 内置绘本直接渲染；自定义绘本从 localStorage 加载（含挂载占位） */
export function StoryLoader({ storyId }: { storyId: string }) {
  const [custom, setCustom] = useState<CustomStory | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setCustom(getCustomStory(storyId) ?? null);
    setReady(true);
  }, [storyId]);

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-5xl">
        <span className="animate-float">📖</span>
      </div>
    );
  }

  const story: Story | undefined = storyById(storyId) ?? custom ?? undefined;
  if (!story) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 text-center">
        <span className="text-6xl">🤔</span>
        <p className="font-bold text-slate-400">找不到这本绘本 Story not found</p>
      </div>
    );
  }
  return <StoryReader story={story} />;
}
