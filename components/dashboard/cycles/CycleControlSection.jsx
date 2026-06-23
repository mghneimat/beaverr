import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useI18n } from '../../../lib/i18n';
import {
  activeCycleAdjustments,
  cancelCycleAdjustment,
  dueAdjustmentsToday,
} from '../../../lib/cycleAdjustments';
import { isoDateKey, sumSpentOnDate } from '../../../lib/dailyLog';
import { notifyDashboardRefresh } from '../../../lib/dashboardRefresh';
import { C, T } from '../../../constants/onboarding-theme';
import ConfirmDialog from '../../ui/ConfirmDialog';
import CycleAdjustmentSheet from './CycleAdjustmentSheet';
import CycleActionGrid from './CycleActionGrid';
import CycleOneOffPreview from './CycleOneOffPreview';
import CycleQuickLinksRow from './CycleQuickLinksRow';
import SpendLogSheet from './SpendLogSheet';

export default function CycleControlSection({
  activeCycle,
  cycleAdjustments = [],
  currency,
  dailyLogs = [],
  onStartPress,
  onEndPress,
  onLogDueDay,
}) {
  const { t } = useI18n();
  const today = isoDateKey();
  const cycleActive = Boolean(activeCycle);
  const [sheetKind, setSheetKind] = useState(null);
  const [spendLogOpen, setSpendLogOpen] = useState(false);
  const [pendingCancel, setPendingCancel] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const rows = useMemo(
    () => (cycleActive ? activeCycleAdjustments(cycleAdjustments, activeCycle.id) : []),
    [cycleAdjustments, activeCycle, cycleActive],
  );

  const incomeRows = useMemo(() => rows.filter((r) => r.kind === 'income'), [rows]);
  const expenseRows = useMemo(() => rows.filter((r) => r.kind === 'expense'), [rows]);

  const dueTodayExpenses = useMemo(() => {
    if (!cycleActive) return [];
    return dueAdjustmentsToday(cycleAdjustments, activeCycle.id, today)
      .filter((r) => r.kind === 'expense');
  }, [cycleAdjustments, activeCycle, today, cycleActive]);

  const handleConfirmCancel = async () => {
    if (!pendingCancel) return;
    setCancelling(true);
    try {
      await cancelCycleAdjustment(pendingCancel.id);
      notifyDashboardRefresh();
    } finally {
      setCancelling(false);
      setPendingCancel(null);
    }
  };

  const openSheet = (kind) => {
    if (!cycleActive) return;
    setSheetKind(kind);
  };

  const closeSheet = () => setSheetKind(null);
  const spentToday = sumSpentOnDate(dailyLogs, today);

  return (
    <>
      <View>
        <Text style={{ ...T.cardTitle, marginBottom: 4 }}>
          {t('dashboard.cycles.control.title')}
        </Text>
        <Text style={{ ...T.caption, color: C.muted, marginBottom: 12 }}>
          {t('dashboard.cycles.control.helper')}
        </Text>

        <CycleActionGrid
          cycleActive={cycleActive}
          spentToday={spentToday}
          currency={currency}
          onLogSpend={() => setSpendLogOpen(true)}
          onAddIncome={() => openSheet('income')}
          onAddExpense={() => openSheet('expense')}
          onStartPress={onStartPress}
          onEndPress={onEndPress}
          dueTodayCount={dueTodayExpenses.length}
        />

        <CycleOneOffPreview
          incomeRows={incomeRows}
          expenseRows={expenseRows}
          currency={currency}
          onRemoveRow={setPendingCancel}
          removeA11yFor={(label) => t('dashboard.cycles.oneOffs.cancelA11y', { label })}
          dueRows={dueTodayExpenses}
          onLogDueDay={
            onLogDueDay
              ? (row) => onLogDueDay(row.paymentDate || today)
              : undefined
          }
          logDueLabel={t('dashboard.cycles.oneOffs.dueToday.logSpend')}
        />

        <CycleQuickLinksRow />
      </View>

      <SpendLogSheet
        visible={spendLogOpen}
        onClose={() => setSpendLogOpen(false)}
        isoDate={today}
        cycleId={activeCycle?.id}
        currency={currency}
      />

      <CycleAdjustmentSheet
        visible={sheetKind != null}
        onClose={closeSheet}
        cycleId={activeCycle?.id}
        currency={currency}
        defaultKind={sheetKind || 'expense'}
      />

      <ConfirmDialog
        visible={!!pendingCancel}
        title={t('dashboard.cycles.oneOffs.cancelConfirmTitle')}
        message={t('dashboard.cycles.oneOffs.cancelConfirmMessage', {
          label: pendingCancel?.label || '',
        })}
        confirmLabel={t('dashboard.cycles.oneOffs.cancelConfirmYes')}
        cancelLabel={t('common.cancel')}
        destructive
        onConfirm={handleConfirmCancel}
        onCancel={() => !cancelling && setPendingCancel(null)}
      />
    </>
  );
}
