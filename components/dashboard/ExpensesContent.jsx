import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useI18n } from '../../lib/i18n';
import { useDashboardScroll } from '../../lib/dashboardScroll';
import { useDashboardLayout } from '../../lib/dashboardLayout';
import { getCurrencySymbol } from '../../lib/currency';
import { committedMonthlyLoad } from '../../lib/finance';
import {
  OVERVIEW_TAB_KEY,
  buildFixedExpensePanels,
  buildRecurringExpensePanels,
  buildOverviewPanels,
  resolveExpenseSectionNavigation,
  resolveExpensePrimaryTab,
} from '../../lib/expensePanels';
import TabHeroMetric from './TabHeroMetric';
import TabInsightCard from './TabInsightCard';
import ExpenseUnderlineTabBar, { TrailingActionChip } from './ExpenseUnderlineTabBar';
import ExpenseAddCategoryPicker from './ExpenseAddCategoryPicker';
import ExpensesCategoryPanel from './ExpensesCategoryPanel';
import DashboardTabPanel from './DashboardTabPanel';
import DashboardFrequencyHeaderControls from './DashboardFrequencyHeaderControls';
import OverviewMetricCards from './OverviewMetricCards';
import SurfaceCard from '../ui/SurfaceCard';
import InCardSectionHeader from './InCardSectionHeader';
import { formatDashboardAmount } from './formatDashboardAmount';
import TabSectionStack from './TabSectionStack';
import CycleObligationsCard from './CycleObligationsCard';

const ADD_PICKER_KEY = '__add_picker__';

