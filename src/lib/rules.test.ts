import { describe, expect, it } from "vitest";
import { isLegalCall, isLegalHand, legalCallValues, legalHandValues, resolveRound } from "./rules";

describe("指スマ rules", () => {
  it("returns only achievable calls", () => {
    expect(legalCallValues(1, 1)).toEqual([0, 1, 2]);
    expect(isLegalCall(3, 1, 1)).toBe(false);
    expect(isLegalCall(2, 1, 1)).toBe(true);
  });

  it("restricts a one-thumb player to zero or one", () => {
    expect(legalHandValues(1)).toEqual([0, 1]);
    expect(isLegalHand(2, 1)).toBe(false);
    expect(isLegalHand(1, 1)).toBe(true);
  });

  it("reduces only the successful caller and keeps their turn", () => {
    const result = resolveRound({ caller: "p1", callerThumbs: 2, responderThumbs: 2, call: 2, callerHand: 1, responderHand: 1 });
    expect(result.success).toBe(true);
    expect(result.callerAfter).toBe(1);
    expect(result.responderAfter).toBe(2);
    expect(result.nextTurn).toBe("p1");
  });

  it("ends the match when the caller loses their final thumb", () => {
    const result = resolveRound({ caller: "p2", callerThumbs: 1, responderThumbs: 2, call: 0, callerHand: 0, responderHand: 0 });
    expect(result.winner).toBe("p2");
    expect(result.callerAfter).toBe(0);
    expect(result.nextTurn).toBeNull();
  });

  it("does not reduce thumbs on a miss and changes turn", () => {
    const result = resolveRound({ caller: "p1", callerThumbs: 1, responderThumbs: 1, call: 2, callerHand: 0, responderHand: 1 });
    expect(result.success).toBe(false);
    expect(result.callerAfter).toBe(1);
    expect(result.nextTurn).toBe("p2");
  });

  it("never produces a negative thumb count", () => {
    const result = resolveRound({ caller: "p1", callerThumbs: 0, responderThumbs: 2, call: 0, callerHand: 0, responderHand: 0 });
    expect(result.callerAfter).toBe(0);
  });
});
