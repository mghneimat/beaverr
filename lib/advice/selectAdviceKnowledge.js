/**
 * Merges book + country knowledge chunks for advice/chat requests.
 */

import { selectKnowledgeChunks } from './knowledgeChunkRouter.js';
import {
  countryCodeFromSnapshot,
  selectCountryKnowledgeChunks,
} from './countryKnowledgeRouter.js';

const MAX_BOOK_CHUNKS = 2;
const MAX_COUNTRY_CHUNKS = 2;
const MAX_TOTAL_CHUNKS = 4;

/**
 * @param {{
 *   snapshot: object,
 *   triggered_rules: object[],
 *   tabKey?: string,
 *   userMessage?: string,
 * }} input
 * @returns {{ id: string, excerpt: string, title?: string, official_url?: string, last_reviewed?: string }[]}
 */
export function selectAdviceKnowledge({
  snapshot,
  triggered_rules,
  tabKey,
  userMessage,
}) {
  const resolvedTab = tabKey || snapshot?.tab_key || 'home';
  const countryCode = countryCodeFromSnapshot(snapshot);

  const bookChunks = selectKnowledgeChunks(triggered_rules, resolvedTab).slice(
    0,
    MAX_BOOK_CHUNKS,
  );

  const countryChunks = selectCountryKnowledgeChunks({
    country_code: countryCode,
    tabKey: resolvedTab,
    triggered_rules,
    userMessage,
  }).slice(0, MAX_COUNTRY_CHUNKS);

  const merged = [];
  const seen = new Set();

  for (const chunk of [...bookChunks, ...countryChunks]) {
    if (!chunk?.id || seen.has(chunk.id)) continue;
    seen.add(chunk.id);
    merged.push(chunk);
    if (merged.length >= MAX_TOTAL_CHUNKS) break;
  }

  return merged;
}

/**
 * @param {{ id: string, title?: string, official_url?: string, last_reviewed?: string }[]} kbChunks
 * @returns {{ id: string, title: string, official_url: string, last_reviewed?: string }[]}
 */
export function extractOfficialSources(kbChunks) {
  if (!Array.isArray(kbChunks)) return [];
  return kbChunks
    .filter((c) => c.official_url && c.title)
    .map((c) => ({
      id: c.id,
      title: c.title,
      official_url: c.official_url,
      last_reviewed: c.last_reviewed,
    }));
}
