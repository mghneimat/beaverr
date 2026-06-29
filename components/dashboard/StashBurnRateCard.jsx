import { useMemo } from 'react';
import { View } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useRouter } from 'expo-router';
import { useI18n } from '../../lib/i18n';
import { formatCurrency } from '../../lib/finance';
import { buildStashBurnRate } from '../../lib/stashBurnRate';
import { navigateToGoalDetail } from '../../lib/screenTransition';
import { C, T } from '../../constants/onboarding-theme';
import SurfaceCard from '../ui/SurfaceCard';
import InCardSectionHeader from './InCardSectionHeader';
import DashboardSectionEmptyMessage from './DashboardSectionEmptyMessage';
import {
  BurnRateBar,
  BurnRateHorizontalLegend,
  BurnRateIncomePill,
} from './BurnRateVisuals';

function buildBurnAnimationKey(burn) {
  return `${burn.total}|${burn.segments.map((seg) => `${seg.key}:${seg.value}`).join(',')}`;
}

export default function StashBurnRateCard({
  balance,
  movements,
  goals,
  currency,
  plannedMonthlyOutflow = 0,
}) {
  const { t } = useI18n();
  const router = useRouter();

  const burn = useMemo(
    () => buildStashBurnRate({ balance, movements, goals }),
    [balance, movements, goals],
  );

  const burnAnimationKey = buildBurnAnimationKey(burn);
  const totalDisplay = formatCurrency(burn.total, currency);

  const legendItems = burn.segments.map((seg) => ({
    key: seg.key,
    color: seg.color,
    label: seg.labelKey ? t(seg.labelKey) : seg.label,
    amount: formatCurrency(seg.value, currency),
    amountValue: seg.value,
    currency,
    sharePct: burn.total > 0 ? (seg.value / burn.total) * 100 : null,
    onPress: seg.goalId ? () => navigateToGoalDetail(router, seg.goalId) : undefined,
    hint: seg.goalId
      ? t('dashboard.savingsScreen.detail.burnRate.openGoal', { name: seg.label })
      : undefined,
  }));

  const showPlannedNote = plannedMonthlyOutflow > 0 && burn.totalOut === 0;

  if (burn.total <= 0) {
    return (
      <SurfaceCard>
        <InCardSectionHeader title={t('dashboard.savingsScreen.detail.burnRate.title')} />
        <DashboardSectionEmptyMessage message={t('dashboard.savingsScreen.detail.burnRate.empty')} />
      </SurfaceCard>
    );
  }

  return (
    <SurfaceCard>
      <InCardSectionHeader title={t('dashboard.savingsScreen.detail.burnRate.title')} />
      <Text style={{ ...T.caption, color: C.muted, marginBottom: 12 }}>
        {t('dashboard.savingsScreen.detail.burnRate.helper')}
      </Text>

      <View style={{ width: '100%', marginBottom: 6 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 6 }}>
          <BurnRateIncomePill
            label={t('dashboard.savingsScreen.detail.burnRate.totalLabel')}
            amount={totalDisplay}
            amountValue={burn.total}
            currency={currency}
            animationKey={burnAnimationKey}
          />
        </View>
        <BurnRateBar
          segments={burn.segments}
          income={burn.total}
          isOvercommitted={false}
          animationKey={burnAnimationKey}
          barScale={burn.barScale ?? 1}
        />
      </View>

      <BurnRateHorizontalLegend
        items={legendItems}
        animationKey={burnAnimationKey}
        amountAnimationKey={burnAnimationKey}
      />

      {showPlannedNote ? (
        <Text style={{ ...T.caption, color: C.muted, marginTop: 12 }}>
          {t('dashboard.savingsScreen.detail.burnRate.plannedNote', {
            amount: formatCurrency(plannedMonthlyOutflow, currency),
          })}
        </Text>
      ) : null}
    </SurfaceCard>
  );
}
