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
const fixtureSource = resolve(repoRoot, 'tests', 'fixtures', 'home-sections');
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

function nullProse(source: string): string {
  return source
    .replace('heroAlt: { xs: Dawson Metzger-Fleetwood }', 'heroAlt: { xs: null }')
    .replace('title: { xs: About Me }', 'title: { xs: null }')
    .replace('name: { xs: Web }', 'name: { xs: null }')
    .replaceAll('contact: { xs: Contact }', 'contact: { xs: null }')
    .replace('mapAlt: { xs: Map }', 'mapAlt: { xs: null }')
    .replace('company: { xs: About Objects }', 'company: { xs: null }')
    .replace('role: { xs: Guest Lecturer }', 'role: { xs: null }')
    .replace('dates: { xs: September 2019 - July 2023 }', 'dates: { xs: null }')
    .replace(
      /(  - id: startup-shell[\s\S]*?    bullets:)\n      l:[\s\S]*?(?=\n\nprojects:)/,
      '$1\n      l: null',
    );
}

function buildFixture(name: string, useNullProse = false): string {
  const projectRoot = resolve(ownedRoot, name);
  const sourceRoot = resolve(projectRoot, 'src');
  cpSync(resolve(repoRoot, 'src'), sourceRoot, { recursive: true });
  rmSync(resolve(sourceRoot, 'pages'), { recursive: true, force: true });
  mkdirSync(resolve(sourceRoot, 'pages'), { recursive: true });

  const page = readFileSync(resolve(fixtureSource, 'Page.astro'), 'utf8')
    .replaceAll('../../../src/', '../');
  writeFileSync(resolve(sourceRoot, 'pages', 'Page.astro'), page);
  const route = readFileSync(resolve(fixtureSource, 'src', 'pages', '[variant].astro'), 'utf8');
  writeFileSync(resolve(sourceRoot, 'pages', '[variant].astro'), route);
  cpSync(resolve(fixtureSource, 'astro.config.mjs'), resolve(projectRoot, 'astro.config.mjs'));

  cpSync(resolve(repoRoot, 'public'), resolve(projectRoot, 'public'), { recursive: true });
  cpSync(
    resolve(fixtureSource, 'public'),
    resolve(projectRoot, 'public'),
    { recursive: true, force: true },
  );

  if (useNullProse) {
    const prosePath = resolve(sourceRoot, 'content', 'prose.yaml');
    const source = readFileSync(prosePath, 'utf8');
    const changed = nullProse(source);
    if (changed === source || !changed.includes('  - id: startup-shell') || !changed.includes('      l: null')) {
      throw new Error('null prose fixture substitutions did not apply');
    }
    writeFileSync(prosePath, changed);
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
  ownedRoot = mkdtempSync(join(scratchBase, `home-sections-w${workerInfo.workerIndex}-`));
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
            : file.endsWith('.woff2') ? 'font/woff2'
              : file.endsWith('.png') ? 'image/png'
                : file.endsWith('.jpg') || file.endsWith('.jpeg') ? 'image/jpeg'
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

async function routeLegacyVendors(page: Page): Promise<void> {
  const vendors: Array<[RegExp, string]> = [
    [/gsap.*\.min\.js/, 'vendor/gsap/gsap.min.js'],
    [/jquery-ui.*\.min\.js/, 'vendor/jquery-ui/jquery-ui.min.js'],
    [/jquery-3\.6\.0\.min\.js/, 'vendor/jquery/jquery.min.js'],
    [/aos.*\.js/, 'vendor/aos/aos.js'],
    [/vanilla-tilt.*\.min\.js/, 'vendor/vanilla-tilt/vanilla-tilt.min.js'],
  ];
  await page.route(/^https?:\/\//, async (route) => {
    if (route.request().url().startsWith(origin)) return route.continue();
    const match = vendors.find(([pattern]) => pattern.test(route.request().url()));
    if (!match) return route.abort();
    await route.fulfill({
      status: 200,
      contentType: 'text/javascript',
      body: readFileSync(resolve(repoRoot, 'public', match[1]), 'utf8'),
    });
  });
}

async function waitForHome(page: Page): Promise<void> {
  await page.waitForFunction(() => document.querySelectorAll('#blog-scroll-track .blog-card').length === 10);
  await page.waitForLoadState('load');
}

async function expectRequestedViewport(page: Page): Promise<void> {
  expect(await page.evaluate(() => window.innerWidth)).toBe(page.viewportSize()!.width);
}

async function normalizedSections(page: Page): Promise<Record<string, string>> {
  return page.evaluate(() => {
    const groups: Record<string, string[]> = {
      hero: ['#typing-right', '#sub-text', '#socials-list'],
      about: ['#about-header-wrapper', '#about'],
      jobs: ['.jobs-section-container'],
      contact: ['#contact-header-wrapper', '#contact'],
      railChrome: ['#blog-header-wrapper', '.blog-see-all'],
    };
    const transientClasses = new Set([
      'aos-init', 'aos-animate', 'section-header-in', 'hero-extras-in',
      'job-out-right', 'job-in-right',
    ]);
    const transientStyleProperties = new Set([
      'animation', 'animation-name', 'animation-duration', 'animation-delay',
      'animation-fill-mode', 'visibility', 'opacity', 'transform', 'transform-style',
      'will-change',
    ]);
    const normalizeUrl = (value: string) => value
      .replace(/^\.\.\/resources\//, '/resources/')
      .replace(/^resources\//, '/resources/')
      .replace(/^https:\/\/www\.dawsonamf\.com\/resources\//, '/resources/')
      .replace(/^blog\/post\.html\?id=([^#&]+)$/, '/blog/$1/')
      .replace(/^blog\/$/, '/blog/');
    const serialize = (selector: string) => {
      const source = document.querySelector(selector);
      if (!source) return '';
      const clone = source.cloneNode(true) as HTMLElement;
      const walker = document.createTreeWalker(clone, NodeFilter.SHOW_COMMENT);
      const comments: Comment[] = [];
      while (walker.nextNode()) comments.push(walker.currentNode as Comment);
      comments.forEach((comment) => comment.remove());
      for (const element of [clone, ...clone.querySelectorAll<HTMLElement>('*')]) {
        const classes = [...element.classList].filter((name) => !transientClasses.has(name));
        if (classes.length) element.className = classes.join(' ');
        else element.removeAttribute('class');
        for (const name of ['href', 'src']) {
          const value = element.getAttribute(name);
          if (value) element.setAttribute(name, normalizeUrl(value));
        }
        if (element.hasAttribute('style')) {
          for (const property of transientStyleProperties) element.style.removeProperty(property);
          if (!element.getAttribute('style')?.trim()) element.removeAttribute('style');
        }
        const attrs = [...element.attributes]
          .map((attribute) => [attribute.name, attribute.value] as const)
          .sort(([a], [b]) => a.localeCompare(b));
        for (const attribute of [...element.attributes]) element.removeAttribute(attribute.name);
        for (const [name, value] of attrs) element.setAttribute(name, value);
      }
      return clone.outerHTML
        .replace(/[ \t\r\n]+/g, ' ')
        .replace(/> /g, '>')
        .replace(/ </g, '<')
        .trim();
    };
    return Object.fromEntries(
      Object.entries(groups).map(([name, selectors]) => [name, selectors.map(serialize).join('')]),
    );
  });
}

test('normalized home component DOM and text matches immutable OLD', async ({ page }) => {
  await routeLegacyVendors(page);
  await page.addInitScript(() => { Math.random = () => 0; });
  await page.goto(`${origin}/old/index.html`);
  await waitForHome(page);
  const old = await normalizedSections(page);
  await page.goto(`${origin}/home/`);
  await waitForHome(page);
  await expectRequestedViewport(page);
  expect(await normalizedSections(page)).toEqual(old);

  expect(await page.locator('.about-text br').count()).toBe(7);
  expect(await page.locator('.skills-text').nth(2).locator('br').count()).toBe(2);
  expect(await page.locator('#sub-text').textContent()).toBe('Web\u00a0|\u00a0iOS and visionOS\u00a0|\u00a0ML and RL');
  expect(await page.locator('#typing-image').getAttribute('alt')).toBe('Dawson Metzger-Fleetwood');
  expect(await page.locator('.contact-image').getAttribute('alt')).toBe('Map');
  await expect(page.locator('main > #typing-container')).toHaveCount(1);
  await expect(page.locator('main > #about-header-wrapper + #about + .section-spacer')).toHaveCount(1);
  await expect(page.locator('main > .jobs-section-container + .section-spacer')).toHaveCount(1);
  await expect(page.locator('main > #contact-header-wrapper + #contact + .section-spacer')).toHaveCount(1);

  await page.goto(`${origin}/reordered/`);
  expect(await page.locator('.sec-num').evaluateAll((nodes) =>
    nodes.map((node) => node.textContent),
  )).toEqual(['05.', '04.', '02.', '03.', '01.']);
});

test('source-position keys and job transition timing preserve the selected panel and geometry', async ({ page }) => {
  await page.addInitScript(() => { Math.random = () => 0; });
  await page.goto(`${origin}/home/`);
  await waitForHome(page);
  await expectRequestedViewport(page);
  expect(await page.locator('#jobs-menu-list li').evaluateAll((items) =>
    items.map((item) => item.getAttribute('data-job')),
  )).toEqual(['job-1', 'job-2', 'job-3', 'job-4']);
  expect(await page.locator('#jobs-content-wrapper > .job-content').evaluateAll((items) =>
    items.map((item) => item.id),
  )).toEqual(['job-1', 'job-2', 'job-3', 'job-4']);

  const tab2 = page.locator('[data-job="job-2"]');
  await tab2.click();
  await page.locator('[data-job="job-3"]').click({ force: true });
  await expect(tab2).toHaveClass(/selected/);
  await expect(page.locator('#job-1')).toHaveClass(/showing.*job-out-right|job-out-right.*showing/);
  await expect(page.locator('#job-2')).toHaveClass(/hidden/);
  await page.waitForTimeout(550);
  await expect(page.locator('#job-1')).toHaveClass(/hidden/);
  await expect(page.locator('#job-2')).toHaveClass(/job-in-right/);
  await page.waitForTimeout(520);
  await expect(page.locator('#job-2')).toHaveClass(/showing/);
  await expect(page.locator('#job-2')).not.toHaveClass(/job-in-right/);

  const assertGeometry = async (mobile: boolean) => {
    await page.waitForFunction((mobileLayout) => {
      const bar = document.getElementById('highlight')!;
      return (window.innerWidth <= 1100) === mobileLayout
        && (mobileLayout ? bar.style.height === '2px' : bar.style.width === '3px');
    }, mobile);
    const geometry = await page.evaluate(() => {
      const selected = document.querySelector<HTMLElement>('#jobs-menu-list li.selected')!;
      const list = document.getElementById('jobs-menu-list')!;
      const wrapper = document.querySelector<HTMLElement>('.menu-scroll-wrapper')!;
      const bar = document.getElementById('highlight')!;
      return {
        selected: {
          left: selected.offsetLeft - wrapper.scrollLeft,
          top: selected.offsetTop,
          width: selected.offsetWidth,
          height: selected.offsetHeight,
        },
        listBottom: list.offsetTop + list.offsetHeight,
        bar: {
          left: parseFloat(bar.style.left), top: parseFloat(bar.style.top),
          width: parseFloat(bar.style.width), height: parseFloat(bar.style.height),
          radius: bar.style.borderRadius,
        },
      };
    });
    if (mobile) {
      expect(geometry.bar).toEqual({
        left: geometry.selected.left,
        top: geometry.listBottom,
        width: geometry.selected.width,
        height: 2,
        radius: '0px',
      });
    } else {
      expect(geometry.bar).toEqual({
        left: -3,
        top: geometry.selected.top,
        width: 3,
        height: geometry.selected.height,
        radius: '6px',
      });
    }
  };

  const startsMobile = page.viewportSize()!.width <= 1100;
  await assertGeometry(startsMobile);
  await page.setViewportSize(startsMobile ? { width: 1440, height: 900 } : { width: 390, height: 844 });
  await expectRequestedViewport(page);
  await assertGeometry(!startsMobile);
  if (!startsMobile) {
    const wrapper = page.locator('.menu-scroll-wrapper');
    expect(await wrapper.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(true);
    await wrapper.evaluate((element) => {
      element.scrollLeft = 35;
      element.dispatchEvent(new Event('scroll'));
    });
    await assertGeometry(true);
  }
  await page.setViewportSize(startsMobile ? { width: 390, height: 844 } : { width: 1440, height: 900 });
  await expectRequestedViewport(page);
  await assertGeometry(startsMobile);

  await page.locator('#jobs-menu-list li.selected').evaluate((element) => {
    (element as HTMLElement).style.width = `${(element as HTMLElement).offsetWidth + 41}px`;
  });
  await page.locator('#jobs-menu-list li.selected').evaluate((element) => {
    (element as HTMLElement).style.paddingRight = '19px';
  });
  await page.waitForFunction(() => document.getElementById('highlight')!.style.transition === 'none');
  await assertGeometry(startsMobile);
});

test('real typing callback and trusted CSS animations naturally settle every rendered intro target', async ({ page }) => {
  await page.addInitScript(() => {
    Math.random = () => 0;
    (window as any).__naturalHomeAnimations = [];
    const targets: Array<[string, string]> = [
      ['static-menu', '.static-menu'],
      ['name-logo', '.name-logo'],
      ['typing-container', '#typing-container'],
      ['socials-list', '#socials-list'],
      ['static-menu-mobile', '.static-menu-mobile'],
      ['double-view-left', '.double-view-left'],
      ['double-view-right', '.double-view-right'],
      ['about-header', '#about-section-header'],
      ['about-spacer', '#about-header-spacer'],
      ['sub-text', '#sub-text'],
    ];
    const record = (event: AnimationEvent) => {
      const element = event.target instanceof Element ? event.target as HTMLElement : null;
      const found = element && targets.find(([, selector]) => element.matches(selector));
      if (!element || !found) return;
      (window as any).__naturalHomeAnimations.push({
        phase: event.type,
        key: found[0],
        animationName: event.animationName,
        elapsedTime: event.elapsedTime,
        isTrusted: event.isTrusted,
        duration: element.style.animationDuration,
        delay: element.style.animationDelay,
      });
    };
    document.addEventListener('animationstart', record as EventListener, true);
    document.addEventListener('animationend', record as EventListener, true);
  });
  await page.goto(`${origin}/home/`);
  await expectRequestedViewport(page);
  await page.waitForFunction(() => document.documentElement.classList.contains('hero-extras-in'));
  expect((await page.locator('#typing-text').innerText()).replaceAll('\u200b', ''))
    .toBe("Hi,\nI'm Dawson,\nweb developer.");
  expect(await page.evaluate(() => (window as any).__homeFixtureHeroCallbacks)).toBe(1);
  const typing = await page.evaluate(() => (window as any).__homeFixtureEvents.find((event: any) => event.name === 'typing'));
  expect(typing).toEqual({
    name: 'typing', typingDelay: 75, deleteDelay: 40,
    callbackIndex: [1, 1, 1, 1, 1, 1, 1, 1, 1],
  });

  const targets = [
    { key: 'static-menu', selector: '.static-menu', name: 'fadein', duration: 0.8, delay: 0.76, hiddenOn: 'mobile' },
    { key: 'name-logo', selector: '.name-logo', name: 'fadein', duration: 0.8, delay: 0.38 },
    { key: 'typing-container', selector: '#typing-container', name: 'slidein', duration: 0.8, delay: 0 },
    { key: 'socials-list', selector: '#socials-list', name: 'fadein', duration: 0.8, delay: 0.76, hiddenOn: 'mobile' },
    { key: 'static-menu-mobile', selector: '.static-menu-mobile', name: 'fadein', duration: 0.8, delay: 0.76, hiddenOn: 'desktop' },
    { key: 'double-view-left', selector: '.double-view-left', name: 'slideInLeft', duration: 1.5, delay: 0.04 },
    { key: 'double-view-right', selector: '.double-view-right', name: 'slideInRight', duration: 1.5, delay: 0.34 },
    { key: 'about-header', selector: '#about-section-header', name: 'fadein', duration: 0.8, delay: 1.84 },
    { key: 'about-spacer', selector: '#about-header-spacer', name: 'fadein', duration: 0.8, delay: 1.84 },
    { key: 'sub-text', selector: '#sub-text', name: 'fadein', duration: 0.8, delay: 0.01 },
  ];
  const viewport = page.viewportSize()!.width <= 1100 ? 'mobile' : 'desktop';
  await page.waitForFunction(({ targetList, currentViewport }) => targetList.every((target) => {
    const element = document.querySelector<HTMLElement>(target.selector);
    if (!element?.style.animationName) return false;
    const rendered = element.getClientRects().length > 0;
    return target.hiddenOn === currentViewport
      ? !rendered
      : rendered && element.style.animationName === 'none';
  }), { targetList: targets, currentViewport: viewport });

  const evidence = await page.evaluate((targetList) => ({
    events: (window as any).__naturalHomeAnimations,
    targets: targetList.map((target) => {
      const element = document.querySelector<HTMLElement>(target.selector)!;
      return {
        key: target.key,
        animationName: element.style.animationName,
        rendered: element.getClientRects().length > 0,
      };
    }),
  }), targets);
  expect(evidence.targets).toHaveLength(10);
  for (const target of targets) {
    const state = evidence.targets.find((candidate) => candidate.key === target.key)!;
    const hidden = target.hiddenOn === viewport;
    expect(state.rendered).toBe(!hidden);
    expect(state.animationName).toBe(hidden ? target.name : 'none');
    const events = evidence.events.filter((event: any) => event.key === target.key);
    if (hidden) {
      expect(events).toEqual([]);
      continue;
    }
    expect(events.map((event: any) => event.phase)).toEqual(['animationstart', 'animationend']);
    expect(events.every((event: any) => event.isTrusted)).toBe(true);
    expect(events[0].animationName).toBe(target.name);
    expect(parseFloat(events[0].duration)).toBeCloseTo(target.duration, 5);
    expect(parseFloat(events[0].delay)).toBeCloseTo(target.delay, 5);
    expect(events[1].elapsedTime).toBeCloseTo(target.duration, 5);
  }
  const finalStyles = await page.evaluate(() => ({
    staticMenu: document.querySelector<HTMLElement>('.static-menu')!.style.opacity,
    logo: document.querySelector<HTMLElement>('.name-logo')!.style.visibility,
    typing: document.querySelector<HTMLElement>('#typing-container')!.style.transform,
    socials: document.querySelector<HTMLElement>('#socials-list')!.style.opacity,
    mobile: document.querySelector<HTMLElement>('.static-menu-mobile')!.style.opacity,
    left: document.querySelector<HTMLElement>('.double-view-left')!.style.transform,
    right: document.querySelector<HTMLElement>('.double-view-right')!.style.transform,
    header: document.querySelector<HTMLElement>('#about-section-header')!.style.visibility,
    spacer: document.querySelector<HTMLElement>('#about-header-spacer')!.style.opacity,
    subtitle: document.querySelector<HTMLElement>('#sub-text')!.style.visibility,
  }));
  expect(finalStyles).toEqual({
    staticMenu: viewport === 'mobile' ? '' : '1',
    logo: 'visible',
    typing: 'translateX(0px)',
    socials: viewport === 'mobile' ? '' : '1',
    mobile: viewport === 'desktop' ? '' : '1',
    left: 'translateX(0px)', right: 'translateX(0px)', header: 'visible', spacer: '1', subtitle: 'visible',
  });
});

test('AOS, smooth-scroll, carousel, tilt, rail fades and initialization order use real rendered inputs', async ({ page }) => {
  await page.addInitScript(() => { Math.random = () => 0; });
  await page.goto(`${origin}/home/`);
  await waitForHome(page);
  await expect(page.locator('.jobs-section-container')).toHaveClass(/aos-init/);
  expect(await page.locator('#featured-track .fc-card').count()).toBe(8);
  expect(await page.locator('#blog-scroll-track .blog-card').count()).toBe(10);
  expect(await page.evaluate(() => (window as any).__homeFixtureRailBefore === document.getElementById('blog-scroll-track')!.innerHTML)).toBe(true);
  expect(await page.evaluate(() => ({
    featured: 'FEATURED_PROJECTS' in window,
    posts: 'BLOG_POSTS' in window,
  }))).toEqual({ featured: false, posts: false });

  const names = await page.evaluate(() => (window as any).__homeFixtureEvents.map((event: any) => event.name));
  expect(names.slice(0, 8)).toEqual([
    'aos', 'smooth-register', 'general-tilt-register', 'jobs', 'carousel', 'typing',
    'rail-register', 'rail-tilt',
  ]);
  expect(names.filter((name: string) => name === 'general-tilt')).toHaveLength(1);
  expect(await page.evaluate(() => (window as any).__homeFixtureEvents.find((event: any) => event.name === 'carousel')))
    .toEqual({ name: 'carousel', options: { isSubpage: false } });
  expect(await page.locator('.card').evaluateAll((cards) => cards.every((card: any) => Boolean(card.vanillaTilt)))).toBe(true);
  expect(await page.locator('.blog-card').evaluateAll((cards) => cards.every((card: any) => Boolean(card.vanillaTilt)))).toBe(true);

  for (const [hash, offset] of [
    ['#about', 40], ['#jobs-header-static', 40], ['#project-header-static', 60],
    ['#blog-header-static', 60], ['#contact', 80],
  ] as const) {
    const expected = await page.evaluate(({ selector, offsetValue }) => {
      const top = window.scrollY + document.querySelector(selector)!.getBoundingClientRect().top;
      return {
        scrollTop: top - offsetValue,
        duration: Math.min(1000, Math.max(300, 100 * Math.log(Math.abs(top - window.scrollY)))),
      };
    }, { selector: hash, offsetValue: offset });
    const anchor = hash === '#blog-header-static'
      ? page.locator('.static-menu .blog-page-link')
      : page.locator(`.static-menu a[href="${hash}"]`);
    if (hash === '#blog-header-static') {
      await anchor.evaluate((element) => {
        element.classList.remove('blog-page-link');
        element.setAttribute('href', '#blog-header-static');
        (element as HTMLElement).click();
      });
    } else {
      await anchor.evaluate((element) => (element as HTMLElement).click());
    }
    const call = await page.evaluate(() => (window as any).__homeFixtureEvents.filter((event: any) => event.name === 'smooth-scroll').at(-1));
    expect(call.easing).toBe('easeInOutQuad');
    expect(call.duration).toBeCloseTo(expected.duration, 5);
    expect(call.properties.scrollTop).toBeCloseTo(expected.scrollTop, 5);
  }

  const fades = async () => page.evaluate(() => ({
    left: document.querySelector<HTMLElement>('.blog-scroll-fade-left')!.style.opacity,
    right: document.querySelector<HTMLElement>('.blog-scroll-fade-right')!.style.opacity,
  }));
  expect(await fades()).toEqual({ left: '0', right: '1' });
  await page.locator('#blog-scroll-track').evaluate((track) => {
    track.scrollLeft = 6;
    track.dispatchEvent(new Event('scroll'));
  });
  expect(await fades()).toEqual({ left: '1', right: '1' });
  await page.locator('#blog-scroll-track').evaluate((track) => {
    track.scrollLeft = track.scrollWidth - track.clientWidth;
    track.dispatchEvent(new Event('scroll'));
  });
  expect(await fades()).toEqual({ left: '1', right: '0' });
  await page.locator('#blog-scroll-track').evaluate((track) => { track.scrollLeft = 4; });
  await page.evaluate(() => window.dispatchEvent(new Event('resize')));
  expect(await fades()).toEqual({ left: '0', right: '1' });

  await page.goto(`${origin}/no-tilt/`);
  await waitForHome(page);
  await expect(page.locator('html')).toHaveAttribute('data-no-tilt', '');
  expect(await page.locator('.card').evaluateAll((cards) => cards.every((card: any) => !card.vanillaTilt))).toBe(true);
  expect(await page.locator('.blog-card').evaluateAll((cards) => cards.every((card: any) => !card.vanillaTilt))).toBe(true);
});

test('Calendly, mailto, JSON-island and null-owner contracts remain explicit', async ({ page }) => {
  await page.addInitScript(() => {
    Math.random = () => 0;
    (window as any).Calendly = {
      calls: [] as unknown[],
      initPopupWidget(value: unknown) { this.calls.push(value); },
    };
  });
  await page.goto(`${origin}/home/`);
  await waitForHome(page);
  const calendly = page.locator('.calendly-link');
  expect(await calendly.count()).toBe(4);
  expect(await calendly.evaluateAll((links) => links.map((link) => ({
    href: link.getAttribute('href'), target: link.getAttribute('target'), rel: link.getAttribute('rel'),
  })))).toEqual(Array(4).fill({ href: '#', target: null, rel: null }));
  await calendly.evaluateAll((links) => links.forEach((link) => (link as HTMLElement).click()));
  expect(await page.evaluate(() => (window as any).Calendly.calls.length)).toBe(4);
  expect(await page.locator('a[href^="mailto:"]').evaluateAll((links) => links.every((link) =>
    link.getAttribute('target') === '_blank' && link.getAttribute('rel') === 'noopener noreferrer',
  ))).toBe(true);

  const island = await page.locator('#masthead-sequences').textContent();
  const parsed = JSON.parse(island!);
  expect(parsed).toHaveLength(9);
  expect(parsed[0][0]).toEqual({ action: 'type', text: "Hi,\nI'm Dawson,\nweb developer." });
  expect(island).not.toContain('callback');

  await page.goto(`${origin}/null/home/`);
  await expect(page.locator('#typing-image')).toHaveCount(0);
  await expect(page.locator('.about-header')).toHaveCount(0);
  await expect(page.locator('.skills-section-header', { hasText: 'Web' })).toHaveCount(0);
  await expect(page.locator('#sub-text')).toHaveText('iOS and visionOS\u00a0|\u00a0ML and RL');
  await expect(page.locator('#contact-header-wrapper > *')).toHaveCount(0);
  await expect(page.locator('.contact-image')).toHaveCount(0);
  expect(await page.locator('#jobs-menu-list li').evaluateAll((items) =>
    items.map((item) => item.getAttribute('data-job')),
  )).toEqual(['job-2', 'job-3', 'job-4']);
  await expect(page.locator('#job-2 .job-title')).toHaveText('Johns Hopkins University');
  await expect(page.locator('#job-3 .job-dates')).toHaveCount(0);
  await expect(page.locator('#job-4 .job-bullets')).toHaveCount(0);
});

test('unknown and escaping paths are contained', async ({ request }) => {
  expect((await request.get(`${origin}/missing/`)).status()).toBe(404);
  expect((await request.get(`${origin}/%2e%2e/%2e%2e/etc/passwd`)).status()).toBe(404);
  expect((await request.get(`${origin}/old/%2e%2e/package.json`)).status()).toBe(404);
});
