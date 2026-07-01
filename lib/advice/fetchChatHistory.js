import { getSupabase } from '../supabase.js';

/**
 * @typedef {{
 *   id: string,
 *   tabKey: string,
 *   updatedAt: string,
 *   preview: string,
 *   messageCount: number,
 * }} ChatThreadSummary
 */

/**
 * @param {number} [limit]
 * @returns {Promise<{ ok: true, threads: ChatThreadSummary[] } | { ok: false, error: string }>}
 */
export async function fetchChatThreadList(limit = 25) {
  const supabase = getSupabase();
  if (!supabase) {
    return { ok: false, error: 'supabase_not_configured' };
  }

  const { data, error } = await supabase
    .from('advice_threads')
    .select(`
      id,
      tab_key,
      updated_at,
      advice_messages ( content, role, created_at )
    `)
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (error) {
    return { ok: false, error: error.message };
  }

  const threads = (data || [])
    .map((row) => {
      const msgs = Array.isArray(row.advice_messages) ? row.advice_messages : [];
      const sorted = [...msgs].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      );
      const firstUser = sorted.find((m) => m.role === 'user');
      return {
        id: row.id,
        tabKey: row.tab_key || 'home',
        updatedAt: row.updated_at,
        preview: (firstUser?.content || '').trim().slice(0, 100),
        messageCount: sorted.length,
      };
    })
    .filter((thread) => thread.messageCount > 0);

  return { ok: true, threads };
}

/**
 * @param {string} threadId
 * @returns {Promise<
 *   | { ok: true, messages: { role: string, content: string }[] }
 *   | { ok: false, error: string }
 * >}
 */
export async function fetchThreadMessages(threadId) {
  const supabase = getSupabase();
  if (!supabase) {
    return { ok: false, error: 'supabase_not_configured' };
  }

  const { data, error } = await supabase
    .from('advice_messages')
    .select('role, content')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true });

  if (error) {
    return { ok: false, error: error.message };
  }

  const messages = (data || [])
    .filter((m) => m?.role && m?.content)
    .map((m) => ({ role: m.role, content: m.content }));

  return { ok: true, messages };
}

/**
 * @param {string} threadId
 * @returns {Promise<{ ok: true } | { ok: false, error: string }>}
 */
export async function deleteChatThread(threadId) {
  const supabase = getSupabase();
  if (!supabase) {
    return { ok: false, error: 'supabase_not_configured' };
  }

  const { error } = await supabase.from('advice_threads').delete().eq('id', threadId);

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
