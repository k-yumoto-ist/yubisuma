import type { CharacterMood, CharacterProfile } from "@/lib/types";

interface CharacterAvatarProps {
  character: CharacterProfile;
  mood?: CharacterMood;
  size?: "small" | "medium" | "large";
}

export function CharacterAvatar({ character, mood = "normal", size = "medium" }: CharacterAvatarProps) {
  const { colors } = character;
  return (
    <div className={`character-avatar character-avatar--${size} character-avatar--${character.art} character-avatar--${mood}`} style={{ "--character-primary": colors.primary, "--character-accent": colors.accent, "--character-ink": colors.ink } as React.CSSProperties}>
      <svg viewBox="0 0 180 220" role="img" aria-label={`${character.name}、${mood === "victory" ? "勝利" : mood === "defeat" ? "敗北" : "対戦中"}の表情`}>
        <path className="avatar__body" d="M30 218c4-40 26-61 60-61s56 21 60 61H30Z" />
        <path className="avatar__collar" d="m77 151 13 18 13-18 13 12-12 22H89l-12-22 0-12Z" />
        <path className="avatar__neck" d="M72 124h36v36c-7 10-29 10-36 0v-36Z" />
        <path className="avatar__ear" d="M42 79c-8-4-13 5-10 16 3 12 11 16 18 11m80-27c8-4 13 5 10 16-3 12-11 16-18 11" />
        <ellipse className="avatar__face" cx="90" cy="88" rx="49" ry="55" />
        <path className="avatar__hair" d={hairPath(character.art)} />
        {artDetails(character.art)}
        <g className="avatar__expression">
          {mood === "surprised" ? <><circle className="avatar__eye" cx="70" cy="93" r="5" /><circle className="avatar__eye" cx="110" cy="93" r="5" /><ellipse className="avatar__mouth avatar__mouth--open" cx="90" cy="117" rx="7" ry="10" /></> : mood === "frustrated" || mood === "defeat" ? <><path className="avatar__brow" d="M62 91l15 5m41-5-15 5" /><path className="avatar__eye avatar__eye--closed" d="M65 101c4 4 8 4 12 0m26 0c4 4 8 4 12 0" /><path className="avatar__mouth" d="M80 119c7-6 13-6 20 0" /></> : mood === "confident" || mood === "victory" ? <><path className="avatar__brow" d="M62 92c5-4 10-4 15-1m26 1c5-3 10-3 15 1" /><path className="avatar__eye avatar__eye--happy" d="M65 98c4 6 8 6 12 0m26 0c4 6 8 6 12 0" /><path className="avatar__mouth" d="M78 115c8 8 16 8 24 0" /></> : <><ellipse className="avatar__eye" cx="71" cy="98" rx="4" ry="5" /><ellipse className="avatar__eye" cx="109" cy="98" rx="4" ry="5" /><path className="avatar__mouth" d="M82 117c5 3 11 3 16 0" /></>}
        </g>
      </svg>
      <span className="character-avatar__shine" aria-hidden="true" />
    </div>
  );
}

function hairPath(art: CharacterProfile["art"]): string {
  switch (art) {
    case "nagi": return "M43 82c-9-25 4-60 35-65 31-6 58 13 61 44-9-8-17-11-26-10-8 1-13 6-19 7-14 3-21-12-31-8-9 4-13 17-20 32Z";
    case "momo": return "M39 94C23 62 40 22 75 16c32-6 63 16 65 50-12-7-21-5-30-11-12-8-17-18-30-17-18 1-24 19-41 24Z";
    case "kaito": return "M43 82c-10-27 4-57 34-65 29-7 58 11 62 42l-16-7-12 12-17-17-19 22-17 13-15 0Z";
    case "ritsu": return "M39 85C30 51 50 18 83 15c32-3 56 17 60 49l-20-8-11 19-14-21-19 17-19 3-21 11Z";
    case "juna": return "M43 88c-8-27 9-55 40-61 29-5 52 15 55 46l-16-10-20 12-21-16-17 23-21 6Z";
    case "volt": return "M37 87c-7-33 15-65 49-68 36-4 62 23 57 58l-18-14-12 18-18-17-19 19-22 4-17 0Z";
  }
}

function artDetails(art: CharacterProfile["art"]) {
  switch (art) {
    case "nagi":
      return <><path className="avatar__scarf" d="M51 151c22 12 48 12 77 0l-8 23-20-8-17 18-18-19-19 7-6-21Z" /><path className="avatar__accent-line" d="M46 50c9-15 20-23 35-27" /></>;
    case "momo":
      return <><path className="avatar__hood" d="M43 54c4-30 26-46 48-42 24 4 42 22 43 48l-17-11-14 6-21-12-21 15-18-4Z" /><circle className="avatar__star" cx="120" cy="39" r="6" /><path className="avatar__jewel" d="m57 132 7 10-7 11-7-11 7-10Zm66 0 7 10-7 11-7-11 7-10Z" /></>;
    case "kaito":
      return <><path className="avatar__visor" d="M48 83h84l-5 20H53l-5-20Z" /><path className="avatar__visor-line" d="M66 91h48" /><rect className="avatar__gear" x="65" y="174" width="50" height="15" rx="5" /></>;
    case "ritsu":
      return <><path className="avatar__headphone" d="M39 87c-5-38 17-65 51-65s56 27 51 65" /><circle className="avatar__earcup" cx="38" cy="91" r="12" /><circle className="avatar__earcup" cx="142" cy="91" r="12" /><path className="avatar__stripe" d="M96 22l17 54-13 14-17-54 13-14Z" /></>;
    case "juna":
      return <><path className="avatar__chef" d="M48 51c-6-10 2-20 12-19 1-13 16-19 25-10 9-9 24-3 25 10 11-1 18 10 11 19l-13 8H61l-13-8Z" /><path className="avatar__neckcloth" d="m59 155 31 20 31-20-5 32H64l-5-32Z" /></>;
    case "volt":
      return <><path className="avatar__crown" d="m50 53 8-24 16 14 16-25 16 25 17-14 7 24H50Z" /><path className="avatar__armor" d="M43 176h94l12 42H31l12-42Z" /><circle className="avatar__core" cx="90" cy="197" r="9" /></>;
  }
}
