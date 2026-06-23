import { View } from 'react-native';
import { C } from '../../../constants/onboarding-theme';
import { useI18n } from '../../../lib/i18n';
import CycleActionCell from './CycleActionCell';
import CycleControlButtonIcon, { CycleControlPlusIcon } from './CycleControlButtonIcon';

const CYCLE_END_RED = '#C02B33';
const CYCLE_START_GREEN = '#317325';

export default function CycleActionGrid({
  cycleActive,
  spentToday = 0,
  currency,
  onLogSpend,
  onAddIncome,
  onAddExpense,
  onStartPress,
  onEndPress,
  dueTodayCount = 0,
}) {
  const { t } = useI18n();
  const lockedA11y = t('dashboard.cycles.oneOffs.lockedA11y');
  const logDisabledA11y = t('dashboard.cycles.control.logSpendDisabledA11y');

  const plusIcon = (disabled) => (
    <CycleControlPlusIcon color={disabled ? C.muted : C.primary} />
  );

  const cycleIcon = (ending, disabled) => (
    <CycleControlButtonIcon
      ending={ending}
      color={disabled ? C.muted : ending ? CYCLE_END_RED : CYCLE_START_GREEN}
    />
  );

  const showSpentToday = cycleActive && spentToday > 0;

  return (
    <View style={{ gap: 10, width: '100%' }}>
      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'stretch' }}>
        <CycleActionCell
          title={t('dashboard.cycles.control.actions.logSpend.title')}
          subtitle={t('dashboard.cycles.control.actions.logSpend.subtitle')}
          icon={plusIcon(!cycleActive)}
          onPress={cycleActive ? onLogSpend : undefined}
          disabled={!cycleActive}
          lockedA11y={logDisabledA11y}
          accessibilityLabel={t('dashboard.cycles.control.logSpendA11y')}
          footerAmount={showSpentToday ? spentToday : undefined}
          footerCurrency={currency}
        />
        <CycleActionCell
          title={t('dashboard.cycles.control.actions.addIncome.title')}
          subtitle={t('dashboard.cycles.control.actions.addIncome.subtitle')}
          icon={plusIcon(!cycleActive)}
          onPress={cycleActive ? onAddIncome : undefined}
          disabled={!cycleActive}
          lockedA11y={lockedA11y}
          accessibilityLabel={t('dashboard.cycles.oneOffs.tiles.income.addA11y')}
        />
      </View>
      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'stretch' }}>
        <CycleActionCell
          title={t('dashboard.cycles.control.actions.addExpense.title')}
          subtitle={t('dashboard.cycles.control.actions.addExpense.subtitle')}
          icon={plusIcon(!cycleActive)}
          onPress={cycleActive ? onAddExpense : undefined}
          disabled={!cycleActive}
          lockedA11y={lockedA11y}
          accessibilityLabel={t('dashboard.cycles.oneOffs.tiles.expense.addA11y')}
          badgeLabel={
            dueTodayCount > 0
              ? t('dashboard.cycles.oneOffs.dueToday.badge', { count: String(dueTodayCount) })
              : null
          }
        />
        <CycleActionCell
          title={
            cycleActive
              ? t('dashboard.cycles.control.actions.endCycle.title')
              : t('dashboard.cycles.control.actions.startCycle.title')
          }
          subtitle={
            cycleActive
              ? t('dashboard.cycles.control.actions.endCycle.subtitle')
              : t('dashboard.cycles.control.actions.startCycle.subtitle')
          }
          icon={cycleIcon(cycleActive, false)}
          onPress={cycleActive ? onEndPress : onStartPress}
          variant={cycleActive ? 'destructive' : 'positive'}
          accessibilityLabel={
            cycleActive
              ? t('dashboard.cycles.endCycle.ctaA11y')
              : t('dashboard.cycles.noActive.ctaA11y')
          }
        />
      </View>
    </View>
  );
}
