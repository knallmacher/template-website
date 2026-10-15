/**
 * lhci-summary.mjs — Lighthouse CI score summary for the run log
 *
 * Usage:
 *   node tools/qa/lhci-summary.mjs [REPORTS_DIR]
 *
 * Defaults:
 *   REPORTS_DIR  .lighthouseci/reports
 *
 * Reads the manifest Lighthouse CI writes for the filesystem upload target and
 * prints a Markdown table of the category scores per audited URL. When
 * $GITHUB_STEP_SUMMARY is set, the same table is appended to it, so the scores
 * are visible on the workflow run without downloading the HTML reports.
 *
 * This is an indicator, not a gate: a missing manifest is reported but does not
 * fail the run.
 */

import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const reportsDir = process.argv[2] || '.lighthouseci/reports';
const manifestPath = path.join(reportsDir, 'manifest.json');

// Preferred column order; any other categories found are appended after these.
const CATEGORY_ORDER = [
  'performance',
  'accessibility',
  'best-practices',
  'seo',
];

if (!existsSync(manifestPath)) {
  console.log(`No Lighthouse report found at ${manifestPath}.`);
  process.exit(0);
}

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));

const rows = manifest.map((entry) => {
  // Prefer the full report so every category is available; the manifest's own
  // summary only carries a subset.
  let categories = {};
  if (entry.jsonPath && existsSync(entry.jsonPath)) {
    categories =
      JSON.parse(readFileSync(entry.jsonPath, 'utf8')).categories || {};
  } else if (entry.summary) {
    categories = entry.summary;
  }
  return { url: entry.url, categories };
});

const ids = [];
const titles = {};
for (const id of CATEGORY_ORDER) {
  for (const row of rows) {
    if (!row.categories[id]) continue;
    ids.push(id);
    titles[id] = row.categories[id].title || id;
    break;
  }
}
for (const row of rows) {
  for (const [id, category] of Object.entries(row.categories)) {
    if (ids.includes(id)) continue;
    ids.push(id);
    titles[id] = category.title || id;
  }
}

const percent = (score) =>
  typeof score === 'number' ? `${Math.round(score * 100)}` : '-';

const header = ['URL', ...ids.map((id) => titles[id])];
const table = [
  `| ${header.join(' | ')} |`,
  `| ${header.map(() => '---').join(' | ')} |`,
  ...rows.map(
    (row) =>
      `| ${[row.url, ...ids.map((id) => percent(row.categories[id]?.score))].join(' | ')} |`,
  ),
].join('\n');

console.log(table);

if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(
    process.env.GITHUB_STEP_SUMMARY,
    `## Lighthouse\n\n${table}\n\n` +
      'Reporting indicator only: these scores never fail the build. The full HTML ' +
      'reports are attached to this run as the `lighthouse-reports` artifact.\n',
  );
}
