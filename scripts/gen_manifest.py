"""
扫描 public/ 实际生成的资产 + 内容 JSON 期待的资产，生成 manifest.json。
spec.md §5.4 末尾说 npm run build 前校验缺失清单（fail-fast）。

用法：
  python3 scripts/gen_manifest.py
  python3 scripts/gen_manifest.py --strict  # 有缺失时 exit 1
"""
from __future__ import annotations

import argparse
import hashlib
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PUB = ROOT / "public"
# 注意：不能叫 manifest.json —— 那是浏览器 PWA 清单的保留名
MANIFEST = ROOT / "public/asset-manifest.json"


def md5(p: Path) -> str:
    h = hashlib.md5()
    with p.open("rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def build_expected() -> set[str]:
    import re
    expected: set[str] = set()
    # 单词 + 例句
    words = json.loads((ROOT / "src/content/curriculum/words.json").read_text(encoding="utf-8"))
    for wid in words:
        expected.add(f"audio/words/{wid}.mp3")
        expected.add(f"audio/sentences/{wid}-ex.mp3")
    # 句型
    for f in (ROOT / "src/content/curriculum").glob("u*.json"):
        u = json.loads(f.read_text(encoding="utf-8"))
        for s in u.get("sentences", []):
            expected.add(f"audio/sentences/{s['id']}.mp3")
    # 故事页
    for f in (ROOT / "src/content/stories").glob("*.json"):
        s = json.loads(f.read_text(encoding="utf-8"))
        sid = s["id"]
        for n in range(1, len(s.get("pages", [])) + 1):
            expected.add(f"audio/stories/{sid}/p{n}.mp3")
    # Foxy 6 句台词
    for n in range(1, 7):
        expected.add(f"audio/ui/foxy-line-{n}.mp3")
        expected.add(f"audio/ui/foxy-line-{n}-zh.mp3")
    expected.add("audio/ui/foxy-hello.mp3")
    expected.add("audio/ui/foxy-hello-zh.mp3")
    # 日常 300 句
    daily = json.loads((ROOT / "src/content/daily300/daily300.json").read_text(encoding="utf-8"))
    for theme in daily["themes"]:
        for s in theme["sentences"]:
            expected.add(f"audio/daily/{s['id']}.mp3")
    # 听故事 100 篇
    for part in ["part1.json", "part2.json"]:
        data = json.loads((ROOT / "src/content/listen100" / part).read_text(encoding="utf-8"))
        for col in data["collections"]:
            for s in col["stories"]:
                expected.add(f"audio/listen/{s['id']}.mp3")
    # 图片资产（单词图 / 单元封面 / 故事页）
    for wid, w in words.items():
        if w.get("kind") == "word":
            expected.add(f"images/words/{wid}.jpg")
    for f in (ROOT / "src/content/curriculum").glob("u*.json"):
        expected.add(f"images/units/{json.loads(f.read_text(encoding='utf-8'))['id']}.jpg")
    for f in (ROOT / "src/content/stories").glob("*.json"):
        s = json.loads(f.read_text(encoding="utf-8"))
        for n in range(1, len(s.get("pages", [])) + 1):
            expected.add(f"images/stories/{s['id']}/p{n}.jpg")
    # 静态扫描兜底
    for f in (ROOT / "src").rglob("*.tsx"):
        if ".test." in f.name: continue
        txt = f.read_text(encoding="utf-8")
        for m in re.finditer(r"/audio/([a-zA-Z0-9_./\-]+\.mp3)", txt):
            expected.add(f"audio/{m.group(1)}")
    for f in (ROOT / "src").rglob("*.ts"):
        if ".test." in f.name: continue
        txt = f.read_text(encoding="utf-8")
        for m in re.finditer(r"/audio/([a-zA-Z0-9_./\-]+\.mp3)", txt):
            expected.add(f"audio/{m.group(1)}")
    return expected


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--strict", action="store_true", help="有缺失时 exit 1")
    args = ap.parse_args()

    expected = build_expected()
    generated: dict[str, dict] = {}
    missing: list[str] = []
    for rel in sorted(expected):
        full = PUB / rel
        if full.exists() and full.stat().st_size > 0:
            generated[rel] = {"bytes": full.stat().st_size, "md5": md5(full)}
        else:
            missing.append(rel)

    manifest = {
        "version": 1,
        "generatedAt": __import__("datetime").datetime.utcnow().isoformat() + "Z",
        "total": len(expected),
        "present": len(generated),
        "missing": missing,
        "files": generated,
    }
    MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"manifest: {MANIFEST}", file=sys.stderr)
    print(f"总数 {manifest['total']} / 已生成 {manifest['present']} / 缺失 {len(missing)}", file=sys.stderr)
    if missing:
        print("缺失清单:", file=sys.stderr)
        for m in missing: print(f"  · {m}", file=sys.stderr)
    return 1 if missing and args.strict else 0


if __name__ == "__main__":
    sys.exit(main())
