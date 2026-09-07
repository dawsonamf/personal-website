// Negative type fixture (S1-08, D37): the REAL bound shared instance, not a hand-built tree.
// Size maps stay unreachable through `data` and an invalid path does not compile. Every line
// below is a deliberate error and carries no `@ts-expect-error`. A wrong-method shape
// (`list` on text) is a runtime error by design, so it is not asserted here.
import { prose } from '../../../src/prose/site.ts';

export const a = prose.data.home.about.body.l;
export const b = prose.get('home.abuot.body', 'l');
// A path that stops short of a prose field is not in the ProsePath union either.
export const c = prose.text('home.about', 'xs');
