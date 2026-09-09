// Ambient `*.astro` module for plain `tsc`: `.ts` modules hold lazy layout imports
// (compose.ts, structural `layouts` entries) and TypeScript ships no declaration for
// them. Under `astro check` the real component module resolves first, so prop typing
// is unaffected; this wildcard only serves `tsc --noEmit`.
declare module '*.astro' {
  const component: import('astro/runtime/server/index.js').AstroComponentFactory;
  export default component;
}
