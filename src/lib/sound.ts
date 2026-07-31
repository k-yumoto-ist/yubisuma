import type { GameSettings } from "./types";

export type SoundName = "select" | "declare" | "count" | "reveal" | "success" | "miss" | "loseThumb" | "victory" | "defeat";

type AudioContextConstructor = typeof AudioContext;

export class AudioEngine {
  private context: AudioContext | null = null;
  private settings: GameSettings;
  private bgmOscillator: OscillatorNode | null = null;

  constructor(settings: GameSettings) {
    this.settings = settings;
  }

  setSettings(settings: GameSettings): void {
    this.settings = settings;
    if (!settings.bgm) this.stopBgm();
  }

  unlock(): void {
    if (typeof window === "undefined") return;
    if (!this.context) {
      const Context = (window.AudioContext ?? (window as Window & { webkitAudioContext?: AudioContextConstructor }).webkitAudioContext) as AudioContextConstructor | undefined;
      if (!Context) return;
      this.context = new Context();
    }
    if (this.context.state === "suspended") void this.context.resume();
    if (this.settings.bgm) this.startBgm();
  }

  play(name: SoundName): void {
    if (!this.settings.sfx) return;
    this.unlock();
    if (!this.context) return;
    const context = this.context;
    const now = context.currentTime;
    const gain = context.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.002, this.settings.volume * 0.12), now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + (name === "victory" || name === "defeat" ? 0.7 : 0.18));
    gain.connect(context.destination);
    const frequencies: Record<SoundName, number[]> = {
      select: [440],
      declare: [260, 520],
      count: [180],
      reveal: [330, 490],
      success: [520, 660, 880],
      miss: [220, 170],
      loseThumb: [160, 110],
      victory: [392, 523, 659, 784],
      defeat: [330, 247, 196]
    };
    frequencies[name].forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      oscillator.type = name === "miss" || name === "defeat" ? "triangle" : "sine";
      oscillator.frequency.setValueAtTime(frequency, now + index * 0.045);
      oscillator.connect(gain);
      oscillator.start(now + index * 0.045);
      oscillator.stop(now + (name === "victory" || name === "defeat" ? 0.68 : 0.2) + index * 0.045);
    });
  }

  startBgm(): void {
    if (!this.context || !this.settings.bgm || this.bgmOscillator) return;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = 92;
    gain.gain.value = Math.max(0.001, this.settings.volume * 0.018);
    oscillator.connect(gain);
    gain.connect(this.context.destination);
    oscillator.start();
    this.bgmOscillator = oscillator;
  }

  stopBgm(): void {
    if (!this.bgmOscillator) return;
    try {
      this.bgmOscillator.stop();
    } catch {
      // The oscillator may already be stopped.
    }
    this.bgmOscillator.disconnect();
    this.bgmOscillator = null;
  }
}

export function vibrate(pattern: number | number[], enabled: boolean): void {
  if (!enabled || typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
  navigator.vibrate(pattern);
}
