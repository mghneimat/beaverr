import { useCallback, useEffect, useMemo, useState } from 'react';
import { useI18n } from '../../lib/i18n';
import { getCurrencySymbol } from '../../lib/currency';
import { replaceGoalsAfterArchive, resetGoalProgress } from '../../lib/goals/goalCrud';
import { groupGoalsForUiSections } from '../../lib/goals/goalCategories';
import { notifyDashboardRefresh } from '../../lib/dashboardRefresh';
import TabSectionStack from './TabSectionStack';
import TabInsightCard from './TabInsightCard';
import GoalsPortfolioHeroCard from './GoalsPortfolioHeroCard';
import GoalsFilterToggle from './GoalsFilterToggle';
import GoalsFilterSlideView from './GoalsFilterSlideView';
import GoalsFilterPanel from './GoalsFilterPanel';
import GoalCelebrationModal from './GoalCelebrationModal';
import CreateGoalSheet from './CreateGoalSheet';
import EditGoalSheet from './EditGoalSheet';
import GoalFundingSheet from './GoalFundingSheet';
import SetGoalDeadlineSheet from './SetGoalDeadlineSheet';
import ConfirmDialog from '../ui/ConfirmDialog';

export default function GoalsContent({ bundle }) {
  const { t } = useI18n();
  const currency = getCurrencySymbol(bundle.financials.currencyCode);
  const goals = bundle.goals || [];
  const [filter, setFilter] = useState('active');
  const [createOpen, setCreateOpen] = useState(false);
  const [createMode, setCreateMode] = useState('savings');
  const [editGoal, setEditGoal] = useState(null);
  const [deadlineGoal, setDeadlineGoal] = useState(null);
  const [fundingGoal, setFundingGoal] = useState(null);
  const [resetTarget, setResetTarget] = useState(null);
  const [resetErrorOpen, setResetErrorOpen] = useState(false);
  const [celebrationQueue, setCelebrationQueue] = useState(bundle.pendingCelebrations || []);
  const [celebrationVisible, setCelebrationVisible] = useState(false);

  useEffect(() => {
    if ((bundle.pendingCelebrations || []).length > 0) {
      setCelebrationQueue(bundle.pendingCelebrations);
    }
  }, [bundle.pendingCelebrations]);

  useEffect(() => {
    if (celebrationQueue.length > 0 && !celebrationVisible) {
      setCelebrationVisible(true);
    }
  }, [celebrationQueue, celebrationVisible]);

  const activeGoals = useMemo(
    () => goals.filter((g) => g.lifecycleStatus !== 'archived'),
    [goals],
  );
  const archivedGoals = useMemo(
    () => goals.filter((g) => g.lifecycleStatus === 'archived'),
    [goals],
  );

  const groupedActive = useMemo(
    () => groupGoalsForUiSections(activeGoals),
    [activeGoals],
  );
  const groupedArchived = useMemo(
    () => groupGoalsForUiSections(archivedGoals),
    [archivedGoals],
  );

  const fundingGoalLive = fundingGoal
    ? goals.find((g) => g.id === fundingGoal.id) || fundingGoal
    : null;

  const celebrationGoal = celebrationQueue.length > 0
    ? goals.find((g) => g.id === celebrationQueue[0])
    : null;

  const handleCelebrationDismiss = () => {
    setCelebrationVisible(false);
    setCelebrationQueue((prev) => prev.slice(1));
    setTimeout(() => {
      setCelebrationQueue((prev) => {
        if (prev.length > 0) setCelebrationVisible(true);
        return prev;
      });
    }, 300);
  };

  const handleArchive = useCallback(async (goal) => {
    await replaceGoalsAfterArchive(goal.id);
    notifyDashboardRefresh();
  }, []);

  const handleResetConfirm = useCallback(async () => {
    if (!resetTarget) return;
    const { error } = await resetGoalProgress(resetTarget.id);
    if (error) {
      setResetTarget(null);
      setResetErrorOpen(true);
      return;
    }
    setResetTarget(null);
    notifyDashboardRefresh();
  }, [resetTarget]);

  const panelProps = {
    currency,
    financials: bundle.financials,
    onEdit: setEditGoal,
    onSetDeadline: setDeadlineGoal,
    onArchive: handleArchive,
    onFundingPress: setFundingGoal,
    onResetPress: setResetTarget,
    onAddGoal: () => {
      setCreateMode('savings');
      setCreateOpen(true);
    },
    onAddDebt: () => {
      setCreateMode('debt');
      setCreateOpen(true);
    },
  };

  return (
    <TabSectionStack>
      <GoalsPortfolioHeroCard
        goals={activeGoals}
        debts={bundle.financials?.debts}
        currency={currency}
      />

      <TabInsightCard
        tabKey="goals"
        financials={bundle.financials}
        helpers={{ goals, goalGap: bundle.insights?.goalGap }}
      />

      <GoalsFilterToggle
        value={filter}
        onChange={setFilter}
        activeLabel={t('dashboard.goalsScreen.filter.active')}
        archivedLabel={t('dashboard.goalsScreen.filter.archived')}
      />

      <GoalsFilterSlideView filter={filter}>
        <GoalsFilterPanel
          filter="active"
          filteredGoals={activeGoals}
          groupedGoals={groupedActive}
          {...panelProps}
        />
        <GoalsFilterPanel
          filter="archived"
          filteredGoals={archivedGoals}
          groupedGoals={groupedArchived}
          {...panelProps}
        />
      </GoalsFilterSlideView>

      <CreateGoalSheet
        visible={createOpen}
        onClose={() => setCreateOpen(false)}
        financials={bundle.financials}
        goals={goals}
        createMode={createMode}
      />
      <EditGoalSheet
        visible={Boolean(editGoal)}
        goal={editGoal}
        currency={currency}
        onClose={() => setEditGoal(null)}
      />
      <SetGoalDeadlineSheet
        visible={Boolean(deadlineGoal)}
        goal={deadlineGoal}
        onClose={() => setDeadlineGoal(null)}
      />
      <GoalFundingSheet
        visible={Boolean(fundingGoalLive)}
        goal={fundingGoalLive}
        budget={bundle.financials?.budget}
        income={bundle.financials?.income}
        debts={bundle.financials?.debts}
        currency={currency}
        onClose={() => setFundingGoal(null)}
      />
      <GoalCelebrationModal
        visible={celebrationVisible && Boolean(celebrationGoal)}
        goalName={celebrationGoal?.name || ''}
        onDismiss={handleCelebrationDismiss}
      />
      <ConfirmDialog
        visible={Boolean(resetTarget)}
        title={t('dashboard.goalsScreen.reset.confirmTitle')}
        message={resetTarget?.type === 'debt'
          ? t('dashboard.goalsScreen.reset.confirmBodyDebt', { name: resetTarget.name })
          : t('dashboard.goalsScreen.reset.confirmBody', { name: resetTarget?.name || '' })}
        confirmLabel={t('dashboard.goalsScreen.reset.confirmAction')}
        cancelLabel={t('common.cancel')}
        destructive
        onConfirm={handleResetConfirm}
        onCancel={() => setResetTarget(null)}
      />
      <ConfirmDialog
        visible={resetErrorOpen}
        infoOnly
        title={t('dashboard.goalsScreen.reset.errorTitle')}
        message={t('dashboard.goalsScreen.reset.error')}
        confirmLabel={t('dashboard.metricExplain.gotIt')}
        onConfirm={() => setResetErrorOpen(false)}
        onCancel={() => setResetErrorOpen(false)}
      />
    </TabSectionStack>
  );
}
