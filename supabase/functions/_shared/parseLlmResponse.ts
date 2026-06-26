import {
  ADVICE_FOCUS_AREAS,
  ADVICE_MAX_BULLETS,
  ADVICE_MAX_WORDS,
  ADVICE_OUTPUT_SCHEMA_KEYS,
} from './constants.ts';

function countWords(...parts: string[]) {
  return parts
    .join(' ')
    .split(/\s+/)
    .filter(Boolean).length;
}

export function parseLlmResponseJson(raw: unknown) {
  let parsed: Record<string, unknown> = raw as Record<string, unknown>;
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    const jsonBlock = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
    const toParse = jsonBlock ? jsonBlock[1].trim() : trimmed;
    try {
      parsed = JSON.parse(toParse);
    } catch {
      return { ok: false as const, error: 'invalid_json' };
    }
  }

  if (!parsed || typeof parsed !== 'object') {
    return { ok: false as const, error: 'not_object' };
  }

  for (const key of ADVICE_OUTPUT_SCHEMA_KEYS) {
    if (!(key in parsed)) {
      return { ok: false as const, error: `missing_key:${key}` };
    }
  }

  const headline = parsed.headline;
  const bullets = parsed.bullets;
  const focusArea = parsed.focus_area;
  const citationsUsed = parsed.citations_used;

  if (typeof headline !== 'string' || !headline.trim()) {
    return { ok: false as const, error: 'invalid_headline' };
  }

  if (!Array.isArray(bullets) || bullets.length === 0) {
    return { ok: false as const, error: 'invalid_bullets' };
  }

  if (bullets.length > ADVICE_MAX_BULLETS) {
    return { ok: false as const, error: 'too_many_bullets' };
  }

  if (!bullets.every((b) => typeof b === 'string' && b.trim())) {
    return { ok: false as const, error: 'invalid_bullet_item' };
  }

  if (!ADVICE_FOCUS_AREAS.includes(focusArea as (typeof ADVICE_FOCUS_AREAS)[number])) {
    return { ok: false as const, error: 'invalid_focus_area' };
  }

  if (!Array.isArray(citationsUsed)) {
    return { ok: false as const, error: 'invalid_citations_used' };
  }

  const wordCount = countWords(headline, ...(bullets as string[]));
  if (wordCount > ADVICE_MAX_WORDS) {
    return { ok: false as const, error: 'word_count_exceeded' };
  }

  return {
    ok: true as const,
    narrative: {
      headline: headline.trim(),
      bullets: (bullets as string[]).map((b) => b.trim()),
      focus_area: focusArea,
      citations_used: citationsUsed,
    },
  };
}

export function validateCitationsUsed(narrative: { citations_used: unknown[] }, sentKbChunkIds: string[]) {
  const allowed = new Set(sentKbChunkIds);
  for (const id of narrative.citations_used) {
    if (typeof id !== 'string' || !allowed.has(id)) {
      return { ok: false as const, error: 'citation_not_in_kb' };
    }
  }
  return { ok: true as const };
}
