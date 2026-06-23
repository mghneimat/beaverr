import { useMemo, useState } from 'react';
import { View, Text } from 'react-native';
import { formatCurrency, toMonthly, totalMonthlyCosts } from '../../lib/finance';
import { formatSharePct } from '../../lib/formatSharePct';
import { useBreakdownTableColumns } from '../../lib/dashboardLayout';
import { C, R, tabularNums } from '../../constants/onboarding-theme';
import InCardSectionHeader from '../dashboard/InCardSectionHeader';
import DashboardTableExportActions from '../dashboard/DashboardTableExportActions';
import AnimatedCollapse from '../dashboard/AnimatedCollapse';
import {
  BreakdownExpandAllButton,
  BreakdownPillColumnHeaders,
  BreakdownPillRow,
  BreakdownPillSubRow,
  MaytechTableFrame,
} from '../dashboard/BreakdownTablePrimitives';

function formatSignedMonthly(amount, currency) {
  const formatted = formatCurrency(Math.abs(amount), currency);
  return amount < 0 ? `−${formatted}` : formatted;
}

function toggleLabel(t, label, isOpen) {
  return isOpen
    ? t('onboarding.budget.budgetSplit.a11y.collapseRow', { label })
    : t('onboarding.budget.budgetSplit.a11y.expandRow', { label });
}

/**
 * Onboarding budget summary — pill breakdown table matching dashboard expenses design.
 */
