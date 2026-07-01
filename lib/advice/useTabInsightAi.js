import { useCallback, useMemo, useState } from 'react';
import { fetchTabAdvice } from './fetchTabAdvice.js';
import { narrativeToParagraphs } from './narrativeToParagraphs.js';
import { isAiConsentAccepted } from './aiConsent.js';
import {
  buildTabInsightSnapshotKey,
  clearTabInsightCache,
  clearTabInsightCacheForTab,
  readTabInsightCache,
  writeTabInsightCache,
} from './tabInsightCache.js';
import { reportClientError } from '../admin/reportError.js';

export { clearTabInsightCache } from './tabInsightCache.js';

/**
 * @param {import('./buildTabSnapshot.js').TabAdviceKey} tabKey
 * @param {import('../householdBudget').HouseholdFinancials|null|undefined} financials
 * @param {string} locale
 * @param {object} [helpers]
 * @param {{ session: object|null, configured: boolean }} auth
 */
export function useTabInsightAi(tabKey, financials, locale, helpers, auth) {
  const { session, configured } = auth;
  const [expanded, setExpanded] = useState(false);
  const [phase, setPhase] = useState('collapsed');
  const [paragraphs, setParagraphs] = useState([]);
  const [consentModalOpen, setConsentModalOpen] = useState(false);
  const [insightSnapshot, setInsightSnapshot] = useState(null);
  const [triggeredRules, setTriggeredRules] = useState([]);

  const snapshotKey = useMemo(
    () => buildTabInsightSnapshotKey(tabKey, financials, locale, helpers),
    [tabKey, financials, locale, helpers],
  );

  const applyCachedEntry = useCallback((entry) => {
    setExpanded(true);
    setParagraphs(entry.paragraphs);
    setPhase(entry.status);
  }, []);

  const fetchForTab = useCallback(async ({ force = false } = {}) => {
    if (!financials) return;

    if (!configured) {
      setExpanded(true);
      setPhase('unavailable');
      setParagraphs([]);
      return;
    }

    if (!session) {
      setExpanded(true);
      setPhase('unavailable');
      setParagraphs([]);
      return;
    }

    if (!force && snapshotKey) {
      const cached = readTabInsightCache(tabKey, snapshotKey, locale);
      if (cached) {
        applyCachedEntry(cached);
        return;
      }
    }

    setExpanded(true);
    setPhase('loading');
    setParagraphs([]);

    const result = await fetchTabAdvice({ tabKey, financials, locale, helpers });

    if (result.snapshot) {
      setInsightSnapshot(result.snapshot);
    }
    if (result.triggered_rules) {
      setTriggeredRules(result.triggered_rules);
    }

    if (result.ok && result.status === 'ok' && result.narrative) {
      const nextParagraphs = narrativeToParagraphs(result.narrative);
      const status = nextParagraphs.length > 0 ? 'ready' : 'error';
      if (snapshotKey) {
        writeTabInsightCache(tabKey, {
          snapshotKey,
          locale,
          paragraphs: nextParagraphs,
          status,
        });
      }
      setParagraphs(nextParagraphs);
      setPhase(status);
      return;
    }

    if (result.ok && result.status === 'skipped') {
      if (snapshotKey) {
        writeTabInsightCache(tabKey, {
          snapshotKey,
          locale,
          paragraphs: [],
          status: 'empty',
        });
      }
      setParagraphs([]);
      setPhase('empty');
      return;
    }

    reportClientError({
      severity: 'error',
      category: 'advice',
      message: result.error || 'tab_insight_failed',
      context: { tabKey, detail: result.detail },
    });

    if (snapshotKey) {
      writeTabInsightCache(tabKey, {
        snapshotKey,
        locale,
        paragraphs: [],
        status: 'error',
      });
    }
    setParagraphs([]);
    setPhase('error');
  }, [
    tabKey,
    financials,
    locale,
    helpers,
    configured,
    session,
    snapshotKey,
    applyCachedEntry,
  ]);

  const onViewPress = useCallback(async () => {
    if (!configured) {
      setExpanded(true);
      setPhase('unavailable');
      return;
    }

    if (!session) {
      setExpanded(true);
      setPhase('unavailable');
      return;
    }

    const accepted = await isAiConsentAccepted();
    if (!accepted) {
      setConsentModalOpen(true);
      return;
    }

    await fetchForTab();
  }, [configured, session, fetchForTab]);

  const onConsentAccepted = useCallback(async () => {
    setConsentModalOpen(false);
    await fetchForTab();
  }, [fetchForTab]);

  const refresh = useCallback(async () => {
    clearTabInsightCacheForTab(tabKey);
    await fetchForTab({ force: true });
  }, [tabKey, fetchForTab]);

  const collapse = useCallback(() => {
    setExpanded(false);
    setPhase('collapsed');
  }, []);

  return {
    expanded,
    phase,
    paragraphs,
    insightSnapshot,
    triggeredRules,
    consentModalOpen,
    setConsentModalOpen,
    onViewPress,
    onConsentAccepted,
    refresh,
    collapse,
  };
}
