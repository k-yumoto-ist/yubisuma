import { describe, expect, it } from "vitest";
import { createMatch, matchReducer } from "./gameMachine";

function winPlayerRound(state = createMatch({ mode: "quick", opponentId: "nagi" })) {
  let next = matchReducer(state, { type: "selectCall", value: 0, cpuHand: 0 });
  next = matchReducer(next, { type: "selectHand", side: "p1", value: 0 });
  next = matchReducer(next, { type: "startCountdown" });
  next = matchReducer(next, { type: "reveal" });
  return matchReducer(next, { type: "resolve" });
}

describe("match state machine", () => {
  it("runs one round and prevents double resolution", () => {
    const result = winPlayerRound();
    expect(result.phase).toBe("roundResult");
    expect(result.players.p1.thumbs).toBe(1);
    expect(result.history).toHaveLength(1);
    expect(matchReducer(result, { type: "resolve" })).toEqual(result);
  });

  it("keeps the successful caller and changes turn after a miss", () => {
    let state = createMatch({ mode: "quick", opponentId: "nagi" });
    state = matchReducer(state, { type: "selectCall", value: 0, cpuHand: 1 });
    state = matchReducer(state, { type: "selectHand", side: "p1", value: 0 });
    state = matchReducer(state, { type: "startCountdown" });
    state = matchReducer(state, { type: "reveal" });
    state = matchReducer(state, { type: "resolve" });
    expect(state.phase).toBe("roundResult");
    expect(state.resolution?.nextTurn).toBe("p2");
    state = matchReducer(state, { type: "continue" });
    expect(state.turn).toBe("p2");
    expect(state.phase).toBe("cpuChoosingCall");
  });

  it("enforces the handoff phase in local play", () => {
    let state = createMatch({ mode: "local", playerName: "A", playerTwoName: "B" });
    state = matchReducer(state, { type: "selectCall", value: 1 });
    state = matchReducer(state, { type: "selectHand", side: "p1", value: 1 });
    expect(state.phase).toBe("handoff");
    state = matchReducer(state, { type: "completeHandoff" });
    expect(state.phase).toBe("localResponding");
    state = matchReducer(state, { type: "selectHand", side: "p2", value: 0 });
    expect(state.phase).toBe("readyToReveal");
  });
});
