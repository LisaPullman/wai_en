// vitest 全局 setup：注册 jest-dom 断言 + 静态 audio/speech API mock
import "@testing-library/jest-dom/vitest";
import { vi, beforeEach } from "vitest";

// Audio 构造 mock（HTC jsdom 没有 HTMLMediaElement.play）
if (typeof window !== "undefined") {
  // HTMLAudioElement.play 返回 Promise，jsdom 默认 undefined，加 mock
  if (!("play" in HTMLMediaElement.prototype) || typeof (HTMLMediaElement.prototype as any).play !== "function") {
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
  const fakeUtterance = function (this: any, text: string) {
    this.text = text;
    this.lang = "en-US";
    this.rate = 1;
    this.pitch = 1;
    this.voice = null;
    this.onend = null;
    this.onerror = null;
  };
  (window as any).SpeechSynthesisUtterance = fakeUtterance;
  (window as any).speechSynthesis = {
    getVoices: () => [],
    cancel: vi.fn(),
    speak: vi.fn((u: any) => {
      // 同步触发 onend 让测试里的 await 立即生效
      queueMicrotask(() => u.onend && u.onend());
    }),
    onvoiceschanged: null,
  };

  // matchMedia（motion 库会查 prefers-reduced-motion）
  if (!window.matchMedia) {
    window.matchMedia = (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }) as any;
  }

  // pointerdown unlock
  if (!window.PointerEvent) {
    (window as any).PointerEvent = MouseEvent;
  }
}

beforeEach(() => {
  // 每个测试用例前清掉 failed 缓存（play.ts 模块单例）
  vi.resetModules();
});
