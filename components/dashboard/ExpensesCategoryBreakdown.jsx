import { useMemo, useState, useEffect } from 'react';
import { View } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { buildExpenseSectionGroups } from '../../lib/expensePanels';
import {
  exportExpenseBreakdownCsv,
  exportExpenseBreakdownXlsx,
  exportExpenseBreakdownPdf,
} from '../../lib/expenseBreakdownExport';
import {
  buildInitialBreakdownExpandState,
  isFlatBreakdownSection,
  shouldHideBreakdownExpandAll,
} from '../../lib/breakdownExpand';
import AnimatedCollapse from './AnimatedCollapse';
import InCardSectionHeader from './InCardSectionHeader';
import DashboardTableExportActions from './DashboardTableExportActions';
import SurfaceCard from '../ui/SurfaceCard';
import { formatDashboardAmount } from './formatDashboardAmount';
import { formatSharePct } from '../../lib/formatSharePct';
import { useBreakdownTableColumns } from '../../lib/dashboardLayout';
import { C, T } from '../../constants/onboarding-theme';
import {
  BreakdownExpandAllButton,
  BreakdownPillColumnHeaders,
  BreakdownPillRow,
  BreakdownPillSubRow,
  BreakdownPillRowSlot,
} from './BreakdownTablePrimitives';

/**
 * Expandable section → line-item breakdown (Housing → Rent, Utilities, …).
 */
export default function ExpensesCategoryBreakdown({
  title,
  panels,
  panelTotal,
  currency,
  t,
  frequency = 'monthly',
  daysInMonth = 30,
  frequencyColumnLabel,
  emptyLabel,
  onSectionPress,
}) {
  const sections = useMemo(
    () => buildExpenseSectionGroups(panels, t),
    [panels, t],
  );

  const initialExpand = useMemo(
    () => buildInitialBreakdownExpandState(sections, panelTotal),
    [sections, panelTotal],
  );

  const [expanded, setExpanded] = useState(initialExpand.expanded);
  const [allExpanded, setAllExpanded] = useState(initialExpand.allExpanded);
  const [selectedSectionKey, setSelectedSectionKey] = useState(null);
  const { amountColMinW, shareColMinW } = useBreakdownTableColumns();

  useEffect(() => {
    setExpanded(initialExpand.expanded);
    setAllExpanded(initialExpand.allExpanded);
  }, [initialExpand]);

  const hasData = sections.length > 0;
  const hideExpandAll = shouldHideBreakdownExpandAll(sections);
  const amountHeader = frequencyColumnLabel || t(`common.${frequency}`);

  const toggle = (key) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleAll = () => {
    const next = !allExpanded;
    setAllExpanded(next);
    const nextExpanded = {};
    sections.forEach((section) => {
      nextExpanded[section.key] = next;
    });
    setExpanded(nextExpanded);
  };

  const toggleLabel = (label, isOpen) => (
    isOpen
      ? t('onboarding.budget.budgetSplit.a11y.collapseRow', { label })
      : t('onboarding.budget.budgetSplit.a11y.expandRow', { label })
  );

  const exportMeta = {
    title: title || t('dashboard.expensesScreen.tableTitle'),
    summaryTitle: t('dashboard.expensesScreen.table.expense'),
    amountTitle: amountHeader,
    currency,
  };

  const handleExportCsv = () => exportExpenseBreakdownCsv(panels, t, exportMeta);
  const handleExportXlsx = () => exportExpenseBreakdownXlsx(panels, t, exportMeta);
  const handleExportPdf = () => exportExpenseBreakdownPdf(panels, t, exportMeta);

  const handleSectionSelect = (section) => {
    setSelectedSectionKey((prev) => (prev === section.key ? null : section.key));
  };

  const handleSectionNavigate = (sectionKey) => {
    onSectionPress?.(sectionKey);
    setSelectedSectionKey(null);
  };

  return (
    <SurfaceCard style={{ zIndex: 1, overflow: 'visible' }}>
      {title ? (
        <InCardSectionHeader
          title={title}
          trailing={hasData ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 0 }}>
              <DashboardTableExportActions
                onExportCsv={handleExportCsv}
                onExportXlsx={handleExportXlsx}
                onExportPdf={handleExportPdf}
              />
              {!hideExpandAll ? (
                <BreakdownExpandAllButton
                  allExpanded={allExpanded}
                  onToggle={toggleAll}
                  t={t}
                />
              ) : null}
            </View>
          ) : null}
        />
      ) : null}

      {!hasData ? (
        <Text style={{ ...T.helper, textAlign: 'center', paddingVertical: 24, paddingHorizontal: 16 }}>
          {emptyLabel}
        </Text>
      ) : (
        <View style={{ gap: 8, overflow: 'visible', width: '100%', alignSelf: 'stretch' }}>
          <BreakdownPillColumnHeaders
            nameLabel={t('dashboard.expensesScreen.table.expense')}
            amountLabel={amountHeader}
            shareLabel={t('dashboard.expensesScreen.table.share')}
            amountColMinW={amountColMinW}
            shareColMinW={shareColMinW}
          />
          {sections.map((section, sectionIdx) => {
            const flat = isFlatBreakdownSection(section);
            const isOpen = flat || (expanded[section.key] ?? false);
            const sectionPct = formatSharePct(section.total, panelTotal);
            const selected = selectedSectionKey === section.key;

            return (
              <BreakdownPillRowSlot
                key={section.key}
                selected={selected}
                actionVisible={selected && !!onSectionPress}
                actionLabel={t('dashboard.breakdown.openSection', { label: section.label })}
                actionA11yLabel={t('dashboard.breakdown.openSectionA11y', { label: section.label })}
                onAction={() => handleSectionNavigate(section.key)}
              >
                <BreakdownPillRow
                  sectionKey={section.key}
                  scope="expense"
                  label={section.label}
                  amount={formatDashboardAmount(section.total, frequency, currency, daysInMonth)}
                  share={sectionPct}
                  index={sectionIdx}
                  selected={selected}
                  expandable={!flat}
                  expanded={isOpen}
                  amountColMinW={amountColMinW}
                  shareColMinW={shareColMinW}
                  onSelect={onSectionPress ? () => handleSectionSelect(section) : undefined}
                  onExpandPress={!flat ? () => toggle(section.key) : undefined}
                  selectA11yLabel={t('dashboard.breakdown.selectSectionA11y', { label: section.label })}
                  expandA11yLabel={toggleLabel(section.label, isOpen)}
                />

                {!flat ? (
                  <AnimatedCollapse
                    visible={isOpen}
                    fallbackHeight={Math.max(section.items.length * 40, 40)}
                  >
                    <View style={{ marginTop: 4, marginBottom: 4 }}>
                      {section.items.map((item, itemIdx) => (
                        <BreakdownPillSubRow
                          key={item.id}
                          label={item.label}
                          amount={formatDashboardAmount(item.monthlyAmount, frequency, currency, daysInMonth)}
                          share={formatSharePct(item.monthlyAmount, panelTotal)}
                          amountColMinW={amountColMinW}
                          shareColMinW={shareColMinW}
                          isLast={itemIdx === section.items.length - 1}
                        />
                      ))}
                    </View>
                  </AnimatedCollapse>
                ) : null}
              </BreakdownPillRowSlot>
            );
          })}
        </View>
      )}
    </SurfaceCard>
  );
}
