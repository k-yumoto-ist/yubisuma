import { describe, expect, it } from "vitest";
import { createDefaultProfile, loadProfile, recordCompletedMatch, saveProfile, type StorageLike } from "./storage";

class MemoryStorage implements StorageLike {
  private values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
}

describe("profile storage", () => {
  it("creates a safe initial profile", () => {
    const profile = loadProfile(new MemoryStorage());
    expect(profile.version).toBe(2);
    expect(profile.stats.totalMatches).toBe(0);
  });

  it("recovers from corrupt JSON", () => {
    const storage = new MemoryStorage();
    storage.setItem("yubisuma-arena-profile", "{broken");
    expect(loadProfile(storage).stats.wins).toBe(0);
  });

  it("migrates old counters and keeps settings", () => {
    const storage = new MemoryStorage();
    storage.setItem("yubisuma-arena-profile", JSON.stringify({ version: 1, stats: { wins: 3, losses: 2 }, settings: { sfx: false } }));
    const profile = loadProfile(storage);
    expect(profile.version).toBe(2);
    expect(profile.stats.totalMatches).toBe(5);
    expect(profile.settings.sfx).toBe(false);
  });

  it("updates records, streaks, titles, and persists", () => {
    const storage = new MemoryStorage();
    const base = createDefaultProfile();
    const next = recordCompletedMatch(base, { id: "match-1", mode: "quick", opponentId: "nagi", opponentName: "ナギ", won: true, rounds: 3, correctCalls: 2, zeroCalls: 1, perfectRead: true, comeback: false });
    saveProfile(next, storage);
    const loaded = loadProfile(storage);
    expect(loaded.stats.wins).toBe(1);
    expect(loaded.stats.currentStreak).toBe(1);
    expect(loaded.recentMatches).toHaveLength(1);
    expect(loaded.unlockedTitles).toContain("はじめの一勝");
  });

  it("records the first arena floor as a best result", () => {
    const next = recordCompletedMatch(createDefaultProfile(), { id: "arena-1", mode: "arena", opponentId: "nagi", opponentName: "ナギ", won: true, rounds: 2, correctCalls: 1, zeroCalls: 0, perfectRead: false, comeback: false, arenaIndex: 0 });
    expect(next.stats.arenaBest).toBe(1);
  });
});
