import { type Pair } from './model';
import { pairVoice, patternSignature } from './sound-signature';

/** Procedural lab soundscape: no downloads, and no audio before a player gesture. */
export class LabAudio {
  enabled = true;
  private active = false;
  private context?: AudioContext;
  private master?: GainNode;
  private atmosphere?: GainNode;
  private noise?: AudioBuffer;
  private room?: GainNode;
  private roomNodes: AudioNode[] = [];
  private voices = new Set<AudioScheduledSourceNode>();
  private ending?: ReturnType<typeof setTimeout>;
  private bubbleIn = .4;
  private tremorIn = 4;

  private init(): boolean {
    if (this.context) return true;
    try {
      const c = new AudioContext(); this.context = c;
      const master = c.createGain(); master.gain.value = .36;
      const limiter = c.createDynamicsCompressor();
      limiter.threshold.value = -18; limiter.knee.value = 20; limiter.ratio.value = 6;
      limiter.attack.value = .006; limiter.release.value = .22;
      master.connect(limiter); limiter.connect(c.destination); this.master = master;
      this.noise = c.createBuffer(1, c.sampleRate * 3, c.sampleRate);
      const brown = c.createBuffer(1, c.sampleRate * 3, c.sampleRate);
      const whiteSamples = this.noise.getChannelData(0), brownSamples = brown.getChannelData(0);
      let pressure = 0;
      for (let i = 0; i < whiteSamples.length; i++) {
        const white = Math.random() * 2 - 1;
        whiteSamples[i] = white; pressure = (pressure + white * .02) / 1.02;
        brownSamples[i] = pressure * 3.5;
      }
      const atmosphere = c.createGain(); atmosphere.gain.value = .2;
      const drift = c.createStereoPanner();
      atmosphere.connect(drift); drift.connect(master); this.atmosphere = atmosphere;
      const pan = c.createOscillator(), panDepth = c.createGain();
      pan.frequency.value = .045; panDepth.gain.value = .45;
      pan.connect(panDepth); panDepth.connect(drift.pan); pan.start();
      const bed = c.createBufferSource(); bed.buffer = brown; bed.loop = true;
      const filter = c.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 145; filter.Q.value = .6;
      bed.connect(filter); filter.connect(atmosphere); bed.start();
      const breathe = c.createOscillator(), depth = c.createGain();
      breathe.frequency.value = .09; depth.gain.value = 65;
      breathe.connect(depth); depth.connect(filter.frequency); breathe.start();
      const air = c.createBufferSource(); air.buffer = this.noise; air.loop = true;
      const mist = c.createBiquadFilter(), mistGain = c.createGain();
      mist.type = 'bandpass'; mist.frequency.value = 480; mist.Q.value = .65; mistGain.gain.value = .12;
      air.connect(mist); mist.connect(mistGain); mistGain.connect(atmosphere); air.start();
      for (const [frequency, volume] of [[43, .15], [57.5, .045]]) {
        const drone = c.createOscillator(), gain = c.createGain();
        drone.frequency.value = frequency; gain.gain.value = volume;
        drone.connect(gain); gain.connect(atmosphere); drone.start();
      }
      return true;
    } catch { return false; }
  }
  private clearRoom(): void {
    for (const node of this.roomNodes) node.disconnect();
    this.roomNodes = []; this.room = undefined;
  }
  private makeRoom(): void {
    if (this.room || !this.context || !this.master) return;
    const c = this.context, send = c.createGain(), delay = c.createDelay(.5);
    const filter = c.createBiquadFilter(), feedback = c.createGain(), wet = c.createGain();
    send.gain.value = .7; delay.delayTime.value = .19;
    filter.type = 'lowpass'; filter.frequency.value = 1900;
    feedback.gain.value = .18; wet.gain.value = .15;
    send.connect(delay); delay.connect(filter); filter.connect(feedback); feedback.connect(delay);
    filter.connect(wet); wet.connect(this.master);
    this.room = send; this.roomNodes = [send, delay, filter, feedback, wet];
  }
  setEnabled(enabled: boolean): void {
    this.enabled = enabled; this.setActive(this.active);
  }
  setActive(active: boolean): void {
    this.active = active; clearTimeout(this.ending);
    if (!active || !this.enabled) {
      this.clearVoices(); this.clearRoom();
      void this.context?.suspend().catch(() => {}); return;
    }
    if (!this.init()) return;
    this.makeRoom();
    const now = this.context!.currentTime;
    this.atmosphere!.gain.cancelScheduledValues(now);
    this.atmosphere!.gain.setValueAtTime(0, now);
    this.atmosphere!.gain.linearRampToValueAtTime(.2, now + .35);
    void this.context!.resume().catch(() => {});
  }
  private clearVoices(): void {
    for (const voice of this.voices) { try { voice.stop(); } catch { /* Already ended. */ } }
    this.voices.clear();
  }
  private tone(from: number, to: number, duration: number, volume: number, delay = 0, type: OscillatorType = 'sine', pan = 0): void {
    if (!this.enabled || !this.active || !this.context || !this.master) return;
    const c = this.context, start = c.currentTime + delay;
    const oscillator = c.createOscillator(), gain = c.createGain(), position = c.createStereoPanner();
    oscillator.type = type; position.pan.value = pan;
    oscillator.frequency.setValueAtTime(from, start);
    oscillator.frequency.exponentialRampToValueAtTime(to, start + duration);
    gain.gain.setValueAtTime(0, start); gain.gain.linearRampToValueAtTime(volume, start + .018);
    gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
    oscillator.connect(gain); gain.connect(position); position.connect(this.master);
    if (this.room) position.connect(this.room);
    this.voices.add(oscillator);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); position.disconnect(); this.voices.delete(oscillator); };
    oscillator.start(start); oscillator.stop(start + duration + .02);
  }
  private gas(duration: number, volume: number, frequency: number, delay = 0, pan = 0): void {
    if (!this.enabled || !this.active || !this.context || !this.master || !this.noise) return;
    const c = this.context, start = c.currentTime + delay;
    const source = c.createBufferSource(), filter = c.createBiquadFilter(), gain = c.createGain(), position = c.createStereoPanner();
    source.buffer = this.noise; position.pan.value = pan;
    filter.type = 'bandpass'; filter.Q.value = .8;
    filter.frequency.setValueAtTime(frequency, start); filter.frequency.exponentialRampToValueAtTime(85, start + duration);
    gain.gain.setValueAtTime(0, start); gain.gain.linearRampToValueAtTime(volume, start + .035);
    gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
    source.connect(filter); filter.connect(gain); gain.connect(position); position.connect(this.master);
    if (this.room) position.connect(this.room);
    this.voices.add(source);
    source.onended = () => { source.disconnect(); filter.disconnect(); gain.disconnect(); position.disconnect(); this.voices.delete(source); };
    source.start(start, Math.random()); source.stop(start + duration + .02);
  }
  tick(dt: number): void {
    if (!this.enabled || !this.active) return;
    this.bubbleIn -= dt; this.tremorIn -= dt;
    if (this.bubbleIn <= 0) {
      this.bubbleIn = .55 + Math.random() * 1.45;
      const pitch = 180 + Math.random() * 400, pan = Math.random() * 1.4 - .7;
      this.tone(pitch, pitch * .4, .18, .07, 0, 'sine', pan);
      if (Math.random() > .45) this.tone(pitch * 1.3, pitch * .6, .13, .045, .09, 'sine', pan * -.7);
      if (Math.random() > .7) this.gas(.65, .07, 500, .08, pan);
    }
    if (this.tremorIn <= 0) {
      this.tremorIn = 6 + Math.random() * 6;
      this.tone(58, 28, 1.6, .16); this.gas(1.3, .1, 160);
    }
  }
  shoot(): void {
    this.tone(350, 72, .24, .19); this.gas(.3, .25, 1200);
    this.tone(130, 55, .12, .12, .08);
  }
  grow(pair: Pair, pattern?: readonly Pair[]): void {
    const voice = pairVoice(pair), pan = pair.includes('A') ? -.25 : .25;
    this.gas(pattern ? .95 : .48, .2, 740, 0, pan);
    this.tone(62, 115, .6, .2);
    this.tone(voice.frequency, voice.frequency, voice.duration, .16, .1, voice.type, pan);
    this.tone(voice.frequency * 2, voice.frequency * 2, .22, .025, .13, 'sine', -pan);
    if (pattern) {
      const signature = patternSignature(pattern);
      this.tone(40, 62, 1.1, .2);
      pattern.forEach((basePair, i) => {
        const note = pairVoice(basePair);
        this.tone(signature.motif[i], signature.motif[i], .38, .11, .3 + i * .15, note.type, (i - 1.5) * .2);
      });
      this.tone(signature.frequency, signature.frequency, .95, .17, .98, 'triangle');
      this.tone(signature.frequency * 1.5, signature.frequency * 1.5, .75, .045, 1.02);
    }
  }
  finish(won: boolean): void {
    if (won) {
      for (const [i, pitch] of [523.251, 659.255, 783.991].entries()) this.tone(pitch, pitch, .65, .09, 1.9 + i * .17, 'triangle');
    } else { this.tone(95, 25, 1.5, .35); this.gas(1.4, .3, 700); }
    this.active = false;
    if (this.atmosphere && this.context) {
      const now = this.context.currentTime;
      this.atmosphere.gain.cancelScheduledValues(now);
      this.atmosphere.gain.setValueAtTime(this.atmosphere.gain.value, now);
      this.atmosphere.gain.linearRampToValueAtTime(0, now + .4);
    }
    clearTimeout(this.ending); this.ending = setTimeout(() => this.setActive(false), won ? 3400 : 2000);
  }
}
