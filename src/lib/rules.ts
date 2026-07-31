import type { PlayerId } from "./types";

export function legalHandValues(thumbs: number): number[] {
  const max = Math.max(0, Math.min(2, Math.floor(thumbs)));
  return Array.from({ length: max + 1 }, (_, index) => index);
}

export function legalCallValues(callerThumbs: number, responderThumbs: number): number[] {
  const maximum = Math.max(0, Math.min(4, Math.floor(callerThumbs) + Math.floor(responderThumbs)));
  return Array.from({ length: maximum + 1 }, (_, index) => index);
}

export function isLegalHand(value: number, thumbs: number): boolean {
  return Number.isInteger(value) && legalHandValues(thumbs).includes(value);
}

export function isLegalCall(value: number, callerThumbs: number, responderThumbs: number): boolean {
  return Number.isInteger(value) && legalCallValues(callerThumbs, responderThumbs).includes(value);
}

export interface RoundInput {
  caller: PlayerId;
  callerThumbs: number;
  responderThumbs: number;
  call: number;
  callerHand: number;
  responderHand: number;
}

export function resolveRound(input: RoundInput) {
  const {
    caller,
    callerThumbs,
    responderThumbs,
    call,
    callerHand,
    responderHand
  } = input;
  if (!isLegalHand(callerHand, callerThumbs)) throw new Error("Caller hand is not legal");
  if (!isLegalHand(responderHand, responderThumbs)) throw new Error("Responder hand is not legal");
  if (!isLegalCall(call, callerThumbs, responderThumbs)) throw new Error("Call is not legal");

  const total = callerHand + responderHand;
  const success = total === call;
  const thumbLostBy = success ? caller : null;
  const callerAfter = success ? Math.max(0, callerThumbs - 1) : callerThumbs;
  const winner = callerAfter === 0 ? caller : null;
  const nextTurn = winner ? null : success ? caller : caller === "p1" ? "p2" : "p1";

  return {
    caller,
    call,
    total,
    success,
    thumbLostBy,
    winner,
    nextTurn,
    callerAfter,
    responderAfter: responderThumbs
  };
}
