import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
// S1-08 adds: import prose from './src/prose/integration.ts';
// S1-08 adds: import checks from './src/build/checks.ts';
// S1-20 adds: import { THEME_IDS } from './src/themes/registry.ts';
// S1-20 adds: import { postDates, publishedPostIds } from './src/build/posts.ts';

export default defineConfig({
  site: 'https://www.dawsonamf.com',
  output: 'static',
  trailingSlash: 'always',
  compressHTML: false,                 // D2: parity
  prerenderConflictBehavior: 'error',  // D2: duplicate prerendered URLs and duplicate entry ids (default is 'warn')
  build: { format: 'directory', inlineStylesheets: 'never' },
  markdown: { syntaxHighlight: false },// posts do not go through Astro's pipeline (D6)
  redirects: {                         // S1-22 owns this block; static output: <meta http-equiv="refresh"> stubs, no status code
    '/12years/': '/subsites/elise/12years/',
    '/embedded-swift-agent/': '/subsites/dawson/embedded-swift-agent/',   // settled Q3
  },
  // S1-08 adds: vite: { plugins: [<resolveId externalization of src/prose/index.ts>] } (T0 item k; amends §3.2, see research/spike-findings.md)
  // S1-08 adds prose()/checks() to integrations; S1-20 adds the sitemap filter/serialize options.
  integrations: [sitemap()],
});
