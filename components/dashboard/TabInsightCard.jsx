import { useState } from 'react';
import { View, Pressable, Platform } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import Animated, { LinearTransition } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useI18n } from '../../lib/i18n';
import { getTabInsight } from '../../lib/insights';
import { C, R, T } from '../../constants/onboarding-theme';
import { DASHBOARD_MOTION_DURATION, DASHBOARD_MOTION_EASE } from '../../lib/dashboardMotion';
import { useReducedMotion } from '../../lib/useReducedMotion';
import SurfaceCard from '../ui/SurfaceCard';
import { CardHeaderChevron } from './CardHeaderActionButton';
import { useInsightTextExpansion } from './useInsightTextExpansion';

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
 * Per-tab insight card — local rule-based copy from computeInsights / getTabInsight.
 */
export default function TabInsightCard({
  tabKey,
  insights,
  financials,
  helpers = {},
}) {
  const { t } = useI18n();
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [expanded, setExpanded] = useState(false);

  const mergedHelpers = {
    ...helpers,
    financials,
  };

  const tabInsight = insights
    ? getTabInsight(tabKey, insights, t, mergedHelpers)
    : null;

  const paragraphs = tabInsight?.paragraphs?.filter(Boolean) ?? [];
  const emptyKey = EMPTY_KEY_BY_TAB[tabKey] || 'dashboard.insights.empty';

  const {
    collapsedLines,
    expanded: textExpanded,
    showToggle,
    toggleExpanded,
  } = useInsightTextExpansion(paragraphs, { variant: 'standalone' });

  const onTogglePress = () => {
    setExpanded((prev) => !prev);
  };

  const toggleLabel = expanded
    ? t('dashboard.insights.collapse')
    : t('dashboard.insights.view');

  const toggleA11y = expanded
    ? t('dashboard.insights.collapseA11y')
    : t('dashboard.insights.viewA11y');

  const toggleButton = (
    <Pressable
      onPress={onTogglePress}
      accessibilityRole="button"
      accessibilityLabel={toggleA11y}
      accessibilityState={{ expanded }}
      style={({ pressed, hovered }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: R.button,
        backgroundColor: pressed ? C.pillSelectedPressed : C.pillSelectedBg,
        minHeight: 44,
        justifyContent: 'center',
        opacity: pressed ? 0.92 : 1,
        ...(Platform.OS === 'web' && hovered ? { opacity: 0.95 } : {}),
        ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
      })}
    >
      <CardHeaderChevron expanded={expanded} color={C.pillSelectedText} />
      <Text style={{ fontSize: 14, fontWeight: '600', color: C.pillSelectedText }}>
        {toggleLabel}
      </Text>
    </Pressable>
  );

  const collapsedBody = (
    <Text style={{ ...T.helper, color: C.muted, marginTop: 4 }}>
      {t('dashboard.insights.teaser')}
    </Text>
  );

  const expandedBody = paragraphs.length === 0 ? (
    <Text style={{ ...T.helper, color: C.muted, marginTop: 4 }}>
      {t(emptyKey)}
    </Text>
  ) : (
    <View style={{ marginTop: 4 }}>
      {paragraphs.map((paragraph, index) => (
        <Text
          key={`${index}-${paragraph.slice(0, 24)}`}
          style={{
            ...T.helper,
            fontSize: 15,
            lineHeight: 24,
            color: C.text,
            marginTop: index > 0 ? 8 : 0,
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
          <Text style={{ fontSize: 14, fontWeight: '600', color: C.accent }}>
            {textExpanded ? t('dashboard.insights.showLess') : t('dashboard.insights.learnMore')}
          </Text>
        </Pressable>
      ) : null}
      {tabInsight?.ctaLabel && tabInsight?.route ? (
        <Pressable
          onPress={() => router.push(tabInsight.route)}
          accessibilityRole="button"
          accessibilityLabel={tabInsight.ctaLabel}
          style={({ pressed }) => ({
            alignSelf: 'flex-start',
            marginTop: 12,
            paddingVertical: 6,
            opacity: pressed ? 0.7 : 1,
            ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
          })}
        >
          <Text style={{ fontSize: 14, fontWeight: '600', color: C.accent }}>
            {tabInsight.ctaLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );

  return (
    <Animated.View layout={reduceMotion ? undefined : layoutTransition}>
      <SurfaceCard>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: expanded ? 8 : 0 }}>
          <Text accessibilityRole="header" style={{ ...T.cardTitle, flex: 1, color: C.text }}>
            {t('dashboard.insights.sectionTitle')}
          </Text>
          {toggleButton}
        </View>

        <Animated.View layout={reduceMotion ? undefined : layoutTransition}>
          {expanded ? expandedBody : collapsedBody}
        </Animated.View>
      </SurfaceCard>
    </Animated.View>
  );
}
