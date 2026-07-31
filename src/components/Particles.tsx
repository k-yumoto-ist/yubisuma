export function Particles({ active, variant = "success" }: { active: boolean; variant?: "success" | "miss" | "victory" }) {
  if (!active) return null;
  return (
    <div className={`particles particles--${variant}`} aria-hidden="true">
      {Array.from({ length: 18 }, (_, index) => <i key={index} style={{ "--particle-index": index } as React.CSSProperties} />)}
    </div>
  );
}
