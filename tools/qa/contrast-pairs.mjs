/**
 * contrast-pairs.mjs — Project colour pairs to verify
 *
 * TEMPLATE EXAMPLE: the pairs below come from knallmacher.de. When starting a
 * new project, replace them with this project's own palette — one entry per
 * fg/bg combination the design actually uses. Keep the file in sync with the
 * CSS tokens whenever a colour changes.
 *
 * Run: node tools/qa/contrast.mjs --file tools/qa/contrast-pairs.mjs
 *
 * Format: [label, fg, bg, isLargeText?]
 * Large text = ≥18 px regular or ≥14 px bold (WCAG 2.2 AA threshold drops to 3:1)
 */

export default [
  // Dark sections (hard-black bg)
  ['hero lede', '#c7c7c7', '#191919'],
  ['hero trust items', '#d6d6d6', '#191919'],
  ['muted-on-dark', '#a8a8a8', '#191919'],
  ['ink-on-dark body', '#f4f4f4', '#191919'],

  // Light sections (white / worktop-gray bg)
  ['body-gray on white', '#636363', '#ffffff'],
  ['body-gray on worktop', '#636363', '#f9f9f9'],

  // Proof section
  ['frame tag label', '#636363', '#ffffff'],
  ['mock url bar text', '#636363', '#ffffff'],

  // Offer / pricing
  ['pricing terms muted', '#e2e2e2', '#191919'],

  // Brand accent on dark (large text — display weight at 90 px+)
  ['blast-orange on black', '#f74932', '#191919', true],
  ['white on blast-orange', '#ffffff', '#f74932', true],
  ['black on blast-orange', '#191919', '#f74932', true],

  // Manifesto band (orange bg)
  ['manifesto body on orange', '#191919', '#f74932'],

  // Buttons
  ['white on hard-black btn', '#ffffff', '#191919'],
  ['action-blue focus ring', '#0a65db', '#ffffff', true],
];
