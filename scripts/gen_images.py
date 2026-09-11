#!/usr/bin/env python3
"""为外恩英语乐园批量生成全部插图（调用根目录 schnell skill/foxai-batch-imagegen）。

覆盖（与前端约定路径一致，jpg）：
  public/images/words/{id}.jpg            单词卡通插图（字母卡用 emoji，不生成）
  public/images/units/{id}.jpg            单元封面
  public/images/stories/{id}/p{n}.jpg     故事每页插画

统一风格：儿童绘本扁平矢量、明亮暖色、圆线条、无文字、纯色底。

用法：
  python3 scripts/gen_images.py            # 幂等：已存在跳过
  python3 scripts/gen_images.py --force
  python3 scripts/gen_images.py --dry-run
  python3 scripts/gen_images.py --only=words|units|stories
"""
from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
GEN = ROOT / "schnell skill" / "foxai-batch-imagegen" / "scripts" / "generate.py"
IMG_ROOT = ROOT / "public" / "images"
STAGING = ROOT / "public" / "images" / ".staging"

STYLE = (
    "children's picture book illustration, flat vector style, bright warm colors, "
    "thick rounded outlines, cute and friendly, simple plain pastel background, "
    "single centered subject, no text, no letters, no watermark"
)

# 需要语义描述的词（其余默认 "a cute {text}"）
SUBJECT: dict[str, str] = {
    "red": "one big shiny red balloon, solid bright red color",
    "blue": "one big shiny blue balloon, solid bright blue color",
    "green": "one big shiny green balloon, solid bright green color",
    "yellow": "one big shiny yellow balloon, solid bright yellow color",
    "orange": "one big shiny orange balloon, solid bright orange color",
    "purple": "one big shiny purple balloon, solid bright purple color",
    "pink": "one big shiny pink balloon, solid bright pink color",
    "brown": "one big shiny brown balloon, solid chocolate brown color",
    "black": "one big shiny black balloon, solid black color",
    "white": "one big round white cloud, solid white color on light blue sky",
    "hot": "a smiling sun with sunglasses, sweating, very hot summer day",
    "sit": "a cute little cat sitting down nicely on a small chair",
    "sun": "a big smiling yellow sun with soft rays",
    "hat": "a cute little orange pointed hat with a buckle",
    "map": "a folded treasure map with a dotted path and a red X mark, no words",
    "bed": "a cozy little bed with a colorful blanket and a teddy bear",
    "pen": "a cute blue fountain pen with a happy face",
    "box": "a cute brown cardboard box, slightly open with light coming out",
    "bug": "a tiny cute green ladybug smiling",
    "fish": "a cute colorful fish blowing bubbles",
    "bird": "a cute little blue bird singing on a branch",
    "cat": "a cute orange tabby kitten with big eyes",
    "dog": "a cute happy puppy wagging its tail",
    "pig": "a cute pink piglet smiling",
    "bear": "a cute brown bear cub waving hello",
    "duck": "a cute yellow duckling standing on grass",
    "panda": "a cute baby panda holding bamboo",
    "rabbit": "a cute white rabbit with long ears eating a carrot",
    "monkey": "a cute little monkey hanging on a tree branch",
}


class Job:
    __slots__ = ("dest", "prompt")

    def __init__(self, dest: str, subject: str):
        self.dest = dest
        self.prompt = f"{STYLE}. Subject: {subject}."


def load_json(p: Path):
    return json.loads(p.read_text(encoding="utf-8"))


def build_jobs(only: str | None) -> list[Job]:
    jobs: list[Job] = []
    words = load_json(ROOT / "src/content/curriculum/words.json")

    if not only or only == "words":
        for w in words.values():
            if w.get("kind") == "letter":
                continue  # 字母卡前端用大字母 + emoji，无需生成
            subject = SUBJECT.get(w["id"], f"a cute {w['text']}")
            jobs.append(Job(f"words/{w['id']}.jpg", subject))

    if not only or only == "units":
        unit_subject = {
            "u0-letters": "twenty-six colorful alphabet blocks scattered playfully, no readable letters",
            "u1-phonics-cvc": "magic wand with sparkling stars and floating letter blocks",
            "u2-colors": "a beautiful rainbow over green hills with colorful paint splashes",
            "u3-animals": "a happy parade of cute baby animals: cat, dog, rabbit, panda, bear",
        }
        for uj in sorted((ROOT / "src/content/curriculum").glob("u*.json")):
            uid = load_json(uj)["id"]
            jobs.append(Job(f"units/{uid}.jpg", unit_subject.get(uid, "cute animal friends playing together")))

    if not only or only == "stories":
        for sj in sorted((ROOT / "src/content/stories").glob("s*.json")):
            story = load_json(sj)
            for n, page in enumerate(story["pages"], 1):
                scene = f"storybook scene: {page['text']} (theme: {page['zh']})"
                jobs.append(Job(f"stories/{story['id']}/p{n}.jpg", scene))

    return jobs


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--force", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--only", choices=["words", "units", "stories"], default=None)
    args = ap.parse_args()

    jobs = build_jobs(args.only)
    total = len(jobs)
    jobs = [j for j in jobs if args.force or not (IMG_ROOT / j.dest).exists()]
    print(f"共 {total} 张，待生成 {len(jobs)} 张 -> {IMG_ROOT}", file=sys.stderr)
    if args.dry_run:
        for j in jobs:
            print(f"  {j.dest}\n    {j.prompt[:100]}", file=sys.stderr)
        return 0
    if not jobs:
        print("全部已存在，无需生成。", file=sys.stderr)
        return 0

    STAGING.mkdir(parents=True, exist_ok=True)
    prompts = [{"name": f"job{i:04d}", "prompt": j.prompt} for i, j in enumerate(jobs)]
    prompts_file = STAGING / "prompts.json"
    prompts_file.write_text(json.dumps(prompts, ensure_ascii=False, indent=1), encoding="utf-8")

    r = subprocess.run(
        [
            sys.executable,
            str(GEN),
            "--prompts-file",
            str(prompts_file),
            "--out",
            str(STAGING),
            "--model",
            "flux-1-schnell",
            "--concurrency",
            "2",
            "--verify",
        ],
    )
    report = json.loads((STAGING / "report.json").read_text(encoding="utf-8"))

    moved, failed = 0, 0
    for img in report.get("images", []):
        job = jobs[int(img["name"].removeprefix("job"))]
        dest = IMG_ROOT / job.dest
        if img.get("status") != "ok" or not img.get("file"):
            print(f"  FAIL {job.dest}: {img.get('error') or img.get('verify')}", file=sys.stderr)
            failed += 1
            continue
        dest.parent.mkdir(parents=True, exist_ok=True)
        src = Path(img["file"])
        if src.suffix.lower() == ".jpg" or src.suffix.lower() == ".jpeg":
            shutil.move(str(src), dest)
        else:
            # png/webp → 统一转 jpg（macOS sips）
            tmp = STAGING / "conv.jpg"
            subprocess.run(["sips", "-s", "format", "jpeg", str(src), "--out", str(tmp)], capture_output=True)
            shutil.move(str(tmp), dest)
            src.unlink(missing_ok=True)
        moved += 1

    shutil.rmtree(STAGING, ignore_errors=True)
    print(f"完成：成功 {moved}，失败 {failed}（重跑本脚本只补失败项）。exit={r.returncode}", file=sys.stderr)
    return 0 if failed == 0 else 4


if __name__ == "__main__":
    sys.exit(main())
