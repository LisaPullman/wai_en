"use client";

import { motion } from "motion/react";
import { useRef, useState } from "react";
import type { Sentence, Word } from "@/content/types";
import { playAsset, playSentenceAudio, speak, audioPath } from "@/lib/audio/play";
import { BigButton, Mascot } from "@/components/common/common";

/** READ 环节：句子逐词点读 + 播放整句时 karaoke 高亮 + 跟读 */
export function ReadStep({
  sentences,
  words,
  onDone,
}: {
  sentences: Sentence[];
  words: Record<string, Word>;
  onDone: (wrongIds: string[]) => void;
}) {
  const [si, setSi] = useState(0);
  const [activeWord, setActiveWord] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const s = sentences[si];

  const stopKaraoke = () => {
    clearInterval(timerRef.current);
    setActiveWord(-1);
    setPlaying(false);
  };

  const playWord = (token: string) => {
    const w = words[token.toLowerCase()];
    if (w) playAsset(audioPath.word(w.id), w.tts ?? w.text, { rate: 0.8 });
    else speak(token, { rate: 0.85 });
  };

  const playSentence = () => {
    if (!s) return;
    setPlaying(true);
    playSentenceAudio(s.id, s.text, {
      onEnd: () => stopKaraoke(),
    });
    // karaoke：按词数均分时间轴（资产约 3s/句量级；TTS 兜底时也是合理估计）
    const perWord = Math.max(320, Math.min(900, 3000 / s.words.length));
    let i = 0;
    setActiveWord(0);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      i++;
      if (i >= s.words.length) {
        stopKaraoke();
      } else {
        setActiveWord(i);
      }
    }, perWord);
  };

  const next = () => {
    stopKaraoke();
    if (si + 1 >= sentences.length) onDone([]);
    else setSi((i) => i + 1);
  };

  if (!s) return null;

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <Mascot bubble="用小手指着读！" bubbleEn="Point and read!" />

      {/* 逐词卡 */}
      <div className="flex max-w-2xl flex-wrap items-center justify-center gap-2 rounded-[2rem] bg-white p-6 shadow-lg sm:p-8">
        {s.words.map((tok, i) => {
          const inPool = Boolean(words[tok.toLowerCase()]);
          return (
            <motion.button
              key={i}
              animate={
                activeWord === i
                  ? { scale: 1.15, backgroundColor: "#ffd95e", color: "#fff" }
                  : { scale: 1, backgroundColor: inPool ? "#f1f5f9" : "#ffffff", color: "#334155" }
              }
              onClick={() => playWord(tok)}
              className={`rounded-2xl px-4 py-3 text-3xl font-black sm:text-4xl ${inPool ? "" : "text-slate-400"}`}
            >
              {tok}
            </motion.button>
          );
        })}
      </div>

      {/* 中文释义 */}
      <div className="text-lg font-bold text-slate-400">{s.zh}</div>

      <div className="flex flex-wrap justify-center gap-3">
        <BigButton zh="听整句" en="Listen" className="bg-butter text-white" onClick={playSentence} />
        <BigButton
          zh="跟我读"
          en="Repeat"
          className="bg-grape text-white"
          onClick={() => {
            playSentence();
          }}
        />
        <BigButton zh="下一句" en="Next" className="bg-mint text-white" onClick={next} />
      </div>
      <p className="text-xs font-medium text-slate-400">
        点每个单词都能发声 Tap any word to hear it{playing ? " · 播放中…" : ""}
      </p>
    </div>
  );
}