export default function BudgetSetupSummaryTable({
  t,
  currency,
  totalIncome,
  fixedCosts,
  debtPayments,
  totalBudget,
  incomeBreakdowns = [],
  costsByCategory = [],
  onExportCsv,
  onExportXlsx,
  onExportPdf,
}) {
  const { amountColMinW, shareColMinW } = useBreakdownTableColumns();
  const shareBase = totalIncome > 0 ? totalIncome : 1;

  const categoryKeys = useMemo(
    () => costsByCategory.map((cat) => `cat_${cat.category}`),
    [costsByCategory],
  );

  const buildCollapsedState = () => {
    const next = { income: false, fixedCosts: false };
    categoryKeys.forEach((key) => { next[key] = false; });
    return next;
  };

  const buildExpandedState = () => {
    const next = {
      income: incomeBreakdowns.length > 0,
      fixedCosts: costsByCategory.length > 0,
    };
    categoryKeys.forEach((key) => { next[key] = true; });
    return next;
  };

  const [expanded, setExpanded] = useState(buildCollapsedState);
  const [allExpanded, setAllExpanded] = useState(false);

  const toggle = (key) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleAll = () => {
    const next = !allExpanded;
    setAllExpanded(next);
    setExpanded(next ? buildExpandedState() : buildCollapsedState());
  };

  const topRows = [
    {
      key: 'income',
      sectionKey: 'primary',
      scope: 'income',
      label: t('onboarding.budget.budgetSplit.income'),
      amount: totalIncome,
      expandable: incomeBreakdowns.length > 0,
    },
    {
      key: 'fixedCosts',
      sectionKey: 'other',
      scope: 'expense',
      label: t('onboarding.budget.budgetSplit.fixedCosts'),
      amount: -fixedCosts,
      expandable: costsByCategory.length > 0,
    },
    {
      key: 'debtPayments',
      sectionKey: 'debts',
      scope: 'expense',
      label: t('onboarding.budget.budgetSplit.debtPayments'),
      amount: -debtPayments,
      expandable: false,
    },
  ];

  const budgetAmountColor = totalBudget >= 0 ? C.positive : C.danger;

  return (
    <MaytechTableFrame style={{ overflow: 'visible', marginTop: 20, marginBottom: 20, padding: 16 }}>
      <InCardSectionHeader
        title={t('onboarding.budget.budgetSplit.tableTitle')}
        trailing={(
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            <BreakdownExpandAllButton allExpanded={allExpanded} onToggle={toggleAll} t={t} />
            {onExportCsv && onExportXlsx && onExportPdf ? (
              <DashboardTableExportActions
                onExportCsv={onExportCsv}
                onExportXlsx={onExportXlsx}
                onExportPdf={onExportPdf}
              />
            ) : null}
          </View>
        )}
      />

      <View style={{ gap: 8, overflow: 'visible', width: '100%', alignSelf: 'stretch' }}>
        <BreakdownPillColumnHeaders
          nameLabel={t('onboarding.budget.budgetSplit.summaryTitle')}
          amountLabel={t('onboarding.budget.budgetSplit.amount')}
          shareLabel={t('dashboard.expensesScreen.table.share')}
          amountColMinW={amountColMinW}
          shareColMinW={shareColMinW}
        />

        {topRows.map((row, rowIdx) => {
          const isOpen = expanded[row.key] ?? false;
          const share = formatSharePct(Math.abs(row.amount), shareBase);

          return (
            <View key={row.key}>
              <BreakdownPillRow
                sectionKey={row.sectionKey}
                scope={row.scope}
                label={row.label}
                amount={formatSignedMonthly(row.amount, currency)}
                share={share}
                index={rowIdx}
                expandable={row.expandable}
                expanded={isOpen}
                amountColMinW={amountColMinW}
                shareColMinW={shareColMinW}
                onExpandPress={row.expandable ? () => toggle(row.key) : undefined}
                expandA11yLabel={toggleLabel(t, row.label, isOpen)}
              />

              {row.key === 'income' && row.expandable ? (
                <AnimatedCollapse
                  visible={isOpen}
                  fallbackHeight={Math.max(incomeBreakdowns.length * 40, 40)}
                >
                  <View style={{ marginTop: 4, marginBottom: 4 }}>
                    {incomeBreakdowns.map((item, itemIdx) => (
                      <BreakdownPillSubRow
                        key={item.label}
                        label={item.label}
                        amount={formatSignedMonthly(item.amount, currency)}
                        share={formatSharePct(item.amount, shareBase)}
                        amountColMinW={amountColMinW}
                        shareColMinW={shareColMinW}
                        isLast={itemIdx === incomeBreakdowns.length - 1}
                      />
                    ))}
                  </View>
                </AnimatedCollapse>
              ) : null}

              {row.key === 'fixedCosts' && row.expandable ? (
                <AnimatedCollapse
                  visible={isOpen}
                  fallbackHeight={Math.max(costsByCategory.length * 56, 56)}
                >
                  <View style={{ marginTop: 4, marginBottom: 4, gap: 8 }}>
                    {costsByCategory.map((cat, catIdx) => {
                      const catKey = `cat_${cat.category}`;
                      const catMonthly = totalMonthlyCosts(cat.items);
                      const catOpen = expanded[catKey] ?? false;

                      return (
                        <View key={catKey}>
                          <BreakdownPillRow
                            sectionKey={cat.category}
                            scope="expense"
                            label={cat.label}
                            amount={formatSignedMonthly(-catMonthly, currency)}
                            share={formatSharePct(catMonthly, shareBase)}
                            index={rowIdx + catIdx + 1}
                            expandable={cat.items.length > 0}
                            expanded={catOpen}
                            amountColMinW={amountColMinW}
                            shareColMinW={shareColMinW}
                            onExpandPress={cat.items.length > 0 ? () => toggle(catKey) : undefined}
                            expandA11yLabel={toggleLabel(t, cat.label, catOpen)}
                          />
                          {cat.items.length > 0 ? (
                            <AnimatedCollapse
                              visible={catOpen}
                              fallbackHeight={Math.max(cat.items.length * 40, 40)}
                            >
                              <View style={{ marginTop: 4, marginBottom: 4 }}>
                                {cat.items.map((item, itemIdx) => {
                                  const itemMonthly = toMonthly(item.amount || 0, item.frequency || 'monthly');
                                  return (
                                    <BreakdownPillSubRow
                                      key={`${catKey}-${itemIdx}`}
                                      label={item.label}
                                      amount={formatSignedMonthly(-itemMonthly, currency)}
                                      share={formatSharePct(itemMonthly, shareBase)}
                                      amountColMinW={amountColMinW}
                                      shareColMinW={shareColMinW}
                                      isLast={itemIdx === cat.items.length - 1}
                                    />
                                  );
                                })}
                              </View>
                            </AnimatedCollapse>
                          ) : null}
                        </View>
                      );
                    })}
                  </View>
                </AnimatedCollapse>
              ) : null}
            </View>
          );
        })}

        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          paddingVertical: 12,
          paddingHorizontal: 14,
          minHeight: 52,
          borderRadius: R.pill,
          backgroundColor: C.bg,
          width: '100%',
        }}>
          <View style={{ width: 36, flexShrink: 0 }} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: C.primary }} numberOfLines={2}>
              {t('onboarding.budget.budgetSplit.budgetLabel')}
            </Text>
          </View>
          <View style={{ minWidth: shareColMinW, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 13, fontWeight: '500', color: C.muted, ...tabularNums }} numberOfLines={1}>
              {formatSharePct(Math.max(totalBudget, 0), shareBase)}
            </Text>
          </View>
          <View style={{ minWidth: amountColMinW, alignItems: 'flex-end', justifyContent: 'center' }}>
            <Text style={{
              fontSize: 15,
              fontWeight: '700',
              color: budgetAmountColor,
              textAlign: 'right',
              ...tabularNums,
            }} numberOfLines={1}>
              {formatSignedMonthly(totalBudget, currency)}
            </Text>
          </View>
          <View style={{ width: 28, flexShrink: 0 }} />
        </View>
      </View>
    </MaytechTableFrame>
  );
}
