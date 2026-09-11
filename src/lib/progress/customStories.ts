/** 自定义绘本：localStorage 存储，与内置绘本共用 Story 阅读器（朗读走 TTS 兜底） */

"use client";

import type { Story } from "@/content/types";

const KEY = "wai-en-custom-stories";

export type CustomStory = Story & { custom: true };

function load(): CustomStory[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as CustomStory[]) : [];
  } catch {
    return [];
  }
}

function persist(list: CustomStory[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // 容量超限（一般因图片 dataURL 太大）：提示由调用方处理
    throw new Error("存储空间不足，请减少图片或页数");
  }
}

export const listCustomStories = load;

export function getCustomStory(id: string): CustomStory | undefined {
  return load().find((s) => s.id === id);
}

export function saveCustomStory(story: CustomStory) {
  const list = load();
  const i = list.findIndex((s) => s.id === story.id);
  if (i >= 0) list[i] = story;
  else list.push(story);
  persist(list);
}

export function deleteCustomStory(id: string) {
  persist(load().filter((s) => s.id !== id));
}

/** 生成自定义绘本 id */
export const newCustomId = () =>
  `c-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/** 图片压缩：dataURL → 缩到 ≤900px 的 jpeg dataURL（控制 localStorage 体积） */
export function compressImage(file: File, maxSide = 900, quality = 0.72): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("图片读取失败"));
    };
    img.src = url;
  });
}
