import './style.css';
import { BASES, Creation, SLOTS, TOTAL_SEGMENTS, type Base, type Pair } from './model';
import { startField, W, H } from './game';
import { COLORS, type Side } from './bases';
import { mountScienceReel, scienceReelMarkup } from './science-reel';
import { dnaTrackerMarkup, mountDnaTracker } from './dna-tracker';

const app = document.querySelector<HTMLDivElement>('#app')!;
function station(side: Side): string {
  return `<section class="pairing-station station-${side}" data-station="${side}" aria-label="${side.toUpperCase()} pairs"><div class="pair-choices">${(side === 'at' ? ['TA', 'AT'] : ['CG', 'GC']).map((pair, i) => `<button type="button" class="quick-pair pair-critter critter-${i}" data-pair="${pair}" aria-label="Select or drag ${pair} pair" aria-pressed="false" style="--pair-color:${COLORS[pair[0] as Base]};--mate-color:${COLORS[pair[1] as Base]}"><span class="critter-body" aria-hidden="true"><span class="critter-eyes">••</span><span class="pair-letters"><span>${pair[0]}</span><span>${pair[1]}</span></span><span class="critter-smile"></span></span><span class="pair-name">${pair}</span></button>`).join('')}</div><span class="station-hint">PICK A PAIR<br>THEN A CHAIN</span></section>`;
}
app.innerHTML = `
  <header><div class="brand"><span class="eyebrow">THE MUTATION LAB</span><h1>MUTA<span>GON</span></h1></div><div class="scoreboard" aria-label="Game score"><div><span class="eyebrow">SCORE</span><strong id="score">0</strong></div><div><span class="eyebrow">QUADRA-CHROME</span><strong id="progress">1 / ${TOTAL_SEGMENTS}</strong></div></div><div class="header-actions"><button id="directions">Directions</button><button id="pause">Start experiment</button><button id="restart">Restart</button></div></header>
  <dialog id="directions-dialog" aria-labelledby="directions-title">
    <button type="button" class="dialog-close" aria-label="Close directions">×</button>
    <h2 id="directions-title" tabindex="-1" autofocus>How to play Mutagon</h2>
    <p>Each <strong>quadra-chrome</strong> is one set of <strong>four DNA pairs</strong>. Complete <strong>${TOTAL_SEGMENTS} quadra-chromes</strong> and watch a small, jiggly green glob become your own imaginary organism.</p>
    <ol>
      <li><strong>Start experiment.</strong> Choose the A/T station on the left or the C/G station on the right.</li>
      <li><strong>Pick a pair.</strong> Choose TA or AT on the left, or CG or GC on the right. Click a character, then click an empty chain, or drag the character straight onto a chain. The first letter goes UP and the second goes DOWN. A glowing target shows where your pair will land.</li>
      <li><strong>Change your pick.</strong> Click another pair to select it, or press Esc to clear your selection. Dropping outside a chain keeps your pair selected. Wait for a shot to land before choosing the next pair.</li>
      <li><strong>Complete the quadra-chrome.</strong> Its four chains stream from the top toward the bottom without looping back or resetting. Fill each chain before it reaches the exit. <strong>Any empty chain touching the bottom ends the game</strong>, even if the other chains have pairs. Filled chains can leave safely. Complete all four pairs to advance; the completed set shakes, glimmers, and sparks before drifting down to the master chain. Its matching DNA Patterns row glows as it arrives, then the next quadra-chrome enters. A shot must land before its empty chain reaches the exit. Use <strong>Restart</strong> after game over.</li>
      <li><strong>Watch your organism grow.</strong> Every landed pair adds a random colored mutation and changes its movement. New games start with a small green glob and grow a different mix of traits. Pair order influences the result in this game. Earn <strong>100 points per pair</strong> and <strong>400 extra</strong> for completing a quadra-chrome. The <strong>DNA Patterns</strong> ticker to Mutagon’s right records each quadra-chrome’s four pairs in chain order as you land them. Completed rows turn green; the outlined row is your current quadra-chrome. Open <strong>Your mutations</strong> below the controls to review your discoveries.</li>
    </ol>
    <p><strong>Learn as you play.</strong> The <strong>DNA Dispatch</strong> reel beneath the playfield shares colorful genetics facts. Hover over it, focus it, or press <strong>Pause reel</strong> to read. Click a fact to open its science source. Real DNA uses complementary base pairing; Mutagon’s instant tusks, tentacles, and other creature transformations are imaginary.</p>
    <p><strong>Make it comfortable.</strong> Toggle <strong>Sound</strong> for slime, bubbling gases, and primordial rumble. Each complementary pair has its own tone; completing a quadra-chrome plays its ordered four-note pattern and a unique signature chime. <strong>Reduced motion</strong> steadies decorative movement and the pair characters; scroll the science reel sideways to read. The quadra-chrome stream keeps moving. <strong>Export creation</strong> saves your progress; <strong>Load creation</strong> restores the same mutations paused. <strong>Restart</strong> begins again with a fresh blob.</p>
    <p><strong>Keyboard</strong><br>A / T / C / G select AT / TA / CG / GC respectively · 1–4 fire at a chain from top to bottom · Esc clears selection · Space pauses or resumes.</p>
    <p><strong>From blob to creature.</strong> New specimens grow through tissue, sensing, body-plan, and specialization stages. New specimens randomly mix animal anatomy, human hands and facial features, and imaginary alien organs. Repeated traits refine existing structures. Real development involves regulated gene activity and cell interactions. Our pair-to-trait choices are fictional, and a four-pair quadra-chrome is a game unit, not a real chromosome. A–T has two hydrogen bonds and C–G has three; neither pair earns extra points.</p>
    <p class="dialog-note">Opening Directions pauses the experiment. Closing it resumes a run that was already playing.</p>
    <form method="dialog"><button>Back to game</button></form>
  </dialog>
  <main><div class="field-wrap"><div class="game-stage"><div class="game-area"><div id="field" tabindex="0" aria-label="DNA creation game"></div><div id="pair-huds" aria-label="Choose a DNA pair">${station('at')}${station('cg')}</div><div class="field-labels"><section class="field-label canal-label" aria-label="Chromogon status"><h2>CHROMOGON <span id="canal-link">EMPTY</span></h2></section><section class="field-label organism-label" aria-label="Mutagon status"><h2>MUTAGON <span id="organism-count">0 MUTATIONS</span></h2></section></div></div>${dnaTrackerMarkup()}</div></div>
  <p id="notice" class="status-announcement" role="status"></p>
  ${scienceReelMarkup()}
  <section class="game-tools" aria-label="Game settings"><label><input id="motion" type="checkbox"> Reduced motion</label><button id="sound" aria-pressed="true">Sound on</button><button id="save">Export creation</button><label class="import">Load creation<input id="load" type="file" accept="application/json,.json"></label></section>
  <details><summary>Your mutations <span id="mutation-count">0</span></summary><ol id="mutations"></ol><p>Chromosome patterns <span id="count">0</span></p><ol id="adaptations"></ol></details>
  <footer>IMAGINATIVE BIOLOGY · Base pairing is real. Creature adaptations are fictional.</footer></main>`;
