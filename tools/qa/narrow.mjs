/**
 * narrow.mjs — Horizontal overflow detector at narrow viewports
 *
 * Usage:
 *   node tools/qa/narrow.mjs [BASE_URL] [ROUTES] [OUT_DIR] [WIDTHS]
 *
 * ROUTES and WIDTHS are comma-separated lists (no spaces between items).
 *
 * Defaults:
 *   BASE_URL  http://localhost:4321
 *   ROUTES    /
 *   OUT_DIR   .tmp/shots
 *   WIDTHS    320,360
 *
 * Exits with code 1 if any route shows horizontal overflow at any width.
 *
 * Requires: playwright (project devDependency)
 */

import { mkdirSync } from 'node:fs';
import {
  DEFAULT_BASE,
  parseRoutes,
  routeSlug,
  withBrowser,
  withPage,
  settle,
} from './lib/browser.mjs';

const BASE = process.argv[2] || DEFAULT_BASE;
const routes = parseRoutes(process.argv[3]);
const OUT = process.argv[4] || '.tmp/shots';
const widths = (process.argv[5] || '320,360')
  .split(',')
  .map(Number)
  .filter(Boolean);
mkdirSync(OUT, { recursive: true });

const checks = routes.flatMap((route) => widths.map((w) => ({ route, w })));

const results = await withBrowser((browser) =>
  Promise.all(
    checks.map(({ route, w }) =>
      withPage(browser, { width: w, height: 760 }, async (page) => {
        await page.goto(BASE + route, { waitUntil: 'domcontentloaded' });
        await settle(page);

        const result = await page.evaluate(() => ({
          docW: document.documentElement.scrollWidth,
          winW: window.innerWidth,
          overflow:
            document.documentElement.scrollWidth > window.innerWidth + 1,
          culprits: Array.from(document.querySelectorAll('*'))
            .filter(
              (el) => el.getBoundingClientRect().right > window.innerWidth + 2,
            )
            .slice(0, 5)
            .map(
              (el) =>
                el.tagName.toLowerCase() +
                (el.id ? '#' + el.id : '') +
                (el.className
                  ? '.' + String(el.className).trim().split(/\s+/)[0]
                  : ''),
            ),
        }));

        await page.screenshot({
          path: `${OUT}/narrow-${routeSlug(route)}-${w}.png`,
          fullPage: true,
        });
        return { route, w, ...result };
      }),
    ),
  ),
);

for (const result of results) {
  const status = result.overflow ? 'OVERFLOW' : 'OK      ';
  console.log(
    `${status}  ${result.route}  w=${result.w}  docW=${result.docW}  winW=${result.winW}`,
  );
  if (result.overflow && result.culprits.length) {
    console.log(`         culprits: ${result.culprits.join(', ')}`);
  }
}

if (results.some((result) => result.overflow)) {
  console.error('\nHorizontal overflow detected — check culprits above.');
  process.exit(1);
}
console.log(`\nNo overflow detected. → ${OUT}`);
