import { View, Pressable, Platform, ActivityIndicator } from 'react-native';
import { useCallback } from 'react';
import { Text } from '@gluestack-ui/themed';
import Animated, { LinearTransition } from 'react-native-reanimated';
import { useI18n } from '../../lib/i18n';
import { useAuth } from '../../lib/auth/AuthProvider';
import { useTabInsightAi } from '../../lib/advice/useTabInsightAi';
import { useCoachChatContextOptional } from '../../lib/advice/CoachChatContext';
import { C, R, T } from '../../constants/onboarding-theme';
import { DASHBOARD_MOTION_DURATION, DASHBOARD_MOTION_EASE } from '../../lib/dashboardMotion';
import { useReducedMotion } from '../../lib/useReducedMotion';
import PrimaryButton from '../ui/PrimaryButton';
import { SparklesIcon } from '../app/AppNavIcons';
import AiConsentModal from '../consent/AiConsentModal';
import InsightAiCardShell from './InsightAiCardShell';
import { CardHeaderChevron } from './CardHeaderActionButton';
import { useInsightTextExpansion } from './useInsightTextExpansion';
import { getInsightCardCopy } from './insightGlowPreset';

const EMPTY_KEY_BY_TAB = {
  tracker: 'dashboard.insights.emptyTracker',
  goals: 'dashboard.insights.emptyGoals',
  savings: 'dashboard.insights.emptySavings',
  alerts: 'dashboard.insights.emptyAlerts',
  income: 'dashboard.insights.emptyIncome',
  expenses: 'dashboard.insights.emptyExpenses',
  budget: 'dashboard.insights.emptyBudget',
  summary: 'dashboard.insights.emptySummary',
  home: 'dashboard.insights.empty',
};

const layoutTransition = LinearTransition
  .duration(DASHBOARD_MOTION_DURATION)
  .easing(DASHBOARD_MOTION_EASE);

/**
 * Unified collapsed AI insight card — one per dashboard tab, cloud-backed after consent.
 */
