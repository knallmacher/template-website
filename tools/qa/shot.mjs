/**
 * shot.mjs — Comprehensive screenshot suite
 *
 * Usage:
 *   node tools/qa/shot.mjs [BASE_URL] [ROUTES] [OUT_DIR]
 *
 * ROUTES is a comma-separated list of paths (no spaces between items).
 *
 * Defaults:
 *   BASE_URL  http://localhost:4321
 *   ROUTES    /
 *   OUT_DIR   .tmp/shots
 *
 * Produces per route (slug 'home' for '/'):
 *   {slug}-{desktop,tablet,mobile}-full.png   full-page at each viewport
 *   {slug}-{desktop,tablet,mobile}-fold.png   above-the-fold at each viewport
 *   {slug}-section-{id}.png                   per-section on desktop (via section[id])
 *
 * Plus, for the first route only (the nav is site-wide):
 *   desktop-scrolled-nav.png                  nav in solid/scrolled state
 *   mobile-menu.png                           mobile nav open (if a burger button is found)
 *
 * Requires: playwright (project devDependency)
 */

import { mkdirSync } from 'node:fs';
import {
  DEFAULT_BASE,
  VIEWPORTS,
  parseRoutes,
  routeSlug,
  withBrowser,
  withPage,
  settle,
  waitForAnimations,
} from './lib/browser.mjs';

const BASE = process.argv[2] || DEFAULT_BASE;
const routes = parseRoutes(process.argv[3]);
const OUT = process.argv[4] || '.tmp/shots';
mkdirSync(OUT, { recursive: true });

const BURGER_SEL = [
  '#nav-burger',
  '[data-burger]',
  'button[aria-label*="menu" i]',
  'button[aria-label*="Menü" i]',
  'button[aria-label*="navigation" i]',
].join(', ');

await withBrowser((browser) =>
  Promise.all(
    routes.flatMap((route) => {
      const slug = routeSlug(route);
      const isFirstRoute = route === routes[0];

      return Object.entries(VIEWPORTS).map(([name, viewport]) =>
        withPage(browser, viewport, async (page) => {
          await page.goto(BASE + route, { waitUntil: 'domcontentloaded' });
          await settle(page);
          await page.screenshot({
            path: `${OUT}/${slug}-${name}-full.png`,
            fullPage: true,
          });
          await page.screenshot({
            path: `${OUT}/${slug}-${name}-fold.png`,
            fullPage: false,
          });
          console.log(`  ${slug} ${name} full + fold`);

          if (name === 'desktop') {
            const sections = await page.$$('section[id], main > [id]');
            for (const section of sections) {
              const id = await section.getAttribute('id');
              if (!id) continue;
              await section.scrollIntoViewIfNeeded();
              await waitForAnimations(page, 800);
              await section.screenshot({
                path: `${OUT}/${slug}-section-${id}.png`,
              });
              console.log(`  ${slug} section #${id}`);
            }

            if (isFirstRoute) {
              await page.evaluate(() => window.scrollTo(0, 700));
              await waitForAnimations(page, 400);
              await page.screenshot({
                path: `${OUT}/desktop-scrolled-nav.png`,
                fullPage: false,
              });
              console.log('  desktop-scrolled-nav');
            }
          }

          if (name === 'mobile' && isFirstRoute) {
            await page.evaluate(() => window.scrollTo(0, 0));
            const burger = await page.$(BURGER_SEL);
            if (burger) {
              await burger.click();
              await waitForAnimations(page, 400);
              await page.screenshot({
                path: `${OUT}/mobile-menu.png`,
                fullPage: false,
              });
              console.log('  mobile-menu');
            } else {
              console.log('  mobile-menu skipped (no burger button found)');
            }
          }
        }),
      );
    }),
  ),
);

console.log(`\nDone → ${OUT}`);
