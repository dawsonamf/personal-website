import { expect, test, type Page } from '@playwright/test';
import { spawnSync } from 'node:child_process';
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { createServer, type Server } from 'node:http';
import { tmpdir } from 'node:os';
import { isAbsolute, join, relative, resolve, sep } from 'node:path';
import { oldDir } from '../../harness/baseline.ts';

const BUILD_MS = 180_000;
const repoRoot = resolve(import.meta.dirname, '..', '..');
const fixtureSource = resolve(repoRoot, 'tests', 'fixtures', 'canonical-chrome');
const oldRoot = oldDir();

let server: Server | undefined;
let origin = '';
let ownedRoot = '';
let buildRoot = '';
let nullBuildRoot = '';

function linkInstalledPackages(projectRoot: string): void {
  const installed = resolve(repoRoot, 'node_modules');
  const local = resolve(projectRoot, 'node_modules');
  mkdirSync(local, { recursive: true });
  for (const entry of readdirSync(installed, { withFileTypes: true })) {
    if (entry.name === '.vite' || entry.name === '.cache') continue;
    symlinkSync(
      resolve(installed, entry.name),
      resolve(local, entry.name),
      entry.isDirectory() ? 'dir' : 'file',
    );
  }
}

function buildFixture(name: string, nullProse = false): string {
  const projectRoot = resolve(ownedRoot, name);
  const sourceRoot = resolve(projectRoot, 'src');
  cpSync(resolve(repoRoot, 'src'), sourceRoot, { recursive: true });
  rmSync(resolve(sourceRoot, 'pages'), { recursive: true, force: true });
  mkdirSync(resolve(sourceRoot, 'pages'), { recursive: true });

  const page = readFileSync(resolve(fixtureSource, 'Page.astro'), 'utf8')
    .replaceAll('../../../src/layouts/', '../layouts/')
    .replaceAll('../../../src/themes/', '../themes/');
  writeFileSync(resolve(sourceRoot, 'pages', 'Page.astro'), page);

  const routes = readFileSync(resolve(fixtureSource, 'src', 'pages', '[kind].astro'), 'utf8')
    .replace('../../Page.astro', './Page.astro');
  writeFileSync(resolve(sourceRoot, 'pages', '[kind].astro'), routes);

  const config = readFileSync(resolve(fixtureSource, 'astro.config.mjs'), 'utf8')
    .replaceAll('../../../src/', './src/');
  writeFileSync(resolve(projectRoot, 'astro.config.mjs'), config);
  mkdirSync(resolve(projectRoot, 'public'), { recursive: true });
  cpSync(resolve(repoRoot, 'public', 'js'), resolve(projectRoot, 'public', 'js'), {
    recursive: true,
  });

  if (nullProse) {
    const prosePath = resolve(sourceRoot, 'content', 'prose.yaml');
    const prose = readFileSync(prosePath, 'utf8')
      .replace('logo: { xs: D }', 'logo: { xs: null }')
      .replace(
        'footerCredit: { s: Designed and built by Dawson Metzger-Fleetwood }',
        'footerCredit: { s: null }',
      )
      .replace('about: { xs: About }', 'about: { xs: null }')
      .replace('email: { xs: Email }', 'email: { xs: null }')
      .replace('label: { xs: LinkedIn }', 'label: { xs: null }');
    writeFileSync(prosePath, prose);
  }

  linkInstalledPackages(projectRoot);
  const dist = resolve(projectRoot, 'dist');
  const run = spawnSync(
    process.execPath,
    [resolve(repoRoot, 'node_modules', 'astro', 'bin', 'astro.mjs'), 'build', '--root', projectRoot],
    {
      cwd: projectRoot,
      encoding: 'utf8',
      timeout: BUILD_MS,
      killSignal: 'SIGTERM',
      env: { ...process.env, TEST_BUILD_OUT_DIR: dist },
    },
  );
  if (run.error) throw run.error;
  if (run.status !== 0) {
    throw new Error(`Astro fixture build failed (${run.status}):\n${run.stdout}\n${run.stderr}`);
  }
  return dist;
}

function contained(root: string, candidate: string): boolean {
  const rel = relative(root, candidate);
  return rel === '' || (!rel.startsWith('..' + sep) && rel !== '..' && !isAbsolute(rel));
}

