#!/usr/bin/env python3
"""为外恩英语乐园批量生成全部语音素材（调用根目录 TTS skill / tts_skill）。

覆盖（与前端约定路径一致）：
  public/audio/words/{id}.mp3                     单词音（0.8x 慢速，Ana 儿童音色）
  public/audio/sentences/{id}-ex.mp3              单词例句
  public/audio/sentences/{sid}.mp3                单元句型
  public/audio/stories/{storyId}/p{n}.mp3         故事每页朗读
  public/audio/daily/{gid}.mp3                    日常 300 句
  public/audio/ui/foxy-*.mp3                      Foxy 双语台词

用法：
  python3 scripts/gen_audio.py               # 幂等：已存在跳过
  python3 scripts/gen_audio.py --force       # 全量重生成
  python3 scripts/gen_audio.py --dry-run     # 只打印清单
  python3 scripts/gen_audio.py --only=daily  # 只生成某一类（words/sentences/stories/daily/ui）
"""
from __future__ import annotations

import argparse
import json
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "TTS skill"))
from tts_skill import BatchConfig, BatchItem, OutputTarget, TTSClient  # noqa: E402

# ---------- 音色与语速 ----------
VOICE_EN = "en-US-AnaNeural"        # Ana（儿童），最贴合孩子
VOICE_EN_FALLBACK = "en-US-JennyNeural"
VOICE_ZH = "zh-CN-XiaoyiNeural"     # 晓伊（活泼，儿童内容）
SPEED_WORD = 0.8
SPEED_SENT = 0.95
PITCH_EN = 1.05

AUDIO_ROOT = ROOT / "public" / "audio"
STAGING = AUDIO_ROOT / ".staging"


class Job:
    __slots__ = ("dest", "text", "voice", "speed", "pitch")

    def __init__(self, dest: str, text: str, voice: str, speed: float, pitch: float = PITCH_EN):
        self.dest = dest
        self.text = text
        self.voice = voice
        self.speed = speed
        self.pitch = pitch


def load_json(p: Path):
    return json.loads(p.read_text(encoding="utf-8"))


