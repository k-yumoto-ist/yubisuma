import type { Contestant, MatchMode, MatchPhase, MatchState, PlayerId } from "./types";
import { isLegalCall, isLegalHand, resolveRound } from "./rules";

let matchSequence = 0;

export type MatchAction =
  | { type: "selectCall"; value: number; cpuHand?: number }
  | { type: "cpuDeclare"; call: number; hand: number }
  | { type: "selectHand"; side: PlayerId; value: number }
  | { type: "completeHandoff" }
  | { type: "startCountdown" }
  | { type: "reveal" }
  | { type: "resolve" }
  | { type: "continue" }
  | { type: "pause" }
  | { type: "resume" };

function phaseForTurn(state: MatchState, turn: PlayerId): MatchPhase {
  if (state.mode === "local") return "playerChoosingCall";
  return state.players[turn].kind === "cpu" ? "cpuChoosingCall" : "playerChoosingCall";
}

function otherSide(side: PlayerId): PlayerId {
  return side === "p1" ? "p2" : "p1";
}

export function createMatch(options: {
  mode: MatchMode;
  opponentId?: Contestant["characterId"];
  opponentName?: string;
  playerName?: string;
  playerTwoName?: string;
  arenaIndex?: number;
}): MatchState {
  const p1: Contestant = { id: "p1", name: options.playerName ?? "PLAYER", thumbs: 2, kind: "human" };
  const p2: Contestant = options.mode === "local"
    ? { id: "p2", name: options.playerTwoName ?? "PLAYER 2", thumbs: 2, kind: "human" }
    : {
        id: "p2",
        name: options.opponentName ?? "ナギ",
        thumbs: 2,
        kind: "cpu",
        characterId: options.opponentId ?? "nagi"
      };
  const state: MatchState = {
    id: `match-${Date.now()}-${matchSequence += 1}`,
    mode: options.mode,
    phase: "setup",
    round: 1,
    turn: "p1",
    players: { p1, p2 },
    call: null,
    hands: { p1: null, p2: null },
    resolution: null,
    history: [],
    winner: null,
    arenaIndex: options.arenaIndex,
    opponentId: options.opponentId
  };
  return { ...state, phase: phaseForTurn(state, "p1") };
}

export function matchReducer(state: MatchState, action: MatchAction): MatchState {
  if (action.type === "pause") return state.phase === "matchResult" ? state : { ...state, phase: "paused" };
  if (action.type === "resume") return state.phase === "paused" ? { ...state, phase: phaseForTurn(state, state.turn) } : state;

  if (action.type === "selectCall") {
    if (state.phase !== "playerChoosingCall") return state;
    const caller = state.turn;
    const responder = otherSide(caller);
    if (!isLegalCall(action.value, state.players[caller].thumbs, state.players[responder].thumbs)) return state;
    const cpuHand = state.players[responder].kind === "cpu" ? action.cpuHand : undefined;
    if (cpuHand !== undefined && !isLegalHand(cpuHand, state.players[responder].thumbs)) return state;
    return {
      ...state,
      call: action.value,
      hands: { ...state.hands, [responder]: cpuHand ?? null },
      phase: state.mode === "local" ? "localChoosingHands" : "playerChoosingHands"
    };
  }

  if (action.type === "cpuDeclare") {
    if (state.phase !== "cpuChoosingCall") return state;
    const caller = state.turn;
    const responder = otherSide(caller);
    if (!isLegalCall(action.call, state.players[caller].thumbs, state.players[responder].thumbs)) return state;
    if (!isLegalHand(action.hand, state.players[caller].thumbs)) return state;
    return {
      ...state,
      call: action.call,
      hands: { ...state.hands, [caller]: action.hand },
      phase: "playerResponding"
    };
  }

  if (action.type === "selectHand") {
    if (state.mode === "local" && state.phase === "localChoosingHands") {
      if (action.side !== state.turn || !isLegalHand(action.value, state.players[action.side].thumbs)) return state;
      return {
        ...state,
        hands: { ...state.hands, [action.side]: action.value },
        phase: "handoff"
      };
    }
    if (state.mode === "local" && state.phase === "localResponding") {
      const responder = otherSide(state.turn);
      if (action.side !== responder || !isLegalHand(action.value, state.players[responder].thumbs)) return state;
      return { ...state, hands: { ...state.hands, [responder]: action.value }, phase: "readyToReveal" };
    }
    if (state.phase !== "playerChoosingHands" && state.phase !== "playerResponding") return state;
    if (action.side !== "p1" || !isLegalHand(action.value, state.players.p1.thumbs)) return state;
    if (state.call === null || state.hands.p2 === null && state.turn === "p2") return state;
    return { ...state, hands: { ...state.hands, p1: action.value }, phase: "readyToReveal" };
  }

  if (action.type === "completeHandoff") {
    if (state.mode !== "local" || state.phase !== "handoff") return state;
    return { ...state, phase: "localResponding" };
  }

  if (action.type === "startCountdown") {
    if (state.phase !== "readyToReveal" || state.call === null || state.hands.p1 === null || state.hands.p2 === null) return state;
    return { ...state, phase: "countdown" };
  }

  if (action.type === "reveal") {
    if (state.phase !== "countdown" || state.call === null || state.hands.p1 === null || state.hands.p2 === null) return state;
    return { ...state, phase: "reveal" };
  }

  if (action.type === "resolve") {
    if (state.phase !== "reveal" || state.call === null || state.hands.p1 === null || state.hands.p2 === null) return state;
    const caller = state.turn;
    const responder = otherSide(caller);
    const callerHand = state.hands[caller];
    const responderHand = state.hands[responder];
    if (callerHand === null || responderHand === null) return state;
    const result = resolveRound({
      caller,
      callerThumbs: state.players[caller].thumbs,
      responderThumbs: state.players[responder].thumbs,
      call: state.call,
      callerHand,
      responderHand
    });
    const players = {
      ...state.players,
      [caller]: { ...state.players[caller], thumbs: result.callerAfter }
    } as Record<PlayerId, Contestant>;
    const record = {
      round: state.round,
      caller,
      call: state.call,
      hands: { p1: state.hands.p1, p2: state.hands.p2 },
      total: result.total,
      success: result.success,
      thumbLostBy: result.thumbLostBy
    };
    return {
      ...state,
      phase: result.winner ? "matchResult" : "roundResult",
      players,
      resolution: {
        caller,
        call: state.call,
        total: result.total,
        success: result.success,
        thumbLostBy: result.thumbLostBy,
        winner: result.winner,
        nextTurn: result.nextTurn
      },
      history: [...state.history, record],
      winner: result.winner
    };
  }

  if (action.type === "continue") {
    if (state.phase !== "roundResult" || !state.resolution?.nextTurn) return state;
    const nextTurn = state.resolution.nextTurn;
    return {
      ...state,
      phase: phaseForTurn(state, nextTurn),
      round: state.round + 1,
      turn: nextTurn,
      call: null,
      hands: { p1: null, p2: null },
      resolution: null
    };
  }

  return state;
}
