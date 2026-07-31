"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, ChangeEvent } from "react";
import { CharacterAvatar } from "@/components/CharacterAvatar";
import { HandGraphic } from "@/components/HandGraphic";
import { Particles } from "@/components/Particles";
import { characters, getCharacter } from "@/lib/characters";
import { chooseCpuCall, chooseCpuHand } from "@/lib/cpu";
import { createMatch, matchReducer, type MatchAction } from "@/lib/gameMachine";
import { nativeRng } from "@/lib/random";
import { legalCallValues, legalHandValues } from "@/lib/rules";
import { AudioEngine, vibrate } from "@/lib/sound";
import { createDefaultProfile, defaultSettings, loadProfile, recordCompletedMatch, saveProfile } from "@/lib/storage";
import { countRaisedThumbs, createThumbPairState, emptyThumbPattern, patternForCountWithAvailability, removeThumb, type ThumbPairState, type ThumbPattern } from "@/lib/handVisual";
import type { CharacterId, CharacterMood, GameSettings, MatchPhase, MatchState, PlayerId, PlayerProfile } from "@/lib/types";

type Screen = "boot" | "title" | "modeSelect" | "characterSelect" | "arena" | "nameEntry" | "match" | "stats" | "howto" | "settings" | "reset";
type Presentation = "idle" | "declare" | "count1" | "count2" | "reveal" | "success" | "miss" | "victory" | "defeat";

