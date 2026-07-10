/**
 * browser.mjs — Shared Playwright helpers for the QA scripts
 *
 * All QA scripts take [BASE_URL] [ROUTES] as their first two arguments.
 * ROUTES is a comma-separated list of paths (no spaces between items).
 *
 * Requires: playwright (project devDependency)
 */

import { chromium } from 'playwright';

export const DEFAULT_BASE = 'http://localhost:4321';

export const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  tablet: { width: 820, height: 1180 },
  mobile: { width: 390, height: 844 },
};

/** '/'-separated CSV → trimmed route list. Defaults to ['/']. */
export function parseRoutes(csv) {
  return (csv || '/')
    .split(',')
    .map((r) => r.trim())
    .filter(Boolean);
}

/** Filename-safe name for a route: '/' → 'home', '/impressum' → 'impressum'. */
export function routeSlug(route) {
  const slug = route
    .replace(/^\/|\/$/g, '')
    .replace(/[^a-z0-9]+/gi, '-')
    .toLowerCase();
  return slug || 'home';
}

/** Launch chromium, run fn(browser), always close. */
export async function withBrowser(fn) {
  const browser = await chromium.launch();
  try {
    return await fn(browser);
  } finally {
    await browser.close();
  }
}

/** Open a page at the given viewport, run fn(page), always close. */
export async function withPage(browser, viewport, fn) {
  const page = await browser.newPage({ viewport });
  try {
    return await fn(page);
  } finally {
    await page.close();
  }
}

/**
 * Wait until the page is visually settled:
 * scroll through it so reveal-on-scroll animations fire, return to the top,
 * then wait (bounded) for running animations to finish.
 */
export async function settle(page, { scroll = true, maxWait = 1500 } = {}) {
  if (scroll) {
    await page.evaluate(async () => {
      const max = document.documentElement.scrollHeight;
      const step = window.innerHeight * 0.8;
      for (let y = 0; y < max; y += step) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 120));
      }
      window.scrollTo(0, 0);
    });
  }
  await waitForAnimations(page, maxWait);
  await page.waitForTimeout(150);
}

/** Wait for running finite animations to complete, up to maxWait ms. */
export async function waitForAnimations(page, maxWait) {
  await page.evaluate(async (timeout) => {
    const animations = document.getAnimations().filter((animation) => {
      const { endTime } = animation.effect?.getComputedTiming() ?? {};
      return animation.playState === 'running' && Number.isFinite(endTime);
    });
    if (!animations.length) return;

    await Promise.race([
      Promise.allSettled(animations.map((animation) => animation.finished)),
      new Promise((resolve) => setTimeout(resolve, timeout)),
    ]);
  }, maxWait);
}
