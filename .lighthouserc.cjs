/**
 * Lighthouse CI configuration — a reporting indicator, not a gate.
 *
 * CI runs Lighthouse against the built static site in ./dist on every pull
 * request and writes the reports to .lighthouseci/reports. There is
 * deliberately no `assert` block, so audit results never fail the build: the
 * scores are shown in the workflow run summary and the HTML reports are
 * attached as a downloadable artifact. See .github/workflows/lighthouse.yml.
 *
 * Routes: by default Lighthouse CI discovers the HTML files in ./dist itself
 * (up to maxAutodiscoverUrls, default discovery depth 2). To audit a curated
 * set instead, add a lighthouse.routes.json next to this file holding an array
 * of URLs, e.g. ["/", "/leistungen/", "/kontakt/"]. That file is site-specific
 * and not part of the template sync, so it survives updates to this config.
 *
 * Note the .cjs extension: this project is `"type": "module"`, and Lighthouse
 * CI loads its config with require(), which would not see an ESM default export.
 */

const { existsSync, readFileSync } = require('node:fs');
const path = require('node:path');

const routesFile = path.join(__dirname, 'lighthouse.routes.json');

const collect = {
  staticDistDir: './dist',
  // Skip error pages that a build may emit as HTML (e.g. Astro's 404.astro).
  autodiscoverUrlBlocklist: ['/404.html', '/500.html'],
  numberOfRuns: 1,
};

if (existsSync(routesFile)) {
  collect.url = JSON.parse(readFileSync(routesFile, 'utf8'));
}

module.exports = {
  ci: {
    collect,
    upload: {
      target: 'filesystem',
      outputDir: './.lighthouseci/reports',
    },
  },
};
