// The prose integration (D10, §4.3): the production draft gate. It runs in
// astro:config:setup, before anything renders, and reports EVERY unapproved field in one
// run: the shared YAML plus the metadata of every published/external post. A whole
// `publication: draft` post is excluded from production, not reported, so it never blocks.
import type { AstroIntegration, HookParameters } from 'astro';

// §3.3 draws prose/* as a leaf, but this module is config-side glue that §3.2/§4.3 place
// under src/prose/: it needs build/checks (the YAML parse) and build/posts (the mandated
// published/external walk). Neither imports back into prose/integration, so no cycle exists.
import { assertNoYamlSyntaxError, PROSE_YAML } from '../build/checks.ts';
import { postDraftIssues } from '../build/posts.ts';
import { findDrafts } from './drafts.ts';
import type { DraftIssue } from './drafts.ts';

/** Every unapproved field in the shared YAML and in publishable post metadata. */
export function contentDraftIssues(): DraftIssue[] {
  const tree = assertNoYamlSyntaxError();
  // postDraftIssues() throws on malformed or invalid post frontmatter. That is the desired
  // production failure: a broken source must not build.
  return [...findDrafts(tree, 'prose'), ...postDraftIssues()];
}

export default function prose(): AstroIntegration {
  return {
    name: 'prose',
    hooks: {
      'astro:config:setup': ({ addWatchFile }: HookParameters<'astro:config:setup'>) => {
        // src/prose/site.ts is externalized, so Vite never watches the YAML it reads.
        addWatchFile(PROSE_YAML);

        const issues = contentDraftIssues();
        if (issues.length === 0 || process.env.PROSE_DRAFTS === 'allow') return;
        const lines = issues.map((issue) => `  ${issue.source}:${issue.path}`).join('\n');
        throw new Error(
          `prose: ${issues.length} unapproved draft field(s) block a production build:\n${lines}\n`
            + 'Approve them, or preview them with PROSE_DRAFTS=allow.',
        );
      },
    },
  };
}
