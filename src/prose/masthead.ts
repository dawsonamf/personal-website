// Masthead choreography (D36): prose stores each sequence as its terminal lines (the
// full text on screen at every rest point); the type/delete/pause steps are derived here
// by longest common prefix. Verified to reproduce all 16 legacy hand-counted sequences.
//
// The legacy `callback` step is not derived: it is function-valued and stays client-side,
// spliced in after the first `type` step by the page script, as today.
//
// Pure and erasable, with no imports.

export type MastheadStep =
  | { action: 'type'; text: string }
  | { action: 'pause'; duration: number }
  | { action: 'delete'; count: number };

export function deriveMastheadSteps(lines: string[], pauseMs: number): MastheadStep[] {
  const first = lines[0];
  if (first === undefined) throw new Error('prose: a masthead sequence needs at least one line');

  const steps: MastheadStep[] = [{ action: 'type', text: first }];
  let prev = first;
  for (const next of lines.slice(1)) {
    let shared = 0;
    while (shared < prev.length && shared < next.length && prev[shared] === next[shared]) shared++;
    steps.push(
      { action: 'pause', duration: pauseMs },
      { action: 'delete', count: prev.length - shared },
      { action: 'type', text: next.slice(shared) },
    );
    prev = next;
  }
  return steps;
}
