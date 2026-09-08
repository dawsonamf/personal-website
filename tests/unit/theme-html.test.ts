// S1-10: the theme projection must reproduce the baseline byte for byte.
//
// harness/fixtures/baseline/theme-html.json is the oracle: each theme applied by the
// legacy blocking bootstrap over the served baseline, with the attributes, inline
// declarations and stylesheet links read back verbatim. The fixture predates D32's two
// typing carriers, so those are removed before the attrs comparison and asserted
// separately. Declarations are compared as an ORDERED list, which is stricter than the
// fixture README's sorted-map recipe.
//
// Run: node --test tests/unit/theme-html.test.ts

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it } from 'node:test';

import { parseDeclarations } from '../../harness/normalize.ts';
import { declarations, themeHtml } from '../../src/themes/apply.ts';
import { rampDeclarations } from '../../src/themes/ramp.ts';
import { THEMES } from '../../src/themes/registry.ts';
import { validateThemes } from '../../src/themes/validate.ts';
import type { Colors, SkinTheme, StructuralTheme, Theme } from '../../src/themes/types.ts';

const repoRoot = resolve(import.meta.dirname, '..', '..');
const srcThemes = resolve(repoRoot, 'src', 'themes');
const cyclerSource = readFileSync(resolve(repoRoot, 'public/js/theme-cycler.js'), 'utf8');

interface FixtureTheme {
  attrs: Record<string, string>;
  style: Array<[string, string]>;
  links: string[];
}
const fixture = JSON.parse(
  readFileSync(resolve(repoRoot, 'harness/fixtures/baseline/theme-html.json'), 'utf8'),
) as { themes: Record<string, FixtureTheme> };

const STEPS = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95];
const ROLES = ['text', 'bg', 'primary', 'secondary', 'accent'] as const;
/** Every ramp property name, in emission order. */
const RAMP_NAMES = ROLES.flatMap((role) => [`--${role}`, ...STEPS.map((a) => `--${role}${a}`)]);

const ATTR_ORDER = ['data-style', 'data-still', 'data-no-tilt', 'data-typing', 'data-typing-delete'];
const NEW_ATTRS = ['data-typing', 'data-typing-delete'];

function withoutTypingAttrs(attrs: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(attrs).filter(([k]) => !NEW_ATTRS.includes(k)));
}

/**
 * Every module specifier a source pulls in at RUNTIME: type-only statements are stripped
 * first, then `from '…'`, `import '…'`, `import('…')` and `require('…')` are all collected,
 * single- or double-quoted, so no import shape passes the purity checks vacuously.
 * The one copy lives here; theme-paths.test.ts has none.
 */