const gameElement = document.querySelector<HTMLDivElement>('#field')!;
const notice = document.querySelector<HTMLParagraphElement>('#notice')!;
function showNotice(message: string): void { if (notice.textContent !== message) notice.textContent = message; }
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
const pairButtons = [...document.querySelectorAll<HTMLButtonElement>('.quick-pair')];
const reelElement = document.querySelector<HTMLElement>('.science-reel')!;
const scienceReel = mountScienceReel(reelElement);
const updateDnaTracker = mountDnaTracker(document.querySelector<HTMLElement>('.dna-tracker')!);
let displayedCreation: Creation | undefined;
let displayedAdaptations = -1;
let displayedMutations = -1;
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
directions.querySelector<HTMLButtonElement>('.dialog-close')!.onclick = () => directions.close();
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
  gameArea.dataset.reduced = String(field.reduced);
  gameArea.dataset.paused = String(field.paused);
  pairButtons.forEach(button => {
    button.disabled = field.paused || creation.done || field.failed || !!field.controls.flight || !!field.transition;
    button.setAttribute('aria-pressed', String(field.controls.pair === button.dataset.pair));
  });
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
  endDrag();
  creation = new Creation(); field.reset(creation); field.setPause(false);
  showNotice('A fresh beginning. Choose TA, AT, CG, or GC.');
});
let suppressPairClick = false;
let drag: { pair: Pair | null; pointer: number; x: number; y: number; ghost?: HTMLDivElement } | null = null;
pairButtons.forEach(button => {
  const prepare = () => field.preparePair(button.dataset.pair as Pair);
  button.onclick = () => {
    if (suppressPairClick) { suppressPairClick = false; return; }
    // Pointer input already prepares on pointerdown; keyboard activation has no pointerdown.
    if (field.controls.pair !== button.dataset.pair) prepare();
  };
  button.addEventListener('pointerdown', event => {
    suppressPairClick = false;
    if (drag || event.button !== 0 || button.disabled || !prepare()) return;
    drag = { pair: field.controls.pair, pointer: event.pointerId, x: event.clientX, y: event.clientY };
    button.setPointerCapture(event.pointerId);
  });
});
function chainDropTarget(x: number, y: number): number | null {
  if (!drag?.pair || drag.pair !== field.controls.pair || field.paused || field.failed || creation.done || field.transition || field.controls.flight) return null;
  const bounds = gameElement.querySelector('canvas')!.getBoundingClientRect();
  return field.chainAt((x - bounds.left) / bounds.width * W, (y - bounds.top) / bounds.height * H, true);
}
function endDrag(): void {
  if (drag?.ghost) suppressPairClick = true;
  drag?.ghost?.remove(); drag = null;
  field.highlightDrop(null);
}
document.addEventListener('pointermove', event => {
  if (!drag || drag.pointer !== event.pointerId) return;
  if (!drag.ghost && Math.hypot(event.clientX - drag.x, event.clientY - drag.y) < 6) return;
  if (!drag.ghost) {
    const ghost = document.createElement('div'); ghost.className = 'base-drag pair-drag';
    if (drag.pair) {
      for (const base of drag.pair) {
        const letter = document.createElement('span'); letter.textContent = base; letter.style.color = COLORS[base as Base]; ghost.append(letter);
      }
      ghost.style.color = '#b9ef9c';
    }
    document.body.append(ghost); drag.ghost = ghost;
  }
  drag.ghost.style.left = `${event.clientX}px`; drag.ghost.style.top = `${event.clientY}px`;
  const chain = chainDropTarget(event.clientX, event.clientY);
  field.highlightDrop(chain);
  drag.ghost.dataset.valid = String(chain !== null);
});
document.addEventListener('pointerup', event => {
  if (!drag || drag.pointer !== event.pointerId) return;
  if (drag.ghost) {
    suppressPairClick = true;
    const chain = chainDropTarget(event.clientX, event.clientY);
    if (chain !== null) field.target(chain);
  }
  endDrag();
});
document.addEventListener('pointercancel', endDrag);
document.addEventListener('keydown', event => {
  if (directions.open || event.target instanceof HTMLInputElement || event.repeat || event.ctrlKey || event.altKey || event.metaKey) return;
  if (event.target instanceof HTMLButtonElement && ['Enter', ' '].includes(event.key)) return;
  const key = event.key.toUpperCase();
  if (BASES.includes(key as typeof BASES[number])) { field.preparePair(({ A: 'AT', T: 'TA', C: 'CG', G: 'GC' } as const)[key as Base]); }
  else if (/^[1-4]$/.test(key)) {
    gameElement.focus({ preventScroll: true }); field.target(Number(key) - 1);
  }
  else if (key === 'ENTER') { event.preventDefault(); field.target(null); }
  else if (key === 'ESCAPE') { endDrag(); field.controls.cancel(); field.cancelLock(); }
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
    endDrag();
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
