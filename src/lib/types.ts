export type CharacterId = "nagi" | "momo" | "kaito" | "ritsu" | "juna" | "volt";

export type CharacterMood =
  | "normal"
  | "confident"
  | "surprised"
  | "frustrated"
  | "pinch"
  | "victory"
  | "defeat";

export type MatchMode = "quick" | "arena" | "local" | "tutorial";
export type PlayerId = "p1" | "p2";

export type MatchPhase =
  | "setup"
  | "playerChoosingCall"
  | "playerChoosingHands"
  | "cpuChoosingCall"
  | "playerResponding"
  | "localChoosingHands"
  | "localResponding"
  | "handoff"
  | "readyToReveal"
  | "countdown"
  | "reveal"
  | "judging"
  | "roundResult"
  | "matchResult"
  | "paused";

export interface CharacterQuotes {
  intro: string;
  success: string;
  miss: string;
  pinch: string;
  defeat: string;
  victory: string;
}

export interface CharacterAiProfile {
  randomness: number;
  shortMemory: number;
  longMemory: number;
  prediction: number;
  repeatAvoidance: number;
  bluff: number;
  risk: number;
}

export interface CharacterProfile {
  id: CharacterId;
  name: string;
  title: string;
  personality: string;
  difficulty: 1 | 2 | 3 | 4 | 5 | 6;
  colors: {
    primary: string;
    accent: string;
    ink: string;
    glow: string;
    stage: string;
  };
  badge: string;
  art: "nagi" | "momo" | "kaito" | "ritsu" | "juna" | "volt";
  quotes: CharacterQuotes;
  ai: CharacterAiProfile;
}

export interface Contestant {
  id: PlayerId;
  name: string;
  thumbs: number;
  kind: "human" | "cpu";
  characterId?: CharacterId;
}

export interface Hands {
  p1: number | null;
  p2: number | null;
}

export interface RoundRecord {
  round: number;
  caller: PlayerId;
  call: number;
  hands: { p1: number; p2: number };
  total: number;
  success: boolean;
  thumbLostBy: PlayerId | null;
}

export interface RoundResolution {
  caller: PlayerId;
  call: number;
  total: number;
  success: boolean;
  thumbLostBy: PlayerId | null;
  winner: PlayerId | null;
  nextTurn: PlayerId | null;
}

export interface MatchState {
  id: string;
  mode: MatchMode;
  phase: MatchPhase;
  round: number;
  turn: PlayerId;
  players: Record<PlayerId, Contestant>;
  call: number | null;
  hands: Hands;
  resolution: RoundResolution | null;
  history: RoundRecord[];
  winner: PlayerId | null;
  arenaIndex?: number;
  opponentId?: CharacterId;
}

export type GameSpeed = "relaxed" | "normal" | "turbo";

export interface GameSettings {
  bgm: boolean;
  sfx: boolean;
  volume: number;
  vibration: boolean;
  speed: GameSpeed;
}

export interface MatchHistoryItem {
  id: string;
  playedAt: string;
  mode: MatchMode;
  opponentId?: CharacterId;
  opponentName: string;
  won: boolean;
  rounds: number;
}

export interface ProfileStats {
  totalMatches: number;
  wins: number;
  losses: number;
  currentStreak: number;
  maxStreak: number;
  arenaBest: number;
  correctCalls: number;
  zeroCalls: number;
  perfectReads: number;
  comebackWins: number;
  arenaClears: number;
  defeatedCharacterIds: CharacterId[];
}

export interface PlayerProfile {
  version: 2;
  tutorialComplete: boolean;
  settings: GameSettings;
  stats: ProfileStats;
  unlockedTitles: string[];
  recentMatches: MatchHistoryItem[];
}

export interface CpuObservation {
  playerThumbs: number;
  cpuThumbs: number;
  call: number | null;
  history: RoundRecord[];
  turnNumber: number;
}
