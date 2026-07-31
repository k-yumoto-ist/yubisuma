import type { CharacterProfile, CpuObservation, RoundRecord } from "./types";
import { nativeRng, randomInt, type Rng, weightedPick } from "./random";
import { legalCallValues, legalHandValues } from "./rules";

function weightedAverage(values: number[], weights: number[]): number {
  if (values.length === 0) return 0.7;
  const total = weights.reduce((sum, value) => sum + value, 0);
  if (!total) return values.reduce((sum, value) => sum + value, 0) / values.length;
  return values.reduce((sum, value, index) => sum + value * (weights[index] ?? 0), 0) / total;
}

function recentPlayerHands(history: RoundRecord[], memory: number): number[] {
  return history
    .filter((record) => record.hands.p1 >= 0)
    .slice(-Math.max(1, Math.round(2 + memory * 10)))
    .map((record) => record.hands.p1);
}

function estimatePlayerHand(history: RoundRecord[], memory: number, rng: Rng): number {
  const values = recentPlayerHands(history, memory);
  if (values.length === 0) return rng() < 0.5 ? 0 : 1;
  const recentWeight = Math.max(0.1, memory);
  const weights = values.map((_, index) => 1 + index * recentWeight);
  const estimate = weightedAverage(values, weights);
  const nudge = rng() < memory * 0.35 ? rng() - 0.5 : 0;
  return Math.max(0, Math.min(2, Math.round(estimate + nudge)));
}

function lastAction(history: RoundRecord[], side: "p1" | "p2"): number | null {
  const record = [...history].reverse().find((entry) => entry.hands[side] >= 0);
  return record?.hands[side] ?? null;
}

function pickLegalWithNoise(target: number, legal: number[], randomness: number, rng: Rng): number {
  if (rng() < randomness) return legal[randomInt(rng, legal.length)];
  const weights = legal.map((value) => 1 / (1 + Math.abs(value - target)));
  return weightedPick(legal, weights, rng);
}

export function chooseCpuCall(character: CharacterProfile, observation: CpuObservation, rng: Rng = nativeRng): number {
  const legal = legalCallValues(observation.cpuThumbs, observation.playerThumbs);
  if (legal.length === 1) return legal[0];
  const ai = character.ai;
  const expectedPlayer = estimatePlayerHand(observation.history, ai.prediction * 0.8, rng);
  const expectedOwn = estimateOwnHand(observation.history, ai.longMemory, rng);
  const safeTarget = Math.max(0, Math.min(legal[legal.length - 1], expectedPlayer + expectedOwn));
  const lastCall = [...observation.history].reverse().find((record) => record.caller === "p1")?.call;
  const avoidRepeat = lastCall !== undefined && rng() < ai.repeatAvoidance * 0.7;
  const target = avoidRepeat && lastCall === safeTarget
    ? safeTarget + (rng() < 0.5 ? -1 : 1)
    : safeTarget;
  const bluffTarget = rng() < ai.bluff * 0.35 ? randomInt(rng, legal.length) : target;
  return pickLegalWithNoise(Math.max(0, Math.min(legal[legal.length - 1], bluffTarget)), legal, ai.randomness, rng);
}

export function chooseCpuHand(
  character: CharacterProfile,
  observation: CpuObservation,
  role: "caller" | "responder",
  rng: Rng = nativeRng
): number {
  const legal = legalHandValues(observation.cpuThumbs);
  if (legal.length === 1) return legal[0];
  const ai = character.ai;
  const expectedPlayer = estimatePlayerHand(observation.history, ai.prediction, rng);
  const call = observation.call ?? Math.round(observation.cpuThumbs / 2 + expectedPlayer);
  const ideal = role === "responder" ? call - expectedPlayer : call - expectedPlayer;
  const last = lastAction(observation.history, "p2");
  let target = Math.max(0, Math.min(legal[legal.length - 1], ideal));
  if (last !== null && rng() < ai.repeatAvoidance) {
    const alternatives = legal.filter((value) => value !== last);
    if (alternatives.length > 0 && Math.abs(last - target) < 0.5) target = alternatives[randomInt(rng, alternatives.length)];
  }
  if (rng() < ai.bluff * 0.4) target = legal[randomInt(rng, legal.length)];
  return pickLegalWithNoise(target, legal, ai.randomness, rng);
}

function estimateOwnHand(history: RoundRecord[], memory: number, rng: Rng): number {
  const values = history.slice(-Math.max(1, Math.round(2 + memory * 8))).map((record) => record.hands.p2);
  return values.length ? Math.round(weightedAverage(values, values.map((_, index) => 1 + index * memory))) : rng() < 0.5 ? 0 : 1;
}

export function cpuStrategySignature(character: CharacterProfile): string {
  const ai = character.ai;
  return [ai.randomness, ai.shortMemory, ai.longMemory, ai.prediction, ai.repeatAvoidance, ai.bluff, ai.risk].join("/");
}
