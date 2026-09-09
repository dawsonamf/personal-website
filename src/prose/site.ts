// The one bound shared-prose instance (plan contract #3). src/prose/index.ts owns the
// accessor factory and the two build accumulators; this file binds the validated site tree
// to them, so components and the checks integration share one instance.
//
// astro.config.mjs externalizes this file, so plain Node loads it: erasable TypeScript,
// explicit .ts extensions, no astro:* import, and prose.yaml is located from
// import.meta.url rather than cwd (a bundled copy would look under dist/).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { load } from 'js-yaml';

import { findDrafts } from './drafts.ts';
import type { DraftIssue } from './drafts.ts';
import { createProseAccess } from './index.ts';
import { siteProseSchema } from './schema.ts';

// The collection schema owns the file() loader's `id` key; this side parses the YAML itself
// and so never sees one (src/content.config.ts).
const filename = fileURLToPath(new URL('../content/prose.yaml', import.meta.url));
const parsed = siteProseSchema.safeParse(load(readFileSync(filename, 'utf8'), { filename }));
if (!parsed.success) {
  throw new Error(`prose: ${filename}: ${parsed.error.message}`, { cause: parsed.error });
}
const tree = parsed.data;

export const prose = createProseAccess(tree, 'prose');

/** Source-qualified draft issues for DraftPill; the Shell concatenates postDraftIssues(). */
export const proseDrafts: DraftIssue[] = findDrafts(tree, 'prose');
