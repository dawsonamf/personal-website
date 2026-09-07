// S1-05: masthead choreography derived from terminal lines (D36).
//
// The expected steps below are the 16 legacy sequences transcribed verbatim from
// js/script.js:124-192 (nine, default pause 1500 ms with one 1000 ms outlier) and
// blog/blog-listing.js:34-88 (seven, pause 800 ms), minus their function-valued
// `callback` steps, which stay client-side. Duplicates are kept as separate entries
// because the sequence picker weights by repetition.
//
// Run: node --test tests/unit/masthead.test.ts

import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it } from 'node:test';

import { deriveMastheadSteps } from '../../src/prose/masthead.ts';
import type { MastheadStep } from '../../src/prose/masthead.ts';

const repoRoot = resolve(import.meta.dirname, '..', '..');
// PARITY_OLD_DIR wins, matching tests/unit/theme-registry.test.ts:45.
const oldRoot = process.env.PARITY_OLD_DIR ?? repoRoot;

const type = (text: string): MastheadStep => ({ action: 'type', text });
const pause = (duration: number): MastheadStep => ({ action: 'pause', duration });
const del = (count: number): MastheadStep => ({ action: 'delete', count });

type Sequence = { page: 'home' | 'listing'; lines: string[]; pause: number; expected: MastheadStep[] };

const HOME_PREFIX = "Hi,\nI'm Dawson,\n";
const HEY_PREFIX = "Hey,\nI'm Dawson,\n";

const SEQUENCES: Sequence[] = [
  {
    page: 'home',
    lines: [
      `${HOME_PREFIX}web developer.`,
      `${HOME_PREFIX}iOS developer.`,
      `${HOME_PREFIX}ML engineer.`,
      `${HOME_PREFIX}software engineer.`,
    ],
    pause: 1500,
    expected: [
      type("Hi,\nI'm Dawson,\nweb developer."),
      pause(1500),
      del(14),
      type('iOS developer.'),
      pause(1500),
      del(14),
      type('ML engineer.'),
      pause(1500),
      del(12),
      type('software engineer.'),
    ],
  },
  {
    page: 'home',
    lines: [`${HOME_PREFIX}full stack engineer.`, `${HOME_PREFIX}software engineer.`],
    pause: 1000, // the one outlier, script.js:146
    expected: [
      type("Hi,\nI'm Dawson,\nfull stack engineer."),
      pause(1000),
      del(20),
      type('software engineer.'),
    ],
  },
  {
    page: 'home',
    lines: [`${HEY_PREFIX}software engineer.`],
    pause: 1500,
    expected: [type("Hey,\nI'm Dawson,\nsoftware engineer.")],
  },
  {
    page: 'home',
    lines: [`${HOME_PREFIX}software engineer.`],
    pause: 1500,
    expected: [type("Hi,\nI'm Dawson,\nsoftware engineer.")],
  },
  {
    page: 'home',
    lines: [`${HEY_PREFIX}builder.`, `${HEY_PREFIX}software engineer.`],
    pause: 1500,
    expected: [type("Hey,\nI'm Dawson,\nbuilder."), pause(1500), del(8), type('software engineer.')],
  },
  {
    page: 'home',
    lines: [`${HOME_PREFIX}builder.`, `${HOME_PREFIX}software engineer.`],
    pause: 1500,
    expected: [type("Hi,\nI'm Dawson,\nbuilder."), pause(1500), del(8), type('software engineer.')],
  },
  {
    page: 'home',
    lines: [`${HEY_PREFIX}builder.`, `${HEY_PREFIX}software engineer.`],
    pause: 1500,
    expected: [type("Hey,\nI'm Dawson,\nbuilder."), pause(1500), del(8), type('software engineer.')],
  },
  {
    page: 'home',
    lines: [`${HOME_PREFIX}builder.`, `${HOME_PREFIX}software engineer.`],
    pause: 1500,
    expected: [type("Hi,\nI'm Dawson,\nbuilder."), pause(1500), del(8), type('software engineer.')],
  },
  {
    page: 'home',
    lines: [`${HEY_PREFIX}agentic engineer.`, `${HEY_PREFIX}software engineer.`],
    pause: 1500,
    expected: [
      type("Hey,\nI'm Dawson,\nagentic engineer."),
      pause(1500),
      del(17),
      type('software engineer.'),
    ],
  },
  {
    page: 'listing',
    lines: ["Cool things I've built.", 'Blog.'],
    pause: 800,
    expected: [type("Cool things I've built."), pause(800), del(23), type('Blog.')],
  },
  {
    page: 'listing',
    lines: ['Things I find interesting.', 'Blog.'],
    pause: 800,
    expected: [type('Things I find interesting.'), pause(800), del(26), type('Blog.')],
  },
  {
    page: 'listing',
    lines: ['Late night rabbit holes.', 'Blog.'],
    pause: 800,
    expected: [type('Late night rabbit holes.'), pause(800), del(24), type('Blog.')],
  },
  {
    page: 'listing',
    lines: ['Rabbit holes.', 'Blog.'],
    pause: 800,
    expected: [type('Rabbit holes.'), pause(800), del(13), type('Blog.')],
  },
  {
    page: 'listing',
    lines: ["Things I've built.", 'Blog.'],
    pause: 800,
    expected: [type("Things I've built."), pause(800), del(18), type('Blog.')],
  },
  {
    page: 'listing',
    lines: ['Random projects.', 'Blog.'],
    pause: 800,
    expected: [type('Random projects.'), pause(800), del(16), type('Blog.')],
  },
  {
    page: 'listing',
    lines: ['Side quests.', 'Blog.'],
    pause: 800,
    expected: [type('Side quests.'), pause(800), del(12), type('Blog.')],
  },
];

