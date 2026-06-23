import { View, Text } from 'react-native';
import { C, T, tabularNums } from '../../../constants/onboarding-theme';
import { useOnboardingLayout } from '../../../lib/onboardingLayout';
import { MaytechTableFrame } from '../../dashboard/BreakdownTablePrimitives';
import { formatReviewMonthlyAmount, formatReviewMoney } from '../../../lib/reviewOnboardingData';

/**
 * Top summary — total income, total expenses, monthly balance.
 */
export default function ReviewSummaryBar({
  totalIncome,
  totalExpenses,
  monthlyBalance,
  currency,
  t,
}) {
  const layout = useOnboardingLayout();
  const stackNarrow = layout.isNarrow;
  const balanceColor = monthlyBalance >= 0 ? C.positive : C.danger;

  const rows = [
    {
      label: t('onboarding.review.review.summary.totalIncome'),
      value: formatReviewMonthlyAmount(totalIncome, currency, t),
      valueColor: C.text,
    },
    {
      label: t('onboarding.review.review.summary.totalExpenses'),
      value: formatReviewMonthlyAmount(totalExpenses, currency, t),
      valueColor: C.text,
    },
    {
      label: t('onboarding.review.review.summary.monthlyBalance'),
      value: formatReviewMoney(monthlyBalance, currency),
      valueColor: balanceColor,
      bold: true,
      dividerTop: true,
    },
  ];

  return (
    <MaytechTableFrame style={{ marginBottom: 16, padding: 16, borderColor: C.border }}>
      {rows.map((row) => (
        <View
          key={row.label}
          style={{
            flexDirection: stackNarrow ? 'column' : 'row',
            justifyContent: stackNarrow ? 'flex-start' : 'space-between',
            alignItems: stackNarrow ? 'stretch' : 'center',
            paddingVertical: 10,
            borderTopWidth: row.dividerTop ? 1 : 0,
            borderTopColor: C.divider,
            marginTop: row.dividerTop ? 4 : 0,
            gap: stackNarrow ? 4 : 12,
          }}
        >
          <Text style={{
            ...T.caption,
            color: row.bold ? C.primary : C.muted,
            fontWeight: row.bold ? '700' : '500',
            flex: 1,
          }} numberOfLines={2}>
            {row.label}
          </Text>
          <Text style={{
            fontSize: row.bold ? 16 : 14,
            fontWeight: row.bold ? '700' : '600',
            color: row.valueColor,
            ...tabularNums,
          }} numberOfLines={1}>
            {row.value}
          </Text>
        </View>
      ))}
    </MaytechTableFrame>
  );
}
