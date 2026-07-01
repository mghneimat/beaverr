export const CHAT_OUTPUT_SCHEMA_KEYS = ['reply', 'used_kb_ids'];

/**
 * @param {unknown} raw
 * @param {string[]} [allowedKbIds]
 */
export function parseChatResponseJson(raw, allowedKbIds = []) {
  let parsed = raw;
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    const jsonBlock = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
    const toParse = jsonBlock ? jsonBlock[1].trim() : trimmed;
    try {
      parsed = JSON.parse(toParse);
    } catch {
      return { ok: false, error: 'invalid_json' };
    }
  }

  if (!parsed || typeof parsed !== 'object') {
    return { ok: false, error: 'not_object' };
  }

  for (const key of CHAT_OUTPUT_SCHEMA_KEYS) {
    if (!(key in parsed)) {
      return { ok: false, error: `missing_key:${key}` };
    }
  }

  const reply = parsed.reply;
  if (typeof reply !== 'string' || !reply.trim()) {
    return { ok: false, error: 'invalid_reply' };
  }

  const usedKbIds = parsed.used_kb_ids;
  if (!Array.isArray(usedKbIds)) {
    return { ok: false, error: 'invalid_used_kb_ids' };
  }

  if (!usedKbIds.every((id) => typeof id === 'string')) {
    return { ok: false, error: 'invalid_used_kb_id_item' };
  }

  const allowed = new Set(allowedKbIds);
  const filtered = usedKbIds
    .map((id) => id.trim())
    .filter((id) => id && allowed.has(id));

  return {
    ok: true,
    reply: reply.trim(),
    used_kb_ids: [...new Set(filtered)],
  };
}
