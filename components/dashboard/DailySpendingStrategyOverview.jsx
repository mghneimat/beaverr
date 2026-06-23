import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useI18n } from '../../lib/i18n';
import { C, T } from '../../constants/onboarding-theme';
import {
  DAILY_SPENDING_STRATEGIES,
  resolveDailySpendingDestination,
} from '../../lib/dailySpendingStrategy';
import StrategySectionIntro from './StrategySectionIntro';
import StrategyOptionCard from './StrategyOptionCard';

/**
 * @param {import('../../lib/i18n').TranslateFn} t
 * @param {import('../../lib/dailySpendingStrategy').DailySpendingDestination} id
 */
function buildDailyFlowSteps(t, id) {
  if (id === 'spendingBoost') {
    return [
      { kind: 'event', label: t('dashboard.budgetScreen.dailySpending.flow.dayEnds') },
      { kind: 'outcome', label: t('dashboard.budgetScreen.dailySpending.flow.staysInPool') },
    ];
  }
  if (id === 'looseMoney') {
    return [
      { kind: 'event', label: t('dashboard.budgetScreen.dailySpending.flow.dayEnds') },
      { kind: 'jar', label: t('dashboard.budgetScreen.dailySpending.flow.piggyJar') },
      { kind: 'outcome', label: t('dashboard.budgetScreen.dailySpending.flow.lockedUntilMonthEnd') },
    ];
  }
  return [
    { kind: 'event', label: t('dashboard.budgetScreen.dailySpending.flow.dayEnds') },
    { kind: 'outcome', label: t('dashboard.budgetScreen.dailySpending.flow.toSavings') },
  ];
}

/**
 * Interactive daily / inter-cycle spending strategy picker.
 */
export default function DailySpendingStrategyOverview({
  budget,
  onStrategyChange,
}) {
  const { t } = useI18n();
  const [pendingDestination, setPendingDestination] = useState(null);
  const active = pendingDestination ?? resolveDailySpendingDestination(budget);

  useEffect(() => {
    setPendingDestination(null);
  }, [budget?.dailyJarDestination]);

  const handleSelect = (id) => {
    if (id === active) return;
    setPendingDestination(id);
    onStrategyChange?.(id);
  };

  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={t('dashboard.budgetScreen.dailySpending.title')}>
      <StrategySectionIntro
        sectionLabel={t('dashboard.budgetScreen.dailySpending.sectionLabel')}
        helper={t('dashboard.budgetScreen.dailySpending.helper')}
      />
      {DAILY_SPENDING_STRATEGIES.map(({ id }) => {
        const selected = active === id;
        return (
          <StrategyOptionCard
            key={id}
            label={t(`dashboard.budgetScreen.dailySpending.${id}`)}
            body={t(`dashboard.budgetScreen.dailySpending.${id}Body`)}
            flowSteps={buildDailyFlowSteps(t, id)}
            selected={selected}
            onPress={() => handleSelect(id)}
            selectA11yLabel={t('dashboard.budgetScreen.dailySpending.selectA11y', {
              strategy: t(`dashboard.budgetScreen.dailySpending.${id}`),
            })}
          />
        );
      })}
      <Text style={{ ...T.caption, color: C.muted, marginTop: 4, lineHeight: 18 }}>
        {t('dashboard.budgetScreen.dailySpending.policyNote')}
      </Text>
    </View>
  );
}
