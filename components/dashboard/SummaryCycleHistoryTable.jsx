import { useMemo } from 'react';
import { useI18n } from '../../lib/i18n';
import { buildSummaryCycleHistoryRows } from '../../lib/summaryCycleStats';
import { formatCurrency } from '../../lib/finance';
import LedgerPillDataTable from './LedgerPillDataTable';
import CycleDatesEditForm from './cycles/CycleDatesEditForm';
import { useBreakdownTableColumns } from '../../lib/dashboardLayout';

function formatRange(row, locale) {
  const tag = locale === 'cs' ? 'cs-CZ' : 'en-GB';
  const start = new Date(
    Number(row.startedAt.slice(0, 4)),
    Number(row.startedAt.slice(5, 7)) - 1,
    Number(row.startedAt.slice(8, 10)),
  );
  const end = row.closedAt
    ? new Date(
      Number(row.closedAt.slice(0, 4)),
      Number(row.closedAt.slice(5, 7)) - 1,
      Number(row.closedAt.slice(8, 10)),
    )
    : start;
  const fmt = (d) => d.toLocaleDateString(tag, { day: 'numeric', month: 'short' });
  return `${fmt(start)} – ${fmt(end)}`;
}

export default function SummaryCycleHistoryTable({
  cycleStore,
  currency,
  cyclesEnabled = false,
  budget,
  dailyLogs = [],
  cycleAdjustments = [],
}) {
  const { t, locale } = useI18n();

  const historyRows = useMemo(
    () => buildSummaryCycleHistoryRows(cycleStore),
    [cycleStore],
  );

  const { isPhone } = useBreakdownTableColumns();

  const metricMinW = isPhone ? 92 : 112;

  const columns = [
    { key: 'name', label: t('dashboard.summaryScreen.cycleHistory.columnPeriod'), flex: 1.35 },
    { key: 'amount', label: t('dashboard.summaryScreen.cycleHistory.columnBudget'), align: 'center', minWidth: metricMinW },
    { key: 'spent', label: t('dashboard.summaryScreen.cycleHistory.columnSpent'), align: 'center', minWidth: metricMinW },
    { key: 'saved', label: t('dashboard.summaryScreen.cycleHistory.columnSaved'), align: 'center', minWidth: metricMinW },
    { key: 'deficit', label: t('dashboard.summaryScreen.cycleHistory.columnDeficit'), align: 'center', minWidth: metricMinW },
  ];

  const pillRows = useMemo(() => historyRows.map((row) => ({
    id: row.id,
    cells: {
      name: formatRange(row, locale),
      amount: formatCurrency(row.budget, currency),
      spent: formatCurrency(row.spent, currency),
      saved: row.surplus > 0 ? formatCurrency(row.surplus, currency) : '—',
      deficit: row.deficit > 0 ? formatCurrency(row.deficit, currency) : '—',
    },
    cellTones: {
      ...(row.surplus > 0 ? { saved: 'positive' } : {}),
      ...(row.deficit > 0 ? { deficit: 'danger' } : {}),
    },
  })), [historyRows, locale, currency]);

  const emptyLabel = t(
    cyclesEnabled
      ? 'dashboard.summaryScreen.cycleHistory.empty'
      : 'dashboard.summaryScreen.cycleHistory.cyclesDisabled',
  );

  return (
    <LedgerPillDataTable
      title={t('dashboard.summaryScreen.cycleHistory.title')}
      columns={columns}
      rows={pillRows}
      emptyLabel={emptyLabel}
      iconSectionKey="primary"
      iconScope="expense"
      columnGap={20}
      renderEditPanel={(row, { onDone, onCancel }) => {
        const cycle = (cycleStore?.cycles || []).find((c) => c.id === row.id);
        if (!cycle) return null;
        return (
          <CycleDatesEditForm
            cycle={cycle}
            budget={budget}
            dailyLogs={dailyLogs}
            cycleAdjustments={cycleAdjustments}
            onDone={onDone}
            onCancel={onCancel}
          />
        );
      }}
    />
  );
}
