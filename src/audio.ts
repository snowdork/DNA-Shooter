/** Procedural swamp sounds: no downloads, and no audio before a player gesture. */
export class LabAudio {
  enabled = true;
  private active = false;
  private context?: AudioContext;
  private master?: GainNode;
  private atmosphere?: GainNode;
  private noise?: AudioBuffer;
  private voices = new Set<AudioScheduledSourceNode>();
  private ending?: ReturnType<typeof setTimeout>;
  private bubbleIn = .4;
  private tremorIn = 4;

  private init(): boolean {
    if (this.context) return true;
    try {
      const context = new AudioContext();
      this.context = context;
      const master = context.createGain(); master.gain.value = .38;
      const limiter = context.createDynamicsCompressor();
      limiter.threshold.value = -16; limiter.ratio.value = 8;
      master.connect(limiter); limiter.connect(context.destination); this.master = master;
      this.noise = context.createBuffer(1, context.sampleRate * 3, context.sampleRate);
      const samples = this.noise.getChannelData(0);
      for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
      const atmosphere = context.createGain(); atmosphere.gain.value = .12;
      atmosphere.connect(master); this.atmosphere = atmosphere;
      const gas = context.createBufferSource(); gas.buffer = this.noise; gas.loop = true;
      const filter = context.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 180;
      gas.connect(filter); filter.connect(atmosphere); gas.start();
      const drone = context.createOscillator(); drone.frequency.value = 43; drone.type = 'sine';
      const droneGain = context.createGain(); droneGain.gain.value = .2;
      drone.connect(droneGain); droneGain.connect(atmosphere); drone.start();
      return true;
    } catch { return false; }
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.setActive(this.active);
  }

  setActive(active: boolean): void {
    this.active = active;
    clearTimeout(this.ending);
    if (!active || !this.enabled) {
      this.clearVoices();
      void this.context?.suspend().catch(() => {});
      return;
    }
    if (!this.init()) return;
    this.atmosphere!.gain.value = .12;
    void this.context!.resume().catch(() => {});
  }

  private clearVoices(): void {
    for (const voice of this.voices) { try { voice.stop(); } catch { /* Already ended. */ } }
    this.voices.clear();
  }

  private tone(from: number, to: number, duration: number, volume: number, delay = 0, type: OscillatorType = 'sine'): void {
    if (!this.enabled || !this.active || !this.context || !this.master) return;
    const c = this.context, start = c.currentTime + delay;
    const oscillator = c.createOscillator(), gain = c.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(from, start);
    oscillator.frequency.exponentialRampToValueAtTime(to, start + duration);
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(volume, start + .025);
    gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
    oscillator.connect(gain); gain.connect(this.master);
    this.voices.add(oscillator);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); this.voices.delete(oscillator); };
    oscillator.start(start); oscillator.stop(start + duration + .02);
  }

  private gas(duration: number, volume: number, frequency: number): void {
    if (!this.enabled || !this.active || !this.context || !this.master || !this.noise) return;
    const c = this.context, start = c.currentTime;
    const source = c.createBufferSource(), filter = c.createBiquadFilter(), gain = c.createGain();
    source.buffer = this.noise;
    filter.type = 'bandpass'; filter.Q.value = 1.4;
    filter.frequency.setValueAtTime(frequency, start);
    filter.frequency.exponentialRampToValueAtTime(85, start + duration);
    gain.gain.setValueAtTime(0, start); gain.gain.linearRampToValueAtTime(volume, start + .04);
    gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
    source.connect(filter); filter.connect(gain); gain.connect(this.master);
    this.voices.add(source);
    source.onended = () => { source.disconnect(); filter.disconnect(); gain.disconnect(); this.voices.delete(source); };
    source.start(start, Math.random()); source.stop(start + duration + .02);
  }

  tick(dt: number): void {
    if (!this.enabled || !this.active) return;
    this.bubbleIn -= dt; this.tremorIn -= dt;
    if (this.bubbleIn <= 0) {
      this.bubbleIn = .35 + Math.random() * 1.3;
      const pitch = 220 + Math.random() * 380;
      this.tone(pitch, pitch * .32, .13 + Math.random() * .16, .1);
      if (Math.random() > .6) this.gas(.55, .12, 430);
    }
    if (this.tremorIn <= 0) {
      this.tremorIn = 5 + Math.random() * 5;
      this.tone(65, 29, 1.5, .2); this.gas(1.2, .14, 150);
    }
  }

  shoot(): void {
    this.tone(330, 75, .28, .22); this.gas(.23, .3, 1100);
  }
  grow(chromosome: boolean, variant: number): void {
    this.gas(chromosome ? 1.1 : .4, .3, 650);
    this.tone(85, 180 + variant * 35, .45, .26);
    this.tone(420, 120, .16, .16, .12);
    if (chromosome) {
      this.tone(42, 65, 1.2, .3);
      for (let i = 0; i < 4; i++) this.tone(130 + i * 45, 240 + i * 60, .5, .12, i * .16);
    }
  }
  finish(won: boolean): void {
    if (won) this.grow(true, 3);
    else { this.tone(95, 25, 1.5, .4); this.gas(1.4, .4, 700); }
    this.active = false;
    if (this.atmosphere) this.atmosphere.gain.value = 0;
    clearTimeout(this.ending);
    this.ending = setTimeout(() => this.setActive(false), 1800);
  }
}
