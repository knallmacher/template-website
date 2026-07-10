import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // Replace with the site's real production URL — required for the sitemap
  // integration and the Seo component's canonical/OG URLs to resolve correctly.
  site: 'https://example.com',
  // Plain 'dist' is Astro's default and correct for a purely static site.
  // Only switch to 'dist/client' if this project starts using a server-side
  // resource (e.g. a database, KV sessions) — that's what makes Astro split
  // the build into dist/client (static assets) and dist/server (SSR runtime).
  outDir: './dist',
  integrations: [react(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});
