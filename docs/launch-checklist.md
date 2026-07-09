# Launch Checklist

Run through this before any site built from this template goes live. Each item links to the relevant tooling or README section rather than repeating the explanation here.

## Design

- [ ] `npx impeccable check` reports no unresolved findings (see [Impeccable](../README.md#how-it-works))
- [ ] One icon set used throughout, no emoji as UI icons
- [ ] Fonts are self-hosted (`woff2`, subsetted, `font-display: swap`), not loaded from a CDN
- [ ] Favicon set is complete (`favicon.svg`, `favicon.ico`, `apple-touch-icon.png`, manifest with 192/512 px icons) and checked at 16 px in a real browser tab

## Content and legal

- [ ] Every bracketed placeholder in `src/content/legal/impressum.md` is replaced with the client's real details
- [ ] Every bracketed placeholder in `src/content/legal/datenschutz.md` is replaced, and the cookie/processor claims match what the site actually does (analytics, forms, embeds)
- [ ] Filled-in Impressum and Datenschutzerklärung have been reviewed by qualified counsel — this template is a structural starting point, not legal sign-off
- [ ] Both pages are linked from the site footer
- [ ] Every page has a unique `<title>` (~50–60 characters) and meta description (~150 characters)
- [ ] Open Graph / Twitter card tags are set with a real 1200×630 preview image
- [ ] `sitemap.xml` and `robots.txt` are generated, canonical URLs are set
- [ ] JSON-LD `LocalBusiness`/`Organization` structured data is present with real name, address, opening hours

## Images

- [ ] All photos go through Astro's `<Image>`/`<Picture>` components, not served raw from `brand/`
- [ ] Every image has explicit `width`/`height` and `loading="lazy"` below the fold; the hero image is `fetchpriority="high"`, not lazy
- [ ] `ls -S dist/_astro/*.{avif,webp,jpg,png}` after a build shows nothing over budget (hero ≤ 200 KB, everything else ≤ 100 KB)

## QA gate

- [ ] `npm run qa` passes against every route, including `/impressum` and `/datenschutz`:
  ```
  node tools/qa/qa.mjs http://localhost:4321 /,/impressum,/datenschutz
  ```
- [ ] No console errors, page errors, or failed network requests on any route
- [ ] No WCAG 2.x A/AA violations (axe-core)
- [ ] No horizontal overflow at 320 px and 360 px widths
- [ ] Colour pairs in `tools/qa/contrast-pairs.mjs` pass WCAG 2.2 AA

## Before going live

- [ ] Production build (`npm run build`) completes with no errors, `npm run preview` checked against the built output
- [ ] DNS and TLS point at the production host
- [ ] A 404 page exists
- [ ] If this replaces an existing site, old URLs redirect to their new equivalents
