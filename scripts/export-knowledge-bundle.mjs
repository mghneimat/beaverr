#!/usr/bin/env node
/**
 * Export static JS knowledge registries to supabase/functions/_shared/knowledgeBundle.json
 * Run: node scripts/export-knowledge-bundle.mjs
 */
import { KNOWLEDGE_CHUNKS } from '../lib/advice/knowledgeChunks.js';
import { COUNTRY_KNOWLEDGE_CHUNKS } from '../lib/advice/countryKnowledgeChunks.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.join(__dirname, '../supabase/functions/_shared/knowledgeBundle.json');

const book = KNOWLEDGE_CHUNKS.map((c) => ({
  id: c.id,
  source_id: c.source_id,
  locale: 'en',
  topic_tags: c.topic_tags,
  excerpt: c.excerpt,
  country_code: null,
}));

const country = COUNTRY_KNOWLEDGE_CHUNKS.map((c) => ({
  id: c.id,
  source_id: 'cz_official',
  locale: 'en',
  topic_tags: c.topic_tags,
  excerpt: c.excerpt,
  country_code: c.country_code,
  metadata: c.metadata,
}));

fs.writeFileSync(outPath, JSON.stringify({ book, country }, null, 2));
console.log(`Wrote ${book.length + country.length} chunks to ${outPath}`);
