import './style.css';
import { BASES, Creation, TOTAL_SEGMENTS, type Base } from './model';
import { startField, SHOOTER_RADIUS, W, H, COLORS } from './game';

const app = document.querySelector<HTMLDivElement>('#app')!;
type Side = 'at' | 'cg';
function station(side: Side): string {
  return `<section class="pairing-station station-${side}" data-station="${side}" aria-label="${side.toUpperCase()} pairing station"><span class="station-heading">${side.toUpperCase()} PAIR</span><button class="station-clear" data-clear="${side}" aria-label="Clear ${side.toUpperCase()} preview" title="Clear this side">×</button><div class="pair-hud" id="order-${side}" role="status">${[0, 1].map(position => `<div class="${position ? 'pair-down' : 'pair-up'}"><span class="drop-caption">${position ? '↓ DOWN' : '↑ UP'} </span><button class="preview-slot" data-side="${side}" data-position="${position}" aria-label="${side.toUpperCase()} ${position ? 'DOWN' : 'UP'} preview"><span class="slot-letter">-</span></button></div>`).join('')}<span class="pair-state">PICK UP</span></div><span class="station-hint">DRAG OR CLICK BASES</span></section>`;
}
app.innerHTML = `
  <header><div class="brand"><span class="eyebrow">THE MUTATION LAB</span><h1>MUTA<span>GON</span></h1></div><div class="scoreboard" aria-label="Game score"><div><span class="eyebrow">SCORE</span><strong id="score">0</strong></div><div><span class="eyebrow">CHROMOSOME</span><strong id="progress">1 / 30</strong></div></div><div class="header-actions"><button id="directions">Directions</button><button id="pause">Start experiment</button><button id="restart">Restart</button></div><p id="notice" role="status">Press Start experiment, then choose A + T or C + G.</p></header>
  <dialog id="directions-dialog" aria-labelledby="directions-title"><h2 id="directions-title">How to play Mutagon</h2><ol><li>Choose a matching pair: <strong>A then T, T then A, C then G, or G then C.</strong> Drag complementary bases from the bottom of a station into the green ↑ UP and red ↓ DOWN frames. Or click a base, then click UP or DOWN to place it. Either slot can be filled first. Empty holders are grey. Click a filled holder or drag its base back to the shooters to undo. Use × to reset that side.</li><li>When the pair is <strong>READY</strong>, click an empty chromosome rung to fire. Selected shooters glow while in play.</li><li>Link at least one pair before the chromosome exits the bottom. A completely empty chromosome ends the run. Linked chromosomes return to the top with their pairs preserved; fill all four rungs to advance. Complete <strong>30 chromosomes</strong> to win and watch Mutagon transform.</li></ol><p>Order changes the mutation. Each pair earns 100 points; a completed chromosome adds 400.</p><p><strong>Keyboard</strong><br>A / T / C / G quick-pair shortcuts · 1–4 fire at a rung · Esc clears selection · Space pauses</p><p class="dialog-note">Opening directions pauses the game.</p><form method="dialog"><button autofocus>Back to game</button></form></dialog>
  <main><div class="field-wrap"><div class="game-stage"><div id="field" tabindex="0" aria-label="DNA creation game"></div><div id="launchers" aria-label="Choose complementary bases">${BASES.map(base => `<button class="base base-${base}" data-base="${base}" aria-label="Select base ${base}" aria-pressed="false">${base}<span class="position-label" aria-hidden="true" hidden></span></button>`).join('')}</div><div id="pair-huds" aria-label="Base order">${station('at')}${station('cg')}</div></div></div>
  <section class="game-tools" aria-label="Game settings"><label><input id="motion" type="checkbox"> Reduced motion</label><button id="sound" aria-pressed="true">Sound on</button><button id="save">Export creation</button><label class="import">Load creation<input id="load" type="file" accept="application/json,.json"></label></section>
  <details><summary>Your mutations <span id="mutation-count">0</span></summary><ol id="mutations"></ol><p>Chromosome patterns <span id="count">0</span></p><ol id="adaptations"></ol></details>
  <footer>IMAGINATIVE BIOLOGY · Base pairing is real. Creature adaptations are fictional.</footer></main>`;
