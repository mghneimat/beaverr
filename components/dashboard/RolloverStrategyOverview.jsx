import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useI18n } from '../../lib/i18n';
import StrategySectionIntro from './StrategySectionIntro';
import StrategyOptionCard from './StrategyOptionCard';

const STRATEGIES = [
  {
    id: 'free',
    icon: '♾️',
    labelKey: 'dashboard.budgetScreen.rollover.free',
  },
  {
    id: 'reset',
    icon: '🔁',
    labelKey: 'dashboard.budgetScreen.rollover.reset',
  },
];

/**
 * @param {import('../../lib/i18n').TranslateFn} t
 * @param {import('../../lib/schema').Budget|null|undefined} budget
 * @param {boolean} selected
 */
function buildResetFlowSteps(t, budget, selected) {
  if (!selected) {
    return [
      { kind: 'event', label: t('dashboard.budgetScreen.rollover.flow.monthEnds') },
      { kind: 'jar', label: t('dashboard.budgetScreen.rollover.flow.resetChoice') },
    ];
  }
  const dest = budget?.resetUnspentDestination || 'looseMoney';
  const steps = [
    { kind: 'event', label: t('dashboard.budgetScreen.rollover.flow.monthEnds') },
  ];
  if (dest === 'savings') {
    steps.push({ kind: 'outcome', label: t('dashboard.budgetScreen.rollover.flow.toSavings') });
  } else if (dest === 'otherGoal') {
    steps.push({
      kind: 'jar',
      label: t('dashboard.budgetScreen.rollover.flow.toNamedJar', {
        name: budget?.resetOtherGoalNote || t('dashboard.home.jars.bigPlans.titleFallback'),
      }),
    });
  } else {
    steps.push({ kind: 'jar', label: t('dashboard.budgetScreen.rollover.flow.piggyJar') });
  }
  return steps;
}

/**
 * Interactive monthly rollover strategy picker.
 */
export default function RolloverStrategyOverview({
  budget,
  onStrategyChange,
}) {
  const { t } = useI18n();
  const [pendingStrategy, setPendingStrategy] = useState(null);
  const active = pendingStrategy ?? budget?.rolloverStrategy ?? 'free';

  useEffect(() => {
    setPendingStrategy(null);
  }, [budget?.rolloverStrategy]);

  const displayBudget = pendingStrategy
    ? {
      ...budget,
      rolloverStrategy: pendingStrategy,
      ...(pendingStrategy === 'reset' && !budget?.resetUnspentDestination
        ? { resetUnspentDestination: 'looseMoney' }
        : {}),
    }
    : budget;

  const handleSelect = (id) => {
    if (id === active) return;
    setPendingStrategy(id);
    onStrategyChange?.(id);
  };

  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={t('dashboard.budgetScreen.rollover.title')}>
      <StrategySectionIntro
        sectionLabel={t('dashboard.budgetScreen.rollover.sectionLabel')}
        helper={t('dashboard.budgetScreen.rollover.helper')}
      />
      {STRATEGIES.map(({ id, icon, labelKey }) => {
        const selected = active === id;
        const bodyKey = `dashboard.budgetScreen.rollover.${id}Body`;
        const flowSteps = id === 'free'
          ? [
            { kind: 'event', label: t('dashboard.budgetScreen.rollover.flow.monthEnds') },
            { kind: 'jar', label: t('dashboard.budgetScreen.rollover.flow.rolloverJar') },
            { kind: 'outcome', label: t('dashboard.budgetScreen.rollover.flow.boostDailyAllowance') },
          ]
          : buildResetFlowSteps(t, displayBudget, selected);

        return (
          <StrategyOptionCard
            key={id}
            icon={icon}
            label={t(labelKey)}
            body={t(bodyKey)}
            flowSteps={flowSteps}
            selected={selected}
            onPress={() => handleSelect(id)}
            selectA11yLabel={t('dashboard.budgetScreen.rollover.selectA11y', { strategy: t(labelKey) })}
          />
        );
      })}
    </View>
  );
}
