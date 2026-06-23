import { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useI18n } from '../../lib/i18n';
import {
  formatFundingRuleAmountLine,
  formatFundingRuleFrequencyLabel,
  formatFundingRuleNextMoveLine,
} from '../../lib/goals/goalFundingDisplay';
import { removeGoalFundingRule } from '../../lib/goals/goalCrud';
import { notifyDashboardRefresh } from '../../lib/dashboardRefresh';
import { navigateToGoalDetail } from '../../lib/screenTransition';
import InCardSectionHeader from './InCardSectionHeader';
import FundingSplitLinkRow from './FundingSplitLinkRow';
import SurfaceCard from '../ui/SurfaceCard';
import { Text } from '@gluestack-ui/themed';
import { C, T } from '../../constants/onboarding-theme';

export default function StashGoalLinkageList({
  linkItems,
  currency,
  plannedOutflow,
  uncommittedBalance,
  formatAmount,
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [deletingRuleId, setDeletingRuleId] = useState(null);
  const [errorText, setErrorText] = useState('');

  const handleBreakLink = async (goalId, ruleId) => {
    setDeletingRuleId(ruleId);
    setErrorText('');
    try {
      const result = await removeGoalFundingRule(goalId, ruleId);
      if (result.error) {
        setErrorText(t('dashboard.goalsScreen.funding.saveError'));
        return;
      }
      notifyDashboardRefresh();
    } catch {
      setErrorText(t('dashboard.goalsScreen.funding.saveError'));
    } finally {
      setDeletingRuleId(null);
    }
  };

  if (linkItems.length === 0) {
    return (
      <SurfaceCard>
        <InCardSectionHeader title={t('dashboard.savingsScreen.detail.linkedGoalsTitle')} />
        <Text style={{ ...T.helper, color: C.muted }}>
          {t('dashboard.savingsScreen.detail.noLinkedGoals')}
        </Text>
      </SurfaceCard>
    );
  }

  return (
    <SurfaceCard>
      <InCardSectionHeader title={t('dashboard.savingsScreen.detail.linkedGoalsTitle')} />
      <View style={{ gap: 10 }}>
        {linkItems.map(({ goal, rule }) => {
          const amountLine = formatFundingRuleAmountLine(rule, t, currency);
          const frequencyLabel = formatFundingRuleFrequencyLabel(rule, t);
          const nextDateLine = formatFundingRuleNextMoveLine(rule, t);
          const isDeleting = deletingRuleId !== null;

          return (
            <FundingSplitLinkRow
              key={`${goal.id}-${rule.id}`}
              label={goal.name}
              amountValue={Number(rule.amount) || 0}
              currency={currency}
              frequencyLabel={frequencyLabel}
              nextDateLine={nextDateLine}
              onPress={() => navigateToGoalDetail(router, goal.id)}
              onDelete={() => handleBreakLink(goal.id, rule.id)}
              deleting={isDeleting}
              deleteAccessibilityLabel={t('dashboard.goalsScreen.funding.deleteRuleA11y')}
              accessibilityLabel={t('dashboard.savingsScreen.detail.linkRowA11y', {
                goal: goal.name,
                amount: amountLine,
                frequency: frequencyLabel,
              })}
            />
          );
        })}
      </View>

      {errorText ? (
        <Text style={{ ...T.caption, color: '#D14040', marginTop: 10 }}>
          {errorText}
        </Text>
      ) : null}

      <View style={{ marginTop: 16, gap: 8, paddingTop: 16, borderTopWidth: 1, borderTopColor: C.border }}>
        {plannedOutflow > 0 ? (
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ ...T.helper, flex: 1, paddingRight: 8 }}>
              {t('dashboard.savingsScreen.detail.plannedOutflow')}
            </Text>
            <Text style={{ ...T.helper, fontWeight: '600' }}>
              {formatAmount(plannedOutflow)}
            </Text>
          </View>
        ) : null}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ ...T.helper, flex: 1, paddingRight: 8 }}>
            {t('dashboard.savingsScreen.detail.uncommitted')}
          </Text>
          <Text style={{ ...T.helper, fontWeight: '600' }}>
            {formatAmount(uncommittedBalance)}
          </Text>
        </View>
        <Text style={{ ...T.caption, color: C.muted }}>
          {t('dashboard.savingsScreen.detail.uncommittedHelper')}
        </Text>
      </View>
    </SurfaceCard>
  );
}
