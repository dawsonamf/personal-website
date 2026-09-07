import type { AstroIntegration, HookParameters } from 'astro';
import { unwrittenSizes } from '../prose/index.ts';

const EXPECTED = 'spike:home.about.body:xs';

export default function checks(): AstroIntegration {
  return {
    name: 'spike-checks',
    hooks: {
      'astro:build:done': ({ logger }: HookParameters<'astro:build:done'>) => {
        if (process.env.SPIKE_BUILD_DONE_THROW) throw new Error('SPIKE_F_THROW: deliberate astro:build:done failure');
        logger.info(`unwrittenSizes.size=${unwrittenSizes.size} entries=${JSON.stringify([...unwrittenSizes])}`);
        if (!unwrittenSizes.has(EXPECTED)) {
          throw new Error(
            `SPIKE_K_FAIL: checks integration does not share the accessor instance. ` +
              `Expected "${EXPECTED}"; set has ${unwrittenSizes.size} entries.`,
          );
        }
        logger.info('SPIKE_K_OK: shared module instance confirmed.');
      },
    },
  };
}
