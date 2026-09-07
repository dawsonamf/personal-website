// S1-09: the one vendor table (Spec 1 D5, §8) has to stay internally consistent, match what is
// actually committed under public/vendor/, and stay reproducible from node_modules. The CSS
// font references are checked too, because Font Awesome and Boxicons resolve their fonts by
// relative depth, which only works while the public paths keep it.
//
// Run: node --test tests/unit/vendor-map.test.ts

import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join, posix, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { describe, it } from 'node:test';

import { VENDOR_FILES } from '../../scripts/vendor-map.mjs';

type VendorRow = { npmPath?: string; publicPath: string; cdnUrl: string };

const rows: VendorRow[] = VENDOR_FILES;
const repoRoot = resolve(import.meta.dirname, '..', '..');
const npmRows = rows.filter((row) => row.npmPath);

const BOXICONS = ['/vendor/boxicons/css/boxicons.min.css', '/vendor/boxicons/fonts/boxicons.woff2'];
const EXCLUDED = /mermaid|plotly|js-yaml|marked|highlight\.min\.js/;

function publicFile(publicPath: string): string {
  return join(repoRoot, 'public', publicPath);
}

// Every file under public/vendor/, as the publicPath that serves it.
function servedVendorPaths(root: string, prefix = '/vendor'): string[] {
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? servedVendorPaths(join(root, entry.name), `${prefix}/${entry.name}`)
      : [`${prefix}/${entry.name}`],
  );
}

// The url(...) targets of a stylesheet, minus quotes, query and fragment.
function cssUrls(css: string): string[] {
  return [...css.matchAll(/url\(([^)]*)\)/g)].map((m) =>
    m[1].trim().replace(/^['"]|['"]$/g, '').split('?')[0].split('#')[0],
  );
}

describe('table shape', () => {
  it('has the 18 rows, 16 of them from npm', () => {
    assert.equal(rows.length, 18);
    assert.equal(npmRows.length, 16);
  });

  it('the two rows without an npm path are Boxicons', () => {
    assert.deepStrictEqual(
      rows.filter((row) => !row.npmPath).map((row) => row.publicPath),
      BOXICONS,
    );
  });

  it('public paths are unique origin-root paths under /vendor/', () => {
    for (const { publicPath } of rows) {
      assert.match(publicPath, /^\/vendor\/[a-z0-9.-]+\//, publicPath);
      assert.equal(publicPath.includes('..'), false, publicPath);
      assert.equal(publicPath.includes('//'), false, publicPath);
    }
    assert.equal(new Set(rows.map((row) => row.publicPath)).size, rows.length);
  });

  it('cdn urls are unique https urls whose file name is the served one', () => {
    for (const { publicPath, cdnUrl } of rows) {
      assert.ok(cdnUrl.startsWith('https://'), cdnUrl);
      // code.jquery.com is the only host that puts the pin in the file name (jquery-3.6.0.min.js);
      // the dotted version is what distinguishes it from a real part of a name like fa-solid-900.
      const served = basename(new URL(cdnUrl).pathname).replace(/-\d+(?:\.\d+)+(?=\.)/, '');
      assert.equal(basename(publicPath), served, cdnUrl);
    }
    assert.equal(new Set(rows.map((row) => row.cdnUrl)).size, rows.length);
  });

  it('npm paths are relative and name the same file', () => {
    for (const { npmPath, publicPath } of npmRows) {
      assert.equal(basename(npmPath!), basename(publicPath), npmPath);
      assert.equal(npmPath!.startsWith('/'), false, npmPath);
      assert.equal(npmPath!.includes('..'), false, npmPath);
    }
  });
});

describe('deliberate exclusions (D5/D6)', () => {
  it('vendors no mermaid, Plotly, js-yaml, marked or highlight.js runtime script', () => {
    for (const { publicPath, cdnUrl } of rows) {
      assert.doesNotMatch(publicPath, EXCLUDED);
      assert.doesNotMatch(cdnUrl, EXCLUDED);
    }
  });
});

describe('committed files under public/vendor', () => {
  it('every row is a non-empty file', () => {
    for (const { publicPath } of rows) {
      const file = publicFile(publicPath);
      assert.ok(existsSync(file), `missing ${publicPath}`);
      assert.ok(statSync(file).size > 0, `empty ${publicPath}`);
    }
  });

  it('every npm row is byte-identical to its node_modules source', () => {
    for (const { npmPath, publicPath } of npmRows) {
      const source = readFileSync(join(repoRoot, 'node_modules', npmPath!));
      assert.ok(source.equals(readFileSync(publicFile(publicPath))), `${publicPath} differs from ${npmPath}`);
    }
  });

  it('holds exactly the table, with no strays', () => {
    assert.deepStrictEqual(
      servedVendorPaths(join(repoRoot, 'public', 'vendor')).sort(),
      rows.map((row) => row.publicPath).sort(),
    );
  });
});

describe('npm run vendor is repeatable', () => {
  it('reproduces the 16 npm files byte-for-byte into a fresh directory', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'vendor-map-'));
    try {
      const run = spawnSync(process.execPath, ['scripts/vendor.mjs', tmp], { cwd: repoRoot, encoding: 'utf8' });
      assert.ifError(run.error);
      assert.equal(run.status, 0, run.stderr);
      assert.deepStrictEqual(
        servedVendorPaths(join(tmp, 'vendor')).sort(),
        npmRows.map((row) => row.publicPath).sort(),
      );
      for (const { publicPath } of npmRows) {
        const fresh = readFileSync(join(tmp, publicPath));
        assert.ok(fresh.equals(readFileSync(publicFile(publicPath))), `${publicPath} is not reproducible`);
      }
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });
});

describe('stylesheet font references resolve inside the table', () => {
  it('Font Awesome reaches its webfonts at the same relative depth', () => {
    const css = readFileSync(publicFile('/vendor/fontawesome-free/css/all.min.css'), 'utf8');
    const referenced = cssUrls(css).map((url) => posix.resolve('/vendor/fontawesome-free/css', url));
    const table = new Set(rows.map((row) => row.publicPath));
    assert.ok(referenced.length > 0, 'all.min.css referenced no fonts');
    for (const path of new Set(referenced)) {
      assert.ok(table.has(path), `all.min.css references ${path}, which is not a vendor row`);
    }
  });

  it('Boxicons reaches the woff2 the browsers pick', () => {
    const css = readFileSync(publicFile('/vendor/boxicons/css/boxicons.min.css'), 'utf8');
    assert.ok(cssUrls(css).includes('../fonts/boxicons.woff2'), 'boxicons.min.css lost its woff2 reference');

    // The five format variants are the only legitimate targets; of those only the woff2 is
    // vendored, because that is the one every supported browser picks from the src list.
    for (const url of cssUrls(css)) {
      const path = posix.resolve('/vendor/boxicons/css', url);
      assert.ok(path.startsWith('/vendor/boxicons/fonts/boxicons.'), `boxicons.min.css references ${path}`);
    }

    const font = '/vendor/boxicons/fonts/boxicons.woff2';
    assert.equal(posix.resolve('/vendor/boxicons/css', '../fonts/boxicons.woff2'), font);
    assert.ok(rows.some((row) => row.publicPath === font), `${font} is not a vendor row`);
    assert.equal(readFileSync(publicFile(font)).subarray(0, 4).toString('latin1'), 'wOF2');
  });
});
