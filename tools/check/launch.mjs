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
const legalFiles = readdirSync(legalDir).filter((file) => file.endsWith('.md'));

/** Company names listed after an "Empfänger:" block, for the pre-launch check. */
function collectRecipients(source) {
  const names = [];
  let collecting = false;
  for (const rawLine of source.split('\n')) {
    const line = rawLine.trim();
    // Heading form ("**Empfänger:**") followed by bullet lines.
    if (/^\*\*Empfänger/i.test(line)) {
      collecting = true;
      continue;
    }
    // Inline form ("Empfänger: Cloudflare Inc., ...").
    const inline = line.match(/^Empfänger:\s*(.+)$/i);
    if (inline) {
      names.push(inline[1].split(',')[0].trim());
      collecting = false;
      continue;
    }
    if (!collecting) continue;
    const bullet = line.match(/^-\s+(.+)/);
    if (bullet) {
      names.push(bullet[1].split(',')[0].trim());
      continue;
    }
    if (line !== '') collecting = false;
  }
  return names;
}

const recipients = new Set();

for (const filename of legalFiles) {
  const filePath = path.join(legalDir, filename);
  const relativePath = path.relative(root, filePath);
  const source = readFileSync(filePath, 'utf8');
  const lines = source.split('\n');

  for (const [index, line] of lines.entries()) {
    const placeholder = line.match(/\[[^\]\n]+\](?!\()/);
    if (placeholder) {
      report(`${relativePath}:${index + 1}`, placeholder[0]);
      continue;
    }
    // A line with an opening bracket but no closing one is the start of a
    // multi-line placeholder block that the single-line regex cannot see.
    if (line.includes('[') && !line.includes(']')) {
      report(`${relativePath}:${index + 1}`, 'unclosed "[" placeholder');
    }
  }

  // Angle-bracket editor instructions such as "<falls betroffen>". HTML
  // comments are stripped first: Markdown keeps them out of the rendered page,
  // and the analytics/cookie markers are deliberately written as comments.
  const withoutComments = source.replace(/<!--[\s\S]*?-->/g, '');
  for (const [index, line] of withoutComments.split('\n').entries()) {
    const instruction = line.match(/<[A-Za-zÄÖÜäöü][^>\n]*>/);
    if (instruction) {
      report(`${relativePath}:${index + 1}`, instruction[0]);
    }
  }

  // A Datenschutz page must ship exactly one analytics variant block; the
  // unused variant is deleted together with its markers.
  if (filename.includes('datenschutz')) {
    const open = (source.match(/<!--\s*ANALYSE:(?!\/)/g) || []).length;
    const close = (source.match(/<!--\s*\/ANALYSE:/g) || []).length;
    if (open !== 1 || close !== 1) {
      report(
        relativePath,
        `expected exactly one ANALYSE: block, found ${open} opening and ${close} closing marker(s)`,
      );
    }
  }

  // An entry still marked noindex in its frontmatter is a draft flag that has
  // to be cleared before launch.
  if (/^noindex:\s*true\s*$/im.test(source)) {
    report(relativePath, 'remove the draft noindex');
  }

  for (const name of collectRecipients(source)) recipients.add(name);
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

// A hardcoded robots noindex left in page markup (a staging leftover). The
// legal pages' noindex is data-driven through the collection field and always
// guarded by an Astro expression, so it is not a literal directive.
function findLiteralNoindex(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      return findLiteralNoindex(entryPath);
    }
    if (!entry.name.endsWith('.astro')) {
      return [];
    }
    const source = readFileSync(entryPath, 'utf8');
    const hasLiteralMeta = source
      .split('\n')
      .some((line) => /^\s*<meta\b/i.test(line) && /noindex/i.test(line));
    return hasLiteralMeta ? [entryPath] : [];
  });
}

for (const directory of ['src/pages', 'src/layouts', 'src/components']) {
  for (const filePath of findLiteralNoindex(path.join(root, directory))) {
    report(path.relative(root, filePath), 'remove the hardcoded noindex');
  }
}

const robotsTxt = readFileSync(path.join(root, 'public/robots.txt'), 'utf8');
if (/^Disallow:\s*$/m.test(robotsTxt)) {
  report('public/robots.txt', 'remove the root Disallow before launch');
}

if (recipients.size > 0) {
  console.log(
    'Named recipients - confirm these still match the deployment before launch:',
  );
  for (const name of [...recipients].sort()) console.log(`  - ${name}`);
  console.log('');
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
