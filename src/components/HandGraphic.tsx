import type { PlayerId } from "@/lib/types";
import {
  countRaisedThumbs,
  getThumbSlotViews,
  patternForCount,
  patternLabel,
  toggleThumbPattern,
  type ThumbPattern,
  type ThumbSlotView,
  type ThumbSide
} from "@/lib/handVisual";

export type HandState = "idle" | "selected" | "revealing" | "success" | "miss" | "lost";

interface HandGraphicProps {
  thumbs: number;
  remainingThumbs?: number;
  lostThumbs?: number;
  masked?: boolean;
  side: PlayerId;
  state?: HandState;
  label?: string;
  compact?: boolean;
  interactive?: boolean;
  thumbPattern?: ThumbPattern;
  onThumbToggle?: (thumbs: number, pattern: ThumbPattern) => void;
}

const thumbUpPath = "M43 116C29 113 18 104 13 90 8 76 13 64 24 60c8-3 16 1 20 9l7 14 3-45c1-10 8-16 17-15 9 1 14 9 13 19l-4 48c-2 18-11 27-30 26Z";
const thumbDownPath = "M43 116c-16 2-29-3-36-14-6-10-3-21 7-27 8-5 17-2 23 5l16 18c6 7 3 15-10 18Z";

function HandUnit({ mirror, slot, state }: { mirror: boolean; slot: ThumbSlotView; state: HandState }) {
  const raised = slot.raised && slot.state !== "unavailable";
  return (
    <svg className={`hand-unit ${mirror ? "hand-unit--mirror" : ""} hand-unit--${slot.state} ${raised ? "is-raised" : ""}`} viewBox="0 0 140 180" role="img" aria-hidden="true">
      <path className="hand-unit__shadow" d="M21 160c9-17 24-28 45-31 25-4 47 9 56 31H21Z" />
      <path className="hand-unit__palm" d="M41 151c-5-15-7-31-5-45l2-31c1-7 7-11 13-9 5 2 7 6 7 11l-1 17 4-54c1-7 7-11 13-9 5 2 7 6 7 11l-1 51 4-43c1-7 7-10 13-8 5 2 7 6 7 11l-3 46 4-30c1-6 7-9 12-7 5 2 7 6 6 12l-5 52c-2 22-14 36-35 42l-26-1c-7-5-11-11-12-17Z" />
      <path className="hand-unit__line" d="M58 103c11 8 23 10 35 5M56 124c15 9 29 10 42 3M47 143c15 7 29 8 42 3" />
      <g className="hand-unit__thumb-group">
        <path className={`hand-unit__thumb hand-unit__thumb--${raised ? "up" : "down"} hand-unit__thumb--${slot.state} hand-unit__thumb--${state}`} d={raised ? thumbUpPath : thumbDownPath} />
        {slot.state === "used" && (
          <>
            <path className="hand-unit__bandage" d="M25 79 48 92l-8 15-23-13Z" />
            <path className="hand-unit__bandage-line" d="m24 82 19 11m-22-3 19 11" />
          </>
        )}
        {slot.state === "unavailable" && <path className="hand-unit__unavailable-mark" d="m22 82 23 20m0-20-23 20" />}
      </g>
      <path className="hand-unit__highlight" d="M75 31c0-3 2-5 5-5 3 0 5 2 5 5l-3 49c0 3-2 5-5 5-3 0-5-2-5-5l3-49Z" />
    </svg>
  );
}

function ThumbSlot({
  side,
  slot,
  state,
  interactive,
  playerLabel,
  onToggle
}: {
  side: PlayerId;
  slot: ThumbSlotView;
  state: HandState;
  interactive: boolean;
  playerLabel: string;
  onToggle: (thumbSide: ThumbSide) => void;
}) {
  const sideLabel = slot.side === "left" ? "左" : "右";
  const actionLabel = slot.raised ? "下げる" : "上げる";
  const unit = <HandUnit mirror={side === "p2" ? slot.side === "left" : slot.side === "right"} slot={slot} state={state} />;
  return (
    <div className={`hand-slot hand-slot--${slot.side} hand-slot--${slot.state} ${slot.raised ? "is-raised" : ""}`}>
      {interactive ? (
        <button type="button" className="hand-hit-area" disabled={!slot.available} onClick={() => onToggle(slot.side)} aria-label={`${playerLabel}の${sideLabel}親指を${actionLabel}`}>
          {unit}
        </button>
      ) : (
        <span className="hand-hit-area" aria-hidden="true">{unit}</span>
      )}
      <span className="hand-slot__label" aria-hidden="true">{sideLabel}</span>
    </div>
  );
}

export function HandGraphic({ thumbs, remainingThumbs = 2, lostThumbs = 0, masked = false, side, state = "idle", label, compact = false, interactive = false, thumbPattern, onThumbToggle }: HandGraphicProps) {
  const safeThumbs = Math.max(0, Math.min(2, Math.floor(thumbs)));
  const safeRemaining = Math.max(0, Math.min(2, Math.floor(remainingThumbs)));
  const pattern = thumbPattern ?? patternForCount(safeThumbs);
  const displayPattern = masked ? patternForCount(0) : pattern;
  const slots = getThumbSlotViews(displayPattern, safeRemaining, lostThumbs);
  const visibleCount = masked ? 0 : countRaisedThumbs(pattern);
  const accessibleLabel = `${label ?? `${side === "p1" ? "プレイヤー" : "対戦相手"}の手`}。残り${safeRemaining}本。${masked ? "今回の手は未公開。" : `今回出すのは${patternLabel(pattern)}。`}`;
  const playerLabel = side === "p1" ? "あなた" : "相手";
  const toggleThumb = (thumbSide: ThumbSide) => {
    if (!onThumbToggle) return;
    const next = toggleThumbPattern(pattern, thumbSide, safeRemaining);
    if (next.left === pattern.left && next.right === pattern.right) return;
    onThumbToggle(countRaisedThumbs(next), next);
  };

  return (
    <div className={`hand-graphic hand-graphic--${side} hand-graphic--${state} ${interactive ? "hand-graphic--interactive" : ""} ${compact ? "hand-graphic--compact" : ""}`} role={interactive ? "group" : "img"} aria-label={accessibleLabel}>
      <div className="hand-pair">
        {slots.map((slot) => <ThumbSlot key={slot.side} side={side} slot={slot} state={state} interactive={interactive} playerLabel={playerLabel} onToggle={toggleThumb} />)}
      </div>
      <div className="hand-statebar" aria-hidden="true">
        <span className="hand-statebar__remaining"><small>残り</small><i className="thumb-meter"><b className={safeRemaining >= 1 ? "is-on" : ""} /><b className={safeRemaining >= 2 ? "is-on" : ""} /></i><strong>{safeRemaining}</strong></span>
        <span className="hand-statebar__divider" />
        <span className="hand-statebar__output"><small>出す</small><strong>{masked ? "—" : patternLabel(pattern)}</strong><em>{masked ? "未公開" : visibleCount === 0 ? "出さない" : `${visibleCount}本`}</em></span>
      </div>
    </div>
  );
}
