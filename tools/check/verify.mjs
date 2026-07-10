import { runScript } from './run.mjs';

for (const script of ['check', 'build']) {
  if (!runScript(script)) {
    process.exit();
  }
}
