// S1-04: the ported registry must equal the legacy source of truth.
//
// The legacy registry is a browser IIFE, so it is evaluated in a vm context with the
// handful of DOM/host globals it touches stubbed out. Objects built inside that
// context carry the vm realm's prototypes, so everything read back out goes through
// structuredClone before it meets deepStrictEqual.
//
// Run: node --test tests/unit/theme-registry.test.ts

import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it } from 'node:test';
import { runInNewContext } from 'node:vm';

import { oldDir } from '../../harness/baseline.ts';
import { THEMES, THEME_IDS, assertRegistry } from '../../src/themes/registry.ts';
import type { LazyLayout, Profile, RoleProfile, SkinTheme, StructuralTheme, Theme } from '../../src/themes/types.ts';

const PICKER_ORDER = [
  'default',
  'brutalist',
  'marquee',
  'blueprint',
  'field-notes',
  'doodle',
  'grid',
  'miami-deco',
  'bauhaus',
  'chinoiserie',
  'gallery',
  'banknote',
  'neo-pop',
  'broadsheet',
  'studio',
  'wheatpaste',
];

const INACTIVE = ['space', 'vapor', 'wanted', 'constructivist'];

const baseColors = { text: '#000000', bg: '#ffffff', primary: '#000000', secondary: '#eeeeee', accent: '#000000' };

const legacyFile = resolve(oldDir(), 'js/theme-bootstrap.js');
assert.ok(existsSync(legacyFile), `legacy theme-bootstrap.js not found at ${legacyFile}`);

type LegacyEntry = Record<string, unknown> & { id: string; label: string };

function loadLegacy(): { registry: Record<string, LegacyEntry>; order: string[] } {
  const noop = () => {};
  const sandbox: Record<string, unknown> = {
    document: {
      documentElement: { setAttribute: noop, style: { setProperty: noop } },
      head: { appendChild: noop },
      createElement: () => ({ setAttribute: noop }),
    },
    performance: { getEntriesByType: () => [] },
    sessionStorage: { getItem: () => null, setItem: noop, removeItem: noop },
    location: { search: '' },
  };
  sandbox.window = sandbox;
  runInNewContext(readFileSync(legacyFile, 'utf8'), sandbox, { filename: legacyFile });

  return {
    registry: structuredClone(sandbox.__THEME_REGISTRY) as Record<string, LegacyEntry>,
    order: structuredClone(sandbox.__THEME_ORDER) as string[],
  };
}

const legacy = loadLegacy();
const ported = new Map(THEMES.map((t) => [t.id, t]));

describe('THEME_IDS', () => {
  it('is the execution contract order', () => {
    assert.deepStrictEqual(THEME_IDS, PICKER_ORDER);
  });
});

describe('parity with js/theme-bootstrap.js', () => {
  it('legacy ORDER equals THEME_IDS', () => {
    assert.deepStrictEqual(legacy.order, THEME_IDS);
  });

  it('legacy REGISTRY keys equal the ORDER set', () => {
    assert.deepStrictEqual(Object.keys(legacy.registry).sort(), [...legacy.order].sort());
  });

  for (const id of PICKER_ORDER) {
    it(`${id} carries the baseline values`, () => {
      const entry = legacy.registry[id];
      assert.ok(entry, `legacy REGISTRY has no "${id}"`);
      const { label, ...rest } = entry;
      assert.equal(typeof label, 'string', `legacy "${id}" should still carry a label (it moves to prose)`);
      assert.deepStrictEqual(ported.get(id), { kind: 'skin', ...rest });
    });
  }

  it('the four retired skins are registered nowhere', () => {
    for (const id of INACTIVE) {
      assert.equal(THEME_IDS.includes(id), false, `${id} is in THEME_IDS`);
      assert.equal(Object.hasOwn(legacy.registry, id), false, `${id} is still live in the legacy REGISTRY`);
    }
  });
});

describe('field presence counts', () => {
  it('matches the spec', () => {
    const expected = { css: 15, flags: 14, tokens: 15, fonts: 14, random: 3, typing: 8, typingDelete: 1 };
    for (const [field, count] of Object.entries(expected)) {
      const present = THEMES.filter((t) => field in t);
      assert.equal(present.length, count, `${field}: ${present.map((t) => t.id).join(',')}`);
    }
  });
});

