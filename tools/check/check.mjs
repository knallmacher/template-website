import { runScript } from './run.mjs';

for (const script of ['astro:check', 'check:dashes']) {
  if (!runScript(script)) {
    process.exit();
  }
}