describe('deriveMastheadSteps', () => {
  it('covers all 16 legacy sequences, duplicates included', () => {
    assert.equal(SEQUENCES.length, 16);
    assert.equal(SEQUENCES.filter((s) => s.page === 'home').length, 9);
    assert.equal(SEQUENCES.filter((s) => s.page === 'listing').length, 7);
  });

  for (const [index, sequence] of SEQUENCES.entries()) {
    it(`derives ${sequence.page} sequence ${index} from its terminal lines`, () => {
      assert.deepStrictEqual(deriveMastheadSteps(sequence.lines, sequence.pause), sequence.expected);
    });
  }

  it('emits exactly one type step for a single-line sequence', () => {
    assert.deepStrictEqual(deriveMastheadSteps(['Blog.'], 800), [type('Blog.')]);
  });

  it('throws on an empty sequence', () => {
    assert.throws(() => deriveMastheadSteps([], 800), /at least one line/);
  });

  it('deletes nothing when the next line only extends the previous one', () => {
    assert.deepStrictEqual(deriveMastheadSteps(['Blog', 'Blog.'], 800), [
      type('Blog'),
      pause(800),
      del(0),
      type('.'),
    ]);
  });
});

describe('drift guard', () => {
  // Cheap: if someone edits a sequence in the legacy source, its first typed literal
  // stops matching and this fails before the derived steps silently go stale.
  const read = (relative: string) => {
    const file = resolve(oldRoot, relative);
    assert.ok(
      existsSync(file),
      `${file} is missing; set PARITY_OLD_DIR to the baseline checkout instead of skipping this check`,
    );
    // Comment lines are dropped first: the commented-out block at js/script.js:193-202 repeats
    // a live sequence's literal, so a deleted live sequence would still look present.
    return readFileSync(file, 'utf8')
      .split('\n')
      .filter((line) => !line.trimStart().startsWith('//'))
      .join('\n');
  };

  const sources = { home: read('js/script.js'), listing: read('blog/blog-listing.js') };

  it('finds every first typed literal in the legacy source', () => {
    for (const sequence of SEQUENCES) {
      const literal = JSON.stringify(sequence.lines[0]);
      assert.ok(
        sources[sequence.page].includes(literal),
        `the legacy ${sequence.page} source no longer contains ${literal}`,
      );
    }
  });
});
