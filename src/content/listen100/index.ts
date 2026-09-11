import part1 from "./part1.json";
import part2 from "./part2.json";

export interface ListenStory {
  id: string; // "c01-01"
  title: string;
  titleZh: string;
  emoji: string;
  level: 1 | 2 | 3;
  zh: string; // 故事大意（家长参考）
  sentences: string[];
}

export interface ListenCollection {
  id: string; // "c01"
  title: string;
  titleZh: string;
  emoji: string;
  level: 1 | 2 | 3;
  stories: ListenStory[];
}

export const listenCollections: ListenCollection[] = [
  ...(part1 as { collections: ListenCollection[] }).collections,
  ...(part2 as { collections: ListenCollection[] }).collections,
];

export const listenCollectionById = (id: string) =>
  listenCollections.find((c) => c.id === id);

export const listenStoryCount = listenCollections.reduce(
  (n, c) => n + c.stories.length,
  0,
);

export const listenAudioPath = (id: string) => `/audio/listen/${id}.mp3`;

/** 预估时长（秒）：按词数 ~0.45s/词，朗读前留 1s */
export const listenDurationEst = (s: ListenStory) =>
  Math.round(s.sentences.join(" ").split(/\s+/).length * 0.45) + 1;

export const levelBadge = (level: 1 | 2 | 3) =>
  ({ 1: "入门", 2: "简单", 3: "进阶" })[level];
