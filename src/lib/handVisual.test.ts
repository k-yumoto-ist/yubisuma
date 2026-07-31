import { describe, expect, it } from "vitest";
import { countRaisedThumbs, getThumbSlotViews, patternForCount, patternLabel, toggleThumbPattern } from "./handVisual";

describe("hand visual state", () => {
  it("maps 0, 1, and 2 to explicit left/right patterns", () => {
    expect(patternForCount(0)).toEqual({ left: false, right: false });
    expect(patternForCount(1)).toEqual({ left: true, right: false });
    expect(patternForCount(2)).toEqual({ left: true, right: true });
  });

  it("supports a right-only selection without changing the game count rules", () => {
    const rightOnly = toggleThumbPattern(patternForCount(0), "right", 2);
    expect(rightOnly).toEqual({ left: false, right: true });
    expect(countRaisedThumbs(rightOnly)).toBe(1);
    expect(patternLabel(rightOnly)).toBe("右");
  });

  it("marks unavailable and used thumbs separately", () => {
    const oneThumbLeft = getThumbSlotViews(patternForCount(0), 1);
    expect(oneThumbLeft.map((slot) => slot.state)).toEqual(["down", "unavailable"]);

    const oneThumbAfterLoss = getThumbSlotViews(patternForCount(1), 1, 1, 0);
    expect(oneThumbAfterLoss.map((slot) => slot.state)).toEqual(["used", "down"]);

    const bothLost = getThumbSlotViews(patternForCount(2), 0, 2);
    expect(bothLost.map((slot) => slot.state)).toEqual(["used", "used"]);
  });
});
