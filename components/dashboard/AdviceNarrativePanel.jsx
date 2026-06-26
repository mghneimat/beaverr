import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Pressable, Platform } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useI18n } from '../../lib/i18n';
import { C, R, T } from '../../constants/onboarding-theme';
import { buildFinancialSnapshot } from '../../lib/advice/buildFinancialSnapshot';
import { evaluateAdviceRules } from '../../lib/advice/evaluateAdviceRules';
import {
  fetchHouseholdAdvice,
  narrativeToParagraphs,
} from '../../lib/advice/fetchHouseholdAdvice';
import { isAiConsentAccepted, saveAiConsent } from '../../lib/advice/aiConsent';
import { useAuth } from '../../lib/auth/AuthProvider';
import PrimaryButton from '../ui/PrimaryButton';
import AIInsightSection from './AIInsightSection';

/**
 * Fetches Vertex-backed advice when rules fire; gates on AI consent (auth is global).
 */
export default function AdviceNarrativePanel({ financials }) {
  const { t, locale } = useI18n();
  const { session, loading: sessionLoading, configured } = useAuth();
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [consentLoading, setConsentLoading] = useState(true);
  const [fetchState, setFetchState] = useState('idle');
  const [paragraphs, setParagraphs] = useState([]);

  const { triggeredRules } = useMemo(() => {
    if (!financials) {
      return { triggeredRules: [] };
    }
    const built = buildFinancialSnapshot({ financials, locale });
    const rules = evaluateAdviceRules(built, {
      debts: financials.debts,
      byCategory: financials.byCategory,
      financialRisks: financials.financialRisks,
      sections: financials.sections,
    });
    return { triggeredRules: rules };
  }, [financials, locale]);

  useEffect(() => {
    let active = true;
    isAiConsentAccepted().then((accepted) => {
      if (active) {
        setConsentAccepted(accepted);
        setConsentLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const loadAdvice = useCallback(async () => {
    if (!financials || triggeredRules.length === 0) return;
    setFetchState('loading');
    const result = await fetchHouseholdAdvice({ financials, locale });
    if (result.ok && result.status === 'ok' && result.narrative) {
      setParagraphs(narrativeToParagraphs(result.narrative));
      setFetchState('ok');
      return;
    }
    setParagraphs([]);
    setFetchState('error');
  }, [financials, locale, triggeredRules.length]);

  useEffect(() => {
    if (
      triggeredRules.length === 0
      || !consentAccepted
      || !session
      || sessionLoading
      || consentLoading
    ) {
      return;
    }
    loadAdvice();
  }, [
    triggeredRules.length,
    consentAccepted,
    session,
    sessionLoading,
    consentLoading,
    loadAdvice,
  ]);

  if (!financials || triggeredRules.length === 0) {
    return null;
  }

  const handleEnableConsent = async () => {
    await saveAiConsent();
    setConsentAccepted(true);
  };

  if (!configured) {
    return (
      <GateCard>
        <Text style={{ ...T.helper, color: C.muted }}>{t('dashboard.advice.notConfigured')}</Text>
      </GateCard>
    );
  }

  if (consentLoading || sessionLoading) {
    return (
      <GateCard>
        <Text style={{ ...T.helper }}>{t('dashboard.advice.loading')}</Text>
      </GateCard>
    );
  }

  if (!consentAccepted) {
    return (
      <GateCard>
        <Text style={{ ...T.cardTitle, marginBottom: 8 }}>{t('dashboard.advice.title')}</Text>
        <Text style={{ ...T.helper, marginBottom: 12 }}>{t('dashboard.advice.consentHelper')}</Text>
        <Text style={{ ...T.helper, marginBottom: 16 }}>{t('dashboard.advice.consentLabel')}</Text>
        <PrimaryButton onPress={handleEnableConsent}>{t('dashboard.advice.enableButton')}</PrimaryButton>
      </GateCard>
    );
  }

  if (!session) {
    return null;
  }

  if (fetchState === 'loading') {
    return (
      <GateCard>
        <Text style={{ ...T.helper }}>{t('dashboard.advice.loading')}</Text>
      </GateCard>
    );
  }

  if (fetchState === 'error' || paragraphs.length === 0) {
    return (
      <GateCard>
        <Text style={{ ...T.helper, color: C.danger, marginBottom: 12 }}>{t('dashboard.advice.error')}</Text>
        <PrimaryButton onPress={loadAdvice}>{t('dashboard.advice.refresh')}</PrimaryButton>
      </GateCard>
    );
  }

  return (
    <View>
      <AIInsightSection
        paragraphs={paragraphs}
        titleKey="dashboard.advice.title"
      />
      <Text
        style={{
          ...T.helper,
          fontSize: 12,
          color: C.muted,
          marginTop: 8,
          paddingHorizontal: 4,
        }}
      >
        {t('dashboard.advice.disclaimer')}
      </Text>
      <Pressable
        onPress={loadAdvice}
        accessibilityRole="button"
        accessibilityLabel={t('dashboard.advice.refresh')}
        style={({ pressed }) => ({
          alignSelf: 'flex-start',
          marginTop: 8,
          paddingVertical: 6,
          opacity: pressed ? 0.7 : 1,
          ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
        })}
      >
        <Text style={{ fontSize: 13, fontWeight: '600', color: C.accent }}>
          {t('dashboard.advice.refresh')}
        </Text>
      </Pressable>
    </View>
  );
}

function GateCard({ children }) {
  return (
    <View
      style={{
        backgroundColor: C.insightCardBg,
        borderWidth: 1,
        borderColor: C.insightCardBorder,
        borderRadius: R.card,
        padding: 16,
      }}
    >
      {children}
    </View>
  );
}
