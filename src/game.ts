import Phaser from 'phaser';
import { BASES, Creation, Controls, type Base } from './model';

export const W = 1280;
export const H = 650;
export const COLORS: Record<Base, string> = { A: '#ffbc4c', T: '#ff6bd9', C: '#45dfff', G: '#b18aff' };
const GUN_X = [475, 585, 695, 805];
export interface GameHooks {
  changed: () => void;
  notice: (text: string) => void;
}
type Point = { x: number; y: number };

/** Phaser owns the loop and scaling; the creation model remains renderer-independent. */
export class Field extends Phaser.Scene {
  creation: Creation;
  controls = new Controls();
  paused = true;
  reduced = false;
  elapsed = 0;
  offset = 0;
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
  private helix!: HTMLCanvasElement;
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
    this.helix = this.cacheLayer(W + 540, 180, () => this.drawStrands());
    this.game.events.once(Phaser.Core.Events.POST_RENDER, () => {
      if (this.paused) this.game.loop.sleep();
    });
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.y < 250 || pointer.y > 480) return;
      const slot = this.positions().findIndex(p => Math.abs(p.x - pointer.x) < 50 && Math.abs(p.y - pointer.y) < 55);
      this.target(slot < 0 ? null : slot);
    });
    this.draw();
  }
  reset(creation: Creation): void {
    this.creation = creation; this.controls.cancel(); this.offset = 0; this.elapsed = 0;
    this.shownSegment = creation.active; this.transition = 0; this.burst = 0;
    this.aligned = false; this.lastReady = false; this.shotTime = 0; this.angles.fill(-Math.PI / 2);
    this.repaint(); this.hooks.changed();
  }
  setPause(value: boolean): void {
    this.paused = value;
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
    if (this.paused || this.creation.done || this.transition) return;
    this.hooks.notice(this.controls.choose(base)); this.hooks.changed();
  }
  target(slot: number | null): void {
    if (this.paused || this.creation.done || this.transition) return;
    const result = this.controls.click(slot, i => !this.creation.segments[this.creation.active][i]);
    if (result === 'locked') this.hooks.notice('Target locked. Cannons aiming… click again to fire.');
    else if (result === 'queued') this.hooks.notice(this.aligned ? 'Launching pair…' : 'Shot queued — lining up the cannons…');
    else if (!this.controls.pair && !this.controls.flight) this.hooks.notice('Choose two complementary letters first: A + T or C + G.');
    this.hooks.changed();
  }
  positions(): Point[] {
    for (let i = 0; i < 4; i++) {
      this.slotPositions[i].x = 70 + i * 270 + this.offset;
      this.slotPositions[i].y = 333 + (this.reduced ? 0 : Math.sin(this.elapsed * .65 + i * .9) * 9);
    }
    return this.slotPositions;
  }

  update(_time: number, delta: number): void {
    if (this.paused) return;
    const dt = Math.min(delta / 1000, .05);
    this.elapsed += dt;
    if (!this.transition && !this.creation.done) this.offset = Math.min(280, this.offset + dt * 9);
    this.burst = Math.max(0, this.burst - dt);
    if (this.transition > 0) {
      this.transition = Math.max(0, this.transition - dt);
      if (!this.transition) {
        this.shownSegment = this.creation.active; this.offset = 0;
        this.hooks.notice('New segment. Choose a complementary pair.'); this.hooks.changed();
      }
    }
    const lock = this.controls.target;
    this.aligned = lock !== null;
    if (lock !== null) {
      const p = this.positions()[lock];
      GUN_X.forEach((x, i) => {
        if (!this.controls.selected.includes(BASES[i])) return;
        const desired = Math.atan2(p.y - 552, p.x - x);
        const diff = Phaser.Math.Angle.Wrap(desired - this.angles[i]);
        this.angles[i] += this.reduced ? diff : Math.max(-dt * 5, Math.min(dt * 5, diff));
        if (Math.abs(diff) > .035 && !this.reduced) this.aligned = false;
      });
    }
    if (this.aligned !== this.lastReady) { this.lastReady = this.aligned; this.hooks.changed(); }
    const origins = this.controls.queued && this.aligned ? this.controls.selected.map(base => {
      const i = BASES.indexOf(base);
      return { x: GUN_X[i] + Math.cos(this.angles[i]) * 78, y: 552 + Math.sin(this.angles[i]) * 78 };
    }) : [];
    if (this.controls.launch(this.aligned)) {
      this.shotOrigins = origins; this.shotTime = 0; this.hooks.changed();
    }
    if (this.controls.flight) {
      this.shotTime += dt;
      if (this.shotTime >= .48) {
        const flight = this.controls.flight;
        const before = this.creation.completed;
        this.creation.place(flight.slot, flight.pair);
        this.controls.cancel(); this.burst = .7;
        if (this.creation.completed > before) {
          const a = this.creation.adaptations.at(-1)!;
          this.hooks.notice(`New adaptation: ${a.name}`);
          if (!this.creation.done) this.transition = 1.6;
        } else this.hooks.notice(`Pair placed! ${this.creation.filled}/4 rungs complete.`);
        this.hooks.changed();
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
    this.drawCreature(); this.drawHelix(); this.drawMuck(); this.drawCannons(); this.drawShot();
    this.frame.refresh();
  }
  private drawCreature(): void {
    const c = this.ctx, count = this.creation.completed;
    const ids = this.creation.adaptations.map(a => a.id);
    const hash = ids.reduce((n, id) => (Math.imul(n, 31) + id + 1) >>> 0, this.creation.seed);
    const hue = count ? 90 + hash % 90 : 105;
    const idle = this.reduced ? 0 : Math.sin(this.elapsed * 1.7) * 3;
    const x = 690, y = 147 + idle;
    const radius = 67 + Math.min(count * 1.8, 26), height = 55 + (hash % 15) * Math.min(count, 1);
    this.text('YOUR LIFE FORM', 57, 68, 13, '#9baecc');
    this.text(count ? 'Something wonderful.' : 'Every life starts somewhere.', 57, 103, 24, '#e8f5ff');
    this.text(count ? `${count} adaptations · still growing` : 'A little potential. A lot of possibility.', 57, 132, 14, '#899fbd');
    const mini = c.createRadialGradient(95, 188, 3, 100, 200, 35);
    mini.addColorStop(0, '#d0ff91'); mini.addColorStop(.7, '#64c53b'); mini.addColorStop(1, '#214e29');
    this.ellipse(100, 207, 34, 24, mini, '#b0fa7a');
    this.ellipse(92, 202, 3, 4, '#163229'); this.ellipse(108, 202, 3, 4, '#163229');
    this.text('STARTING BLOB', 151, 213, 11, '#92b1a9');
    this.ellipse(x, y + 69, 155, 19, '#55ef8130'); this.ellipse(x, y + 69, 111, 9, '#7cffa34a');
    if (count > 1) {
      // Segment patterns affect the whole silhouette; all forms are fictional.
      for (let i = 0; i < 2 + Math.min(4, count); i++) {
        const angle = (i / (2 + Math.min(4, count))) * Math.PI * 2;
        this.ellipse(x + Math.cos(angle) * (radius - 8), y + 31 + Math.sin(angle) * 26, 19, 14, `hsl(${hue + 8},65%,40%)`, `hsl(${hue},80%,65%)`);
      }
    }
    if (count > 2) {
      const n = 2 + hash % 3;
      for (let i = 0; i < n; i++) {
        const xx = x - 60 + (120 / Math.max(1, n - 1)) * i;
        const end = { x: xx + Math.sin(i + this.elapsed) * (this.reduced ? 0 : 3), y: y - height - 16 - (hash >> i & 15) };
        this.line([{ x: xx, y: y - 25 }, { x: xx - 7, y: y - height }, end], `hsl(${hue},65%,60%)`, 5, 5);
        this.ellipse(end.x, end.y, 7, 7, '#e5ffac', '#92e16c');
      }
    }
    if (count > 5) {
      c.save(); c.translate(x, y); c.globalAlpha = .75;
      for (const side of [-1, 1]) {
        c.beginPath(); c.moveTo(side * radius * .7, 10);
        c.quadraticCurveTo(side * (radius + 72), -80, side * (radius + 30), 37);
        c.quadraticCurveTo(side * radius, 40, side * radius * .7, 10);
        c.fillStyle = `hsl(${(hue + 80 + hash % 60) % 360},70%,65%)`; c.fill();
        c.strokeStyle = '#caffdb'; c.stroke();
      } c.restore();
    }
    const body = c.createRadialGradient(x - 25, y - 25, 5, x, y, radius + 12);
    body.addColorStop(0, `hsl(${hue},83%,77%)`); body.addColorStop(.45, `hsl(${hue},68%,48%)`); body.addColorStop(1, `hsl(${hue + 15},68%,20%)`);
    c.save(); c.shadowBlur = 25; c.shadowColor = `hsl(${hue},80%,50%)`;
    c.beginPath(); c.moveTo(x - radius, y + 36);
    c.bezierCurveTo(x - radius - 12, y - 20, x - radius * .7, y - height, x - 12, y - height);
    c.bezierCurveTo(x + radius * .9, y - height - 15, x + radius + 22, y - 9, x + radius, y + 36);
    c.bezierCurveTo(x + radius * .75, y + 65, x - radius * .8, y + 65, x - radius, y + 36);
    c.fillStyle = body; c.fill(); c.strokeStyle = '#c2ff9e'; c.lineWidth = 2.5; c.stroke(); c.restore();
    c.save(); c.globalAlpha = .25;
    this.ellipse(x - 26, y - 33, 26, 10, '#ffffff'); c.restore();
    for (let i = 0; i < Math.min(count * 2, 18); i++) {
      const angle = i * 2.4 + hash % 6, rr = 40 + i % 3 * 12;
      this.ellipse(x + Math.cos(angle) * rr, y + 9 + Math.sin(angle) * 27, 4 + hash % 4, 3 + i % 3, `hsl(${(hue + 60 + (hash >> 4) % 90) % 360},80%,75%)`);
    }
    const eyeOffset = 24 + (hash % 5) * Math.min(count, 1);
    for (const side of [-1, 1]) {
      this.ellipse(x + side * eyeOffset, y - 5, 19, 23, '#f2fff0');
      this.ellipse(x + side * eyeOffset + 3, y - 3, 12, 16, '#142b43');
      this.ellipse(x + side * eyeOffset + 5, y - 7, 6, 8, '#415eaf');
      this.ellipse(x + side * eyeOffset - 1, y - 13, 5, 6, '#ffffff');
    }
    c.beginPath(); c.arc(x + 2, y + 24, 10, .2, Math.PI - .2); c.strokeStyle = '#183c28'; c.lineWidth = 3; c.stroke();
    if (count && this.burst && !this.reduced) {
      for (let i = 0; i < 12; i++) {
        const a = i / 12 * Math.PI * 2, rad = 85 + (1 - this.burst / .7) * 70;
        this.ellipse(x + Math.cos(a) * rad, y + Math.sin(a) * rad * .65, 2, 2, '#bfff90');
      }
    }
    this.text(`${String(count).padStart(2, '0')} / 20`, 1148, 104, 32, '#c6f6a3', 'right');
    this.text('ADAPTATIONS', 1148, 127, 11, '#9ab399', 'right');
    this.text(count ? this.creation.adaptations.at(-1)!.name : 'Uncharted potential', 1148, 166, 13, '#abc7a3', 'right');
    this.line([{ x: 50, y: 252 }, { x: 1230, y: 252 }], '#26435b', 1);
    this.text('THE DNA CHAIN', 52, 278, 11, '#9bb3cc');
    this.text('A–T   /   C–G', 1228, 278, 12, '#b3c6e1', 'right');
  }
  private drawStrands(): void {
    // One full extra period allows movement without rebuilding or clipping the waves.
    for (let strand = 0; strand < 2; strand++) {
      const points = Array.from({ length: 341 }, (_, i) => {
        const x = i * (W + 540) / 340;
        return { x, y: 90 + Math.cos((x - 540 - 70) / 270 * Math.PI + strand * Math.PI) * 67 };
      });
      this.line(points, strand ? '#da59d8' : '#38cce9', 7, 14);
      this.line(points, strand ? '#ffc1fb' : '#b7faff', 2);
      for (let i = 0; i < points.length; i += 5) {
        const p = points[i]; this.ellipse(p.x, p.y, 3.5, 3.5, strand ? '#ed96eb' : '#82eeff');
      }
    }
  }
  private drawHelix(): void {
    const c = this.ctx, pos = this.positions();
    const wave = this.reduced ? 0 : Math.sin(this.elapsed * .65 + this.offset * .006) * 5;
    c.drawImage(this.helix, this.offset - 540, 243 + wave);
    const segment = this.creation.segments[this.shownSegment];
    pos.forEach((p, i) => {
      const selected = this.controls.target === i;
      const pair = segment[i];
      const lineColor = selected ? '#ffce78' : '#526d8b';
      this.line([{ x: p.x, y: p.y - 67 }, { x: p.x, y: p.y + 67 }], '#6882a26b', 3);
      for (const [j, dy] of [-23, 23].entries()) {
        c.save(); c.shadowBlur = selected ? 16 : 0; c.shadowColor = '#ffc569';
        this.round(p.x - 38, p.y + dy - 19, 76, 38, 16);
        c.fillStyle = '#060c19'; c.fill(); c.strokeStyle = pair ? COLORS[pair[j] as Base] : lineColor;
        c.lineWidth = selected ? 3 : 2; c.stroke(); c.restore();
      }
      if (pair) {
        this.text(pair[0], p.x, p.y - 17, 18, COLORS[pair[0] as Base], 'center');
        this.text(pair[1], p.x, p.y + 29, 18, COLORS[pair[1] as Base], 'center');
      }
      if (selected) {
        this.line([{ x: p.x - 54, y: p.y }, { x: p.x - 45, y: p.y }], '#ffcc78', 2);
        this.line([{ x: p.x + 45, y: p.y }, { x: p.x + 54, y: p.y }], '#ffcc78', 2);
      }
    });
    this.text(this.controls.target !== null ? 'TARGET LOCKED · CLICK AGAIN TO FIRE' : 'SELECT A PAIR → LOCK A RUNG → CLICK TO FIRE', 640, 444, 12, this.controls.target !== null ? '#f7cb83' : '#8bacc8', 'center');
    this.text('CHAIN TRAVELS SLOWLY TO THE RIGHT  →', 640, 466, 10, '#5a8d9e', 'center');
  }
  private drawMuck(): void {
    const c = this.ctx;
    const goo = c.createLinearGradient(0, 545, 0, H); goo.addColorStop(0, '#245d30'); goo.addColorStop(.4, '#144c2b'); goo.addColorStop(1, '#072b24');
    c.beginPath(); c.moveTo(0, H);
    for (let x = 0; x <= W; x += 8) {
      const y = 590 + Math.sin(x * .015 + (this.reduced ? 0 : this.elapsed * .35)) * 10 + Math.sin(x * .037) * 7;
      c.lineTo(x, y);
    }
    c.lineTo(W, H); c.closePath(); c.fillStyle = goo; c.fill(); c.strokeStyle = '#6bbf4b'; c.lineWidth = 2; c.stroke();
    for (let i = 0; i < 32; i++) {
      const x = (i * 103 + 39) % W, y = 607 + Math.sin(i * 4) * 19;
      this.ellipse(x, y, 7 + i % 9, 3 + i % 5, '#276738', '#367d40');
    }
    for (let i = 0; i < 8; i++) {
      const x = (i * 173 + 91) % W;
      const phase = this.reduced ? .3 : (this.elapsed * .12 + i * .19) % 1;
      this.ellipse(x, 590 - phase * 46, 3 + i % 3, 3 + i % 3, '#65ad4620', '#76cb5b50');
    }
  }
  private drawCannons(): void {
    const c = this.ctx;
    GUN_X.forEach((x, i) => {
      const color = COLORS[BASES[i]], selected = this.controls.selected.includes(BASES[i]);
      const pulse = this.reduced ? 1 : .7 + .3 * Math.sin(this.elapsed * 4);
      c.save();
      if (selected) { c.shadowColor = color; c.shadowBlur = 12 + pulse * 8; }
      this.ellipse(x, 576, 48, 24, '#102332', selected ? color : '#345264');
      this.ellipse(x, 552, 31, 32, '#1c3443', color);
      c.save(); c.translate(x, 552); c.rotate(this.angles[i]);
      const metal = c.createLinearGradient(0, -16, 0, 16);
      metal.addColorStop(0, '#45586b'); metal.addColorStop(.45, '#112435'); metal.addColorStop(1, '#07141e');
      this.round(0, -17, 74, 34, 6); c.fillStyle = metal; c.fill(); c.strokeStyle = color; c.lineWidth = 2; c.stroke();
      c.fillStyle = color; c.globalAlpha = selected ? 1 : .6;
      c.fillRect(32, -11, 23, 22); c.globalAlpha = 1;
      for (let k = 0; k < 3; k++) { c.fillStyle = '#071725'; c.fillRect(35 + k * 7, -12, 3, 24); }
      this.round(67, -20, 11, 40, 3); c.fillStyle = '#182d3e'; c.fill(); c.strokeStyle = color; c.stroke();
      c.restore();
      this.ellipse(x, 552, 20, 21, '#0b1929', '#45637a');
      this.ellipse(x, 552, 10, 11, color, '#ffffff80');
      this.round(x - 48, 584, 96, 56, 10); c.fillStyle = '#0b1824'; c.fill(); c.strokeStyle = selected ? color : '#335561'; c.lineWidth = 2; c.stroke();
      c.restore();
    });
  }
  private drawShot(): void {
    const flight = this.controls.flight; if (!flight) return;
    const t = Math.min(1, this.shotTime / .48), end = this.positions()[flight.slot];
    const center = this.shotOrigins.reduce((p, q) => ({ x: p.x + q.x / 2, y: p.y + q.y / 2 }), { x: 0, y: 0 });
    const x = Phaser.Math.Linear(center.x, end.x, t), y = Phaser.Math.Linear(center.y, end.y, t);
    this.shotOrigins.forEach((origin, i) => {
      const p = { x: x + (i ? 14 : -14) * (1 - t * .4), y };
      this.line([origin, p], `${COLORS[flight.pair[i] as Base]}65`, 2, 6);
      this.ellipse(p.x, p.y, 14, 15, '#102230', COLORS[flight.pair[i] as Base]);
      this.text(flight.pair[i], p.x, p.y + 6, 18, COLORS[flight.pair[i] as Base], 'center');
    });
    this.line([{ x: x - 9, y }, { x: x + 9, y }], '#edffe2', 2, 4);
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
