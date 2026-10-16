import './style.css';
import { BASES, Creation, SLOTS, TOTAL_SEGMENTS, type Base, type Pair } from './model';
import { startField, SHOOTER_RADIUS, W, H } from './game';
import { COLORS, SIDE_BASES, belongsToSide, type Side } from './bases';
import { creatureMotion } from './motion';
import { mountScienceReel, scienceReelMarkup } from './science-reel';
import { dnaTrackerMarkup, mountDnaTracker } from './dna-tracker';

const app = document.querySelector<HTMLDivElement>('#app')!;
function station(side: Side): string {
  return `<section class="pairing-station station-${side}" data-station="${side}" aria-label="${side.toUpperCase()} pairing station"><span class="station-heading">${side.toUpperCase()} PAIR</span><button class="station-clear" data-clear="${side}" aria-label="Clear ${side.toUpperCase()} preview" title="Clear this side">×</button><div class="pair-hud" id="order-${side}" role="status">${[0, 1].map(position => `<div class="${position ? 'pair-down' : 'pair-up'}"><span class="drop-caption">${position ? '↓ DOWN' : '↑ UP'} </span><button class="preview-slot" data-side="${side}" data-position="${position}" aria-label="${side.toUpperCase()} ${position ? 'DOWN' : 'UP'} preview"><span class="slot-letter">-</span></button></div>`).join('')}<button class="pair-state" type="button" disabled>PICK UP</button></div><span class="station-hint">DRAG OR CLICK BASES</span></section>`;
}
app.innerHTML = `
  <header><div class="brand"><span class="eyebrow">THE MUTATION LAB</span><h1>MUTA<span>GON</span></h1></div><div class="scoreboard" aria-label="Game score"><div><span class="eyebrow">SCORE</span><strong id="score">0</strong></div><div><span class="eyebrow">QUADRA-CHROME</span><strong id="progress">1 / ${TOTAL_SEGMENTS}</strong></div></div><div class="header-actions"><button id="directions">Directions</button><button id="pause">Start experiment</button><button id="restart">Restart</button></div></header>
  <dialog id="directions-dialog" aria-labelledby="directions-title">
    <h2 id="directions-title" tabindex="-1" autofocus>How to play Mutagon</h2>
    <p>Each <strong>quadra-chrome</strong> is one set of <strong>four DNA pairs</strong>. Complete <strong>${TOTAL_SEGMENTS} quadra-chromes</strong> and watch a small, jiggly green glob become your own imaginary organism.</p>
    <ol>
      <li><strong>Start experiment.</strong> Choose the A/T station on the left or the C/G station on the right.</li>
      <li><strong>Build an UP / DOWN pair.</strong> Drag a base into the green ↑ UP or red ↓ DOWN holder. Or click a base, then click its holder. Either holder can be filled first. Match <strong>A with T</strong> or <strong>C with G</strong>. The UP base goes on top of the chain, so you can make <strong>AT, TA, CG, or GC</strong>.</li>
      <li><strong>Ready? Pick a chain.</strong> A flashing green box with slime drips and a <strong>READY</strong> label marks a complete pair. Drag the completed pair by its green frame or READY button onto an empty chain, or click an empty chain to fire. You can also drag a filled holder onto a chain to fire the whole ready pair. A valid drop target lights up; dropping elsewhere keeps your pair ready. Wait for the shot to land before building your next pair.</li>
      <li><strong>Change your pick.</strong> Empty holders have a grey outline and <strong>-</strong>. A red × marks each picked base. Click it again to deselect it. Click a filled holder, or drag its letter back to its own shooter tray, to undo that placement. The other holder stays filled. Use <strong>×</strong> to clear that side. Fired pairs stay in the quadra-chrome.</li>
      <li><strong>Complete the quadra-chrome.</strong> Its four chains stream from the top toward the bottom without looping back or resetting. Fill each chain before it reaches the exit. <strong>Any empty chain touching the bottom ends the game</strong>, even if the other chains have pairs. Filled chains can leave safely. Complete all four pairs to advance; the completed set shakes, glimmers, and sparks before drifting down to the master chain. Its matching DNA Patterns row glows as it arrives, then the next quadra-chrome enters. A shot must land before its empty chain reaches the exit. Use <strong>Restart</strong> after game over.</li>
      <li><strong>Watch your organism grow.</strong> Every landed pair adds a random colored mutation and changes its movement. New games start with a small green glob and grow a different mix of traits. Pair order influences the result in this game. Earn <strong>100 points per pair</strong> and <strong>400 extra</strong> for completing a quadra-chrome. The <strong>DNA Patterns</strong> ticker to Mutagon’s right records each quadra-chrome’s four pairs in chain order as you land them. Completed rows turn green; the outlined row is your current quadra-chrome. Open <strong>Your mutations</strong> below the controls to review your discoveries.</li>
    </ol>
    <p><strong>Learn as you play.</strong> The <strong>DNA Dispatch</strong> reel beneath the playfield shares colorful genetics facts. Hover over it, focus it, or press <strong>Pause reel</strong> to read. Click a fact to open its science source. Real DNA uses complementary base pairing; Mutagon’s instant tusks, tentacles, and other creature transformations are imaginary.</p>
    <p><strong>Make it comfortable.</strong> Toggle <strong>Sound</strong> for slime, bubbling gases, and primordial rumble. Each complementary pair has its own tone; completing a quadra-chrome plays its ordered four-note pattern and a unique signature chime. <strong>Reduced motion</strong> steadies decorative movement and the ready frame; scroll the science reel sideways to read. The quadra-chrome stream keeps moving. <strong>Export creation</strong> saves your progress; <strong>Load creation</strong> restores the same mutations paused. <strong>Restart</strong> begins again with a fresh blob.</p>
    <p><strong>Keyboard</strong><br>A / T / C / G select a quick pair in order (first UP, then DOWN) · 1–4 fire at a chain from top to bottom · Esc clears selection · Space pauses or resumes.</p>
    <p class="dialog-note">Opening Directions pauses the experiment. Closing it resumes a run that was already playing.</p>
    <form method="dialog"><button>Back to game</button></form>
  </dialog>
  <main><div class="field-wrap"><div class="game-stage"><div class="game-area"><div id="field" tabindex="0" aria-label="DNA creation game"></div><div id="launchers" aria-label="Choose complementary bases">${BASES.map(base => `<button class="base base-${base}" data-base="${base}" aria-label="Select base ${base}" aria-pressed="false">${base}<span class="position-label" aria-hidden="true" hidden></span></button>`).join('')}</div><div id="pair-huds" aria-label="Base order">${station('at')}${station('cg')}</div><div class="field-labels"><section class="field-label canal-label" aria-label="DNA canal status"><h2>DNA CANAL <span id="canal-link">EMPTY</span></h2><p id="notice" role="status">Fill every chain before it reaches the bottom.</p></section><section class="field-label organism-label" aria-label="Mutagon status"><h2>MUTAGON <span id="organism-count">0 MUTATIONS</span></h2><p id="organism-motion">PRIMORDIAL WIGGLE</p></section></div></div>${dnaTrackerMarkup()}</div></div>
  ${scienceReelMarkup()}
  <section class="game-tools" aria-label="Game settings"><label><input id="motion" type="checkbox"> Reduced motion</label><button id="sound" aria-pressed="true">Sound on</button><button id="save">Export creation</button><label class="import">Load creation<input id="load" type="file" accept="application/json,.json"></label></section>
  <details><summary>Your mutations <span id="mutation-count">0</span></summary><ol id="mutations"></ol><p>Chromosome patterns <span id="count">0</span></p><ol id="adaptations"></ol></details>
  <footer>IMAGINATIVE BIOLOGY · Base pairing is real. Creature adaptations are fictional.</footer></main>`;
