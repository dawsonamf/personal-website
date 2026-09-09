// Canonical-only presentation data for the Shell's PageContext.styleExtras.
// Inputs: a theme id, whether this page renders FeaturedCarousel, and approved
// shared prose. Build-time only; themeHtml stays content-free and page callers
// decide whether the carousel properties apply.
import { prose } from '../../prose/site.ts';

const TICKER_SEP = '✷';
const TICKER_PASSES_PER_HALF = 2;
const TICKER_CHARS_PER_SEC = 402 / 46;
const MARQUEE_FALLBACK_REPETITIONS = 12;

/** Quote a CSS string token, including terminators and otherwise invalid controls. */
function cssString(value: string): string {
  let escaped = '';
  for (const character of value) {
    const codePoint = character.codePointAt(0) ?? 0;
    if (character === '"' || character === '\\') {
      escaped += `\\${character}`;
    } else if (codePoint === 0) {
      escaped += '\\fffd ';
    } else if (codePoint <= 0x1f || codePoint === 0x7f || ';{}'.includes(character)) {
      escaped += `\\${codePoint.toString(16)} `;
    } else {
      escaped += character;
    }
  }
  return `"${escaped}"`;
}

function tickerExtras(): Record<`--${string}`, string> {
  const seen = new Set<string>();
  const terms: string[] = [];

  // The terms are the same pills the carousel renders, so the strip indexes the
  // section instead of becoming a second slogan. Preserve first-seen project order
  // and authored casing while deduping case-insensitively: Python first appears at
  // Toolbelt, and names such as cJSON and L-BFGS should not be normalized.
  prose.data.projects.forEach((_project, projectIndex) => {
    prose.textList(`projects.${projectIndex}.tech`, 'xs').forEach((technology) => {
      const key = technology.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      terms.push(technology);
    });
  });

  if (terms.length === 0) return {};
  // Every term owns a trailing space, including the seam between passes. Two passes
  // make a half wider than the widest viewport; doubling that half lets marquee.css
  // travel -50% and land the second copy exactly where the first began.
  const pass = terms.map((technology) => `${TICKER_SEP} ${technology} `).join('');
  const half = pass.repeat(TICKER_PASSES_PER_HALF);

  return {
    '--ticker-run': cssString(half + half),
    // The legacy 402-character half took 46 seconds. Holding characters per second
    // constant preserves the tuned speed when the project technology set changes.
    '--ticker-dur': `${Math.round(half.length / TICKER_CHARS_PER_SEC)}s`,
  };
}

export function canonicalStyleExtras(
  themeId: string,
  options: { carousel: boolean },
): Record<`--${string}`, string> {
  const extras: Record<`--${string}`, string> = {};

  if (themeId === 'marquee') {
    extras['--prose-ticker'] = cssString(
      prose.text('themes.marquee.ticker', 'xs').repeat(MARQUEE_FALLBACK_REPETITIONS),
    );
  } else if (themeId === 'doodle') {
    extras['--prose-currently-here'] = cssString(prose.text('themes.doodle.currentlyHere', 'xs'));
  }

  if (options.carousel) Object.assign(extras, tickerExtras());
  return extras;
}
