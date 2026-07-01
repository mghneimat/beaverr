import { useCallback, useState, useEffect, useRef } from 'react';
import { buildTabSnapshot } from './buildTabSnapshot.js';
import { evaluateTabAdviceRules } from './evaluateTabAdviceRules.js';
import { getLinkedHouseholdId } from '../cloud/syncHousehold.js';
import { requestAdviceChat } from './requestAdviceChat.js';
import { reportClientError } from '../admin/reportError.js';
import {
  clearCoachChatSession,
  loadCoachChatSession,
  saveCoachChatSession,
} from './coachChatSession.js';
import { fetchThreadMessages } from './fetchChatHistory.js';

/**
 * @param {{
 *   tabKey: import('./buildTabSnapshot.js').TabAdviceKey,
 *   financials: import('../householdBudget').HouseholdFinancials|null,
 *   locale: string,
 *   helpers?: object,
 *   triggeredRules?: object[],
 *   snapshot?: object,
 *   coachParagraphs?: string[],
 *   session: object|null,
 *   sessionKey?: number,
 *   contextKey?: string|null,
 * }} opts
 */
export function useCoachChat({
  tabKey,
  financials,
  locale,
  helpers = {},
  triggeredRules: seedRules,
  snapshot: seedSnapshot,
  coachParagraphs = [],
  session,
  sessionKey = 0,
  contextKey = null,
}) {
  const [threadId, setThreadId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [sources, setSources] = useState([]);
  const [phase, setPhase] = useState('idle');
  const [hydrated, setHydrated] = useState(false);
  const userId = session?.user?.id ?? null;
  const persistRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      persistRef.current = false;
      setHydrated(false);
      setThreadId(null);
      setMessages([]);
      setSources([]);
      setPhase('idle');

      if (!userId) {
        setHydrated(true);
        return;
      }

      const saved = await loadCoachChatSession();
      if (cancelled) return;

      if (
        saved
        && saved.userId === userId
        && saved.contextKey === contextKey
        && saved.sessionKey === sessionKey
        && Array.isArray(saved.messages)
        && saved.messages.length > 0
      ) {
        setThreadId(saved.threadId ?? null);
        setMessages(saved.messages);
        setSources(Array.isArray(saved.sources) ? saved.sources : []);
        setPhase('ready');
      }

      persistRef.current = true;
      setHydrated(true);
    }

    hydrate();
    return () => {
      cancelled = true;
    };
  }, [sessionKey, userId, contextKey]);

  useEffect(() => {
    if (!persistRef.current || !hydrated || !userId) return;

    if (messages.length === 0 && !threadId) {
      clearCoachChatSession().catch(() => {});
      return;
    }

    saveCoachChatSession({
      userId,
      sessionKey,
      threadId,
      messages,
      sources,
      tabKey,
      contextKey,
      updatedAt: Date.now(),
    }).catch(() => {});
  }, [sessionKey, threadId, messages, sources, tabKey, contextKey, userId, hydrated]);

  const resolveContext = useCallback(() => {
    if (seedSnapshot) {
      return {
        snapshot: seedSnapshot,
        triggered_rules: Array.isArray(seedRules) ? seedRules : [],
      };
    }
    if (!financials) {
      return { snapshot: { v: 1, locale, tab_key: tabKey }, triggered_rules: [] };
    }
    const built = buildTabSnapshot(tabKey, { financials, locale, helpers });
    const triggered_rules = evaluateTabAdviceRules(tabKey, built.snapshot, built.ruleContext);
    return { snapshot: built.snapshot, triggered_rules };
  }, [seedSnapshot, seedRules, tabKey, financials, locale, helpers]);

  const loadThread = useCallback(async (nextThreadId) => {
    if (!nextThreadId) return false;

    persistRef.current = false;
    setPhase('loading');

    const result = await fetchThreadMessages(nextThreadId);
    if (!result.ok) {
      setPhase('error');
      persistRef.current = true;
      return false;
    }

    setThreadId(nextThreadId);
    setMessages(result.messages);
    setSources([]);
    setPhase(result.messages.length > 0 ? 'ready' : 'idle');
    persistRef.current = true;
    return true;
  }, []);

  const sendMessage = useCallback(
    async (text) => {
      const trimmed = (text || '').trim();
      if (!trimmed || !session) return;

      const { snapshot, triggered_rules } = resolveContext();

      setMessages((prev) => [...prev, { role: 'user', content: trimmed }]);
      setPhase('loading');

      const household_id = await getLinkedHouseholdId();

      const result = await requestAdviceChat({
        thread_id: threadId ?? undefined,
        message: trimmed,
        tab_key: tabKey,
        locale,
        snapshot,
        triggered_rules,
        coach_paragraphs: coachParagraphs,
        household_id: household_id ?? undefined,
      });

      if (result.ok) {
        setThreadId(result.thread_id);
        setMessages((prev) => [...prev, { role: 'assistant', content: result.reply }]);
        setSources(result.sources);
        setPhase('ready');
        return;
      }

      reportClientError({
        severity: 'error',
        category: 'chat',
        message: result.error || 'chat_failed',
        context: { tabKey, detail: result.detail },
      });

      setMessages((prev) => prev.slice(0, -1));
      setPhase('error');
    },
    [session, resolveContext, tabKey, locale, coachParagraphs, threadId],
  );

  return {
    messages,
    sources,
    phase,
    threadId,
    sendMessage,
    loadThread,
    hydrated,
  };
}
