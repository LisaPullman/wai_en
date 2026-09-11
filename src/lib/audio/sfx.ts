/** UI 音效：WebAudio 现场合成，零素材依赖 */

let ctx: AudioContext | null = null;

function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

/** 首个用户手势时调用，解锁 iOS 音频 */
export function unlockAudio() {
  const c = ac();
  if (!c) return;
  const buf = c.createBuffer(1, 1, 22050);
  const src = c.createBufferSource();
  src.buffer = buf;
  src.connect(c.destination);
  src.start(0);
}

function tone(
  freq: number,
  start: number,
  dur: number,
  type: OscillatorType = "sine",
  vol = 0.18,
) {
  const c = ac();
  if (!c) return;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  const t0 = c.currentTime + start;
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(vol, t0 + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  osc.connect(gain).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

export const sfx = {
  /** 答对：上行双音 */
  correct() {
    tone(660, 0, 0.12, "triangle");
    tone(880, 0.09, 0.16, "triangle");
  },
  /** 答错：柔和低音（不刺耳、不惩罚） */
  wrong() {
    tone(220, 0, 0.2, "sine", 0.12);
    tone(185, 0.1, 0.25, "sine", 0.1);
  },
  /** 得星/庆祝：小号角琶音 */
  tada() {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.09, 0.18, "triangle"));
  },
  /** 泡泡爆裂 */
  pop() {
    tone(320, 0, 0.06, "square", 0.1);
    tone(150, 0.03, 0.08, "sine", 0.14);
  },
  /** 翻卡 */
  flip() {
    tone(500, 0, 0.05, "sine", 0.1);
  },
  /** 点击通用 */
  tap() {
    tone(440, 0, 0.04, "sine", 0.08);
  },
  /** 打卡火焰 */
  streak() {
    tone(392, 0, 0.1, "triangle");
    tone(523, 0.08, 0.1, "triangle");
    tone(659, 0.16, 0.2, "triangle");
  },
};