function resolveRequest(pathname: string): string | undefined {
  let root = buildRoot;
  let requestPath = pathname;
  if (pathname.startsWith('/old/')) {
    root = oldRoot;
    requestPath = pathname.slice('/old/'.length);
  } else if (pathname.startsWith('/null/')) {
    root = nullBuildRoot;
    requestPath = pathname.slice('/null/'.length);
  } else {
    requestPath = pathname.slice(1);
  }

  let decoded: string;
  try {
    decoded = decodeURIComponent(requestPath);
  } catch {
    return undefined;
  }
  if (decoded.includes('\0')) return undefined;

  let file = resolve(root, decoded);
  if (!contained(root, file)) return undefined;
  try {
    if (statSync(file).isDirectory()) file = resolve(file, 'index.html');
  } catch {
    return undefined;
  }
  return contained(root, file) && existsSync(file) ? file : undefined;
}

async function closeServer(): Promise<void> {
  if (!server) return;
  server.closeIdleConnections?.();
  server.closeAllConnections?.();
  await new Promise<void>((resolveClose, reject) => {
    server!.close((error) => error ? reject(error) : resolveClose());
  });
  server = undefined;
}

test.beforeAll(async ({}, workerInfo) => {
  const scratchBase = process.env.TEST_BUILD_OUT_DIR
    ? resolve(process.env.TEST_BUILD_OUT_DIR)
    : tmpdir();
  mkdirSync(scratchBase, { recursive: true });
  ownedRoot = mkdtempSync(join(scratchBase, `canonical-chrome-w${workerInfo.workerIndex}-`));

  try {
    buildRoot = buildFixture('default');
    nullBuildRoot = buildFixture('null-prose', true);
    server = createServer((request, response) => {
      const pathname = new URL(request.url ?? '/', 'http://fixture.invalid').pathname;
      const file = resolveRequest(pathname);
      if (!file) {
        response.statusCode = 404;
        response.end('missing');
        return;
      }
      response.setHeader(
        'content-type',
        file.endsWith('.js') ? 'text/javascript'
          : file.endsWith('.css') ? 'text/css'
            : 'text/html',
      );
      response.end(readFileSync(file));
    });
    await new Promise<void>((resolveListen, reject) => {
      server!.once('error', reject);
      server!.listen(0, '127.0.0.1', resolveListen);
    });
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('fixture did not bind TCP');
    origin = `http://127.0.0.1:${address.port}`;
  } catch (error) {
    await closeServer().catch(() => {});
    if (ownedRoot) rmSync(ownedRoot, { recursive: true, force: true });
    throw error;
  }
});

test.afterAll(async () => {
  try {
    await closeServer();
  } finally {
    if (ownedRoot) rmSync(ownedRoot, { recursive: true, force: true });
  }
});

function legacyScripts(kind: 'home' | 'blog' | 'post'): Array<[string, boolean]> {
  const path = kind === 'home' ? 'index.html' : kind === 'blog' ? 'blog/index.html' : 'blog/post.html';
  const source = readFileSync(resolve(oldRoot, path), 'utf8');
  const retained = new Set(['typing-engine.js', 'anim-utils.js', 'nav-config.js', 'cursor-follow.js']);
  return [...source.matchAll(/<script\b([^>]*?)\bsrc="([^"]+)"([^>]*)><\/script>/g)]
    .map((match) => {
      const name = match[2]!.split('/').pop()!;
      return [name === 'nav-config.js' ? 'nav-behavior.js' : name, /\bdefer\b/.test(match[1]! + match[3]!)] as [string, boolean];
    })
    .filter(([name]) => retained.has(name === 'nav-behavior.js' ? 'nav-config.js' : name));
}

async function chromeSnapshot(page: Page, kind: 'home' | 'blog' | 'post'): Promise<string> {
  return page.evaluate((pageKind: 'home' | 'blog' | 'post') => {
    const selectors = ['.moving-menu', '#cursor-container', '.header-menu-container', '.footer-container'];
    if (pageKind !== 'post') {
      selectors.push(
        '.footer-container-mobile',
        pageKind === 'home' ? '#socials-list' : '#blog-socials-list',
      );
    }
    if (pageKind === 'home') selectors.push('.quick-links');
    return selectors.map((selector) => document.querySelector(selector)?.outerHTML ?? '').join('')
      .replace(/<!--.*?-->/gs, '')
      .replace(/(<div class="(?:cursor-follow|circle-follow)") style="[^"]*"/g, '$1')
      .replace(/href="(?:\.\.\/)?index\.html(#.*?)"/g, 'href="/$1"')
      .replace(/href="(?:\.\/|blog\/)"/g, 'href="/blog/"')
      .replace(
        /href="(?:https:\/\/www\.dawsonamf\.com\/|\.\.\/)?resources\//g,
        'href="/resources/',
      )
      .replace(/(<a class="name-logo(?: name-logo-visible)?" href=")[^"]+/g, '$1/')
      .replace(/\s+/g, ' ')
      .replace(/> /g, '>')
      .replace(/ </g, '<')
      .trim();
  }, kind);
}

