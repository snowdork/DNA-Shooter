import Phaser from 'phaser';
import { LabAudio } from './audio';
import { animateCreature } from './motion';
import { creatureState } from './creature-state';
import { COLORS } from './bases';
import { Creation, Controls, bodyPlan, developmentStage, missedChain, SLOTS, TOTAL_SEGMENTS, type Base, type Pair, type Mutation } from './model';

export const W = 1280;
export const H = 650;
const ENTRY_OFFSET = -290;
const EXIT_Y = 580;
const CELEBRATION_SECONDS = 1;
const COMPLETION_DRIFT_SPEED = 250;
export interface GameHooks {
  changed: () => void;
  notice: (text: string) => void;
}
type Point = { x: number; y: number };
export type CompletionPhase = 'idle' | 'celebrating' | 'drifting';

/** Phaser owns the loop and scaling; the creation model remains renderer-independent. */
export class Field extends Phaser.Scene {
  creation: Creation;
  controls = new Controls();
  labAudio = new LabAudio();
  paused = true;
  failed = false;
  reduced = false;
  elapsed = 0;
  offset = ENTRY_OFFSET;
  aligned = false;
  transition = 0;
  celebration = 0;
  linkedSegment: number | null = null;
  shownSegment = 0;
  burst = 0;
  shotTime = 0;
  shotOrigins: Point[] = [];
  aspectCorrection = 1;
  private dropTarget: number | null = null;
  private frame!: Phaser.Textures.CanvasTexture;
  private frameImage!: Phaser.GameObjects.Image;
  private ctx!: CanvasRenderingContext2D;
  private hooks: GameHooks;
  private lastReady = false;
  private background!: HTMLCanvasElement;
  private presentPending = false;
  private slotPositions: Point[] = Array.from({ length: SLOTS }, () => ({ x: 0, y: 0 }));
  private strandPoints: Point[][] = Array.from({ length: 2 }, () => Array.from({ length: 150 }, () => ({ x: 0, y: 0 })));

