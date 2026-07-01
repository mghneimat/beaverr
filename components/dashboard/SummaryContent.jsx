import { getCurrencySymbol } from '../../lib/currency';
import TabInsightCard from './TabInsightCard';
import MonthEndHistoryList from './MonthEndHistoryList';
import SummaryCycleHistoryTable from './SummaryCycleHistoryTable';
import SummaryCycleOverviewCard from './SummaryCycleOverviewCard';
import SummaryDailySpendSection from './SummaryDailySpendSection';
import TabSectionStack from './TabSectionStack';

export default function SummaryContent({ bundle }) {
  const currency = getCurrencySymbol(bundle.financials.currencyCode);
  const cyclesEnabled = bundle.financials.budget?.cyclesEnabled === true;

  return (
    <TabSectionStack>
      <TabInsightCard tabKey="summary" financials={bundle.financials} />

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

      {!cyclesEnabled ? (
        <MonthEndHistoryList budget={bundle.financials.budget} currency={currency} />
      ) : null}
    </TabSectionStack>
  );
}