const gameElement = document.querySelector<HTMLDivElement>('#field')!;
const notice = document.querySelector<HTMLParagraphElement>('#notice')!;
const pause = document.querySelector<HTMLButtonElement>('#pause')!;
const score = document.querySelector('#score')!;
const progress = document.querySelector('#progress')!;
const count = document.querySelector('#count')!;
const adaptations = document.querySelector('#adaptations')!;
const baseButtons = [...document.querySelectorAll<HTMLButtonElement>('[data-base]')];
let displayedCreation: Creation | undefined;
let displayedAdaptations = -1;
let displayedMutations = -1;
let pendingBase: Base | null = null;
let creation = new Creation();
const field = startField(document.querySelector('#field')!, creation, {
  changed: render,
  notice: message => { notice.textContent = message; },
});
field.setReduced(matchMedia('(prefers-reduced-motion: reduce)').matches);
// Reserve only the actual header and controls; the rest belongs to the game.
const fitViewport = new ResizeObserver(() => {
  const chrome = document.querySelector('header')!.getBoundingClientRect().height
    + document.querySelector('.game-tools')!.getBoundingClientRect().height + 12;
  document.documentElement.style.setProperty('--game-chrome', `${Math.ceil(chrome)}px`);
  if (field.game?.isBooted) {
    field.game.scale.getParentBounds();
    field.game.scale.refresh();
  }
});
fitViewport.observe(document.querySelector('header')!);
fitViewport.observe(document.querySelector('.game-tools')!);
fitViewport.observe(document.querySelector('.game-stage')!);
const motion = document.querySelector<HTMLInputElement>('#motion')!;
motion.checked = field.reduced;
motion.onchange = () => field.setReduced(motion.checked);
const directions = document.querySelector<HTMLDialogElement>('#directions-dialog')!;
let resumeAfterDirections = false;
document.querySelector<HTMLButtonElement>('#directions')!.onclick = () => {
  resumeAfterDirections = !field.paused && !creation.done && !field.failed;
  field.setPause(true);
  directions.showModal();
};
directions.onclose = () => {
  if (resumeAfterDirections && !document.hidden) field.setPause(false);
  resumeAfterDirections = false;
};
const sound = document.querySelector<HTMLButtonElement>('#sound')!;
sound.onclick = () => {
  field.labAudio.setEnabled(!field.labAudio.enabled);
  sound.textContent = field.labAudio.enabled ? 'Sound on' : 'Sound off';
  sound.setAttribute('aria-pressed', String(field.labAudio.enabled));
};
function render(): void {
  score.textContent = creation.score.toLocaleString();
  progress.textContent = `${creation.done ? TOTAL_SEGMENTS : creation.active + 1} / ${TOTAL_SEGMENTS}`;
  if (displayedCreation !== creation || displayedAdaptations !== creation.completed || displayedMutations !== creation.mutations.length) {
    count.textContent = String(creation.completed);
    document.querySelector('#mutation-count')!.textContent = String(creation.mutations.length);
    document.querySelector('#mutations')!.replaceChildren(...creation.mutations.map(m => {
      const item = document.createElement('li');
      item.textContent = `${m.name} — ${m.pair} · chromosome ${m.segment + 1}, rung ${m.slot + 1}`;
      item.style.color = m.color;
      return item;
    }));
    adaptations.replaceChildren(...creation.adaptations.map(a => {
      const item = document.createElement('li'); item.textContent = `${a.name} — ${a.pattern.join(' · ')}`; return item;
    }));
    displayedCreation = creation; displayedAdaptations = creation.completed; displayedMutations = creation.mutations.length;
  }
  pause.disabled = field.failed || creation.done;
  pause.textContent = field.failed ? 'Restart required' : creation.done ? 'Experiment complete' : field.paused ? (field.elapsed || creation.placements.length ? 'Resume creating' : 'Start experiment') : 'Pause';
  if (field.controls.flight || field.transition || creation.done || field.failed) pendingBase = null;
  const ordered = field.controls.flight?.pair.split('') ?? field.controls.slots;
  for (const [id, bases] of [['order-at', ['A', 'T']], ['order-cg', ['C', 'G']]] as const) {
    const first = ordered[0] ?? ordered[1];
    const matching = first && (bases as readonly string[]).includes(first);
    const hud = document.getElementById(id)!;
    const up = matching ? ordered[0] ?? '-' : '-', down = matching ? ordered[1] ?? '-' : '-';
    const state = matching ? field.controls.flight ? 'FIRING' : ordered.every(Boolean) ? 'READY' : up === '-' ? 'PICK UP' : 'PICK DOWN' : 'PICK UP';
    const stationElement = hud.closest<HTMLElement>('.pairing-station')!;
    stationElement.dataset.active = String(!!matching || !!pendingBase && (bases as readonly string[]).includes(pendingBase));
    for (const position of [0, 1] as const) {
      const slot = hud.querySelector<HTMLButtonElement>(`[data-position="${position}"]`)!;
      const value = position ? down : up;
      slot.querySelector('.slot-letter')!.textContent = value;
      slot.style.setProperty('--letter-color', value === '-' ? '#8ea6b5' : COLORS[value as Base]);
      slot.dataset.filled = String(value !== '-');
      slot.dataset.next = String(value === '-');
      slot.dataset.carry = String(!!pendingBase && (bases as readonly string[]).includes(pendingBase));
      slot.setAttribute('aria-label', `${id === 'order-at' ? 'AT' : 'CG'} ${position ? 'DOWN' : 'UP'} preview: ${value === '-' ? 'empty' : value}`);
      slot.disabled = field.paused || creation.done || field.failed || !!field.controls.flight || !!field.transition;
    }
    hud.querySelector('.pair-state')!.textContent = state;
    hud.setAttribute('aria-label', matching ? `Up ${up}, down ${down === '-' ? 'awaiting selection' : down}. ${state}` : 'Pick the up base first, then the down base');
    stationElement.querySelector<HTMLButtonElement>('.station-clear')!.disabled = !!field.controls.flight;
    stationElement.querySelector('.station-hint')!.textContent = matching && ordered.every(Boolean) ? 'CLICK A CHAIN TO FIRE' : pendingBase && (bases as readonly string[]).includes(pendingBase) ? `PLACE ${pendingBase} IN UP / DOWN` : 'BASE → UP / DOWN';
  }
  baseButtons.forEach(button => {
    const base = button.dataset.base as typeof BASES[number];
    button.style.left = `${(field.launcherX(base) - SHOOTER_RADIUS) / W * 100}%`;
    button.style.top = `${(field.launcherY(base) - SHOOTER_RADIUS) / H * 100}%`;
    button.style.width = `${SHOOTER_RADIUS * 2 / W * 100}%`;
    button.style.height = `${SHOOTER_RADIUS * 2 / H * 100}%`;
    const index = ordered.indexOf(base);
    button.setAttribute('aria-pressed', String(index >= 0 || pendingBase === base));
    button.dataset.picked = String(pendingBase === base);
    button.dataset.position = index === 0 ? 'top' : index === 1 ? 'bottom' : 'none';
    button.setAttribute('aria-label', index >= 0 ? `Select base ${base}, ${index === 0 ? 'top' : 'bottom'} of pair` : `Select base ${base}`);
    const label = button.querySelector<HTMLSpanElement>('.position-label')!;
    label.hidden = index < 0 && pendingBase !== base;
    label.textContent = index === 0 ? '↑ UP' : index === 1 ? '↓ DOWN' : 'PLACE';
    button.disabled = field.paused || field.failed || creation.done;
  });
  gameElement.style.cursor = field.controls.pair && !field.paused ? 'crosshair' : 'default';
  if (creation.done) notice.textContent = 'Your life form is complete! Export your creation or restart to discover another.';
}
pause.onclick = () => {
  field.setPause(!field.paused);
  if (!field.paused) gameElement.focus({ preventScroll: true });
};
gameElement.addEventListener('pointerdown', () => gameElement.focus({ preventScroll: true }));
document.querySelector('#restart')!.addEventListener('click', () => {
  clearPreviewFocus(); endDrag();
  creation = new Creation(); field.reset(creation); field.setPause(false);
  notice.textContent = 'A fresh beginning. Choose A + T or C + G.';
});
let suppressBaseClick = false;
function clearPreviewFocus(): void { pendingBase = null; }
function selectBase(base: Base): void {
  if (field.paused || field.failed || creation.done || field.controls.flight || field.transition) return;
  if (pendingBase !== base && field.controls.selected.includes(base)) {
    pendingBase = null; field.deselect(base); render(); return;
  }
  pendingBase = pendingBase === base ? null : base;
  render();
  notice.textContent = pendingBase ? `${base} selected — click UP or DOWN to place it.` : 'Base selection cleared.';
}
function fillPreview(base: Base, side: Side, position: 0 | 1): void {
  if (!(side === 'at' ? ['A', 'T'] : ['C', 'G']).includes(base)) {
    notice.textContent = `Use ${side.toUpperCase().split('').join(' or ')} in this station.`; return;
  }
  if (field.assemble(base, position)) pendingBase = null;
  render();
}
document.querySelectorAll<HTMLButtonElement>('.station-clear').forEach(button => {
  button.onclick = () => {
    const side = button.dataset.clear as Side;
    const bases = side === 'at' ? ['A', 'T'] : ['C', 'G'];
    const hadPick = !!pendingBase && bases.includes(pendingBase) || field.controls.selected.some(base => bases.includes(base));
    if (pendingBase && bases.includes(pendingBase)) clearPreviewFocus();
    field.clearSide(side); render();
    if (hadPick) notice.textContent = `${side.toUpperCase()} preview cleared. Choose a new base.`;
  };
});
document.querySelectorAll<HTMLButtonElement>('.preview-slot').forEach(button => {
  button.onclick = () => {
    if (suppressBaseClick) { suppressBaseClick = false; return; }
    if (pendingBase) fillPreview(pendingBase, button.dataset.side as Side, Number(button.dataset.position) as 0 | 1);
    else {
      const value = field.controls.slots[Number(button.dataset.position)];
      if (value && (button.dataset.side === 'at' ? ['A', 'T'] : ['C', 'G']).includes(value)) field.deselect(value);
      else notice.textContent = 'Click a base first, then click UP or DOWN to place it.';
    }
  };
});
let drag: { base: Base; pointer: number; x: number; y: number; source: 'base' | 'holder'; side?: Side; ghost?: HTMLDivElement } | null = null;
function dragTarget(x: number, y: number): HTMLButtonElement | null {
  return document.elementFromPoint(x, y)?.closest<HTMLButtonElement>('.preview-slot') ?? null;
}
function returnTray(x: number, y: number, side: Side): HTMLElement | null {
  const station = document.querySelector<HTMLElement>(`[data-station="${side}"]`)!;
  const bounds = station.getBoundingClientRect();
  return x >= bounds.left && x <= bounds.right && y >= bounds.top + bounds.height * .64 && y <= bounds.bottom ? station : null;
}
function clearReturnHighlights(): void {
  document.querySelectorAll('[data-return-hover]').forEach(el => el.removeAttribute('data-return-hover'));
}
function endDrag(): void {
  drag?.ghost?.remove(); drag = null;
  document.querySelectorAll('.drop-hover').forEach(el => el.classList.remove('drop-hover'));
  clearReturnHighlights();
}
document.querySelectorAll<HTMLButtonElement>('.preview-slot').forEach(button => {
  button.addEventListener('pointerdown', event => {
    suppressBaseClick = false;
    if (event.button !== 0 || button.disabled) return;
    const side = button.dataset.side as Side, base = field.controls.slots[Number(button.dataset.position)];
    if (!base || !(side === 'at' ? ['A', 'T'] : ['C', 'G']).includes(base)) return;
    drag = { base, pointer: event.pointerId, x: event.clientX, y: event.clientY, source: 'holder', side };
    button.setPointerCapture(event.pointerId);
  });
});
baseButtons.forEach(button => {
  button.onclick = () => {
    if (suppressBaseClick) { suppressBaseClick = false; return; }
    selectBase(button.dataset.base as Base);
  };
  button.addEventListener('pointerdown', event => {
    suppressBaseClick = false;
    if (event.button !== 0 || button.disabled || field.controls.flight || field.transition) return;
    drag = { base: button.dataset.base as Base, pointer: event.pointerId, x: event.clientX, y: event.clientY, source: 'base' };
    button.setPointerCapture(event.pointerId);
  });
});
document.addEventListener('pointermove', event => {
  if (!drag || drag.pointer !== event.pointerId) return;
  if (!drag.ghost && Math.hypot(event.clientX - drag.x, event.clientY - drag.y) < 6) return;
  if (!drag.ghost) {
    const ghost = document.createElement('div'); ghost.className = 'base-drag'; ghost.textContent = drag.base;
    ghost.style.color = COLORS[drag.base]; document.body.append(ghost); drag.ghost = ghost;
  }
  drag.ghost.style.left = `${event.clientX}px`; drag.ghost.style.top = `${event.clientY}px`;
  document.querySelectorAll('.drop-hover').forEach(el => el.classList.remove('drop-hover'));
  clearReturnHighlights();
  if (drag.source === 'holder') {
    const tray = returnTray(event.clientX, event.clientY, drag.side!);
    if (tray) tray.dataset.returnHover = 'true';
  } else {
    const target = dragTarget(event.clientX, event.clientY);
    if (target && !target.disabled) target.classList.add('drop-hover');
  }
});
document.addEventListener('pointerup', event => {
  if (!drag || drag.pointer !== event.pointerId) return;
  if (drag.ghost) {
    suppressBaseClick = true;
    if (drag.source === 'holder') {
      if (returnTray(event.clientX, event.clientY, drag.side!)) {
        if (pendingBase === drag.base) pendingBase = null;
        field.deselect(drag.base); render();
      }
    } else {
      const target = dragTarget(event.clientX, event.clientY);
      if (target && !target.disabled) fillPreview(drag.base, target.dataset.side as Side, Number(target.dataset.position) as 0 | 1);
    }
  }
  endDrag();
});
document.addEventListener('pointercancel', endDrag);
document.addEventListener('keydown', event => {
  if (directions.open || event.target instanceof HTMLInputElement || event.repeat || event.ctrlKey || event.altKey || event.metaKey) return;
  if (event.target instanceof HTMLButtonElement && ['Enter', ' '].includes(event.key)) return;
  const key = event.key.toUpperCase();
  if (BASES.includes(key as typeof BASES[number])) { pendingBase = null; field.choose(key as Base); }
  else if (/^[1-4]$/.test(key)) {
    gameElement.focus({ preventScroll: true }); field.target(Number(key) - 1);
  }
  else if (key === 'ENTER') { event.preventDefault(); field.target(null); }
  else if (key === 'ESCAPE') { endDrag(); clearPreviewFocus(); field.controls.cancel(); field.cancelLock(); }
  else if (key === ' ') { event.preventDefault(); field.setPause(!field.paused); }
});
document.querySelector('#save')!.addEventListener('click', () => {
  const url = URL.createObjectURL(new Blob([JSON.stringify(creation.save(), null, 2)], { type: 'application/json' }));
  const link = document.createElement('a'); link.href = url; link.download = 'dna-creation.json'; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
document.querySelector<HTMLInputElement>('#load')!.onchange = async event => {
  const input = event.target as HTMLInputElement;
  try {
    if (!input.files?.[0]) return;
    if (input.files[0].size > 32_768) throw new Error('Creation file too large.');
    const restored = Creation.restore(JSON.parse(await input.files[0].text()));
    clearPreviewFocus(); endDrag();
    creation = restored; field.reset(creation); field.setPause(true);
    notice.textContent = 'Creation restored. Resume when ready.';
  } catch { notice.textContent = 'Could not load this creation. Choose a valid DNA Shooter export.'; }
  input.value = '';
};

// A hidden tab returns paused; queued shots cannot fire unexpectedly on return.
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { endDrag(); field.setPause(true); }
});
render();
