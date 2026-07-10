import { spawnSync } from 'node:child_process';

export function runScript(name) {
  const result = spawnSync('npm', ['run', name], {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  if (result.error) {
    console.error(
      `Could not run npm script "${name}": ${result.error.message}`,
    );
    process.exitCode = 1;
    return false;
  }

  if (result.status !== 0) {
    process.exitCode = result.status ?? 1;
    return false;
  }

  return true;
}