const gameElement = document.querySelector<HTMLDivElement>('#field')!;
const notice = document.querySelector<HTMLParagraphElement>('#notice')!;
function showNotice(message: string): void { notice.textContent = message; notice.title = message; }
const pause = document.querySelector<HTMLButtonElement>('#pause')!;
const score = document.querySelector('#score')!;
const progress = document.querySelector('#progress')!;
const count = document.querySelector('#count')!;
const adaptations = document.querySelector('#adaptations')!;
const mutations = document.querySelector('#mutations')!;
const mutationCount = document.querySelector('#mutation-count')!;
const gameArea = document.querySelector<HTMLElement>('.game-area')!;
const canalLink = document.querySelector('#canal-link')!;
const organismCount = document.querySelector('#organism-count')!;
const motionLabel = document.querySelector<HTMLElement>('#organism-motion')!;
const baseButtons = [...document.querySelectorAll<HTMLButtonElement>('[data-base]')];
const stations = (Object.keys(SIDE_BASES) as Side[]).map(side => {
  const element = document.querySelector<HTMLElement>(`[data-station="${side}"]`)!;
  const hud = element.querySelector<HTMLElement>('.pair-hud')!;
  return {
    side, element, hud,
    slots: [...hud.querySelectorAll<HTMLButtonElement>('.preview-slot')].map(button => ({ button, letter: button.querySelector<HTMLElement>('.slot-letter')! })),
    handle: hud.querySelector<HTMLButtonElement>('.pair-state')!,
    clear: element.querySelector<HTMLButtonElement>('.station-clear')!,
    hint: element.querySelector<HTMLElement>('.station-hint')!,
  };
});
const positionLabels = baseButtons.map(button => button.querySelector<HTMLSpanElement>('.position-label')!);
const reelElement = document.querySelector<HTMLElement>('.science-reel')!;
const scienceReel = mountScienceReel(reelElement);
const updateDnaTracker = mountDnaTracker(document.querySelector<HTMLElement>('.dna-tracker')!);
let displayedCreation: Creation | undefined;
let displayedAdaptations = -1;
let displayedMutations = -1;
let displayedAspect = -1;
let pendingBase: Base | null = null;
let creation = new Creation();
const field = startField(document.querySelector('#field')!, creation, {
  changed: render,
  notice: message => { showNotice(message); },
});
field.setReduced(matchMedia('(prefers-reduced-motion: reduce)').matches);
scienceReel.setReduced(field.reduced);
// Reserve only the actual header and controls; the rest belongs to the game.
const header = document.querySelector('header')!;
const tools = document.querySelector('.game-tools')!;
let fittedChrome = -1, fittedWidth = -1, fittedHeight = -1;
const fitViewport = new ResizeObserver(() => {
  const chrome = Math.ceil(header.getBoundingClientRect().height + tools.getBoundingClientRect().height + reelElement.getBoundingClientRect().height + 12);
  if (chrome !== fittedChrome) {
    document.documentElement.style.setProperty('--game-chrome', `${chrome}px`);
    fittedChrome = chrome;
  }
  const { width, height } = gameArea.getBoundingClientRect();
  if (field.game?.isBooted && (width !== fittedWidth || height !== fittedHeight)) {
    fittedWidth = width; fittedHeight = height;
    field.game.scale.getParentBounds();
    field.game.scale.refresh();
  }
});
fitViewport.observe(header);
fitViewport.observe(tools);
fitViewport.observe(reelElement);
fitViewport.observe(document.querySelector('.game-stage')!);
fitViewport.observe(gameArea);
const motion = document.querySelector<HTMLInputElement>('#motion')!;
motion.checked = field.reduced;
motion.onchange = () => { field.setReduced(motion.checked); scienceReel.setReduced(motion.checked); render(); };
const directions = document.querySelector<HTMLDialogElement>('#directions-dialog')!;
let resumeAfterDirections = false;
document.querySelector<HTMLButtonElement>('#directions')!.onclick = () => {
  endDrag();
  resumeAfterDirections = !field.paused && (!creation.done || !!field.transition) && !field.failed;
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
  gameArea.dataset.completionPhase = field.completionPhase;
  updateDnaTracker(creation, { phase: field.completionPhase, segment: field.shownSegment, linkedSegment: field.linkedSegment, paused: field.paused, reduced: field.reduced });
  canalLink.textContent = `${creation.segments[field.shownSegment].filter(Boolean).length} / ${SLOTS} PAIRED`;
  organismCount.textContent = `${creation.mutations.length} MUTATIONS`;
  motionLabel.textContent = creatureMotion(creation.mutations, field.elapsed, field.reduced).name.toUpperCase();
  motionLabel.title = creation.mutations.at(-1)?.name ?? 'Green blob · awaiting first mutation';
  score.textContent = creation.score.toLocaleString();
  progress.textContent = `${creation.done ? TOTAL_SEGMENTS : creation.active + 1} / ${TOTAL_SEGMENTS}`;
  if (displayedCreation !== creation || displayedAdaptations !== creation.completed || displayedMutations !== creation.mutations.length) {
    if (displayedCreation !== creation) {
      mutations.replaceChildren(); adaptations.replaceChildren();
      displayedMutations = 0; displayedAdaptations = 0;
    }
    count.textContent = String(creation.completed);
    mutationCount.textContent = String(creation.mutations.length);
    mutations.append(...creation.mutations.slice(displayedMutations).map(m => {
      const item = document.createElement('li');
      item.textContent = `${m.name} — ${m.pair} · quadra-chrome ${m.segment + 1}, rung ${m.slot + 1}`;
      item.style.color = m.color;
      return item;
    }));
    adaptations.append(...creation.adaptations.slice(displayedAdaptations).map(a => {
      const item = document.createElement('li'); item.textContent = `${a.name} — ${a.pattern.join(' · ')}`; return item;
    }));
    displayedCreation = creation; displayedAdaptations = creation.completed; displayedMutations = creation.mutations.length;
  }
  pause.disabled = field.failed || creation.done && !field.transition;
  pause.textContent = field.failed ? 'Restart required' : creation.done && !field.transition ? 'Experiment complete' : field.paused ? (field.elapsed || creation.placements.length ? 'Resume creating' : 'Start experiment') : 'Pause';
  if (field.controls.flight || field.transition || creation.done || field.failed) pendingBase = null;
  const ordered = field.controls.flight?.pair.split('') ?? field.controls.slots;
  for (const station of stations) {
    const { side, hud, element: stationElement, handle: pairHandle } = station;
    const first = ordered[0] ?? ordered[1];
    const matching = first && belongsToSide(first as Base, side);
    hud.dataset.ready = String(!!matching && !!field.controls.pair && !field.controls.flight && !field.paused && !field.transition && !field.failed && !creation.done);
    hud.dataset.reduced = String(field.reduced);
    const up = matching ? ordered[0] ?? '-' : '-', down = matching ? ordered[1] ?? '-' : '-';
    const state = matching ? field.controls.flight ? 'FIRING' : ordered.every(Boolean) ? 'READY' : up === '-' ? 'PICK UP' : 'PICK DOWN' : 'PICK UP';
    stationElement.dataset.active = String(!!matching || !!pendingBase && belongsToSide(pendingBase, side));
    for (const position of [0, 1] as const) {
      const { button: slot, letter } = station.slots[position];
      const value = position ? down : up;
      letter.textContent = value;
      slot.style.setProperty('--letter-color', value === '-' ? '#8ea6b5' : COLORS[value as Base]);
      slot.dataset.filled = String(value !== '-');
      slot.dataset.next = String(value === '-');
      slot.dataset.carry = String(!!pendingBase && belongsToSide(pendingBase, side));
      slot.setAttribute('aria-label', `${side.toUpperCase()} ${position ? 'DOWN' : 'UP'} preview: ${value === '-' ? 'empty' : value}`);
      slot.disabled = field.paused || creation.done || field.failed || !!field.controls.flight || !!field.transition;
    }
    pairHandle.textContent = state;
    pairHandle.disabled = hud.dataset.ready !== 'true';
    pairHandle.setAttribute('aria-label', hud.dataset.ready === 'true' ? `Drag ${up}${down} pair onto an empty chain, or click a chain to fire` : state);
    hud.setAttribute('aria-label', matching ? `Up ${up}, down ${down === '-' ? 'awaiting selection' : down}. ${state}` : 'Pick the up base first, then the down base');
    station.clear.disabled = !!field.controls.flight;
    station.hint.textContent = matching && ordered.every(Boolean) ? 'DRAG PAIR / CLICK CHAIN' : pendingBase && belongsToSide(pendingBase, side) ? `PLACE ${pendingBase} IN UP / DOWN` : 'BASE → UP / DOWN';
  }
  baseButtons.forEach((button, buttonIndex) => {
    const base = button.dataset.base as typeof BASES[number];
    if (displayedAspect !== field.aspectCorrection) {
      button.style.left = `${(field.launcherX(base) - SHOOTER_RADIUS) / W * 100}%`;
      button.style.top = `${(field.launcherY(base) - SHOOTER_RADIUS * field.aspectCorrection) / H * 100}%`;
      button.style.width = `${SHOOTER_RADIUS * 2 / W * 100}%`;
      button.style.height = `${SHOOTER_RADIUS * 2 * field.aspectCorrection / H * 100}%`;
    }
    const index = ordered.indexOf(base);
    button.setAttribute('aria-pressed', String(index >= 0 || pendingBase === base));
    button.dataset.picked = String(pendingBase === base);
    button.dataset.position = index === 0 ? 'top' : index === 1 ? 'bottom' : 'none';
    button.setAttribute('aria-label', index >= 0 ? `Select base ${base}, ${index === 0 ? 'top' : 'bottom'} of pair` : `Select base ${base}`);
    const label = positionLabels[buttonIndex];
    label.hidden = index < 0 && pendingBase !== base;
    label.textContent = index === 0 ? '↑ UP' : index === 1 ? '↓ DOWN' : 'PLACE';
    button.disabled = field.paused || field.failed || creation.done;
  });
  displayedAspect = field.aspectCorrection;
  gameElement.style.cursor = field.controls.pair && !field.paused ? 'crosshair' : 'default';
  if (creation.done && !field.transition) showNotice('Your life form is complete! All quadra-chromes joined the master chain. Export your creation or restart to discover another.');
}
pause.onclick = () => {
  endDrag();
  field.setPause(!field.paused);
  if (!field.paused) gameElement.focus({ preventScroll: true });
};
gameElement.addEventListener('pointerdown', () => gameElement.focus({ preventScroll: true }));
document.querySelector('#restart')!.addEventListener('click', () => {
  clearPreviewFocus(); endDrag();
  creation = new Creation(); field.reset(creation); field.setPause(false);
  showNotice('A fresh beginning. Choose A + T or C + G.');
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
  showNotice(pendingBase ? `${base} selected — click UP or DOWN to place it.` : 'Base selection cleared.');
}
function fillPreview(base: Base, side: Side, position: 0 | 1): void {
  if (!belongsToSide(base, side)) {
    showNotice(`Use ${side.toUpperCase().split('').join(' or ')} in this station.`); return;
  }
  if (field.assemble(base, position)) pendingBase = null;
  render();
}
document.querySelectorAll<HTMLButtonElement>('.station-clear').forEach(button => {
  button.onclick = () => {
    const side = button.dataset.clear as Side;
    const bases: readonly Base[] = SIDE_BASES[side];
    const hadPick = !!pendingBase && bases.includes(pendingBase) || field.controls.selected.some(base => bases.includes(base));
    if (pendingBase && bases.includes(pendingBase)) clearPreviewFocus();
    field.clearSide(side); render();
    if (hadPick) showNotice(`${side.toUpperCase()} preview cleared. Choose a new base.`);
  };
});
document.querySelectorAll<HTMLButtonElement>('.preview-slot').forEach(button => {
  button.onclick = () => {
    if (suppressBaseClick) { suppressBaseClick = false; return; }
    if (pendingBase) fillPreview(pendingBase, button.dataset.side as Side, Number(button.dataset.position) as 0 | 1);
    else {
      const value = field.controls.slots[Number(button.dataset.position)];
      if (value && belongsToSide(value, button.dataset.side as Side)) field.deselect(value);
      else showNotice('Click a base first, then click UP or DOWN to place it.');
    }
  };
});
let drag: { base: Base | null; pair: Pair | null; pointer: number; x: number; y: number; source: 'base' | 'holder' | 'pair'; side?: Side; ghost?: HTMLDivElement } | null = null;
function chainDropTarget(x: number, y: number): number | null {
  if (!drag?.pair || drag.pair !== field.controls.pair || field.paused || field.failed || creation.done || field.transition || field.controls.flight) return null;
  const bounds = gameElement.querySelector('canvas')!.getBoundingClientRect();
  return field.chainAt((x - bounds.left) / bounds.width * W, (y - bounds.top) / bounds.height * H, true);
}
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
  if (drag?.ghost) suppressBaseClick = true;
  drag?.ghost?.remove(); drag = null;
  field.highlightDrop(null);
  document.querySelectorAll('.drop-hover').forEach(el => el.classList.remove('drop-hover'));
  clearReturnHighlights();
}
document.querySelectorAll<HTMLButtonElement>('.preview-slot').forEach(button => {
  button.addEventListener('pointerdown', event => {
    suppressBaseClick = false;
    if (drag || event.button !== 0 || button.disabled) return;
    const side = button.dataset.side as Side, base = field.controls.slots[Number(button.dataset.position)];
    if (!base || !belongsToSide(base, side)) return;
    drag = { base, pair: field.controls.pair, pointer: event.pointerId, x: event.clientX, y: event.clientY, source: 'holder', side };
    button.setPointerCapture(event.pointerId);
  });
});
document.querySelectorAll<HTMLElement>('.pair-hud').forEach(hud => {
  hud.addEventListener('pointerdown', event => {
    if (drag || event.button !== 0 || hud.dataset.ready !== 'true' || (event.target as HTMLElement).closest('.preview-slot')) return;
    suppressBaseClick = false;
    drag = { base: null, pair: field.controls.pair, pointer: event.pointerId, x: event.clientX, y: event.clientY, source: 'pair' };
    hud.setPointerCapture(event.pointerId);
  });
  hud.querySelector<HTMLButtonElement>('.pair-state')!.onclick = () => {
    if (suppressBaseClick) { suppressBaseClick = false; return; }
    showNotice('Drag the ready pair onto an empty chain, or click a chain to fire.');
  };
});
baseButtons.forEach(button => {
  button.onclick = () => {
    if (suppressBaseClick) { suppressBaseClick = false; return; }
    selectBase(button.dataset.base as Base);
  };
  button.addEventListener('pointerdown', event => {
    suppressBaseClick = false;
    if (drag || event.button !== 0 || button.disabled || field.controls.flight || field.transition) return;
    drag = { base: button.dataset.base as Base, pair: null, pointer: event.pointerId, x: event.clientX, y: event.clientY, source: 'base' };
    button.setPointerCapture(event.pointerId);
  });
});
document.addEventListener('pointermove', event => {
  if (!drag || drag.pointer !== event.pointerId) return;
  if (!drag.ghost && Math.hypot(event.clientX - drag.x, event.clientY - drag.y) < 6) return;
  if (!drag.ghost) {
    const ghost = document.createElement('div'); ghost.className = drag.pair ? 'base-drag pair-drag' : 'base-drag';
    if (drag.pair) {
      for (const base of drag.pair) {
        const letter = document.createElement('span'); letter.textContent = base; letter.style.color = COLORS[base as Base]; ghost.append(letter);
      }
      ghost.style.color = '#b9ef9c';
    } else { ghost.textContent = drag.base; ghost.style.color = COLORS[drag.base!]; }
    document.body.append(ghost); drag.ghost = ghost;
  }
  drag.ghost.style.left = `${event.clientX}px`; drag.ghost.style.top = `${event.clientY}px`;
  document.querySelectorAll('.drop-hover').forEach(el => el.classList.remove('drop-hover'));
  clearReturnHighlights();
  const chain = chainDropTarget(event.clientX, event.clientY);
  field.highlightDrop(chain);
  drag.ghost.dataset.valid = String(chain !== null);
  if (drag.source === 'holder') {
    const tray = returnTray(event.clientX, event.clientY, drag.side!);
    if (tray) tray.dataset.returnHover = 'true';
  } else if (drag.source === 'base') {
    const target = dragTarget(event.clientX, event.clientY);
    if (target && !target.disabled) target.classList.add('drop-hover');
  }
});
document.addEventListener('pointerup', event => {
  if (!drag || drag.pointer !== event.pointerId) return;
  if (drag.ghost) {
    suppressBaseClick = true;
    const chain = chainDropTarget(event.clientX, event.clientY);
    if (chain !== null) {
      clearPreviewFocus(); field.target(chain);
    } else if (drag.source === 'holder') {
      if (returnTray(event.clientX, event.clientY, drag.side!)) {
        if (pendingBase === drag.base) pendingBase = null;
        field.deselect(drag.base!); render();
      }
    } else if (drag.source === 'base') {
      const target = dragTarget(event.clientX, event.clientY);
      if (target && !target.disabled) fillPreview(drag.base!, target.dataset.side as Side, Number(target.dataset.position) as 0 | 1);
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
  else if (key === ' ') { event.preventDefault(); endDrag(); field.setPause(!field.paused); }
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
    showNotice('Creation restored. Resume when ready.');
  } catch { showNotice('Could not load this creation. Choose a valid DNA Shooter export.'); }
  input.value = '';
};

// A hidden tab returns paused; queued shots cannot fire unexpectedly on return.
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { endDrag(); field.setPause(true); }
});
render();
