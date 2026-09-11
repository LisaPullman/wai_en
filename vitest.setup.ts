// vitest 全局 setup：注册 jest-dom 断言 + 静态 audio/speech API mock
import "@testing-library/jest-dom/vitest";
import { vi, beforeEach } from "vitest";

type Mutable<T> = { -readonly [K in keyof T]: T[K] };

// Audio 构造 mock（jsdom 没有 HTMLMediaElement.play）
if (typeof window !== "undefined") {
  if (!("play" in HTMLMediaElement.prototype) || typeof HTMLMediaElement.prototype.play !== "function") {
    Object.defineProperty(HTMLMediaElement.prototype, "play", {
      configurable: true,
      writable: true,
      value: vi.fn().mockResolvedValue(undefined),
    });
    Object.defineProperty(HTMLMediaElement.prototype, "pause", {
      configurable: true,
      writable: true,
      value: vi.fn(),
    });
  }

  // speechSynthesis 兜底 mock（jsdom 完全没有）
  interface FakeUtterance {
    text: string;
    lang: string;
    rate: number;
    pitch: number;
    voice: SpeechSynthesisVoice | null;
    onend: (() => void) | null;
    onerror: (() => void) | null;
  }
  const fakeUtterance = function (this: FakeUtterance, text?: string) {
    this.text = text ?? "";
    this.lang = "en-US";
    this.rate = 1;
    this.pitch = 1;
    this.voice = null;
    this.onend = null;
    this.onerror = null;
  } as unknown as new (text?: string) => FakeUtterance;
  const w = window as Mutable<typeof window> & typeof globalThis;
  w.SpeechSynthesisUtterance = fakeUtterance as unknown as typeof SpeechSynthesisUtterance;
  w.speechSynthesis = {
    getVoices: () => [],
    cancel: vi.fn(),
    speak: vi.fn((u: FakeUtterance) => {
      // 同步触发 onend 让测试里的 await 立即生效
      queueMicrotask(() => u.onend && u.onend());
    }),
    onvoiceschanged: null,
  } as unknown as typeof window.speechSynthesis;

  // matchMedia（motion 库会查 prefers-reduced-motion）
  if (!window.matchMedia) {
    window.matchMedia = ((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })) as unknown as typeof window.matchMedia;
  }

  // pointerdown unlock
  if (!window.PointerEvent) {
    w.PointerEvent = MouseEvent as unknown as typeof PointerEvent;
  }
}

beforeEach(() => {
  // 每个测试用例前清掉 failed 缓存（play.ts 模块单例）
  vi.resetModules();
});
