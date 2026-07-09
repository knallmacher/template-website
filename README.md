# template-website

Astro starter template [knallmacher](https://knallmacher.de) uses to build client websites: pre-wired with TypeScript, Tailwind, shadcn/ui, German legal-document scaffolding, automated design and accessibility QA.

## Table of Contents

- [Features](#features)
- [Quick Start](#quick-start)
- [How it Works](#how-it-works)
- [Installation & Development](#installation--development)
- [Testing](#testing)
- [Design & Content Best Practices](#design--content-best-practices)
- [Project Structure](#project-structure)
- [Updating Site Repos from This Template](#updating-site-repos-from-this-template)
- [Author & Licence](#author--licence)

## Features

- **Astro + React**: static-first site generation with React islands (`@astrojs/react`) for interactive components
- **Tailwind + shadcn/ui**: utility CSS and theme tokens in `src/styles/global.css`, ready to rebrand per client
- **Impeccable design review**: automated frontend design QA wired in as an agent skill, run on demand or via a scheduled update workflow
- **Visual QA suite**: Playwright + axe-core scripts covering console errors, accessibility, narrow-viewport overflow, and colour contrast
- **German legal document templates**: Impressum and Datenschutzerklärung as an Astro content collection, ready to fill in per client
- **Template sync workflow**: propagates shared updates (legal text, tooling, config) from this repo into site repos created from it

## Quick Start

### 1. Create a Site Repo from This Template

On GitHub, click "Use this template" on this repo, or:

```
gh repo create <client>-website --template knallmacher/template-website --private
```

This copies the file tree once — the new repo has no ongoing git relationship to this one (see [Updating Site Repos from This Template](#updating-site-repos-from-this-template) for how updates still reach it).

### 2. Install Dependencies

```
npm install
```

### 3. Rebrand

Replace the placeholder theme tokens in `src/styles/global.css` (the Nova preset) with the client's brand colours, and drop production logos/photos into `brand/` (see [Project Structure](#project-structure)).

### 4. Fill in the Legal Pages

`src/content/legal/impressum.md` and `datenschutz.md` ship with bracketed placeholders (`[Unternehmensname]`, `[Anschrift]`, and so on). Replace every bracket with the client's real details before launch — see [Design & Content Best Practices](#design--content-best-practices).

### 5. Run Locally

```
npm run dev
```

Astro serves the site at `http://localhost:4321`. `npm run build` produces the static `dist/` output; `npm run preview` serves that build locally.

## How it Works

**Impeccable.** [Impeccable](https://impeccable.style/) is a frontend design-quality tool: it reviews UI code for common design defects (inconsistent spacing, weak type hierarchy, poor contrast, and similar issues) the way a linter reviews code for bugs. It runs two ways here:

- On demand, as an agent skill (`.agents/skills/impeccable/`, `.claude/skills/impeccable/`) — a design-focused review pass alongside the coding agent's normal edits.
- As a hook that scans files immediately after they're written, surfacing findings inline during development.

`.github/workflows/update-impeccable.yml` checks monthly for a newer version of Impeccable's skill files and opens a PR if one exists.

**Legal documents.** The Impressum and Datenschutzerklärung live in `src/content/legal/` as an Astro content collection (`src/content.config.ts`), rendered through `src/layouts/LegalLayout.astro` at `/impressum` and `/datenschutz`. Keeping them as plain Markdown content, separate from page markup, is what makes the sync workflow below possible — the same files can be diffed and pulled into every site repo without touching site-specific code.

**Template sync.** Because a "Use this template" copy has no ongoing link back to this repo, `.github/workflows/update-template.yml` re-establishes one on a schedule, pulling an explicit allow-list of paths back from here. Details in [Updating Site Repos from This Template](#updating-site-repos-from-this-template).

## Installation & Development

1. **Clone the Repository**

   ```
   git clone https://github.com/knallmacher/template-website.git
   cd template-website
   ```

2. **Install Dependencies**

   ```
   npm install
   ```

3. **Configure the Brand**

   Override the theme tokens in `src/styles/global.css` and place client-specific assets in `brand/` and `public/`. There are no environment variables — this is a purely static site.

4. **Run Locally**

   ```
   npm run dev
   ```

## Testing

This project uses `Playwright` and `axe-core` for QA, driven through the scripts in `tools/qa/`. Run the full gate against a running dev server:

```
npm run qa
```

The gate covers console/page errors, WCAG 2.x A/AA accessibility violations, horizontal overflow at narrow viewports, and colour contrast.

Every script takes `[BASE_URL] [ROUTES]` as its first two arguments — `BASE_URL` defaults to `http://localhost:4321`, `ROUTES` is a comma-separated list of paths defaulting to `/`:

```
node tools/qa/qa.mjs http://localhost:4321 /,/impressum,/datenschutz
```

| Script | Command | Purpose |
| --- | --- | --- |
| `qa.mjs` | `node tools/qa/qa.mjs [BASE_URL] [ROUTES]` | Single QA gate: runs the console, a11y, overflow and contrast checks and exits with code 1 if any fail. |
| `check-console.mjs` | `node tools/qa/check-console.mjs [BASE_URL] [ROUTES]` | Checks routes for console errors, page errors and failed network requests. Exits with code 1 on failure. |
| `a11y.mjs` | `node tools/qa/a11y.mjs [BASE_URL] [ROUTES]` | Checks routes for WCAG 2.x A/AA violations with axe-core. Exits with code 1 on failure. |
| `narrow.mjs` | `node tools/qa/narrow.mjs [BASE_URL] [ROUTES] [OUT_DIR] [WIDTHS]` | Detects horizontal overflow at narrow widths. Defaults to 320 and 360 pixels and exits with code 1 on failure. |
| `contrast.mjs` | `node tools/qa/contrast.mjs --file tools/qa/contrast-pairs.mjs` | Checks the project-specific colour pairs in `contrast-pairs.mjs`. |
| `contrast.mjs` | `node tools/qa/contrast.mjs <fg> <bg> [large]` | Checks one colour pair against WCAG 2.2 AA. |
| `shot.mjs` | `node tools/qa/shot.mjs [BASE_URL] [ROUTES] [OUT_DIR]` | Captures desktop, tablet and mobile screenshots, page sections, the scrolled navigation and the open mobile menu. Not part of the gate — for visual review. |

Shared Playwright helpers (viewports, launch/teardown, animation settling) live in `tools/qa/lib/browser.mjs`. The contrast helpers can also be imported directly:

```js
import { ratio, check, checkPairs } from './tools/qa/contrast.mjs';
```

## Design & Content Best Practices

Impeccable covers design quality. These are the implementation practices it does not enforce — easy to overlook during development and expensive to retrofit before launch.

### Icons

- Use [Iconify](https://iconify.design/) and commit to one icon set per project (e.g. Lucide, Tabler or Phosphor). Mixing sets produces subtly inconsistent stroke widths and corner radii. In Astro, `astro-icon` with the matching `@iconify-json/*` package renders inline SVG at build time — no icon font, no runtime request.
- Never use emoji as UI icons. They render differently on every platform and ignore the colour system.

### Fonts

- Use open-source fonts and self-host them, e.g. via [Fontsource](https://fontsource.org/). Loading from the Google Fonts CDN is a GDPR problem for German sites. Self-hosting removes both the consent question and the third-party connection.
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

### Before Launch

- Run the QA gate across all routes: `node tools/qa/qa.mjs http://localhost:4321 /,/impressum,/datenschutz` (see [Testing](#testing)).
- Verify the pages every German business site legally needs exist and are linked from the footer: Impressum and Datenschutzerklärung, with every bracketed placeholder replaced.
- Have the filled-in legal text reviewed by qualified counsel — this template's Impressum/Datenschutzerklärung are a structural starting point, not a substitute for legal sign-off, and facts like which processors are used or whether cookies requiring consent are present differ per site.

## Project Structure

| Path | Purpose |
| --- | --- |
| `brand/` | Source material for the brand, including original logos, approved photos, legal texts and other assets that define the company identity. Keep master files here, including formats that are not served by the website. |
| `design/` | Design references such as page mockups, visual explorations and approved screen designs. These files guide implementation but are not part of the deployed website. |
| `docs/` | Project documentation such as design decisions, technical specifications and implementation plans. Keep documentation about how or why the website works here, not runtime content or source code. |
| `public/` | Static files served directly by the website, such as favicons, production logos and optimized photos. Copy only assets needed at runtime from `brand/` into this folder. |
| `src/` | The Astro website implementation, including pages, layouts, components, styles, content configuration and server-side application code. |
| `src/content/legal/` | Impressum and Datenschutzerklärung content, as an Astro content collection (see [How it Works](#how-it-works)). |
| `src/styles/global.css` | Tailwind entry point and [shadcn/ui](https://ui.shadcn.com/) theme tokens. The color values are placeholders (Nova preset) — override them per project to match the site's brand. |
| `tools/qa/` | Playwright/axe-core visual QA scripts (see [Testing](#testing)). |
| `dist/` | Build output (`npm run build`). Plain `dist` is Astro's default and correct for this purely static site. If the project later adds a server-side resource (e.g. a database, KV sessions), Astro splits the build into `dist/client` (the real static assets) and `dist/server` (its own SSR runtime, unused in this deployment) — at that point, set `outDir` to `dist/client` instead, since pointing the deploy step at plain `dist` then fails silently: no build error, just 404s on every static asset, including after a correct preview login. |

## Updating Site Repos from This Template

Site repos are created from this one via GitHub's "Use this template", which copies the file tree once with no ongoing git relationship. `.github/workflows/update-template.yml` — itself copied into every new site repo — closes that gap: on a monthly schedule (or via `workflow_dispatch`), it pulls the paths listed in `.github/template-sync-paths.txt` from this repo and opens a PR in the site repo, the same two-job pattern (`prepare-update` builds a patch, `open-pull-request` applies it) as `update-impeccable.yml`. It no-ops when run inside this template repo itself.

This repo is public specifically so that checkout works anonymously — no credential needs to be provisioned or rotated in every site repo. Nothing in here is confidential: the legal documents are bracketed placeholders, and the tooling is generic scaffolding.

This currently covers the legal document content and layout (`src/content/legal/`, `src/content.config.ts`, `src/layouts/LegalLayout.astro`, `src/pages/impressum.astro`, `src/pages/datenschutz.astro`) and shared tooling (`tools/qa/`, `tsconfig.json`). Add a path to `.github/template-sync-paths.txt` when something else in the template should propagate the same way — anything not listed is treated as site-specific and left alone.

Because this pulls in legal text, the resulting PR always needs a human review before merging, not an auto-merge.

## Author & Licence

Maintained by [knallmacher](https://knallmacher.de) and licensed under the [MIT licence](LICENSE).
