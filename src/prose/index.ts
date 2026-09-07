// The one validated prose accessor (D37, §4.2), shared by the site tree (src/prose/site.ts)
// and by each post's metadata. It owns the two module-scope accumulators the build gates
// read: `unwrittenSizes` (D10) and `touches` (the positive sentinel required by S1-01's
// spike §k, so a duplicated module instance fails loudly instead of passing vacuously).
//
// S1-08 externalizes this exact file from the SSR bundle so the config side and the page
// side share one instance, which means plain Node loads it: erasable TypeScript only, no
// enum/namespace/parameter properties/decorators, `import type` for types, explicit `.ts`
// extensions on relative imports, and no astro:* / Vite-only / virtual imports.
import { SIZES } from './fields.ts';
import type { Size } from './fields.ts';
import { isDraft } from './drafts.ts';
import { renderMarkdown, renderParagraphs } from './markdown.ts';

/** `${source}:${path}:${size}` for every requested size nobody wrote. Deduped by the Set. */
export const unwrittenSizes = new Set<string>();

/** Incremented at entry of every accessor call, throwing ones included. Read as a live binding. */
export let touches = 0;

export const DRAFT_CLASS = 'prose-draft';
export const DRAFT_TEXT_PREFIX = '[draft] ';

// ---- Types -----------------------------------------------------------------
// A size map is an object whose keys are all sizes; a label list is an array whose items
// can be drafted (a plain string[] such as a post's `scripts` is data and stays readable).
// Both are hidden from `data` and are where a ProsePath ends.

// Non-distributive and NonNullable so an optional or nullable size map (`ticker?: SizedText`)
// stays a size map; the keyless check keeps `{}` from passing vacuously.
type IsSizeMap<T> = [NonNullable<T>] extends [object]
  ? [keyof NonNullable<T>] extends [never]
    ? false
    : [keyof NonNullable<T>] extends [Size]
      ? true
      : false
  : false;

type IsLabelList<T> = NonNullable<T> extends readonly (infer U)[]
  ? [Extract<U, { draft: unknown }>] extends [never]
    ? false
    : true
  : false;

/** The tree with every size map and label list typed `never`: reachable only through the methods. */
export type ProseData<T> = IsSizeMap<T> extends true
  ? never
  : IsLabelList<T> extends true
    ? never
    : T extends readonly (infer U)[]
      ? ProseData<U>[]
      : T extends object
        ? { [K in keyof T]: ProseData<T[K]> }
        : T;

type Step<K extends string, Rest extends string> = Rest extends '' ? K : `${K}.${Rest}`;

/** Every dot path that ends at a size map or label list; array elements are `${number}`. */
export type ProsePath<T> = IsSizeMap<T> extends true
  ? ''
  : IsLabelList<T> extends true
    ? ''
    : T extends readonly (infer U)[]
      ? Step<`${number}`, ProsePath<U>>
      : T extends object
        ? { [K in keyof T & string]: Step<K, ProsePath<T[K]>> }[keyof T & string]
        : never;

export type ProseAccess<T> = {
  data: ProseData<T>;
  /** Markdown rendered to HTML: block for m/l, inline for xs/s. */
  get(path: ProsePath<T>, size: Size): string;
  /** Plain unescaped text for `{}` interpolation, `<title>` and JSON-LD, which escape once themselves. */
  text(path: ProsePath<T>, size: Size): string;
  list(path: ProsePath<T>, size: Size): string[];
  textList(path: ProsePath<T>, size: Size): string[];
  /** One fragment per source paragraph, no `<p>` wrapper; callers join with `<br><br>` (D15). */
  paragraphs(path: ProsePath<T>, size: Size): string[];
  has(path: ProsePath<T>, size: Size): boolean;
};

// ---- Resolution ------------------------------------------------------------

type Item = { text: string; draft: boolean };
// `items` holds one entry for a string field and one per item for a list; `scalar` says which.
type Field =
  | { state: 'written'; scalar: boolean; items: Item[] }
  | { state: 'omit' }
  | { state: 'absent' };

const OMIT: Field = { state: 'omit' };
const ABSENT: Field = { state: 'absent' };

const isSizeMap = (value: unknown): value is Record<string, unknown> => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const keys = Object.keys(value);
  // `{}` is not a size map: every key would pass vacuously.
  return keys.length > 0 && keys.every((key) => (SIZES as readonly string[]).includes(key));
};

