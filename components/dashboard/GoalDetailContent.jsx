import { View } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useI18n } from '../../lib/i18n';
import { getCurrencySymbol } from '../../lib/currency';
import { formatCurrency } from '../../lib/finance';
import { computeProgressPercent } from '../../lib/goals';
import { goalHasDeadline } from '../../lib/goals/goalPace';
import {
  formatFundingRuleAmountLine,
  formatFundingRuleFrequencyLabel,
  formatFundingRuleNextMoveLine,
  resolveStashRefLabel,
} from '../../lib/goals/goalFundingDisplay';
import { getMovementsForGoal } from '../../lib/stashMovements';
import { navigateToSavingsStashDetail } from '../../lib/screenTransition';
import { C, T, tabularNums } from '../../constants/onboarding-theme';
import {
  DASHBOARD_MOTION_DURATION,
  DASHBOARD_MOTION_DURATION_FAST,
} from '../../lib/dashboardMotion';
import { useReducedMotion } from '../../lib/useReducedMotion';
import SurfaceCard from '../ui/SurfaceCard';
import InCardSectionHeader from './InCardSectionHeader';
import TabSectionStack from './TabSectionStack';
import TabBackLink from './TabBackLink';
import GoalProgressBar from './GoalProgressBar';
import AnimatedCollapse from './AnimatedCollapse';
import StatusChip from './StatusChip';
import StashMovementHistoryList from './StashMovementHistoryList';
import FundingSplitLinkRow from './FundingSplitLinkRow';

function paceChipVariant(paceKey) {
  if (paceKey === 'on_track' || paceKey === 'ahead') return 'positive';
  if (paceKey === 'behind' || paceKey === 'regressed') return 'danger';
  return 'muted';
}

function lifecycleChipVariant(statusKey) {
  if (statusKey === 'completed') return 'positive';
  if (statusKey === 'on_hold') return 'info';
  return 'muted';
}

