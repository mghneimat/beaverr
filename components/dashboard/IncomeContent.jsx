import { useMemo, useState, useEffect } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useI18n } from '../../lib/i18n';
import { getCurrencySymbol } from '../../lib/currency';
import {
  INCOME_OVERVIEW_KEY,
  INCOME_PRIMARY_KEY,
  INCOME_OTHER_KEY,
  buildOverviewIncomePanels,
  buildPrimaryIncomePanels,
  buildOtherIncomePanels,
  resolveIncomeSectionNavigation,
} from '../../lib/incomePanels';
import TabHeroMetric from './TabHeroMetric';
import TabInsightCard from './TabInsightCard';
import ExpenseUnderlineTabBar from './ExpenseUnderlineTabBar';
import IncomeCategoryPanel from './IncomeCategoryPanel';
import DashboardTabPanel from './DashboardTabPanel';
import DashboardFrequencyHeaderControls from './DashboardFrequencyHeaderControls';
import { formatDashboardAmount } from './formatDashboardAmount';
import TabSectionStack from './TabSectionStack';

export default function IncomeContent({ bundle, frequency = 'monthly', setFrequency }) {
  const { t } = useI18n();
  const params = useLocalSearchParams();
  const deepTab = Array.isArray(params.tab) ? params.tab[0] : params.tab;
  const deepSub = Array.isArray(params.sub) ? params.sub[0] : params.sub;
  const deepEditRow = Array.isArray(params.editRow) ? params.editRow[0] : params.editRow;
  const currency = getCurrencySymbol(bundle.financials.currencyCode);
  const inc = bundle.financials.income || {};
  const household = bundle.financials.sections?.household || null;

  const monthlyTotal = bundle.financials.totalIncome;
  const annualTotal = monthlyTotal * 12;
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();

  const overviewPanels = useMemo(
    () => buildOverviewIncomePanels(inc, household, t),
    [inc, household, t],
  );

  const primaryPanels = useMemo(
    () => buildPrimaryIncomePanels(inc, household, t),
    [inc, household, t],
  );

  const otherPanels = useMemo(
    () => buildOtherIncomePanels(inc, t),
    [inc, t],
  );

  const primaryTabs = useMemo(() => [
    { key: INCOME_OVERVIEW_KEY, label: t('dashboard.incomeScreen.tabs.overview') },
    { key: INCOME_PRIMARY_KEY, label: t('dashboard.incomeScreen.tabs.primary') },
    { key: INCOME_OTHER_KEY, label: t('dashboard.incomeScreen.tabs.other') },
  ], [t]);

  const [primaryTab, setPrimaryTab] = useState(INCOME_OVERVIEW_KEY);
  const [secondaryTab, setSecondaryTab] = useState(primaryPanels[0]?.key || '');

  useEffect(() => {
    if (deepTab === INCOME_PRIMARY_KEY || deepTab === INCOME_OTHER_KEY) {
      setPrimaryTab(deepTab);
    }
    if (deepSub) {
      setSecondaryTab(deepSub);
    }
  }, [deepTab, deepSub]);

  const isOverview = primaryTab === INCOME_OVERVIEW_KEY;
  const activePanels = primaryTab === INCOME_PRIMARY_KEY ? primaryPanels : otherPanels;

  const secondaryTabs = useMemo(
    () => activePanels.map((p) => ({ key: p.key, label: p.label })),
    [activePanels],
  );

  useEffect(() => {
    if (isOverview) return;
    const keys = activePanels.map((p) => p.key);
    if (!keys.length) {
      setSecondaryTab('');
      return;
    }
    if (!keys.includes(secondaryTab)) {
      setSecondaryTab(keys[0]);
    }
  }, [primaryTab, activePanels, secondaryTab, isOverview]);

  const activePanel = activePanels.find((p) => p.key === secondaryTab) || null;

  const handleBreakdownSectionPress = (sectionKey) => {
    const nav = resolveIncomeSectionNavigation(sectionKey, overviewPanels);
    if (!nav) return;
    setPrimaryTab(nav.primaryTab);
    setSecondaryTab(nav.secondaryTab);
  };

  const heroValue = formatDashboardAmount(monthlyTotal, frequency, currency, daysInMonth);

  return (
    <TabSectionStack>
      <TabHeroMetric
        tone="income"
        label={t('dashboard.incomeScreen.total')}
        value={heroValue}
        animationKey={frequency}
        trailing={setFrequency ? (
          <DashboardFrequencyHeaderControls
            layout="inline"
            scope="income"
            value={frequency}
            onChange={setFrequency}
            tone="income"
          />
        ) : null}
        frequencyCaption={setFrequency ? t('dashboard.frequencyHelper.income.summary') : null}
        secondaryLabel={t('dashboard.incomeScreen.annualTotal', {
          amount: formatDashboardAmount(annualTotal, 'monthly', currency, daysInMonth),
        })}
      />

      <TabInsightCard tabKey="income" financials={bundle.financials} />

      <TabSectionStack tight>
        <ExpenseUnderlineTabBar
          tabs={primaryTabs}
          activeKey={primaryTab}
          onChange={(key) => {
            setPrimaryTab(key);
            if (key === INCOME_PRIMARY_KEY) setSecondaryTab(primaryPanels[0]?.key || '');
            if (key === INCOME_OTHER_KEY) setSecondaryTab(otherPanels[0]?.key || '');
          }}
          accessibilityLabel={t('dashboard.incomeScreen.tabs.primaryA11y')}
        />

        {!isOverview && secondaryTabs.length > 0 ? (
          <ExpenseUnderlineTabBar
            tabs={secondaryTabs}
            activeKey={secondaryTab}
            onChange={setSecondaryTab}
            accessibilityLabel={t('dashboard.incomeScreen.tabs.secondaryA11y')}
          />
        ) : null}
      </TabSectionStack>

      <DashboardTabPanel
        panelKey={isOverview ? INCOME_OVERVIEW_KEY : `${primaryTab}-${secondaryTab}`}
      >
        {isOverview ? (
          <IncomeCategoryPanel
            variant="overview"
            panels={overviewPanels}
            currency={currency}
            currencyCode={bundle.financials.currencyCode}
            t={t}
            frequency={frequency}
            daysInMonth={daysInMonth}
            onSectionPress={handleBreakdownSectionPress}
          />
        ) : activePanel ? (
          <IncomeCategoryPanel
            variant="detail"
            categoryLabel={activePanel.label}
            lineItems={activePanel.lineItems}
            currency={currency}
            currencyCode={bundle.financials.currencyCode}
            t={t}
            emptyLabel={t('dashboard.incomeScreen.subtabEmpty', { type: activePanel.label })}
            initialEditingRowId={
              deepSub === activePanel.key ? deepEditRow || undefined : undefined
            }
          />
        ) : (
          <IncomeCategoryPanel
            variant="detail"
            categoryLabel={primaryTab === INCOME_OTHER_KEY
              ? t('dashboard.incomeScreen.tabs.other')
              : t('dashboard.incomeScreen.tabs.primary')}
            lineItems={[]}
            currency={currency}
            currencyCode={bundle.financials.currencyCode}
            t={t}
            emptyLabel={t('dashboard.incomeScreen.otherEmpty')}
            emptyHint={t('dashboard.incomeScreen.otherEmptyHint')}
            emptyActionLabel={t('dashboard.incomeScreen.addOtherSource')}
            showEmptyAdd={primaryTab === INCOME_OTHER_KEY}
          />
        )}
      </DashboardTabPanel>
    </TabSectionStack>
  );
}
