import { useMemo } from 'react';
import { View } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useI18n } from '../../lib/i18n';
import { getCurrencySymbol } from '../../lib/currency';
import { formatCurrency } from '../../lib/finance';
import { buildStashHistoryChartData } from '../../lib/savingsProjection';
import { buildSavingsStashLines, getJarTitle } from '../../lib/jarRouting';
import {
  buildStashGoalLinkItems,
  jarLineIdToStashRef,
  sumPlannedMonthlyOutflowFromStash,
  computeStashBalanceBreakdown,
} from '../../lib/stashGoalLinkage';
import { getMovementsForStashRef } from '../../lib/stashMovements';
import { C, T, tabularNums } from '../../constants/onboarding-theme';
import SurfaceCard from '../ui/SurfaceCard';
import InCardSectionHeader from './InCardSectionHeader';
import TabSectionStack from './TabSectionStack';
import TabBackLink from './TabBackLink';
import StashBurnRateCard from './StashBurnRateCard';
import StashMovementHistoryList from './StashMovementHistoryList';
import StashGoalLinkageList from './StashGoalLinkageList';
import SavingsProjectionChart from './SavingsProjectionChart';

function stashDescription(line, t) {
  if (line.helperText) return line.helperText;
  if (!line.helperKey) return '';
  return t(line.helperKey, line.helperParams || {});
}

export default function SavingsStashDetailContent({ bundle, stashId }) {
  const { t } = useI18n();
  const budget = bundle.financials.budget || {};
  const income = bundle.financials.income || {};
  const goals = bundle.goals || [];
  const currency = getCurrencySymbol(bundle.financials.currencyCode);
  const { primary, custom } = buildSavingsStashLines({ budget, income });
  const line = [...primary, ...custom].find((item) => item.id === stashId);
  const title = line ? getJarTitle(line, t) : '';
  const stashRef = jarLineIdToStashRef(stashId);
  const linkItems = buildStashGoalLinkItems(goals, stashRef);
  const plannedOutflow = sumPlannedMonthlyOutflowFromStash(goals, stashRef);
  const balance = line ? Number(line.balance) || 0 : 0;
  const movements = getMovementsForStashRef(budget, stashRef);
  const { total: totalBalance, reserved: reservedBalance, available: availableBalance } =
    computeStashBalanceBreakdown(balance, goals, stashRef, movements);
  const description = line ? stashDescription(line, t) : '';
  const historyChartData = useMemo(
    () => buildStashHistoryChartData({
      budget,
      stashRef,
      currentBalance: balance,
    }),
    [budget, stashRef, balance],
  );

  if (!line) {
    return (
      <TabSectionStack>
        <TabBackLink pop route="savings" labelKey="dashboard.savingsScreen.detail.back" />
        <Text accessibilityRole="header" style={{ ...T.questionTitle, fontSize: 28, marginBottom: 0 }}>
          {t('dashboard.savingsScreen.detail.notFound')}
        </Text>
      </TabSectionStack>
    );
  }

  return (
    <TabSectionStack>
      <TabBackLink pop route="savings" labelKey="dashboard.savingsScreen.detail.back" />
      <Text accessibilityRole="header" style={{ ...T.questionTitle, fontSize: 28, marginBottom: 0 }}>
        {title}
      </Text>

      <SurfaceCard>
        <InCardSectionHeader title={t('dashboard.savingsScreen.detail.overviewTitle')} />
        <Text style={{ fontSize: 32, fontWeight: '700', color: C.primary, lineHeight: 40, ...tabularNums }}>
          {formatCurrency(totalBalance, currency)}
        </Text>
        <View style={{ marginTop: 12, gap: 12, alignItems: 'flex-start' }}>
          {reservedBalance > 0 ? (
            <View style={{ gap: 2 }}>
              <Text style={{ ...T.helper, color: C.muted }}>
                {t('dashboard.savingsScreen.detail.reservedBalance')}
              </Text>
              <Text style={{ ...T.helper, color: C.muted, ...tabularNums }}>
                {formatCurrency(reservedBalance, currency)}
              </Text>
            </View>
          ) : null}
          <View style={{ gap: 2 }}>
            <Text style={{ ...T.helper, fontWeight: '600', color: C.primary }}>
              {t('dashboard.savingsScreen.detail.availableBalance')}
            </Text>
            <Text style={{ ...T.helper, fontWeight: '600', color: C.primary, ...tabularNums }}>
              {formatCurrency(availableBalance, currency)}
            </Text>
          </View>
        </View>
        {description ? (
          <Text style={{ ...T.helper, color: C.muted, marginTop: 12 }}>
            {description}
          </Text>
        ) : null}
      </SurfaceCard>

      <StashBurnRateCard
        balance={balance}
        movements={movements}
        goals={goals}
        currency={currency}
        plannedMonthlyOutflow={plannedOutflow}
      />

      <StashGoalLinkageList
        linkItems={linkItems}
        currency={currency}
        plannedOutflow={plannedOutflow}
        uncommittedBalance={availableBalance}
        formatAmount={(amount) => formatCurrency(amount, currency)}
      />

      <StashMovementHistoryList
        movements={movements}
        budget={budget}
        currency={currency}
        emptyKey="dashboard.savingsScreen.detail.noMovements"
      />

      <SurfaceCard>
        <InCardSectionHeader
          title={t('dashboard.savingsScreen.detail.historyChart.title')}
          style={{ marginBottom: 20 }}
        />
        <SavingsProjectionChart
          chartData={historyChartData}
          currency={currency}
          variant="historical"
        />
      </SurfaceCard>
    </TabSectionStack>
  );
}
