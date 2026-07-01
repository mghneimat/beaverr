import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useSegments } from 'expo-router';
import { useI18n } from '../i18n';
import { useAuth } from '../auth/AuthProvider';
import { loadHouseholdFinancials } from '../householdBudget';
import { subscribeDashboardRefresh } from '../dashboardRefresh';
import { isAiConsentAccepted } from './aiConsent';
import { buildCoachChatContextKey, clearCoachChatSession, loadCoachChatSession } from './coachChatSession.js';

/** @typedef {import('./buildTabSnapshot.js').TabAdviceKey} TabAdviceKey */

/**
 * @typedef {{
 *   tabKey: TabAdviceKey,
 *   snapshot: object,
 *   triggeredRules: object[],
 *   coachParagraphs: string[],
 * }} InsightChatContext
 */

const CoachChatContext = createContext(null);

const HIDDEN_ROUTES = new Set([
  'profile',
  'account-settings',
  'help-feedback',
  'edit',
]);

export function CoachChatProvider({ children }) {
  const { locale } = useI18n();
  const auth = useAuth();
  const segments = useSegments();
  const [financials, setFinancials] = useState(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [insightContext, setInsightContext] = useState(null);
  const [sessionKey, setSessionKey] = useState(0);
  const [consentModalOpen, setConsentModalOpen] = useState(false);
  const [pendingOpen, setPendingOpen] = useState(undefined);

  const routeName = segments[segments.length - 1];
  const inApp = segments[0] === '(app)';
  const showFab = inApp && !segments.includes('edit') && !HIDDEN_ROUTES.has(routeName);

  const { t } = useI18n();

  const refreshFinancials = useCallback(async () => {
    try {
      const data = await loadHouseholdFinancials(t);
      setFinancials(data);
    } catch {
      setFinancials(null);
    }
  }, [t]);

  useEffect(() => {
    refreshFinancials();
  }, [refreshFinancials]);

  useEffect(() => subscribeDashboardRefresh(refreshFinancials), [refreshFinancials]);

  useEffect(() => {
    let mounted = true;
    loadCoachChatSession().then((saved) => {
      if (mounted && typeof saved?.sessionKey === 'number') {
        setSessionKey(saved.sessionKey);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const ensureConsentAndOpen = useCallback(
    async (nextContext, { resetSession = false } = {}) => {
      if (!auth.configured || !auth.session) {
        setInsightContext(nextContext);
        if (resetSession) setSessionKey((k) => k + 1);
        setPanelOpen(true);
        return;
      }

      const accepted = await isAiConsentAccepted();
      if (!accepted) {
        setPendingOpen({ context: nextContext, resetSession });
        setConsentModalOpen(true);
        return;
      }

      setInsightContext(nextContext);
      if (resetSession) setSessionKey((k) => k + 1);
      setPanelOpen(true);
    },
    [auth.configured, auth.session],
  );

  const openGeneral = useCallback(() => {
    const nextKey = buildCoachChatContextKey(null);
    const currentKey = buildCoachChatContextKey(insightContext);
    const resetSession = insightContext != null && nextKey !== currentKey;
    ensureConsentAndOpen(null, { resetSession });
  }, [ensureConsentAndOpen, insightContext]);

  /** @param {InsightChatContext} ctx */
  const openWithInsight = useCallback(
    (ctx) => {
      const nextKey = buildCoachChatContextKey(ctx);
      const currentKey = buildCoachChatContextKey(insightContext);
      const resetSession = nextKey !== currentKey;
      ensureConsentAndOpen(ctx, { resetSession });
    },
    [ensureConsentAndOpen, insightContext],
  );

  const minimizePanel = useCallback(() => {
    setPanelOpen(false);
  }, []);

  const discardChat = useCallback(async () => {
    setPanelOpen(false);
    setInsightContext(null);
    setSessionKey((k) => k + 1);
    await clearCoachChatSession();
  }, []);

  const beginNewChatSession = useCallback(async () => {
    setSessionKey((k) => k + 1);
    await clearCoachChatSession();
  }, []);

  const togglePanel = useCallback(async () => {
    if (panelOpen) {
      minimizePanel();
      return;
    }

    if (!auth.configured || !auth.session) {
      setPanelOpen(true);
      return;
    }

    const accepted = await isAiConsentAccepted();
    if (!accepted) {
      setPendingOpen({ context: insightContext, resetSession: false });
      setConsentModalOpen(true);
      return;
    }

    setPanelOpen(true);
  }, [panelOpen, insightContext, auth.configured, auth.session, minimizePanel]);

  const onConsentAccepted = useCallback(() => {
    setConsentModalOpen(false);
    if (pendingOpen !== undefined) {
      setInsightContext(pendingOpen.context ?? null);
      if (pendingOpen.resetSession) setSessionKey((k) => k + 1);
      setPanelOpen(true);
      setPendingOpen(undefined);
    }
  }, [pendingOpen]);

  const onConsentDeclined = useCallback(() => {
    setConsentModalOpen(false);
    setPendingOpen(undefined);
  }, []);

  const contextKey = buildCoachChatContextKey(insightContext);

  const value = useMemo(
    () => ({
      showFab,
      panelOpen,
      sessionKey,
      contextKey,
      insightContext,
      financials,
      locale,
      session: auth.session,
      configured: auth.configured,
      openGeneral,
      openWithInsight,
      minimizePanel,
      discardChat,
      beginNewChatSession,
      togglePanel,
      consentModalOpen,
      setConsentModalOpen,
      onConsentAccepted,
      onConsentDeclined,
    }),
    [
      showFab,
      panelOpen,
      sessionKey,
      contextKey,
      insightContext,
      financials,
      locale,
      auth.session,
      auth.configured,
      openGeneral,
      openWithInsight,
      minimizePanel,
      discardChat,
      beginNewChatSession,
      togglePanel,
      consentModalOpen,
      onConsentAccepted,
      onConsentDeclined,
    ],
  );

  return (
    <CoachChatContext.Provider value={value}>
      {children}
    </CoachChatContext.Provider>
  );
}

export function useCoachChatContext() {
  const ctx = useContext(CoachChatContext);
  if (!ctx) {
    throw new Error('useCoachChatContext must be used within CoachChatProvider');
  }
  return ctx;
}

/** Optional hook — returns null outside provider (for TabInsightCard safety). */
export function useCoachChatContextOptional() {
  return useContext(CoachChatContext);
}
