import { useMemo, useState, useEffect } from 'react';
import { View } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { formatCurrency } from '../../lib/finance';
import { resolveCategorySectionId } from '../../lib/sectionEditRegistry';
import { buildExpenseChartSections, getExpenseAddTemplate } from '../../lib/expensePanels';
import { C, R, T } from '../../constants/onboarding-theme';
import SurfaceCard from '../ui/SurfaceCard';
import InCardSectionHeader from './InCardSectionHeader';
import ExpensesDonutChart from './ExpensesDonutChart';
import ExpensesCategoryBreakdown from './ExpensesCategoryBreakdown';
import LedgerPillDataTable from './LedgerPillDataTable';
import ExpenseItemEditPanel from './ExpenseItemEditPanel';
import { canDeleteExpenseRow, deleteExpenseRow } from '../../lib/inlineExpenseSave';
import { formatExpenseEndDateCell, formatExpenseNextPaymentCell } from '../../lib/expenseTableCells';
import DashboardSectionEmptyMessage from './DashboardSectionEmptyMessage';

function frequencyLabel(freq, t) {
  if (!freq) return t('common.monthly');
  const key = `common.${freq}`;
  const translated = t(key);
  return translated !== key ? translated : freq;
}

function buildRowMeta(subtabKey, item, subtabLabel, sectionId) {
  return {
    id: item.id,
    category: subtabKey,
    categoryLabel: subtabLabel,
    rawAmount: item.rawAmount,
    frequency: item.frequency,
    monthlyAmount: item.monthlyAmount,
    renewalDate: item.renewalDate || null,
    dueDate: item.dueDate || null,
    endDate: item.endDate || null,
    chargeDay: item.chargeDay || null,
    nextPaymentOverride: item.nextPaymentOverride || null,
    source: item.source,
    editKind: item.editKind,
    editRef: item.editRef || null,
    dateType: item.dateType || null,
    supportsFrequency: item.supportsFrequency,
    sectionId: item.sectionId || sectionId || resolveCategorySectionId(subtabKey),
  };
}

function AddExpenseForm({
  addTemplate,
  categoryKey,
  categoryLabel,
  currency,
  currencyCode,
  t,
  onDone,
  onCancel,
  embedded = false,
}) {
  const form = (
    <ExpenseItemEditPanel
      row={addTemplate}
      currency={currency}
      currencyCode={currencyCode}
      mode="add"
      categoryKey={categoryKey}
      onDone={onDone}
      onCancel={onCancel}
    />
  );

  if (embedded) {
    return (
      <View style={{
        alignSelf: 'stretch',
        width: '100%',
        paddingHorizontal: 14,
        paddingVertical: 16,
        borderRadius: R.input,
        backgroundColor: C.surfaceTint,
      }}>
        {form}
      </View>
    );
  }

  return (
    <SurfaceCard style={{ marginTop: 16 }}>
      <InCardSectionHeader title={t('dashboard.expensesScreen.addExpense', { type: categoryLabel })} />
      {form}
    </SurfaceCard>
  );
}

