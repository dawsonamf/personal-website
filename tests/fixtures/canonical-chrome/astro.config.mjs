import { fileURLToPath, pathToFileURL } from 'node:url';
import { defineConfig } from 'astro/config';

const externalized = [
  '../../../src/prose/index.ts',
  '../../../src/prose/site.ts',
].map((path) => fileURLToPath(new URL(path, import.meta.url)));

const externalize = {
  name: 'fixture-shared-prose',
  enforce: 'pre',
  apply: 'build',
  async resolveId(source, importer) {
    if (!importer) return null;
    const found = await this.resolve(source, importer, { skipSelf: true });
    const id = found?.id.split('?')[0];
    return id && externalized.includes(id)
      ? { id: pathToFileURL(id).href, external: true }
      : null;
  },
};

export default defineConfig({
  output: 'static',
  outDir: process.env.TEST_BUILD_OUT_DIR || './dist',
  cacheDir: fileURLToPath(new URL('./.astro/', import.meta.url)),
  compressHTML: false,
  vite: {
    cacheDir: fileURLToPath(new URL('./node_modules/.vite/', import.meta.url)),
    plugins: [externalize],
  },
});
