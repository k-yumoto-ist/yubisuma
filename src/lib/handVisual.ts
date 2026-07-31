export type ThumbSide = "left" | "right";

export interface ThumbPattern {
  left: boolean;
  right: boolean;
}

export interface ThumbPairState {
  availableThumbs: ThumbPattern;
  selectedThumbs: ThumbPattern;
  revealedThumbs: ThumbPattern | null;
  usedThumbs: ThumbPattern;
}

export type ThumbSlotState = "down" | "up" | "used" | "unavailable";

export interface ThumbSlotView {
  side: ThumbSide;
  index: 0 | 1;
  available: boolean;
  selected: boolean;
  revealed: boolean;
  state: ThumbSlotState;
}

const thumbSides: ThumbSide[] = ["left", "right"];

function clampThumbs(value: number): number {
  return Math.max(0, Math.min(2, Math.floor(value)));
}

export const emptyThumbPattern = (): ThumbPattern => ({ left: false, right: false });
export const fullThumbPattern = (): ThumbPattern => ({ left: true, right: true });

export function createThumbPairState(): ThumbPairState {
  return {
    availableThumbs: fullThumbPattern(),
    selectedThumbs: emptyThumbPattern(),
    revealedThumbs: null,
    usedThumbs: emptyThumbPattern()
  };
}

export function patternForCount(value: number): ThumbPattern {
  const count = clampThumbs(value);
  return { left: count >= 1, right: count >= 2 };
}

export function patternForCountWithAvailability(value: number, availableThumbs: ThumbPattern): ThumbPattern {
  const count = Math.max(0, Math.min(countRaisedThumbs(availableThumbs), Math.floor(value)));
  if (count === 0) return emptyThumbPattern();
  if (count === 1) return availableThumbs.left ? { left: true, right: false } : { left: false, right: true };
  return { ...availableThumbs };
}

export function countRaisedThumbs(pattern: ThumbPattern): number {
  return Number(pattern.left) + Number(pattern.right);
}

export function toggleThumbPattern(pattern: ThumbPattern, side: ThumbSide, availableThumbs: ThumbPattern): ThumbPattern {
  const next = { ...pattern, [side]: !pattern[side] };
  return countRaisedThumbs(next) <= countRaisedThumbs(availableThumbs) &&
    (!next.left || availableThumbs.left) && (!next.right || availableThumbs.right) ? next : pattern;
}

export function patternLabel(pattern: ThumbPattern): string {
  if (pattern.left && pattern.right) return "両方";
  if (pattern.left) return "左";
  if (pattern.right) return "右";
  return "0本";
}

export function getThumbSlotViews(pair: Pick<ThumbPairState, "availableThumbs" | "selectedThumbs" | "revealedThumbs" | "usedThumbs">, masked = false): ThumbSlotView[] {
  const visible = pair.revealedThumbs ?? pair.selectedThumbs;
  return thumbSides.map((side, index) => {
    const available = pair.availableThumbs[side];
    const selected = masked ? false : visible[side];
    const used = pair.usedThumbs[side];
    return {
      side,
      index: index as 0 | 1,
      available,
      selected,
      revealed: !masked && pair.revealedThumbs !== null && pair.revealedThumbs[side],
      state: used ? "used" : !available ? "unavailable" : selected ? "up" : "down"
    };
  });
}

export function removeThumb(availableThumbs: ThumbPattern, selectedThumbs: ThumbPattern): { availableThumbs: ThumbPattern; usedThumbs: ThumbPattern } {
  const side: ThumbSide = selectedThumbs.right && availableThumbs.right ? "right" : "left";
  if (!availableThumbs.left && !availableThumbs.right) return { availableThumbs, usedThumbs: { left: true, right: true } };
  if (!availableThumbs[side]) return { availableThumbs, usedThumbs: { left: !availableThumbs.left, right: !availableThumbs.right } };
  return {
    availableThumbs: { ...availableThumbs, [side]: false },
    usedThumbs: { left: !availableThumbs.left || side === "left", right: !availableThumbs.right || side === "right" }
  };
}
