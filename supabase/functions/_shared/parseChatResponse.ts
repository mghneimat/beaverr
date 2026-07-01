export const CHAT_OUTPUT_SCHEMA_KEYS = ["reply", "used_kb_ids"] as const;

export function parseChatResponseJson(raw: unknown, allowedKbIds: string[] = []) {
  let parsed: Record<string, unknown> = raw as Record<string, unknown>;
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    const jsonBlock = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
    const toParse = jsonBlock ? jsonBlock[1].trim() : trimmed;
    try {
      parsed = JSON.parse(toParse);
    } catch {
      return { ok: false as const, error: "invalid_json" };
    }
  }

  if (!parsed || typeof parsed !== "object") {
    return { ok: false as const, error: "not_object" };
  }

  for (const key of CHAT_OUTPUT_SCHEMA_KEYS) {
    if (!(key in parsed)) {
      return { ok: false as const, error: `missing_key:${key}` };
    }
  }

  const reply = parsed.reply;
  if (typeof reply !== "string" || !reply.trim()) {
    return { ok: false as const, error: "invalid_reply" };
  }

  const usedKbIds = parsed.used_kb_ids;
  if (!Array.isArray(usedKbIds)) {
    return { ok: false as const, error: "invalid_used_kb_ids" };
  }

  if (!usedKbIds.every((id) => typeof id === "string")) {
    return { ok: false as const, error: "invalid_used_kb_id_item" };
  }

  const allowed = new Set(allowedKbIds);
  const filtered = (usedKbIds as string[])
    .map((id) => id.trim())
    .filter((id) => id && allowed.has(id));

  return {
    ok: true as const,
    reply: reply.trim(),
    used_kb_ids: [...new Set(filtered)],
  };
}
