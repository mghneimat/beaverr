#!/usr/bin/env node
/**
 * Generate docs/release-notes/YYYY-MM.md from CHANGELOG.md.
 * Run from repo root: node scripts/generate-release-notes.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.join(__dirname, '..');
const CHANGELOG = path.join(REPO_ROOT, 'CHANGELOG.md');
const OUT_DIR = path.join(REPO_ROOT, 'docs', 'release-notes');

const ENTRY_RE = /^(\[(\d{2}-\d{2}-\d{4}|\d{4}-\d{2}-\d{2})(?:\s+\d{2}:\d{2})?\]\s+)(.+)$/;

function monthKey(raw) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw.slice(0, 7);
  const m = raw.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (!m) return null;
  return `${m[3]}-${m[2]}`;
}

function monthLabel(yyyyMm) {
  const [y, m] = yyyyMm.split('-');
  const date = new Date(Number(y), Number(m) - 1, 1);
  return date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
}

function parseChangelog(content) {
  const groups = new Map();
  let current = null;

  for (const line of content.split(/\r?\n/)) {
    const match = line.match(ENTRY_RE);
    if (match) {
      current = monthKey(match[2]);
      if (!current) continue;
      if (!groups.has(current)) groups.set(current, []);
      groups.get(current).push(match[3].trim());
      continue;
    }
    if (current && line.trim()) {
      const arr = groups.get(current);
      arr[arr.length - 1] += ` ${line.trim()}`;
    }
  }
  return groups;
}

function formatEntry(entry) {
  const pipe = entry.indexOf(' | files:');
  const summary = pipe === -1 ? entry : entry.slice(0, pipe);
  const files = pipe === -1 ? '' : entry.slice(pipe + 9).trim();
  const dateMatch = summary.match(/^\[([^\]]+)\]\s+\[([^\]]+)\]\s+/);
  if (!dateMatch) return `- ${summary}`;
  const datePart = dateMatch[1].split(' ')[0];
  const rest = summary.slice(dateMatch[0].length);
  let bullet = `- **${datePart}** — ${rest}`;
  if (files) bullet += `\n  - Files: \`${files}\``;
  return bullet;
}

function writeMonth(yyyyMm, entries) {
  const label = monthLabel(yyyyMm);
  const body = `# Release notes — ${label}

> **Audience:** product, developer  
> **Canonical:** \`docs/release-notes/${yyyyMm}.md\`  
> **Generated from:** \`CHANGELOG.md\`

## Summary

${entries.length} change(s) in ${label}. See bullets below; full technical detail in \`CHANGELOG.md\`.

## Entries

${entries.map(formatEntry).join('\n\n')}
`;
  const outPath = path.join(OUT_DIR, `${yyyyMm}.md`);
  fs.writeFileSync(outPath, body, 'utf8');
  return outPath;
}

function main() {
  if (!fs.existsSync(CHANGELOG)) {
    console.error('CHANGELOG.md not found');
    process.exit(1);
  }
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const groups = parseChangelog(fs.readFileSync(CHANGELOG, 'utf8'));
  const written = [];
  for (const [month, entries] of [...groups.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    written.push(writeMonth(month, entries));
  }
  console.log(`Wrote ${written.length} release note file(s) to docs/release-notes/`);
  for (const f of written) console.log(`  ${path.relative(REPO_ROOT, f)}`);
}

main();