for (const kind of ['home', 'blog', 'post'] as const) {
  test(`${kind} emits canonical chrome and exact link behavior`, async ({ page }) => {
    await page.goto(`${origin}/${kind}/`);
    await expect(page.locator('.moving-menu .tc-nav-trigger')).toHaveCount(1);
    await expect(page.locator('.static-menu .tc-nav-trigger')).toHaveCount(1);
    await expect(page.locator('.static-menu-mobile .tc-nav-trigger')).toHaveCount(1);
    await expect(page.locator('.name-logo')).toHaveAttribute('href', '/');
    await expect(page.locator('.name-logo')).toHaveClass(
      kind === 'post' ? /name-logo-visible/ : /name-logo/,
    );
    await expect(page.locator('.static-menu a', { hasText: 'About' })).toHaveAttribute(
      'href',
      kind === 'home' ? '#about' : '/#about',
    );
    await expect(page.locator('.footer-container-mobile')).toHaveCount(kind === 'post' ? 0 : 1);
  });

  test(`${kind} normalized chrome matches immutable OLD`, async ({ page }) => {
    await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, (route) => route.abort());
    const oldPath = kind === 'home'
      ? '/old/index.html'
      : kind === 'blog' ? '/old/blog/index.html' : '/old/blog/post.html';
    await page.goto(origin + oldPath);
    await page.waitForFunction(
      () => document.querySelector('.static-menu .menu-list')?.children.length,
    );
    const old = await chromeSnapshot(page, kind);
    await page.goto(`${origin}/${kind}/`);
    expect(await chromeSnapshot(page, kind)).toBe(old);
  });
}

test('explicit-null prose omits owned slots and recomputes separators', async ({ page }) => {
  await page.goto(`${origin}/null/home/`);
  await expect(page.getByRole('link', { name: 'About' })).toHaveCount(0);
  await expect(page.locator('.name-logo')).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'LinkedIn' })).toHaveCount(0);
  await expect(page.locator('.footer-container, .footer-container-mobile')).toHaveCount(0);
  await expect(page.locator('.static-menu .menu-spacer')).toHaveCount(5);
  await expect(page.locator('.static-menu-mobile .menu-spacer')).toHaveCount(2);
  await expect(page.locator('.contact-menu .socials-menu-spacer2')).toHaveCount(4);
});

test('themed subpage links route through themed home and assets stay stable', async ({ page }) => {
  await page.goto(`${origin}/brutalist-post/`);
  await expect(page.locator('.static-menu a', { hasText: 'About' }))
    .toHaveAttribute('href', '/brutalist/#about');
  await expect(page.locator('.name-logo')).toHaveAttribute('href', '/brutalist/');
  await expect(page.locator('.resume-link').first())
    .toHaveAttribute('href', '/resources/Resume.pdf');
});

test('script attributes derive from each immutable legacy page', async ({ page }) => {
  for (const kind of ['home', 'blog', 'post'] as const) {
    await page.goto(`${origin}/${kind}/`);
    const actual = await page.locator('script[src]').evaluateAll((nodes) =>
      nodes.map((node) => [
        node.getAttribute('src')!.split('/').pop(),
        node.hasAttribute('defer'),
      ]),
    );
    expect(actual).toEqual(legacyScripts(kind));
  }
});

test('unknown and escaping paths return 404', async ({ request }) => {
  expect((await request.get(`${origin}/missing/`)).status()).toBe(404);
  expect((await request.get(`${origin}/%2e%2e/%2e%2e/etc/passwd`)).status()).toBe(404);
  expect((await request.get(`${origin}/old/%2e%2e/package.json`)).status()).toBe(404);
});

