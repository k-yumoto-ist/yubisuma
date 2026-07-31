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

const fistPath = "M48 151C39 144 34 132 34 117L35 82C35 72 40 64 49 61 56 59 62 63 65 70 67 62 73 58 80 58 88 58 94 63 95 71 98 64 104 61 111 63 118 65 122 71 122 78 127 73 134 75 138 80 142 86 141 94 138 102L134 129C131 147 119 158 101 162L67 162C59 160 53 157 48 151Z";
const foldedFingersPath = "M43 91C54 98 66 100 77 96M75 95C88 101 101 101 113 95M54 119C68 127 87 127 103 119M57 143C71 149 87 149 101 143";
const thumbUpPath = "M55 113C43 113 33 106 28 96 23 86 27 77 36 73 44 70 52 74 57 81L64 91 62 50C62 39 69 31 79 31 89 31 96 39 95 49L91 92C89 109 77 117 55 113Z";
const thumbDownPath = "M55 116C44 118 34 114 28 107 22 99 24 91 32 86 39 82 46 85 52 91L68 106C74 112 67 116 55 116Z";

function HandUnit({ mirror, slot, state }: { mirror: boolean; slot: ThumbSlotView; state: HandState }) {
  const raised = slot.raised && slot.state !== "unavailable";
  return (
    <svg className={`hand-unit ${mirror ? "hand-unit--mirror" : ""} hand-unit--${slot.state} ${raised ? "is-raised" : ""}`} viewBox="0 0 160 180" role="img" aria-hidden="true">
      <path className="hand-unit__shadow" d="M21 160c9-17 24-28 45-31 25-4 47 9 56 31H21Z" />
      <path className="hand-unit__wrist" d="M58 145C69 151 91 153 103 146L108 178H53Z" />
      <path className="hand-unit__fist" d={fistPath} />
      <path className="hand-unit__folded-fingers" d={foldedFingersPath} />
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
      <path className="hand-unit__highlight" d="M52 75C56 68 64 66 71 70c3 2 3 5 0 7-5 4-12 5-17 2-4-1-5-3-2-4Z" />
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