def build_jobs(only: str | None) -> list[Job]:
    jobs: list[Job] = []

    words = load_json(ROOT / "src/content/curriculum/words.json")
    if not only or only == "words":
        for w in words.values():
            text = w.get("tts") or w["text"]
            jobs.append(Job(f"words/{w['id']}.mp3", text, VOICE_EN, SPEED_WORD))
            jobs.append(Job(f"sentences/{w['id']}-ex.mp3", w["sentence"], VOICE_EN, SPEED_SENT))

    if not only or only == "sentences":
        for uj in sorted((ROOT / "src/content/curriculum").glob("u*.json")):
            unit = load_json(uj)
            for s in unit.get("sentences", []):
                jobs.append(Job(f"sentences/{s['id']}.mp3", s["text"], VOICE_EN, SPEED_SENT))

    if not only or only == "stories":
        for sj in sorted((ROOT / "src/content/stories").glob("s*.json")):
            story = load_json(sj)
            for n, page in enumerate(story["pages"], 1):
                jobs.append(Job(f"stories/{story['id']}/p{n}.mp3", page["text"], VOICE_EN, SPEED_SENT))

    if not only or only == "daily":
        daily = load_json(ROOT / "src/content/daily300/daily300.json")
        for theme in daily["themes"]:
            for s in theme["sentences"]:
                jobs.append(Job(f"daily/{s['id']}.mp3", s["text"], VOICE_EN, SPEED_SENT))

    if not only or only == "listen":
        # 听故事 100 篇：整篇朗读（句间用句号自然停顿）
        for part in ["part1.json", "part2.json"]:
            data = load_json(ROOT / "src/content/listen100" / part)
            for col in data["collections"]:
                for s in col["stories"]:
                    text = " ".join(s["sentences"])
                    jobs.append(Job(f"listen/{s['id']}.mp3", text, VOICE_EN, 0.92))

    if not only or only == "ui":
        # Foxy 台词（与 src/components/common/Foxy.tsx 保持一致）
        foxy = [
            ("ui/foxy-hello.mp3", "Hi! I'm Foxy! Let's learn English!", VOICE_EN),
            ("ui/foxy-hello-zh.mp3", "你好呀！我是阿福！", VOICE_ZH),
            ("ui/foxy-line-1.mp3", "Hi! I'm Foxy!", VOICE_EN),
            ("ui/foxy-line-1-zh.mp3", "你好呀！我是阿福！", VOICE_ZH),
            ("ui/foxy-line-2.mp3", "Let's learn English!", VOICE_EN),
            ("ui/foxy-line-2-zh.mp3", "我们一起学英语吧！", VOICE_ZH),
            ("ui/foxy-line-3.mp3", "Tap and listen!", VOICE_EN),
            ("ui/foxy-line-3-zh.mp3", "点一点，听一听！", VOICE_ZH),
            ("ui/foxy-line-4.mp3", "You can do it!", VOICE_EN),
            ("ui/foxy-line-4-zh.mp3", "你可以的！", VOICE_ZH),
            ("ui/foxy-line-5.mp3", "Take a little break.", VOICE_EN),
            ("ui/foxy-line-5-zh.mp3", "休息一下也可以哦。", VOICE_ZH),
            ("ui/foxy-line-6.mp3", "I love stories!", VOICE_EN),
            ("ui/foxy-line-6-zh.mp3", "我最喜欢讲故事啦！", VOICE_ZH),
        ]
        for dest, text, voice in foxy:
            jobs.append(Job(dest, text, voice, SPEED_SENT, 1.0 if voice == VOICE_ZH else PITCH_EN))
    return jobs


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--force", action="store_true", help="已存在也重新生成")
    ap.add_argument("--dry-run", action="store_true", help="只打印清单不合成")
    ap.add_argument("--only", choices=["words", "sentences", "stories", "daily", "listen", "ui"], default=None)
    args = ap.parse_args()

    jobs = build_jobs(args.only)
    total = len(jobs)
    jobs = [j for j in jobs if args.force or not (AUDIO_ROOT / j.dest).exists() or (AUDIO_ROOT / j.dest).stat().st_size == 0]
    # （上面条件故意保留空/零字节文件的重试）

    print(f"共 {total} 条，待生成 {len(jobs)} 条 -> {AUDIO_ROOT}", file=sys.stderr)
    if args.dry_run:
        for j in jobs[:40]:
            print(f"  {j.dest}  [{j.voice}] {j.text[:40]}", file=sys.stderr)
        return 0
    if not jobs:
        print("全部已存在，无需生成。", file=sys.stderr)
        return 0

    STAGING.mkdir(parents=True, exist_ok=True)
    items = [
        BatchItem(text=j.text, voice=j.voice, speed=j.speed, pitch=j.pitch, output_basename=f"job{i:05d}")
        for i, j in enumerate(jobs)
    ]

    client = TTSClient()
    # 儿童音色不可用时回退 Jenny
    try:
        probe = client.synthesize("hello", voice=VOICE_EN, target=OutputTarget(directory=STAGING), output_basename="__probe__")
        Path(probe).unlink(missing_ok=True)
    except Exception:
        for it in items:
            if it.voice == VOICE_EN:
                it.voice = VOICE_EN_FALLBACK
        print(f"儿童音色不可用，回退 {VOICE_EN_FALLBACK}", file=sys.stderr)

    report = client.synthesize_batch(
        items,
        target=OutputTarget(directory=STAGING),
        config=BatchConfig(
            concurrency=4,
            fail_fast=False,
            on_progress=lambda r: print(
                f"  · [{r.index + 1}/{len(items)}] {'OK' if r.success else 'FAIL'} {jobs[r.index].dest} {r.error or ''}",
                file=sys.stderr,
            ),
        ),
    )

    # 归位到约定路径
    moved, failed = 0, report.failed
    for r in report.success_results:
        job = jobs[r.index]
        dest = AUDIO_ROOT / job.dest
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.move(str(r.path), dest)
        moved += 1
    shutil.rmtree(STAGING, ignore_errors=True)

    print(f"完成：成功归位 {moved}，失败 {failed}；报告可重跑本脚本续传。", file=sys.stderr)
    return 0 if failed == 0 else 4


if __name__ == "__main__":
    sys.exit(main())
