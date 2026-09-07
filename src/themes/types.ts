// Theme contract shared by the registry, the composer and the picker.
// Labels are not here: they live in prose.yaml at `themes.<id>.label`.
import type { AstroComponentFactory } from 'astro/runtime/server/index.js';

export type PageType = 'home' | 'blog' | 'post' | 'privacy' | 'notFound' | 'lexchat'; // the full union compose() covers
export type OwnablePageType = 'home' | 'blog' | 'post'; // utility pages are never owned by a theme

export type Colors = { text: string; bg: string; primary: string; secondary: string; accent: string };

/** [min, max] fraction 0..1, drawn uniformly. */
export type Range = [number, number];

export interface RoleProfile {
  l: Range; // lightness band
  hueT: number; // this role's share of the scheme's hue spread, 0..1
  sat?: Range; // own saturation band; without one the role takes the palette's shared draw
}

export interface Profile {
  sat: Range; // the shared saturation draw
  /** Roles in order: text, bg, primary, secondary, accent. */
  roles: [RoleProfile, RoleProfile, RoleProfile, RoleProfile, RoleProfile];
}

export type RandomProfile = { light: Profile; dark: Profile }; // today's palette-toy shape, unchanged

export type LazyLayout = () => Promise<{ default: AstroComponentFactory }>; // () => import('./cream/Home.astro')

interface ThemeBase {
  id: string; // URL segment; see RESERVED_IDS in registry.ts
  polarity: 'dark' | 'light';
  colors: Colors;
  tokens?: Record<`--${string}`, string>;
  fonts?: string[]; // Google Fonts css2 URLs
  random?: RandomProfile; // the toy uses its own defaults otherwise
}

export interface SkinTheme extends ThemeBase {
  kind: 'skin';
  css?: string; // '/css/themes/<id>.css'; every skin but default
  flags?: { tilt?: false; still?: true };
  typing?: 'cursor' | 'letter' | 'word';
  typingDelete?: 'char' | 'word';
}

export interface StructuralTheme extends ThemeBase {
  kind: 'structural';
  layouts: Partial<Record<OwnablePageType, LazyLayout>>; // owned page types = the keys
}

export type Theme = SkinTheme | StructuralTheme;

/** What `themeHtml()` in apply.ts projects onto `<html>`: attributes, inline declarations, stylesheet hrefs. */
export interface ThemeHtml {
  attrs: Record<string, string>;
  style: string;
  links: string[];
}
