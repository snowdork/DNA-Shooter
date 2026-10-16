import { Creation, SLOTS, TOTAL_SEGMENTS, type Base } from './model';
import { COLORS } from './bases';
import type { CompletionPhase } from './game';

interface CompletionDisplay {
  phase: CompletionPhase;
  segment: number;
  linkedSegment: number | null;
  paused: boolean;
  reduced: boolean;
}

export function dnaTrackerMarkup(): string {
  return `<aside class="dna-tracker" aria-label="Attained DNA patterns"><ol class="dna-log" style="--dna-count:${TOTAL_SEGMENTS}">${Array.from({ length: TOTAL_SEGMENTS }, (_, index) => `<li class="dna-row" data-chromosome="${index + 1}" data-state="pending">${Array.from({ length: SLOTS }, () => '<span class="dna-pair"><span>-</span><span>-</span></span>').join('')}</li>`).join('')}</ol><div class="field-label tracker-label"><h2>DNA PATTERNS</h2><p id="dna-completed" role="status">COLLECTING</p></div></aside>`;
}

export function mountDnaTracker(element: HTMLElement): (creation: Creation, completion: CompletionDisplay) => void {
  const rows = [...element.querySelectorAll<HTMLElement>('.dna-row')].map(row => ({
    element: row,
    cells: [...row.querySelectorAll<HTMLElement>('.dna-pair')].map(cell => ({ element: cell, letters: [...cell.children] as HTMLElement[], pair: undefined as string | null | undefined })),
    key: '',
  }));
  const progress = element.querySelector<HTMLElement>('#dna-completed')!;
  return (creation, completion) => {
    if (element.dataset.paused !== String(completion.paused)) element.dataset.paused = String(completion.paused);
    if (element.dataset.reduced !== String(completion.reduced)) element.dataset.reduced = String(completion.reduced);
    rows.forEach((view, index) => {
      const row = view.element;
      const pattern = creation.segments[index];
      const state = index < creation.completed ? 'complete' : !creation.done && index === creation.active ? 'current' : 'pending';
      const phase = completion.segment === index && completion.phase !== 'idle'
        ? completion.phase : completion.linkedSegment === index ? 'linked' : 'none';
      const key = `${state}:${phase}:${pattern.join(',')}`;
      if (view.key === key) return;
      view.key = key;
      row.dataset.state = state;
      row.dataset.completion = phase;
      if (state === 'current') row.setAttribute('aria-current', 'step');
      else row.removeAttribute('aria-current');
      const description = `Quadra-chrome ${index + 1}, ${state}${row.dataset.completion === 'celebrating' || row.dataset.completion === 'drifting' ? ', joining the master chain' : ''}: ${pattern.map(pair => pair ?? 'empty').join(' / ')}`;
      row.setAttribute('aria-label', description);
      row.title = pattern.map(pair => pair ?? '--').join(' · ');
      view.cells.forEach((cell, slot) => {
        const pair = pattern[slot];
        if (cell.pair === pair) return;
        cell.pair = pair;
        cell.element.dataset.filled = String(!!pair);
        cell.letters.forEach((letter, position) => {
          letter.textContent = pair?.[position] ?? '-';
          letter.style.color = pair ? COLORS[pair[position] as Base] : '';
        });
      });
    });
    const label = creation.done ? 'COMPLETE' : 'COLLECTING';
    if (progress.textContent !== label) progress.textContent = label;
  };
}
