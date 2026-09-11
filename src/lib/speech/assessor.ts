/** 口语跟读评估：Web Speech 识别（可用时）→ 录音回放自评（兜底） */

"use client";

export interface AssessResult {
  score: number; // 0-100
  passed: boolean; // 相似度 ≥ 0.8
  transcript: string;
  mode: "webspeech" | "manual";
}

/* ---------- 文本相似度（编辑距离比例） ---------- */

function normalize(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .split(/\s+/)
    .filter(Boolean);
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
  return dp[m][n];
}

export function similarity(target: string, said: string): number {
  const t = normalize(target).join(" ");
  const s = normalize(said).join(" ");
  if (!t) return 0;
  if (!s) return 0;
  const dist = levenshtein(t, s);
  return Math.max(0, 1 - dist / Math.max(t.length, s.length));
}

/* ---------- Web Speech 探测与识别 ---------- */

type AnySpeechRecognition = {
  new (): {
    lang: string;
    interimResults: boolean;
    maxAlternatives: number;
    continuous: boolean;
    onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
    onerror: ((e: unknown) => void) | null;
    onend: (() => void) | null;
    start: () => void;
    stop: () => void;
    abort: () => void;
  };
};

function getSR(): AnySpeechRecognition | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as Record<string, unknown>;
  return (w.SpeechRecognition || w.webkitSpeechRecognition) as AnySpeechRecognition | null;
}

export const speechSupported = () => Boolean(getSR());

/** 用 Web Speech 识别一段话；不支持/失败时 resolve(null) */
export function recognizeOnce(timeLimitMs = 6000): Promise<string | null> {
  const SR = getSR();
  if (!SR) return Promise.resolve(null);
  return new Promise((resolve) => {
    const rec = new SR();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.continuous = false;
    let settled = false;
    const finish = (text: string | null) => {
      if (settled) return;
      settled = true;
      try {
        rec.abort();
      } catch {
        /* noop */
      }
      resolve(text);
    };
    rec.onresult = (e) => {
      const first = e.results[0]?.[0]?.transcript ?? "";
      finish(first || null);
    };
    rec.onerror = () => finish(null);
    rec.onend = () => finish(null);
    try {
      rec.start();
    } catch {
      finish(null);
    }
    setTimeout(() => finish(null), timeLimitMs);
  });
}

/* ---------- 适配器 ---------- */

export interface SpeechAssessor {
  id: "webspeech" | "manual";
  supported(): boolean;
  /** 跟读目标词/句，返回评分；manual 模式恒 null（由 UI 自评） */
  assess(target: string): Promise<AssessResult | null>;
}

export const webSpeechAssessor: SpeechAssessor = {
  id: "webspeech",
  supported: speechSupported,
  async assess(target) {
    const said = await recognizeOnce();
    if (said == null) return null;
    const sim = similarity(target, said);
    return {
      score: Math.round(sim * 100),
      passed: sim >= 0.8,
      transcript: said,
      mode: "webspeech",
    };
  },
};

export const manualAssessor: SpeechAssessor = {
  id: "manual",
  supported: () => true,
  async assess() {
    return null;
  },
};

export function getAssessor(): SpeechAssessor {
  return speechSupported() ? webSpeechAssessor : manualAssessor;
}
