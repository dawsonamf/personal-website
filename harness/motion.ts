import type { BrowserContextOptions } from '@playwright/test';

export type ParityReducedMotion = NonNullable<BrowserContextOptions['reducedMotion']>;

export function parityReducedMotion(value = process.env.PARITY_REDUCED_MOTION): ParityReducedMotion {
  if (value === undefined || value === '0') return 'no-preference';
  if (value === '1') return 'reduce';
  throw new Error(
    `PARITY_REDUCED_MOTION is ${JSON.stringify(value)}. Use 0/no value for no-preference or 1 for reduce.`,
  );
}