test('Calendly binds every anchor once and reads live colors', async ({ page }) => {
  await page.addInitScript(() => {
    (window as any).Calendly = {
      calls: [] as string[],
      initPopupWidget(value: { url: string }) { this.calls.push(value.url); },
    };
  });
  await page.goto(`${origin}/home/`);
  await page.locator('.calendly-link').evaluateAll((links) =>
    links.forEach((link) => (link as HTMLElement).click()),
  );
  const calls = await page.evaluate(() => (window as any).Calendly.calls);
  expect(calls).toHaveLength(await page.locator('.calendly-link').count());
  expect(calls[0]).toContain(
    'background_color=112233&text_color=ddeeff&primary_color=aabbcc',
  );

  await page.evaluate(() => {
    document.documentElement.style.setProperty('--bg', '#abcdef');
    document.querySelector<HTMLElement>('.calendly-link')!.click();
  });
  expect(await page.evaluate(() => (window as any).Calendly.calls.at(-1)))
    .toContain('background_color=abcdef');

  await page.addScriptTag({ url: '/js/nav-behavior.js' });
  await page.evaluate(() => document.querySelector<HTMLElement>('.calendly-link')!.click());
  await page.evaluate(() => {
    for (const name of ['--bg', '--text', '--primary']) {
      document.documentElement.style.removeProperty(name);
    }
    document.querySelector<HTMLElement>('.calendly-link')!.click();
  });
  expect(await page.evaluate(() => (window as any).Calendly.calls.length))
    .toBe(calls.length + 3);
  expect(await page.evaluate(() => (window as any).Calendly.calls.at(-1)))
    .toContain('background_color=1d1d1d&text_color=e6f1ff&primary_color=61ffda');
});

test('typing preserves modes, delete polarity, timings, and cancellation', async ({ page }) => {
  await page.goto(`${origin}/home/`);

  const evidence = await page.evaluate(() => {
    const nativeSetTimeout = window.setTimeout;
    const run = (config: any) => {
      const queue: Array<{ fn: TimerHandler; ms: number }> = [];
      const delays: number[] = [];
      window.setTimeout = ((fn: TimerHandler, ms = 0) => {
        delays.push(ms);
        queue.push({ fn, ms });
        return queue.length;
      }) as typeof window.setTimeout;
      (window as any).startTypingSequence(config);
      let guard = 0;
      while (queue.length) {
        if (++guard > 1000) throw new Error('fake timer did not settle');
        const task = queue.shift()!;
        if (typeof task.fn === 'function') task.fn();
      }
      return delays;
    };

    try {
      const element = document.getElementById('typing-text')!;
      const letterWord = run({
        elementId: 'typing-text',
        sequences: [[
          { action: 'type', text: 'one two' },
          { action: 'delete', count: 3 },
        ]],
      });
      const letterWordShape = {
        words: element.querySelectorAll('.tw-word').length,
        glyphs: element.querySelectorAll('.tw').length,
        cursors: element.querySelectorAll('.cursor').length,
        deleteBeats: letterWord.filter((delay) => delay === 40).length,
      };

      document.documentElement.removeAttribute('data-typing');
      document.documentElement.removeAttribute('data-typing-delete');
      const cursorChar = run({
        elementId: 'typing-text',
        sequences: [[
          { action: 'type', text: 'ab' },
          { action: 'pause', duration: 123 },
          { action: 'delete', count: 2 },
        ]],
      });
      const cursorCharShape = {
        cursors: element.querySelectorAll('.cursor').length,
        glyphs: element.querySelectorAll('.tw').length,
        deleteBeats: cursorChar.filter((delay) => delay === 40).length,
      };

      document.documentElement.dataset.typing = 'letter';
      const letterChar = run({
        elementId: 'typing-text',
        deleteMode: 'char',
        sequences: [[
          { action: 'type', text: 'one' },
          { action: 'delete', count: 3 },
        ]],
      });

      const staleQueue: Array<{ fn: TimerHandler; ms: number }> = [];
      window.setTimeout = ((fn: TimerHandler, ms = 0) => {
        staleQueue.push({ fn, ms });
        return staleQueue.length;
      }) as typeof window.setTimeout;
      (window as any).startTypingSequence({
        elementId: 'typing-text',
        sequences: [[
          { action: 'pause', duration: 1000 },
          { action: 'type', text: 'stale' },
        ]],
      });
      (window as any).startTypingSequence({
        elementId: 'typing-text',
        sequences: [[{ action: 'type', text: 'fresh' }]],
        typingDelay: 1,
      });
      while (staleQueue.length) {
        const task = staleQueue.shift()!;
        if (typeof task.fn === 'function') task.fn();
      }

      return {
        letterWord,
        letterWordShape,
        cursorChar,
        cursorCharShape,
        letterCharDeleteBeats: letterChar.filter((delay) => delay === 40).length,
        finalText: element.textContent,
        restartPresent: '__restartTypingSequence' in window,
      };
    } finally {
      window.setTimeout = nativeSetTimeout;
    }
  });

  expect(evidence.letterWord).toEqual(expect.arrayContaining([75, 120, 300]));
  expect(evidence.letterWordShape).toMatchObject({
    words: 1,
    glyphs: 3,
    cursors: 0,
    deleteBeats: 0,
  });
  expect(evidence.cursorChar).toEqual(expect.arrayContaining([75, 123, 40]));
  expect(evidence.cursorCharShape).toMatchObject({ cursors: 1, glyphs: 0, deleteBeats: 2 });
  expect(evidence.letterCharDeleteBeats).toBe(3);
  expect(evidence.finalText).toContain('fresh');
  expect(evidence.finalText).not.toContain('stale');
  expect(evidence.restartPresent).toBe(false);
});

