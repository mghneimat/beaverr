import {
  BEAVERR_CHAT_SYSTEM_PROMPT,
  CHAT_PROMPT_VERSION,
} from './beaverrChatSystemPrompt.js';

export const MAX_CHAT_HISTORY_MESSAGES = 12;

/**
 * @param {{
 *   snapshot: object,
 *   triggered_rules?: object[],
 *   locale: string,
 *   tab_key?: string,
 *   coach_paragraphs?: string[],
 *   kb_chunks?: object[],
 *   history?: { role: string, content: string }[],
 *   message: string,
 * }} input
 */
export function buildChatRequest({
  snapshot,
  triggered_rules = [],
  locale,
  tab_key,
  coach_paragraphs = [],
  kb_chunks = [],
  history = [],
  message,
}) {
  const resolvedTab = tab_key || snapshot?.tab_key || 'home';
  const kbChunkIds = kb_chunks.map((c) => c.id).filter(Boolean);

  const contextPayload = {
    tab_key: resolvedTab,
    locale: locale || snapshot?.locale,
    snapshot,
    triggered_rules,
    coach_paragraphs,
    kb_chunks,
  };

  const trimmedHistory = history
    .filter((m) => m?.role && m?.content)
    .slice(-MAX_CHAT_HISTORY_MESSAGES);

  const contents = [];

  if (trimmedHistory.length === 0) {
    contents.push({
      role: 'user',
      parts: [
        {
          text: `Context for this conversation:\n${JSON.stringify(contextPayload)}\n\nUser question:\n${message}`,
        },
      ],
    });
  } else {
    for (const entry of trimmedHistory) {
      const role = entry.role === 'assistant' ? 'model' : 'user';
      contents.push({ role, parts: [{ text: entry.content }] });
    }
    const contextNote = `Reminder — current context (tab: ${resolvedTab}):\n${JSON.stringify({
      locale: contextPayload.locale,
      snapshot: contextPayload.snapshot,
      triggered_rules: contextPayload.triggered_rules,
      coach_paragraphs: contextPayload.coach_paragraphs,
      kb_chunks: contextPayload.kb_chunks,
    })}`;
    contents.push({
      role: 'user',
      parts: [{ text: `${contextNote}\n\nUser question:\n${message}` }],
    });
  }

  return {
    systemPrompt: BEAVERR_CHAT_SYSTEM_PROMPT,
    contents,
    promptVersion: CHAT_PROMPT_VERSION,
    kbChunkIds,
  };
}
