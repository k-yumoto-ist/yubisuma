import type { PlayerId } from "@/lib/types";

type HandState = "idle" | "selected" | "revealing" | "success" | "miss" | "lost";

interface HandGraphicProps {
  thumbs: number;
  side: PlayerId;
  state?: HandState;
  label?: string;
  compact?: boolean;
  interactive?: boolean;
  onThumbToggle?: (thumbs: number) => void;
}

function HandUnit({ raised, mirror, state }: { raised: boolean; mirror: boolean; state: HandState }) {
  return (
    <svg className={`hand-unit ${mirror ? "hand-unit--mirror" : ""}`} viewBox="0 0 140 180" role="img" aria-hidden="true">
      <path className="hand-unit__shadow" d="M21 160c9-17 24-28 45-31 25-4 47 9 56 31H21Z" />
      <path className="hand-unit__palm" d="M41 151c-5-15-7-31-5-45l2-31c1-7 7-11 13-9 5 2 7 6 7 11l-1 17 4-54c1-7 7-11 13-9 5 2 7 6 7 11l-1 51 4-43c1-7 7-10 13-8 5 2 7 6 7 11l-3 46 4-30c1-6 7-9 12-7 5 2 7 6 6 12l-5 52c-2 22-14 36-35 42l-26-1c-7-5-11-11-12-17Z" />
      <path className="hand-unit__line" d="M58 103c11 8 23 10 35 5M56 124c15 9 29 10 42 3M47 143c15 7 29 8 42 3" />
      {raised ? (
        <path className={`hand-unit__thumb hand-unit__thumb--up hand-unit__thumb--${state}`} d="M42 111c-16-3-28-12-33-26-5-14 0-26 11-29 8-2 15 1 19 8l8 15 4-32c1-8 7-13 14-12 8 1 12 8 11 16l-4 40c-2 17-11 24-30 20Z" />
      ) : (
        <path className={`hand-unit__thumb hand-unit__thumb--down hand-unit__thumb--${state}`} d="M42 111c-16 3-29-1-37-11-7-9-5-21 4-27 8-5 16-3 21 4l16 18c6 7 5 13-4 16Z" />
      )}
      <path className="hand-unit__highlight" d="M75 31c0-3 2-5 5-5 3 0 5 2 5 5l-3 49c0 3-2 5-5 5-3 0-5-2-5-5l3-49Z" />
    </svg>
  );
}

export function HandGraphic({ thumbs, side, state = "idle", label, compact = false, interactive = false, onThumbToggle }: HandGraphicProps) {
  const safeThumbs = Math.max(0, Math.min(2, Math.floor(thumbs)));
  const accessibleLabel = label ?? `${side === "p1" ? "プレイヤー" : "対戦相手"}の手。出している親指は${safeThumbs}本`;
  const toggleThumb = (index: number) => {
    if (!onThumbToggle) return;
    const next = index === 0 ? (safeThumbs >= 1 ? safeThumbs - 1 : 1) : (safeThumbs >= 2 ? 1 : 2);
    onThumbToggle(next);
  };

  return (
    <div className={`hand-graphic hand-graphic--${side} hand-graphic--${state} ${interactive ? "hand-graphic--interactive" : ""} ${compact ? "hand-graphic--compact" : ""}`} role={interactive ? undefined : "img"} aria-label={accessibleLabel}>
      {interactive ? (
        <>
          <button type="button" className="hand-hit-area" onClick={() => toggleThumb(0)} aria-label={`${side === "p1" ? "あなた" : "相手"}の左手を${safeThumbs >= 1 ? "下げる" : "上げる"}`}>
            <HandUnit raised={safeThumbs >= 1} mirror={side === "p2"} state={state} />
          </button>
          <button type="button" className="hand-hit-area" onClick={() => toggleThumb(1)} aria-label={`${side === "p1" ? "あなた" : "相手"}の右手を${safeThumbs >= 2 ? "下げる" : "上げる"}`}>
            <HandUnit raised={safeThumbs >= 2} mirror={side === "p1"} state={state} />
          </button>
        </>
      ) : (
        <>
          <HandUnit raised={safeThumbs >= 1} mirror={side === "p2"} state={state} />
          <HandUnit raised={safeThumbs >= 2} mirror={side === "p1"} state={state} />
        </>
      )}
    </div>
  );
}