// A label list holds labels; an array of records (`jobs`) is data and reaches prose one level down.
const isLabelList = (value: unknown): value is unknown[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string' || isDraft(item));

const resolve = (tree: unknown, source: string, path: string): unknown => {
  let node: unknown = tree;
  for (const key of path.split('.')) {
    // hasOwn, not `in`: a path may not walk into Object.prototype.
    if (node === null || typeof node !== 'object' || !Object.hasOwn(node, key)) {
      throw new Error(`prose: no such path "${path}" in ${source}`);
    }
    node = (node as Record<string, unknown>)[key];
  }
  // A typo is a bug, not a gap (§4.2): anything that is not a prose field throws too.
  if (node !== null && !isLabelList(node) && !isSizeMap(node)) {
    throw new Error(`prose: "${path}" in ${source} is not a prose field`);
  }
  return node;
};

// The tree is zod-validated before it reaches here, so the casts below are safe.
const toItem = (value: unknown, draft: boolean): Item => ({ text: value as string, draft });

const field = (tree: unknown, source: string, path: string, size: Size): Field => {
  const node = resolve(tree, source, path);
  if (node === null) return OMIT;

  if (Array.isArray(node)) {
    // Label list: chips exist only at xs (D37); every other size is unwritten.
    if (size !== 'xs') return record(source, path, size);
    return {
      state: 'written',
      scalar: false,
      items: node.map((item) => (isDraft(item) ? toItem(item.draft, true) : toItem(item, false))),
    };
  }

  const value = (node as Record<string, unknown>)[size];
  if (value === undefined) return record(source, path, size);
  if (value === null) return OMIT;

  const draft = isDraft(value);
  const written = draft ? value.draft : value;
  return Array.isArray(written)
    ? { state: 'written', scalar: false, items: written.map((item) => toItem(item, draft)) }
    : { state: 'written', scalar: true, items: [toItem(written, draft)] };
};

const record = (source: string, path: string, size: Size): Field => {
  unwrittenSizes.add(`${source}:${path}:${size}`);
  return ABSENT;
};

const wrongShape = (source: string, path: string, wanted: string, use: string) =>
  new Error(`prose: "${path}" in ${source} is ${wanted}; use ${use}()`);

// ---- Rendering -------------------------------------------------------------

const ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
};

// Inline-render, strip tags, then undo marked's escaping in one pass so `&amp;lt;` decodes
// once. Callers (Astro `{}`, <title>, JSON.stringify for JSON-LD) escape exactly once.
const plain = (markdown: string) =>
  renderMarkdown(markdown, { inline: true })
    .replace(/<[^>]*>/g, '')
    .replace(/&(?:amp|lt|gt|quot|#39);/g, (entity) => ENTITIES[entity]);

// D9 preview marking. Applied unconditionally: production never reaches a draft because
// S1-08's gate runs findDrafts before anything renders.
const markHtml = (html: string, block: boolean) =>
  block ? `<div class="${DRAFT_CLASS}">${html}</div>` : `<mark class="${DRAFT_CLASS}">${html}</mark>`;

const renderItem = (item: Item, block: boolean) => {
  const html = renderMarkdown(item.text, { inline: !block });
  return item.draft ? markHtml(html, block) : html;
};

const plainItem = (item: Item) => (item.draft ? DRAFT_TEXT_PREFIX : '') + plain(item.text);

// ---- Factory ---------------------------------------------------------------

export function createProseAccess<T>(tree: T, source: string): ProseAccess<T> {
  // The tree is already validated by its caller; this only binds it to a source namespace.
  const scalar = (path: string, size: Size) => {
    const found = field(tree, source, path, size);
    if (found.state !== 'written') return undefined;
    if (!found.scalar) throw wrongShape(source, path, 'a list', 'list');
    return found.items[0];
  };
  const many = (path: string, size: Size) => {
    const found = field(tree, source, path, size);
    if (found.state !== 'written') return [];
    if (found.scalar) throw wrongShape(source, path, 'text', 'get');
    return found.items;
  };

  // The implementation takes plain strings; the one cast below applies ProsePath<T>. Writing
  // the methods against ProsePath<T> directly makes tsc expand it for an unresolved T, which
  // recurses without bound (TS2589).
  const access = {
    data: tree,
    get(path: string, size: Size) {
      touches++;
      const item = scalar(path, size);
      return item === undefined ? '' : renderItem(item, size === 'm' || size === 'l');
    },
    text(path: string, size: Size) {
      touches++;
      const item = scalar(path, size);
      return item === undefined ? '' : plainItem(item);
    },
    list(path: string, size: Size) {
      touches++;
      return many(path, size).map((item) => renderItem(item, false));
    },
    textList(path: string, size: Size) {
      touches++;
      return many(path, size).map(plainItem);
    },
    paragraphs(path: string, size: Size) {
      touches++;
      const item = scalar(path, size);
      if (item === undefined) return [];
      return renderParagraphs(item.text).map((fragment) =>
        item.draft ? markHtml(fragment, false) : fragment,
      );
    },
    has(path: string, size: Size) {
      touches++;
      return field(tree, source, path, size).state === 'written';
    },
  };
  return access as unknown as ProseAccess<T>;
}