export default function ExpensesCategoryPanel({
  variant,
  panels = [],
  displayTotal,
  categoryLabel,
  categoryKey,
  lineItems = [],
  sectionId,
  currency,
  currencyCode,
  t,
  frequency = 'monthly',
  daysInMonth = 30,
  onSectionPress,
  initialEditingRowId,
  initialAdding = false,
  onAddDone,
  onAddCancel,
}) {
  const [adding, setAdding] = useState(initialAdding);
  const isOverview = variant === 'overview' || variant === 'overall';

  useEffect(() => {
    setAdding(initialAdding);
  }, [categoryKey, initialAdding]);

  const finishAdd = () => {
    setAdding(false);
    onAddDone?.();
  };

  const cancelAdd = () => {
    setAdding(false);
    onAddCancel?.();
  };

  const panelTotal = useMemo(() => {
    if (isOverview) {
      return panels.reduce((sum, panel) => sum + panel.total, 0);
    }
    return lineItems.reduce((sum, item) => sum + item.monthlyAmount, 0);
  }, [isOverview, panels, lineItems]);

  const chartTotal = isOverview && displayTotal != null ? displayTotal : panelTotal;

  const chartSegments = useMemo(() => {
    if (!isOverview) return [];
    return buildExpenseChartSections(panels, t);
  }, [isOverview, panels, t]);

  const frequencyColumnLabel = t(`common.${frequency}`);

  const detailRows = useMemo(() => lineItems.map((item) => {
    const meta = buildRowMeta(categoryKey, item, categoryLabel, sectionId);
    return {
      ...meta,
      cells: {
        name: item.subcategory,
        amount: formatCurrency(item.rawAmount, currency),
        frequency: frequencyLabel(item.frequency, t),
        endDate: formatExpenseEndDateCell(meta, t),
        nextPayment: formatExpenseNextPaymentCell(meta, t),
      },
    };
  }), [lineItems, categoryKey, categoryLabel, sectionId, currency, t]);

  const detailColumns = [
    { key: 'name', label: t('dashboard.expensesScreen.table.name'), flex: 1 },
    { key: 'amount', label: t('dashboard.expensesScreen.table.amount'), flex: 1, align: 'center' },
    { key: 'frequency', label: t('common.frequency'), flex: 1, align: 'center' },
    { key: 'endDate', label: t('dashboard.expensesScreen.table.endDate'), flex: 1, align: 'center' },
    { key: 'nextPayment', label: t('dashboard.expensesScreen.table.nextPayment'), flex: 1, align: 'center' },
  ];

  const addTemplate = categoryKey ? getExpenseAddTemplate(categoryKey, categoryLabel) : null;

  if (!isOverview && lineItems.length === 0 && !adding) {
    return (
      <SurfaceCard style={{ marginTop: 16 }}>
        <DashboardSectionEmptyMessage
          message={t('dashboard.expensesScreen.subtabEmpty', { type: categoryLabel })}
          variant="centered"
        />
        <DashboardSectionEmptyMessage
          message={t('dashboard.expensesScreen.emptyHint')}
          variant="centered"
          style={{ paddingTop: 0 }}
        />
      </SurfaceCard>
    );
  }

  if (!isOverview && adding && addTemplate) {
    if (lineItems.length === 0) {
      return (
        <AddExpenseForm
          addTemplate={addTemplate}
          categoryKey={categoryKey}
          categoryLabel={categoryLabel}
          currency={currency}
          currencyCode={currencyCode}
          t={t}
          onDone={finishAdd}
          onCancel={cancelAdd}
        />
      );
    }
  }

  const tableFooter = adding && addTemplate ? (
    <AddExpenseForm
      addTemplate={addTemplate}
      categoryKey={categoryKey}
      categoryLabel={categoryLabel}
      currency={currency}
      currencyCode={currencyCode}
      t={t}
      onDone={finishAdd}
      onCancel={cancelAdd}
      embedded
    />
  ) : null;

  return (
    <View style={{ marginTop: 16 }}>
      {isOverview ? (
        <>
          <SurfaceCard style={{ marginBottom: 16 }}>
            <InCardSectionHeader title={t('dashboard.expensesScreen.chartTitle')} />
            <ExpensesDonutChart
              segments={chartSegments}
              total={chartTotal}
              currency={currency}
              frequency={frequency}
              daysInMonth={daysInMonth}
              chartKey={`expenses-${frequency}-${chartTotal}`}
              emptyLabel={t('dashboard.expensesScreen.empty')}
              nameLabel={t('dashboard.expensesScreen.table.expense')}
              amountLabel={frequencyColumnLabel}
              shareLabel={t('dashboard.expensesScreen.table.share')}
            />
          </SurfaceCard>

          <ExpensesCategoryBreakdown
            title={t('dashboard.expensesScreen.tableTitle')}
            panels={panels}
            panelTotal={panelTotal}
            currency={currency}
            t={t}
            frequency={frequency}
            daysInMonth={daysInMonth}
            frequencyColumnLabel={frequencyColumnLabel}
            emptyLabel={t('dashboard.expensesScreen.empty')}
            onSectionPress={onSectionPress}
          />
        </>
      ) : (
        <LedgerPillDataTable
          title={categoryLabel}
          footer={tableFooter}
          footerAlign="end"
          columns={detailColumns}
          rows={detailRows}
          emptyLabel={t('dashboard.expensesScreen.empty')}
          iconSectionKey={sectionId || categoryKey || 'other'}
          iconScope="expense"
          currencyCode={currencyCode}
          canDeleteRow={canDeleteExpenseRow}
          onDeleteRow={deleteExpenseRow}
          renderEditPanel={(row, { onDone, onCancel }) => (
            <ExpenseItemEditPanel
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
