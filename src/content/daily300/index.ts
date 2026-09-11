import daily300Json from "./daily300.json";

export interface DailySentence {
  id: string; // "g01-01"
  text: string;
  zh: string;
}

export interface DailyTheme {
  id: string; // "g01"
  title: string;
  titleZh: string;
  emoji: string;
  sentences: DailySentence[];
}

export const dailyThemes = (daily300Json as { themes: DailyTheme[] }).themes;

export const dailyThemeById = (id: string) => dailyThemes.find((t) => t.id === id);

export const dailyTotal = dailyThemes.reduce((n, t) => n + t.sentences.length, 0);

export const dailyAudioPath = (id: string) => `/audio/daily/${id}.mp3`;
