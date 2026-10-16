import './style.css';
import { BASES, Creation } from './model';
import { startField } from './game';

const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `
  <header><div><span class="eyebrow">THE CREATION EXPERIMENT</span><h1>DNA <span>SHOOTER</span></h1></div><p>Small pairs. Wonderful possibilities.</p><button id="pause">Start creating</button><button id="restart">Restart</button></header>
  <main><div class="field-wrap"><div id="field" tabindex="0" aria-label="DNA creation game"></div><div id="launchers" aria-label="Choose complementary bases">${BASES.map(base => `<button class="base base-${base}" data-base="${base}" aria-label="Select base ${base}" aria-pressed="false">${base}</button>`).join('')}</div></div>
  <section class="dashboard"><div><span class="eyebrow">CREATION SCORE</span><strong id="score">0</strong></div><div><span class="eyebrow">SEGMENT</span><strong id="progress">1 / 20</strong></div><div class="status"><span class="eyebrow">NEXT MOVE</span><p id="notice" role="status">Press Start creating, then choose A + T or C + G.</p></div></section>
  <section class="instructions"><p>Choose two letters → click an empty rung to lock → click again to fire.<br><small>Keyboard: A/T/C/G select · 1–4 lock a rung · Enter fires · Esc cancels · Space pauses</small></p><label><input id="motion" type="checkbox"> Reduced motion</label><button id="save">Export creation</button><label class="import">Load creation<input id="load" type="file" accept="application/json,.json"></label></section>
  <details><summary>Your adaptations <span id="count">0</span></summary><ol id="adaptations"></ol></details>
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
let creation = new Creation();
const field = startField(document.querySelector('#field')!, creation, {
  changed: render,
  notice: message => { notice.textContent = message; },
});
field.setReduced(matchMedia('(prefers-reduced-motion: reduce)').matches);
const motion = document.querySelector<HTMLInputElement>('#motion')!;
motion.checked = field.reduced;
motion.onchange = () => field.setReduced(motion.checked);
function render(): void {
  score.textContent = creation.score.toLocaleString();
  progress.textContent = `${creation.done ? 20 : creation.active + 1} / 20`;
  if (displayedCreation !== creation || displayedAdaptations !== creation.completed) {
    count.textContent = String(creation.completed);
    adaptations.replaceChildren(...creation.adaptations.map(a => {
      const item = document.createElement('li'); item.textContent = `${a.name} — ${a.pattern.join(' · ')}`; return item;
    }));
    displayedCreation = creation; displayedAdaptations = creation.completed;
  }
  pause.textContent = field.paused ? (field.elapsed || creation.placements.length ? 'Resume creating' : 'Start creating') : 'Pause';
  baseButtons.forEach(button => {
    button.setAttribute('aria-pressed', String(field.controls.selected.includes(button.dataset.base as typeof BASES[number])));
    button.disabled = field.paused || creation.done;
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
  if (event.target instanceof HTMLInputElement || event.repeat || event.ctrlKey || event.altKey || event.metaKey) return;
  if (event.target instanceof HTMLButtonElement && ['Enter', ' '].includes(event.key)) return;
  const key = event.key.toUpperCase();
  if (BASES.includes(key as typeof BASES[number])) field.choose(key as typeof BASES[number]);
  else if (/^[1-4]$/.test(key)) {
    gameElement.focus({ preventScroll: true }); field.target(Number(key) - 1);
  }
  else if (key === 'ENTER') { event.preventDefault(); field.target(null); }
  else if (key === 'ESCAPE') { field.cancelLock(); }
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
