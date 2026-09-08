/**
 * Contract tests for the pure half of `harness/determinism.ts`: the seeded generator, the
 * index→seed search, the masthead text cleaner, the mermaid id canonicaliser and the pinned
 * masthead indices. Pure: no browser, no server, no network and no baseline *checkout* — the one
 * file read is the committed `masthead.json` fixture — so `node --test
 * tests/unit/parity-seeds.test.ts` needs no environment. `mastheadSeed`/`seedForPage` are
 * deliberately not imported here: they read the frozen checkout, and the `@capture:masthead`
 * fixture is what verifies the sequence counts they derive from.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  canonicalizeCursorFollower,
  canonicalizeGeneratedIds,
  cleanMastheadText,
  MASTHEAD_INDEX,
  MERMAID_RANDOM_STEP,
  mulberry32,
  pickIndex,
  routeSeedState,
  seedFor,
  validateRouteSeedPlan,
} from '../../harness/determinism.ts';

const take = (random: () => number, n: number): number[] => Array.from({ length: n }, () => random());

test('(a) mulberry32 is deterministic per seed and stays in [0, 1)', () => {
  for (const seed of [0, 1, 7, 12345, 0xffffffff]) {
    assert.deepEqual(take(mulberry32(seed), 12), take(mulberry32(seed), 12));
  }
  assert.notDeepEqual(take(mulberry32(0), 12), take(mulberry32(1), 12));
  for (const v of take(mulberry32(42), 5000)) {
    assert.ok(v >= 0 && v < 1, `draw ${v} outside [0, 1)`);
  }
});

test('(b) mulberry32 source is self-contained, so the page runs the same function Node does', () => {
  // The injected init script is built from this exact string; an outer identifier would resolve
  // here and throw in the page, which is the drift this evaluation rules out.
  const standalone = new Function(`return (${mulberry32.toString()});`)() as typeof mulberry32;
  for (const seed of [0, 3, 99, 2 ** 31]) {
    assert.deepEqual(take(standalone(seed), 20), take(mulberry32(seed), 20));
  }
});

test('(c) pickIndex is Math.floor(nth draw * count)', () => {
  for (const seed of [0, 5, 4001]) {
    const draws = take(mulberry32(seed), 3);
    for (const count of [7, 9]) {
      for (let draw = 1; draw <= 3; draw++) {
        assert.equal(pickIndex(seed, count, draw), Math.floor(draws[draw - 1]! * count));
      }
    }
  }
  // The draw number is load-bearing: seed 0 picks a different home sequence on draw 1 than on 2.
  assert.notEqual(pickIndex(0, 9, 1), pickIndex(0, 9, 2));
});

test('(d) seedFor returns the smallest seed that picks the index on that draw', () => {
  for (const count of [7, 9]) {
    for (const draw of [1, 2]) {
      for (let index = 0; index < count; index++) {
        const seed = seedFor(index, count, draw);
        assert.equal(pickIndex(seed, count, draw), index, `seed ${seed} misses index ${index}`);
        assert.ok(Number.isInteger(seed) && seed >= 0, `seed ${seed} is not a non-negative integer`);
        for (let smaller = 0; smaller < seed; smaller++) {
          assert.notEqual(
            pickIndex(smaller, count, draw),
            index,
            `seed ${smaller} < ${seed} also picks ${index} of ${count} on draw ${draw}`,
          );
        }
      }
    }
  }
});

test('(e) seedFor and pickIndex reject arguments that would silently pick the wrong line', () => {
  assert.throws(() => seedFor(-1, 9, 1), /index must be an integer/);
  assert.throws(() => seedFor(9, 9, 1), /index must be an integer/);
  assert.throws(() => seedFor(1.5, 9, 1), /index must be an integer/);
  assert.throws(() => seedFor(0, 0, 1), /count must be a positive integer/);
  assert.throws(() => seedFor(0, 9, 0), /draw must be a 1-based integer/);
  assert.throws(() => pickIndex(0, 9, -1), /draw must be a 1-based integer/);
});

test('(e2) route seeding advances exactly one removed Mermaid draw only for exact eligible locations', () => {
  const plan = {
    seeds: {
      '/': 7,
      '/blog/': 11,
      '/blog/toolbelt/': 1,
      '/blog/metr-doubling/': 1,
      '/brutalist/blog/metr-doubling/': 1,
    },
    phaseAdvanceLocations: ['/blog/metr-doubling/', '/brutalist/blog/metr-doubling/'],
  };
  validateRouteSeedPlan(plan);
  assert.deepEqual(routeSeedState('/blog/metr-doubling/', 99, plan), {
    location: '/blog/metr-doubling/', baseSeed: 1, effectiveSeed: (1 + MERMAID_RANDOM_STEP) | 0,
    removedLibraryDraws: 1,
  });
  for (const location of ['/', '/blog/', '/blog/toolbelt/', '/unknown/blog/metr-doubling/', '/definitely-unknown']) {
    const state = routeSeedState(location, 99, plan);
    assert.equal(state.removedLibraryDraws, 0, location);
    assert.equal(state.effectiveSeed, state.baseSeed, location);
  }
  assert.equal(routeSeedState('/definitely-unknown', 99, plan).baseSeed, 99);
  assert.equal(
    mulberry32(routeSeedState('/blog/metr-doubling/', 99, plan).effectiveSeed)(),
    take(mulberry32(1), 2)[1],
  );
});

test('(e3) route seed plan rejects duplicate, unknown and invalid calibration entries', () => {
  assert.throws(() => validateRouteSeedPlan({ seeds: { '/known': 1 }, phaseAdvanceLocations: ['/known', '/known'] }), /duplicate/);
  assert.throws(() => validateRouteSeedPlan({ seeds: { '/known': 1 }, phaseAdvanceLocations: ['/missing'] }), /not a seeded route/);
  assert.throws(() => validateRouteSeedPlan({ seeds: { '/known': 1.5 }, phaseAdvanceLocations: [] }), /integer seed/);
  assert.throws(() => validateRouteSeedPlan({ seeds: { 'relative': 1 }, phaseAdvanceLocations: [] }), /absolute location/);
});

test('(e4) routeSeedState is standalone-serializable for the browser init script', () => {
  const standalone = new Function(`return (${routeSeedState.toString()});`)() as typeof routeSeedState;
  const plan = { seeds: { '/blog/metr-doubling/': 1 }, phaseAdvanceLocations: ['/blog/metr-doubling/'] };
  assert.deepEqual(standalone('/blog/metr-doubling/', 3, plan), routeSeedState('/blog/metr-doubling/', 3, plan));
  assert.deepEqual(standalone('/unknown', 3, plan), routeSeedState('/unknown', 3, plan));
});

test('(f) canonicalizeGeneratedIds maps each mermaid epoch by order of first appearance', () => {
  const html =
    '<svg id="mermaid-1788755790541" aria-roledescription="flowchart-v2">' +
    '<style>#mermaid-1788755790541 .node rect{fill:#fff}</style>' +
    '<g id="mermaid-1788755790541-flowchart-A-0" marker-end="url(#mermaid-1788755790541_flowchart-v2-pointEnd)"/>' +
    '</svg>' +
    '<svg id="mermaid-1788755792897"><g id="mermaid-1788755792897-flowchart-B-1"/></svg>';
  const out = canonicalizeGeneratedIds(html);
  assert.ok(!/mermaid-\d/.test(out), `an epoch survived: ${out}`);
  assert.equal(
    out,
    '<svg id="mermaid-T1" aria-roledescription="flowchart-v2">' +
      '<style>#mermaid-T1 .node rect{fill:#fff}</style>' +
      '<g id="mermaid-T1-flowchart-A-0" marker-end="url(#mermaid-T1_flowchart-v2-pointEnd)"/>' +
      '</svg>' +
      '<svg id="mermaid-T2"><g id="mermaid-T2-flowchart-B-1"/></svg>',
  );
  // Two diagrams must stay two: collapsing them would hide a real DOM difference.
  assert.notEqual(out.indexOf('mermaid-T1'), -1);
  assert.notEqual(out.indexOf('mermaid-T2'), -1);
  // Order of first appearance, not of value.
  assert.equal(
    canonicalizeGeneratedIds('b=mermaid-1788755792897 a=mermaid-1788755790541 b=mermaid-1788755792897'),
    'b=mermaid-T1 a=mermaid-T2 b=mermaid-T1',
  );
  assert.equal(canonicalizeGeneratedIds('nothing here'), 'nothing here');
});

test('(g) canonicalizeGeneratedIds leaves anything that is not a 13-digit epoch alone', () => {
  // Shorter, longer, non-numeric and Plotly's own ids: Plotly is made deterministic by the seed,
  // so a rule that touched it would be hiding a difference instead of removing a timestamp.
  const untouched =
    'mermaid-123456789012 mermaid-17887557905410 mermaid-flowchart-v2 mermaid ' +
    'clipcad2f3xy legendcad2f3 trace9d370b topdefs-cad2f3 defs-cad2f3';
  assert.equal(canonicalizeGeneratedIds(untouched), untouched);
});

test('(h) canonicalizeCursorFollower rounds the follower ease to one decimal', () => {
  // `cursor-follow.js:36-41` adds `cursor-follow-clickable` while the pointer is over an
  // `a, button, .job-menu-item`, which `carousel-wheel`'s mouse.move can land on. The rule matches
  // the class as a whitespace-delimited token, so the extra class does not exempt the element.
  assert.equal(
    canonicalizeCursorFollower(
      '<div class="cursor-follow cursor-follow-clickable" style="left: 712.9999999997px; top: -0px;"></div>',
    ),
    '<div class="cursor-follow cursor-follow-clickable" style="left: 713.0px; top: 0.0px;"></div>',
  );
  // …and a class that merely *contains* the token is not the follower.
  assert.equal(
    canonicalizeCursorFollower('<div class="cursor-follow-clickable" style="left: -0px;"></div>'),
    '<div class="cursor-follow-clickable" style="left: -0px;"></div>',
  );
  // Before any mouse move the ease is heading for 0 and the residual is an exponent crumb (or -0).
  const resting =
    '<div class="cursor-follow" style="left: -4.31945e-41px; top: -0px;"></div>' +
    '<div class="circle-follow" style="left: -5.07389e-13px; top: 0px;"></div>';
  assert.equal(
    canonicalizeCursorFollower(resting),
    '<div class="cursor-follow" style="left: 0.0px; top: 0.0px;"></div>' +
      '<div class="circle-follow" style="left: 0.0px; top: 0.0px;"></div>',
  );
  // After carousel-wheel's mouse.move the ease is heading for a real point and the two sides stop
  // on different frames, so they differ only in the float tail. Same rule, same output.
  const moved =
    '<div class="cursor-follow" style="left: 712.9999999997px; top: 301.0000000004px;"></div>' +
    '<div class="circle-follow" style="left: 712.99999999934px; top: 300.99999999971px;"></div>';
  assert.equal(
    canonicalizeCursorFollower(moved),
    '<div class="cursor-follow" style="left: 713.0px; top: 301.0px;"></div>' +
      '<div class="circle-follow" style="left: 713.0px; top: 301.0px;"></div>',
  );
  // A tenth of a pixel is the resolution, not a licence: half a pixel still survives as itself.
  assert.equal(
    canonicalizeCursorFollower('<div class="cursor-follow" style="left: 412.46px; top: -18.44px;"></div>'),
    '<div class="cursor-follow" style="left: 412.5px; top: -18.4px;"></div>',
  );
  // Any other element, and any other property, is untouched.
  const other =
    '<div class="tooltip" style="left: -5.07389e-13px;"></div>' +
    '<div class="cursor-follow" style="width: 40.0000001px; left: 5px;"></div>';
  assert.equal(
    canonicalizeCursorFollower(other),
    '<div class="tooltip" style="left: -5.07389e-13px;"></div>' +
      '<div class="cursor-follow" style="width: 40.0000001px; left: 5.0px;"></div>',
  );
});

/**
 * `js/typing-engine.js` `runStep`, as a duration. A `type` step schedules one `typingDelay` per
 * character it inserts (`:450`, the timer is armed after every character including the last), a
 * `delete` step one `deleteDelay` per character it removes (`:580-610`), a `pause` its own
 * `duration` (`:376-380`), and a `callback` runs inline for nothing (`:618-621`). Cursor mode's
 * `finishDelete` adds 0 (`:468-472`); the cursorless modes add `ERASE_MS` per delete step, which is
 * a constant multiple of the delete-step count and so cannot reorder two sequences that both have
 * exactly one.
 */
