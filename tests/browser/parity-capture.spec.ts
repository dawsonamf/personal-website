import { strict as assert } from 'node:assert';
import { test } from '@playwright/test';
import type { Page, TestInfo } from '@playwright/test';
import { screenshotWithExceptionRectangles } from '../../harness/exceptions.ts';

const ANCHOR_Y = 1_200;

async function assertViewportContext(page: Page, testInfo: TestInfo): Promise<void> {
  const expected = testInfo.project.name === 'mobile-390'
    ? { width: 390, height: 844, touch: true, hover: false }
    : { width: 1440, height: 900, touch: false, hover: true };
  assert.deepEqual(page.viewportSize(), { width: expected.width, height: expected.height });
  assert.deepEqual(await page.evaluate(() => ({
    width: innerWidth,
    height: innerHeight,
    touch: navigator.maxTouchPoints > 0,
    hover: matchMedia('(hover: hover) and (pointer: fine)').matches,
  })), expected);
}

function pngSize(png: Buffer): { width: number; height: number } {
  assert.deepEqual([...png.subarray(1, 4)], [0x50, 0x4e, 0x47], 'capture is a PNG');
  return { width: png.readUInt32BE(16), height: png.readUInt32BE(20) };
}

async function captureAfterAnimationFreeze(
  page: Page,
  testInfo: TestInfo,
  options: { tailHeight: number; markerOffset?: number },
): Promise<Buffer> {
  await page.setContent(`
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
      html, body { margin: 0; }
      .before { height: ${ANCHOR_Y}px; background: #111; }
      .scene { position: relative; height: 900px; background: #f4f1e8; }
      .sticky { position: sticky; top: 18px; width: 210px; height: 64px; background: #19706d; }
      .fixed { position: fixed; top: 110px; right: 70px; width: 140px; height: 90px; background: #e8a21a; }
      .marker { position: absolute; top: ${options.markerOffset ?? 80}px; left: 90px; width: 180px; height: 120px; background: #d12d2d; }
      .masked { position: absolute; top: 240px; left: 80px; width: 170px; height: 95px; background: #7030a0; }
      .partial-masked { position: absolute; top: 360px; left: -60px; width: 170px; height: 95px; background: #3050a0; }
      .after { height: ${1_000 + options.tailHeight}px; background: #222; }
      .capture-animation { position: fixed; width: 1px; height: 1px; animation: capture 60s linear; }
      @keyframes capture { from { opacity: .8; } to { opacity: .9; } }
    </style>
    <div class="before"></div>
    <main class="scene"><div class="sticky"></div><div class="fixed"></div><div class="marker"></div><div class="masked"></div><div class="partial-masked"></div></main>
    <div class="after"></div>
    <div class="capture-animation"></div>
    <script>
      window.__captureFinishCount = 0;
      document.querySelector('.capture-animation').getAnimations()[0].addEventListener('finish', () => {
        window.__captureFinishCount += 1;
        scrollTo(0, document.documentElement.scrollHeight - innerHeight - 100);
      });
    </script>
  `);
  await assertViewportContext(page, testInfo);
  await page.evaluate((anchorY) => scrollTo(0, anchorY), ANCHOR_Y);
  assert.equal(await page.evaluate(() => scrollY), ANCHOR_Y);

  const expected = await page.screenshot({
    animations: 'allow', caret: 'hide', scale: 'css', fullPage: false,
    mask: [page.locator('.masked'), page.locator('.partial-masked')],
  });
  const masked = await page.locator('.masked').boundingBox();
  const partialMasked = await page.locator('.partial-masked').boundingBox();
  assert.ok(masked);
  assert.ok(partialMasked);
  await page.evaluate(() => {
    const captureWindow = window as typeof window & { __parityMaskRects?: Array<Record<string, number>> };
    captureWindow.__parityMaskRects = [];
    new MutationObserver((records, observer) => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (!(node instanceof HTMLElement) || !node.hasAttribute('data-parity-exception-mask')) continue;
          const box = node.getBoundingClientRect();
          captureWindow.__parityMaskRects!.push({
            left: box.left, top: box.top, right: box.right, bottom: box.bottom,
          });
        }
      }
      if (captureWindow.__parityMaskRects!.length === 2) observer.disconnect();
    }).observe(document.body, { childList: true });
  });
  const png = await screenshotWithExceptionRectangles(page, [], [
    { x: masked.x, y: masked.y + ANCHOR_Y, width: masked.width, height: masked.height },
    { x: partialMasked.x, y: partialMasked.y + ANCHOR_Y, width: partialMasked.width, height: partialMasked.height },
    // A horizontally offscreen rail exception must not expand the mobile layout viewport.
    { x: 2_000, y: ANCHOR_Y + 400, width: 220, height: 80 },
  ], false);

  assert.ok(await page.evaluate(() => (window as typeof window & { __captureFinishCount: number }).__captureFinishCount) > 0, 'fixture animation must be frozen by screenshot capture');
  assert.equal(await page.evaluate(() => scrollY), ANCHOR_Y, 'capture must restore the exact intended viewport anchor');
  assert.deepEqual(pngSize(png), page.viewportSize(), 'capture has the exact recorded viewport dimensions');
  assert.deepEqual(await page.evaluate(() => {
    const rects = (window as typeof window & { __parityMaskRects?: Array<Record<string, number>> }).__parityMaskRects ?? [];
    return rects.map((box) => Object.fromEntries(Object.entries(box).map(([name, value]) => [name, Math.round(value)])));
  }), [
    { left: 80, top: 240, right: 250, bottom: 335 },
    { left: 0, top: 360, right: 110, bottom: 455 },
  ], 'temporary masks must be clipped to the viewport and omit fully offscreen rectangles');
  assert.deepEqual(png, expected, 'capture must paint fixed, sticky, masked, and document content at the live original viewport');
  return png;
}

