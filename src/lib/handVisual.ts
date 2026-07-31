export type ThumbSide = "left" | "right";

export interface ThumbPattern {
  left: boolean;
  right: boolean;
}

export type ThumbSlotState = "down" | "up" | "used" | "unavailable";

export interface ThumbSlotView {
  side: ThumbSide;
  index: 0 | 1;
  raised: boolean;
  available: boolean;
  state: ThumbSlotState;
}

const thumbSides: ThumbSide[] = ["left", "right"];

function clampThumbs(value: number): number {
  return Math.max(0, Math.min(2, Math.floor(value)));
}

export function patternForCount(value: number): ThumbPattern {
  const count = clampThumbs(value);
  return { left: count >= 1, right: count >= 2 };
}

export function countRaisedThumbs(pattern: ThumbPattern): number {
  return Number(pattern.left) + Number(pattern.right);
}

export function toggleThumbPattern(pattern: ThumbPattern, side: ThumbSide, remainingThumbs: number): ThumbPattern {
  const next = { ...pattern, [side]: !pattern[side] };
  return countRaisedThumbs(next) <= clampThumbs(remainingThumbs) ? next : pattern;
}

export function patternLabel(pattern: ThumbPattern): string {
  if (pattern.left && pattern.right) return "両方";
  if (pattern.left) return "左";
  if (pattern.right) return "右";
  return "0本";
}

export function getThumbSlotViews(
  pattern: ThumbPattern,
  remainingThumbs: number,
  lostThumbs = 0,
  lostThumbIndex?: 0 | 1
): ThumbSlotView[] {
  const remaining = clampThumbs(remainingThumbs);
  const lost = Math.max(0, Math.min(2 - remaining, Math.floor(lostThumbs)));
  const ownedBeforeLoss = Math.min(2, remaining + lost);
  const resolvedLostIndex = lostThumbIndex ?? (pattern.right ? 1 : 0);

  return thumbSides.map((side, index) => {
    const slotIndex = index as 0 | 1;
    const isLost = lost === 2 || (lost === 1 && slotIndex === resolvedLostIndex);
    const isOwnedBeforeLoss = slotIndex < ownedBeforeLoss;
    const available = isOwnedBeforeLoss && !isLost;
    const raised = pattern[side];
    const state: ThumbSlotState = isLost ? "used" : !isOwnedBeforeLoss ? "unavailable" : raised ? "up" : "down";
    return { side, index: slotIndex, raised, available, state };
  });
}