export default function ExpensesContent({ bundle, frequency = 'monthly', setFrequency }) {
  const { t } = useI18n();
  const params = useLocalSearchParams();
  const deepPrimary = Array.isArray(params.primary) ? params.primary[0] : params.primary;
  const deepSub = Array.isArray(params.sub) ? params.sub[0] : params.sub;
  const deepEditRow = Array.isArray(params.editRow) ? params.editRow[0] : params.editRow;
  const deepAdd = Array.isArray(params.add) ? params.add[0] : params.add;
  const { scrollToAnchor } = useDashboardScroll();
  const { isPhone } = useDashboardLayout();
  const expenseDetailRef = useRef(null);
  const currency = getCurrencySymbol(bundle.financials.currencyCode);
  const { financials, insights } = bundle;
  const sections = financials.sections || {};
  const household = sections.household || null;

  const committedMonthly = committedMonthlyLoad(financials);
  const annualCommitted = committedMonthly * 12;
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();

  const fixedPanels = useMemo(
    () => buildFixedExpensePanels(sections, household, t),
    [sections, household, t],
  );

  const recurringPanels = useMemo(
    () => buildRecurringExpensePanels(sections, financials.debts, household, t),
    [sections, financials.debts, household, t],
  );

  const overviewPanels = useMemo(
    () => buildOverviewPanels(fixedPanels, recurringPanels),
    [fixedPanels, recurringPanels],
  );

  const primaryTabs = useMemo(() => [
    { key: OVERVIEW_TAB_KEY, label: t('dashboard.expensesScreen.tabs.overview') },
    { key: 'fixed', label: t('dashboard.expensesScreen.tabs.fixed') },
    { key: 'recurring', label: t('dashboard.expensesScreen.tabs.recurring') },
  ], [t]);

  const [primaryTab, setPrimaryTab] = useState(OVERVIEW_TAB_KEY);
  const [secondaryTab, setSecondaryTab] = useState(fixedPanels[0]?.key || '');
  const [addFlowActive, setAddFlowActive] = useState(false);
  const [pendingAddCategoryKey, setPendingAddCategoryKey] = useState(null);

  const clearAddFlow = useCallback(() => {
    setAddFlowActive(false);
    setPendingAddCategoryKey(null);
  }, []);

  useEffect(() => {
    if (deepPrimary === 'fixed' || deepPrimary === 'recurring') {
      setPrimaryTab(deepPrimary);
      clearAddFlow();
    }
    if (deepSub) {
      setSecondaryTab(deepSub);
    }
  }, [deepPrimary, deepSub, clearAddFlow]);

  useEffect(() => {
    if (deepAdd !== '1' || !deepSub) return;
    const primary = deepPrimary === 'fixed' || deepPrimary === 'recurring'
      ? deepPrimary
      : resolveExpensePrimaryTab(deepSub);
    setPrimaryTab(primary);
    setSecondaryTab(deepSub);
    setPendingAddCategoryKey(deepSub);
    setAddFlowActive(false);
  }, [deepAdd, deepSub, deepPrimary]);

  const isOverview = primaryTab === OVERVIEW_TAB_KEY;
  const activePanels = primaryTab === 'fixed' ? fixedPanels : recurringPanels;

  const secondaryTabs = useMemo(
    () => activePanels.map((p) => ({ key: p.key, label: p.label })),
    [activePanels],
  );

  useEffect(() => {
    if (isOverview || addFlowActive) return;
    const keys = activePanels.map((p) => p.key);
    if (!keys.length) {
      setSecondaryTab('');
      return;
    }
    if (!keys.includes(secondaryTab)) {
      setSecondaryTab(keys[0]);
    }
  }, [primaryTab, activePanels, secondaryTab, isOverview, addFlowActive]);

  const activePanel = activePanels.find((p) => p.key === secondaryTab) || null;

  useEffect(() => {
    if (!pendingAddCategoryKey || !activePanel) return;
    if (activePanel.key !== pendingAddCategoryKey) return;

    const timer = setTimeout(() => scrollToAnchor(expenseDetailRef), 320);
    return () => clearTimeout(timer);
  }, [pendingAddCategoryKey, activePanel, scrollToAnchor]);

  useEffect(() => {
    if (!deepPrimary || deepPrimary === OVERVIEW_TAB_KEY) return;
    if (deepPrimary !== 'fixed' && deepPrimary !== 'recurring') return;
    if (!deepSub || isOverview) return;
    if (secondaryTab !== deepSub || !activePanel) return;
    if (deepEditRow || deepAdd === '1') return;

    const timer = setTimeout(() => scrollToAnchor(expenseDetailRef), 320);
    return () => clearTimeout(timer);
  }, [
    deepPrimary,
    deepSub,
    deepEditRow,
    deepAdd,
    isOverview,
    secondaryTab,
    activePanel,
    scrollToAnchor,
  ]);

  const handleBreakdownSectionPress = (sectionKey) => {
    const nav = resolveExpenseSectionNavigation(sectionKey, overviewPanels);
    if (!nav) return;
    clearAddFlow();
    setPrimaryTab(nav.primaryTab);
    setSecondaryTab(nav.secondaryTab);
  };

  const handlePrimaryTabChange = (key) => {
    clearAddFlow();
    setPrimaryTab(key);
    if (key === 'fixed') setSecondaryTab(fixedPanels[0]?.key || '');
    if (key === 'recurring') setSecondaryTab(recurringPanels[0]?.key || '');
  };

  const handleAddCategorySelect = (panel) => {
    const primary = resolveExpensePrimaryTab(panel.key);
    setAddFlowActive(false);
    setPrimaryTab(primary);
    setSecondaryTab(panel.key);
    setPendingAddCategoryKey(panel.key);
  };

  const toggleAddFlow = () => {
    if (addFlowActive) {
      clearAddFlow();
      return;
    }
    setAddFlowActive(true);
    setPendingAddCategoryKey(null);
  };

  const heroValue = formatDashboardAmount(committedMonthly, frequency, currency, daysInMonth);

  const panelKey = addFlowActive
    ? ADD_PICKER_KEY
    : isOverview
      ? OVERVIEW_TAB_KEY
      : `${primaryTab}-${secondaryTab}`;

  return (
    <TabSectionStack>
      <TabHeroMetric
        tone="expense"
        label={t('dashboard.expensesScreen.committedCosts')}
        value={heroValue}
        animationKey={frequency}
        trailing={setFrequency ? (
          <DashboardFrequencyHeaderControls
            layout="inline"
            scope="expenses"
            value={frequency}
            onChange={setFrequency}
            tone="expense"
          />
        ) : null}
        frequencyCaption={setFrequency ? t('dashboard.frequencyHelper.expenses.summary') : null}
        tertiaryLabel={t('dashboard.expensesScreen.committedAnnual', {
          amount: formatDashboardAmount(annualCommitted, 'monthly', currency, daysInMonth),
        })}
      />

      <TabInsightCard tabKey="expenses" financials={financials} />

      <SurfaceCard>
        <InCardSectionHeader title={t('dashboard.expensesScreen.costCommitments')} />
        <OverviewMetricCards
          financials={financials}
          insights={insights}
          currency={currency}
          daysInMonth={daysInMonth}
          showHeroPanels={false}
          embedded
          cardLabelPrefix="dashboard.expensesScreen.costCommitmentsCards"
          secondaryMetricIds={['committedTotal', 'cashAfterBills', 'fixedLoad', 'recurring']}
        />
      </SurfaceCard>

      <TabSectionStack tight>
        <TrailingActionChip
          action={{
            label: t('dashboard.expensesScreen.tabs.add'),
            active: addFlowActive,
            onPress: toggleAddFlow,
            accessibilityLabel: t('dashboard.expensesScreen.tabs.addA11y'),
          }}
          fullWidth={isPhone}
        />

        <ExpenseUnderlineTabBar
          tabs={primaryTabs}
          activeKey={addFlowActive ? null : primaryTab}
          onChange={handlePrimaryTabChange}
          accessibilityLabel={t('dashboard.expensesScreen.tabs.primaryA11y')}
        />

        {!isOverview && !addFlowActive ? (
          <ExpenseUnderlineTabBar
            tabs={secondaryTabs}
            activeKey={secondaryTab}
            onChange={(key) => {
              clearAddFlow();
              setSecondaryTab(key);
            }}
            accessibilityLabel={t('dashboard.expensesScreen.tabs.secondaryA11y')}
          />
        ) : null}
      </TabSectionStack>

      <DashboardTabPanel panelKey={panelKey}>
        {addFlowActive ? (
          <ExpenseAddCategoryPicker
            fixedPanels={fixedPanels}
            recurringPanels={recurringPanels}
            onSelect={handleAddCategorySelect}
            t={t}
          />
        ) : isOverview ? (
          <ExpensesCategoryPanel
            variant="overview"
            panels={overviewPanels}
            displayTotal={committedMonthly}
            currency={currency}
            currencyCode={financials.currencyCode}
            t={t}
            frequency={frequency}
            daysInMonth={daysInMonth}
            onSectionPress={handleBreakdownSectionPress}
          />
        ) : activePanel ? (
          <View ref={expenseDetailRef} collapsable={false}>
            {activePanel.key === 'debts' ? (
              <CycleObligationsCard
                obligations={financials.openObligations}
                currency={currency}
              />
            ) : null}
            <ExpensesCategoryPanel
              variant="detail"
              categoryLabel={activePanel.label}
              categoryKey={activePanel.key}
              lineItems={activePanel.lineItems}
              sectionId={activePanel.sectionId}
              currency={currency}
              currencyCode={financials.currencyCode}
              t={t}
              frequency={frequency}
              daysInMonth={daysInMonth}
              initialEditingRowId={
                deepSub === activePanel.key ? deepEditRow || undefined : undefined
              }
              initialAdding={pendingAddCategoryKey === activePanel.key}
              onAddDone={() => setPendingAddCategoryKey(null)}
              onAddCancel={() => setPendingAddCategoryKey(null)}
            />
          </View>
        ) : null}
      </DashboardTabPanel>
    </TabSectionStack>
  );
}
