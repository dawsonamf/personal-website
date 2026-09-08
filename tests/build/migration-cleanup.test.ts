// S1-25: the legacy root serving tree is gone while its intentional owners remain.
// Run: node --test --test-concurrency=1 tests/build/migration-cleanup.test.ts

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, it } from 'node:test';

const repoRoot = resolve(import.meta.dirname, '..', '..');

function filesUnder(relative: string): string[] {
  const root = join(repoRoot, relative);
  if (!existsSync(root)) return [];
  return readdirSync(root, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => join(entry.parentPath, entry.name).slice(repoRoot.length + 1))
    .sort();
}

const LEGACY_ROOT_FILES = ['index.html', '404.html', 'robots.txt', 'sitemap.xml'] as const;
const LEGACY_ROOT_DIRS = [
  '12years', 'blog', 'css', 'embedded-swift-agent', 'js', 'lexchat', 'privacy', 'resources',
] as const;
const INACTIVE_SKINS = ['space.css', 'vapor.css', 'wanted.css', 'constructivist.css'] as const;
const RETAINED_SUBSITE_FILES = [
  'public/subsites/elise/12years/index.html',
  'public/subsites/elise/12years/now.jpeg',
  'public/subsites/elise/12years/then.jpeg',
  'public/subsites/dawson/embedded-swift-agent/index.html',
  'public/subsites/dawson/embedded-swift-agent/agent.js',
  'public/subsites/dawson/embedded-swift-agent/EmbeddedSwiftAgent.wasm',
  'public/subsites/dawson/embedded-swift-agent/embedded-swift-agent-context.md',
] as const;

describe('S1-25 migration cleanup boundary', () => {
  it('has no file left in the superseded root serving tree', () => {
    for (const path of LEGACY_ROOT_FILES) assert.equal(existsSync(join(repoRoot, path)), false, path);
    for (const path of LEGACY_ROOT_DIRS) assert.deepEqual(filesUnder(path), [], path);
  });

  it('keeps rollback roots and active static owners', () => {
    for (const path of ['CNAME', '.nojekyll', 'public/robots.txt', 'public/blog/post.html']) {
      assert.equal(existsSync(join(repoRoot, path)), true, path);
    }
    for (const name of INACTIVE_SKINS) {
      assert.equal(existsSync(join(repoRoot, 'public/css/themes', name)), true, name);
    }
    for (const path of RETAINED_SUBSITE_FILES) assert.equal(existsSync(join(repoRoot, path)), true, path);
    assert.ok(filesUnder('public/vendor').length > 0, 'vendored libraries remain');
    assert.ok(filesUnder('public/blog/posts/assets').length > 0, 'post assets remain');
    assert.equal(existsSync(join(repoRoot, 'public/resources/LexChat_Media.jpeg')), true);
  });

  it('keeps the single post source tree and the intended runtime module set', () => {
    assert.deepEqual(
      filesUnder('src/content/posts').map((path) => path.slice('src/content/posts/'.length)),
      [
        'arena-freshness.md', 'autoencoders-1.md', 'autoencoders-2.md', 'college-projects.md',
        'embedded-swift-agent.md', 'fly-on-my-laptop.md', 'gemma4-heretic-ara.md', 'helm.md',
        'metr-doubling.md', 'toolbelt.md', 'underviewed-art.md',
      ],
    );
    assert.deepEqual(
      filesUnder('public/js').map((path) => path.slice('public/js/'.length)),
      [
        'anim-utils.js', 'blog-listing-client.js', 'blog-post-client.js', 'cursor-follow.js',
        'featured-carousel.js', 'nav-behavior.js', 'script.js', 'theme-cycler.js', 'typing-engine.js',
      ],
    );
  });

  it('keeps LexChat only as the approved external project CTA and image', () => {
    const prose = readFileSync(join(repoRoot, 'src/content/prose.yaml'), 'utf8');
    assert.match(prose, /href: https:\/\/huggingface\.co\/spaces\/dawsonamf\/lexchat/);
    assert.match(prose, /image: \/resources\/LexChat_Media\.jpeg/);
    assert.equal(filesUnder('src/pages').some((path) => /(?:^|\/)lexchat(?:\/|\.)/i.test(path)), false);
    assert.equal(filesUnder('public').some((path) => /(?:^|\/)lexchat(?:\/|$)/i.test(path)), false);
  });

  it('contains no retired picker selector while preserving the live FAB contract', () => {
    const css = filesUnder('public/css')
      .filter((path) => path.endsWith('.css'))
      .map((path) => readFileSync(join(repoRoot, path), 'utf8'))
      .join('\n');
    assert.doesNotMatch(css, /\.tc-(?:toggle|close)(?:\W|$)/);
    assert.match(css, /\.tc-fab\s*\{/);
    const fab = readFileSync(join(repoRoot, 'src/layouts/canonical/components/PickerFab.astro'), 'utf8');
    assert.match(fab, /class="tc-nav-item tc-fab"/);
    assert.match(fab, /class="tc-nav-trigger tc-fab-btn"/);
  });

  it('generates the classic picker ramp before every official build mode without drift', () => {
    const packageJson = JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf8')) as {
      scripts: Record<string, string>;
    };
    assert.equal(packageJson.scripts['picker:build'], 'node scripts/build-picker.mjs');
    assert.equal(packageJson.scripts.dev, 'npm run picker:build && PROSE_DRAFTS=allow astro dev');
    assert.equal(
      packageJson.scripts.build,
      'npm run picker:build && npm run prose:check && npm run check && astro build',
    );
    assert.equal(
      packageJson.scripts['build:preview'],
      'npm run picker:build && PROSE_DRAFTS=allow astro build',
    );

    const check = spawnSync(process.execPath, ['scripts/build-picker.mjs', '--check'], {
      cwd: repoRoot,
      encoding: 'utf8',
    });
    assert.equal(check.status, 0, `${check.stdout}${check.stderr}`);
  });
});
