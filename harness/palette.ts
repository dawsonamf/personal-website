/** Palette-specific old/new behavior. Kept separate from generic interaction equality because
 * reload reset is intentionally different in old-new mode (§15 item 2). */
import type { Page } from '@playwright/test';
import type { ParityMode } from './urls.ts';

export type ReloadOutcome = 'reset' | 'persist';

export function reloadOutcome(mode: ParityMode, side: 'old' | 'new'): ReloadOutcome {
  return mode === 'old-new' && side === 'new' ? 'persist' : 'reset';
}

/** Reload is asserted per side; only that exact field is absent from old-new cross-side equality. */
export function paletteEvidenceForComparison(
  evidence: Readonly<Record<string, unknown>>,
  mode: ParityMode,
): Record<string, unknown> {
  if (mode !== 'old-new') return { ...evidence };
  const { reload: _reload, ...shared } = evidence;
  return shared;
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
