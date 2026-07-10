/**
 * contrast.mjs — WCAG 2.2 contrast ratio utilities
 *
 * Importable:
 *   import { ratio, check, checkPairs } from './tools/qa/contrast.mjs'
 *
 * Standalone (single pair):
 *   node tools/qa/contrast.mjs '#636363' '#ffffff'
 *   node tools/qa/contrast.mjs '#f74932' '#191919' large
 *
 * Standalone (pairs file):
 *   node tools/qa/contrast.mjs --file tools/qa/contrast-pairs.mjs
 *   (the file must export a default array of [label, fg, bg, isLargeText?] tuples)
 *
 * WCAG 2.2 AA thresholds:
 *   Normal text  ≥ 4.5:1
 *   Large text   ≥ 3:1   (≥18px regular or ≥14px bold)
 *
 * Exits with code 1 if any pair fails.
 */

// ── Pure math ─────────────────────────────────────────────────────────────────

function toRgb(hex) {
  hex = hex.replace('#', '');
  if (hex.length === 3)
    hex = hex
      .split('')
      .map((c) => c + c)
      .join('');
  return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
}

function linearize(c) {
  c /= 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminance(hex) {
  const [r, g, b] = toRgb(hex).map(linearize);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function ratio(fg, bg) {
  const la = luminance(fg);
  const lb = luminance(bg);
  const hi = Math.max(la, lb);
  const lo = Math.min(la, lb);
  return (hi + 0.05) / (lo + 0.05);
}

export function check(fg, bg, large = false) {
  const r = ratio(fg, bg);
  const min = large ? 3 : 4.5;
  return { ratio: r, pass: r >= min, min };
}

export function checkPairs(pairs) {
  let fails = 0;
  for (const [label, fg, bg, large = false] of pairs) {
    const { ratio: r, pass, min } = check(fg, bg, large);
    if (!pass) fails++;
    console.log(
      `${pass ? 'PASS' : 'FAIL'}  ${r.toFixed(2)}:1  (need ${min})  ${label}  ${fg} on ${bg}`,
    );
  }
  const total = pairs.length;
  console.log(`\n${fails === 0 ? 'All pass' : `${fails}/${total} failed`}`);
  return { total, fails, passes: total - fails };
}

// ── Standalone mode ───────────────────────────────────────────────────────────

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const args = process.argv.slice(2);

  if (args[0] === '--file') {
    // Load a pairs file and run checkPairs against it.
    const file = args[1];
    if (!file) {
      console.error('Usage: --file <path-to-pairs-file.mjs>');
      process.exit(1);
    }
    const mod = await import(new URL(file, `file://${process.cwd()}/`).href);
    const pairs = mod.default;
    const { fails } = checkPairs(pairs);
    process.exit(fails > 0 ? 1 : 0);
  } else if (args[0]) {
    // Single pair from CLI: fg bg [large]
    const [fg, bg, sizeFlag] = args;
    const large = sizeFlag === 'large';
    const { ratio: r, pass, min } = check(fg, bg, large);
    console.log(
      `${pass ? 'PASS' : 'FAIL'}  ${r.toFixed(2)}:1  (need ${min})  ${fg} on ${bg}`,
    );
    process.exit(pass ? 0 : 1);
  } else {
    console.log(
      [
        'Usage:',
        '  node tools/qa/contrast.mjs <fg> <bg> [large]',
        '  node tools/qa/contrast.mjs --file <pairs-file.mjs>',
        '',
        'Examples:',
        "  node tools/qa/contrast.mjs '#636363' '#ffffff'",
        "  node tools/qa/contrast.mjs '#f74932' '#191919' large",
        '  node tools/qa/contrast.mjs --file tools/qa/contrast-pairs.mjs',
      ].join('\n'),
    );
  }
}
