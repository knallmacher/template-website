/**
 * no-dashes.mjs — Bans em dashes (—, U+2014) and en dashes (–, U+2013) from
 * content that ends up readable on the site.
 *
 * Usage:
 *   node tools/qa/no-dashes.mjs
 *
 * Scans:
 *   src/content/**\/*.md   whole file (rendered as page content)
 *   src/**\/*.astro        template only — frontmatter (the leading --- block)
 *                          is stripped first, since it's code, not rendered output
 *
 * Exits with code 1 if any match is found.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DASH_RE = /[–—]/u;

const dir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(dir, '../../src');

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

function stripAstroFrontmatter(text) {
  if (!text.startsWith('---')) return text;
  const close = text.indexOf('\n---', 3);
  if (close === -1) return text;
  const afterFence = text.indexOf('\n', close + 1);
  return afterFence === -1 ? '' : text.slice(afterFence + 1);
}

function findViolations(file, text) {
  const violations = [];
  text.split('\n').forEach((line, i) => {
    if (DASH_RE.test(line)) {
      violations.push({ file, line: i + 1, text: line.trim() });
    }
  });
  return violations;
}

const files = walk(root).filter((f) => {
  const rel = path.relative(root, f);
  if (f.endsWith('.md')) return rel.startsWith(`content${path.sep}`);
  return f.endsWith('.astro');
});

const violations = files.flatMap((f) => {
  const raw = readFileSync(f, 'utf8');
  const text = f.endsWith('.astro') ? stripAstroFrontmatter(raw) : raw;
  return findViolations(path.relative(process.cwd(), f), text);
});

if (violations.length === 0) {
  console.log(`PASS  no em/en dashes in ${files.length} file(s) checked`);
  process.exitCode = 0;
} else {
  console.log(`FAIL  ${violations.length} em/en dash occurrence(s):\n`);
  for (const v of violations) {
    console.log(`  ${v.file}:${v.line}  ${v.text}`);
  }
  process.exitCode = 1;
}
