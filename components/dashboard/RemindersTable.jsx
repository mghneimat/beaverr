import { useMemo, useCallback } from 'react';
import { View } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { useI18n } from '../../lib/i18n';
import { buildReminderTableRows } from '../../lib/reminderTableRows';
import { resolveReminderPref, formatReminderDateLabel, formatReminderTypesLabel, isReminderEffectivelyEnabled } from '../../lib/reminderPreferences';
import { navigateToAppRoute, resolveActiveAppTab } from '../../lib/screenTransition';
import RemindersLedgerTable, { RemindersMissingDatesBanner } from './RemindersLedgerTable';

export default function RemindersTable({ financials, prefs, defaultLeadDays }) {
  const { t } = useI18n();
  const router = useRouter();
  const segments = useSegments();
  const currentRoute = resolveActiveAppTab(segments);

  const rows = useMemo(() => {
    const schedule = buildReminderTableRows(
      financials.sections,
      financials.debts,
      financials.sections?.household || null,
      t,
    );

    return schedule.map((item) => {
      const pref = resolveReminderPref(item.reminderId, prefs, defaultLeadDays);
      const hasNextPayment = item.hasNextPayment === true;
      const displayPref = {
        ...pref,
        enabled: isReminderEffectivelyEnabled(pref, { hasNextPayment }),
      };
      return {
        ...item,
        pref,
        cells: {
          ...item.cells,
          reminderDate: formatReminderDateLabel(displayPref, t, { hasNextPayment }),
          reminderType: formatReminderTypesLabel(displayPref, t, { hasNextPayment }),
        },
      };
    });
  }, [financials, prefs, defaultLeadDays, t]);

  const missingDatesCount = useMemo(
    () => rows.filter((row) => row.hasNextPayment !== true).length,
    [rows],
  );

  const handleGoToExpenses = useCallback(() => {
    navigateToAppRoute(router, '/(app)/costs', currentRoute);
  }, [router, currentRoute]);

  const columns = [
    { key: 'name', label: t('dashboard.expensesScreen.table.name'), flex: 1 },
    { key: 'endDate', label: t('dashboard.expensesScreen.table.endDate'), flex: 1, align: 'center' },
    { key: 'nextPayment', label: t('dashboard.expensesScreen.table.nextPayment'), flex: 1, align: 'center' },
    { key: 'reminderDate', label: t('dashboard.remindersScreen.table.reminderDate'), flex: 1, align: 'center' },
    { key: 'reminderType', label: t('dashboard.remindersScreen.table.reminderType'), flex: 1, align: 'center' },
    { key: 'reminder', label: t('dashboard.remindersScreen.table.reminder'), flex: 1, align: 'center' },
  ];

  return (
    <View style={{ gap: 12, width: '100%' }}>
      <RemindersMissingDatesBanner count={missingDatesCount} onGoToExpenses={handleGoToExpenses} />
      <RemindersLedgerTable
        title={t('dashboard.remindersScreen.tableTitle')}
        columns={columns}
        rows={rows}
        emptyLabel={t('dashboard.remindersScreen.empty')}
        iconSectionKey="other"
        iconScope="expense"
      />
    </View>
  );
}
