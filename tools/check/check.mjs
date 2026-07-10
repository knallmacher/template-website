import { runScript } from './run.mjs';

for (const script of ['format:check', 'astro:check', 'check:dashes']) {
  if (!runScript(script)) {
    process.exit();
  }
}
