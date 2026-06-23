import { View } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useI18n } from '../../lib/i18n';
import { useDashboardLayout } from '../../lib/dashboardLayout';
import { C, T, tabularNums } from '../../constants/onboarding-theme';
import { getDashboardCardTones } from './dashboardCardTones';
import { formatCurrency } from '../../lib/finance';
import { formatDashboardAmount, resolveDashboardAmount } from './formatDashboardAmount';
import SettleCrossfade from '../ui/SettleCrossfade';

function SummaryMetricCard({ label, value, amountValue, currency, footer, tone = 'neutral', style, stacked = false }) {
  const isIncome = tone === 'income';
  const isExpense = tone === 'expense';
  const tones = getDashboardCardTones();
  const palette = isIncome ? tones.income : isExpense ? tones.expense : null;
  const valueStyle = {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '700',
    color: palette?.valueColor ?? C.primary,
    ...tabularNums,
  };

  return (
    <View style={[{
      ...(stacked ? { width: '100%' } : { flex: 1, minWidth: 0 }),
      paddingVertical: 14,
      paddingHorizontal: 12,
      borderRadius: 12,
      backgroundColor: palette?.bg ?? C.surface,
      borderWidth: 1,
      borderColor: palette?.border ?? C.border,
      borderLeftWidth: palette ? 3 : 1,
      borderLeftColor: palette?.accent ?? C.border,
    }, style]}
    >
      <Text style={{ ...T.fieldLabel, color: C.muted, marginBottom: 6 }} numberOfLines={2}>
        {label}
      </Text>
      {typeof amountValue === 'number' ? (
        <Text style={valueStyle} numberOfLines={stacked ? undefined : 1}>
          {formatCurrency(amountValue, currency)}
        </Text>
      ) : (
        <Text style={valueStyle} numberOfLines={stacked ? undefined : 1}>
          {value}
        </Text>
      )}
      {footer ? (
        <Text style={{ ...T.caption, color: C.muted, marginTop: 6 }} numberOfLines={2}>
          {footer}
        </Text>
      ) : null}
    </View>
  );
}

/**
 * Income, fixed costs, and remaining — top of Budget tab.
 */
export default function BudgetSummaryMetrics({
  income,
  committed,
  remaining,
  remainingPct,
  isOvercommitted,
  currency,
  frequency,
  daysInMonth,
}) {
  const { t } = useI18n();
  const { isPhone } = useDashboardLayout();
  const stacked = isPhone;
  const periodLabel = t(`dashboard.budgetScreen.frequency.${frequency}`);

  const format = (monthly) => formatDashboardAmount(monthly, frequency, currency, daysInMonth);
  const resolve = (monthly) => resolveDashboardAmount(monthly, frequency, daysInMonth);

  return (
    <SettleCrossfade
      animationKey={frequency}
      style={{ flexDirection: stacked ? 'column' : 'row', gap: 10, width: '100%' }}
      slide={false}
    >
      <SummaryMetricCard
        label={t('dashboard.budgetScreen.summaryMetrics.income')}
        value={format(income)}
        amountValue={resolve(income)}
        currency={currency}
        footer={periodLabel}
        stacked={stacked}
      />
      <SummaryMetricCard
        label={t('dashboard.budgetScreen.summaryMetrics.fixedCosts')}
        value={format(committed)}
        amountValue={resolve(committed)}
        currency={currency}
        footer={periodLabel}
        stacked={stacked}
      />
      <SummaryMetricCard
        label={t('dashboard.budgetScreen.summaryMetrics.remaining')}
        value={format(remaining)}
        amountValue={resolve(remaining)}
        currency={currency}
        footer={isOvercommitted
          ? t('dashboard.budgetScreen.summaryMetrics.overcommitted')
          : t('dashboard.budgetScreen.summaryMetrics.pctOfIncome', {
            pct: Math.round(remainingPct * 100),
          })}
        tone={isOvercommitted ? 'expense' : 'income'}
        stacked={stacked}
      />
    </SettleCrossfade>
  );
}