test('sticky, intro, real animation finalization, and cursor remain active', async ({ page }) => {
  await page.goto(`${origin}/home/`);
  const fixedTheme = await page.locator('html').getAttribute('data-style');

  await expect(page.locator('.section-header-wrapper')).not.toHaveClass(/section-header-in/);
  const explicitlyRevealed = await page.evaluate(() => {
    const header = document.querySelector<HTMLElement>('.section-header-wrapper')!;
    (window as any).revealSectionHeader(header);
    return header.classList.contains('section-header-in');
  });
  expect(explicitlyRevealed).toBe(true);

  const header = page.locator('.section-header');
  const bubbledEventState = await page.evaluate(() => {
    const target = document.querySelector<HTMLElement>('.section-header')!;
    (window as any).animateThenPersist(
      target,
      'chrome-fixture-fade 80ms linear',
      '0s',
      { opacity: '0.65', transform: 'none' },
    );
    document.querySelector<HTMLElement>('.section-header-child')!
      .dispatchEvent(new AnimationEvent('animationend', { bubbles: true }));
    return {
      animationName: target.style.animationName,
      opacity: target.style.opacity,
      transform: target.style.transform,
    };
  });
  expect(bubbledEventState).toEqual({
    animationName: 'chrome-fixture-fade',
    opacity: '0.2',
    transform: 'translateX(7px)',
  });
  await page.waitForFunction(() => (
    document.querySelector<HTMLElement>('.section-header')!.style.animationName === 'none'
  ));
  await expect(header).toHaveCSS('opacity', '0.65');
  await expect(header).toHaveCSS('transform', 'none');
  expect(await header.evaluate((node) => ({
    animationName: (node as HTMLElement).style.animationName,
    computedAnimationName: getComputedStyle(node).animationName,
    opacity: (node as HTMLElement).style.opacity,
    transform: (node as HTMLElement).style.transform,
  }))).toEqual({
    animationName: 'none',
    computedAnimationName: 'none',
    opacity: '0.65',
    transform: 'none',
  });

  await page.evaluate(() => {
    Object.defineProperty(window, 'pageYOffset', { configurable: true, value: 350 });
    window.dispatchEvent(new Event('scroll'));
  });
  await expect(page.locator('.moving-menu')).not.toHaveClass(/menu-sticky/);
  await page.evaluate(() => {
    Object.defineProperty(window, 'pageYOffset', { configurable: true, value: 320 });
    window.dispatchEvent(new Event('scroll'));
  });
  await expect(page.locator('.moving-menu')).toHaveClass(/menu-sticky/);
  await page.mouse.move(40, 50);
  await expect(page.locator('#cursor-container')).toHaveCSS('opacity', '1');
  await expect(page.locator('html')).toHaveAttribute('data-style', fixedTheme!);

  expect(readFileSync(resolve(repoRoot, 'public/js/anim-utils.js'), 'utf8'))
    .not.toContain('new MutationObserver');
});
