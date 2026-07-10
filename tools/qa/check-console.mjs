/**
 * check-console.mjs — Console error and failed-request checker
 *
 * Usage:
 *   node tools/qa/check-console.mjs [BASE_URL] [ROUTES]
 *
 * ROUTES is a comma-separated list of paths (no spaces between items).
 *
 * Defaults:
 *   BASE_URL  http://localhost:4321
 *   ROUTES    /
 *
 * Examples:
 *   node tools/qa/check-console.mjs
 *   node tools/qa/check-console.mjs http://localhost:4321 /,/impressum,/datenschutz
 *   node tools/qa/check-console.mjs http://localhost:3000 /,/about,/contact
 *
 * Exits with code 1 if any console errors or failed requests are found.
 *
 * Requires: playwright (project devDependency)
 */

import {
  DEFAULT_BASE,
  VIEWPORTS,
  parseRoutes,
  withBrowser,
  withPage,
} from './lib/browser.mjs';

const BASE = process.argv[2] || DEFAULT_BASE;
const routes = parseRoutes(process.argv[3]);

const results = await withBrowser((browser) =>
  Promise.all(
    routes.map((route) =>
      withPage(browser, VIEWPORTS.desktop, async (page) => {
        const errors = [];
        const reqFails = [];

        page.on('console', (m) => {
          if (m.type() === 'error')
            errors.push(`[${route}] [console] ${m.text()}`);
        });
        page.on('pageerror', (e) =>
          errors.push(`[${route}] [pageerror] ${e.message}`),
        );
        page.on('requestfailed', (request) => {
          const error = request.failure()?.errorText ?? '';
          // Ignore aborted requests — these are normal when closing a page.
          if (!error.includes('net::ERR_ABORTED')) {
            reqFails.push(`[${route}] [request] ${request.url()}  ${error}`);
          }
        });

        console.log(`Checking ${BASE}${route} ...`);
        await page.goto(BASE + route, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(600);
        return { errors, reqFails };
      }),
    ),
  ),
);

const errors = results.flatMap((result) => result.errors);
const reqFails = results.flatMap((result) => result.reqFails);

const ok = errors.length === 0 && reqFails.length === 0;
console.log(
  `\n${ok ? 'OK' : 'FAIL'}  ${errors.length} error(s)  ${reqFails.length} failed request(s)`,
);
if (errors.length) console.log('\nErrors:\n' + errors.join('\n'));
if (reqFails.length) console.log('\nFailed requests:\n' + reqFails.join('\n'));

process.exitCode = ok ? 0 : 1;
