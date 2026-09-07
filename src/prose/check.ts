// `npm run prose:check` (§4.3): the same walker the prose integration runs, before Astro
// starts. Run as `node src/prose/check.ts`; Node type-strips it. YAML, frontmatter and
// schema errors propagate as thrown errors, which exit nonzero too.
import { contentDraftIssues } from './integration.ts';

// Fail closed: an exported PROSE_DRAFTS would otherwise turn `npm run build` into a preview
// build, because the integration honours the variable whatever the script string says.
if (process.env.PROSE_DRAFTS === 'allow') {
  console.error(
    'prose:check: PROSE_DRAFTS=allow is set; unset it, npm run build is the production build '
      + '(use npm run build:preview for drafts)',
  );
  process.exit(1);
}

const issues = contentDraftIssues();
for (const issue of issues) console.error(`  ${issue.source}:${issue.path}`);
console.log(`prose:check: ${issues.length} unapproved draft field(s)`);
process.exitCode = issues.length ? 1 : 0;
