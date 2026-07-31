import type { PlayerProfile } from "./types";

export interface AchievementDefinition {
  id: string;
  label: string;
  description: string;
  test: (profile: PlayerProfile) => boolean;
}

export const achievements: AchievementDefinition[] = [
  { id: "first-win", label: "はじめの一勝", description: "最初の試合に勝つ", test: (profile) => profile.stats.wins >= 1 },
  { id: "perfect-read", label: "完璧な読み", description: "読みが当たるラウンドを5回作る", test: (profile) => profile.stats.perfectReads >= 5 },
  { id: "three-streak", label: "3連勝", description: "3連勝する", test: (profile) => profile.stats.maxStreak >= 3 },
  { id: "ten-streak", label: "10連勝", description: "10連勝する", test: (profile) => profile.stats.maxStreak >= 10 },
  { id: "zero-master", label: "0宣言の達人", description: "0を3回以上宣言する", test: (profile) => profile.stats.zeroCalls >= 3 },
  { id: "last-minute", label: "土壇場の逆転", description: "残り1本から勝利する", test: (profile) => profile.stats.comebackWins >= 1 },
  { id: "all-rivals", label: "全キャラクター撃破", description: "5体以上のCPUに勝利する", test: (profile) => profile.stats.defeatedCharacterIds.length >= 5 },
  { id: "arena-clear", label: "アリーナ制覇", description: "アリーナを最後まで勝ち抜く", test: (profile) => profile.stats.arenaClears >= 1 }
];

export function newlyUnlockedTitles(profile: PlayerProfile): string[] {
  return achievements.filter((achievement) => achievement.test(profile) && !profile.unlockedTitles.includes(achievement.label)).map((achievement) => achievement.label);
}

export function withUpdatedAchievements(profile: PlayerProfile): PlayerProfile {
  const nextTitles = newlyUnlockedTitles(profile);
  return nextTitles.length ? { ...profile, unlockedTitles: [...profile.unlockedTitles, ...nextTitles] } : profile;
}
