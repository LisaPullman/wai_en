/** MediaRecorder 封装：按住录音、松开停止，产出可回放的 blob URL */

"use client";

export interface RecorderHandle {
  stop: () => Promise<{ url: string; blob: Blob } | null>;
  cancel: () => void;
  level: () => number; // 0-1 音量（驱动话筒动画）
}

export const recorderSupported = () =>
  typeof window !== "undefined" &&
  Boolean(navigator.mediaDevices?.getUserMedia) &&
  typeof window.MediaRecorder !== "undefined";

function pickMime(): string | undefined {
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
  return candidates.find((t) => MediaRecorder.isTypeSupported(t));
}

/** 开始录音；无权限/不支持时 throw（UI 引导降级） */
export async function startRecording(): Promise<RecorderHandle> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const mimeType = pickMime();
  const rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
  const chunks: Blob[] = [];

  // 音量表
  const ctx = new (window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  const src = ctx.createMediaStreamSource(stream);
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 256;
  src.connect(analyser);
  const buf = new Uint8Array(analyser.frequencyBinCount);

  rec.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };
  rec.start();

  const cleanup = () => {
    stream.getTracks().forEach((t) => t.stop());
    void ctx.close();
  };

  return {
    level: () => {
      analyser.getByteFrequencyData(buf);
      let sum = 0;
      for (const v of buf) sum += v;
      return Math.min(1, sum / buf.length / 64);
    },
    stop: () =>
      new Promise((resolve) => {
        rec.onstop = () => {
          cleanup();
          if (chunks.length === 0) return resolve(null);
          const blob = new Blob(chunks, { type: rec.mimeType || "audio/webm" });
          resolve({ url: URL.createObjectURL(blob), blob });
        };
        rec.stop();
      }),
    cancel: () => {
      try {
        rec.stop();
      } catch {
        /* noop */
      }
      cleanup();
    },
  };
}
