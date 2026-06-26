import { getSupabase } from '../supabase.js';

/**
 * Request AI advice narration via Supabase Edge Function (premium + auth required server-side).
 * @param {{
 *   snapshot: object,
 *   triggered_rules: object[],
 *   locale: string,
 *   kb_chunk_ids?: string[],
 *   household_id?: string,
 * }} input
 * @returns {Promise<
 *   | { ok: true, status: 'ok', narrative: object, cached: boolean, run_id: string | null }
 *   | { ok: true, status: 'skipped', reason: string }
 *   | { ok: false, error: string, detail?: string }
 * >}
 */
export async function requestAdviceNarrative(input) {
  const supabase = getSupabase();
  if (!supabase) {
    return { ok: false, error: 'supabase_not_configured' };
  }

  const { data, error } = await supabase.functions.invoke('advice-generate', {
    body: input,
  });

  if (error) {
    return { ok: false, error: 'edge_invoke_failed', detail: error.message };
  }

  if (data?.status === 'skipped') {
    return { ok: true, status: 'skipped', reason: data.reason };
  }

  if (data?.status === 'ok' && data.narrative) {
    return {
      ok: true,
      status: 'ok',
      narrative: data.narrative,
      cached: Boolean(data.cached),
      run_id: data.run_id ?? null,
    };
  }

  return {
    ok: false,
    error: data?.error || 'unknown_response',
    detail: data?.detail,
  };
}
