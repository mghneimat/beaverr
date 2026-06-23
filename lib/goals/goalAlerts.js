/**
 * @param {import('../schema').Goal[]} goals
 * @param {(key: string, params?: object) => string} t
 * @returns {import('../alerts').AlertRecord[]}
 */
export function scanGoalAlerts(goals, t) {
  /** @type {import('../alerts').AlertRecord[]} */
  const alerts = [];

  goals.forEach((goal) => {
    if (goal.lifecycleStatus === 'on_hold') {
      alerts.push({
        id: `goal-on-hold-${goal.id}`,
        type: 'goal_on_hold',
        urgency: 'medium',
        relatedId: goal.id,
        status: 'active',
        messageKey: 'dashboard.goalsScreen.alerts.onHold',
        messageParams: { name: goal.name },
        actionRoute: '/(app)/goals',
      });
    }

    if (goal.lifecycleStatus === 'paused') {
      alerts.push({
        id: `goal-paused-${goal.id}`,
        type: 'goal_paused',
        urgency: 'medium',
        relatedId: goal.id,
        status: 'active',
        messageKey: 'dashboard.goalsScreen.alerts.paused',
        messageParams: { name: goal.name },
        actionRoute: '/(app)/goals',
      });
    }

    if (goal.lifecycleStatus === 'active' && goal.paceStatus === 'behind') {
      alerts.push({
        id: `goal-behind-${goal.id}`,
        type: 'goal_behind_pace',
        urgency: 'low',
        relatedId: goal.id,
        status: 'active',
        messageKey: 'dashboard.goalsScreen.alerts.behindPace',
        messageParams: { name: goal.name },
        actionRoute: '/(app)/goals',
      });
    }
  });

  return alerts;
}

/**
 * @param {{ goalId: string, ruleId: string, reason: string }[]} fundingAlerts
 * @param {import('../schema').Goal[]} goals
 * @param {(key: string, params?: object) => string} t
 * @returns {import('../alerts').AlertRecord[]}
 */
export function scanGoalFundingAlerts(fundingAlerts, goals, t) {
  return fundingAlerts
    .filter((item) => item.reason === 'empty_source')
    .map((item) => {
      const goal = goals.find((g) => g.id === item.goalId);
      return {
        id: `goal-empty-source-${item.goalId}-${item.ruleId}`,
        type: 'goal_empty_source',
        urgency: 'medium',
        relatedId: item.goalId,
        status: 'active',
        messageKey: 'dashboard.goalsScreen.alerts.emptySource',
        messageParams: { name: goal?.name || t('dashboard.goalsScreen.emergencyDefaultName') },
        actionRoute: '/(app)/goals',
      };
    });
}
