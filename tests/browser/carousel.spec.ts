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
const fixtureSource = resolve(repoRoot, 'tests', 'fixtures', 'carousel');
const oldRoot = oldDir();

let server: Server | undefined;
let origin = '';
let ownedRoot = '';
let buildRoot = '';
let mutatedBuildRoot = '';
let oldMutatedRoot = '';

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

function inheritedTargetProse(source: string): string {
  const current = [
    '      - label: { xs: View on HuggingFace }',
    '        href: https://huggingface.co/dawsonamf',
    '        external: true',
  ].join('\n');
  const mutation = [
    '      - label: { xs: null }',
    '        href: https://huggingface.co/dawsonamf',
    '        external: true',
    '      - label: { xs: Inherited target }',
    '        href: /lexchat/',
  ].join('\n');
  const changed = source.replace(current, mutation);
  if (changed === source) throw new Error('inherited CTA prose mutation did not apply');
  return changed;
}

function buildFixture(name: string, mutateProse = false): string {
  const projectRoot = resolve(ownedRoot, name);
  const sourceRoot = resolve(projectRoot, 'src');
  cpSync(resolve(repoRoot, 'src'), sourceRoot, { recursive: true });
  rmSync(resolve(sourceRoot, 'pages'), { recursive: true, force: true });
  mkdirSync(resolve(sourceRoot, 'pages'), { recursive: true });
  mkdirSync(resolve(sourceRoot, 'fixture'), { recursive: true });

  const page = readFileSync(resolve(fixtureSource, 'Page.astro'), 'utf8')
    .replaceAll('../../../src/', '../');
  writeFileSync(resolve(sourceRoot, 'fixture', 'Page.astro'), page);
  const route = readFileSync(resolve(fixtureSource, 'src', 'pages', '[variant].astro'), 'utf8')
    .replace('../../Page.astro', '../fixture/Page.astro');
  writeFileSync(resolve(sourceRoot, 'pages', '[variant].astro'), route);
  cpSync(resolve(fixtureSource, 'astro.config.mjs'), resolve(projectRoot, 'astro.config.mjs'));
  cpSync(resolve(repoRoot, 'public'), resolve(projectRoot, 'public'), { recursive: true });

  if (mutateProse) {
    const prosePath = resolve(sourceRoot, 'content', 'prose.yaml');
    writeFileSync(prosePath, inheritedTargetProse(readFileSync(prosePath, 'utf8')));
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
    throw new Error(`Astro carousel fixture build failed (${run.status}):\n${run.stdout}\n${run.stderr}`);
  }
  return dist;
}

function buildOldMutation(): string {
  const root = resolve(ownedRoot, 'old-mutated');
  const jsRoot = resolve(root, 'js');
  mkdirSync(jsRoot, { recursive: true });

  const oldData = readFileSync(resolve(oldRoot, 'js', 'blog-data.js'), 'utf8');
  const current = [
    '    ctaLabel: "View on HuggingFace",',
    '    external: true,',
  ].join('\n');
  const mutation = [
    '    ctaLabel: null,',
    '    external: true,',
    '    url2: "/lexchat/",',
    '    ctaLabel2: "Inherited target",',
  ].join('\n');
  const changed = oldData.replace(current, mutation);
  if (changed === oldData) throw new Error('OLD inherited CTA mutation did not apply');
  writeFileSync(resolve(jsRoot, 'blog-data.js'), changed);
  cpSync(resolve(oldRoot, 'js', 'featured-carousel.js'), resolve(jsRoot, 'featured-carousel.js'));
  writeFileSync(resolve(root, 'index.html'), `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OLD mutated carousel</title>
</head>
<body>
  <section class="featured-carousel-section" id="featured-carousel">
    <div class="featured-carousel-container">
      <div class="featured-carousel-fade featured-carousel-fade-left"></div>
      <div class="featured-carousel-track" id="featured-track"></div>
      <div class="featured-carousel-fade featured-carousel-fade-right"></div>
    </div>
    <div class="featured-carousel-dots" id="featured-dots"></div>
  </section>
  <script src="js/blog-data.js"></script>
  <script src="js/featured-carousel.js"></script>
  <script>window.__styleAllowsTilt = () => false; initFeaturedCarousel({ isSubpage: false });</script>
</body>
</html>
`);
  return root;
}

