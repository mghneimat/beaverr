import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { formatCurrency } from '../../lib/finance';
import { buildIncomeChartSections, getOtherIncomeAddTemplate } from '../../lib/incomePanels';
import { C, T } from '../../constants/onboarding-theme';
import SurfaceCard from '../ui/SurfaceCard';
import InCardSectionHeader from './InCardSectionHeader';
import ExpensesDonutChart from './ExpensesDonutChart';
import IncomeStreamsBreakdown from './IncomeStreamsBreakdown';
import LedgerPillDataTable from './LedgerPillDataTable';
import IncomeItemEditPanel from './IncomeItemEditPanel';
import BreakdownEmptyState from './BreakdownEmptyState';
import { canDeleteIncomeRow, deleteIncomeRow } from '../../lib/inlineIncomeSave';

function frequencyLabel(freq, t) {
  if (!freq) return t('common.monthly');
  const key = `common.${freq}`;
  const translated = t(key);
  return translated !== key ? translated : freq;
}

export default function IncomeCategoryPanel({
  variant,
  panels = [],
  categoryLabel,
  lineItems = [],
  currency,
  currencyCode,
  t,
  frequency = 'monthly',
  daysInMonth = 30,
  emptyLabel,
  emptyHint,
  emptyActionLabel,
  showEmptyAdd = false,
  onSectionPress,
  initialEditingRowId,
}) {
  const isOverview = variant === 'overview';
  const [adding, setAdding] = useState(false);

  const panelTotal = useMemo(() => {
    if (isOverview) {
      return panels.reduce((sum, panel) => sum + panel.total, 0);
    }
    return lineItems.reduce((sum, item) => sum + item.monthlyAmount, 0);
  }, [isOverview, panels, lineItems]);

  const chartSegments = useMemo(() => {
    if (!isOverview) return [];
    return buildIncomeChartSections(panels);
  }, [isOverview, panels]);

  const frequencyColumnLabel = t(`common.${frequency}`);

  const detailRows = useMemo(() => lineItems.map((item) => ({
    id: item.id,
    editKind: item.editKind,
    otherIndex: item.otherIndex,
    showLabelField: item.showLabelField,
    rawAmount: item.rawAmount,
    frequency: item.frequency,
    subcategory: item.subcategory,
    monthlyAmount: item.monthlyAmount,
    cells: {
      name: item.subcategory,
      amount: formatCurrency(item.rawAmount, currency),
      frequency: frequencyLabel(item.frequency, t),
    },
  })), [lineItems, currency, t]);

  const detailColumns = [
    { key: 'name', label: t('dashboard.incomeScreen.table.source'), flex: 1 },
    { key: 'amount', label: t('dashboard.expensesScreen.table.amount'), flex: 1, align: 'center' },
    { key: 'frequency', label: t('common.frequency'), flex: 1, align: 'center' },
  ];

  const incomeIconKey = lineItems.some((item) => item.editKind === 'other') ? 'other' : 'primary';

  if (!isOverview && lineItems.length === 0 && !adding) {
    return (
      <BreakdownEmptyState
        message={emptyLabel || t('dashboard.incomeScreen.emptyPanel')}
        hint={emptyHint}
        actionLabel={showEmptyAdd ? (emptyActionLabel || t('dashboard.incomeScreen.addOtherSource')) : null}
        onAction={showEmptyAdd ? () => setAdding(true) : undefined}
      />
    );
  }

  if (!isOverview && lineItems.length === 0 && adding && showEmptyAdd) {
    return (
      <SurfaceCard style={{ marginTop: 24 }}>
        <InCardSectionHeader title={emptyActionLabel || t('dashboard.incomeScreen.addOtherSource')} />
        <IncomeItemEditPanel
          row={getOtherIncomeAddTemplate()}
          currency={currency}
          currencyCode={currencyCode}
          onDone={() => setAdding(false)}
          onCancel={() => setAdding(false)}
        />
      </SurfaceCard>
    );
  }

  return (
    <View style={{ marginTop: 16 }}>
      {isOverview ? (
        <>
          <SurfaceCard style={{ marginBottom: 16 }}>
            <InCardSectionHeader title={t('dashboard.incomeScreen.chartTitle')} />
            <ExpensesDonutChart
              segments={chartSegments}
              total={panelTotal}
              currency={currency}
              frequency={frequency}
              daysInMonth={daysInMonth}
              chartKey={`income-${frequency}-${panelTotal}`}
              emptyLabel={t('dashboard.incomeScreen.empty')}
              nameLabel={t('dashboard.incomeScreen.table.source')}
              amountLabel={frequencyColumnLabel}
              shareLabel={t('dashboard.incomeScreen.table.share')}
            />
          </SurfaceCard>

          <IncomeStreamsBreakdown
            title={t('dashboard.incomeScreen.tableTitle')}
            streams={panels}
            panelTotal={panelTotal}
            currency={currency}
            t={t}
            frequency={frequency}
            daysInMonth={daysInMonth}
            frequencyColumnLabel={frequencyColumnLabel}
            emptyLabel={t('dashboard.incomeScreen.empty')}
            onSectionPress={onSectionPress}
          />
        </>
      ) : (
        <LedgerPillDataTable
          title={categoryLabel}
          columns={detailColumns}
          rows={detailRows}
          emptyLabel={emptyLabel || t('dashboard.incomeScreen.empty')}
          iconSectionKey={incomeIconKey}
          iconScope="income"
          currencyCode={currencyCode}
          canDeleteRow={canDeleteIncomeRow}
          onDeleteRow={deleteIncomeRow}
          renderEditPanel={(row, { onDone, onCancel }) => (
            <IncomeItemEditPanel
              row={row}
              currency={currency}
              currencyCode={currencyCode}
              onDone={onDone}
              onCancel={onCancel}
            />
          )}
          initialEditingRowId={initialEditingRowId}
        />
      )}
    </View>
  );
}
