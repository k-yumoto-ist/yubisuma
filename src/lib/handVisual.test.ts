import { describe, expect, it } from "vitest";
import { countRaisedThumbs, createThumbPairState, getThumbSlotViews, patternForCount, patternForCountWithAvailability, patternLabel, removeThumb, toggleThumbPattern } from "./handVisual";
import { getHandAssetPath } from "./handAssets";

describe("hand visual state", () => {
  it("maps 0, 1, and 2 to explicit left/right patterns", () => {
    expect(patternForCount(0)).toEqual({ left: false, right: false });
    expect(patternForCount(1)).toEqual({ left: true, right: false });
    expect(patternForCount(2)).toEqual({ left: true, right: true });
  });

  it("supports a right-only selection without changing the game count rules", () => {
    const rightOnly = toggleThumbPattern(patternForCount(0), "right", { left: true, right: true });
    expect(rightOnly).toEqual({ left: false, right: true });
    expect(countRaisedThumbs(rightOnly)).toBe(1);
    expect(patternLabel(rightOnly)).toBe("右");
  });

  it("keeps available, selected, and revealed thumbs as separate state", () => {
    const pair = createThumbPairState();
    pair.selectedThumbs = { left: true, right: false };
    expect(getThumbSlotViews(pair).map((slot) => slot.state)).toEqual(["up", "down"]);
    expect(getThumbSlotViews({ ...pair, revealedThumbs: { left: false, right: true } }).map((slot) => slot.state)).toEqual(["down", "up"]);
  });

  it("removes one explicit side without making both sides selectable", () => {
    const loss = removeThumb({ left: true, right: true }, { left: false, right: true });
    expect(loss.availableThumbs).toEqual({ left: true, right: false });
    expect(getThumbSlotViews({ ...createThumbPairState(), ...loss }).map((slot) => slot.state)).toEqual(["down", "used"]);
    expect(toggleThumbPattern({ left: false, right: false }, "right", loss.availableThumbs)).toEqual({ left: false, right: false });
  });

  it("maps every legal choice for two available thumbs", () => {
    const available = { left: true, right: true };
    expect(patternForCountWithAvailability(0, available)).toEqual({ left: false, right: false });
    expect(patternForCountWithAvailability(1, available)).toEqual({ left: true, right: false });
    expect(toggleThumbPattern({ left: false, right: false }, "right", available)).toEqual({ left: false, right: true });
    expect(patternForCountWithAvailability(2, available)).toEqual({ left: true, right: true });
  });

  it("only allows the surviving side when one thumb remains", () => {
    const available = { left: true, right: false };
    expect(patternForCountWithAvailability(0, available)).toEqual({ left: false, right: false });
    expect(patternForCountWithAvailability(1, available)).toEqual({ left: true, right: false });
    expect(patternForCountWithAvailability(2, available)).toEqual({ left: true, right: false });
    expect(patternLabel({ left: true, right: false })).not.toBe("両方");
    expect(toggleThumbPattern({ left: false, right: false }, "right", available)).toEqual({ left: false, right: false });
  });

  it("uses the same completed basis image for both visual sides", () => {
    expect(getHandAssetPath("left", "fist")).toBe(getHandAssetPath("right", "fist"));
    expect(getHandAssetPath("left", "thumb-up")).toBe(getHandAssetPath("right", "thumb-up"));
    expect(getHandAssetPath("left", "fist")).toContain("fist-right.png");
    expect(getHandAssetPath("right", "thumb-up")).toContain("thumb-up-right.png");
  });
});