const speedValues: Record<GameSettings["speed"], number> = { relaxed: 1.25, normal: 1, turbo: 0.68 };
const publicBasePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export default function HomePage() {
  const [screen, setScreen] = useState<Screen>("boot");
  const [profile, setProfile] = useState<PlayerProfile>(() => createDefaultProfile());
  const [hydrated, setHydrated] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterId>("momo");
  const [arenaIndex, setArenaIndex] = useState(0);
  const [match, setMatch] = useState<MatchState | null>(null);
  const [playerNames, setPlayerNames] = useState({ p1: "PLAYER", p2: "PLAYER 2" });
  const [presentation, setPresentation] = useState<Presentation>("idle");
  const [settingsReturn, setSettingsReturn] = useState<Screen>("title");
  const [reducedMotion, setReducedMotion] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [handStates, setHandStates] = useState<Record<PlayerId, ThumbPairState>>({ p1: createThumbPairState(), p2: createThumbPairState() });
  const [audio] = useState(() => new AudioEngine(defaultSettings));
  const sequenceKeyRef = useRef<string | null>(null);
  const sequenceTokenRef = useRef(0);
  const advanceKeyRef = useRef<string | null>(null);
  const recordedMatchRef = useRef<string | null>(null);
  const handLossKeyRef = useRef<string | null>(null);

  const navigate = useCallback((next: Screen, replace = false) => {
    if (typeof document !== "undefined" && document.activeElement instanceof HTMLElement) document.activeElement.blur();
    setScreen(next);
    if (typeof window !== "undefined") {
      const state = { yubisuma: true, screen: next };
      if (replace) window.history.replaceState(state, "", `#${next}`);
      else window.history.pushState(state, "", `#${next}`);
      const resetViewport = () => {
        window.scrollTo(0, 0);
        const app = document.querySelector<HTMLElement>(".game-app");
        if (app) {
          app.scrollTop = 0;
          app.scrollLeft = 0;
        }
      };
      window.requestAnimationFrame(() => {
        resetViewport();
        window.setTimeout(resetViewport, 24);
      });
    }
  }, []);

  useEffect(() => {
    const loaded = loadProfile();
    setProfile(loaded);
    audio.setSettings(loaded.settings);
    setHydrated(true);
    const timer = window.setTimeout(() => navigate("title", true), 720);
    return () => window.clearTimeout(timer);
  }, [audio, navigate]);

  useEffect(() => {
    if (!hydrated) return;
    saveProfile(profile);
  }, [hydrated, profile]);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener?.("change", update);
    return () => query.removeEventListener?.("change", update);
  }, []);

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      const next = (event.state as { screen?: Screen } | null)?.screen;
      setScreen(next && next !== "boot" ? next : "title");
      setPresentation("idle");
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      const serviceWorkerUrl = `${publicBasePath}/sw.js?v=20260731-match-board`;
      void navigator.serviceWorker
        .register(serviceWorkerUrl, { updateViaCache: "none" })
        .then((registration) => registration.update())
        .catch(() => undefined);
    }
  }, []);

  useEffect(() => {
    const isMatchScreen = screen === "match";
    document.documentElement.classList.toggle("match-screen-active", isMatchScreen);
    document.body.classList.toggle("match-screen-active", isMatchScreen);

    return () => {
      document.documentElement.classList.remove("match-screen-active");
      document.body.classList.remove("match-screen-active");
    };
  }, [screen]);

  useEffect(() => {
    return () => {
      sequenceTokenRef.current += 1;
    };
  }, [screen]);

  useEffect(() => {
    const resetViewport = () => {
      const app = document.querySelector<HTMLElement>(".game-app");
      if (app) {
        app.scrollTop = 0;
        app.scrollLeft = 0;
      }
      window.scrollTo(0, 0);
    };
    resetViewport();
    const frame = window.requestAnimationFrame(resetViewport);
    return () => window.cancelAnimationFrame(frame);
  }, [match?.phase, screen]);

  const updateSettings = useCallback((patch: Partial<GameSettings>) => {
    setProfile((current) => {
      const next = { ...current, settings: { ...current.settings, ...patch } };
      audio.setSettings(next.settings);
      return next;
    });
    audio.unlock();
  }, [audio]);

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast((current) => current === message ? null : current), 2200);
  }, []);

  const startCpuMatch = useCallback((mode: "quick" | "arena" | "tutorial", opponentId: CharacterId, index?: number) => {
    const opponent = getCharacter(opponentId);
    const next = createMatch({
      mode,
      opponentId,
      opponentName: opponent.name,
      playerName: "PLAYER",
      arenaIndex: index
    });
    setMatch(next);
    setHandStates({ p1: createThumbPairState(), p2: createThumbPairState() });
    setPresentation("idle");
    sequenceKeyRef.current = null;
    recordedMatchRef.current = null;
    audio.unlock();
    navigate("match");
  }, [audio, navigate]);

  const startLocalMatch = useCallback(() => {
    const next = createMatch({ mode: "local", playerName: playerNames.p1 || "PLAYER 1", playerTwoName: playerNames.p2 || "PLAYER 2" });
    setMatch(next);
    setHandStates({ p1: createThumbPairState(), p2: createThumbPairState() });
    setPresentation("idle");
    sequenceKeyRef.current = null;
    recordedMatchRef.current = null;
    audio.unlock();
    navigate("match");
  }, [audio, navigate, playerNames]);

  const dispatchMatch = useCallback((action: MatchAction) => {
    if (typeof document !== "undefined" && document.activeElement instanceof HTMLElement) document.activeElement.blur();
    setMatch((current) => current ? matchReducer(current, action) : current);
  }, []);

  const timing = useMemo(() => reducedMotion ? 0.28 : speedValues[profile.settings.speed], [profile.settings.speed, reducedMotion]);

  useEffect(() => {
    if (screen !== "match" || !match || match.phase !== "cpuChoosingCall") return;
    const currentMatch = match;
    const character = getCharacter(currentMatch.players.p2.characterId);
    const timer = window.setTimeout(() => {
      const observation = {
        playerThumbs: currentMatch.players.p1.thumbs,
        cpuThumbs: currentMatch.players.p2.thumbs,
        call: null,
        history: currentMatch.history,
        turnNumber: currentMatch.round
      };
      const isTutorial = currentMatch.mode === "tutorial";
      const call = isTutorial ? 1 : chooseCpuCall(character, observation, nativeRng);
      const hand = isTutorial ? 0 : chooseCpuHand(character, { ...observation, call }, "caller", nativeRng);
      dispatchMatch({ type: "cpuDeclare", call, hand });
      setHandStates((current) => ({ ...current, p2: { ...current.p2, selectedThumbs: patternForCountWithAvailability(hand, current.p2.availableThumbs) } }));
      setPresentation("declare");
      audio.play("declare");
      vibrate(12, profile.settings.vibration);
    }, 360 * timing);
    return () => window.clearTimeout(timer);
  }, [audio, dispatchMatch, match, profile.settings.vibration, screen, timing]);

  useEffect(() => {
    if (screen !== "match" || !match || match.phase !== "reveal") return;
    setHandStates((current) => ({
      p1: { ...current.p1, revealedThumbs: current.p1.selectedThumbs },
      p2: { ...current.p2, revealedThumbs: current.p2.selectedThumbs }
    }));
  }, [match, screen]);

  useEffect(() => {
    if (screen !== "match" || !match || !["playerChoosingCall", "cpuChoosingCall"].includes(match.phase)) return;
    setHandStates((current) => ({
      p1: { ...current.p1, selectedThumbs: emptyThumbPattern(), revealedThumbs: null },
      p2: { ...current.p2, selectedThumbs: emptyThumbPattern(), revealedThumbs: null }
    }));
  }, [match, screen]);

  useEffect(() => {
    if (screen !== "match" || !match || match.phase !== "countdown") return;
    const key = `${match.id}-${match.round}`;
    if (sequenceKeyRef.current === key) return;
    sequenceKeyRef.current = key;
    const token = sequenceTokenRef.current + 1;
    sequenceTokenRef.current = token;
    const wait = (milliseconds: number) => new Promise<void>((resolve) => window.setTimeout(resolve, milliseconds));
    const run = async () => {
      setPresentation("count1");
      audio.play("count");
      await wait(240 * timing);
      if (sequenceTokenRef.current !== token) return;
      setPresentation("count2");
      audio.play("count");
      await wait(280 * timing);
      if (sequenceTokenRef.current !== token) return;
      setPresentation("reveal");
      dispatchMatch({ type: "reveal" });
      audio.play("reveal");
      vibrate([12, 28, 18], profile.settings.vibration);
      await wait(500 * timing);
      if (sequenceTokenRef.current !== token) return;
      dispatchMatch({ type: "resolve" });
    };
    void run();
  }, [audio, dispatchMatch, match, profile.settings.vibration, screen, timing]);

  useEffect(() => {
    if (screen !== "match" || !match || (match.phase !== "roundResult" && match.phase !== "matchResult") || !match.resolution) return;
    const resolution = match.resolution;
    const playerLost = resolution.thumbLostBy === "p1";
    const outcome = match.phase === "matchResult" ? (match.winner === "p1" ? "victory" : "defeat") : resolution.success && !playerLost ? "success" : "miss";
    setPresentation(outcome);
    audio.play(outcome === "victory" ? "victory" : outcome === "defeat" ? "defeat" : outcome === "success" ? "success" : "miss");
    if (playerLost) audio.play("loseThumb");
    vibrate(outcome === "victory" ? [25, 45, 35] : playerLost ? 25 : 16, profile.settings.vibration);
    if (resolution.success && resolution.thumbLostBy) {
      const lossKey = `${match.id}-${match.round}`;
      if (handLossKeyRef.current !== lossKey) {
        handLossKeyRef.current = lossKey;
        const loser = resolution.thumbLostBy;
        setHandStates((current) => {
          const next = removeThumb(current[loser].availableThumbs, current[loser].selectedThumbs);
          return { ...current, [loser]: { ...current[loser], ...next } };
        });
      }
    }
    if (match.phase === "roundResult") {
      const key = `${match.id}-${match.round}`;
      if (advanceKeyRef.current !== key) {
        advanceKeyRef.current = key;
        const timer = window.setTimeout(() => dispatchMatch({ type: "continue" }), 1450 * timing);
        return () => window.clearTimeout(timer);
      }
    }
  }, [audio, dispatchMatch, match, profile.settings.vibration, screen, timing]);

  useEffect(() => {
    if (screen !== "match" || !match || match.phase !== "matchResult" || !match.winner || recordedMatchRef.current === match.id) return;
    recordedMatchRef.current = match.id;
    const winnerIsPlayer = match.winner === "p1";
    let p1Thumbs = 2;
    let comeback = false;
    match.history.forEach((record) => {
      if (record.round === match.history[match.history.length - 1]?.round && winnerIsPlayer && p1Thumbs === 1) comeback = true;
      if (record.success && record.thumbLostBy === "p1") p1Thumbs = Math.max(0, p1Thumbs - 1);
    });
    const playerRecords = match.history.filter((record) => record.caller === "p1");
    const summary = {
      id: match.id,
      mode: match.mode,
      opponentId: match.opponentId,
      opponentName: match.players.p2.name,
      won: winnerIsPlayer,
      rounds: match.history.length,
      correctCalls: playerRecords.filter((record) => record.success).length,
      zeroCalls: playerRecords.filter((record) => record.call === 0).length,
      perfectRead: playerRecords.some((record) => record.success && record.hands.p2 !== record.hands.p1),
      comeback,
      arenaIndex: match.arenaIndex,
      arenaCleared: match.mode === "arena" && winnerIsPlayer && match.arenaIndex === characters.length - 1
    };
    setProfile((current) => recordCompletedMatch(current, summary));
  }, [match, screen]);

  const onCallSelected = (value: number) => {
    if (!match || match.phase !== "playerChoosingCall") return;
    audio.unlock();
    if (match.mode === "local") {
      dispatchMatch({ type: "selectCall", value });
    } else {
      const character = getCharacter(match.players.p2.characterId);
      const observation = { playerThumbs: match.players.p1.thumbs, cpuThumbs: match.players.p2.thumbs, call: value, history: match.history, turnNumber: match.round };
      const cpuHand = match.mode === "tutorial" ? 0 : chooseCpuHand(character, observation, "responder", nativeRng);
      dispatchMatch({ type: "selectCall", value, cpuHand });
      setHandStates((current) => ({ ...current, p2: { ...current.p2, selectedThumbs: patternForCountWithAvailability(cpuHand, current.p2.availableThumbs) } }));
    }
    setPresentation("declare");
    audio.play("declare");
    vibrate(10, profile.settings.vibration);
  };

  const onHandSelected = (value: number, pattern?: ThumbPattern) => {
    if (!match) return;
    const side = match.mode === "local" && match.phase === "localResponding" ? (match.turn === "p1" ? "p2" : "p1") : match.mode === "local" ? match.turn : "p1";
    setHandStates((current) => ({ ...current, [side]: { ...current[side], selectedThumbs: pattern ?? (countRaisedThumbs(current[side].selectedThumbs) === value ? current[side].selectedThumbs : patternForCountWithAvailability(value, current[side].availableThumbs)) } }));
    dispatchMatch({ type: "selectHand", side, value });
    audio.unlock();
    audio.play("select");
    vibrate(8, profile.settings.vibration);
  };

  const onHandPatternChanged = (value: number, pattern: ThumbPattern) => {
    if (!match) return;
    const side = match.mode === "local" && match.phase === "localResponding" ? (match.turn === "p1" ? "p2" : "p1") : match.mode === "local" ? match.turn : "p1";
    setHandStates((current) => ({ ...current, [side]: { ...current[side], selectedThumbs: pattern } }));
    audio.unlock();
    audio.play("select");
    vibrate(8, profile.settings.vibration);
  };

  const openSettings = (returnTo: Screen) => {
    setSettingsReturn(returnTo);
    navigate("settings");
  };

  const resetData = () => {
    const next = createDefaultProfile();
    setProfile(next);
    saveProfile(next);
    setMatch(null);
    navigate("title", true);
    showToast("保存データを初期化しました");
  };

  const opponent = match ? getCharacter(match.players.p2.characterId) : getCharacter(selectedCharacter);
  const stageStyle = {
    "--stage-color": opponent.colors.stage,
    "--character-primary": opponent.colors.primary,
    "--character-accent": opponent.colors.accent,
    "--character-glow": opponent.colors.glow
  } as CSSProperties;

  if (screen === "boot") return <main className="boot-screen"><div className="boot-mark"><span>指</span><b>ARENA</b></div><span className="boot-line" /></main>;

  return (
    <main className={`game-app game-app--${screen}`} style={stageStyle}>
      <div className="ambient ambient--one" aria-hidden="true" />
      <div className="ambient ambient--two" aria-hidden="true" />
      {screen === "title" && renderTitle({ profile, navigate, openSettings, startTutorial: () => startCpuMatch("tutorial", "nagi") })}
      {screen === "modeSelect" && renderModeSelect({ navigate, profile, startTutorial: () => startCpuMatch("tutorial", "nagi"), openSettings })}
      {screen === "characterSelect" && renderCharacterSelect({ selectedCharacter, setSelectedCharacter, navigate, start: () => startCpuMatch("quick", selectedCharacter), openSettings })}
      {screen === "arena" && renderArena({ arenaIndex, setArenaIndex, navigate, start: () => startCpuMatch("arena", characters[arenaIndex].id, arenaIndex), openSettings })}
      {screen === "nameEntry" && renderNameEntry({ playerNames, setPlayerNames, navigate, startLocalMatch, openSettings })}
      {screen === "stats" && renderStats({ profile, navigate, openSettings })}
      {screen === "howto" && renderHowTo({ navigate, openSettings })}
      {screen === "settings" && renderSettings({ profile, updateSettings, navigate: () => navigate(settingsReturn), openReset: () => navigate("reset"), startTutorial: () => startCpuMatch("tutorial", "nagi") })}
      {screen === "reset" && renderReset({ navigate: () => navigate("settings"), resetData })}
      {screen === "match" && match && renderMatch({ match, opponent, presentation, handStates, navigate, openSettings: () => openSettings("match"), onCallSelected, onHandSelected, onHandPatternChanged, dispatchMatch, startCpuMatch, startLocalMatch, onNextArena: () => { setArenaIndex((current) => Math.min(current + 1, characters.length - 1)); navigate("arena"); } })}
      {toast && <div className="toast" role="status">{toast}</div>}
    </main>
  );
}