  constructor(creation: Creation, hooks: GameHooks) {
    super('CreationField'); this.creation = creation; this.hooks = hooks;
    this.shownSegment = creation.active;
  }
  get completionPhase(): CompletionPhase {
    return !this.transition ? 'idle' : this.celebration > 0 ? 'celebrating' : 'drifting';
  }
  create(): void {
    this.frame = this.textures.createCanvas('field', W, H)!;
    this.ctx = this.frame.context;
    this.frameImage = this.add.image(0, 0, 'field').setOrigin(0);
    this.background = this.cacheLayer(W, H, () => this.drawBackground());
    this.scale.on(Phaser.Scale.Events.RESIZE, this.resizeField, this);
    this.resizeField();

    this.game.events.once(Phaser.Core.Events.POST_RENDER, () => {
      this.scale.getParentBounds(); this.scale.refresh();
      if (this.paused) this.game.loop.sleep();
    });
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const x = pointer.x * W / this.scale.gameSize.width;
      const y = pointer.y * H / this.scale.gameSize.height;
      if (x < 184 || x > 576) return;
      this.target(this.chainAt(x, y));
    });
    this.draw();
  }
  private resizeField(): void {
    const { width, height } = this.scale.gameSize;
    if (this.frame.width === width && this.frame.height === height) { this.repaint(); return; }
    this.aspectCorrection = (width / W) / (height / H);
    this.frame.setSize(width, height);
    this.frameImage.setSizeToFrame().setDisplaySize(width, height);
    this.repaint(); this.hooks.changed();
  }
  chainAt(x: number, y: number, emptyOnly = false): number | null {
    if (x < 184 || x > 576 || y < 34 || y >= EXIT_Y) return null;
    const slot = this.positions().findIndex((p, i) => p.y >= 49 && p.y < EXIT_Y
      && Math.abs(p.x - x) < this.helixRadius(p.y) + 12 && Math.abs(p.y - y) < 40
      && (!emptyOnly || !this.creation.segments[this.creation.active][i]));
    return slot < 0 ? null : slot;
  }
  highlightDrop(slot: number | null): void {
    if (this.dropTarget === slot) return;
    this.dropTarget = slot;
    if (this.paused) this.repaint();
  }
  reset(creation: Creation): void {
    this.labAudio.setActive(false);
    this.creation = creation; this.failed = false; this.controls.cancel(); this.offset = ENTRY_OFFSET; this.elapsed = 0;
    this.shownSegment = creation.active; this.transition = 0; this.celebration = 0; this.linkedSegment = null; this.burst = 0;
    this.aligned = false; this.lastReady = false; this.shotTime = 0;
    this.dropTarget = null; this.shotOrigins = [];
    this.repaint(); this.hooks.changed();
  }
  setPause(value: boolean): void {
    if (!value && (this.failed || this.creation.done && !this.transition)) return;
    this.paused = value;
    this.labAudio.setActive(!value);
    this.controls.queued = false;
    this.repaint();
    if (value) this.game.loop.sleep();
    else this.game.loop.wake();
    this.hooks.changed();
  }
  setReduced(value: boolean): void {
    this.reduced = value;
    this.repaint();
  }
  cancelLock(): void {
    this.controls.cancelLock(); this.aligned = false;
    this.repaint(); this.hooks.changed();
  }
  preparePair(pair: Pair): boolean {
    if (this.paused || this.creation.done || this.failed || this.transition || this.controls.flight) return false;
    this.controls.cancel();
    this.controls.setBase(pair[0] as Base, 0); this.controls.setBase(pair[1] as Base, 1);
    this.aligned = false;
    this.hooks.notice(`${pair} ready — drag this pair onto an empty chain, or click a chain. UP ${pair[0]}, DOWN ${pair[1]}.`);
    this.hooks.changed(); return true;
  }
  target(slot: number | null): void {
    if (this.paused || this.creation.done || this.failed || this.transition) return;
    let result = this.controls.click(slot, i => !this.creation.segments[this.creation.active][i]);
    if (result === 'locked') result = this.controls.click(slot, i => !this.creation.segments[this.creation.active][i]);
    if (result === 'queued') this.hooks.notice(this.aligned ? 'Launching pair…' : 'Shot queued — waiting for the chain to enter…');
    else if (!this.controls.pair && !this.controls.flight) this.hooks.notice('Choose TA, AT, CG, or GC before choosing a chain.');
    this.hooks.changed();
  }

  positions(): Point[] {
    for (let i = 0; i < SLOTS; i++) {
      this.slotPositions[i].y = 130 + i * 88 + this.offset;
      this.slotPositions[i].x = this.helixCenter(this.slotPositions[i].y);
    }
    return this.slotPositions;
  }

  update(_time: number, delta: number): void {
    if (this.paused || this.failed) return;
    const dt = Math.min(delta / 1000, .05);
    this.elapsed += dt;
    this.labAudio.tick(dt);
    if (!this.transition && !this.creation.done) this.offset = this.offset < 0 ? Math.min(0, this.offset + dt * 170) : this.offset + dt * (6 + this.creation.completed * .12);
    this.burst = Math.max(0, this.burst - dt);
    this.advanceTransition(dt);
    if (!this.transition && !this.creation.done) {
      const missed = missedChain(this.creation.segments[this.shownSegment], this.positions().map(p => p.y), EXIT_Y);
      if (missed !== null) {
        this.labAudio.finish(false);
        this.failed = true; this.controls.cancel(); this.paused = true; this.dropTarget = null;
        this.hooks.notice(`Containment failed: empty chain ${missed + 1} of the quadra-chrome reached the bottom. Restart required.`);
        this.draw(); this.hooks.changed(); this.game.loop.sleep(); return;
      }
    }
    const lock = this.controls.target;
    const target = lock === null ? null : this.positions()[lock];
    this.aligned = !!target && target.y >= 49 && target.y < EXIT_Y;
    if (this.aligned !== this.lastReady) { this.lastReady = this.aligned; this.hooks.changed(); }
    if (this.controls.launch(this.aligned)) {
      this.labAudio.shoot();
      const pair = this.controls.flight!.pair;
      const originX = pair.includes('A') ? 82 : 680;
      const originY = pair === 'TA' || pair === 'CG' ? 210 : 380;
      this.shotOrigins = [{ x: originX - 12, y: originY }, { x: originX + 12, y: originY }]; this.shotTime = 0; this.hooks.changed();
    }
    if (this.controls.flight) {
      this.shotTime += dt;
      if (this.shotTime >= .48) {
        const flight = this.controls.flight;
        const before = this.creation.completed;
        this.creation.place(flight.slot, flight.pair);
        const completedPattern = this.creation.completed > before ? this.creation.adaptations.at(-1)!.pattern : undefined;
        this.labAudio.grow(flight.pair, completedPattern);
        if (this.creation.done) this.labAudio.finish(true);
        this.controls.cancel(); this.burst = .7;
        const latestMutation = this.creation.mutations.at(-1)!;
        this.hooks.notice(`Mutation ${latestMutation.id}: ${latestMutation.name} — ${flight.pair} on rung ${flight.slot + 1}.`);
        if (this.creation.completed > before) {
          this.celebration = CELEBRATION_SECONDS;
          this.transition = CELEBRATION_SECONDS + (H + 44 - this.positions()[0].y) / COMPLETION_DRIFT_SPEED;
          this.linkedSegment = null; this.dropTarget = null;
          this.hooks.notice(`Quadra-chrome complete! ${latestMutation.name} mutation — shaking and glimmering with sparks.`);
        }
        this.hooks.changed();
      }
    }
    this.draw();
    if (this.creation.done && !this.transition && !this.burst) this.game.loop.sleep();
  }
  private advanceTransition(dt: number): void {
    if (!this.transition) return;
    const celebrating = this.celebration > 0;
    const heldTime = Math.min(dt, this.celebration);
    this.celebration = Math.max(0, this.celebration - dt);
    // Hold the whole set for its celebration, then let all four pairs drift out together.
    this.offset += (dt - heldTime) * COMPLETION_DRIFT_SPEED;
    this.transition = Math.max(0, this.transition - dt);
    if (!this.transition) {
      this.linkedSegment = this.shownSegment;
      if (this.creation.done) this.hooks.notice('Genome complete! All quadra-chromes have joined the master chain.');
      else {
        this.shownSegment = this.creation.active; this.offset = ENTRY_OFFSET;
        this.hooks.notice('New quadra-chrome approaching the canal. Fill all four chains before they reach the bottom.');
      }
      this.hooks.changed();
    } else if (celebrating && !this.celebration) {
      this.hooks.notice('Quadra-chrome complete — drifting down to the master chain…'); this.hooks.changed();
    }
  }
  private round(x: number, y: number, w: number, h: number, radius = 12): void {
    this.ctx.beginPath(); this.ctx.roundRect(x, y, w, h, radius);
  }
  private line(points: Point[], color: string, width: number, glow = 0): void {
    const c = this.ctx; c.save(); c.strokeStyle = color; c.lineWidth = width;
    c.shadowColor = color; c.shadowBlur = glow; c.lineCap = 'round';
    c.beginPath(); points.forEach((p, i) => i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y)); c.stroke(); c.restore();
  }
  private ellipse(x: number, y: number, rx: number, ry: number, fill: string | CanvasGradient, stroke?: string): void {
    const c = this.ctx; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    c.fillStyle = fill; c.fill(); if (stroke) { c.strokeStyle = stroke; c.lineWidth = 2; c.stroke(); }
  }
  private text(text: string, x: number, y: number, size: number, color: string, align: CanvasTextAlign = 'left', preserveAspect = true): void {
    const c = this.ctx; c.save(); c.translate(x, y); c.scale(1, preserveAspect ? this.aspectCorrection : 1);
    c.font = `${size >= 22 ? 700 : 500} ${size}px "Trebuchet MS", sans-serif`;
    c.fillStyle = color; c.textAlign = align; c.fillText(text, 0, 0); c.restore();
  }
  private cacheLayer(width: number, height: number, paint: () => void): HTMLCanvasElement {
    const layer = document.createElement('canvas');
    layer.width = width; layer.height = height;
    const current = this.ctx;
    this.ctx = layer.getContext('2d')!;
    paint();
    this.ctx = current;
    return layer;
  }
  private drawBackground(): void {
    const c = this.ctx;
    const bg = c.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#0b142c'); bg.addColorStop(.55, '#080d20'); bg.addColorStop(1, '#072c25');
    c.fillStyle = bg; c.fillRect(0, 0, W, H);
    // Restrained laboratory geometry and starlike dust behind the action.
    c.lineWidth = 1;
    for (let x = 0; x < W; x += 40) { c.strokeStyle = '#29426b18'; c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H); c.stroke(); }
    for (let y = 0; y < H; y += 40) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
  }
  private repaint(): void {
    if (!this.ctx) return;
    this.draw();
    // The scene is a single canvas image. Present it directly while sleeping;
    // Phaser's normal renderer owns presentation again as soon as play resumes.
    if ((this.paused || !this.game.loop.running) && !this.presentPending) {
      this.presentPending = true;
      requestAnimationFrame(() => {
        this.presentPending = false;
        if (!this.paused && this.game.loop.running) return;
        if (!this.frame.canvas.width || !this.frame.canvas.height || !this.game.canvas.width || !this.game.canvas.height) return;
        const display = this.game.canvas.getContext('2d')!;
        display.save(); display.setTransform(1, 0, 0, 1, 0, 0);
        display.globalAlpha = 1; display.globalCompositeOperation = 'source-over';
        display.drawImage(this.frame.canvas, 0, 0, this.game.canvas.width, this.game.canvas.height);
        display.restore();
      });
    }
  }
  private draw(): void {
    if (!this.ctx) return;
    const c = this.ctx;
    c.setTransform(this.frame.width / W, 0, 0, this.frame.height / H, 0, 0);
    // The opaque cached background also clears the previous frame.
    c.drawImage(this.background, 0, 0);
    for (let i = 0; i < 44; i++) {
      const x = (i * 173 + 23) % W, y = (i * 97 + 17) % 590;
      const alpha = .15 + .12 * Math.sin(this.elapsed + i);
      this.ellipse(x, y, i % 5 === 0 ? 2 : 1, i % 5 === 0 ? 2 : 1, `rgba(110,205,255,${alpha})`);
    }
    this.drawCreature(); this.drawHelix(); this.drawShot();
    if (this.failed || this.creation.done && !this.transition) {
      c.fillStyle = '#040b15dc'; c.fillRect(210, 225, 340, 155);
      this.text(this.failed ? 'CONTAINMENT FAILED' : 'GENOME COMPLETE', 380, 280, 23, this.failed ? '#ff8b9f' : '#b9ef9c', 'center');
      this.text(this.failed ? 'An empty chain reached the bottom.' : `${TOTAL_SEGMENTS} quadra-chromes. One wild Mutagon.`, 380, 315, 14, '#d8e8ef', 'center');
      this.text('Use Restart to begin a new experiment', 380, 345, 13, '#8daab9', 'center');
    }
    this.frame.refresh();
  }
  private drawCreature(): void {
    const c = this.ctx, mutations = this.creation.mutations, latest = mutations.at(-1);
    const chamber = c.createRadialGradient(1010, 330, 20, 1010, 330, 340);
    chamber.addColorStop(0, '#1a3941'); chamber.addColorStop(1, '#0f1e2c');
    this.round(775, 22, 485, 574, 22); c.fillStyle = chamber; c.fill(); c.strokeStyle = '#6ea8b866'; c.stroke();
    const state = creatureState(mutations);
    const motion = animateCreature(state.motion, this.elapsed, this.reduced);
    if (latest && this.burst > 0 && !this.reduced) {
      const previous = animateCreature(state.previousMotion, this.elapsed);
      const blend = 1 - this.burst / .7;
      for (const key of ['tempo', 'drift', 'bob', 'tilt', 'shear', 'scaleX', 'scaleY', 'gaze'] as const) {
        motion[key] = previous[key] + (motion[key] - previous[key]) * blend;
      }
    }
    c.save(); c.beginPath(); c.rect(785, 34, 465, 548); c.clip();
    const x = 1010, y = 307;
    const growthCount = mutations.length - (latest && !this.reduced ? this.burst / .7 : 0);
    const maturity = Math.max(0, growthCount) / (TOTAL_SEGMENTS * SLOTS);
    const growth = .48 + .52 * Math.sqrt(maturity);
    this.ellipse(x, y + 100, (150 + motion.bob) * growth, 17 * growth, '#55ef8120');
    c.translate(x + motion.drift, y + 45 + motion.bob);
    c.rotate(motion.tilt); c.transform(1, 0, motion.shear, 1, 0, 0);
    const creatureScale = Math.min(1.5, 1.5 / this.aspectCorrection) * growth;
    c.scale(creatureScale * motion.scaleX, creatureScale * this.aspectCorrection * motion.scaleY); c.translate(-x, -y - 45);
    const radius = 67 + 22 * maturity, height = 55 + 14 * maturity;
    const anatomy = this.creation.mutationVersion >= 4 ? state.current : state;
    const body = new Path2D(); body.moveTo(x - radius, y + 36);
    body.bezierCurveTo(x - radius - 12, y - 20, x - radius * .7, y - height, x - 12, y - height);
    body.bezierCurveTo(x + radius * .9, y - height - 15, x + radius + 22, y - 9, x + radius, y + 36);
    body.bezierCurveTo(x + radius * .75, y + 65, x - radius * .8, y + 65, x - radius, y + 36);
    body.closePath();
    // Each hit persists in history; repeated traits grow new colored variants.
    const families = new Map<string, number>();
    for (const m of anatomy.appendages) {
      const n = families.get(m.kind) ?? 0; families.set(m.kind, n + 1);
      this.mutationStyle(m, latest, x, y, () => {
        const sway = this.reduced ? 0 : Math.sin(this.elapsed * (2 + motion.tempo * .3 + m.id % 5 * .2) + m.variant) * (m.kind === 'wings' ? 11 : m.kind === 'tail' || m.kind === 'tentacles' ? 10 : 5);
        const side = n % 2 ? -1 : 1;
        if (m.kind === 'hands') {
          for (const sign of [-1, 1]) {
            const wrist = x + sign * 121, yy = y + 38 + sway;
            this.line([{ x: x + sign * 54, y: y + 16 }, { x: x + sign * 95, y: y + 57 }, { x: wrist, y: yy }], '#d9a582', 13);
            this.ellipse(wrist + sign * 9, yy - 5, 13, 17, '#edbc99', '#916553');
            for (let finger = 0; finger < 4; finger++) {
              const xx = wrist + sign * (finger * 6 - 1);
              this.line([{ x: xx, y: yy - 10 }, { x: xx + sign * 3, y: yy - 28 - Math.sin(finger / 3 * Math.PI) * 7 }], '#edbc99', 5);
            }
            this.line([{ x: wrist - sign * 2, y: yy + 1 }, { x: wrist - sign * 15, y: yy - 12 }], '#edbc99', 6);
          }
        } else if (m.kind === 'humanEars') {
          for (const sign of [-1, 1]) {
            const xx = x + sign * (radius + 5);
            this.ellipse(xx, y - 8, 18, 28, '#e9b89c', '#9e6e59');
            this.ellipse(xx + sign * 3, y - 9, 9, 17, '#bd8379', '#f6d0b5');
            this.ellipse(xx - sign * 2, y - 4, 4, 7, '#674c4b');
          }
        } else if (m.kind === 'antlers') {
          for (const sign of [-1, 1]) {
            this.line([{ x: x + sign * 38, y: y - 38 }, { x: x + sign * 61, y: y - 91 }, { x: x + sign * 87, y: y - 128 + sway }], '#bea685', 8);
            for (let j = 0; j < 3; j++) this.line([{ x: x + sign * (48 + j * 12), y: y - 64 - j * 20 }, { x: x + sign * (78 + j * 13), y: y - 69 - j * 24 }, { x: x + sign * (83 + j * 13), y: y - 89 - j * 24 }], '#dac8a8', 5);
          }
        } else if (m.kind === 'carapace') {
          this.ellipse(x, y - 7, radius + 17, 71, '#294a52', m.color);
          for (const sign of [-1, 1]) {
            this.ellipse(x + sign * 37, y - 13, 35, 57, m.color, '#efffff80');
            for (let j = 0; j < 3; j++) this.line([{ x: x + sign * 10, y: y - 43 + j * 27 }, { x: x + sign * 62, y: y - 25 + j * 23 }], '#163d4760', 3);
          }
        } else if (m.kind === 'feathers') {
          for (const sign of [-1, 1]) for (let j = 0; j < 6; j++) {
            const xx = x + sign * (80 + j * 10), yy = y - 50 + j * 18 + sway;
            this.ellipse(xx, yy, 10, 31 - j * 2, m.color, '#fff4d2aa');
            this.line([{ x: xx, y: yy - 22 }, { x: xx, y: yy + 22 }], '#283b4c', 1.5);
          }
        } else if (m.kind === 'eyeStalks') {
          for (const sign of [-1, 1]) {
            const xx = x + sign * 48 + sway, yy = y - 105;
            this.line([{ x: x + sign * 35, y: y - 35 }, { x: xx, y: yy }], m.color, 10);
            this.ellipse(xx, yy, 18, 20, '#eef7dd', m.color);
            this.ellipse(xx + motion.gaze, yy, 10, 12, m.color);
            this.ellipse(xx + motion.gaze, yy, 4, 9, '#142331');
            this.ellipse(xx - 4, yy - 6, 3, 4, '#ffffff');
          }
        } else if (m.kind === 'legs' || m.kind === 'paws') {
          for (const sign of [-1, 1]) {
            const xx = x + sign * (24 + n * 15);
            const step = this.reduced ? 0 : Math.sin(this.elapsed * motion.tempo * 1.35 + sign * Math.PI / 2 + m.variant) * 7;
            this.line([{ x: xx, y: y + 32 }, { x: xx + sign * 9, y: y + 72 + n * 5 + step * .4 }, { x: xx + sign * (20 + n * 3), y: y + 91 + step }], m.color, 13);
            const footX = xx + sign * (22 + n * 3), footY = y + 94 + step;
            this.ellipse(footX, footY, m.kind === 'paws' ? 21 : 16, m.kind === 'paws' ? 12 : 8, m.color, '#ffffff90');
            if (m.kind === 'paws') for (let toe = -1; toe <= 1; toe++) this.ellipse(footX + toe * 10, footY - 4, 4, 5, '#ffffffb0');
          }
        } else if (m.kind === 'tail' || m.kind === 'tentacles') {
          const count = m.kind === 'tail' ? 1 : 4 + m.variant % 3;
          for (let j = 0; j < count; j++) {
            c.beginPath(); c.moveTo(x + side * (radius - 8), y + 25);
            c.bezierCurveTo(x + side * 160, y + 95 - j * 15, x + side * (130 + n * 5), y - 75 + j * 12, x + side * (155 + n * 4), y - 15 + sway + j * 20);
            c.strokeStyle = m.color; c.lineWidth = m.kind === 'tail' ? 12 : 7; c.lineCap = 'round'; c.stroke();
            if (m.kind === 'tentacles') for (let k = 2; k < 6; k++) {
              const t = k / 7, u = 1 - t;
              const xx = u ** 3 * (x + side * (radius - 8)) + 3 * u * u * t * (x + side * 160) + 3 * u * t * t * (x + side * (130 + n * 5)) + t ** 3 * (x + side * (155 + n * 4));
              const yy = u ** 3 * (y + 25) + 3 * u * u * t * (y + 95 - j * 15) + 3 * u * t * t * (y - 75 + j * 12) + t ** 3 * (y - 15 + sway + j * 20);
              this.ellipse(xx, yy + 2, 2.5, 2.5, '#ffe9f4', m.color);
            }
          }
        } else if (m.kind === 'wings') {
          for (const sign of [-1, 1]) {
            c.beginPath(); c.moveTo(x + sign * 55, y + 15);
            c.quadraticCurveTo(x + sign * 165, y - 100 - n * 8 + sway, x + sign * 145, y + 25);
            c.quadraticCurveTo(x + sign * 90, y + 45, x + sign * 55, y + 15);
            c.fillStyle = m.color + 'aa'; c.fill(); c.strokeStyle = m.color; c.lineWidth = 2; c.stroke();
            this.line([{ x: x + sign * 60, y: y + 10 }, { x: x + sign * 132, y: y - 30 + sway }], '#ffffff90', 2);
          }
        } else if (m.kind === 'gills') {
          for (const sign of [-1, 1]) for (let j = 0; j < 3; j++) {
            const yy = y - 35 + j * 22 + n * 5;
            this.line([{ x: x + sign * 60, y: yy }, { x: x + sign * (115 + n * 6), y: yy - 25 + sway }], m.color, 5);
            for (let k = 0; k < 4; k++) this.line([{ x: x + sign * (76 + k * 9), y: yy - k * 5 }, { x: x + sign * (82 + k * 9), y: yy - 20 - k * 5 + sway }], m.color, 3);
          }
        } else if (m.kind === 'sparks') {
          for (let j = 0; j < 7; j++) {
            const angle = j / 7 * Math.PI * 2 + n * .2;
            const r = 101 + n * 5 + (this.reduced ? 0 : Math.sin(this.elapsed * 1.8 + j) * 5);
            const xx = x + Math.cos(angle) * r, yy = y + Math.sin(angle) * r * .8;
            this.line([{ x: xx - 5, y: yy - 8 }, { x: xx + 3, y: yy - 2 }, { x: xx - 2, y: yy + 3 }, { x: xx + 6, y: yy + 9 }], m.color, 2.5, this.reduced ? 0 : 9);
            this.ellipse(xx + 9, yy - 7, 1.5, 1.5, '#fff8c6');
          }
        } else if (m.kind === 'ears') {
          for (const sign of [-1, 1]) {
            const xx = x + sign * (48 + n * 9), top = y - height - 35 + sway;
            c.beginPath(); c.moveTo(xx - 20, y - 35); c.quadraticCurveTo(xx + sign * 20, top - 15, xx + 20, y - 35);
            c.fillStyle = m.color; c.fill(); c.strokeStyle = '#ffffffa0'; c.lineWidth = 2; c.stroke();
            this.line([{ x: xx - 7, y: y - 43 }, { x: xx + sign * 8, y: top + 7 }, { x: xx + 8, y: y - 43 }], '#ffb9d0', 5);
          }
        } else if (m.kind === 'fins') {
          for (const sign of [-1, 1]) {
            c.beginPath(); c.moveTo(x + sign * 65, y + 5);
            c.lineTo(x + sign * (130 + n * 6), y - 55 + sway); c.lineTo(x + sign * (145 + n * 4), y + 45); c.closePath();
            c.fillStyle = m.color + 'b0'; c.fill(); c.strokeStyle = m.color; c.lineWidth = 2; c.stroke();
            for (let j = 0; j < 4; j++) this.line([{ x: x + sign * 65, y: y + 5 }, { x: x + sign * (132 + j * 3), y: y - 43 + j * 26 + sway }], '#ffffff80', 1.5);
          }
        } else if (m.kind === 'claws') {
          for (const sign of [-1, 1]) {
            const xx = x + sign * (133 + n * 7), yy = y + 12 + sway;
            this.line([{ x: x + sign * 60, y: y + 30 }, { x: x + sign * 100, y: y + 47 }, { x: xx, y: yy }], m.color, 10);
            this.line([{ x: xx, y: yy }, { x: xx + sign * 17, y: yy - 23 }, { x: xx + sign * 27, y: yy - 10 }], m.color, 8);
            this.line([{ x: xx, y: yy }, { x: xx + sign * 28, y: yy + 12 }, { x: xx + sign * 28, y: yy - 2 }], m.color, 8);
          }
        } else if (m.kind === 'plumes') {
          for (let j = 0; j < 7; j++) {
            const xx = x + (j - 3) * 23, yy = y - height - 18 - Math.sin(j / 6 * Math.PI) * 15 + sway;
            this.line([{ x: x + (j - 3) * 8, y: y - 36 }, { x: xx, y: yy }], m.color, 5);
            this.ellipse(xx, yy, 8, 14, m.color, '#ffffff80');
            this.line([{ x: xx, y: yy + 12 }, { x: xx, y: yy - 11 }], '#fff6cfaa', 1.5);
          }
        } else {
          for (const sign of [-1, 1]) {
            const xx = x + sign * (30 + n * 13), top = y - height - 25 - n * 9;
            if (m.kind === 'horns') {
              c.beginPath(); c.moveTo(xx - 12, y - 35); c.lineTo(xx + sign * 14, top - 12); c.lineTo(xx + 12, y - 35); c.fillStyle = m.color; c.fill();
            } else {
              this.line([{ x: xx, y: y - 35 }, { x: xx + sign * 7, y: top }, { x: xx + sign * 12 + sway, y: top - 12 }], m.color, 5);
              this.ellipse(xx + sign * 12 + sway, top - 12, 8, 8, m.color, '#ffffffaa');
            }
          }
        }
      });
    }
    const gradient = c.createRadialGradient(x - 25, y - 25, 5, x, y, radius + 15);
    gradient.addColorStop(0, '#d3ecab'); gradient.addColorStop(.32, '#8abf65'); gradient.addColorStop(.75, '#467a48'); gradient.addColorStop(1, '#203e35');
    c.save(); c.shadowColor = '#91ff70'; c.shadowBlur = 8; c.fillStyle = gradient; c.fill(body); c.restore();
    // Pigment bands, scales and spots stay inside the body silhouette.
    c.save(); c.clip(body);
    for (const m of anatomy.surface) {
      this.mutationStyle(m, latest, x, y, () => {
        const lane = state.lanes.get(m)!;
        if (m.kind === 'bands') {
          c.save(); c.translate(x, y); c.rotate((m.variant % 3 - 1) * .15);
          c.fillStyle = m.color; c.globalAlpha = this.creation.mutationVersion === 4 ? .35 : .8;
          c.fillRect(-radius - 20, -43 + lane * 25, radius * 2 + 40, 13 + m.variant % 5); c.restore();
        } else for (let i = 0; i < 7; i++) {
          const xx = x + Math.sin(i * 2.4 + m.variant) * radius * .75;
          const yy = y - 36 + (i * 17 + m.variant) % 80;
          if (m.kind === 'spots') this.ellipse(xx, yy, 5 + lane, 4 + lane, m.color, '#ffffff60');
          else { c.beginPath(); c.arc(xx, yy, 7 + lane, 0, Math.PI); c.strokeStyle = m.color; c.lineWidth = 3; c.stroke(); }
        }
      });
    }
    c.restore(); c.strokeStyle = '#c1db9c'; c.lineWidth = 1.5; c.stroke(body);
    // A soft membrane rim and shaded underside give the body volume without a neon outline.
    c.save(); c.clip(body);
    const shade = c.createLinearGradient(0, y, 0, y + 66);
    shade.addColorStop(0, '#092a2100'); shade.addColorStop(1, '#092a2180');
    c.fillStyle = shade; c.fillRect(x - radius - 20, y, radius * 2 + 40, 80);
    c.restore();
    const eyeMutations = anatomy.eyes, iris = eyeMutations.at(-1)?.color ?? '#658bda';
    if (eyeMutations.length) for (const sign of [-1, 1]) {
      const xx = x + sign * 25;
      this.ellipse(xx, y - 5, this.creation.mutationVersion === 4 ? 13 : 19, this.creation.mutationVersion === 4 ? 16 : 23, '#d7e7bf');
      this.ellipse(xx + 2 + motion.gaze, y - 3, 9, 12, iris, '#1b3a32');
      this.ellipse(xx + 3 + motion.gaze, y - 2, 5, 10, '#092137'); this.ellipse(xx - 2, y - 10, 3, 4, '#ffffff');
    }
    (this.creation.mutationVersion === 4 ? [] : eyeMutations).forEach((m, i) => this.mutationStyle(m, latest, x, y, () => {
      const xx = x - 43 + i * 28, yy = y - 43 - (i % 2) * 7;
      this.ellipse(xx, yy, 10, 12, '#f8fff0'); this.ellipse(xx, yy, 6, 8, m.color); this.ellipse(xx, yy, 2.5, 6, '#122333');
    }));
    if (mutations.length) {
      c.beginPath(); c.arc(x, y + 23, 11, .2, Math.PI - .2); c.strokeStyle = '#173e28'; c.lineWidth = 3; c.stroke();
    }
    anatomy.tongues.forEach((m, i) => this.mutationStyle(m, latest, x, y, () => {
      const flick = this.reduced ? 0 : Math.sin(this.elapsed * (motion.tempo + i) * 2) * 9;
      this.line([{ x, y: y + 32 }, { x: x + 10 + i * 5, y: y + 57 }, { x: x - 20 - i * 12 + flick, y: y + 70 + i * 5 }], m.color, 9);
    }));
    for (const m of anatomy.face) {
      this.mutationStyle(m, latest, x, y, () => {
        const breathe = this.reduced ? 0 : Math.sin(this.elapsed * motion.tempo + m.variant) * 4;
        if (m.kind === 'nose') {
          c.beginPath(); c.moveTo(x - 6, y - 15); c.quadraticCurveTo(x - 9, y + 4, x - 14, y + 12);
          c.quadraticCurveTo(x, y + 26, x + 17, y + 12); c.quadraticCurveTo(x + 6, y + 2, x + 6, y - 15);
          c.fillStyle = '#e7b196'; c.fill(); c.strokeStyle = '#a16a59'; c.lineWidth = 2; c.stroke();
          for (const sign of [-1, 1]) this.ellipse(x + sign * 8, y + 13, 4, 2.5, '#704d48');
        } else if (m.kind === 'heart') {
          const beat = this.reduced ? 1 : 1 + Math.pow(Math.max(0, Math.sin(this.elapsed * 6)), 5) * .13;
          c.save(); c.translate(x + 23, y + 30); c.scale(beat, beat);
          this.ellipse(-6, -3, 15, 20, '#a8407f', '#ffd0df');
          this.ellipse(10, 0, 13, 18, '#e367a9', '#ffd0df');
          for (let j = 0; j < 3; j++) this.line([{ x: -4 + j * 7, y: -14 }, { x: -10 + j * 12, y: -28 }], '#7bf7dc', 4);
          this.line([{ x: -9, y: 1 }, { x: 0, y: 7 }, { x: 9, y: -4 }], '#fff1df', 2);
          c.restore();
        } else if (m.kind === 'lightSacs') {
          for (let j = 0; j < 5; j++) {
            const xx = x - 43 + j * 21, yy = y + 31 + Math.sin(j) * 9;
            c.save(); c.shadowColor = m.color; c.shadowBlur = this.reduced ? 6 : 10 + breathe * 2;
            this.ellipse(xx, yy, 9, 13, '#173c52', m.color);
            this.ellipse(xx, yy, 4, 7, '#e5ffba'); c.restore();
          }
        } else if (m.kind === 'tusks') {
          for (const sign of [-1, 1]) {
            c.beginPath(); c.moveTo(x + sign * 15, y + 25);
            c.bezierCurveTo(x + sign * 20, y + 75, x + sign * 65, y + 70, x + sign * 61, y - 1 + breathe);
            c.quadraticCurveTo(x + sign * 40, y + 51, x + sign * 28, y + 23); c.closePath();
            c.fillStyle = '#fff2ce'; c.fill(); c.strokeStyle = m.color; c.lineWidth = 2.5; c.stroke();
          }
        } else if (m.kind === 'snozzle') {
          c.beginPath(); c.moveTo(x, y + 14);
          c.bezierCurveTo(x - 8, y + 60, x + 9, y + 104, x + 48 + breathe, y + 76);
          c.strokeStyle = m.color; c.lineWidth = 17; c.lineCap = 'round'; c.stroke();
          this.ellipse(x + 48 + breathe, y + 76, 12, 10, m.color, '#ffffffb0');
          this.ellipse(x + 45 + breathe, y + 75, 2.5, 4, '#17332c'); this.ellipse(x + 52 + breathe, y + 75, 2.5, 4, '#17332c');
          for (let j = 0; j < 3; j++) this.line([{ x: x - 5, y: y + 34 + j * 12 }, { x: x + 5, y: y + 35 + j * 12 }], '#ffffff90', 1.5);
        } else if (m.kind === 'whiskers') {
          for (const sign of [-1, 1]) for (let j = 0; j < 3; j++) this.line([{ x: x + sign * 16, y: y + 20 }, { x: x + sign * 95, y: y + 3 + j * 19 + breathe }], m.color, 2);
        } else {
          c.beginPath(); c.moveTo(x - 17, y + 13); c.lineTo(x, y + 54 + breathe); c.lineTo(x + 17, y + 13); c.closePath();
          c.fillStyle = m.color; c.fill(); c.strokeStyle = '#fff2ce'; c.lineWidth = 2; c.stroke();
          this.line([{ x: x - 10, y: y + 21 }, { x: x + 10, y: y + 21 }], '#332618', 2);
        }
      });
    }
    this.ellipse(x - 28, y - 32, 22, 7, '#ffffff25');
    if (latest && this.burst && !this.reduced) {
      for (let i = 0; i < 14; i++) {
        const a = i / 14 * Math.PI * 2, r = 85 + (1 - this.burst / .7) * 55;
        this.ellipse(x + Math.cos(a) * r, y + Math.sin(a) * r * .8, 3, 3, latest.color);
      }
    }
    c.restore();
    this.text(developmentStage(mutations.length).toUpperCase(), 1010, 65, 14, '#d7e9bf', 'center');
    const planLabel = this.creation.mutationVersion === 4 ? `${bodyPlan(this.creation.seed).name} body plan · fictional development` : this.creation.mutationVersion === 5 ? 'Hybrid anatomy · animal / human / alien' : 'Legacy specimen · fictional development';
    this.text(planLabel, 1010, 85, 10, '#9bb7b8', 'center');
    this.round(870, 544, 280, 4, 2); c.fillStyle = '#ffffff18'; c.fill();
    if (mutations.length) { this.round(870, 544, 280 * mutations.length / (TOTAL_SEGMENTS * SLOTS), 4, 2); c.fillStyle = '#b5db8d'; c.fill(); }
    this.text(`${mutations.length} / ${TOTAL_SEGMENTS * SLOTS} growth steps`, 1010, 568, 11, '#b7cebf', 'center');
    // Thin translucent containment bars let the specimen's colors show through.
    for (let xx = 798; xx <= 1242; xx += 47) {
      this.line([{ x: xx, y: 36 }, { x: xx, y: 582 }], '#c8f3ff25', 2);
      this.line([{ x: xx + 2, y: 36 }, { x: xx + 2, y: 582 }], '#ffffff09', 1);
    }
    this.line([{ x: 790, y: 34 }, { x: 1245, y: 34 }], '#a4e6f04d', 3);
    this.line([{ x: 790, y: 584 }, { x: 1245, y: 584 }], '#a4e6f04d', 3);
  }

  private mutationStyle(m: Mutation, latest: Mutation | undefined, x: number, y: number, paint: () => void): void {
    const c = this.ctx; c.save();
    if (m === latest && this.burst > 0) {
      if (!this.reduced) {
        const scale = 1 - .6 * (this.burst / .7) ** 2;
        c.translate(x, y); c.scale(scale, scale); c.translate(-x, -y);
      }
      c.shadowColor = m.color; c.shadowBlur = this.reduced ? 0 : this.burst * 24;
    }
    paint(); c.restore();
  }

  private helixCenter(y: number): number {
    return 380 + (this.reduced ? 0 : Math.sin(this.elapsed * 1.4 + (y - this.offset) * .018) * 7);
  }
  private helixRadius(y: number): number {
    return 156 + (this.reduced ? 0 : Math.sin(this.elapsed * 2 + (y - this.offset) * .022) * 5);
  }

  private drawCanal(): void {
    const c = this.ctx;
    const metal = c.createLinearGradient(168, 0, 592, 0);
    metal.addColorStop(0, '#284d50'); metal.addColorStop(.12, '#12282e');
    metal.addColorStop(.5, '#07151c'); metal.addColorStop(.88, '#12282e'); metal.addColorStop(1, '#284d50');
    this.round(168, 22, 424, 574, 23); c.fillStyle = metal; c.fill(); c.strokeStyle = '#7baca775'; c.lineWidth = 2; c.stroke();
    const inner = c.createLinearGradient(0, 34, 0, 580);
    inner.addColorStop(0, '#17372d'); inner.addColorStop(.35, '#061524'); inner.addColorStop(1, '#123c2b');
    this.round(184, 34, 392, 548, 15); c.fillStyle = inner; c.fill();
    for (const xx of [176, 584]) {
      this.line([{ x: xx, y: 55 }, { x: xx, y: 559 }], '#77c0ae45', 3);
      for (const yy of [45, 238, 414, 572]) this.ellipse(xx, yy, 3, 3, '#99c9b2', '#071922');
    }
    // Living slime at the inlet and pooled below the moving chromosome.
    c.save(); c.beginPath(); c.rect(184, 31, 392, 555); c.clip();
    for (let i = 0; i < 8; i++) {
      const xx = 200 + i * 48;
      const pulse = this.reduced ? 0 : Math.sin(this.elapsed * 1.3 + i * 1.8) * 5;
      this.round(xx, 31, 11 + i % 3 * 3, 14 + i % 4 * 8 + pulse, 8);
      c.fillStyle = '#85da6966'; c.fill();
    }
    c.beginPath(); c.moveTo(184, 587);
    for (let xx = 184; xx <= 576; xx += 4) {
      const wave = this.reduced ? 0 : Math.sin(xx * .05 + this.elapsed * 1.7) * 3;
      c.lineTo(xx, 566 + wave + Math.sin(xx * .08) * 4);
    }
    c.lineTo(576, 587); c.closePath(); c.fillStyle = '#4a9e5277'; c.fill(); c.strokeStyle = '#a6ef7e88'; c.lineWidth = 2; c.stroke();
    for (let i = 0; i < 6; i++) {
      const phase = this.reduced ? .3 : (this.elapsed * .18 + i * .17) % 1;
      this.ellipse(204 + i * 62, 579 - phase * 24, 3 + i % 3, 3 + i % 3, '#c4ffa41a', '#c4ffa44d');
    }
    c.restore();
  }

  private drawHelix(): void {
    const c = this.ctx;
    this.drawCanal();
    c.save(); c.beginPath(); c.rect(184, 34, 392, 548); c.clip();
    const celebrating = this.completionPhase === 'celebrating';
    const celebratingTime = CELEBRATION_SECONDS - this.celebration;
    const completed = this.transition > 0;
    if (celebrating && !this.reduced) {
      const strength = Math.sin(celebratingTime / CELEBRATION_SECONDS * Math.PI);
      c.translate(Math.sin(celebratingTime * 82) * 5 * strength, Math.cos(celebratingTime * 67) * 3 * strength);
    }
    const pos = this.positions();
    const start = pos[0].y - 44, end = pos[3].y + 44;
    for (let strand = 0; strand < 2; strand++) {
      const points = this.strandPoints[strand];
      for (let i = 0; i < points.length; i++) {
        const y = start + i / (points.length - 1) * (end - start);
        const phase = (y - this.offset - 130) / 88 * Math.PI;
        const ripple = this.reduced ? 0 : Math.sin(phase) * Math.sin(this.elapsed * 2.7 + (y - this.offset) * .035) * 4;
        points[i].x = this.helixCenter(y) + Math.cos(phase + strand * Math.PI) * this.helixRadius(y) + ripple;
        points[i].y = y;
      }
      this.line(points, strand ? '#ff8ccf' : '#63ecd3', completed ? 7 : 5, completed ? 22 : this.reduced ? 0 : 12);
      this.line(points, strand ? '#ffd2ee' : '#d4e7ff', 1.3);
    }
    pos.forEach((p, i) => {
      const pair = this.creation.segments[this.shownSegment][i];
      const radius = this.helixRadius(p.y);
      if (this.dropTarget === i && !pair) {
        this.round(p.x - 45, p.y - 38, 90, 76, 12);
        c.fillStyle = '#8eff7730'; c.fill(); c.strokeStyle = '#c8ff9c'; c.lineWidth = 3; c.stroke();
        this.text('DROP PAIR', p.x + 58, p.y + 5, 11, '#d0ffb3');
      }
      this.line([{ x: p.x - radius, y: p.y }, { x: p.x + radius, y: p.y }], pair || this.controls.pair ? '#b9ef9c' : '#41536b', completed ? 4 : 3, completed ? 18 : 0);
      for (let j = 0; j < 2; j++) {
        c.save();
        if (completed) { c.shadowColor = '#d5ff9d'; c.shadowBlur = this.reduced ? 12 : 15 + Math.sin(celebratingTime * 18 + i) * 7; }
        this.round(p.x - 36, p.y - 31 + j * 34, 72, 28, 9);
        c.fillStyle = completed ? '#31554a' : pair ? '#183a3c' : '#152b38'; c.fill();
        c.strokeStyle = pair ? COLORS[pair[j] as Base] : '#7895a8'; c.lineWidth = 2; c.stroke();
        this.text(pair ? pair[j] : j ? '↓' : '↑', p.x, p.y - 9 + j * 34, 20, pair ? COLORS[pair[j] as Base] : '#7895a8', 'center');
        c.restore();
      }
      if (pair) {
        const bonds = pair.includes('A') ? 2 : 3;
        for (let bond = 0; bond < bonds; bond++) {
          const xx = p.x + (bond - (bonds - 1) / 2) * 10;
          this.line([{ x: xx, y: p.y - 2 }, { x: xx, y: p.y + 2 }], '#d6e6bf', 2);
        }
        this.text(`${bonds} H bonds`, p.x + 50, p.y + 4, 10, '#b3c6b8');
      }
      if (completed) this.drawCompletionSparks(p, i, celebratingTime, celebrating);
      this.text(String(i + 1), 197, p.y + 5, 12, '#91b3c6', 'center');
    });
    c.restore();
    this.line([{ x: 188, y: 580 }, { x: 572, y: 580 }], '#ff8291', 3);
    if (completed) {
      this.line([{ x: 235, y: 586 }, { x: 525, y: 586 }], '#c9ff95', 5, 22);
      this.text('MASTER CHAIN ↓', 380, 574, 12, '#e1ffbc', 'center');
    }
  }
  private drawCompletionSparks(p: Point, slot: number, time: number, celebrating: boolean): void {
    const c = this.ctx;
    c.save();
    // Reduced motion retains a steady, legible completion halo without flicker or shake.
    if (this.reduced) {
      this.round(p.x - 43, p.y - 38, 86, 78, 14);
      c.strokeStyle = '#dfffaf'; c.lineWidth = 2; c.stroke();
    } else {
      const clock = celebrating ? time : this.elapsed;
      for (let n = 0; n < 12; n++) {
        const life = (clock * (celebrating ? 1.8 : .8) + n * .137 + slot * .23) % 1;
        const angle = n * 2.399 + slot * 1.7;
        const distance = 43 + life * (celebrating ? 62 : 25);
        const x = p.x + Math.cos(angle) * distance;
        const y = p.y + Math.sin(angle) * distance * .7 - life * 15;
        const size = (1 - life) * (celebrating ? 6 : 4) + 1;
        c.globalAlpha = Math.sin(life * Math.PI);
        const color = ['#f7ffbe', '#8effb5', '#86dfff', '#ffc5ed'][n % 4];
        this.line([{ x: x - size, y }, { x: x + size, y }], color, 1.7, 12);
        this.line([{ x, y: y - size }, { x, y: y + size }], color, 1.7, 12);
      }
      c.globalAlpha = 1;
      // A narrow moving sheen glimmers across the pair holders; letters stay readable.
      const sweep = (clock * 1.7 + slot * .19) % 1;
      c.save(); this.round(p.x - 36, p.y - 31, 72, 62, 9); c.clip();
      const x = p.x - 65 + sweep * 130;
      const shine = c.createLinearGradient(x - 15, 0, x + 15, 0);
      shine.addColorStop(0, '#ffffff00'); shine.addColorStop(.5, '#edffdf85'); shine.addColorStop(1, '#ffffff00');
      c.fillStyle = shine; c.fillRect(x - 15, p.y - 31, 30, 62); c.restore();
    }
    c.restore();
  }
  private drawShot(): void {
    const flight = this.controls.flight; if (!flight) return;
    const t = Math.min(1, this.shotTime / .48), end = this.positions()[flight.slot];
    const center = this.shotOrigins.reduce((p, q) => ({ x: p.x + q.x / 2, y: p.y + q.y / 2 }), { x: 0, y: 0 });
    const x = Phaser.Math.Linear(center.x, end.x, t), y = Phaser.Math.Linear(center.y, end.y, t);
    this.shotOrigins.forEach((origin, i) => {
      const p = { x, y: y + (i ? 17 : -17) };
      this.line([origin, p], `${COLORS[flight.pair[i] as Base]}65`, 2, 6);
      this.ellipse(p.x, p.y, 14, 15, '#102230', COLORS[flight.pair[i] as Base]);
      this.text(flight.pair[i], p.x, p.y + 6, 18, COLORS[flight.pair[i] as Base], 'center');
    });
    this.line([{ x, y: y - 9 }, { x, y: y + 9 }], '#edffe2', 2, 4);
  }
}

export function startField(parent: HTMLElement, creation: Creation, hooks: GameHooks): Field {
  const scene = new Field(creation, hooks);
  new Phaser.Game({
    type: Phaser.CANVAS,
    width: W, height: H, parent,
    backgroundColor: '#080e20',
    banner: false,
    audio: { noAudio: true },
    fps: { target: 60, limit: 60 },
    render: { antialias: true },
    scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: [scene],
  });
  return scene;
}
