"use client";

import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { BigButton } from "@/components/common/common";
import {
  compressImage,
  newCustomId,
  saveCustomStory,
  type CustomStory,
} from "@/lib/progress/customStories";

interface DraftPage {
  text: string;
  zh: string;
  emoji: string;
  image?: string;
}

const EMOJI_CHOICES = ["🐱", "🐶", "🐰", "🐻", "🦊", "🐼", "🦆", "🐸", "🍎", "🍌", "🌈", "☀️", "🌙", "⭐", "🚗", "🎈", "🧸", "⚽"];

/** 自定义绘本创作页（家长验证后进入）：句子自动切词，朗读走 TTS */
export default function Page() {
  const router = useRouter();
  const [passed, setPassed] = useState(false);
  const [titleZh, setTitleZh] = useState("");
  const [title, setTitle] = useState("");
  const [emoji, setEmoji] = useState("📖");
  const [pages, setPages] = useState<DraftPage[]>([{ text: "", zh: "", emoji: "🐱" }]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const editPage = useRef(0);

  const gate = useMemo(() => {
    const a = 13 + Math.floor(Math.random() * 46);
    const b = 12 + Math.floor(Math.random() * 46);
    return { a, b };
  }, []);
  const [ans, setAns] = useState("");

  if (!passed) {
    return (
      <div className="mx-auto flex max-w-sm flex-col items-center gap-5 px-4 py-28 text-center">
        <span className="text-6xl">🔐</span>
        <h1 className="text-xl font-black text-slate-600">家长验证 Parent Check</h1>
        <p className="font-medium text-slate-400">做绘本是爸爸妈妈的操作哦～ 请回答：{gate.a} + {gate.b} = ?</p>
        <input
          inputMode="numeric"
          value={ans}
          onChange={(e) => setAns(e.target.value)}
          className="w-32 rounded-xl bg-white px-4 py-3 text-center text-2xl font-black text-slate-700 shadow outline-none"
          placeholder="?"
        />
        <BigButton
          zh="进入"
          en="Enter"
          className="bg-grape text-white"
          onClick={() => Number(ans) === gate.a + gate.b && setPassed(true)}
        />
        <button onClick={() => router.back()} className="text-sm font-bold text-slate-400">
          返回 Back
        </button>
      </div>
    );
  }

  const setPage = (i: number, patch: Partial<DraftPage>) =>
    setPages((ps) => ps.map((p, j) => (j === i ? { ...p, ...patch } : p)));

  const pickImage = async (file: File | undefined) => {
    if (!file) return;
    try {
      const dataUrl = await compressImage(file);
      setPage(editPage.current, { image: dataUrl });
    } catch {
      setError("图片读取失败，换一张试试");
    }
  };

  const save = () => {
    setError("");
    const cleanPages = pages.filter((p) => p.text.trim());
    if (!titleZh.trim()) return setError("请给绘本起个中文名");
    if (cleanPages.length === 0) return setError("至少写一页英文句子");
    if (pages.some((p) => p.text.trim() && !p.zh.trim())) return setError("每页都填一下中文意思");
    const story: CustomStory = {
      id: newCustomId(),
      custom: true,
      title: title.trim() || "My Story",
      titleZh: titleZh.trim(),
      emoji,
      level: 1,
      unitTag: "",
      newWordIds: [],
      pages: cleanPages.map((p) => ({
        text: p.text.trim(),
        zh: p.zh.trim(),
        emoji: p.emoji || "⭐",
        image: p.image,
        words: p.text.trim().split(/\s+/),
      })),
    };
    try {
      setSaving(true);
      saveCustomStory(story);
      router.push(`/story/${story.id}`);
    } catch (e) {
      setSaving(false);
      setError((e as Error).message || "保存失败");
    }
  };

  return (
    <div className="mx-auto w-full max-w-xl px-4 pb-28 pt-6">
      <header className="mb-5 flex items-center justify-between">
        <h1 className="text-2xl font-black text-slate-700">
          ✏️ 做一本绘本 <span className="text-sm font-bold text-slate-400">Make a Story</span>
        </h1>
        <button onClick={() => router.back()} className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-lg shadow">
          ✕
        </button>
      </header>

      {/* 基本信息 */}
      <section className="mb-5 rounded-3xl bg-white p-5 shadow">
        <div className="mb-3 flex flex-col gap-3 sm:flex-row">
          <label className="flex flex-1 items-center gap-2">
            <span className="w-20 shrink-0 text-sm font-bold text-slate-500">中文名</span>
            <input
              value={titleZh}
              onChange={(e) => setTitleZh(e.target.value)}
              placeholder="例如：小明的一天"
              className="flex-1 rounded-xl bg-slate-100 px-4 py-3 font-bold text-slate-700 outline-none"
            />
          </label>
          <label className="flex flex-1 items-center gap-2">
            <span className="w-20 shrink-0 text-sm font-bold text-slate-500">英文名</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ming's Day（可选）"
              className="flex-1 rounded-xl bg-slate-100 px-4 py-3 font-bold text-slate-700 outline-none"
            />
          </label>
        </div>
        <div>
          <span className="mb-1 block text-sm font-bold text-slate-500">封面图标</span>
          <div className="flex flex-wrap gap-1.5">
            {["📖", ...EMOJI_CHOICES].map((e) => (
              <button
                key={e}
                onClick={() => setEmoji(e)}
                className={`flex h-11 w-11 items-center justify-center rounded-xl text-2xl ${emoji === e ? "bg-grape/20 ring-2 ring-grape" : "bg-slate-100"}`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 每页内容 */}
      {pages.map((p, i) => (
        <section key={i} className="mb-4 rounded-3xl bg-white p-5 shadow">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-black text-slate-500">第 {i + 1} 页 Page {i + 1}</span>
            {pages.length > 1 && (
              <button
                onClick={() => setPages((ps) => ps.filter((_, j) => j !== i))}
                className="text-sm font-bold text-coral"
              >
                删除本页
              </button>
            )}
          </div>
          <input
            value={p.text}
            onChange={(e) => setPage(i, { text: e.target.value })}
            placeholder="英文句子，如 I see a big bear."
            className="mb-2 w-full rounded-xl bg-slate-100 px-4 py-3 text-lg font-bold text-slate-700 outline-none"
          />
          <input
            value={p.zh}
            onChange={(e) => setPage(i, { zh: e.target.value })}
            placeholder="中文意思，如 我看到一只大熊。"
            className="mb-3 w-full rounded-xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-600 outline-none"
          />
          <div className="flex items-center gap-2">
            <select
              value={p.emoji}
              onChange={(e) => setPage(i, { emoji: e.target.value })}
              className="rounded-xl bg-slate-100 px-3 py-2 text-xl outline-none"
            >
              {EMOJI_CHOICES.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
            <button
              onClick={() => {
                editPage.current = i;
                fileRef.current?.click();
              }}
              className="rounded-xl bg-sky-100 px-4 py-2.5 text-sm font-bold text-sky-600"
            >
              🖼 {p.image ? "换一张图" : "上传插图"}
            </button>
            {p.image && (
              // eslint-disable-next-line @next/next/no-img-element -- dataURL 预览
              <img src={p.image} alt="预览" className="h-12 w-12 rounded-lg object-cover" />
            )}
          </div>
        </section>
      ))}

      <div className="mb-4 flex gap-3">
        <BigButton
          zh="加一页"
          en="Add page"
          className="flex-1"
          onClick={() => setPages((ps) => [...ps, { text: "", zh: "", emoji: "⭐" }])}
        />
        <BigButton zh="保存并阅读" en="Save & read" className="flex-1 bg-mint text-white" onClick={save} disabled={saving} />
      </div>
      {error && <p className="text-center text-sm font-bold text-coral">{error}</p>}
      <p className="mt-3 text-center text-xs font-medium text-slate-400">
        建议：每页一句简单英文（用孩子学过的词），保存后点句子里的单词都能发音，朗读由语音合成完成
      </p>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => void pickImage(e.target.files?.[0])}
      />
    </div>
  );
}