function contained(root: string, candidate: string): boolean {
  const rel = relative(root, candidate);
  return rel === '' || (!rel.startsWith('..' + sep) && rel !== '..' && !isAbsolute(rel));
}

function resolveRequest(pathname: string): string | undefined {
  let root = buildRoot;
  let requestPath = pathname.slice(1);
  if (pathname.startsWith('/old-mutated/')) {
    root = oldMutatedRoot;
    requestPath = pathname.slice('/old-mutated/'.length);
  } else if (pathname.startsWith('/old/')) {
    root = oldRoot;
    requestPath = pathname.slice('/old/'.length);
  } else if (pathname.startsWith('/mutated/')) {
    root = mutatedBuildRoot;
    requestPath = pathname.slice('/mutated/'.length);
  }

  let decoded: string;
  try {
    decoded = decodeURIComponent(requestPath);
  } catch {
    return undefined;
  }
  if (decoded.includes('\0') || !root) return undefined;
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
  ownedRoot = mkdtempSync(join(scratchBase, `carousel-w${workerInfo.workerIndex}-`));

  try {
    buildRoot = buildFixture('default');
    if (workerInfo.project.name === 'capture') {
      mutatedBuildRoot = buildFixture('mutated', true);
      oldMutatedRoot = buildOldMutation();
    }
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
    if (!address || typeof address === 'string') throw new Error('carousel fixture did not bind TCP');
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

async function expectRequestedViewport(page: Page): Promise<void> {
  expect(await page.evaluate(() => window.innerWidth)).toBe(page.viewportSize()!.width);
}

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

async function waitForCarousel(page: Page): Promise<void> {
  await page.waitForFunction(() => (
    document.querySelectorAll('#featured-track > .fc-card').length === 8
      && document.querySelectorAll('#featured-dots > .fc-dot').length === 8
  ));
}

async function carouselSnapshot(page: Page): Promise<string> {
  return page.evaluate(() => {
    const source = document.getElementById('featured-carousel');
    if (!source) return '';
    const clone = source.cloneNode(true) as HTMLElement;
    clone.querySelectorAll('.js-tilt-glare').forEach((node) => node.remove());
    const comments: Comment[] = [];
    const walker = document.createTreeWalker(clone, NodeFilter.SHOW_COMMENT);
    while (walker.nextNode()) comments.push(walker.currentNode as Comment);
    comments.forEach((comment) => comment.remove());

    const normalizeUrl = (value: string) => value
      .replace(/^\.\.\/resources\//, '/resources/')
      .replace(/^resources\//, '/resources/')
      .replace(/^\.\.\/blog\/post\.html\?id=([^#&]+)$/, '/blog/$1/')
      .replace(/^blog\/post\.html\?id=([^#&]+)$/, '/blog/$1/')
      .replace(/^\/embedded-swift-agent\/$/, '/subsites/dawson/embedded-swift-agent/');

    for (const element of [clone, ...clone.querySelectorAll<HTMLElement>('*')]) {
      if (element.matches('.featured-carousel-fade, .fc-card-image, .fc-card-image *')) {
        element.removeAttribute('style');
      }
      for (const name of ['href', 'src']) {
        const value = element.getAttribute(name);
        if (!value) continue;
        const lexchatCta = name === 'href'
          && element.closest('.fc-card')?.querySelector('.fc-card-title')?.textContent?.trim() === 'LexChat'
          && value === '/lexchat/';
        element.setAttribute(
          name,
          lexchatCta ? 'https://huggingface.co/spaces/dawsonamf/lexchat' : normalizeUrl(value),
        );
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
  });
}

function styleFromRawHtml(source: string): string {
  const encoded = source.match(/<html\b[^>]*\bstyle="([^"]*)"/)?.[1];
  assertRaw(encoded !== undefined, 'raw HTML has an html style attribute');
  return encoded
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&amp;', '&');
}

function assertRaw(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

test('@capture: raw HTML owns cards, dots, ticker/prose and inherited CTA output', async ({ page, request }) => {
  const carouselRoutes = [
    '/home/', '/blog/', '/marquee-home-static/', '/doodle-blog-static/',
  ];
  for (const route of carouselRoutes) {
    const response = await request.get(origin + route);
    expect(response.status(), route).toBe(200);
    const source = await response.text();
    expect((source.match(/class="fc-card"/g) ?? []).length, route).toBe(8);
    expect((source.match(/class="fc-dot(?: active)?"/g) ?? []).length, route).toBe(8);
    expect((source.match(/aria-label="Go to slide \d"/g) ?? []).length, route).toBe(8);
    expect((source.match(/<br><br>/g) ?? []).length, route).toBe(7);
    expect(source, route).not.toContain('data-tech');
    expect(source, route).not.toContain('data-slide-label');
    expect(source, route).toContain('fc-style-floating');
    const style = styleFromRawHtml(source);
    expect(style, route).toContain('--ticker-run:"');
    expect(style, route).toContain('--ticker-dur:87s;');
  }

  const homeRaw = await (await request.get(`${origin}/home/`)).text();
  const blogRaw = await (await request.get(`${origin}/blog/`)).text();
  expect(homeRaw.indexOf('project-section-wrapper')).toBeLessThan(homeRaw.indexOf('featured-carousel-section'));
  expect(blogRaw.indexOf('selected-works-header')).toBeLessThan(blogRaw.indexOf('featured-carousel-section'));
  const rawTitles = [...homeRaw.matchAll(/<h3 class="fc-card-title">([^<]+)<\/h3>/g)].map((match) => match[1]);
  expect(rawTitles).toEqual([
    'Gemma 4 MoE Heretic-ARA', 'Embedded Swift Agent', 'Silicon Fly', 'Helm',
    'Toolbelt', 'Amino Amigo', 'LexChat', 'Deep RL',
  ]);
  const deepRl = homeRaw.slice(homeRaw.indexOf('>Deep RL</h3>'), homeRaw.indexOf('</div></div>', homeRaw.indexOf('>Deep RL</h3>')));
  expect(deepRl).not.toContain('fc-card-ctas');
  const lexchat = homeRaw.slice(homeRaw.indexOf('>LexChat</h3>'), homeRaw.indexOf('</div></div>', homeRaw.indexOf('>LexChat</h3>')));
  expect(lexchat).toContain('href="https://huggingface.co/spaces/dawsonamf/lexchat"');
  expect(lexchat).toContain('target="_blank" rel="noopener noreferrer"');

  const marqueeCarousel = styleFromRawHtml(await (await request.get(`${origin}/marquee-home-static/`)).text());
  expect(marqueeCarousel).toContain('--prose-ticker:"');
  expect(marqueeCarousel).toContain('--ticker-run:"');
  const doodleCarousel = styleFromRawHtml(await (await request.get(`${origin}/doodle-blog-static/`)).text());
  expect(doodleCarousel).toContain('--prose-currently-here:"currently here ✓";');
  expect(doodleCarousel).toContain('--ticker-run:"');
  const marqueeNoCarousel = styleFromRawHtml(await (await request.get(`${origin}/marquee-noncarousel/`)).text());
  expect(marqueeNoCarousel).toContain('--prose-ticker:"');
  expect(marqueeNoCarousel).not.toContain('--ticker-run:');
  const doodleNoCarousel = styleFromRawHtml(await (await request.get(`${origin}/doodle-noncarousel/`)).text());
  expect(doodleNoCarousel).toContain('--prose-currently-here:"currently here ✓";');
  expect(doodleNoCarousel).not.toContain('--ticker-run:');

  await page.goto(`${origin}/old-mutated/index.html`);
  await waitForCarousel(page);
  const oldMutation = await carouselSnapshot(page);
  await page.goto(`${origin}/mutated/home/`);
  await waitForCarousel(page);
  const firstCard = page.locator('#featured-track > .fc-card').first();
  await expect(firstCard.locator('.fc-card-ctas > a')).toHaveCount(1);
  await expect(firstCard.locator('.fc-card-cta')).toHaveText('Inherited target');
  await expect(firstCard.locator('.fc-card-cta')).toHaveAttribute('target', '_blank');
  await expect(firstCard.locator('.fc-card-cta')).toHaveAttribute('rel', 'noopener noreferrer');
  expect(await carouselSnapshot(page)).toBe(oldMutation);
});

for (const context of ['home', 'blog'] as const) {
  test(`${context} owned carousel DOM matches the real immutable OLD renderer`, async ({ page }) => {
    await routeLegacyVendors(page);
    const oldPath = context === 'home' ? '/old/index.html' : '/old/blog/index.html';
    await page.goto(origin + oldPath);
    await waitForCarousel(page);
    const old = await carouselSnapshot(page);

    await page.goto(`${origin}/${context}/`);
    await waitForCarousel(page);
    await expectRequestedViewport(page);
    expect(await carouselSnapshot(page)).toBe(old);
    await expect(page.locator('#featured-track > .fc-card')).toHaveCount(8);
    await expect(page.locator('#featured-dots > .fc-dot')).toHaveCount(8);

    const embedded = page.locator('.fc-card', { hasText: 'Embedded Swift Agent' });
    await expect(embedded.locator('.fc-card-cta').first()).not.toHaveAttribute('target', '_blank');
    await expect(embedded.locator('.fc-card-cta').nth(1)).toHaveAttribute('target', '_blank');
    const fly = page.locator('.fc-card', { hasText: 'Silicon Fly' });
    await expect(fly.locator('.fc-card-cta').first()).not.toHaveAttribute('target', '_blank');
    await expect(fly.locator('.fc-card-cta').nth(1)).toHaveAttribute('target', '_blank');
    await expect(page.locator('.fc-card', { hasText: 'Deep RL' }).locator('.fc-card-ctas')).toHaveCount(0);

    if (context === 'home') {
      await expect(page.locator('#project-header-static + .project-section-wrapper #featured-carousel')).toHaveCount(1);
      await expect(page.locator('.project-section-wrapper + .section-spacer')).toHaveCount(1);
    } else {
      await expect(page.locator('#selected-works-header + #featured-carousel + .section-spacer')).toHaveCount(1);
    }
  });
}

async function centeredDelta(page: Page, index: number): Promise<number> {
  return page.locator('#featured-track').evaluate((track, cardIndex) => {
    const card = track.querySelectorAll<HTMLElement>('.fc-card')[cardIndex]!;
    const trackRect = track.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    return Math.abs((cardRect.left + cardRect.width / 2) - (trackRect.left + trackRect.width / 2));
  }, index);
}

async function clickAndCenter(page: Page, index: number): Promise<void> {
  await page.locator('.fc-dot').nth(index).click();
  await expect.poll(() => centeredDelta(page, index)).toBeLessThan(2);
  await expect(page.locator('.fc-dot').nth(index)).toHaveClass(/active/);
  let previous = Number.NaN;
  let steadyReads = 0;
  await expect.poll(async () => {
    const current = await page.locator('#featured-track').evaluate((track) => track.scrollLeft);
    steadyReads = Math.abs(current - previous) < 0.1 ? steadyReads + 1 : 0;
    previous = current;
    return steadyReads;
  }, { intervals: [50, 50, 50, 50, 50, 50] }).toBeGreaterThanOrEqual(2);
}

async function assertResponsiveGeometry(page: Page, mobile: boolean): Promise<void> {
  const geometry = await page.locator('.fc-card').first().evaluate((card) => {
    const image = card.querySelector<HTMLElement>('.fc-card-image')!;
    return {
      direction: getComputedStyle(card).flexDirection,
      imageHeight: Math.round(image.getBoundingClientRect().height),
      trackScrollable: card.parentElement!.scrollWidth > card.parentElement!.clientWidth,
    };
  });
  expect(geometry.direction).toBe(mobile ? 'column' : 'row');
  expect(geometry.imageHeight).toBe(mobile ? 240 : 340);
  expect(geometry.trackScrollable).toBe(true);
}

test('trusted dot, scroll, fade and wheel behavior survives both breakpoint directions', async ({ page }) => {
  await page.goto(`${origin}/home/`);
  await waitForCarousel(page);
  await expectRequestedViewport(page);
  const startsMobile = page.viewportSize()!.width <= 1100;
  await assertResponsiveGeometry(page, startsMobile);
  await expect(page.locator('.featured-carousel-fade-left')).toHaveCSS('opacity', '0');
  await expect(page.locator('.featured-carousel-fade-right')).toHaveCSS('opacity', '1');

  await clickAndCenter(page, 2);
  expect(await page.locator('.featured-carousel-fade-left').evaluate((element) => (element as HTMLElement).style.opacity)).toBe('1');
  expect(await page.locator('.featured-carousel-fade-right').evaluate((element) => (element as HTMLElement).style.opacity)).toBe('1');

  await page.evaluate(() => {
    (window as any).__carouselScrollTrusted = [];
    document.getElementById('featured-track')!.addEventListener('scroll', (event) => {
      (window as any).__carouselScrollTrusted.push(event.isTrusted);
    });
    const track = document.getElementById('featured-track')!;
    const card = track.querySelectorAll<HTMLElement>('.fc-card')[4]!;
    const trackRect = track.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    track.scrollTo({
      left: track.scrollLeft + cardRect.left - trackRect.left + cardRect.width / 2 - track.clientWidth / 2,
      behavior: 'auto',
    });
  });
  await expect(page.locator('.fc-dot').nth(4)).toHaveClass(/active/);
  expect(await page.evaluate(() => (window as any).__carouselScrollTrusted.includes(true))).toBe(true);

  await clickAndCenter(page, 2);
  const lockedLeft = await page.locator('#featured-track').evaluate((track) => track.scrollLeft);
  await page.evaluate(() => {
    (window as any).__carouselWheelEvents = [];
    document.getElementById('featured-track')!.addEventListener('wheel', (event) => {
      (window as any).__carouselWheelEvents.push({
        trusted: event.isTrusted,
        deltaX: event.deltaX,
        deltaY: event.deltaY,
      });
    });
  });
  const trackBox = await page.locator('#featured-track').boundingBox();
  if (!trackBox) throw new Error('carousel track has no geometry');
  await page.mouse.move(trackBox.x + trackBox.width / 2, trackBox.y + trackBox.height / 2);
  await page.mouse.wheel(35, 120);
  await expect(page.locator('#featured-track')).toHaveClass(/is-vertical-wheeling/);
  await expect.poll(() => page.locator('#featured-track').evaluate((track) => track.scrollLeft)).toBeCloseTo(lockedLeft, 0);
  await expect(page.locator('#featured-track')).not.toHaveClass(/is-vertical-wheeling/, { timeout: 1_000 });

  const beforeHorizontal = await page.locator('#featured-track').evaluate((track) => track.scrollLeft);
  await page.mouse.wheel(180, 5);
  await expect.poll(() => page.locator('#featured-track').evaluate((track) => track.scrollLeft))
    .toBeGreaterThan(beforeHorizontal);
  await expect(page.locator('#featured-track')).not.toHaveClass(/is-vertical-wheeling/);
  const wheels = await page.evaluate(() => (window as any).__carouselWheelEvents);
  expect(wheels).toEqual(expect.arrayContaining([
    expect.objectContaining({ trusted: true, deltaX: 35, deltaY: 120 }),
    expect.objectContaining({ trusted: true, deltaX: 180, deltaY: 5 }),
  ]));

  await page.mouse.wheel(-10_000, 0);
  await expect.poll(() => page.locator('#featured-track').evaluate((track) => track.scrollLeft)).toBeLessThanOrEqual(5);
  await expect.poll(() => page.locator('.featured-carousel-fade-left').evaluate((element) => (element as HTMLElement).style.opacity)).toBe('0');
  await page.mouse.wheel(10_000, 0);
  await expect.poll(() => page.locator('#featured-track').evaluate((track) =>
    track.scrollWidth - track.clientWidth - track.scrollLeft,
  )).toBeLessThanOrEqual(5);
  await expect.poll(() => page.locator('.featured-carousel-fade-right').evaluate((element) => (element as HTMLElement).style.opacity)).toBe('0');

  const opposite = startsMobile ? { width: 1440, height: 900 } : { width: 390, height: 844 };
  await page.setViewportSize(opposite);
  await expectRequestedViewport(page);
  await assertResponsiveGeometry(page, !startsMobile);
  await clickAndCenter(page, 2);
  await page.setViewportSize(startsMobile ? { width: 390, height: 844 } : { width: 1440, height: 900 });
  await expectRequestedViewport(page);
  await assertResponsiveGeometry(page, startsMobile);
  await clickAndCenter(page, 2);
});

test('actual VanillaTilt honors settings and the early-return flag', async ({ page }) => {
  await page.goto(`${origin}/home/`);
  await waitForCarousel(page);
  await expectRequestedViewport(page);
  const image = page.locator('.fc-card-image').first();
  await expect.poll(() => image.evaluate((element: any) => Boolean(element.vanillaTilt))).toBe(true);
  expect(await image.evaluate((element: any) => ({
    max: element.vanillaTilt.settings.max,
    speed: element.vanillaTilt.settings.speed,
    perspective: element.vanillaTilt.settings.perspective,
    scale: element.vanillaTilt.settings.scale,
    glare: element.vanillaTilt.settings.glare,
    maxGlare: element.vanillaTilt.settings['max-glare'],
    gyroscope: element.vanillaTilt.settings.gyroscope,
  }))).toEqual({
    max: 8, speed: 6000, perspective: 1200, scale: 1,
    glare: true, maxGlare: 0.15, gyroscope: true,
  });
  await expect(image.locator('.js-tilt-glare')).toHaveCount(1);

  await page.goto(`${origin}/no-tilt/`);
  await waitForCarousel(page);
  await expect(page.locator('html')).toHaveAttribute('data-no-tilt', '');
  expect(await page.locator('.fc-card-image').evaluateAll((images: any[]) =>
    images.every((item) => !item.vanillaTilt),
  )).toBe(true);
  await expect(page.locator('.js-tilt-glare')).toHaveCount(0);
});

test('@only:desktop-1440 actual VanillaTilt responds to trusted pointer motion at both widths', async ({ page }) => {
  await page.goto(`${origin}/home/`);
  await waitForCarousel(page);
  await expectRequestedViewport(page);
  await clickAndCenter(page, 2);
  const image = page.locator('.fc-card-image').nth(2);
  await expect.poll(() => image.evaluate((element: any) => Boolean(element.vanillaTilt))).toBe(true);
  await image.evaluate((element) => {
    (window as any).__trustedCarouselPointer = false;
    element.addEventListener('mousemove', (event) => {
      if (event.isTrusted) (window as any).__trustedCarouselPointer = true;
    });
  });
  const box = await image.boundingBox();
  if (!box) throw new Error('tilt image has no geometry');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.move(box.x + 2, box.y + 2);
  await expect.poll(() => image.evaluate((element) => (element as HTMLElement).style.transform))
    .toMatch(/rotate[XY]\((?!0\.00deg)/);
  expect(await page.evaluate(() => (window as any).__trustedCarouselPointer)).toBe(true);

  await image.evaluate((element: any) => element.vanillaTilt.reset());
  await page.mouse.move(0, 0);
  await page.setViewportSize({ width: 390, height: 844 });
  await expectRequestedViewport(page);
  await clickAndCenter(page, 2);
  const mobileBox = await image.boundingBox();
  if (!mobileBox) throw new Error('tilt image has no mobile geometry');
  await page.mouse.move(mobileBox.x + mobileBox.width / 2, mobileBox.y + mobileBox.height / 2);
  await page.mouse.move(mobileBox.x + 2, mobileBox.y + 2);
  await expect.poll(() => image.evaluate((element) => (element as HTMLElement).style.transform))
    .toMatch(/rotate[XY]\((?!0\.00deg)/);
});

test('unknown and escaping fixture paths remain contained', async ({ request }) => {
  expect((await request.get(`${origin}/missing/`)).status()).toBe(404);
  expect((await request.get(`${origin}/%2e%2e/%2e%2e/etc/passwd`)).status()).toBe(404);
  expect((await request.get(`${origin}/old/%2e%2e/package.json`)).status()).toBe(404);
});
