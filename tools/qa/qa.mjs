/**
 * qa.mjs — Single QA gate: runs all pass/fail checks and aggregates the result
 *
 * Usage:
 *   node tools/qa/qa.mjs [BASE_URL] [ROUTES]
 *
 * ROUTES is a comma-separated list of paths (no spaces between items).
 *
 * Defaults:
 *   BASE_URL  http://localhost:4321
 *   ROUTES    /
 *
 * Runs, in order:
 *   check-console.mjs   console errors and failed requests
 *   a11y.mjs            WCAG A/AA violations (axe-core)
 *   narrow.mjs          horizontal overflow at narrow widths
 *   contrast.mjs        colour pairs from contrast-pairs.mjs (if present)
 *
 * Exits with code 1 if any check fails. Screenshot-only tools (shot.mjs)
 * are not part of the gate; run them separately for visual review.
 *
 * Requires: playwright, axe-core (project devDependencies)
 */

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const BASE   = process.argv[2] || 'http://localhost:4321';
const ROUTES = process.argv[3] || '/';

const dir = path.dirname(fileURLToPath(import.meta.url));
const pairsFile = path.join(dir, 'contrast-pairs.mjs');

const checks = [
  ['console',  [path.join(dir, 'check-console.mjs'), BASE, ROUTES]],
  ['a11y',     [path.join(dir, 'a11y.mjs'), BASE, ROUTES]],
  ['overflow', [path.join(dir, 'narrow.mjs'), BASE, ROUTES]],
];
if (existsSync(pairsFile)) {
  checks.push(['contrast', [path.join(dir, 'contrast.mjs'), '--file', pairsFile]]);
}

const summary = [];
for (const [name, args] of checks) {
  console.log(`\n━━ ${name} ${'━'.repeat(Math.max(0, 60 - name.length))}`);
  const { status } = spawnSync(process.execPath, args, { stdio: 'inherit' });
  summary.push([name, status === 0]);
}

console.log(`\n━━ summary ${'━'.repeat(53)}`);
for (const [name, pass] of summary) {
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}`);
}

const ok = summary.every(([, pass]) => pass);
console.log(`\n${ok ? 'QA gate passed.' : 'QA gate failed.'}`);
process.exitCode = ok ? 0 : 1;
