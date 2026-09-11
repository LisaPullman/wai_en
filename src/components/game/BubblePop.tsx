"use client";

import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import type { Unit, Word } from "@/content/types";
import { makeListenPickQuestions, scoreToStars } from "@/lib/game/questionGen";
import { playWordAudio, preload } from "@/lib/audio/play";
import { sfx } from "@/lib/audio/sfx";
import { BigButton, Mascot } from "@/components/common/common";
import { WordImage } from "@/components/common/WordImage";

export interface GameResult {
  score: number;
  max: number;
  stars: 1 | 2 | 3;
  wrongIds: string[];
}

/** 泡泡爆爆：听单词音，点破正确的泡泡（听辨 + 图形识别）。count 可控题量（课中迷你轮 3 题 / 完整轮 6 题） */
export function BubblePop({
  words,
  unit,
  seed,
  count = 6,
  onExit,
}: {
  words: Word[];
  unit: Unit;
  seed?: number;
  count?: number;
  onExit: (r: GameResult) => void;
}) {
  const questions = useMemo(
    () => makeListenPickQuestions(words, unit, Math.min(count, Math.max(1, words.length)), seed),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const [qi, setQi] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [wrongIds, setWrongIds] = useState<string[]>([]);
  const [popped, setPopped] = useState<string | null>(null);
  const [shakeId, setShakeId] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);

  const q = questions[qi];
  const answerWord = q?.options.find((o) => o.id === q.answerId);

  // 预热当前题目标词音频（题号变化时执行）；进场自动读题
  useEffect(() => {
    if (!q || !answerWord) return;
    preload(`/audio/words/${q.answerId}.mp3`);
    const t = setTimeout(() => playWordAudio(q.answerId, answerWord.tts ?? answerWord.text), 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const pick = (w: Word) => {
    if (popped) return;
    if (w.id === q.answerId) {
      sfx.pop();
      sfx.correct();
      setPopped(w.id);
      setScore((s) => s + 10 + Math.min(4, combo) * 2);
      setCombo((c) => c + 1);
      setTimeout(() => {
        setPopped(null);
        if (qi + 1 >= questions.length) setFinished(true);
        else setQi((i) => i + 1);
      }, 850);
    } else {
      sfx.wrong();
      setCombo(0);
      setShakeId(w.id);
      setWrongIds((arr) => (arr.includes(q.answerId) ? arr : [...arr, q.answerId]));
      setTimeout(() => setShakeId(null), 500);
    }
  };

  if (finished) {
    const stars = scoreToStars(score, questions.length * 10);
    return (
      <div className="flex flex-col items-center gap-6 py-10">
        <Mascot mood="cheer" bubble="玩得真棒！" bubbleEn="Great playing!" />
        <div className="text-6xl font-black text-grape">{score}分</div>
        <BigButton zh="继续" en="Continue" className="bg-butter text-white" onClick={() => onExit({ score, max: questions.length * 10, stars, wrongIds })} />
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col items-center gap-5">
      {/* HUD */}
      <div className="flex w-full max-w-2xl items-center justify-between px-2">
        <div className="rounded-full bg-white px-4 py-2 text-lg font-black text-grape shadow">
          {score}分
        </div>
        <div className="flex gap-1.5">
          {questions.map((_, i) => (
            <div
              key={i}
              className={`h-3 w-3 rounded-full ${i < qi ? "bg-mint" : i === qi ? "bg-butter" : "bg-white/70"}`}
            />
          ))}
        </div>
        {combo >= 2 && (
          <motion.div animate={{ scale: [1, 1.15, 1] }} className="rounded-full bg-coral px-3 py-1 text-sm font-black text-white">
            连击 ×{combo}
          </motion.div>
        )}
      </div>

      {/* 听音按钮 */}
      <div className="flex flex-col items-center gap-2">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => answerWord && playWordAudio(q.answerId, answerWord.tts ?? answerWord.text)}
          className="flex h-24 w-24 items-center justify-center rounded-full bg-butter text-5xl text-white shadow-lg"
          aria-label="听单词"
        >
          🔊
        </motion.button>
        <span className="text-sm font-bold text-slate-400">听一听，点泡泡！ Listen & pop!</span>
      </div>

      {/* 泡泡 */}
      <div className="grid w-full max-w-2xl grid-cols-2 gap-4 sm:grid-cols-3">
        {q.options.map((w, i) => (
          <motion.button
            key={w.id}
            initial={{ scale: 0, y: 20 }}
            animate={
              shakeId === w.id
                ? { scale: 1, x: [0, -8, 8, -6, 6, 0] }
                : popped === w.id
                  ? { scale: [1, 1.25, 0], opacity: [1, 1, 0] }
                  : { scale: 1, y: 0 }
            }
            transition={{ delay: i * 0.06, duration: shakeId === w.id || popped === w.id ? 0.45 : 0.3 }}
            onClick={() => pick(w)}
            className="bubble flex aspect-square flex-col items-center justify-center gap-2 rounded-full bg-white/90 p-4 shadow-lg"
            style={{ animationDelay: `${i * 0.4}s` }}
          >
            <WordImage word={w} className="h-20 w-20 sm:h-24 sm:w-24" emojiClass="text-5xl sm:text-6xl" />
            {(popped === w.id || shakeId === w.id) && (
              <span className="text-xl font-black text-slate-700">{w.text}</span>
            )}
          </motion.button>
        ))}
      </div>

      <Mascot mood={combo >= 2 ? "cheer" : "happy"} bubble="点那个对的泡泡！" bubbleEn="Pop the right one!" className="mt-2" />
    </div>
  );
}
