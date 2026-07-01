import {
  ADVICE_COACH_PARAGRAPHS,
  ADVICE_MAX_WORDS,
  ADVICE_MIN_WORDS,
  ADVICE_OUTPUT_SCHEMA_KEYS,
  ADVICE_SPARSE_MAX_WORDS,
  ADVICE_SPARSE_MIN_WORDS,
} from './constants.ts';

function countWords(...parts: string[]) {
  return parts
    .join(' ')
    .split(/\s+/)
    .filter(Boolean).length;
}

export function narrativeText(narrative: { paragraphs: string[] }) {
  return narrative.paragraphs.join(' ');
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

  const paragraphs = parsed.paragraphs;
  if (!Array.isArray(paragraphs) || paragraphs.length === 0) {
    return { ok: false as const, error: 'invalid_paragraphs' };
  }

  const count = paragraphs.length;
  if (count !== ADVICE_COACH_PARAGRAPHS && count !== 1) {
    return { ok: false as const, error: 'invalid_paragraph_count' };
  }

  if (!paragraphs.every((p) => typeof p === 'string' && (p as string).trim())) {
    return { ok: false as const, error: 'invalid_paragraph_item' };
  }

  const trimmed = (paragraphs as string[]).map((p) => p.trim());
  const wordCount = countWords(...trimmed);

  if (count === 1) {
    if (wordCount < ADVICE_SPARSE_MIN_WORDS || wordCount > ADVICE_SPARSE_MAX_WORDS) {
      return { ok: false as const, error: 'sparse_word_count_out_of_range' };
    }
  } else if (wordCount < ADVICE_MIN_WORDS || wordCount > ADVICE_MAX_WORDS) {
    return { ok: false as const, error: 'word_count_out_of_range' };
  }

  return {
    ok: true as const,
    narrative: { paragraphs: trimmed },
  };
}
