import { View } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useI18n } from '../../lib/i18n';
import { formatCurrency } from '../../lib/finance';
import { C, T, tabularNums } from '../../constants/onboarding-theme';
import SurfaceCard from '../ui/SurfaceCard';
import InCardSectionHeader from './InCardSectionHeader';
import RecurringCommitmentsCard from './RecurringCommitmentsCard';

export default function FixedRecurringSummary({
  financials,
  insights,
  currency,
  recurringInsight,
}) {
  const { t } = useI18n();

  const fixedMonthly = financials.fixedCosts + financials.debtPayments;
  const recurringMonthly = insights.recurringMonthly || 0;
  const totalIncome = financials.totalIncome || 0;
  const fixedPct = totalIncome > 0 ? Math.round((fixedMonthly / totalIncome) * 100) : 0;
  const recurringPct = totalIncome > 0 ? Math.round((recurringMonthly / totalIncome) * 100) : 0;
  const combinedPct = totalIncome > 0 ? Math.round(((fixedMonthly + recurringMonthly) / totalIncome) * 100) : 0;

  return (
    <View style={{ gap: 16 }}>
      <SurfaceCard>
        <InCardSectionHeader title={t('dashboard.expensesScreen.fixedRecurring.title')} />
        <View style={{ gap: 10 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ ...T.caption, fontWeight: '600', color: C.muted }}>
                {t('dashboard.expensesScreen.fixedRecurring.fixedCosts')}
              </Text>
              <Text style={{ fontSize: 18, fontWeight: '700', color: C.primary, marginTop: 4, ...tabularNums }}>
                {formatCurrency(fixedMonthly, currency)}
              </Text>
              <Text style={{ ...T.caption, color: C.muted, marginTop: 2 }}>
                {t('dashboard.expensesScreen.fixedRecurring.ofIncome', { pct: fixedPct })}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ ...T.caption, fontWeight: '600', color: C.muted }}>
                {t('dashboard.expensesScreen.fixedRecurring.recurring')}
              </Text>
              <Text style={{ fontSize: 18, fontWeight: '700', color: C.primary, marginTop: 4, ...tabularNums }}>
                {formatCurrency(recurringMonthly, currency)}
              </Text>
              <Text style={{ ...T.caption, color: C.muted, marginTop: 2 }}>
                {t('dashboard.expensesScreen.fixedRecurring.ofIncome', { pct: recurringPct })}
              </Text>
            </View>
          </View>

          <View style={{
            marginTop: 8,
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: C.divider,
          }}>
            <Text style={{ ...T.caption, fontWeight: '600', color: C.muted }}>
              {t('dashboard.expensesScreen.fixedRecurring.combined')}
            </Text>
            <Text style={{ ...T.helper, marginTop: 4 }}>
              {t('dashboard.expensesScreen.fixedRecurring.salaryImpact', {
                amount: formatCurrency(fixedMonthly + recurringMonthly, currency),
                income: formatCurrency(totalIncome, currency),
                pct: combinedPct,
              })}
            </Text>
          </View>
        </View>
      </SurfaceCard>

      <RecurringCommitmentsCard
        title={t('dashboard.home.recurring.title')}
        insight={recurringInsight}
        items={financials.recurringCommitments}
        currency={currency}
        annualLabel={t('dashboard.home.recurring.annual')}
        reviewLabel={t('dashboard.home.recurring.review')}
        showReviewButton={false}
      />
    </View>
  );
}
