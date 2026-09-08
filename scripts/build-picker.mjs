import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { rampDeclarations } from '../src/themes/ramp.ts';

const repoRoot = resolve(import.meta.dirname, '..');
const pickerPath = resolve(repoRoot, 'public/js/theme-cycler.js');
const start = '  // <generated:rampDeclarations source="src/themes/ramp.ts">';
const end = '  // </generated:rampDeclarations>';

const args = process.argv.slice(2);
if (args.some((arg) => arg !== '--check') || args.filter((arg) => arg === '--check').length > 1) {
  throw new Error('Usage: node scripts/build-picker.mjs [--check]');
}

const source = readFileSync(pickerPath, 'utf8');
const startAt = source.indexOf(start);
const endAt = source.indexOf(end);
if (startAt < 0 || endAt < startAt || source.indexOf(start, startAt + start.length) >= 0
  || source.indexOf(end, endAt + end.length) >= 0) {
  throw new Error('theme-cycler.js must contain exactly one ordered generated-ramp marker pair');
}

const generatedFunction = rampDeclarations.toString();
if (/<\/script|<!--/i.test(generatedFunction)) {
  throw new Error('rampDeclarations contains text that is unsafe for PalettePrepaint.astro');
}
const indentedFunction = generatedFunction
  .split('\n')
  .map((line) => line ? `  ${line.trimEnd()}` : '')
  .join('\n');
const region = `${start}\n${indentedFunction}\n${end}`;
const expected = source.slice(0, startAt) + region + source.slice(endAt + end.length);

if (args[0] === '--check') {
  if (expected !== source) {
    console.error('public/js/theme-cycler.js ramp adapter is stale; run npm run picker:build');
    process.exitCode = 1;
  }
} else if (expected !== source) {
  writeFileSync(pickerPath, expected);
}
