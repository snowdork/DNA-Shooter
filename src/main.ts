import './style.css';
import { BASES, Creation, TOTAL_SEGMENTS } from './model';
import { startField, SHOOTER_RADIUS, W, H } from './game';

const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `
  <header><div class="brand"><span class="eyebrow">THE MUTATION LAB</span><h1>MUTA<span>GON</span></h1></div><div class="scoreboard" aria-label="Game score"><div><span class="eyebrow">SCORE</span><strong id="score">0</strong></div><div><span class="eyebrow">CHROMOSOME</span><strong id="progress">1 / 30</strong></div></div><div class="header-actions"><button id="directions">Directions</button><button id="pause">Start experiment</button><button id="restart">Restart</button></div><p id="notice" role="status">Press Start experiment, then choose A + T or C + G.</p></header>
  <dialog id="directions-dialog" aria-labelledby="directions-title"><h2 id="directions-title">How to play Mutagon</h2><ol><li>Choose a matching pair: <strong>A then T, T then A, C then G, or G then C.</strong> Shooters stay fixed. The first letter gets ↑ UP (green) and the second gets ↓ DOWN (red), showing their positions in the DNA pair. Click your first letter again to clear your choice.</li><li>When the pair is <strong>READY</strong>, click an empty chromosome rung to fire. Selected shooters glow while in play.</li><li>Link at least one pair before the chromosome exits the bottom. A completely empty chromosome ends the run. Linked chromosomes return to the top with their pairs preserved; fill all four rungs to advance. Complete <strong>30 chromosomes</strong> to win and watch Mutagon transform.</li></ol><p>Order changes the mutation. Each pair earns 100 points; a completed chromosome adds 400.</p><p><strong>Keyboard</strong><br>A / T / C / G select · 1–4 fire at a rung · Esc clears selection · Space pauses</p><p class="dialog-note">Opening directions pauses the game.</p><form method="dialog"><button autofocus>Back to game</button></form></dialog>
  <main><div class="field-wrap"><div class="game-stage"><div id="field" tabindex="0" aria-label="DNA creation game"></div><div id="launchers" aria-label="Choose complementary bases">${BASES.map(base => `<button class="base base-${base}" data-base="${base}" aria-label="Select base ${base}" aria-pressed="false">${base}<span class="position-label" aria-hidden="true" hidden></span></button>`).join('')}</div><div id="pair-huds" aria-label="Base order"><div class="pair-hud" id="order-at" role="status"></div><div class="pair-hud" id="order-cg" role="status"></div></div></div></div>
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
  const ordered = field.controls.flight?.pair.split('') ?? field.controls.selected;
  for (const [id, bases] of [['order-at', ['A', 'T']], ['order-cg', ['C', 'G']]] as const) {
    const first = ordered[0];
    const matching = first && (bases as readonly string[]).includes(first);
    const hud = document.getElementById(id)!;
    const up = matching ? first : '—', down = matching ? ordered[1] ?? '—' : '—';
    const state = matching ? field.controls.flight ? 'FIRING' : ordered.length === 2 ? 'READY' : 'PICK DOWN' : 'PICK UP';
    hud.innerHTML = `<span class="pair-up" data-filled="${up !== '—'}">↑ UP ${up}</span><span class="pair-down" data-filled="${down !== '—'}">↓ DOWN ${down}</span><span class="pair-state">${state}</span>`;
    hud.setAttribute('aria-label', matching ? `Up ${up}, down ${down === '—' ? 'awaiting selection' : down}. ${state}` : 'Pick the up base first, then the down base');
  }
  baseButtons.forEach(button => {
    const base = button.dataset.base as typeof BASES[number];
    button.style.left = `${(field.launcherX(base) - SHOOTER_RADIUS) / W * 100}%`;
    button.style.top = `${(field.launcherY(base) - SHOOTER_RADIUS) / H * 100}%`;
    button.style.width = `${SHOOTER_RADIUS * 2 / W * 100}%`;
    button.style.height = `${SHOOTER_RADIUS * 2 / H * 100}%`;
    const index = ordered.indexOf(base);
    button.setAttribute('aria-pressed', String(index >= 0));
    button.dataset.position = index === 0 ? 'top' : index === 1 ? 'bottom' : 'none';
    button.setAttribute('aria-label', index >= 0 ? `Select base ${base}, ${index === 0 ? 'top' : 'bottom'} of pair` : `Select base ${base}`);
    const label = button.querySelector<HTMLSpanElement>('.position-label')!;
    label.hidden = index < 0;
    label.textContent = index === 0 ? '↑ UP' : '↓ DOWN';
    button.disabled = field.paused || field.failed || creation.done;
  });
  if (creation.done) notice.textContent = 'Your life form is complete! Export your creation or restart to discover another.';
}
pause.onclick = () => {
  field.setPause(!field.paused);
  if (!field.paused) gameElement.focus({ preventScroll: true });
};
gameElement.addEventListener('pointerdown', () => gameElement.focus({ preventScroll: true }));
document.querySelector('#restart')!.addEventListener('click', () => {
  creation = new Creation(); field.reset(creation); field.setPause(false);
  notice.textContent = 'A fresh beginning. Choose A + T or C + G.';
});
baseButtons.forEach(button => {
  button.onclick = () => field.choose(button.dataset.base as typeof BASES[number]);
});
document.addEventListener('keydown', event => {
  if (directions.open || event.target instanceof HTMLInputElement || event.repeat || event.ctrlKey || event.altKey || event.metaKey) return;
  if (event.target instanceof HTMLButtonElement && ['Enter', ' '].includes(event.key)) return;
  const key = event.key.toUpperCase();
  if (BASES.includes(key as typeof BASES[number])) field.choose(key as typeof BASES[number]);
  else if (/^[1-4]$/.test(key)) {
    gameElement.focus({ preventScroll: true }); field.target(Number(key) - 1);
  }
  else if (key === 'ENTER') { event.preventDefault(); field.target(null); }
  else if (key === 'ESCAPE') { field.controls.cancel(); field.cancelLock(); }
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
    creation = restored; field.reset(creation); field.setPause(true);
    notice.textContent = 'Creation restored. Resume when ready.';
  } catch { notice.textContent = 'Could not load this creation. Choose a valid DNA Shooter export.'; }
  input.value = '';
};

// A hidden tab returns paused; queued shots cannot fire unexpectedly on return.
document.addEventListener('visibilitychange', () => {
  if (document.hidden) field.setPause(true);
});
render();