function renderTitle({ profile, navigate, openSettings, startTutorial }: { profile: PlayerProfile; navigate: (screen: Screen) => void; openSettings: (returnTo: Screen) => void; startTutorial: () => void }) {
  return (
    <div className="title-screen screen-shell">
      <header className="topbar topbar--title"><div className="mini-logo"><span>指</span><strong>ARENA</strong></div><div className="topbar-actions"><button className="icon-button" onClick={() => navigate("stats")} aria-label="戦績">▦</button><button className="icon-button" onClick={() => openSettings("title")} aria-label="設定">⚙</button></div></header>
      <section className="title-hero" aria-labelledby="title-heading">
        <div className="hero-copy"><span className="eyebrow"><i />FINGER DUEL / 01</span><h1 id="title-heading"><span>指スマ</span><em>ARENA</em></h1><p>指先ひとつで、読み合いのど真ん中へ。</p><div className="hero-rule"><span>CALL</span><b>+</b><span>HANDS</span><b>→</b><strong>WIN</strong></div></div>
        <div className="title-character"><div className="spotlight" /><CharacterAvatar character={getCharacter("nagi")} mood="confident" size="large" /><div className="character-sticker">NEW MATCH</div></div>
      </section>
      <section className="title-actions"><button className="primary-button primary-button--wide" onClick={() => navigate("modeSelect")}>対戦をはじめる<span>PLAY NOW</span></button><div className="quick-links"><button className="text-button" onClick={startTutorial}><span className="link-icon">?</span>はじめて遊ぶ</button><button className="text-button" onClick={() => navigate("howto")}><span className="link-icon">≡</span>遊び方</button></div></section>
      <section className="title-footer"><div className="record-chip"><span>WIN STREAK</span><strong>{profile.stats.currentStreak.toString().padStart(2, "0")}</strong></div><div className="title-tagline">読み合いは、<b>一瞬。</b></div><div className="record-chip record-chip--right"><span>ARENA BEST</span><strong>{profile.stats.arenaBest.toString().padStart(2, "0")}</strong></div></section>
      {!profile.tutorialComplete && <button className="first-play-note" onClick={startTutorial}><span>TIP</span> まずはチュートリアルで指スマの流れを体験できます <b>→</b></button>}
    </div>
  );
}

