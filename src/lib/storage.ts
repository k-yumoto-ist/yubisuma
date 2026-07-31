import { withUpdatedAchievements } from "./achievements";
import type { CharacterId, GameSettings, MatchHistoryItem, MatchMode, PlayerProfile } from "./types";

export const PROFILE_KEY = "yubisuma-arena-profile";

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export const defaultSettings: GameSettings = {
  bgm: false,
  sfx: true,
  volume: 0.65,
  vibration: true,
  speed: "normal"
};

export function createDefaultProfile(): PlayerProfile {
  return {
    version: 2,
    tutorialComplete: false,
    settings: { ...defaultSettings },
    stats: {
      totalMatches: 0,
      wins: 0,
      losses: 0,
      currentStreak: 0,
      maxStreak: 0,
      arenaBest: 0,
      correctCalls: 0,
      zeroCalls: 0,
      perfectReads: 0,
      comebackWins: 0,
      arenaClears: 0,
      defeatedCharacterIds: []
    },
    unlockedTitles: [],
    recentMatches: []
  };
}

function browserStorage(): StorageLike | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

function asNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function migrate(raw: unknown): PlayerProfile {
  const fallback = createDefaultProfile();
  if (!raw || typeof raw !== "object") return fallback;
  const source = raw as Record<string, unknown>;
  const sourceStats = source.stats && typeof source.stats === "object" ? source.stats as Record<string, unknown> : {};
  const sourceSettings = source.settings && typeof source.settings === "object" ? source.settings as Record<string, unknown> : {};
  const settings: GameSettings = {
    bgm: typeof sourceSettings.bgm === "boolean" ? sourceSettings.bgm : fallback.settings.bgm,
    sfx: typeof sourceSettings.sfx === "boolean" ? sourceSettings.sfx : fallback.settings.sfx,
    volume: Math.max(0, Math.min(1, asNumber(sourceSettings.volume, fallback.settings.volume))),
    vibration: typeof sourceSettings.vibration === "boolean" ? sourceSettings.vibration : fallback.settings.vibration,
    speed: sourceSettings.speed === "relaxed" || sourceSettings.speed === "turbo" || sourceSettings.speed === "normal" ? sourceSettings.speed : fallback.settings.speed
  };
  const wins = asNumber(sourceStats.wins ?? sourceStats.winCount, 0);
  const losses = asNumber(sourceStats.losses ?? sourceStats.lossCount, 0);
  const defeated = Array.isArray(sourceStats.defeatedCharacterIds)
    ? sourceStats.defeatedCharacterIds.filter((id): id is CharacterId => typeof id === "string")
    : [];
  const profile: PlayerProfile = {
    version: 2,
    tutorialComplete: Boolean(source.tutorialComplete),
    settings,
    stats: {
      totalMatches: asNumber(sourceStats.totalMatches, wins + losses),
      wins,
      losses,
      currentStreak: asNumber(sourceStats.currentStreak, 0),
      maxStreak: asNumber(sourceStats.maxStreak, 0),
      arenaBest: asNumber(sourceStats.arenaBest, 0),
      correctCalls: asNumber(sourceStats.correctCalls, 0),
      zeroCalls: asNumber(sourceStats.zeroCalls, 0),
      perfectReads: asNumber(sourceStats.perfectReads, 0),
      comebackWins: asNumber(sourceStats.comebackWins, 0),
      arenaClears: asNumber(sourceStats.arenaClears, 0),
      defeatedCharacterIds: [...new Set(defeated)]
    },
    unlockedTitles: Array.isArray(source.unlockedTitles) ? source.unlockedTitles.filter((title): title is string => typeof title === "string") : [],
    recentMatches: Array.isArray(source.recentMatches) ? source.recentMatches.filter((item): item is MatchHistoryItem => Boolean(item && typeof item === "object")) : []
  };
  return withUpdatedAchievements(profile);
}

export function loadProfile(storage: StorageLike | undefined = browserStorage()): PlayerProfile {
  if (!storage) return createDefaultProfile();
  try {
    const raw = storage.getItem(PROFILE_KEY);
    if (!raw) return createDefaultProfile();
    return migrate(JSON.parse(raw));
  } catch {
    return createDefaultProfile();
  }
}

export function saveProfile(profile: PlayerProfile, storage: StorageLike | undefined = browserStorage()): void {
  if (!storage) return;
  try {
    storage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    // Storage can be disabled or full. The game remains playable without it.
  }
}

export interface CompletedMatchSummary {
  id: string;
  mode: MatchMode;
  opponentId?: CharacterId;
  opponentName: string;
  won: boolean;
  rounds: number;
  correctCalls: number;
  zeroCalls: number;
  perfectRead: boolean;
  comeback: boolean;
  arenaIndex?: number;
  arenaCleared?: boolean;
}

export function recordCompletedMatch(profile: PlayerProfile, summary: CompletedMatchSummary): PlayerProfile {
  const stats = profile.stats;
  const won = summary.won;
  const nextStreak = won ? stats.currentStreak + 1 : 0;
  const defeated = won && summary.opponentId && !stats.defeatedCharacterIds.includes(summary.opponentId)
    ? [...stats.defeatedCharacterIds, summary.opponentId]
    : stats.defeatedCharacterIds;
  const historyItem: MatchHistoryItem = {
    id: summary.id,
    playedAt: new Date().toISOString(),
    mode: summary.mode,
    opponentId: summary.opponentId,
    opponentName: summary.opponentName,
    won,
    rounds: summary.rounds
  };
  const next: PlayerProfile = {
    ...profile,
    stats: {
      ...stats,
      totalMatches: stats.totalMatches + 1,
      wins: stats.wins + (won ? 1 : 0),
      losses: stats.losses + (won ? 0 : 1),
      currentStreak: nextStreak,
      maxStreak: Math.max(stats.maxStreak, nextStreak),
      arenaBest: summary.mode === "arena" && summary.arenaIndex !== undefined ? Math.max(stats.arenaBest, summary.arenaIndex + (won ? 1 : 0)) : stats.arenaBest,
      correctCalls: stats.correctCalls + summary.correctCalls,
      zeroCalls: stats.zeroCalls + summary.zeroCalls,
      perfectReads: stats.perfectReads + (summary.perfectRead ? 1 : 0),
      comebackWins: stats.comebackWins + (summary.comeback ? 1 : 0),
      arenaClears: stats.arenaClears + (summary.arenaCleared ? 1 : 0),
      defeatedCharacterIds: defeated
    },
    tutorialComplete: summary.mode === "tutorial" ? true : profile.tutorialComplete,
    recentMatches: [historyItem, ...profile.recentMatches].slice(0, 10)
  };
  return withUpdatedAchievements(next);
}
