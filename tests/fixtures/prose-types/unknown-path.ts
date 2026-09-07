// Negative type fixture (S1-05, §4.2): a path that does not end at a prose field is a
// compile error, not a runtime gap. Every line below is a deliberate error and carries no
// `@ts-expect-error`.
import { createProseAccess } from '../../../src/prose/index.ts';

const p = createProseAccess(
  {
    title: { xs: 'Dawson', s: 'Dawson Metzger-Fleetwood' },
    jobs: [{ company: { xs: 'About Objects' }, bullets: { l: ['one', 'two'] } }],
  },
  'fixture',
);

export const a = p.text('titel', 's');
export const b = p.has('jobs.0.bullet', 'l');
export const c = p.list('jobs.x.bullets', 'l');
export const d = p.get('jobs.0', 'xs');