describe('assertRegistry', () => {
  // Spread rather than structuredClone: layouts hold functions.
  const skin = (over: Partial<SkinTheme>): SkinTheme => ({ ...(THEMES[0] as SkinTheme), ...over });
  const structural = (over: Partial<StructuralTheme>): StructuralTheme => ({
    kind: 'structural',
    id: 'cream',
    polarity: 'light',
    colors: baseColors,
    layouts: {},
    ...over,
  });

  it('accepts the real registry', () => {
    assert.doesNotThrow(() => assertRegistry(THEMES));
  });

  it('rejects an empty registry', () => {
    assert.throws(() => assertRegistry([]), /THEMES\[0\]/);
  });

  it('rejects a registry that does not start with default', () => {
    assert.throws(() => assertRegistry([skin({ id: 'brutalist' })]), /THEMES\[0\]/);
  });

  it('rejects a default that carries css, empty string included', () => {
    assert.throws(() => assertRegistry([skin({ css: '/css/themes/default.css' })]), /no css, flags, tokens or fonts/);
    assert.throws(() => assertRegistry([skin({ css: '' })]), /no css, flags, tokens or fonts/);
  });

  it('rejects duplicate ids', () => {
    assert.throws(() => assertRegistry([THEMES[0], skin({ id: 'dup' }), skin({ id: 'dup' })]), /duplicate id "dup"/);
  });

  it('rejects a reserved id', () => {
    assert.throws(() => assertRegistry([THEMES[0], skin({ id: 'blog' })]), /reserved id "blog"/);
    assert.throws(() => assertRegistry([THEMES[0], skin({ id: 'lexchat' })]), /reserved id "lexchat"/);
  });

  it('rejects an id that is not a clean URL segment', () => {
    assert.throws(() => assertRegistry([THEMES[0], skin({ id: 'Blog' })]), /id "Blog" must be lowercase/);
    assert.throws(() => assertRegistry([THEMES[0], skin({ id: 'a/b' })]), /id "a\/b" must be lowercase/);
    assert.throws(() => assertRegistry([THEMES[0], skin({ id: '' })]), /must be lowercase/);
  });

  it('rejects a structural theme with no usable layout', () => {
    assert.throws(() => assertRegistry([THEMES[0], structural({})]), /structural theme "cream" owns no layouts/);
    assert.throws(
      () => assertRegistry([THEMES[0], structural({ layouts: { home: undefined } })]),
      /structural theme "cream" owns no layouts/,
    );
  });
});

// ---- Type-level checks (enforced by `tsc --noEmit`, not at runtime) ----------
const stubLayout: LazyLayout = () => Promise.resolve({ default: {} as never });
const role = { l: [0, 1], hueT: 0 } satisfies RoleProfile;

({ home: stubLayout, blog: stubLayout, post: stubLayout }) satisfies StructuralTheme['layouts'];
// @ts-expect-error a theme never owns the privacy page
({ privacy: stubLayout }) satisfies StructuralTheme['layouts'];
// @ts-expect-error a theme never owns the 404 page
({ notFound: stubLayout }) satisfies StructuralTheme['layouts'];
// @ts-expect-error retired page ids are not ownable layout keys
({ lexchat: stubLayout }) satisfies StructuralTheme['layouts'];

({
  kind: 'skin',
  id: 'x',
  polarity: 'light',
  colors: baseColors,
  // @ts-expect-error labels live in prose.yaml, not the registry
  label: 'X',
}) satisfies Theme;

({
  kind: 'skin',
  id: 'y',
  polarity: 'light',
  colors: baseColors,
  // @ts-expect-error array order is picker order; there is no ORDER field
  ORDER: ['y'],
}) satisfies Theme;

({
  sat: [0, 1],
  // @ts-expect-error a Profile has exactly five roles: text, bg, primary, secondary, accent
  roles: [role, role, role, role],
}) satisfies Profile;

({
  sat: [0, 1],
  roles: [
    // @ts-expect-error hueT is a number, not a string
    { l: [0, 1], hueT: '1' },
    role,
    role,
    role,
    role,
  ],
}) satisfies Profile;

({
  sat: [0, 1],
  roles: [
    // @ts-expect-error l is a [min, max] tuple, not a single number
    { l: 0.5, hueT: 0 },
    role,
    role,
    role,
    role,
  ],
}) satisfies Profile;
