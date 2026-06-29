import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { C, T } from '../../constants/onboarding-theme';
import { useI18n } from '../../lib/i18n';
import { periodKey } from '../../lib/dailyLog';
import {
  buildDailySpendChartDays,
  buildMonthPeriodOptions,
  resolveMonthlySpendingBudget,
} from '../../lib/dailySpendChart';
import SurfaceCard from '../ui/SurfaceCard';
import DailySpendChart from './DailySpendChart';
import MonthPeriodDropdown from './MonthPeriodDropdown';

export default function SummaryDailySpendSection({ bundle, currency }) {
  const { t, locale } = useI18n();
  const now = new Date();
  const monthOptions = useMemo(
    () => buildMonthPeriodOptions(now, 12, locale),
    [locale],
  );
  const [period, setPeriod] = useState(() => periodKey(now));

  const monthlyBudget = useMemo(() => resolveMonthlySpendingBudget(period, {
    budget: bundle.financials.budget,
    effectiveMonthlyFlexible: bundle.financials.effectiveMonthlyFlexible
      ?? bundle.financials.monthlyFlexible,
    now,
  }), [period, bundle.financials, now]);

  const chartDays = useMemo(() => buildDailySpendChartDays({
    period,
    dailyLogs: bundle.financials.dailyLogs || [],
    monthlyBudget,
    now,
  }), [period, bundle.financials.dailyLogs, monthlyBudget, now]);

  return (
    <SurfaceCard>
      <View style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 12,
        marginBottom: 12,
      }}
      >
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ ...T.cardTitle }}>{t('dashboard.summaryScreen.dailySpend.title')}</Text>
        </View>
        <MonthPeriodDropdown
          value={period}
          options={monthOptions}
          onChange={setPeriod}
          accessibilityLabel={t('dashboard.summaryScreen.dailySpend.monthA11y')}
        />
      </View>

      <DailySpendChart days={chartDays} currency={currency} />
    </SurfaceCard>
  );
}
