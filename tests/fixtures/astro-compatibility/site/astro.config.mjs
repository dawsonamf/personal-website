import { fileURLToPath, pathToFileURL } from 'node:url';
import { defineConfig } from 'astro/config';
import checks from './src/build/checks.ts';

// (k) The build-time accessor must be ONE module instance across both sides:
// the config side (astro.config.mjs is loaded by plain Node import(), so
// ./src/prose/index.ts lands in Node's own module cache) and the page side
// (bundled into the SSR chunks that prerender in this same process).
//
// Marking the module external is not enough on its own: an external keeps the
// authored specifier, and a relative one cannot resolve from the temporary
// server-chunk directory. So resolveId rewrites the id to the absolute file://
// URL, which is exactly the key Node already has in its module cache.
//
// Matching is on the RESOLVED id, not the authored specifier: extensionless,
// root-absolute and aliased forms must all be caught, or they get bundled and
// the config side silently sees an empty set.
const proseModule = fileURLToPath(new URL('./src/prose/index.ts', import.meta.url));
const proseUrl = pathToFileURL(proseModule).href;

const externalProse = {
  name: 'spike-external-prose',
  enforce: 'pre',
  async resolveId(source, importer) {
    if (!importer) return null;
    const resolved = await this.resolve(source, importer, { skipSelf: true });
    if (resolved && resolved.id.split('?')[0] === proseModule) {
      return { id: proseUrl, external: true };
    }
    return null;
  },
};

export default defineConfig({
  site: 'https://www.dawsonamf.com',
  output: 'static',
  trailingSlash: 'always',
  compressHTML: false,
  prerenderConflictBehavior: 'error',
  build: { format: 'directory', inlineStylesheets: 'never' },
  markdown: { syntaxHighlight: false },
  redirects: {
    '/12years/': '/subsites/elise/12years/',
  },
  vite: { plugins: [externalProse] },
  integrations: [checks()],
});
