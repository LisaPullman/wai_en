"""
音色与语速常量化（spec.md §5.4 音色/语速常量化，换音色全量重跑）。

选用理由：
- en-US-JennyNeural：英文女声，童声质感，最热门
- zh-CN-XiaoyiNeural（晓伊）：活泼、贴近童声；UI 配音用
- 词 0.8 / 句 0.95 / 故事 0.95 / UI 0.9 —— 对应 spec.md §5.1
"""
from __future__ import annotations

# 单词音（英文 / 中文）
WORD_VOICE_EN = "en-US-JennyNeural"
WORD_VOICE_ZH = "zh-CN-XiaoyiNeural"

# 例句音
EXAMPLE_VOICE_EN = "en-US-JennyNeural"

# 句型朗读
SENTENCE_VOICE_EN = "en-US-JennyNeural"

# 故事页（整页朗读）
STORY_VOICE_EN = "en-US-JennyNeural"

# Foxy UI 配音
UI_VOICE_EN = "en-US-JennyNeural"
UI_VOICE_ZH = "zh-CN-XiaoyiNeural"

# 语速（spec.md §5.1：词 0.8 / 句和故事 0.95）
RATE_WORD = 0.8
RATE_SENTENCE = 0.95
RATE_STORY = 0.95
RATE_UI_EN = 0.9
RATE_UI_ZH = 0.95

# 并发（TTS skill 默认 3；服务端 429 时可降到 2）
DEFAULT_CONCURRENCY = 3
