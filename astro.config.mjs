import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // Plain 'dist' is Astro's default and correct for a purely static site.
  // Only switch to 'dist/client' if this project starts using a server-side
  // resource (e.g. a database, KV sessions) — that's what makes Astro split
  // the build into dist/client (static assets) and dist/server (SSR runtime).
  outDir: './dist',
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
});
