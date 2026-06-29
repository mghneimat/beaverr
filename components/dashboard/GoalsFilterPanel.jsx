import { View } from 'react-native';
import { useI18n } from '../../lib/i18n';
import { GOAL_UI_SECTION_ORDER } from '../../lib/goals/goalCategories';
import { S } from '../../constants/onboarding-theme';
import GoalsCategorySection from './GoalsCategorySection';
import DashboardSectionEmptyMessage from './DashboardSectionEmptyMessage';

const SECTION_TITLE_KEYS = {
  goals: 'dashboard.goalsScreen.sections.goals',
  debts: 'dashboard.goalsScreen.sections.debt',
  reduceCosts: 'dashboard.goalsScreen.sections.reduceCosts',
};

const SECTION_ADD_CONFIG = {
  goals: {
    labelKey: 'dashboard.goalsScreen.addGoal',
    a11yKey: 'dashboard.goalsScreen.addGoalA11y',
  },
  debts: {
    labelKey: 'dashboard.goalsScreen.addDebt',
    a11yKey: 'dashboard.goalsScreen.addDebtA11y',
  },
};

export default function GoalsFilterPanel({
  filter,
  groupedGoals,
  filteredGoals,
  currency,
  financials,
  onEdit,
  onSetDeadline,
  onArchive,
  onFundingPress,
  onResetPress,
  onAddGoal,
  onAddDebt,
}) {
  const { t } = useI18n();
  const hasVisibleGoals = filteredGoals.length > 0;

  if (!hasVisibleGoals && filter === 'archived') {
    return (
      <DashboardSectionEmptyMessage
        message={t('dashboard.goalsScreen.emptyArchived')}
        variant="centered"
      />
    );
  }

  return (
    <View style={{ gap: S.tabSectionGap }}>
      {GOAL_UI_SECTION_ORDER.map((section) => {
        const addConfig = SECTION_ADD_CONFIG[section];
        return (
        <GoalsCategorySection
          key={section}
          title={t(SECTION_TITLE_KEYS[section])}
          goals={groupedGoals[section]}
          currency={currency}
          financials={financials}
          onEdit={onEdit}
          onSetDeadline={onSetDeadline}
          onArchive={onArchive}
          onFundingPress={onFundingPress}
          onResetPress={onResetPress}
          showAddGoal={filter === 'active' && (section === 'goals' || section === 'debts')}
          onAddGoal={section === 'debts' ? onAddDebt : onAddGoal}
          addGoalLabel={addConfig ? t(addConfig.labelKey) : undefined}
          addGoalA11y={addConfig ? t(addConfig.a11yKey) : undefined}
          alwaysShow={filter === 'active' && section === 'goals'}
          emptyMessage={t('dashboard.goalsScreen.sections.goalsEmpty')}
        />
        );
      })}
    </View>
  );
}
