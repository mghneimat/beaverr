export const MAX_CHAT_MESSAGE_LENGTH = 1000;
export const MAX_MESSAGES_PER_THREAD = 30;
export const MAX_DAILY_CHAT_MESSAGES = 40;

export function extractOfficialSources(
  kbChunks: { id: string; title?: string; official_url?: string; last_reviewed?: string }[],
) {
  if (!Array.isArray(kbChunks)) return [];
  return kbChunks
    .filter((c) => c.official_url && c.title)
    .map((c) => ({
      id: c.id,
      title: c.title as string,
      official_url: c.official_url as string,
      last_reviewed: c.last_reviewed,
    }));
}