export default function GoalDetailContent({ bundle, goalId }) {
  const { t } = useI18n();
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const currency = getCurrencySymbol(bundle.financials.currencyCode);
  const budget = bundle.financials.budget || {};
  const goal = (bundle.goals || []).find((item) => item.id === goalId);

  if (!goal) {
    return (
      <TabSectionStack>
        <TabBackLink pop route="goals" labelKey="dashboard.goalsScreen.detail.back" />
        <Text accessibilityRole="header" style={{ ...T.questionTitle, fontSize: 28, marginBottom: 0 }}>
          {t('dashboard.goalsScreen.detail.notFound')}
        </Text>
      </TabSectionStack>
    );
  }

  const isReduceCosts = goal.type === 'reduceCosts';
  const isDebtGoal = goal.type === 'debt';
  const debt = isDebtGoal && goal.linkedDebtId
    ? (bundle.financials.debts || []).find((d, i) => (d.id || `debt_${i}`) === goal.linkedDebtId)
    : null;
  const debtBalance = debt ? Number(debt.balance) : undefined;
  const progress = computeProgressPercent(goal, debtBalance);
  const hasDeadline = goalHasDeadline(goal);
  const isOnHold = goal.lifecycleStatus === 'on_hold';
  const paceKey = goal.paceStatus || 'on_track';
  const fundingRules = (goal.fundingRules || []).filter((r) => (Number(r.amount) || 0) > 0);
  const movements = getMovementsForGoal(budget, goal.id);

  const value = formatCurrency(goal.currentAmount, currency);
  const currentAmount = Number(goal.currentAmount) || 0;
  const targetLabel = isDebtGoal
    ? t('dashboard.goalsScreen.totalDebt')
    : t('dashboard.goalsScreen.target');

  const statusChip = isOnHold
    ? { label: t('dashboard.goalsScreen.lifecycle.on_hold'), variant: lifecycleChipVariant('on_hold') }
    : goal.paceStatus && goal.lifecycleStatus === 'active' && hasDeadline
      ? { label: t(`dashboard.goalsScreen.pace.${paceKey}`), variant: paceChipVariant(paceKey) }
      : goal.lifecycleStatus !== 'active'
        ? {
          label: t(`dashboard.goalsScreen.lifecycle.${goal.lifecycleStatus}`),
          variant: lifecycleChipVariant(goal.lifecycleStatus),
        }
        : null;

  const statusChipNode = statusChip ? (
    reduceMotion ? (
      <StatusChip label={statusChip.label} variant={statusChip.variant} />
    ) : (
      <Animated.View
        entering={FadeIn.duration(DASHBOARD_MOTION_DURATION)}
        exiting={FadeOut.duration(DASHBOARD_MOTION_DURATION_FAST)}
      >
        <StatusChip label={statusChip.label} variant={statusChip.variant} />
      </Animated.View>
    )
  ) : null;

  return (
    <TabSectionStack>
      <TabBackLink pop route="goals" labelKey="dashboard.goalsScreen.detail.back" />
      <Text accessibilityRole="header" style={{ ...T.questionTitle, fontSize: 28, marginBottom: 0 }}>
        {goal.name}
      </Text>

      {!isReduceCosts ? (
        <SurfaceCard>
          <InCardSectionHeader
            title={t('dashboard.goalsScreen.detail.overviewTitle')}
            trailing={statusChipNode}
          />
          <Text style={{ fontSize: 32, fontWeight: '700', color: C.primary, ...tabularNums }}>
            {formatCurrency(currentAmount, currency)}
          </Text>
          {goal.targetAmount ? (
            <View style={{ flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', columnGap: 6, marginTop: 8 }}>
              <Text style={{ ...T.caption, color: C.muted, fontWeight: '600' }}>
                {targetLabel}
              </Text>
              <Text style={{ fontSize: 14, lineHeight: 20, fontWeight: '600', color: C.muted, ...tabularNums }}>
                {formatCurrency(Number(goal.targetAmount) || 0, currency)}
              </Text>
            </View>
          ) : null}
          {hasDeadline ? (
            <Text style={{ ...T.caption, color: C.muted, marginTop: 8 }}>
              {t('dashboard.goalsScreen.deadline', { date: goal.endDate })}
            </Text>
          ) : (
            <Text style={{ ...T.caption, color: C.muted, marginTop: 8 }}>
              {t('dashboard.goalsScreen.noDeadline')}
            </Text>
          )}
          {goal.description ? (
            <Text style={{ ...T.helper, color: C.muted, marginTop: 8 }}>
              {goal.description}
            </Text>
          ) : null}
          <AnimatedCollapse visible={hasDeadline} fallbackHeight={36}>
            <View style={{ marginTop: 16 }}>
              <GoalProgressBar percent={progress} />
            </View>
          </AnimatedCollapse>
        </SurfaceCard>
      ) : null}

      {!isReduceCosts ? (
        <SurfaceCard>
          <InCardSectionHeader title={t('dashboard.goalsScreen.detail.fundingTitle')} />
          {fundingRules.length === 0 ? (
            <Text style={{ ...T.helper, color: C.muted }}>
              {t('dashboard.goalsScreen.detail.noFunding')}
            </Text>
          ) : (
            <View style={{ gap: 10 }}>
              {fundingRules.map((rule) => {
                const tabName = resolveStashRefLabel(rule.stashRef, budget, t);
                const amountLine = formatFundingRuleAmountLine(rule, t, currency);
                const frequencyLabel = formatFundingRuleFrequencyLabel(rule, t);
                const nextDateLine = formatFundingRuleNextMoveLine(rule, t);

                return (
                  <FundingSplitLinkRow
                    key={rule.id}
                    label={tabName}
                    amountValue={Number(rule.amount) || 0}
                    currency={currency}
                    frequencyLabel={frequencyLabel}
                    nextDateLine={nextDateLine}
                    onPress={() => navigateToSavingsStashDetail(router, rule.stashRef)}
                    accessibilityLabel={t('dashboard.goalsScreen.detail.linkRowA11y', {
                      tab: tabName,
                      amount: amountLine,
                      frequency: frequencyLabel,
                    })}
                  />
                );
              })}
            </View>
          )}
        </SurfaceCard>
      ) : null}

      {!isReduceCosts ? (
        <StashMovementHistoryList
          movements={movements}
          budget={budget}
          currency={currency}
          titleKey="dashboard.goalsScreen.detail.historyTitle"
          emptyKey="dashboard.goalsScreen.detail.noMovements"
        />
      ) : null}
    </TabSectionStack>
  );
}
