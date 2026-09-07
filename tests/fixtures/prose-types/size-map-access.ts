// Negative type fixture (S1-05, D37): size maps and label lists are `never` on `data`, so
// reading them directly must not compile. Every line below is a deliberate error and
// carries no `@ts-expect-error`; the fixture tsconfig checks this directory alone and the
// root tsconfig excludes it. S1-08 runs the same fixture through `astro check`.
import { createProseAccess } from '../../../src/prose/index.ts';

const p = createProseAccess(
  {
    title: { xs: 'Dawson', s: 'Dawson Metzger-Fleetwood' },
    jobs: [{ company: { xs: 'About Objects' }, bullets: { l: ['one', 'two'] } }],
    projects: [{ image: '/resources/Fly_Media.jpg', tech: ['Metal', { draft: 'Swift' }] }],
    ticker: { xs: 'Now playing' } as { xs?: string } | undefined,
  },
  'fixture',
);

export const a = p.data.title.xs;
export const b = p.data.jobs[0].bullets.l;
// `tech[0]` alone is not an error (indexing `never` yields `never`); reading the list is.
export const c = p.data.projects[0].tech.join(', ');
// An optional size map is hidden too: IsSizeMap must not distribute over the union.
export const d = p.data.ticker?.xs;
