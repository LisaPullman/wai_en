"use client";

import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { Lesson, Unit, Word } from "@/content/types";
import { curriculum } from "@/content/curriculum";
import { progressActions } from "@/lib/progress/store";
import { sfx } from "@/lib/audio/sfx";
import { BigButton, Mascot, ProgressBar, Stars } from "@/components/common/common";
import { DeckPlayer } from "@/components/flashcard/DeckPlayer";
import { BubblePop } from "@/components/game/BubblePop";
import { SayStep } from "./SayStep";
import { ReadStep } from "./ReadStep";

/** 「学玩穿插」课型：学 5-6 张 → 立刻玩 3 题热身 → 下一组；最后 跟读/阅读/大游戏/结算 */
type StepKind = "intro" | "learn" | "listen" | "say" | "read" | "play" | "done";
interface Step {
  kind: StepKind;
  chunkIdx: number; // learn/listen 分块序号
}

const STEP_META: Record<"learn" | "listen" | "say" | "read" | "play", { zh: string; en: string; emoji: string }> = {
  learn: { zh: "学一学", en: "Learn", emoji: "📖" },
  listen: { zh: "玩一玩", en: "Play", emoji: "🎈" },
  say: { zh: "说一说", en: "Speak", emoji: "🎤" },
  read: { zh: "读一读", en: "Read", emoji: "🔤" },
  play: { zh: "大奖赛", en: "Big Game", emoji: "🏆" },
};

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export function LessonRunner({ unit, lesson }: { unit: Unit; lesson: Lesson }) {
  const router = useRouter();
  const [stepIdx, setStepIdx] = useState(0);
  const [wrongIds, setWrongIds] = useState<string[]>([]);
  const [replayKey, setReplayKey] = useState(0);

  const newWords = useMemo(
    () => lesson.wordIds.map((id) => curriculum.words[id]).filter(Boolean),
    [lesson],
  );
  const reviewWords = useMemo(
    () => lesson.reviewWordIds.map((id) => curriculum.words[id]).filter(Boolean),
    [lesson],
  );
  const lessonSentences = useMemo(
    () => unit.sentences.filter((s) => lesson.sentenceIds.includes(s.id)),
    [unit, lesson],
  );

  // 分块：大量词（如 26 字母）按 6 个一块，普通课 5 个一块
  const chunks = useMemo(() => chunk(newWords, newWords.length > 10 ? 6 : 5), [newWords]);
  // 跟读只挑代表词：每块第一个（≤4），避免机械重复
  const sayWords = useMemo<Word[]>(
    () => chunks.map((c) => c[0]).filter(Boolean),
    [chunks],
  );

  const steps = useMemo<Step[]>(() => {
    const s: Step[] = [{ kind: "intro", chunkIdx: 0 }];
    chunks.forEach((_, i) => {
      s.push({ kind: "learn", chunkIdx: i });
      s.push({ kind: "listen", chunkIdx: i });
    });
    s.push({ kind: "say", chunkIdx: 0 }, { kind: "read", chunkIdx: 0 }, { kind: "play", chunkIdx: 0 }, { kind: "done", chunkIdx: 0 });
    return s;
  }, [chunks]);

  const step = steps[stepIdx];
  const next = () => setStepIdx((i) => Math.min(steps.length - 1, i + 1));
  const back = () => router.push(`/unit/${unit.id}`);
  const collectWrong = (ids: string[]) => setWrongIds((prev) => [...new Set([...prev, ...ids])]);

  const meta = step.kind !== "intro" && step.kind !== "done" ? STEP_META[step.kind] : null;
  const finalStars: 1 | 2 | 3 = (() => {
    const n = new Set(wrongIds).size;
    return n === 0 ? 3 : n <= 2 ? 2 : 1;
  })();

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-4 px-4 pb-28 pt-4 sm:pt-8">
      {/* 顶栏 */}
      {meta && (
        <div className="flex items-center gap-3">
          <button onClick={back} className="h-12 w-12 rounded-full bg-white text-xl shadow" aria-label="退出课程">
            ✕
          </button>
          <div className="flex-1">
            <div className="mb-1 flex items-center justify-between text-sm font-bold text-slate-500">
              <span>
                {meta.emoji} {meta.zh} {meta.en}
              </span>
              <span>{lesson.title}</span>
            </div>
            <ProgressBar value={stepIdx} max={steps.length - 1} />
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={`${step.kind}-${step.chunkIdx}-${replayKey}`}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          className="flex flex-1 items-start justify-center pt-4"
        >
          {step.kind === "intro" && (
            <div className="flex flex-col items-center gap-8 py-16 text-center">
              <Mascot mood="cheer" bubble={`今天学：${lesson.title}`} bubbleEn="Let's go!" />
              <h1 className="text-3xl font-black text-slate-700">{lesson.title}</h1>
              <div className="flex flex-wrap justify-center gap-2">
                {newWords.slice(0, 8).map((w) => (
                  <motion.span
                    key={w.id}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.15 + newWords.slice(0, 8).indexOf(w) * 0.08 }}
                    className="text-4xl"
                  >
                    {w.emoji}
                  </motion.span>
                ))}
                {newWords.length > 8 && <span className="text-3xl">…</span>}
              </div>
              <BigButton zh="开始" en="Start" className="bg-butter px-12 text-2xl text-amber-900" onClick={next} />
            </div>
          )}

          {step.kind === "learn" && (
            <div className="w-full">
              <DeckPlayer
                words={chunks[step.chunkIdx]}
                onDone={next}
                doneLabel={{ zh: "学会啦，去玩！", en: "Let's play!" }}
              />
            </div>
          )}

          {step.kind === "listen" && (
            <BubblePop
              key={`listen-${step.chunkIdx}-${replayKey}`}
              words={chunks[step.chunkIdx]}
              unit={unit}
              count={3}
              onExit={(r) => {
                collectWrong(r.wrongIds);
                next();
              }}
            />
          )}

          {step.kind === "say" && (
            <SayStep
              words={sayWords}
              onDone={(ids) => {
                collectWrong(ids);
                next();
              }}
            />
          )}

          {step.kind === "read" && (
            <ReadStep
              sentences={lessonSentences}
              words={curriculum.words}
              onDone={(ids) => {
                collectWrong(ids);
                next();
              }}
            />
          )}

          {step.kind === "play" && (
            <BubblePop
              key={`play-${replayKey}`}
              words={[...newWords, ...reviewWords]}
              unit={unit}
              count={6}
              onExit={(r) => {
                collectWrong(r.wrongIds);
                const wrongPenalty = new Set([...r.wrongIds, ...wrongIds]).size;
                const stars: 1 | 2 | 3 = wrongPenalty === 0 ? 3 : wrongPenalty <= 2 ? 2 : 1;
                progressActions.completeLesson(
                  lesson.id,
                  stars,
                  [...new Set([...wrongIds, ...r.wrongIds])],
                );
                sfx.tada();
                next();
              }}
            />
          )}

          {step.kind === "done" && (
            <DoneScreen
              stars={finalStars}
              wrongCount={new Set(wrongIds).size}
              onReplay={() => {
                setWrongIds([]);
                setReplayKey((k) => k + 1);
                setStepIdx(0);
              }}
              onBack={back}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function DoneScreen({
  stars,
  wrongCount,
  onReplay,
  onBack,
}: {
  stars: 1 | 2 | 3;
  wrongCount: number;
  onReplay: () => void;
  onBack: () => void;
}) {
  return (
    <div className="flex w-full flex-col items-center gap-8 py-10 text-center">
      <Mascot mood="cheer" bubble="上课完成啦！" bubbleEn="Lesson complete!" />
      <Stars count={stars} />
      <p className="text-lg font-bold text-slate-500">
        {wrongCount === 0 ? "全对！太棒了！Perfect!" : `${wrongCount} 个词明天再见哦`}
      </p>
      <div className="flex flex-wrap justify-center gap-4">
        <BigButton zh="再来一次" en="Again" onClick={onReplay} />
        <BigButton zh="回到地图" en="Map" className="bg-mint text-white" onClick={onBack} />
      </div>
    </div>
  );
}
