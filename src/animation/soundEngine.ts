/**
 * Procedural Web Audio API synthesizer for the Squid Game title card sequence.
 * Generates zero-dependency tension drones, geometric lock-in percussion ticks,
 * and an eerie wooden-flute + sub-bass impact sting on the Pink Ignition beat.
 */
export class SquidSoundEngine {
  private ctx: AudioContext | null = null;
  private enabled = false;
  private firedCues = new Set<string>();

  public isEnabled(): boolean {
    return this.enabled;
  }

  public setEnabled(next: boolean): void {
    this.enabled = next;
    if (next) {
      this.ensureContext();
      if (this.ctx && this.ctx.state === 'suspended') {
        void this.ctx.resume();
      }
    }
  }

  public resetCues(currentTime = 0): void {
    this.firedCues.clear();
    // Mark cues already behind the playhead so scrubbing forward doesn't fire past hits
    const thresholds: Array<[string, number]> = [
      ['circle', 0.14],
      ['triangle', 0.5],
      ['square', 0.86],
      ['morph', 1.78],
      ['assemble', 2.6],
      ['reveal', 4.38],
    ];
    for (const [key, t] of thresholds) {
      if (currentTime > t + 0.08) {
        this.firedCues.add(key);
      }
    }
  }

  public tick(time: number, isPlaying: boolean): void {
    if (!this.enabled || !isPlaying) return;
    this.ensureContext();
    if (!this.ctx || this.ctx.state !== 'running') return;

    this.triggerOnce('circle', time, 0.14, () => this.playGeometricTick(293.66, 0.14)); // D4
    this.triggerOnce('triangle', time, 0.5, () => this.playGeometricTick(349.23, 0.14)); // F4
    this.triggerOnce('square', time, 0.86, () => this.playGeometricTick(440.0, 0.16)); // A4
    this.triggerOnce('morph', time, 1.78, () => this.playMorphSwell());
    this.triggerOnce('assemble', time, 2.6, () => this.playAssemblePulse());
    this.triggerOnce('reveal', time, 4.38, () => this.playRevealSting());
  }

  public dispose(): void {
    if (this.ctx) {
      void this.ctx.close();
      this.ctx = null;
    }
    this.firedCues.clear();
  }

  private ensureContext(): void {
    if (typeof window === 'undefined') return;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
  }

  private triggerOnce(key: string, time: number, threshold: number, fn: () => void): void {
    if (time >= threshold && !this.firedCues.has(key)) {
      this.firedCues.add(key);
      fn();
    }
  }

  private playGeometricTick(freq: number, gainPeak: number): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.96, now + 0.18);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(gainPeak, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.26);
  }

  private playMorphSwell(): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(73.42, now); // D2
    osc.frequency.linearRampToValueAtTime(110.0, now + 0.85);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(180, now);
    filter.frequency.exponentialRampToValueAtTime(720, now + 0.75);
    filter.frequency.exponentialRampToValueAtTime(160, now + 1.15);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.11, now + 0.45);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 1.25);
  }

  private playAssemblePulse(): void {
    if (!this.ctx) return;
    const notes = [293.66, 293.66, 329.63, 349.23]; // Eerie minimal rhythm
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const start = this.ctx.currentTime + idx * 0.34;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.linearRampToValueAtTime(0.075, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(start);
      osc.stop(start + 0.28);
    });
  }

  private playRevealSting(): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // 1. Deep cinematic sub-bass impact boom
    const sub = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(125, now);
    sub.frequency.exponentialRampToValueAtTime(38, now + 0.55);

    subGain.gain.setValueAtTime(0.0001, now);
    subGain.gain.linearRampToValueAtTime(0.32, now + 0.015);
    subGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.6);

    sub.connect(subGain);
    subGain.connect(this.ctx.destination);
    sub.start(now);
    sub.stop(now + 1.65);

    // 2. Eerie recorder-inspired detuned minor chord sting (D5 + F5 + A5)
    const freqs = [587.33, 698.46, 880.0];
    freqs.forEach((f, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now);
      osc.detune.setValueAtTime(idx === 1 ? -9 : idx === 2 ? 7 : 0, now);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(f * 1.15, now);
      filter.Q.setValueAtTime(2.4, now);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.065, now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.2);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 2.3);
    });
  }
}