function renderModeSelect({ navigate, profile, startTutorial, openSettings }: { navigate: (screen: Screen) => void; profile: PlayerProfile; startTutorial: () => void; openSettings: (screen: Screen) => void }) {
  return <div className="screen-shell inner-shell"><ScreenTop title="MODE SELECT" subtitle="どのアリーナへ向かう？" back={() => navigate("title")} openSettings={() => openSettings("modeSelect")} /><section className="mode-list"><button className="mode-choice mode-choice--quick" onClick={() => navigate("characterSelect")}><span className="mode-number">01</span><span className="mode-icon">✦</span><span className="mode-copy"><b>クイック対戦</b><small>好きなライバルと一試合。気軽に腕試し。</small></span><strong>→</strong></button><button className="mode-choice mode-choice--arena" onClick={() => navigate("arena")}><span className="mode-number">02</span><span className="mode-icon">◈</span><span className="mode-copy"><b>アリーナモード</b><small>6人のライバルを勝ち抜き、頂上へ。</small></span><strong>→</strong></button><button className="mode-choice mode-choice--local" onClick={() => navigate("nameEntry")}><span className="mode-number">03</span><span className="mode-icon">⇄</span><span className="mode-copy"><b>ローカル2人対戦</b><small>同じ端末を渡しながら、真剣勝負。</small></span><strong>→</strong></button></section><section className="mode-note"><span className="note-dot" />{profile.tutorialComplete ? "準備はできた。指先で流れをつかもう。" : "初めてなら、先にチュートリアルがおすすめ。"}<button className="text-button" onClick={startTutorial}>チュートリアル <b>→</b></button></section></div>;
}

function renderCharacterSelect({ selectedCharacter, setSelectedCharacter, navigate, start, openSettings }: { selectedCharacter: CharacterId; setSelectedCharacter: (id: CharacterId) => void; navigate: (screen: Screen) => void; start: () => void; openSettings: (screen: Screen) => void }) {
  const selected = getCharacter(selectedCharacter);
  return <div className="screen-shell inner-shell"><ScreenTop title="RIVAL SELECT" subtitle="対戦相手を選ぶ" back={() => navigate("modeSelect")} openSettings={() => openSettings("characterSelect")} /><section className="character-stage"><div className="selected-rival"><div className="selected-rival__copy"><span className="eyebrow">YOUR OPPONENT</span><h2>{selected.name}</h2><p>{selected.title}</p><span className="difficulty">DIFFICULTY <b>{"●".repeat(selected.difficulty)}{"○".repeat(6 - selected.difficulty)}</b></span></div><CharacterAvatar character={selected} mood="confident" size="large" /></div><div className="character-rail" role="list" aria-label="対戦相手一覧">{characters.map((character) => <button key={character.id} className={`character-tile ${character.id === selectedCharacter ? "is-selected" : ""}`} onClick={() => setSelectedCharacter(character.id)} aria-pressed={character.id === selectedCharacter}><CharacterAvatar character={character} mood={character.id === selectedCharacter ? "confident" : "normal"} size="small" /><span>{character.name}</span><small>{character.badge}</small></button>)}</div></section><section className="selection-bottom"><div><b>{selected.personality}</b><span>「{selected.quotes.intro}」</span></div><button className="primary-button" onClick={start}>この相手と対戦 <span>→</span></button></section></div>;
}

