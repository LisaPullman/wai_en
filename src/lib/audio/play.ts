/** 音频播放器：预生成 MP3 优先，缺失时 speechSynthesis 兜底。
 *  单例 <audio>，新播放打断旧播放（孩子连点不叠音）。
 *  失败缓存：内存 + localStorage 双层；连续失败 3 次才标记。
 *  提供 resetFailed() 让用户在"听不到声音"时手动重试（家长页可放入口）。 */

export interface PlayOpts {
  rate?: number; // TTS 兜底语速，词 0.8 / 句 0.95
  /** MP3 资产的播放速度（HTMLMediaElement.playbackRate，降速不变调）。
   *  注意与 rate 分开：资产生成时已带慢速（词 0.8x），此处只用于「慢速开关」等交互，默认 1 */
  assetRate?: number;
  lang?: "en-US" | "zh-CN"; // TTS 兜底语言
  onEnd?: () => void;
}

let audioEl: HTMLAudioElement | null = null;
/** key=path, value=连续失败次数。>=3 才标记到 failedSet */
const attemptCount = new Map<string, number>();
/** 已确认 404 的资产（避免每次都试探） */
let failedSet = new Set<string>();
let currentToken = 0;

const FAILED_KEY = "wai-en-audio-failed-v1"; // localStorage 持久化

function loadFailedFromStorage() {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(FAILED_KEY);
    if (raw) failedSet = new Set(JSON.parse(raw));
  } catch {
    /* 隐私模式 / quota */
  }
}

function persistFailed() {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(FAILED_KEY, JSON.stringify([...failedSet]));
  } catch {
    /* noop */
  }
}

/** 手动清空失败缓存（家长页 / 开发者工具可调） */
export function resetFailedAudio() {
  failedSet = new Set();
  attemptCount.clear();
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(FAILED_KEY);
    } catch {
      /* noop */
    }
  }
}

function markFailed(path: string) {
  const n = (attemptCount.get(path) ?? 0) + 1;
  attemptCount.set(path, n);
  if (n >= 3 && !failedSet.has(path)) {
    failedSet.add(path);
    persistFailed();
  }
}

function clearAttempts(path: string) {
  attemptCount.delete(path);
  if (failedSet.has(path)) {
    failedSet.delete(path);
    persistFailed();
  }
}

// 模块加载时恢复失败缓存
if (typeof window !== "undefined") loadFailedFromStorage();

function el(): HTMLAudioElement {
  if (!audioEl) {
    audioEl = new Audio();
    audioEl.preload = "auto";
    audioEl.setAttribute("playsinline", "");
  }
  return audioEl;
}

/** 预加载（进页/答题前预热下一个音频） */
export function preload(path: string) {
  if (typeof window === "undefined" || failedSet.has(path)) return;
  const a = el();
  if (a.src !== abs(path)) {
    a.src = abs(path);
    a.load();
  }
}

function abs(path: string) {
  return path.startsWith("http") ? path : path;
}

/* ---------- speechSynthesis 兜底 ---------- */

let voicesCache: SpeechSynthesisVoice[] = [];
function pickVoice(lang: string): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  if (voicesCache.length === 0) voicesCache = window.speechSynthesis.getVoices();
  const wantZh = lang.startsWith("zh");
  const prefer = wantZh ? /xiaoxiao|tingting|mei|female|女/i : /female|samantha|zira|aria/i;
  const langMatch = wantZh ? /^zh[-_]CN/i : /^en[-_]US/i;
  const fallback = wantZh ? /^zh/i : /^en/i;
  return (
    voicesCache.find((v) => langMatch.test(v.lang) && prefer.test(v.name)) ||
    voicesCache.find((v) => langMatch.test(v.lang)) ||
    voicesCache.find((v) => fallback.test(v.lang)) ||
    null
  );
}

if (typeof window !== "undefined" && window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = () => {
    voicesCache = [];
  };
}

export function speak(text: string, opts: PlayOpts = {}) {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    opts.onEnd?.();
    return;
  }
  window.speechSynthesis.cancel();
  const lang = opts.lang ?? "en-US";
  const u = new SpeechSynthesisUtterance(text);
  const v = pickVoice(lang);
  if (v) u.voice = v;
  u.lang = lang;
  u.rate = opts.rate ?? 0.9;
  u.pitch = 1.1; // 略高音，贴近童声
  u.onend = () => opts.onEnd?.();
  u.onerror = () => opts.onEnd?.();
  window.speechSynthesis.speak(u);
}

export function stopAudio() {
  currentToken++;
  if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel();
  const a = audioEl;
  if (a && !a.paused) a.pause();
}

/* ---------- 主入口 ---------- */

/** 播放资产 MP3；文件缺失(404)自动降级 TTS 朗读 fallbackText */
export function playAsset(path: string, fallbackText: string, opts: PlayOpts = {}) {
  const myToken = ++currentToken;
  const done = () => {
    if (myToken === currentToken) opts.onEnd?.();
  };

  if (typeof window === "undefined" || failedSet.has(path)) {
    speak(fallbackText, { ...opts, onEnd: done });
    return;
  }
  const a = el();
  a.src = path;
  const cleanup = () => {
    a.removeEventListener("canplay", onOk);
    a.removeEventListener("error", onErr);
  };
  const onOk = () => {
    cleanup();
    if (myToken !== currentToken) return;
    // 成功 canplay → 清失败计数（资产已生成/网络恢复）
    clearAttempts(path);
    a.onended = done;
    a.onerror = () => {
      markFailed(path);
      speak(fallbackText, { ...opts, onEnd: done });
    };
    // 慢速开关：作用于真实资产（降速不变调）
    const ar = opts.assetRate ?? 1;
    try {
      a.playbackRate = Math.min(2, Math.max(0.5, ar));
    } catch {
      /* 个别老浏览器设置时机限制，忽略 */
    }
    void a.play()
      .then(() => {
        // 播放成功启动
      })
      .catch(() => {
        markFailed(path);
        speak(fallbackText, { ...opts, onEnd: done });
      });
  };
  const onErr = () => {
    cleanup();
    markFailed(path);
    speak(fallbackText, { ...opts, onEnd: done });
  };
  a.addEventListener("canplay", onOk, { once: true });
  a.addEventListener("error", onErr, { once: true });
  a.load();
}

/* ---------- 面向内容的快捷方法 ---------- */

export const audioPath = {
  word: (id: string) => `/audio/words/${id}.mp3`,
  wordExample: (id: string) => `/audio/sentences/${id}-ex.mp3`,
  sentence: (id: string) => `/audio/sentences/${id}.mp3`,
  storyPage: (storyId: string, n: number) => `/audio/stories/${storyId}/p${n}.mp3`,
};

export function playWordAudio(id: string, text: string, opts?: PlayOpts) {
  playAsset(audioPath.word(id), text, { rate: 0.8, ...opts });
}

export function playSentenceAudio(id: string, text: string, opts?: PlayOpts) {
  playAsset(audioPath.sentence(id), text, { rate: 0.95, ...opts });
}
