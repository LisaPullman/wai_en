"use client";

import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { Word } from "@/content/types";
import { playWordAudio } from "@/lib/audio/play";
import { sfx } from "@/lib/audio/sfx";
import { getAssessor, recognizeOnce, type AssessResult } from "@/lib/speech/assessor";
import { recorderSupported, startRecording, type RecorderHandle } from "@/lib/speech/recorder";
import { BigButton, Mascot } from "@/components/common/common";
import { WordImage } from "@/components/common/WordImage";

type Phase = "model" | "recording" | "assessing" | "result";

/** SAY 环节：每个词 示范 → 录音 → 评估/回放 → 自评 */
export function SayStep({ words, onDone }: { words: Word[]; onDone: (wrongIds: string[]) => void }) {
  const [wi, setWi] = useState(0);
  const [phase, setPhase] = useState<Phase>("model");
  const [recUrl, setRecUrl] = useState<string | null>(null);
  const [result, setResult] = useState<AssessResult | null>(null);
  const [level, setLevel] = useState(0);
  const [micDenied, setMicDenied] = useState(!recorderSupported());
  const recRef = useRef<RecorderHandle | null>(null);
  const rafRef = useRef<number>(0);
  const word = words[wi];

  useEffect(() => {
    // 自动播示范
    if (word) playWordAudio(word.id, word.tts ?? word.text);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wi]);

  const cleanup = () => {
    cancelAnimationFrame(rafRef.current);
    recRef.current = null;
  };

  const startRec = async () => {
    setRecUrl(null);
    setResult(null);
    try {
      const rec = (recRef.current = await startRecording());
      setPhase("recording");
      sfx.tap();
      const tick = () => {
        setLevel(rec.level());
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch {
      setMicDenied(true);
      setPhase("model");
    }
  };

  const stopRec = async () => {
    const rec = recRef.current;
    if (!rec) return;
    cleanup();
    setLevel(0);
    const out = await rec.stop();
    if (!out) {
      setPhase("model");
      return;
    }
    setRecUrl(out.url);
    setPhase("assessing");
    // 回放自己的录音 + 尝试识别评分
    const a = new Audio(out.url);
    void a.play().catch(() => {});
    const assessor = getAssessor();
    const r = await assessor.assess(word.text);
    if (r) {
      setResult(r);
      if (r.passed) sfx.correct();
      setPhase("result");
    } else {
      // 无识别能力：等回放完进入自评
      setTimeout(() => setPhase("result"), 1500);
    }
  };

  const next = () => {
    if (wi + 1 >= words.length) onDone([]);
    else {
      setWi((i) => i + 1);
      setPhase("model");
      setRecUrl(null);
      setResult(null);
    }
  };

  if (!word) return null;

  return (
    <div className="flex w-full flex-col items-center gap-5">
      <Mascot
        mood={phase === "result" && result?.passed ? "cheer" : "happy"}
        bubble={phase === "model" ? "听一听，跟我读！" : phase === "recording" ? "我在听你说…" : "读得怎么样？"}
        bubbleEn={phase === "model" ? "Listen and repeat!" : phase === "recording" ? "I'm listening…" : "How was that?"}
      />

      <WordImage word={word} className="h-36 w-36 sm:h-44 sm:w-44" />
      <div className="text-5xl font-black text-slate-800">{word.text}</div>
      <div className="text-lg font-bold text-slate-400">{word.zh}</div>

      {micDenied ? (
        /* 无麦克风/被拒：降级为跟读模式 */
        <div className="flex flex-col items-center gap-4 rounded-3xl bg-white/70 p-6">
          <p className="text-center text-sm font-medium text-slate-500">
            没有麦克风也能练！听一听，大声跟着读～<br />No mic? Just listen and read aloud!
          </p>
          <div className="flex gap-3">
            <BigButton zh="再听一次" en="Listen" onClick={() => playWordAudio(word.id, word.tts ?? word.text)} />
            <BigButton zh="下一个" en="Next" className="bg-mint text-white" onClick={next} />
          </div>
        </div>
      ) : (
        <>
          {/* 录音按钮 */}
          {phase !== "result" && (
            <div className="flex flex-col items-center gap-3">
              <motion.button
                whileTap={{ scale: 0.92 }}
                onPointerDown={(e) => {
                  e.preventDefault();
                  if (phase === "model" || phase === "assessing") void startRec();
                }}
                onPointerUp={() => {
                  if (phase === "recording") void stopRec();
                }}
                onClick={() => {
                  // 桌面鼠标点按（pointer 事件已处理，此处兜底长按转点按）
                }}
                className={`flex h-28 w-28 items-center justify-center rounded-full text-5xl text-white shadow-xl transition-colors ${
                  phase === "recording" ? "bg-coral" : "bg-grape"
                }`}
                aria-label="按住录音"
              >
                {phase === "recording" ? (
                  <motion.span
                    animate={{ scale: 1 + level * 0.35 }}
                    className="flex h-28 w-28 items-center justify-center rounded-full bg-coral/40"
                  >
                    🎤
                  </motion.span>
                ) : (
                  "🎤"
                )}
              </motion.button>
              <span className="text-sm font-bold text-slate-400">
                {phase === "recording" ? "松开结束 Release to stop" : "按住说话 Hold to talk"}
              </span>
            </div>
          )}

          {/* 结果 */}
          {phase === "result" && (
            <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-3xl bg-white p-6 shadow-lg">
              {result ? (
                <>
                  <div className={`text-6xl font-black ${result.passed ? "text-mint" : "text-butter"}`}>
                    {result.score}分
                  </div>
                  <div className="text-sm font-medium text-slate-400">我听到：{result.transcript}</div>
                </>
              ) : (
                <p className="text-center text-base font-bold text-slate-500">
                  听听自己的声音，像不像？<br />Does it sound right?
                </p>
              )}
              {recUrl && (
                <button
                  onClick={() => void new Audio(recUrl).play().catch(() => {})}
                  className="rounded-full bg-slate-100 px-5 py-3 font-bold text-slate-600"
                >
                  🔉 我的录音 My voice
                </button>
              )}
              <div className="flex gap-3">
                <BigButton zh="再试一次" en="Again" onClick={() => void startRec()} />
                <BigButton zh="很好，下一个" en="Next" className="bg-mint text-white" onClick={next} />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
