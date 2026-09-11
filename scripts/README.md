# Asset Generation（spec.md §5.4 素材管线 · 音频部分）

> 语音素材通过 `TTS skill/` 包成 `scripts/gen_audio.py`,运行时零外部依赖。
> 流程：**内容 JSON → 批量 TTS → `public/audio/`**(幂等、断点重跑)。

## 目录约定（与 `src/lib/audio/play.ts` 的 `audioPath` 一一对齐）

| 类型 | 路径模式 | 数量（M1）| 来源 |
|---|---|---|---|
| 单词音 | `public/audio/words/{wordId}.mp3` | 55 | `words.json` |
| 单词例句 | `public/audio/sentences/{wordId}-ex.mp3` | 55 | `word.sentence` |
| 句型朗读 | `public/audio/sentences/{sentenceId}.mp3` | 18 | `units[].sentences[].text` |
| 故事页 | `public/audio/stories/{storyId}/p{n}.mp3` | 32 | `stories[].pages[].text` |
| Foxy UI | `public/audio/ui/foxy-*.mp3` | 14 | `Foxy.tsx` LINES |

总计 **174 个 mp3,约 2.3 MB**。

## 音色（spec.md §5.4 音色/语速常量化）

集中在 `scripts/voices.config.py`,**换声只改这一处**：

```python
WORD_VOICE_EN      = "en-US-JennyNeural"      # 童声质感英文女声
UI_VOICE_EN        = "en-US-JennyNeural"
UI_VOICE_ZH        = "zh-CN-XiaoyiNeural"     # 晓伊（活泼）
RATE_WORD          = 0.8                      # 词
RATE_SENTENCE      = 0.95                     # 句 + 故事
RATE_UI_EN         = 0.9
RATE_UI_ZH         = 0.95
DEFAULT_CONCURRENCY = 3
```

## 用法

```bash
# 全量（M1 默认）
python3 scripts/gen_audio.py

# 全量重跑（删旧）
python3 scripts/gen_audio.py --force

# 只跑指定类型
python3 scripts/gen_audio.py --only words
python3 scripts/gen_audio.py --only sentences,stories
python3 scripts/gen_audio.py --only ui

# Dry-run 只列清单
python3 scripts/gen_audio.py --dry-run

# 资产清单 + 缺失校验
python3 scripts/gen_manifest.py            # 仅写 manifest
python3 scripts/gen_manifest.py --strict   # 有缺失时 exit 1（CI 用）

# npm script 入口
npm run assets:audio
npm run assets:audio:force
npm run assets:audio:dry
npm run assets:manifest
npm run assets:manifest:strict
```

## 幂等性

- 已存在且 **非零字节** 自动跳过（断点重跑友好）
- `--force` 全量重跑
- 输出文件 atomic rename 到目标位置（中途崩溃不会污染）

## 失败处理

- TTS skill 自动重试 4 次（指数退避）
- 并发 3 默认（429 时可降到 2：`--concurrency 2`）
- 失败不中断批次，每条结果落到 `scripts/.gen_audio_report.json`

## 运行时侧：`failed` 缓存修复

`src/lib/audio/play.ts` 用**双层失败缓存**避免首次网络抖动被永久标记：

- **内存** `attemptCount: Map<path, count>`：连续失败次数
- **localStorage** `wai-en-audio-failed-v1`：跨会话持久化
- **阈值 3**：同一路径失败 3 次才标记为 `failedSet`
- **自愈**：成功 `canplay` 自动清计数 + 从 `failedSet` 移除
- **手动重置**：导出 `resetFailedAudio()`，家长页"听不到声音"时可调