function runtimeImports(source: string): string[] {
  const value = source.replace(/^import\s+type\b[^;]*;/gm, '');
  const pattern = /(?:\bfrom\s*|\bimport\s*\(?\s*|\brequire\s*\(\s*)['"]([^'"]+)['"]/g;
  return [...value.matchAll(pattern)].map((m) => m[1]!);
}

const baseColors: Colors = {
  text: '#ABCDEF',
  bg: '#808080',
  primary: '#ff0000',
  secondary: '#0000ff',
  accent: '#0a0a0a',
};

describe('themeHtml() against the baseline capture', () => {
  it('the fixture covers exactly the 16 registry ids', () => {
    assert.deepEqual(Object.keys(fixture.themes).sort(), THEMES.map((t) => t.id).sort());
    assert.equal(THEMES.length, 16);
  });

  for (const theme of THEMES) {
    describe(theme.id, () => {
      const baseline = fixture.themes[theme.id]; // the key-set assertion above proves it exists

      it('projects the baseline attributes (typing carriers excluded)', () => {
        assert.deepEqual(withoutTypingAttrs(themeHtml(theme).attrs), baseline!.attrs);
      });

      it('projects the baseline declarations in order', () => {
        assert.deepEqual(parseDeclarations(themeHtml(theme).style), baseline!.style);
      });

      it('projects the baseline links in order', () => {
        assert.deepEqual(themeHtml(theme).links, baseline!.links);
      });
    });
  }

  it('default gets the ramp and nothing else', () => {
    const out = themeHtml(THEMES[0]!);
    const decls = parseDeclarations(out.style);
    assert.deepEqual(out.attrs, {});
    assert.deepEqual(out.links, []);
    assert.equal(decls.length, 100);
    assert.deepEqual(decls.map(([p]) => p), RAMP_NAMES);
    assert.equal(decls.filter(([p]) => p.startsWith('--font-')).length, 0);
  });

  it('every base role stays the registry entry raw hex', () => {
    for (const theme of THEMES) {
      const decls = new Map(parseDeclarations(themeHtml(theme).style));
      for (const role of ROLES) assert.equal(decls.get(`--${role}`), theme.colors[role]);
    }
  });
});

describe('typing carriers (D32, absent from the pre-cycler fixture)', () => {
  it('carries typing / typingDelete exactly where the registry sets them', () => {
    for (const theme of THEMES) {
      const { attrs } = themeHtml(theme);
      const skin = theme.kind === 'skin' ? theme : undefined;
      assert.equal(attrs['data-typing'], skin?.typing);
      assert.equal(attrs['data-typing-delete'], skin?.typingDelete);
    }
  });

  it('8 themes carry data-typing; marquee alone carries data-typing-delete=word', () => {
    const typing = THEMES.filter((t) => themeHtml(t).attrs['data-typing'] !== undefined);
    const deleting = THEMES.filter((t) => themeHtml(t).attrs['data-typing-delete'] !== undefined);
    assert.equal(typing.length, 8);
    assert.deepEqual(deleting.map((t) => t.id), ['marquee']);
    assert.equal(themeHtml(deleting[0]!).attrs['data-typing-delete'], 'word');
  });

  it('default carries neither', () => {
    const { attrs } = themeHtml(THEMES[0]!);
    assert.equal(attrs['data-typing'], undefined);
    assert.equal(attrs['data-typing-delete'], undefined);
  });

  it('non-default attrs are the five known names in projection order', () => {
    for (const theme of THEMES.slice(1)) {
      const keys = Object.keys(themeHtml(theme).attrs);
      assert.deepEqual(keys, ATTR_ORDER.filter((name) => keys.includes(name)));
    }
  });
});

describe('palette override', () => {
  const brutalist = THEMES.find((t) => t.id === 'brutalist')!;

  it('changes only the ramp', () => {
    const plain = themeHtml(brutalist);
    const overridden = themeHtml(brutalist, baseColors);
    assert.deepEqual(overridden.attrs, plain.attrs);
    assert.deepEqual(overridden.links, plain.links);
    const tokens = declarations(brutalist.tokens ?? {});
    assert.ok(plain.style.startsWith(tokens) && overridden.style.startsWith(tokens));
    assert.equal(overridden.style.slice(tokens.length), rampDeclarations(baseColors));
    assert.notEqual(overridden.style, plain.style);
  });

  it('keeps the given hex strings raw, mixed case included', () => {
    const decls = new Map(parseDeclarations(themeHtml(brutalist, baseColors).style));
    for (const role of ROLES) assert.equal(decls.get(`--${role}`), baseColors[role]);
    assert.equal(decls.get('--text'), '#ABCDEF');
  });

  it('computes the hand-verified steps', () => {
    const decls = new Map(parseDeclarations(rampDeclarations(baseColors)));
    assert.equal(decls.get('--bg5'), 'hsla(0,0%,50%,5%)'); // #808080, achromatic
    assert.equal(decls.get('--primary5'), 'hsla(0,100%,50%,5%)'); // #ff0000
    assert.equal(decls.get('--secondary5'), 'hsla(240,100%,50%,5%)'); // #0000ff
  });
});

describe('rampDeclarations()', () => {
  it('uses its own role order, not the caller key order', () => {
    const shuffled: Colors = {
      accent: baseColors.accent,
      secondary: baseColors.secondary,
      bg: baseColors.bg,
      primary: baseColors.primary,
      text: baseColors.text,
    };
    assert.equal(rampDeclarations(shuffled), rampDeclarations(baseColors));
  });

  it('emits 100 declarations, interleaved per role', () => {
    const decls = parseDeclarations(rampDeclarations(baseColors));
    assert.equal(decls.length, 100);
    assert.deepEqual(decls.map(([p]) => p), RAMP_NAMES);
  });

  it('is self-contained: its own source re-evaluates identically (D33)', () => {
    const inlined = new Function('return (' + rampDeclarations.toString() + ')')() as typeof rampDeclarations;
    assert.equal(inlined(baseColors), rampDeclarations(baseColors));
    assert.equal(inlined(THEMES[0]!.colors), rampDeclarations(THEMES[0]!.colors));
  });

  it('matches the generated classic-script adapter for every registry palette', () => {
    const match = cyclerSource.match(
      /\/\/ <generated:rampDeclarations source="src\/themes\/ramp\.ts">\n([\s\S]*?)\n  \/\/ <\/generated:rampDeclarations>/,
    );
    assert.ok(match, 'theme-cycler.js carries the marked generated ramp adapter');
    const generated = new Function(`${match[1]}; return rampDeclarations;`)() as typeof rampDeclarations;
    for (const theme of THEMES) {
      assert.equal(generated(theme.colors), rampDeclarations(theme.colors), theme.id);
    }
    assert.equal(generated(baseColors), rampDeclarations(baseColors));
  });
});

describe('declarations()', () => {
  it('serialises in insertion order and round-trips', () => {
    assert.equal(declarations({}), '');
    const map = { '--a': '1', '--b': "'x', y" };
    assert.equal(declarations(map), "--a:1;--b:'x', y;");
    assert.deepEqual(parseDeclarations(declarations(map)), [['--a', '1'], ['--b', "'x', y"]]);
  });
});

describe('browser purity of the projection modules', () => {
  const sources = Object.fromEntries(
    ['apply', 'ramp', 'paths', 'validate'].map((name) => [
      name,
      readFileSync(resolve(srcThemes, `${name}.ts`), 'utf8'),
    ]),
  );

  it('imports exactly the allowed runtime specifiers', () => {
    assert.deepEqual(runtimeImports(sources.ramp!), []);
    assert.deepEqual(runtimeImports(sources.apply!), ['./ramp.ts']);
    assert.deepEqual(runtimeImports(sources.paths!), ['./registry.ts']);
  });

  it('apply/ramp/paths reach no node, astro, prose, build or content module', () => {
    const banned = /^(node:|fs$|astro)|src\/(prose|build|content)|astro:content/;
    for (const name of ['apply', 'ramp', 'paths']) {
      for (const spec of runtimeImports(sources[name]!)) {
        assert.ok(!banned.test(spec), `${name}.ts must not import "${spec}"`);
      }
    }
  });

  it('validate.ts is the only one importing node:fs', () => {
    const fsImporters = Object.entries(sources)
      .filter(([, source]) => runtimeImports(source).includes('node:fs'))
      .map(([name]) => name);
    assert.deepEqual(fsImporters, ['validate']);
  });
});

describe('validateThemes()', () => {
  const defaultTheme = THEMES[0]!;

  it('passes against the real public/', () => {
    validateThemes();
    validateThemes(THEMES);
  });

  it('rejects a reserved id', () => {
    const reserved: Theme[] = [defaultTheme, { ...(THEMES[1] as SkinTheme), id: 'blog' }];
    assert.throws(() => validateThemes(reserved), /reserved id "blog"/);
  });

  it('rejects a structural theme owning no layouts', () => {
    const empty: StructuralTheme = {
      kind: 'structural',
      id: 'hollow',
      polarity: 'dark',
      colors: defaultTheme.colors,
      layouts: {},
    };
    assert.throws(() => validateThemes([defaultTheme, empty]), /owns no layouts/);
  });

  it('names every missing stylesheet', () => {
    const noAssets = resolve(repoRoot, 'tests', 'unit');
    assert.throws(
      () => validateThemes(THEMES, noAssets),
      (error: Error) => {
        assert.match(error.message, /\/css\/themes\/theme-base\.css/);
        assert.match(error.message, /\/css\/themes\/brutalist\.css/);
        assert.match(error.message, /16 stylesheet\(s\) missing/); // base + 15 skin sheets
        return true;
      },
    );
  });
});
