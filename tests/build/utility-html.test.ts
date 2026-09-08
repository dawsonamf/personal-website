// S1-21: functional utility output from one real isolated production build.

import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { after, before, describe, it } from 'node:test';

import { THEME_IDS } from '../../src/themes/registry.ts';
import { externalPostRedirects } from '../../src/build/post-output.ts';
import { buildSite, cleanup } from '../fixtures/composition/build.ts';

const count = (value: string, needle: string) => value.split(needle).length - 1;
const htmlFiles = (root: string) => readdirSync(root, { recursive: true, withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name.endsWith('.html'))
  .map((entry) => join(entry.parentPath, entry.name).slice(root.length + 1));

describe('S1-21 utility HTML', () => {
  let dir: string | undefined;
  let dist = '';

  before(() => {
    const built = buildSite('s1-21-utilities-');
    dir = built.dir;
    dist = built.dist;
  });

  after(() => cleanup(dir));

  it('renders readable approved privacy content, both footers, and a FAB for every theme', () => {
    for (const id of THEME_IDS) {
      const rel = id === 'default' ? 'privacy/index.html' : `${id}/privacy/index.html`;
      const html = readFileSync(join(dist, rel), 'utf8');
      assert.match(html, /<h1 class="privacy-header">Privacy Policy<\/h1>/);
      assert.match(html, /<h2>1\. Information Collection<\/h2>/);
      assert.match(html, /href="mailto:dawsonamf@icloud\.com"/);
      assert.equal(count(html, 'class="footer-container"'), 1, `${id}: desktop footer`);
      assert.equal(count(html, 'class="footer-container-mobile"'), 1, `${id}: mobile footer`);
      assert.equal(count(html, 'class="tc-nav-item tc-fab"'), 1, `${id}: FAB`);
      assert.equal(count(html, '<!--theme-assets-->'), 1, `${id}: ThemeAssets marker`);
    }
  });

  it('keeps full skin sheets on utilities', () => {
    const skin = readFileSync(join(dist, 'grid/privacy/index.html'), 'utf8');
    assert.match(skin, /href="\/css\/themes\/theme-base\.css"[^>]*data-style-asset/);
    assert.match(skin, /href="\/css\/themes\/grid\.css"[^>]*data-style-asset/);
  });

  it('emits one root-safe functional 404 with registry appearance and CSS prose data', () => {
    const html = readFileSync(join(dist, '404.html'), 'utf8');
    assert.match(html, /href="\/vendor\/fontawesome-free\/css\/all\.min\.css"/);
    assert.match(html, /<a class="name-logo name-logo-visible" href="\/">/);
    assert.match(html, /<a class="text-link" href="\/">Back to the home page<\/a>/);
    assert.equal(count(html, '<!--theme-assets-->'), 1);
    assert.match(html, /id="nf-themes"/);
    assert.match(html, /--prose-ticker/);
    assert.match(html, /--prose-currently-here/);
    assert.doesNotMatch(html, /\.astro|"layouts"/);
    assert.ok(html.indexOf('id="nf-themes"') < html.indexOf('src="/js/theme-cycler.js"'));
  });

  it('does not emit a local or themed LexChat page', () => {
    assert.equal(existsSync(join(dist, 'lexchat/index.html')), false);
    for (const id of THEME_IDS.filter((id) => id !== 'default')) {
      assert.equal(existsSync(join(dist, id, 'lexchat/index.html')), false, id);
    }
    const home = readFileSync(join(dist, 'index.html'), 'utf8');
    assert.match(home, /href="https:\/\/huggingface\.co\/spaces\/dawsonamf\/lexchat"[^>]*target="_blank" rel="noopener noreferrer"/);
  });

  it('keeps the exact revised production, post, and sitemap counts', () => {
    const preserved = new Set([
      '12years/index.html',
      ...Object.keys(externalPostRedirects()).map((route) => join(route.slice(1), 'index.html')),
      'blog/post.html',
      'embedded-swift-agent/index.html',
      'subsites/dawson/embedded-swift-agent/index.html',
      'subsites/elise/12years/index.html',
    ]);
    const routes = htmlFiles(dist).filter((file) => !preserved.has(file));
    assert.equal(routes.length, 177, '176 page routes plus 404.html');
    assert.equal(routes.filter((file) => /(?:^|\/)blog\/(?:fly-on-my-laptop|underviewed-art|arena-freshness|helm|toolbelt|embedded-swift-agent|metr-doubling|college-projects)\/index\.html$/.test(file)).length, 128);

    const sitemap = readFileSync(join(dist, 'sitemap-0.xml'), 'utf8');
    assert.equal([...sitemap.matchAll(/<loc>[^<]+<\/loc>/g)].length, 12);
    assert.match(sitemap, /<loc>https:\/\/www\.dawsonamf\.com\/subsites\/dawson\/embedded-swift-agent\/<\/loc>/);
    assert.doesNotMatch(sitemap, /\/lexchat\//);
  });
});
