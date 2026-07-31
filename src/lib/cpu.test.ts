import { describe, expect, it } from "vitest";
import { characters } from "./characters";
import { chooseCpuCall, chooseCpuHand, cpuStrategySignature } from "./cpu";
import { createSeededRng } from "./random";
import { legalCallValues, legalHandValues } from "./rules";
import type { CpuObservation } from "./types";

const observation: CpuObservation = {
  playerThumbs: 1,
  cpuThumbs: 2,
  call: 1,
  turnNumber: 7,
  history: [
    { round: 1, caller: "p1", call: 1, hands: { p1: 1, p2: 0 }, total: 1, success: true, thumbLostBy: "p1" },
    { round: 2, caller: "p2", call: 1, hands: { p1: 0, p2: 1 }, total: 1, success: true, thumbLostBy: "p2" }
  ]
};

describe("CPU thinking", () => {
  it("always chooses legal calls and hands", () => {
    for (const character of characters) {
      const call = chooseCpuCall(character, { ...observation, call: null }, createSeededRng(42));
      const hand = chooseCpuHand(character, observation, "responder", createSeededRng(42));
      expect(legalCallValues(observation.cpuThumbs, observation.playerThumbs)).toContain(call);
      expect(legalHandValues(observation.cpuThumbs)).toContain(hand);
    }
  });

  it("is reproducible with an injected seed", () => {
    const a = characters.map((character) => [chooseCpuCall(character, observation, createSeededRng(11)), chooseCpuHand(character, observation, "caller", createSeededRng(11))]);
    const b = characters.map((character) => [chooseCpuCall(character, observation, createSeededRng(11)), chooseCpuHand(character, observation, "caller", createSeededRng(11))]);
    expect(a).toEqual(b);
  });

  it("has intentionally different strategy profiles", () => {
    expect(new Set(characters.map(cpuStrategySignature)).size).toBe(characters.length);
  });

  it("does not require a current hidden player choice", () => {
    const first = chooseCpuHand(characters[0], observation, "responder", createSeededRng(9));
    const second = chooseCpuHand(characters[0], observation, "responder", createSeededRng(9));
    expect(first).toBe(second);
  });
});