function sequenceCost(page: { typingDelay: number; deleteDelay: number }, steps: MastheadStep[]): number {
  return steps.reduce((total, step) => {
    if (step.action === 'type') return total + (step.text ?? '').length * page.typingDelay;
    if (step.action === 'delete') return total + (step.count ?? 0) * page.deleteDelay;
    if (step.action === 'pause') return total + (step.duration ?? 800);
    return total;
  }, 0);
}

interface MastheadStep {
  action: string;
  text?: string;
  count?: number;
  duration?: number;
}

test('(i) MASTHEAD_INDEX pins the shortest sequence each masthead page has', () => {
  // The committed fixture, not the baseline checkout: `@capture:masthead` is what proves the two
  // agree, and reading it here keeps this file environment-free.
  const fixture = JSON.parse(
    readFileSync(resolve(import.meta.dirname, '../../harness/fixtures/baseline/masthead.json'), 'utf8'),
  ) as Record<'home' | 'blog', { typingDelay: number; deleteDelay: number; sequences: { steps: MastheadStep[] }[] }>;

  for (const pageType of ['home', 'blog'] as const) {
    const page = fixture[pageType];
    const costs = page.sequences.map((s) => sequenceCost(page, s.steps));
    const cheapest = Math.min(...costs);
    assert.equal(
      costs.indexOf(cheapest),
      MASTHEAD_INDEX[pageType],
      `MASTHEAD_INDEX.${pageType} is ${MASTHEAD_INDEX[pageType]}, but the shortest of the ` +
        `${costs.length} sequences is ${costs.indexOf(cheapest)} (${JSON.stringify(costs)}ms)`,
    );
    // Shortest, not merely tied-shortest: a tie would make the pin arbitrary.
    assert.equal(costs.filter((c) => c === cheapest).length, 1, `${pageType} has a tie for shortest`);
  }

  // The two the harness actually pins, spelled out so a fixture edit that moves them is visible in
  // the diff rather than only in a recomputed ranking.
  assert.deepEqual(MASTHEAD_INDEX, { home: 3, blog: 6 });
  assert.equal(sequenceCost(fixture.blog, fixture.blog.sequences[6]!.steps), 2555); // "Side quests."
  assert.equal(sequenceCost(fixture.blog, fixture.blog.sequences[3]!.steps), 2670); // "Rabbit holes."
});

test('(j) cleanMastheadText strips the anchor space and the newlines the engine renders as <br>', () => {
  assert.equal(cleanMastheadText("Hi,\nI'm Dawson,\nsoftware engineer.​"), "Hi,I'm Dawson,software engineer.");
  assert.equal(cleanMastheadText('​Rabbit​ holes.'), 'Rabbit holes.');
  assert.equal(cleanMastheadText(''), '');
  // Everything else, including the U+2009 the pages use, is content and survives.
  assert.equal(cleanMastheadText('a b'), 'a b');
});
