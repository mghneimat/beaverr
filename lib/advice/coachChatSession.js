import { getData, setData, removeData } from '../storage.js';
import { STORAGE_KEYS } from '../beaverrConstants.js';

/**
 * @typedef {Object} CoachChatSession
 * @property {string|null} userId
 * @property {number} sessionKey
 * @property {string|null} threadId
 * @property {{ role: string, content: string }[]} messages
 * @property {object[]} sources
 * @property {string} tabKey
 * @property {string|null} contextKey
 * @property {number} updatedAt
 */

/**
 * @param {{ tabKey: string, snapshot?: object }|null} ctx
 */
export function buildCoachChatContextKey(ctx) {
  if (!ctx) return 'general';
  const snap = ctx.snapshot ?? {};
  const ledger = snap.ledger ?? {};
  return `${ctx.tabKey}:${ledger.income_m ?? 0}:${ledger.fix_ratio ?? 0}:${ledger.surplus_m ?? 0}`;
}

/** @returns {Promise<CoachChatSession|null>} */
export async function loadCoachChatSession() {
  const saved = await getData(STORAGE_KEYS.coachChat);
  if (!saved || typeof saved !== 'object') return null;
  if (!Array.isArray(saved.messages)) return null;
  return /** @type {CoachChatSession} */ (saved);
}

/** @param {CoachChatSession} session */
export async function saveCoachChatSession(session) {
  await setData(STORAGE_KEYS.coachChat, {
    ...session,
    updatedAt: Date.now(),
  });
}

export async function clearCoachChatSession() {
  await removeData(STORAGE_KEYS.coachChat);
}
