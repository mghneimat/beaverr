import { getCurrencySymbol } from '../../lib/currency';
import { useI18n } from '../../lib/i18n';
import { getTabInsight } from '../../lib/insights';
import AIInsightSection from './AIInsightSection';
import MonthEndHistoryList from './MonthEndHistoryList';
import SummaryCycleHistoryTable from './SummaryCycleHistoryTable';
import SummaryCycleOverviewCard from './SummaryCycleOverviewCard';
import SummaryDailySpendSection from './SummaryDailySpendSection';
import TabSectionStack from './TabSectionStack';

export default function SummaryContent({ bundle }) {
  const { t } = useI18n();
  const currency = getCurrencySymbol(bundle.financials.currencyCode);
  const tabInsight = getTabInsight('summary', bundle.insights, t);
  const cyclesEnabled = bundle.financials.budget?.cyclesEnabled === true;

  return (
    <TabSectionStack>
      <SummaryCycleOverviewCard bundle={bundle} currency={currency} />

      <SummaryDailySpendSection bundle={bundle} currency={currency} />

      <SummaryCycleHistoryTable
        cycleStore={bundle.financials.cycleStore}
        currency={currency}
        cyclesEnabled={cyclesEnabled}
        budget={bundle.financials.budget}
        dailyLogs={bundle.financials.dailyLogs || []}
        cycleAdjustments={bundle.financials.cycleAdjustments || []}
      />

      {tabInsight ? <AIInsightSection paragraphs={tabInsight.paragraphs} /> : null}

      {!cyclesEnabled ? (
        <MonthEndHistoryList budget={bundle.financials.budget} currency={currency} />
      ) : null}
    </TabSectionStack>
  );
}