function renderArena({ arenaIndex, setArenaIndex, navigate, start, openSettings }: { arenaIndex: number; setArenaIndex: (index: number) => void; navigate: (screen: Screen) => void; start: () => void; openSettings: (screen: Screen) => void }) {
  const current = characters[arenaIndex];
  return <div className="screen-shell inner-shell"><ScreenTop title="ARENA LADDER" subtitle="勝ち抜くほど、読み合いは深くなる" back={() => navigate("modeSelect")} openSettings={() => openSettings("arena")} /><section className="arena-hero"><div className="arena-copy"><span className="eyebrow">THE CLIMB / {String(arenaIndex + 1).padStart(2, "0")} — 06</span><h2>光のリングを、<br /><em>ひとつずつ。</em></h2><p>ライバルの強さと演出が、階層ごとに変化します。最後に待つのはボス・ヴォルト。</p></div><CharacterAvatar character={current} mood={arenaIndex === characters.length - 1 ? "confident" : "normal"} size="large" /></section><div className="ladder" role="list" aria-label="アリーナ進行"><div className="ladder-line" />{characters.map((character, index) => <button key={character.id} className={`ladder-node ${index === arenaIndex ? "is-current" : ""} ${index < arenaIndex ? "is-cleared" : ""}`} onClick={() => setArenaIndex(index)} aria-label={`${index + 1}戦目 ${character.name}`}><span className="ladder-node__number">{index < arenaIndex ? "✓" : String(index + 1).padStart(2, "0")}</span><span className="ladder-node__name">{character.name}</span><small>{character.badge}</small></button>)}</div><section className="arena-start"><div><span className="eyebrow">NEXT BATTLE</span><h3>{current.name}<small>{current.title}</small></h3></div><button className="primary-button" onClick={start}>{arenaIndex === characters.length - 1 ? "BOSSへ挑む" : "この階層へ"}<span>→</span></button></section></div>;
}

function renderNameEntry({ playerNames, setPlayerNames, navigate, startLocalMatch, openSettings }: { playerNames: { p1: string; p2: string }; setPlayerNames: (names: { p1: string; p2: string }) => void; navigate: (screen: Screen) => void; startLocalMatch: () => void; openSettings: (screen: Screen) => void }) {
  const onChange = (key: "p1" | "p2") => (event: ChangeEvent<HTMLInputElement>) => setPlayerNames({ ...playerNames, [key]: event.target.value.toUpperCase().slice(0, 12) });
  return <div className="screen-shell inner-shell"><ScreenTop title="LOCAL DUEL" subtitle="名前を決めて、端末を手渡そう" back={() => navigate("modeSelect")} openSettings={() => openSettings("nameEntry")} /><section className="name-entry"><div className="name-entry__intro"><span className="eyebrow">TWO PLAYERS / ONE STAGE</span><h2>同じ画面で、<br /><em>読み合う。</em></h2><p>選択後は目隠し画面をはさむので、相手の手は見えません。</p></div><label className="name-field name-field--one"><span>PLAYER 01</span><input value={playerNames.p1} onChange={onChange("p1")} aria-label="プレイヤー1の名前" placeholder="PLAYER 1" /></label><div className="versus-line"><b>VS</b><i /></div><label className="name-field name-field--two"><span>PLAYER 02</span><input value={playerNames.p2} onChange={onChange("p2")} aria-label="プレイヤー2の名前" placeholder="PLAYER 2" /></label><button className="primary-button primary-button--wide" onClick={startLocalMatch}>対戦をはじめる <span>→</span></button></section></div>;
}

