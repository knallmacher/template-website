# Design & Content Best Practices

Impeccable covers design quality. These are the implementation practices it does not enforce - easy to overlook during development and expensive to retrofit before launch.

## Icons

- Use [Iconify](https://iconify.design/) and commit to one icon set per project (e.g. Lucide, Tabler or Phosphor). Mixing sets produces subtly inconsistent stroke widths and corner radii. In Astro, `astro-icon` with the matching `@iconify-json/*` package renders inline SVG at build time - no icon font, no runtime request.
- Never use emoji as UI icons. They render differently on every platform and ignore the colour system.

## Fonts

- Use open-source fonts and self-host them, e.g. via [Fontsource](https://fontsource.org/). Loading from the Google Fonts CDN is a GDPR problem for German sites. Self-hosting removes both the consent question and the third-party connection.
- Ship `woff2` only, subset to the characters the site actually uses, set `font-display: swap`, and preload the one or two files used above the fold.

## Favicon

- Generate the full set from the production logo: `favicon.svg` (can adapt to dark mode via `prefers-color-scheme`), `favicon.ico` as fallback, `apple-touch-icon.png` (180 px) and a web manifest with 192/512 px icons plus `theme-color`.
- Check the favicon at 16 px in a real browser tab. Most logos need a simplified mark at that size - a scaled-down wordmark turns into noise.

## SEO

- Every page gets a unique `<title>` (~50–60 characters) and meta description (~150 characters), written for the searcher, not for the company. Front-load the term people actually search for.
- One `h1` per page; headings follow the document outline, not the visual size you want (style the size in CSS instead).
- Add Open Graph and Twitter card tags with a real 1200×630 preview image - company sites get shared in chats more often than they get googled.
- Generate `sitemap.xml` (`@astrojs/sitemap`) and `robots.txt`, set canonical URLs, and add JSON-LD `LocalBusiness`/`Organization` structured data with name, address and opening hours.
- Write copy so the first viewport answers what the company does, for whom, and where. Search engines and visitors give up at the same speed.

## Images

- Never serve files from `brand/` directly - those are masters. Import photos through Astro's `<Image>`/`<Picture>` components so they get resized and converted to AVIF/WebP at build time; only hand-optimized assets go into `public/`.
- Every image needs explicit `width` and `height` (prevents layout shift) and `loading="lazy"` below the fold. The hero image is the exception: not lazy, `fetchpriority="high"`.
- Budget as a sanity check: hero ≤ 200 KB, everything else ≤ 100 KB. `ls -S dist/_astro/*.{avif,webp,jpg,png}` after a build shows the offenders immediately.

## Before Launch

Run through [launch-checklist.md](launch-checklist.md) before any site built from this template goes live.
