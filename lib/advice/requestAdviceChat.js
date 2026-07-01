import { getSupabase } from '../supabase.js';

/**
 * Send a coach chat message via Supabase Edge Function.
 * @param {{
 *   thread_id?: string,
 *   message: string,
 *   tab_key: string,
 *   locale: string,
 *   snapshot: object,
 *   triggered_rules?: object[],
 *   coach_paragraphs?: string[],
 *   kb_chunks?: object[],
 *   household_id?: string,
 * }} input
 * @returns {Promise<
 *   | { ok: true, thread_id: string, reply: string, sources: object[] }
 *   | { ok: false, error: string, detail?: string }
 * >}
 */
export async function requestAdviceChat(input) {
  const supabase = getSupabase();
  if (!supabase) {
    return { ok: false, error: 'supabase_not_configured' };
  }

  const { data, error } = await supabase.functions.invoke('advice-chat', {
    body: input,
  });

  if (error) {
    return { ok: false, error: 'edge_invoke_failed', detail: error.message };
  }

  if (data?.status === 'ok' && data.reply) {
    return {
      ok: true,
      thread_id: data.thread_id,
      reply: data.reply,
      sources: Array.isArray(data.sources) ? data.sources : [],
    };
  }

  return {
    ok: false,
    error: data?.error || 'unknown_response',
    detail: data?.detail,
  };
}
