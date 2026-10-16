import Phaser from 'phaser';
import { LabAudio } from './audio';
import { creatureMotion } from './motion';
import { BASES, Creation, Controls, type Base, type Mutation } from './model';

export const W = 1280;
export const H = 650;
export const COLORS: Record<Base, string> = { A: '#ffbc4c', T: '#ff6bd9', C: '#45dfff', G: '#b18aff' };
const ENTRY_OFFSET = -290;
const GUN_X = [85, 85, 675, 675];
const SHOOTER_SCALE = .68;
export const SHOOTER_RADIUS = 43 * SHOOTER_SCALE;
export interface GameHooks {
  changed: () => void;
  notice: (text: string) => void;
}
type Point = { x: number; y: number };

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
  angles = GUN_X.map(() => -Math.PI / 2);
  transition = 0;
  shownSegment = 0;
  burst = 0;
  shotTime = 0;
  shotOrigins: Point[] = [];
  private frame!: Phaser.Textures.CanvasTexture;
  private ctx!: CanvasRenderingContext2D;
  private hooks: GameHooks;
  private lastReady = false;
  private background!: HTMLCanvasElement;
  private slotPositions: Point[] = Array.from({ length: 4 }, () => ({ x: 0, y: 0 }));

  constructor(creation: Creation, hooks: GameHooks) {
    super('CreationField'); this.creation = creation; this.hooks = hooks;
    this.shownSegment = creation.active;
  }
  create(): void {
    this.frame = this.textures.createCanvas('field', W, H)!;
    this.ctx = this.frame.context;
    this.add.image(0, 0, 'field').setOrigin(0);
    this.background = this.cacheLayer(W, H, () => this.drawBackground());

    this.game.events.once(Phaser.Core.Events.POST_RENDER, () => {
      this.scale.getParentBounds(); this.scale.refresh();
      if (this.paused) this.game.loop.sleep();
    });
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.x < 184 || pointer.x > 576) return;
      const slot = this.positions().findIndex(p => Math.abs(p.x - pointer.x) < this.helixRadius(p.y) + 12 && Math.abs(p.y - pointer.y) < 40);
      this.target(slot < 0 ? null : slot);
    });
    this.draw();
  }
  reset(creation: Creation): void {
    this.labAudio.setActive(false);
    this.creation = creation; this.failed = false; this.controls.cancel(); this.offset = ENTRY_OFFSET; this.elapsed = 0;
    this.shownSegment = creation.active; this.transition = 0; this.burst = 0;
    this.aligned = false; this.lastReady = false; this.shotTime = 0; this.angles.fill(-Math.PI / 2);
    this.repaint(); this.hooks.changed();
  }
  setPause(value: boolean): void {
    if (!value && (this.failed || this.creation.done)) return;
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
  choose(base: Base): void {
    if (this.paused || this.creation.done || this.failed || this.transition) return;
    this.hooks.notice(this.controls.choose(base));
    if (this.controls.pair) this.hooks.notice(`${this.controls.pair} ready — click an empty chromosome rung to fire.`);
    this.hooks.changed();
  }
  target(slot: number | null): void {
    if (this.paused || this.creation.done || this.failed || this.transition) return;
    let result = this.controls.click(slot, i => !this.creation.segments[this.creation.active][i]);
    if (result === 'locked') result = this.controls.click(slot, i => !this.creation.segments[this.creation.active][i]);
    if (result === 'queued') this.hooks.notice(this.aligned ? 'Launching pair…' : 'Shot queued — lining up the cannons…');
    else if (!this.controls.pair && !this.controls.flight) this.hooks.notice('Choose two complementary letters first: A + T or C + G.');
    this.hooks.changed();
  }
  launcherX(base: Base): number { return GUN_X[BASES.indexOf(base)]; }
  launcherY(base: Base): number { return base === 'A' || base === 'C' ? 265 : 405; }
  positions(): Point[] {
    for (let i = 0; i < 4; i++) {
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
    if (this.transition > 0) {
      this.offset += dt * 250;
      this.transition = Math.max(0, this.transition - dt);
      if (!this.transition) {
        this.shownSegment = this.creation.active; this.offset = ENTRY_OFFSET;
        this.hooks.notice('Empty chromosome approaching the canal. Select a pair, then click a rung.'); this.hooks.changed();
      }
    }
    const lock = this.controls.target;
    this.aligned = lock !== null;
    if (lock !== null) {
      const p = this.positions()[lock];
      if (p.y < 105 || p.y > 580) this.aligned = false;
      GUN_X.forEach((x, i) => {
        if (!this.controls.selected.includes(BASES[i])) return;
        const desired = Math.atan2(p.y - this.launcherY(BASES[i]), p.x - x);
        const diff = Phaser.Math.Angle.Wrap(desired - this.angles[i]);
        this.angles[i] += this.reduced ? diff : Math.max(-dt * 5, Math.min(dt * 5, diff));
        if (Math.abs(diff) > .035 && !this.reduced) this.aligned = false;
      });
    }
    if (this.aligned !== this.lastReady) { this.lastReady = this.aligned; this.hooks.changed(); }
    const origins = this.controls.queued && this.aligned ? this.controls.selected.map(base => {
      const i = BASES.indexOf(base);
      return { x: GUN_X[i] + Math.cos(this.angles[i]) * 78 * SHOOTER_SCALE, y: this.launcherY(BASES[i]) + Math.sin(this.angles[i]) * 78 * SHOOTER_SCALE };
    }) : [];
    if (this.controls.launch(this.aligned)) {
      this.labAudio.shoot();
      this.shotOrigins = origins; this.shotTime = 0; this.hooks.changed();
    }
    if (this.controls.flight) {
      this.shotTime += dt;
      if (this.shotTime >= .48) {
        const flight = this.controls.flight;
        const before = this.creation.completed;
        this.creation.place(flight.slot, flight.pair);
        this.labAudio.grow(this.creation.completed > before, ['AT', 'TA', 'CG', 'GC'].indexOf(flight.pair));
        if (this.creation.done) this.labAudio.finish(true);
        this.controls.cancel(); this.burst = .7;
        const latestMutation = this.creation.mutations.at(-1)!;
        this.hooks.notice(`Mutation ${latestMutation.id}: ${latestMutation.name} — ${flight.pair} on rung ${flight.slot + 1}.`);
        if (this.creation.completed > before) {
          if (!this.creation.done) this.transition = 1.6;
        }
        this.hooks.changed();
      }
    }
    if (!this.transition && !this.creation.done && this.positions()[3].y > 580) {
      if (this.controls.flight) {
        // Resolve a launched shot before deciding whether the chromosome is empty.
        this.offset = 186;
      } else if (this.creation.linked) {
        this.offset = ENTRY_OFFSET; this.controls.cancel(); this.aligned = false;
        this.hooks.notice('Linked chromosome preserved — returning to the top. Finish its remaining rungs.');
        this.hooks.changed();
      } else {
        this.labAudio.finish(false);
        this.failed = true; this.controls.cancel(); this.paused = true;
        this.hooks.notice('Containment failed: a completely empty chromosome escaped. Restart required.');
        this.draw(); this.hooks.changed(); this.game.loop.sleep(); return;
      }
    }
    this.draw();
    if (this.creation.done && !this.burst) this.game.loop.sleep();
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
  private text(text: string, x: number, y: number, size: number, color: string, align: CanvasTextAlign = 'left'): void {
    const c = this.ctx; c.font = `${size >= 22 ? 700 : 500} ${size}px "Trebuchet MS", sans-serif`;
    c.fillStyle = color; c.textAlign = align; c.fillText(text, x, y);
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
    // Sleeping loops still need one visible render after load or settings changes.
    if (this.paused || !this.game.loop.running) {
      this.game.renderer.preRender();
      this.game.scene.render(this.game.renderer);
      this.game.renderer.postRender();
    }
  }
  private draw(): void {
    if (!this.ctx) return;
    const c = this.ctx;
    // The opaque cached background also clears the previous frame.
    c.drawImage(this.background, 0, 0);
    for (let i = 0; i < 44; i++) {
      const x = (i * 173 + 23) % W, y = (i * 97 + 17) % 590;
      const alpha = .15 + .12 * Math.sin(this.elapsed + i);
      this.ellipse(x, y, i % 5 === 0 ? 2 : 1, i % 5 === 0 ? 2 : 1, `rgba(110,205,255,${alpha})`);
    }
    this.drawCreature(); this.drawHelix(); this.drawCannons(); this.drawShot();
    if (this.failed || this.creation.done) {
      c.fillStyle = '#040b15dc'; c.fillRect(210, 225, 340, 155);
      this.text(this.failed ? 'CONTAINMENT FAILED' : 'GENOME COMPLETE', 380, 280, 23, this.failed ? '#ff8b9f' : '#b9ef9c', 'center');
      this.text(this.failed ? 'A completely empty chromosome escaped.' : '30 chromosomes. One wild Mutagon.', 380, 315, 14, '#d8e8ef', 'center');
      this.text('Use Restart to begin a new experiment', 380, 345, 13, '#8daab9', 'center');
    }
    this.frame.refresh();
  }
  private drawCreature(): void {
    const c = this.ctx, mutations = this.creation.mutations, latest = mutations.at(-1);
    const chamber = c.createRadialGradient(1010, 330, 20, 1010, 330, 340);
    chamber.addColorStop(0, '#1a3941'); chamber.addColorStop(1, '#0f1e2c');
    this.round(775, 82, 465, 490, 22); c.fillStyle = chamber; c.fill(); c.strokeStyle = '#6ea8b866'; c.stroke();
    this.text('MUTAGON', 810, 123, 28, '#c4f99d');
    const motion = creatureMotion(mutations, this.elapsed, this.reduced);
    if (latest && this.burst > 0 && !this.reduced) {
      const previous = creatureMotion(mutations.slice(0, -1), this.elapsed);
      const blend = 1 - this.burst / .7;
      for (const key of ['tempo', 'drift', 'bob', 'tilt', 'shear', 'scaleX', 'scaleY', 'gaze'] as const) {
        motion[key] = previous[key] + (motion[key] - previous[key]) * blend;
      }
    }
    this.text(this.burst && latest ? `GROWING: ${latest.kind.toUpperCase()}` : motion.name.toUpperCase(), 810, 148, 11, '#99c5b4');
    c.save(); c.beginPath(); c.rect(785, 178, 445, 300); c.clip();
    const x = 1010, y = 327;
    this.ellipse(x, y + 100, 150 + motion.bob, 17, '#55ef8120');
    c.translate(x + motion.drift, y + 45 + motion.bob);
    c.rotate(motion.tilt); c.transform(1, 0, motion.shear, 1, 0, 0);
    c.scale(1.1 * motion.scaleX, 1.1 * motion.scaleY); c.translate(-x, -y - 45);
    const radius = 67 + Math.min(22, mutations.length * .45), height = 55 + Math.min(14, mutations.length * .2);
    const body = new Path2D(); body.moveTo(x - radius, y + 36);
    body.bezierCurveTo(x - radius - 12, y - 20, x - radius * .7, y - height, x - 12, y - height);
    body.bezierCurveTo(x + radius * .9, y - height - 15, x + radius + 22, y - 9, x + radius, y + 36);
    body.bezierCurveTo(x + radius * .75, y + 65, x - radius * .8, y + 65, x - radius, y + 36);
    body.closePath();
    // Each hit persists in history; repeated traits grow new colored variants.
    const visible = mutations.filter((m, i) => mutations.slice(i + 1).filter(n => n.kind === m.kind).length < 4);
    const families = new Map<string, number>();
    for (const m of visible) {
      const n = families.get(m.kind) ?? 0; families.set(m.kind, n + 1);
      if (['eyes', 'bands', 'scales', 'spots', 'tongue'].includes(m.kind)) continue;
      this.mutationStyle(m, latest, x, y, () => {
        const sway = this.reduced ? 0 : Math.sin(this.elapsed * (2 + motion.tempo * .3 + m.id % 5 * .2) + m.variant) * (m.kind === 'wings' ? 11 : m.kind === 'tail' || m.kind === 'tentacles' ? 10 : 5);
        const side = n % 2 ? -1 : 1;
        if (m.kind === 'legs') {
          for (const sign of [-1, 1]) {
            const xx = x + sign * (24 + n * 15);
            const step = this.reduced ? 0 : Math.sin(this.elapsed * motion.tempo * 1.35 + sign * Math.PI / 2 + m.variant) * 7;
            this.line([{ x: xx, y: y + 32 }, { x: xx + sign * 9, y: y + 72 + n * 5 + step * .4 }, { x: xx + sign * (20 + n * 3), y: y + 91 + step }], m.color, 13);
            this.ellipse(xx + sign * (22 + n * 3), y + 94 + step, 16, 8, m.color, '#ffffff90');
          }
        } else if (m.kind === 'tail' || m.kind === 'tentacles') {
          const count = m.kind === 'tail' ? 1 : 3;
          for (let j = 0; j < count; j++) {
            c.beginPath(); c.moveTo(x + side * (radius - 8), y + 25);
            c.bezierCurveTo(x + side * 160, y + 95 - j * 15, x + side * (130 + n * 5), y - 75 + j * 12, x + side * (155 + n * 4), y - 15 + sway + j * 20);
            c.strokeStyle = m.color; c.lineWidth = m.kind === 'tail' ? 12 : 6; c.lineCap = 'round'; c.stroke();
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
    gradient.addColorStop(0, '#c4ff8c'); gradient.addColorStop(.45, '#71c939'); gradient.addColorStop(1, '#205f31');
    c.save(); c.shadowColor = '#91ff70'; c.shadowBlur = 23; c.fillStyle = gradient; c.fill(body); c.restore();
    // Pigment bands, scales and spots stay inside the body silhouette.
    c.save(); c.clip(body);
    for (const m of visible) {
      if (!['bands', 'scales', 'spots'].includes(m.kind)) continue;
      this.mutationStyle(m, latest, x, y, () => {
        const lane = mutations.filter(n => n.kind === m.kind && n.id < m.id).length % 4;
        if (m.kind === 'bands') {
          c.save(); c.translate(x, y); c.rotate((m.variant % 3 - 1) * .15);
          c.fillStyle = m.color; c.globalAlpha = .8;
          c.fillRect(-radius - 20, -43 + lane * 25, radius * 2 + 40, 13 + m.variant % 5); c.restore();
        } else for (let i = 0; i < 7; i++) {
          const xx = x + Math.sin(i * 2.4 + m.variant) * radius * .75;
          const yy = y - 36 + (i * 17 + m.variant) % 80;
          if (m.kind === 'spots') this.ellipse(xx, yy, 5 + lane, 4 + lane, m.color, '#ffffff60');
          else { c.beginPath(); c.arc(xx, yy, 7 + lane, 0, Math.PI); c.strokeStyle = m.color; c.lineWidth = 3; c.stroke(); }
        }
      });
    }
    c.restore(); c.strokeStyle = '#c2ff9e'; c.lineWidth = 2.5; c.stroke(body);
    const eyeMutations = mutations.filter(m => m.kind === 'eyes'), iris = eyeMutations.at(-1)?.color ?? '#658bda';
    if (eyeMutations.length) for (const sign of [-1, 1]) {
      const xx = x + sign * 25;
      this.ellipse(xx, y - 5, 19, 23, '#f7fff0');
      this.ellipse(xx + 2 + motion.gaze, y - 3, 12, 16, iris, '#1b3a32');
      this.ellipse(xx + 3 + motion.gaze, y - 2, 5, 10, '#092137'); this.ellipse(xx - 2, y - 12, 5, 6, '#ffffff');
    }
    eyeMutations.slice(-4).forEach((m, i) => this.mutationStyle(m, latest, x, y, () => {
      const xx = x - 43 + i * 28, yy = y - 43 - (i % 2) * 7;
      this.ellipse(xx, yy, 10, 12, '#f8fff0'); this.ellipse(xx, yy, 6, 8, m.color); this.ellipse(xx, yy, 2.5, 6, '#122333');
    }));
    if (mutations.length) {
      c.beginPath(); c.arc(x, y + 23, 11, .2, Math.PI - .2); c.strokeStyle = '#173e28'; c.lineWidth = 3; c.stroke();
    }
    visible.filter(m => m.kind === 'tongue').forEach((m, i) => this.mutationStyle(m, latest, x, y, () => {
      const flick = this.reduced ? 0 : Math.sin(this.elapsed * (motion.tempo + i) * 2) * 9;
      this.line([{ x, y: y + 32 }, { x: x + 10 + i * 5, y: y + 57 }, { x: x - 20 - i * 12 + flick, y: y + 70 + i * 5 }], m.color, 9);
    }));
    this.ellipse(x - 28, y - 32, 22, 7, '#ffffff25');
    if (latest && this.burst && !this.reduced) {
      for (let i = 0; i < 14; i++) {
        const a = i / 14 * Math.PI * 2, r = 85 + (1 - this.burst / .7) * 55;
        this.ellipse(x + Math.cos(a) * r, y + Math.sin(a) * r * .8, 3, 3, latest.color);
      }
    }
    c.restore();
    // Thin translucent containment bars let the specimen's colors show through.
    for (let xx = 798; xx <= 1222; xx += 47) {
      this.line([{ x: xx, y: 184 }, { x: xx, y: 477 }], '#c8f3ff25', 2);
      this.line([{ x: xx + 2, y: 184 }, { x: xx + 2, y: 477 }], '#ffffff09', 1);
    }
    this.line([{ x: 790, y: 181 }, { x: 1225, y: 181 }], '#a4e6f04d', 3);
    this.line([{ x: 790, y: 480 }, { x: 1225, y: 480 }], '#a4e6f04d', 3);
    this.text(`${mutations.length} MUTATIONS / ${this.creation.completed} CHROMOSOMES`, 810, 518, 14, '#b9ef9c');
    this.text(latest ? `${latest.name} / ${latest.pair}` : 'Green blob · awaiting first mutation', 810, 547, 14, latest?.color ?? '#a2bbc7');
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
    this.round(168, 78, 424, 518, 23); c.fillStyle = metal; c.fill(); c.strokeStyle = '#7baca775'; c.lineWidth = 2; c.stroke();
    const inner = c.createLinearGradient(0, 90, 0, 580);
    inner.addColorStop(0, '#17372d'); inner.addColorStop(.35, '#061524'); inner.addColorStop(1, '#123c2b');
    this.round(184, 90, 392, 492, 15); c.fillStyle = inner; c.fill();
    for (const xx of [176, 584]) {
      this.line([{ x: xx, y: 111 }, { x: xx, y: 559 }], '#77c0ae45', 3);
      for (const yy of [101, 238, 414, 572]) this.ellipse(xx, yy, 3, 3, '#99c9b2', '#071922');
    }
    // Living slime at the inlet and pooled below the moving chromosome.
    c.save(); c.beginPath(); c.rect(184, 87, 392, 499); c.clip();
    for (let i = 0; i < 8; i++) {
      const xx = 200 + i * 48;
      const pulse = this.reduced ? 0 : Math.sin(this.elapsed * 1.3 + i * 1.8) * 5;
      this.round(xx, 87, 11 + i % 3 * 3, 14 + i % 4 * 8 + pulse, 8);
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
    c.save(); c.beginPath(); c.rect(184, 90, 392, 492); c.clip();
    const pos = this.positions();
    const start = pos[0].y - 44, end = pos[3].y + 44;
    for (let strand = 0; strand < 2; strand++) {
      const points = Array.from({ length: 150 }, (_, i) => {
        const y = start + i / 149 * (end - start);
        const phase = (y - this.offset - 130) / 88 * Math.PI;
        const ripple = this.reduced ? 0 : Math.sin(phase) * Math.sin(this.elapsed * 2.7 + (y - this.offset) * .035) * 4;
        return { x: this.helixCenter(y) + Math.cos(phase + strand * Math.PI) * this.helixRadius(y) + ripple, y };
      });
      this.line(points, strand ? '#ff72c9' : '#65aaff', 5, this.reduced ? 0 : 12);
      this.line(points, strand ? '#ffd2ee' : '#d4e7ff', 1.3);
    }
    pos.forEach((p, i) => {
      const pair = this.creation.segments[this.shownSegment][i];
      const radius = this.helixRadius(p.y);
      this.line([{ x: p.x - radius, y: p.y }, { x: p.x + radius, y: p.y }], pair ? '#b9ef9c' : '#41536b', 3);
      for (let j = 0; j < 2; j++) {
        this.round(p.x - 36, p.y - 31 + j * 34, 72, 28, 9);
        c.fillStyle = pair ? '#183a3c' : '#0b1728'; c.fill();
        c.strokeStyle = pair ? COLORS[pair[j] as Base] : '#7895a8'; c.lineWidth = 2; c.stroke();
        this.text(pair ? pair[j] : '·', p.x, p.y - 9 + j * 34, 20, pair ? COLORS[pair[j] as Base] : '#7895a8', 'center');
      }
      this.text(String(i + 1), 197, p.y + 5, 12, '#91b3c6', 'center');
    });
    c.restore();
    this.text('DNA CANAL ↓', 380, 43, 18, '#c4f99d', 'center');
    this.text(`CHROMOSOME ${this.creation.active + 1} / 30`, 380, 65, 11, '#91acbf', 'center');
    this.line([{ x: 188, y: 580 }, { x: 572, y: 580 }], '#ff8291', 3);
    this.text(this.creation.linked ? 'LINKED · SAFE TO RECIRCULATE' : 'LINK A PAIR BEFORE THE EXIT', 380, 610, 11, this.creation.linked ? '#b9ef9c' : '#ff9aa7', 'center');
    this.text('A → T ≠ T → A', 1000, 609, 16, '#b9ef9c', 'center');
    this.text('Click order writes your creature’s mutation pattern', 1000, 632, 12, '#8baab9', 'center');
  }
  private drawCannons(): void {
    const c = this.ctx;
    this.text('AT SHOOTERS', 85, 205, 12, '#8faabb', 'center');
    this.text('CG SHOOTERS', 675, 205, 12, '#8faabb', 'center');
    GUN_X.forEach((x, i) => {
      const y = this.launcherY(BASES[i]), color = COLORS[BASES[i]];
      c.save(); c.translate(x, y); c.scale(SHOOTER_SCALE, SHOOTER_SCALE); c.translate(-x, -y);
      const active = this.controls.selected.includes(BASES[i]) || !!this.controls.flight?.pair.includes(BASES[i]);
      const wiggle = 0;
      if (active) {
        c.save();
        const halo = c.createRadialGradient(x, y, 22, x, y, 62);
        halo.addColorStop(0, `${color}88`); halo.addColorStop(.65, `${color}45`); halo.addColorStop(1, `${color}00`);
        this.ellipse(x, y, 62, 62, halo);
        c.shadowColor = color; c.shadowBlur = 24;
        this.ellipse(x, y, 50, 50, '#ffffff08', color);
        c.shadowBlur = 0;
        c.strokeStyle = '#ffffff'; c.lineWidth = 3;
        c.beginPath(); c.arc(x, y, 46, -.7, .7); c.stroke();
        c.beginPath(); c.arc(x, y, 46, Math.PI - .7, Math.PI + .7); c.stroke();
        c.restore();
      }
      c.save(); c.translate(x, y); c.rotate(wiggle);
      c.shadowColor = color; c.shadowBlur = active ? 18 : 4;
      c.fillStyle = active ? '#234a50' : '#142635'; c.strokeStyle = color; c.lineWidth = 2;
      // Four original illustrated bio-machines: shell, spore, claw, and gas sac.
      if (i === 0) {
        c.beginPath(); c.moveTo(0, -44); c.lineTo(42, -13); c.lineTo(32, 32);
        c.lineTo(0, 44); c.lineTo(-32, 32); c.lineTo(-42, -13); c.closePath(); c.fill(); c.stroke();
        for (const side of [-1, 1]) this.line([{ x: side * 25, y: -18 }, { x: side * 32, y: 15 }], color, 4);
      } else if (i === 1) {
        for (let j = 0; j < 6; j++) {
          const angle = j * Math.PI / 3;
          this.ellipse(Math.cos(angle) * 31, Math.sin(angle) * 31, 15, 15, '#412745', color);
        }
        this.ellipse(0, 0, 31, 32, '#23233b', color);
      } else if (i === 2) {
        this.round(-40, -34, 80, 68, 19); c.fill(); c.stroke();
        for (const side of [-1, 1]) {
          this.line([{ x: side * 27, y: -22 }, { x: side * 42, y: -44 }, { x: side * 17, y: -39 }], color, 5);
          this.ellipse(side * 28, 25, 8, 5, '#80f5ff');
        }
      } else {
        this.ellipse(-18, 7, 27, 31, '#34274b', color);
        this.ellipse(17, 1, 28, 40, '#34274b', color);
        for (let j = 0; j < 3; j++) this.ellipse(-25 + j * 18, -29 - j * 6, 5 + j, 5 + j, '#d8bdff', color);
      }
      c.shadowBlur = 0;
      const angle = this.controls.target !== null ? this.angles[i] : i < 2 ? 0 : Math.PI;
      c.save(); c.rotate(angle - wiggle);
      this.round(22, -12, 52, 24, i === 3 ? 12 : 5); c.fillStyle = '#294454'; c.fill(); c.strokeStyle = color; c.stroke();
      c.fillStyle = color;
      if (i === 1) { c.fillRect(55, -17, 9, 34); c.fillRect(70, -17, 9, 34); }
      else if (i === 2) { this.ellipse(71, -11, 9, 8, color); this.ellipse(71, 11, 9, 8, color); }
      else { this.ellipse(73, 0, 9, i === 3 ? 18 : 14, color); }
      c.restore();
      this.ellipse(0, 0, 22, 24, active ? color : '#0a1523', active ? '#ffffff' : color);
      this.text(BASES[i], 0, 10, 30, active ? '#071321' : color, 'center');
      c.restore(); c.restore();
    });
    this.text(this.controls.selected.length ? `FIRST: ${this.controls.selected[0]}` : 'CHOOSE FIRST', 380, 641, 13, '#bdd3df', 'center');
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
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: [scene],
  });
  return scene;
}