test('capture preserves the intended viewport through animation-freeze scroll', async ({ page }, testInfo) => {
  const oldHeight = await captureAfterAnimationFreeze(page, testInfo, { tailHeight: 0 });
  const newHeight = await captureAfterAnimationFreeze(page, testInfo, { tailHeight: 24 });
  assert.deepEqual(newHeight, oldHeight, 'downstream document height must not move the captured viewport');
});

test('capture still exposes unrelated visible layout drift', async ({ page }, testInfo) => {
  const expected = await captureAfterAnimationFreeze(page, testInfo, { tailHeight: 0 });
  const shifted = await captureAfterAnimationFreeze(page, testInfo, { tailHeight: 0, markerOffset: 92 });
  assert.notDeepEqual(shifted, expected, 'visible content movement must remain observable');
});

test('full-page capture behavior remains unchanged', async ({ page }, testInfo) => {
  await page.setContent(`
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
      html, body { margin: 0; }
      .before { height: ${ANCHOR_Y}px; background: #111; }
      .scene { height: 1200px; background: #f4f1e8; }
      .sticky { position: sticky; top: 18px; width: 210px; height: 64px; background: #19706d; }
      .fixed { position: fixed; top: 110px; right: 70px; width: 140px; height: 90px; background: #e8a21a; }
      .masked { margin: 160px 0 0 80px; width: 170px; height: 95px; background: #d12d2d; }
      .after { height: 600px; background: #222; }
    </style>
    <div class="before"></div>
    <main class="scene">
      <div class="sticky"></div>
      <div class="fixed"></div>
      <div class="masked"></div>
    </main>
    <div class="after"></div>
  `);
  await assertViewportContext(page, testInfo);
  await page.evaluate((anchorY) => scrollTo(0, anchorY), ANCHOR_Y);
  const masks = [page.locator('.masked')];
  const expectedFullPage = await page.screenshot({
    animations: 'disabled', caret: 'hide', scale: 'css', fullPage: true, mask: masks,
  });
  const fullPage = await screenshotWithExceptionRectangles(page, ['.masked'], [], true);
  assert.deepEqual(fullPage, expectedFullPage, 'full-page capture behavior must remain unchanged');
  assert.equal(await page.evaluate(() => scrollY), ANCHOR_Y);
});

test('temporary screenshot-preparation shrink cannot shorten a viewport PNG', async ({ page }, testInfo) => {
  const anchorY = 1_600;
  await page.setContent(`
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
      html, body { margin: 0; }
      .before { height: ${anchorY}px; background: #111; }
      .scene { height: 700px; background: #f4f1e8; }
      .animated-tail { background: #222; animation: tail-size 60s linear infinite; }
      @keyframes tail-size { from { height: 1000px; } to { height: 1000px; } }
    </style>
    <div class="before"></div><main class="scene"></main><div class="animated-tail"></div>
  `);
  await assertViewportContext(page, testInfo);
  await page.evaluate((y) => scrollTo(0, y), anchorY);
  assert.equal(await page.evaluate(() => scrollY), anchorY);

  await assert.rejects(
    screenshotWithExceptionRectangles(page, [], [], false),
    /screenshot preparation could not preserve the intended viewport/,
  );
  assert.equal(await page.evaluate(() => scrollY), anchorY, 'cleanup-restored document must retain its original anchor');
});