export default function TabInsightCard({
  tabKey,
  financials,
  helpers = {},
}) {
  const { t, locale } = useI18n();
  const auth = useAuth();
  const coachChat = useCoachChatContextOptional();
  const reduceMotion = useReducedMotion();
  const cardCopy = getInsightCardCopy();
  const insightText = cardCopy.textShadow;

  const {
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
  } = useTabInsightAi(tabKey, financials, locale, helpers, {
    session: auth.session,
    configured: auth.configured,
  });

  const {
    collapsedLines,
    expanded: textExpanded,
    showToggle,
    toggleExpanded,
  } = useInsightTextExpansion(paragraphs, { variant: 'standalone' });

  const emptyKey = EMPTY_KEY_BY_TAB[tabKey] || 'dashboard.insights.empty';
  const isLoading = expanded && phase === 'loading';

  const onTogglePress = () => {
    if (isLoading) return;
    if (expanded) {
      collapse();
      return;
    }
    onViewPress();
  };

  const openChat = useCallback(() => {
    if (!coachChat || phase !== 'ready' || paragraphs.length === 0) return;
    coachChat.openWithInsight({
      tabKey,
      snapshot: insightSnapshot,
      triggeredRules,
      coachParagraphs: paragraphs,
    });
  }, [coachChat, phase, paragraphs, tabKey, insightSnapshot, triggeredRules]);

  const toggleLabel = expanded
    ? t('dashboard.insights.collapse')
    : t('dashboard.insights.view');

  const toggleA11y = isLoading
    ? t('dashboard.insights.loadingA11y')
    : expanded
      ? t('dashboard.insights.collapseA11y')
      : t('dashboard.insights.viewA11y');

  const toggleButton = (
    <Pressable
      onPress={onTogglePress}
      disabled={isLoading}
      accessibilityRole="button"
      accessibilityLabel={toggleA11y}
      accessibilityState={{ expanded, busy: isLoading }}
      style={({ pressed, hovered }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 10,
        paddingHorizontal: isLoading ? 14 : 16,
        borderRadius: R.button,
        backgroundColor: pressed ? C.pillSelectedPressed : C.pillSelectedBg,
        minHeight: 44,
        minWidth: isLoading ? 44 : undefined,
        justifyContent: 'center',
        opacity: isLoading ? 0.92 : pressed ? 0.92 : 1,
        ...(Platform.OS === 'web' && hovered && !isLoading ? { opacity: 0.95 } : {}),
        ...(Platform.OS === 'web' ? { cursor: isLoading ? 'default' : 'pointer' } : {}),
      })}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={C.pillSelectedText} />
      ) : (
        <>
          <CardHeaderChevron expanded={expanded} color={C.pillSelectedText} />
          <Text style={{ fontSize: 14, fontWeight: '600', color: C.pillSelectedText }}>
            {toggleLabel}
          </Text>
        </>
      )}
    </Pressable>
  );

  const collapsedBody = (
    <Text style={{ ...T.helper, color: cardCopy.muted, marginTop: 4, ...insightText }}>
      {t('dashboard.insights.teaser')}
    </Text>
  );

  const expandedBody = (() => {
    if (phase === 'loading') {
      return <Text style={{ ...T.helper, color: cardCopy.muted, marginTop: 4, ...insightText }}>{t('dashboard.advice.loading')}</Text>;
    }

    if (phase === 'unavailable') {
      const unavailableMessage = !auth.configured
        ? t('dashboard.advice.notConfigured')
        : t('dashboard.advice.signInHelper');
      return <Text style={{ ...T.helper, color: cardCopy.muted, marginTop: 4, ...insightText }}>{unavailableMessage}</Text>;
    }

    if (phase === 'error') {
      return (
        <View style={{ marginTop: 4 }}>
          <Text style={{ ...T.helper, color: C.danger, marginBottom: 12, ...insightText }}>
            {t('dashboard.advice.error')}
          </Text>
          <PrimaryButton onPress={refresh}>{t('dashboard.advice.refresh')}</PrimaryButton>
        </View>
      );
    }

    if (phase === 'empty' || paragraphs.length === 0) {
      return (
        <Text style={{ ...T.helper, color: cardCopy.muted, marginTop: 4, ...insightText }}>
          {t(emptyKey)}
        </Text>
      );
    }

    return (
      <View style={{ marginTop: 4 }}>
        {paragraphs.map((paragraph, index) => (
          <Text
            key={`${index}-${paragraph.slice(0, 24)}`}
            style={{
              ...T.helper,
              fontSize: 15,
              lineHeight: 24,
              color: cardCopy.body,
              marginTop: index > 0 ? 8 : 0,
              ...insightText,
            }}
            numberOfLines={!textExpanded && showToggle ? collapsedLines : undefined}
          >
            {paragraph}
          </Text>
        ))}
        {showToggle ? (
          <Pressable
            onPress={toggleExpanded}
            accessibilityRole="button"
            accessibilityLabel={
              textExpanded ? t('dashboard.insights.showLess') : t('dashboard.insights.learnMore')
            }
            hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
            style={({ pressed }) => ({
              alignSelf: 'flex-start',
              marginTop: 8,
              paddingVertical: 2,
              opacity: pressed ? 0.7 : 1,
              ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
            })}
          >
            <Text style={{ fontSize: 14, fontWeight: '600', color: cardCopy.accent, ...insightText }}>
              {textExpanded ? t('dashboard.insights.showLess') : t('dashboard.insights.learnMore')}
            </Text>
          </Pressable>
        ) : null}
        <Text
          style={{
            ...T.helper,
            fontSize: 12,
            color: cardCopy.muted,
            marginTop: 8,
            ...insightText,
          }}
        >
          {t('dashboard.advice.disclaimer')}
        </Text>
        <Pressable
          onPress={refresh}
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
          <Text style={{ fontSize: 13, fontWeight: '600', color: cardCopy.accent, ...insightText }}>
            {t('dashboard.advice.refresh')}
          </Text>
        </Pressable>
        <Pressable
          onPress={openChat}
          accessibilityRole="button"
          accessibilityLabel={t('dashboard.chat.askAboutThisA11y')}
          style={({ pressed }) => ({
            alignSelf: 'flex-start',
            marginTop: 4,
            paddingVertical: 6,
            opacity: pressed ? 0.7 : 1,
            ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
          })}
        >
          <Text style={{ fontSize: 13, fontWeight: '600', color: cardCopy.accent, ...insightText }}>
            {t('dashboard.chat.askAboutThis')}
          </Text>
        </Pressable>
      </View>
    );
  })();

  return (
    <>
      <Animated.View layout={reduceMotion ? undefined : layoutTransition}>
        <InsightAiCardShell>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: expanded ? 8 : 0 }}>
            <SparklesIcon color={cardCopy.accent} size={18} />
            <Text accessibilityRole="header" style={{ ...T.cardTitle, flex: 1, color: cardCopy.title, ...insightText }}>
              {t('dashboard.insights.sectionTitle')}
            </Text>
            {toggleButton}
          </View>

          <Animated.View layout={reduceMotion ? undefined : layoutTransition}>
            {expanded ? expandedBody : collapsedBody}
          </Animated.View>
        </InsightAiCardShell>
      </Animated.View>

      <AiConsentModal
        visible={consentModalOpen}
        onClose={() => setConsentModalOpen(false)}
        onAccepted={onConsentAccepted}
      />
    </>
  );
}
