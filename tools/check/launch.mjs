import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..',
);
const failures = [];

function report(label, detail) {
  failures.push(`${label}: ${detail}`);
}

const legalDir = path.join(root, 'src/content/legal');
for (const filename of readdirSync(legalDir).filter((file) =>
  file.endsWith('.md'),
)) {
  const filePath = path.join(legalDir, filename);
  const lines = readFileSync(filePath, 'utf8').split('\n');

  lines.forEach((line, index) => {
    const placeholder = line.match(/\[[^\]\n]+\](?!\()/);
    if (placeholder) {
      report(`${path.relative(root, filePath)}:${index + 1}`, placeholder[0]);
    }
  });
}

const astroConfigPath = path.join(root, 'astro.config.mjs');
const astroConfig = readFileSync(astroConfigPath, 'utf8');
if (astroConfig.includes('example.com')) {
  report('astro.config.mjs', 'replace the example.com production URL');
}

const pagesDir = path.join(root, 'src/pages');
function findAstroPages(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      return findAstroPages(entryPath);
    }
    return entry.name.endsWith('.astro') ? [entryPath] : [];
  });
}

for (const filePath of findAstroPages(pagesDir)) {
  const filename = path.basename(filePath);
  if (filename === 'impressum.astro' || filename === 'datenschutz.astro') {
    continue;
  }

  const source = readFileSync(filePath, 'utf8');
  if (!source.includes('<Seo')) {
    report(path.relative(root, filePath), 'add the shared Seo component');
  }
}

const requiredAssets = [
  ['public/favicon.svg', 'favicon.svg'],
  ['public/favicon.ico', 'favicon.ico'],
  ['public/apple-touch-icon.png', 'apple-touch-icon.png'],
  ['public/site.webmanifest', 'site.webmanifest'],
];
for (const [relativePath, label] of requiredAssets) {
  if (!existsSync(path.join(root, relativePath))) {
    report('public assets', `add ${label}`);
  }
}

const publicFiles = readdirSync(path.join(root, 'public'));
if (!publicFiles.some((file) => /^og-image\.(png|jpe?g|webp)$/i.test(file))) {
  report(
    'public assets',
    'add an og-image.png, og-image.jpg or og-image.webp file',
  );
}

if (
  !existsSync(path.join(root, 'src/pages/404.astro')) &&
  !existsSync(path.join(root, 'public/404.html'))
) {
  report('404 page', 'add src/pages/404.astro or public/404.html');
}

function findNoindex(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      return findNoindex(entryPath);
    }
    if (!entry.name.endsWith('.astro')) {
      return [];
    }
    const source = readFileSync(entryPath, 'utf8');
    return /noindex/i.test(source) ? [entryPath] : [];
  });
}

for (const directory of ['src/pages', 'src/layouts', 'src/components']) {
  for (const filePath of findNoindex(path.join(root, directory))) {
    report(path.relative(root, filePath), 'remove staging noindex');
  }
}

const robotsTxt = readFileSync(path.join(root, 'public/robots.txt'), 'utf8');
if (/^Disallow:\s*$/m.test(robotsTxt)) {
  report('public/robots.txt', 'remove the root Disallow before launch');
}

if (failures.length === 0) {
  console.log('Launch check passed.');
  process.exit(0);
}

console.error('Launch check failed:');
for (const failure of failures) {
  console.error(`- ${failure}`);
}
console.error('\nConfigure these values before deployment.');
process.exit(1);
