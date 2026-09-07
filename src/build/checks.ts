// Engine invariants (D39): ONE integration whose hooks call named pure functions.
// S1-08 owns the content assertions; S1-13 adds the emitted-page ones to this same file.
//
// Imported from astro.config.mjs, so plain Node loads it (research/spike-findings.md §k):
// erasable TypeScript only, explicit .ts extensions, no astro:* or Vite-only import.
// Per §3.3 the only src/ import here is ../prose/index.ts, the shared accumulators.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { load } from 'js-yaml';

import type { AstroIntegration } from 'astro';

import { touches, unwrittenSizes } from '../prose/index.ts';

export const PROSE_YAML = fileURLToPath(new URL('../content/prose.yaml', import.meta.url));

/**
 * §4.1 rule 6: the file() loader swallows a YAML syntax error into an empty collection, so the
 * build must parse the file itself. Returns the parsed tree for callers that want it. This
 * hook re-parses independently of the prose integration's walk, so the check does not depend
 * on integration order (D39).
 */
export function assertNoYamlSyntaxError(): unknown {
  const text = readFileSync(PROSE_YAML, 'utf8');
  try {
    return load(text, { filename: PROSE_YAML });
  } catch (error) {
    throw new Error(
      `checks: ${PROSE_YAML} is not valid YAML (the file() loader would swallow this): `
        + (error instanceof Error ? error.message : String(error)),
    );
  }
}

/**
 * The positive sentinel required by spike §k. An empty unwritten set is only meaningful if
 * prose was actually read through THIS module instance; otherwise the gate passes vacuously.
 */
function assertProseTouched(count: number): void {
  if (count !== 0) return;
  throw new Error(
    'checks: no prose request reached the checks integration (touches === 0), so the '
      + 'unwritten-size gate below would pass vacuously. Causes: no page rendered prose; '
      + 'src/prose/index.ts was bundled a second time because the vite resolveId '
      + 'externalization in astro.config.mjs no longer matches it; or the config chain failed '
      + "to import under Node and astro's vite-load.js silently fell back to Vite's loader "
      + '(run `node -e "import(\'./astro.config.mjs\')"` to surface that error). '
      + 'See research/spike-findings.md §k.',
  );
}

/** D10: a requested size nobody wrote is fatal. */
export function assertNoUnwrittenSizes(unwritten: ReadonlySet<string>): void {
  if (unwritten.size === 0) return;
  const entries = [...unwritten].sort().map((entry) => `  ${entry}`).join('\n');
  throw new Error(
    `checks: ${unwritten.size} requested prose size(s) are unwritten:\n${entries}\n`
      + 'Write the size, or set it to null to omit the slot.',
  );
}

export default function checks(): AstroIntegration {
  return {
    name: 'checks',
    hooks: {
      'astro:config:setup': () => {
        assertNoYamlSyntaxError();
      },
      'astro:build:done': () => {
        // The sentinel first: without it an empty set proves nothing.
        assertProseTouched(touches);
        assertNoUnwrittenSizes(unwrittenSizes);
        // S1-13 adds assertShellInvariants(pages) / assertNoRelativeHrefs(pages) here.
      },
    },
  };
}
