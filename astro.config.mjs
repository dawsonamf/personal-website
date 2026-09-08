import { fileURLToPath, pathToFileURL } from 'node:url';
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import prose from './src/prose/integration.ts';
import checks from './src/build/checks.ts';
import postOutput, { externalPostRedirects } from './src/build/post-output.ts';
import { postDates, publishedPostIds } from './src/build/posts.ts';
import { THEME_IDS } from './src/themes/registry.ts';

const publicPostIds = new Set(publishedPostIds());
const publicPostDates = postDates();
const embeddedAgentSubsite = 'https://www.dawsonamf.com/subsites/dawson/embedded-swift-agent/';

function sitemapPath(page) {
  return new URL(page).pathname;
}

function includeInSitemap(page) {
  const pathname = sitemapPath(page);
  if (THEME_IDS.some((id) => id !== 'default' && pathname.startsWith(`/${id}/`))) return false;
  if (/^\/404(?:\.html|\/)$/.test(pathname) || pathname === '/blog/post.html') return false;
  const post = /^\/blog\/([^/]+)\/$/.exec(pathname);
  return !post || publicPostIds.has(post[1]);
}

function serializeSitemapItem(item) {
  const post = /^\/blog\/([^/]+)\/$/.exec(sitemapPath(item.url));
  const date = post && publicPostDates[post[1]];
  return date ? { ...item, lastmod: date } : item;
}

// T0 item k (research/spike-findings.md §k; amends §3.2, which has no vite block).
//
// This config is loaded by plain Node import(), so every module it reaches lands in Node's
// own module cache. Pages are bundled into SSR chunks that prerender in this same process.
// Without externalization each listed module exists twice: the config side then reads an
// empty unwrittenSizes set and touches === 0, which assertProseTouched turns into a loud
// failure instead of a vacuous pass.
//
// Marking a module external is necessary but not sufficient: an external keeps the AUTHORED
// specifier, and a relative one cannot resolve from the temporary server-chunk directory. So
// resolveId rewrites the id to the absolute file:// URL, which is the key Node already holds.
// Matching is on the RESOLVED id because extensionless, root-absolute and aliased specifiers
// all bypass a string compare (Vite runs `alias` before `pre` plugins).
const root = fileURLToPath(new URL('./', import.meta.url));
const externalized = [
  // Owns the shared unwritten set and the touch counter (plan contract #3).
  './src/prose/index.ts',
  // Locates src/content/prose.yaml from import.meta.url; a bundled copy looks under dist/.
  './src/prose/site.ts',
  // Locates src/content/posts from import.meta.url; same reason.
  './src/build/posts.ts',
].map((path) => fileURLToPath(new URL(path, import.meta.url)));

const externalizeSharedInstances = {
  name: 'externalize-shared-instances',
  enforce: 'pre',
  // Build only: the shared-instance requirement exists for astro:build:done. In astro dev
  // nothing is externalized, so Vite evaluates site.ts/posts.ts itself (its module runner
  // gives them a real file:// import.meta.url) and an in-process restart re-evaluates
  // site.ts, so edited prose.yaml is fresh; Node's ESM cache would pin the old tree.
  apply: 'build',
  async resolveId(source, importer, options) {
    if (!importer) return null;
    const resolved = await this.resolve(source, importer, { skipSelf: true });
    const id = resolved?.id.split('?')[0];
    if (!id || !externalized.includes(id)) return null;
    // These modules read the filesystem at build time; a client bundle must never reach them.
    // Verified during a fixture build: this.environment is populated on Vite 8.2.2 (consumer
    // 'server'); options.ssr is the fallback for a Vite without environments.
    const server = this.environment ? this.environment.config.consumer === 'server' : options?.ssr;
    if (!server) {
      throw new Error(
        `${id.slice(root.length)} is build-time only and must not be imported by client code (spec §4.2)`,
      );
    }
    return { id: pathToFileURL(id).href, external: true };
  },
};

export default defineConfig({
  site: 'https://www.dawsonamf.com',
  output: 'static',
  trailingSlash: 'always',
  compressHTML: false,                 // D2: parity
  prerenderConflictBehavior: 'error',  // D2: duplicate prerendered URLs and duplicate entry ids (default is 'warn')
  build: { format: 'directory', inlineStylesheets: 'never' },
  markdown: { syntaxHighlight: false },// posts do not go through Astro's pipeline (D6)
  redirects: {                         // static output: <meta http-equiv="refresh"> stubs, no status code
    '/12years/': '/subsites/elise/12years/',
    '/embedded-swift-agent/': '/subsites/dawson/embedded-swift-agent/',   // settled Q3
    ...externalPostRedirects(),
  },
  vite: { plugins: [externalizeSharedInstances] },
  integrations: [
    prose(),
    postOutput(),
    checks(),
    sitemap({
      customPages: [embeddedAgentSubsite],
      filter: includeInSitemap,
      serialize: serializeSitemapItem,
    }),
  ],
});
