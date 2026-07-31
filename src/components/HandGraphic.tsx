import type { PlayerId } from "@/lib/types";
import Image from "next/image";
import {
  countRaisedThumbs,
  getThumbSlotViews,
  patternLabel,
  toggleThumbPattern,
  type ThumbPattern,
  type ThumbPairState,
  type ThumbSlotView,
  type ThumbSide
} from "@/lib/handVisual";
import { getHandAssetPath } from "@/lib/handAssets";

export type HandState = "idle" | "selected" | "revealing" | "success" | "miss" | "lost";

interface HandGraphicProps {
  pairState: ThumbPairState;
  masked?: boolean;
  side: PlayerId;
  state?: HandState;
  label?: string;
  compact?: boolean;
  interactive?: boolean;
  onThumbToggle?: (thumbs: number, pattern: ThumbPattern) => void;
}

function HandUnit({ slot, state }: { slot: ThumbSlotView; state: HandState }) {
  const pose = slot.selected ? "thumb-up" : "fist";
  return <Image className={`hand-unit hand-unit--${slot.state} hand-unit--${state}`} src={getHandAssetPath(slot.side, pose)} alt="" width={205} height={248} unoptimized draggable={false} />;
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
  const actionLabel = slot.selected ? "下げる" : "上げる";
  const unit = <HandUnit slot={slot} state={state} />;
  return (
    <div className={`hand-slot hand-slot--${slot.side} hand-slot--${slot.state} ${slot.selected ? "is-raised" : ""}`}>
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

export function HandGraphic({ pairState, masked = false, side, state = "idle", label, compact = false, interactive = false, onThumbToggle }: HandGraphicProps) {
  const slots = getThumbSlotViews(pairState, masked);
  const pattern = pairState.revealedThumbs ?? pairState.selectedThumbs;
  const visiblePattern = masked ? { left: false, right: false } : pattern;
  const visibleCount = countRaisedThumbs(visiblePattern);
  const availableCount = countRaisedThumbs(pairState.availableThumbs);
  const accessibleLabel = `${label ?? `${side === "p1" ? "プレイヤー" : "対戦相手"}の手`}。残り${availableCount}本。${masked ? "今回の手は未公開。" : `今回出すのは${patternLabel(visiblePattern)}。`}`;
  const playerLabel = side === "p1" ? "あなた" : "相手";
  const toggleThumb = (thumbSide: ThumbSide) => {
    if (!onThumbToggle) return;
    const next = toggleThumbPattern(pairState.selectedThumbs, thumbSide, pairState.availableThumbs);
    if (next.left === pairState.selectedThumbs.left && next.right === pairState.selectedThumbs.right) return;
    onThumbToggle(countRaisedThumbs(next), next);
  };

  return (
    <div className={`hand-graphic hand-graphic--${side} hand-graphic--${state} ${interactive ? "hand-graphic--interactive" : ""} ${compact ? "hand-graphic--compact" : ""}`} role={interactive ? "group" : "img"} aria-label={accessibleLabel}>
      <div className="hand-pair">
        {slots.map((slot) => <ThumbSlot key={slot.side} slot={slot} state={state} interactive={interactive} playerLabel={playerLabel} onToggle={toggleThumb} />)}
      </div>
      <div className="hand-statebar" aria-hidden="true">
        <span className="hand-statebar__remaining"><small>残り</small><i className="thumb-meter"><b className={availableCount >= 1 ? "is-on" : ""} /><b className={availableCount >= 2 ? "is-on" : ""} /></i><strong>{availableCount}</strong></span>
        <span className="hand-statebar__divider" />
        <span className="hand-statebar__output"><small>出す</small><strong>{masked ? "—" : patternLabel(visiblePattern)}</strong><em>{masked ? "未公開" : visibleCount === 0 ? "出さない" : `${visibleCount}本`}</em></span>
      </div>
    </div>
  );
}
