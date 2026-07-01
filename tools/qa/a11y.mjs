/**
 * a11y.mjs — Automated accessibility checker (axe-core, WCAG 2.x A/AA)
 *
 * Usage:
 *   node tools/qa/a11y.mjs [BASE_URL] [ROUTES]
 *
 * ROUTES is a comma-separated list of paths (no spaces between items).
 *
 * Defaults:
 *   BASE_URL  http://localhost:4321
 *   ROUTES    /
 *
 * Exits with code 1 if any WCAG A/AA violations are found.
 *
 * Requires: playwright, axe-core (project devDependencies)
 */

import axe from 'axe-core';
import { DEFAULT_BASE, VIEWPORTS, parseRoutes, withBrowser, withPage, settle } from './lib/browser.mjs';

const BASE   = process.argv[2] || DEFAULT_BASE;
const routes = parseRoutes(process.argv[3]);

const results = await withBrowser(browser =>
  Promise.all(routes.map(route =>
    withPage(browser, VIEWPORTS.desktop, async page => {
      console.log(`Checking ${BASE}${route} ...`);
      await page.goto(BASE + route, { waitUntil: 'domcontentloaded' });
      await settle(page);
      await page.addScriptTag({ content: axe.source });
      const { violations } = await page.evaluate(() =>
        window.axe.run(document, {
          runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'],
          resultTypes: ['violations'],
        })
      );
      return { route, violations };
    })
  ))
);

let total = 0;
for (const { route, violations } of results) {
  for (const v of violations) {
    total += v.nodes.length;
    console.log(`\n[${route}] [${v.impact}] ${v.id}: ${v.help}`);
    console.log(`  ${v.helpUrl}`);
    for (const node of v.nodes.slice(0, 5)) {
      console.log(`  → ${node.target.join(' ')}`);
    }
    if (v.nodes.length > 5) console.log(`  … and ${v.nodes.length - 5} more`);
  }
}

const ok = total === 0;
console.log(`\n${ok ? 'OK' : 'FAIL'}  ${total} violation(s) across ${routes.length} route(s)`);
process.exitCode = ok ? 0 : 1;
