import { View } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useI18n } from '../../lib/i18n';
import { GOAL_UI_SECTION_ORDER } from '../../lib/goals/goalCategories';
import { C, S, T } from '../../constants/onboarding-theme';
import GoalsCategorySection from './GoalsCategorySection';

const SECTION_TITLE_KEYS = {
  goals: 'dashboard.goalsScreen.sections.goals',
  reduceCosts: 'dashboard.goalsScreen.sections.reduceCosts',
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
}) {
  const { t } = useI18n();
  const hasVisibleGoals = filteredGoals.length > 0;

  if (!hasVisibleGoals) {
    return (
      <View style={{ paddingVertical: 24 }}>
        <Text style={{ ...T.helper, color: C.muted, textAlign: 'center' }}>
          {filter === 'archived'
            ? t('dashboard.goalsScreen.emptyArchived')
            : t('dashboard.goalsScreen.emptyActive')}
        </Text>
      </View>
    );
  }

  return (
    <View style={{ gap: S.tabSectionGap }}>
      {GOAL_UI_SECTION_ORDER.map((section) => (
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
          showAddGoal={filter === 'active' && section === 'goals'}
          onAddGoal={onAddGoal}
        />
      ))}
    </View>
  );
}
