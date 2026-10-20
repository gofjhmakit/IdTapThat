#!/usr/bin/env node
// Verifies the token contract and WCAG contrast ratios for every theme in themes.css.
// Usage: node design/themes/check-contrast.js
const fs = require('fs');
const path = require('path');

const css = fs.readFileSync(path.join(__dirname, 'themes.css'), 'utf8');
const REQUIRED = ['--bg','--surface','--surface2','--accent','--accent-rgb','--accent-hover','--accent2',
  '--accent-end','--gold','--gold-rgb','--teal','--teal-rgb','--text','--muted','--border','--border-hover',
  '--on-accent','--tint-rgb','--scrim-rgb','--bg-glow','--bg-image','--logo-grad','--logo-glow',
  '--font-display','--radius','--meta-color'];

const themes = {};
for (const m of css.matchAll(/:root\[data-theme="([\w-]+)"\]\s*\{([^}]*)\}/g)) {
  const tokens = {};
  for (const d of m[2].matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) tokens[d[1]] = d[2].trim();
  themes[m[1]] = tokens;
}

const hex = h => {
  h = h.replace('#', '');
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16));
};
const lum = rgb => {
  const [r, g, b] = rgb.map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => { const [x, y] = [lum(hex(a)), lum(hex(b))].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

// [fg, bg, minimum, ideal]
const PAIRS = [
  ['--text', '--bg', 4.5, 7], ['--text', '--surface', 4.5, 7], ['--text', '--surface2', 4.5, 7],
  ['--muted', '--bg', 4.5], ['--muted', '--surface', 4.5],
  ['--on-accent', '--accent', 4.5], ['--on-accent', '--accent-hover', 4.5],
  ['--on-accent', '--accent-end', 3],          // big bold CTA text = WCAG large text
  ['#fff', '--accent2', 4.5],                   // set / career button label
  ['--gold', '--bg', 4.5], ['--teal', '--bg', 4.5], ['--accent', '--bg', 3], // UI-component contrast
];

let failures = 0;
for (const [id, t] of Object.entries(themes)) {
  const missing = REQUIRED.filter(k => !(k in t));
  const rgbBad = ['accent', 'gold', 'teal'].filter(k => hex(t['--' + k]).join(',') !== t[`--${k}-rgb`].replace(/\s/g, ''));
  console.log(`\n${id}${missing.length ? '  MISSING: ' + missing.join(' ') : ''}${rgbBad.length ? '  RGB MISMATCH: ' + rgbBad.join(' ') : ''}`);
  if (missing.length || rgbBad.length) failures++;
  for (const [f, b, min, ideal] of PAIRS) {
    const fc = f.startsWith('#') ? f : t[f], bc = t[b];
    const r = ratio(fc, bc);
    const tag = r < min ? 'FAIL' : ideal && r < ideal ? 'ok  ' : 'PASS';
    if (r < min) failures++;
    console.log(`  ${tag} ${(f + ' on ' + b).padEnd(28)} ${r.toFixed(2).padStart(5)}:1  (min ${min}${ideal ? ', ideal ' + ideal : ''})`);
  }
}
console.log(`\n${Object.keys(themes).length} themes checked, ${failures} failure(s).`);
process.exitCode = failures ? 1 : 0;
