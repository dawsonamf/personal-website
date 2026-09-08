/** Palette-specific old/new behavior. Kept separate from generic interaction equality because
 * reload reset is intentionally different in old-new mode (§15 item 2). */
import type { Page } from '@playwright/test';
import type { ParityMode } from './urls.ts';

export type ReloadOutcome = 'reset' | 'persist';

export function reloadOutcome(mode: ParityMode, side: 'old' | 'new'): ReloadOutcome {
  return mode === 'old-new' && side === 'new' ? 'persist' : 'reset';
}

function withoutStyleCarrier(value: unknown, label: string, theme: string): string {
  if (typeof value !== 'string') throw new Error(`${label}: missing palette storage record`);
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error(`${label}: malformed palette storage JSON`);
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`${label}: malformed palette storage record`);
  }
  const record = parsed as Record<string, unknown>;
  if (!Object.hasOwn(record, 'style')) throw new Error(`${label}: missing migrated style carrier`);
  if (record.style !== theme) {
    throw new Error(`${label}: expected style ${JSON.stringify(theme)}, got ${JSON.stringify(record.style)}`);
  }
  const { style: _style, ...shared } = record;
  return JSON.stringify(shared);
}

/**
 * Reload is asserted per side and omitted from old-new cross-side equality. D11/§15.1–2 also add
 * the saved palette's route theme to NEW. Assert that carrier in every shared storage snapshot,
 * then remove only it so the remaining OLD/NEW record is still compared byte for byte.
 */
export function paletteEvidenceForComparison(
  evidence: Readonly<Record<string, unknown>>,
  mode: ParityMode,
  side: 'old' | 'new' = 'old',
  theme?: string,
): Record<string, unknown> {
  if (mode !== 'old-new') return { ...evidence };
  const { reload: _reload, ...shared } = evidence;
  if (side === 'old') return shared;
  if (!theme) throw new Error('palette comparison: migrated side needs the expected theme');
  const navigate = shared.navigate;
  if (!navigate || typeof navigate !== 'object' || Array.isArray(navigate)) {
    throw new Error('navigate: missing palette navigation evidence');
  }
  const navigation = navigate as Record<string, unknown>;
  return {
    ...shared,
    storageAfterShuffle: withoutStyleCarrier(shared.storageAfterShuffle, 'storageAfterShuffle', theme),
    navigate: {
      ...navigation,
      firstPaintStorage: withoutStyleCarrier(navigation.firstPaintStorage, 'navigate.firstPaintStorage', theme),
      storage: withoutStyleCarrier(navigation.storage, 'navigate.storage', theme),
    },
  };
}

export interface FirstPaint {
  roles: Record<string, string>;
  storage: string | null;
  readyState: DocumentReadyState;
}

/**
 * Install before navigation. The observer exists before `<html>` is parsed and records the first
 * script mutation of its style attribute. Both the legacy bootstrap and migrated pre-paint script
 * perform that mutation while readyState is `loading`; a later interactive snapshot is too late.
 */
export async function recordFirstPaint(page: Page, key: string, roles: readonly string[]): Promise<void> {
  await page.addInitScript(
    ({ storageKey, roleNames }) => {
      window.__parityFirstPaint = null;
      new MutationObserver((mutations) => {
        if (window.__parityFirstPaint) return;
        if (!mutations.some((mutation) => mutation.target === document.documentElement)) return;
        const style = document.documentElement.style;
        const colors = Object.fromEntries(roleNames.map((role) => [role, style.getPropertyValue(role)]));
        if (roleNames.some((role) => !colors[role])) return;
        let storage: string | null = null;
        try { storage = sessionStorage.getItem(storageKey); } catch {}
        window.__parityFirstPaint = { roles: colors, storage, readyState: document.readyState };
      }).observe(document, { attributes: true, attributeFilter: ['style'], subtree: true });
    },
    { storageKey: key, roleNames: [...roles] },
  );
}

export async function firstPaint(page: Page): Promise<FirstPaint> {
  const shot = await page.evaluate(() => window.__parityFirstPaint ?? null);
  if (!shot) throw new Error('no pre-paint <html style> mutation was recorded on this load');
  if (shot.readyState !== 'loading') {
    throw new Error(`first palette mutation occurred at readyState=${shot.readyState}, expected loading`);
  }
  return shot;
}

declare global {
  interface Window {
    __parityFirstPaint: FirstPaint | null;
  }
}
