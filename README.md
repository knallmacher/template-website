# knallmacher Website Development Kit

## Table of contents

- [Best practices](#best-practices)
- [Project structure](#project-structure)
- [Impeccable](#impeccable)
- [Visual QA](#visual-qa)
- [Updating site repos from this template](#updating-site-repos-from-this-template)

## Best practices

Impeccable covers design quality. These are the implementation practices it does not enforce — easy to overlook during development and expensive to retrofit before launch.

### Icons

- Use [Iconify](https://iconify.design/) and commit to **one icon set per project** (e.g. Lucide, Tabler or Phosphor). Mixing sets produces subtly inconsistent stroke widths and corner radii. In Astro, `astro-icon` with the matching `@iconify-json/*` package renders inline SVG at build time — no icon font, no runtime request.
- Never use emoji as UI icons. They render differently on every platform and ignore the colour system.

### Fonts

- Use open-source fonts and **self-host** them, e.g. via [Fontsource](https://fontsource.org/). Loading from the Google Fonts CDN is a GDPR problem for German sites (LG München I, 2022) — self-hosting removes both the consent question and the third-party connection.
- Ship `woff2` only, subset to the characters the site actually uses, set `font-display: swap`, and preload the one or two files used above the fold.

### Favicon

- Generate the full set from the production logo: `favicon.svg` (can adapt to dark mode via `prefers-color-scheme`), `favicon.ico` as fallback, `apple-touch-icon.png` (180 px) and a web manifest with 192/512 px icons plus `theme-color`.
- Check the favicon at 16 px in a real browser tab. Most logos need a simplified mark at that size — a scaled-down wordmark turns into noise.

### SEO

- Every page gets a unique `<title>` (~50–60 characters) and meta description (~150 characters), written for the searcher, not for the company. Front-load the term people actually search for.
- One `h1` per page; headings follow the document outline, not the visual size you want (style the size in CSS instead).
- Add Open Graph and Twitter card tags with a real 1200×630 preview image — company sites get shared in chats more often than they get googled.
- Generate `sitemap.xml` (`@astrojs/sitemap`) and `robots.txt`, set canonical URLs, and add JSON-LD `LocalBusiness`/`Organization` structured data with name, address and opening hours.
- Write copy so the first viewport answers what the company does, for whom, and where. Search engines and visitors give up at the same speed.

### Images

- Never serve files from `brand/` directly — those are masters. Import photos through Astro's `<Image>`/`<Picture>` components so they get resized and converted to AVIF/WebP at build time; only hand-optimized assets go into `public/`.
- Every image needs explicit `width` and `height` (prevents layout shift) and `loading="lazy"` below the fold. The hero image is the exception: not lazy, `fetchpriority="high"`.
- Budget as a sanity check: hero ≤ 200 KB, everything else ≤ 100 KB. `ls -S dist/_astro/*.{avif,webp,jpg,png}` after a build shows the offenders immediately.

### Before launch

- Run the QA gate across all routes: `node tools/qa/qa.mjs http://localhost:4321 /,/impressum,/datenschutz` (see [Visual QA](#visual-qa)).
- Verify the pages every German business site legally needs exist and are linked from the footer: Impressum and Datenschutzerklärung.

## Project structure

| Path | Purpose |
| --- | --- |
| `brand/` | Source material for the brand, including original logos, approved photos, legal texts and other assets that define the company identity. Keep master files here, including formats that are not served by the website. |
| `design/` | Design references such as page mockups, visual explorations and approved screen designs. These files guide implementation but are not part of the deployed website. |
| `docs/` | Project documentation such as design decisions, technical specifications and implementation plans. Keep documentation about how or why the website works here, not runtime content or source code. |
| `public/` | Static files served directly by the website, such as favicons, production logos and optimized photos. Copy only assets needed at runtime from `brand/` into this folder. |
| `src/` | The Astro website implementation, including pages, layouts, components, styles, content configuration and server-side application code. |
| `src/styles/global.css` | Tailwind entry point and [shadcn/ui](https://ui.shadcn.com/) theme tokens. The color values are placeholders (Nova preset) — override them per project to match the site's brand. |
| `dist/` | Build output (`npm run build`). Plain `dist` is Astro's default and correct for this purely static site. If the project later adds a server-side resource (e.g. a database, KV sessions), Astro splits the build into `dist/client` (the real static assets) and `dist/server` (its own SSR runtime, unused in this deployment) — at that point, set `outDir` to `dist/client` instead, since pointing the deploy step at plain `dist` then fails silently: no build error, just 404s on every static asset, including after a correct preview login. |

## Impeccable

This project uses [Impeccable](https://impeccable.style/) for frontend design guidance and visual review. The project-level skills live in `.agents/skills/impeccable/` and `.claude/skills/impeccable/`.

```bash
npx impeccable check
npx impeccable update
```

Updates are also checked monthly by `.github/workflows/update-impeccable.yml`.

## Visual QA

The scripts in `tools/qa/` work with any local dev server. The required dev dependencies (Playwright and axe-core) are part of `package.json` — `npm install` is enough. The two main entry points are also available as npm scripts: `npm run qa` and `npm run shot`.

Every script takes `[BASE_URL] [ROUTES]` as its first two arguments. `BASE_URL` defaults to `http://localhost:4321`, `ROUTES` is a comma-separated list of paths defaulting to `/`. Screenshot output defaults to `.tmp/shots/`, which is created automatically and ignored by Git.

| Script | Command | Purpose |
| --- | --- | --- |
| `qa.mjs` | `node tools/qa/qa.mjs [BASE_URL] [ROUTES]` | Single QA gate: runs the console, a11y, overflow and contrast checks and exits with code 1 if any fail. |
| `check-console.mjs` | `node tools/qa/check-console.mjs [BASE_URL] [ROUTES]` | Checks routes for console errors, page errors and failed network requests. Exits with code 1 on failure. |
| `a11y.mjs` | `node tools/qa/a11y.mjs [BASE_URL] [ROUTES]` | Checks routes for WCAG 2.x A/AA violations with axe-core. Exits with code 1 on failure. |
| `narrow.mjs` | `node tools/qa/narrow.mjs [BASE_URL] [ROUTES] [OUT_DIR] [WIDTHS]` | Detects horizontal overflow at narrow widths. Defaults to 320 and 360 pixels and exits with code 1 on failure. |
| `contrast.mjs` | `node tools/qa/contrast.mjs --file tools/qa/contrast-pairs.mjs` | Checks the project-specific colour pairs in `contrast-pairs.mjs`. |
| `contrast.mjs` | `node tools/qa/contrast.mjs <fg> <bg> [large]` | Checks one colour pair against WCAG 2.2 AA. |
| `shot.mjs` | `node tools/qa/shot.mjs [BASE_URL] [ROUTES] [OUT_DIR]` | Captures desktop, tablet and mobile screenshots, page sections, the scrolled navigation and the open mobile menu. Not part of the gate — for visual review. |

Shared Playwright helpers (viewports, launch/teardown, animation settling) live in `tools/qa/lib/browser.mjs`.

Check multiple routes with a comma-separated list:

```bash
node tools/qa/qa.mjs http://localhost:4321 /,/impressum,/datenschutz
```

The contrast helpers can also be imported:

```js
import { ratio, check, checkPairs } from './tools/qa/contrast.mjs';
```

## Updating site repos from this template

Site repos are created from this one via GitHub's "Use this template", which copies the file tree once with no ongoing git relationship. `.github/workflows/update-template.yml` — itself copied into every new site repo — closes that gap: on a monthly schedule (or via `workflow_dispatch`), it pulls the paths listed in `.github/template-sync-paths.txt` from this repo and opens a PR in the site repo, the same two-job pattern (`prepare-update` builds a patch, `open-pull-request` applies it) as `update-impeccable.yml`.

This currently covers the legal document content and layout (`src/content/legal/`, `src/content.config.ts`, `src/layouts/LegalLayout.astro`, `src/pages/impressum.astro`, `src/pages/datenschutz.astro`) and shared tooling (`tools/qa/`, `tsconfig.json`). Add a path to `.github/template-sync-paths.txt` when something else in the template should propagate the same way — anything not listed is treated as site-specific and left alone.

Because this pulls in legal text, the resulting PR always needs a human review before merging, not an auto-merge.