function renderStats({ profile, navigate, openSettings }: { profile: PlayerProfile; navigate: (screen: Screen) => void; openSettings: (screen: Screen) => void }) {
  const winRate = profile.stats.totalMatches ? Math.round(profile.stats.wins / profile.stats.totalMatches * 100) : 0;
  return <div className="screen-shell inner-shell"><ScreenTop title="PLAYER LOG" subtitle="あなたの指先の記録" back={() => navigate("title")} openSettings={() => openSettings("stats")} /><section className="stats-hero"><span className="eyebrow">CAREER RECORD</span><div className="big-record"><strong>{profile.stats.wins.toString().padStart(2, "0")}</strong><span>WINS</span><i>/</i><strong>{profile.stats.totalMatches.toString().padStart(2, "0")}</strong><span>MATCHES</span></div><div className="stat-grid"><Metric label="WIN RATE" value={`${winRate}%`} /><Metric label="MAX STREAK" value={`${profile.stats.maxStreak}`} /><Metric label="ARENA BEST" value={`${profile.stats.arenaBest}/6`} /><Metric label="READS" value={`${profile.stats.correctCalls}`} /></div></section><section className="titles-section"><div className="section-label"><span>UNLOCKED TITLES</span><b>{profile.unlockedTitles.length}/8</b></div>{profile.unlockedTitles.length ? <div className="title-pills">{profile.unlockedTitles.map((title) => <span key={title}>{title}</span>)}</div> : <p className="empty-copy">試合を重ねると称号がアンロックされます。</p>}</section><section className="history-section"><div className="section-label"><span>RECENT BATTLES</span><b>{profile.recentMatches.length}</b></div>{profile.recentMatches.length ? <div className="history-list">{profile.recentMatches.slice(0, 5).map((item) => <div className="history-row" key={item.id}><span className={item.won ? "result-mark result-mark--win" : "result-mark result-mark--loss"}>{item.won ? "W" : "L"}</span><div><b>{item.opponentName}</b><small>{item.mode === "arena" ? "ARENA" : item.mode === "local" ? "LOCAL" : "QUICK"} · {item.rounds} ROUNDS</small></div><time>{new Date(item.playedAt).toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" })}</time></div>)}</div> : <p className="empty-copy">まだ対戦履歴はありません。</p>}</section></div>;
}

function renderHowTo({ navigate, openSettings }: { navigate: (screen: Screen) => void; openSettings: (screen: Screen) => void }) {
  const steps = [["01", "数字を宣言", "両者が出す親指の合計を予想して、0〜4の数字を宣言。"], ["02", "手を選ぶ", "0本・1本・2本から、自分が出す本数を選択。残り指が1本なら0か1だけ。"], ["03", "指スマ！", "カウントに合わせて両者の手を公開。合計と宣言が一致したら成功。"], ["04", "指を減らす", "成功した宣言側の親指が1本減少。外れたら手番が交代します。"], ["05", "先に0本へ", "自分の親指を先に0本にしたプレイヤーの勝利です。成功時は同じ手番が続きます。"]];
  return <div className="screen-shell inner-shell"><ScreenTop title="HOW TO PLAY" subtitle="見て、読んで、指スマ！" back={() => navigate("title")} openSettings={() => openSettings("howto")} /><section className="howto-intro"><span className="eyebrow">THE RULE IS SIMPLE</span><h2>数字と親指の、<br /><em>一瞬の読み合い。</em></h2></section><section className="howto-list">{steps.map(([number, title, copy]) => <article key={number} className="howto-step"><span>{number}</span><div><h3>{title}</h3><p>{copy}</p></div></article>)}</section><div className="rule-note"><b>TIP</b> 成功したら同じ手番が続く。外したら相手の番。流れを止めずに攻めよう。</div></div>;
}

function renderSettings({ profile, updateSettings, navigate, openReset, startTutorial }: { profile: PlayerProfile; updateSettings: (patch: Partial<GameSettings>) => void; navigate: () => void; openReset: () => void; startTutorial: () => void }) {
  return <div className="screen-shell inner-shell"><ScreenTop title="SETTINGS" subtitle="気持ちよく遊ぶための調整" back={navigate} /><section className="settings-list"><SettingToggle label="BGM" description="静かなステージ音を流す" checked={profile.settings.bgm} onChange={(checked) => updateSettings({ bgm: checked })} /><SettingToggle label="SFX" description="選択・公開・勝敗の効果音" checked={profile.settings.sfx} onChange={(checked) => updateSettings({ sfx: checked })} /><SettingToggle label="VIBRATION" description="対応端末で控えめに振動" checked={profile.settings.vibration} onChange={(checked) => updateSettings({ vibration: checked })} /><div className="setting-row setting-row--slider"><div><b>VOLUME</b><small>サウンド全体の音量</small></div><output>{Math.round(profile.settings.volume * 100)}%</output><input type="range" min="0" max="1" step="0.05" value={profile.settings.volume} onChange={(event) => updateSettings({ volume: Number(event.target.value) })} aria-label="音量" /></div><div className="setting-row setting-row--speed"><div><b>演出速度</b><small>カウントと結果演出のテンポ</small></div><div className="speed-buttons">{([["relaxed", "ゆっくり"], ["normal", "標準"], ["turbo", "テンポ" ]] as const).map(([value, label]) => <button key={value} className={profile.settings.speed === value ? "is-selected" : ""} onClick={() => updateSettings({ speed: value })}>{label}</button>)}</div></div></section><section className="settings-links"><button className="wide-link" onClick={startTutorial}><span>?</span><div><b>チュートリアルをもう一度</b><small>実際の対戦画面でルールを確認</small></div><strong>→</strong></button><button className="wide-link wide-link--danger" onClick={openReset}><span>!</span><div><b>保存データを初期化</b><small>戦績・称号・設定をリセット</small></div><strong>→</strong></button></section></div>;
}

function renderReset({ navigate, resetData }: { navigate: () => void; resetData: () => void }) {
  return <div className="screen-shell reset-screen"><div className="reset-sign">!</div><span className="eyebrow">DATA RESET</span><h2>本当に初期化しますか？</h2><p>戦績、称号、チュートリアル完了状態、設定がすべて消えます。この操作は元に戻せません。</p><div className="reset-actions"><button className="ghost-button" onClick={navigate}>キャンセル</button><button className="danger-button" onClick={resetData}>初期化する</button></div></div>;
}

function renderMatch({ match, opponent, presentation, handStates, navigate, openSettings, onCallSelected, onHandSelected, onHandPatternChanged, dispatchMatch, startCpuMatch, startLocalMatch, onNextArena }: { match: MatchState; opponent: ReturnType<typeof getCharacter>; presentation: Presentation; handStates: Record<PlayerId, ThumbPairState>; navigate: (screen: Screen) => void; openSettings: () => void; onCallSelected: (value: number) => void; onHandSelected: (value: number, pattern?: ThumbPattern) => void; onHandPatternChanged: (value: number, pattern: ThumbPattern) => void; dispatchMatch: (action: MatchAction) => void; startCpuMatch: (mode: "quick" | "arena" | "tutorial", opponentId: CharacterId, index?: number) => void; startLocalMatch: () => void; onNextArena: () => void }) {
  const result = match.resolution;
  const reveal = match.phase === "reveal" || match.phase === "judging" || match.phase === "roundResult" || match.phase === "matchResult";
  const selectingSide: PlayerId | null = match.phase === "playerChoosingHands" || match.phase === "playerResponding" ? "p1" : match.phase === "localChoosingHands" ? match.turn : match.phase === "localResponding" ? match.turn === "p1" ? "p2" : "p1" : null;
  const playerHandState = match.phase === "reveal" ? "revealing" : reveal ? result?.thumbLostBy === "p1" ? "lost" : result?.success ? "success" : "miss" : match.hands.p1 !== null ? "selected" : "idle";
  const cpuHandState = match.phase === "reveal" ? "revealing" : reveal ? result?.thumbLostBy === "p2" ? "lost" : result?.success ? "success" : "miss" : "idle";
  const selectableCalls = match.phase === "playerChoosingCall" ? legalCallValues(match.players[match.turn].thumbs, match.players[match.turn === "p1" ? "p2" : "p1"].thumbs) : [];
  const selectableHands = selectingSide ? legalHandValues(match.players[selectingSide].thumbs) : [];
  const handChoiceValue = selectingSide ? match.hands[selectingSide] : null;
  const handPreviewValue = selectingSide ? countRaisedThumbs(handStates[selectingSide].selectedThumbs) : null;
  const mood: CharacterMood = match.phase === "matchResult" ? match.winner === "p1" ? "defeat" : "victory" : result?.thumbLostBy === "p2" ? "frustrated" : result?.thumbLostBy === "p1" ? "confident" : match.players.p2.thumbs === 1 ? "pinch" : presentation === "declare" ? "confident" : "normal";
  const quote = match.phase === "matchResult" ? match.winner === "p1" ? opponent.quotes.defeat : opponent.quotes.victory : match.phase === "roundResult" ? result?.thumbLostBy === "p2" ? opponent.quotes.miss : result?.thumbLostBy === "p1" ? opponent.quotes.success : opponent.quotes.miss : match.players.p2.thumbs === 1 ? opponent.quotes.pinch : presentation === "declare" ? opponent.quotes.intro : opponent.quotes.intro;
  const quoteText = quote.length > 42 ? quote.slice(0, 42) + "…" : quote;
  const isLocalHandoff = match.phase === "handoff";
  const isResult = match.phase === "roundResult" || match.phase === "matchResult";
  const tutorialText = match.mode === "tutorial" ? getTutorialText(match) : null;
  const stageClass = "match-stage match-stage--" + presentation + (isResult ? " is-result" : "");
  const actionButtonLabel = match.mode === "local" || match.turn === "p2" ? "いっせーの！" : "指スマ！";
  const displayName = (player: PlayerId) => player === "p1" && match.mode !== "local" ? "あなた" : match.players[player].name;
  const activeName = selectingSide ? displayName(selectingSide) : displayName(match.turn);

  const continueRound = () => {
    if (match.phase === "roundResult") dispatchMatch({ type: "continue" });
  };
  const replay = () => {
    if (match.mode === "local") startLocalMatch();
    else startCpuMatch(match.mode, match.opponentId ?? "nagi", match.arenaIndex);
  };
  const exitResult = () => navigate(match.mode === "arena" ? "arena" : match.mode === "local" ? "modeSelect" : "characterSelect");

  return (
    <div className={stageClass}>
      <div className="duel-grid">
        <header className="match-topbar">
          <button className="match-exit" type="button" onClick={() => navigate("modeSelect")} aria-label="対戦をやめる">
            <span aria-hidden="true">←</span><b>戻る</b>
          </button>
          <div className="match-round"><span>ラウンド</span><strong>{String(match.round).padStart(2, "0")}</strong></div>
          <button className="icon-button match-settings" type="button" onClick={openSettings} aria-label="設定">⚙</button>
        </header>

        <main className="match-playfield">
          <section className="match-cpu" aria-label={match.players.p2.name + "のエリア"}>
            <div className="cpu-identity">
              <CharacterAvatar character={opponent} mood={mood} size="medium" />
              <div className="cpu-copy">
                <div className="cpu-name-row">
                  <h1>{match.players.p2.name}</h1>
                  <span className="match-remaining">残り <b>{match.players.p2.thumbs}</b></span>
                </div>
                <span className="cpu-title">{opponent.title}</span>
                <p className="cpu-bubble">「{quoteText}」</p>
              </div>
            </div>
            <div className="cpu-hand-block">
              <span className="hand-owner">相手の手</span>
              <HandGraphic side="p2" pairState={handStates.p2} masked={!reveal && selectingSide !== "p2"} state={cpuHandState} label={match.players.p2.name + "の手"} interactive={selectingSide === "p2"} onThumbToggle={onHandPatternChanged} />
            </div>
          </section>

          <section className="match-focus" aria-label="対戦の焦点">
            {isLocalHandoff ? (
              <div className="match-handoff">
                <span className="handoff-icon" aria-hidden="true">⇄</span>
                <b>端末を渡してね</b>
                <small>{match.players[match.turn === "p1" ? "p2" : "p1"].name}さんの番</small>
                <button className="primary-button" type="button" onClick={() => dispatchMatch({ type: "completeHandoff" })}>準備OK</button>
              </div>
            ) : isResult ? (
              match.phase === "roundResult" ? <ResultPanel match={match} onContinue={continueRound} /> : <MatchResultPanel match={match} onReplay={replay} onExit={exitResult} onNextArena={onNextArena} />
            ) : match.phase === "countdown" || match.phase === "reveal" ? (
              <div className="focus-countdown" aria-live="polite">
                <span>{presentation === "count1" ? "いっ" : presentation === "count2" ? "せーの" : "指スマ！"}</span>
                <small>手を公開</small>
              </div>
            ) : (
              <>
                <div className="focus-turn"><i aria-hidden="true" /><b>{match.phase === "cpuChoosingCall" ? match.players.p2.name + "の番" : activeName + "の番"}</b></div>
                <div className="focus-call">
                  <span>{match.phase === "playerChoosingCall" ? "合計はいくつ？" : match.phase === "cpuChoosingCall" ? "相手が考え中" : match.turn === "p1" ? "あなたの宣言" : "相手の宣言"}</span>
                  <strong>{match.call === null ? "—" : match.call}</strong>
                </div>
                <p className="focus-prompt">{match.phase === "cpuChoosingCall" ? "読みを組み立て中…" : match.phase === "playerChoosingCall" ? "数字を選ぼう" : selectingSide ? "出す本数を決めよう" : "準備ができたら公開"}</p>
              </>
            )}
          </section>

          <section className="match-player" aria-label={match.players.p1.name + "のエリア"}>
            <div className="player-bar">
              <div><strong>{displayName("p1")}</strong>{match.turn === "p1" && <span>あなたの番</span>}</div>
              <span className="match-remaining">残り <b>{match.players.p1.thumbs}</b></span>
            </div>
            <HandGraphic side="p1" pairState={handStates.p1} masked={!reveal && (match.mode === "local" ? selectingSide !== "p1" : selectingSide !== "p1" && match.hands.p1 === null)} state={playerHandState} label={match.players.p1.name + "の手"} interactive={selectingSide === "p1"} onThumbToggle={onHandPatternChanged} />
            {selectingSide === "p1" && <span className="hand-hint">手をタップして選ぶ</span>}
          </section>

          <Particles active={presentation === "success" || presentation === "victory"} variant={presentation === "victory" ? "victory" : "success"} />
        </main>

        <section className="interaction-deck" aria-label="対戦操作">
          {tutorialText && <div className="tutorial-bubble">{tutorialText}</div>}
          {isLocalHandoff || isResult ? null : selectableCalls.length > 0 ? (
            <div className="decision-panel">
              <div className="decision-heading"><b>合計を宣言</b><span>選べる数字</span></div>
              <div className="number-row">{selectableCalls.map((value) => <button type="button" key={value} className="number-choice" onClick={() => onCallSelected(value)}>{value}</button>)}</div>
            </div>
          ) : selectableHands.length > 0 ? (
            <div className="decision-panel decision-panel--hands">
              <div className="decision-heading"><b>{activeName}の親指</b><span>手をタップしても選べます</span></div>
              <div className="hand-options">{selectableHands.map((value) => <button type="button" key={value} className={"hand-option " + ((handChoiceValue ?? handPreviewValue) === value ? "is-selected" : "")} onClick={() => onHandSelected(value)}><span className="hand-option__marks" aria-hidden="true">{value === 0 ? "—" : value === 1 ? "↑" : "↑↑"}</span><b>{value}</b><small>本</small></button>)}</div>
            </div>
          ) : match.phase === "readyToReveal" ? (
            <div className="decision-panel decision-panel--ready">
              <button className="primary-button primary-button--reveal" type="button" onClick={() => dispatchMatch({ type: "startCountdown" })}>{actionButtonLabel}</button>
            </div>
          ) : match.phase === "cpuChoosingCall" ? (
            <div className="waiting-state"><i aria-hidden="true" /><b>相手の番</b><span>宣言を待っています</span></div>
          ) : match.phase === "countdown" || match.phase === "reveal" ? (
            <div className="waiting-state waiting-state--active"><i aria-hidden="true" /><b>公開中</b><span>手を合わせています</span></div>
          ) : (
            <div className="waiting-state"><i aria-hidden="true" /><b>次の動き</b><span>画面中央を見てください</span></div>
          )}
        </section>
      </div>
      <div className="match-live" aria-live="polite">{liveMessage(match, presentation)}</div>
    </div>
  );
}

function ResultPanel({ match, onContinue }: { match: MatchState; onContinue: () => void }) {
  const result = match.resolution;
  if (!result) return null;
  const good = result.success && result.thumbLostBy === "p2";
  return <div className={`result-panel ${good ? "result-panel--good" : result.success ? "result-panel--danger" : "result-panel--miss"}`}><div className="result-word">{result.success ? "一致！" : "はずれ"}</div><div className="result-equation" aria-label={`宣言${result.call}、合計${result.total}`}><b>{result.call}</b><span>{result.success ? "=" : "≠"}</span><strong>{result.total}</strong></div><p>{result.success ? `${result.thumbLostBy === "p1" ? "あなた" : "相手"}の親指が1本減った！` : "宣言は外れた。手番が交代します。"}</p><button className="text-button" onClick={onContinue}>次のラウンドへ <b>→</b></button></div>;
}

function MatchResultPanel({ match, onReplay, onExit, onNextArena }: { match: MatchState; onReplay: () => void; onExit: () => void; onNextArena: () => void }) {
  const won = match.winner === "p1";
  const arenaFinal = match.mode === "arena" && (match.arenaIndex ?? 0) === characters.length - 1 && won;
  return <div className={`match-result ${won ? "match-result--win" : "match-result--loss"}`}><span className="result-kicker">{won ? "勝負あり" : "もう一戦"}</span><div className="match-result__title">{won ? "勝利！" : "敗北"}</div><p>{won ? match.players.p1.name : match.players.p2.name}が先に親指を0本にしました。</p><div className="final-score"><span>{match.players.p1.thumbs}<small>{match.players.p1.name}</small></span><i>—</i><span>{match.players.p2.thumbs}<small>{match.players.p2.name}</small></span></div><div className="result-actions">{match.mode === "arena" && won && !arenaFinal ? <button className="primary-button" onClick={onNextArena}>次の対戦へ <span>→</span></button> : arenaFinal ? <button className="primary-button" onClick={onExit}>アリーナ制覇 <span>★</span></button> : <button className="primary-button" onClick={onReplay}>もう一度 <span>↻</span></button>}<button className="ghost-button" onClick={onExit}>{match.mode === "arena" ? "アリーナへ戻る" : "メニューへ戻る"}</button></div></div>;
}

function ScreenTop({ title, subtitle, back, openSettings }: { title: string; subtitle: string; back: () => void; openSettings?: () => void }) {
  return <header className="screen-top"><button className="back-link" onClick={back}><span>←</span> BACK</button><div><span>{title}</span><small>{subtitle}</small></div>{openSettings ? <button className="icon-button" onClick={openSettings} aria-label="設定">⚙</button> : <span className="screen-top__spacer" aria-hidden="true" />}</header>;
}

function SettingToggle({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return <div className="setting-row"><div><b>{label}</b><small>{description}</small></div><button className={`toggle ${checked ? "is-on" : ""}`} onClick={() => onChange(!checked)} aria-pressed={checked} aria-label={`${label}${checked ? "オン" : "オフ"}`}><span /></button></div>;
}

function Metric({ label, value }: { label: string; value: string }) { return <div className="metric"><span>{label}</span><b>{value}</b></div>; }

function phaseLabel(phase: MatchPhase, match: MatchState): string {
  if (phase === "playerChoosingCall") return `${match.players[match.turn].name}が数字を宣言`;
  if (phase === "cpuChoosingCall") return "相手が読みを組み立て中";
  if (phase === "playerChoosingHands" || phase === "localChoosingHands") return "出す親指の本数を選ぶ";
  if (phase === "playerResponding" || phase === "localResponding") return "手を伏せて本数を選ぶ";
  if (phase === "handoff") return "目隠し画面で端末を渡す";
  if (phase === "readyToReveal") return "準備完了。ボタンで公開";
  if (phase === "countdown" || phase === "reveal") return "カウント中";
  return "ラウンド結果";
}

function liveMessage(match: MatchState, presentation: Presentation): string {
  if (match.phase === "matchResult") return match.winner === "p1" ? "勝利。試合が終了しました。" : "敗北。試合が終了しました。";
  if (match.phase === "roundResult" && match.resolution) return match.resolution.success ? `成功。合計${match.resolution.total}で、${match.resolution.thumbLostBy === "p1" ? "あなた" : "相手"}の親指が減りました。` : `失敗。宣言${match.resolution.call}、合計${match.resolution.total}。`;
  if (presentation === "count1") return "いっ";
  if (presentation === "count2") return "せーの";
  if (presentation === "reveal") return "指スマ！ 手を公開しました。";
  return phaseLabel(match.phase, match);
}

function getTutorialText(match: MatchState): string {
  if (match.history.length === 0 && match.phase === "playerChoosingCall") return "合計だと思う数字を選ぼう";
  if (match.history.length === 0 && match.phase === "playerChoosingHands") return "上げる親指をタップ";
  if (match.phase === "readyToReveal" || match.phase === "countdown" || match.phase === "reveal") return "準備ができたら指スマ！";
  if (match.phase === "roundResult" && match.resolution?.success) return "成功すると親指が1本減るよ";
  if (match.phase === "matchResult") return "先に親指0本で勝ち";
  return "外れたら手番が交代";
}
