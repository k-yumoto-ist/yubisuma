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

const fistPath = "M0 84H58C64 78 70 73 78 71 94 66 115 68 132 76 141 80 147 86 147 93 147 98 144 102 137 104 146 106 151 111 150 117 150 123 145 127 138 128 145 131 147 136 145 140 142 146 132 149 120 149H94C79 149 68 144 58 134L47 124H0Z";
const foldedFingersPath = "M124 102C135 103 142 107 147 112M119 118C130 118 138 121 143 126M113 134C124 134 132 136 138 140M68 112C81 119 94 121 107 118";
const thumbUpPath = "M66 95C72 84 76 71 75 58L74 39C73 24 81 12 93 11 104 10 112 20 110 33L105 56C103 65 108 72 116 76L128 81C136 84 139 92 136 99 133 106 124 108 117 104L96 95C86 91 76 91 66 95Z";
const thumbDownPath = "M68 96C78 86 90 82 103 84L127 90C136 92 140 100 136 107 133 114 124 116 116 112L97 104C87 101 77 103 68 108Z";

function HandUnit({ mirror, slot, state }: { mirror: boolean; slot: ThumbSlotView; state: HandState }) {
  const raised = slot.raised && slot.state !== "unavailable";
  const bandagePath = raised ? "M77 49 105 55 102 68 74 62Z" : "M91 87 119 94 115 107 87 100Z";
  const bandageLinePath = raised ? "m80 53 22 5m-25 1 22 5" : "m94 91 22 5m-25 1 22 5";
  const unavailableMarkPath = raised ? "m80 43 22 22m0-22-22 22" : "m96 87 22 22m0-22-22 22";
  return (
    <svg className={`hand-unit ${mirror ? "hand-unit--mirror" : ""} hand-unit--${slot.state} ${raised ? "is-raised" : ""}`} viewBox="0 0 180 150" role="img" aria-hidden="true">
      <path className="hand-unit__shadow" d="M48 139C72 132 119 132 151 142L158 150H43Z" />
      <path className="hand-unit__fist" d={fistPath} />
      <path className="hand-unit__folded-fingers" d={foldedFingersPath} />
      <g className="hand-unit__thumb-group">
        <path className={`hand-unit__thumb hand-unit__thumb--${raised ? "up" : "down"} hand-unit__thumb--${slot.state} hand-unit__thumb--${state}`} d={raised ? thumbUpPath : thumbDownPath} />
        {slot.state === "used" && (
          <>
            <path className="hand-unit__bandage" d={bandagePath} />
            <path className="hand-unit__bandage-line" d={bandageLinePath} />
          </>
        )}
        {slot.state === "unavailable" && <path className="hand-unit__unavailable-mark" d={unavailableMarkPath} />}
      </g>
      <path className="hand-unit__highlight" d="M83 76C93 72 105 74 113 79" />
    </svg>
  );
}

function ThumbSlot({
  slot,
  state,
  interactive,
  playerLabel,
  onToggle
}: {
  slot: ThumbSlotView;
  state: HandState;
  interactive: boolean;
  playerLabel: string;
  onToggle: (thumbSide: ThumbSide) => void;
}) {
  const sideLabel = slot.side === "left" ? "左" : "右";
  const actionLabel = slot.raised ? "下げる" : "上げる";
  const unit = <HandUnit mirror={slot.side === "right"} slot={slot} state={state} />;
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
        {slots.map((slot) => <ThumbSlot key={slot.side} slot={slot} state={state} interactive={interactive} playerLabel={playerLabel} onToggle={toggleThumb} />)}
      </div>
      <div className="hand-statebar" aria-hidden="true">
        <span className="hand-statebar__remaining"><small>残り</small><i className="thumb-meter"><b className={safeRemaining >= 1 ? "is-on" : ""} /><b className={safeRemaining >= 2 ? "is-on" : ""} /></i><strong>{safeRemaining}</strong></span>
        <span className="hand-statebar__divider" />
        <span className="hand-statebar__output"><small>出す</small><strong>{masked ? "—" : patternLabel(pattern)}</strong><em>{masked ? "未公開" : visibleCount === 0 ? "出さない" : `${visibleCount}本`}</em></span>
      </div>
    </div>
  );
}
