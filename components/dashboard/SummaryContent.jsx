import { Text } from '@gluestack-ui/themed';
import { T } from '../../constants/onboarding-theme';
import { getCurrencySymbol } from '../../lib/currency';
import { useI18n } from '../../lib/i18n';
import { getTabInsight, getSectionInsight } from '../../lib/insights';
import AIInsightSection from './AIInsightSection';
import BudgetSummaryTable from './BudgetSummaryTable';
import CyclePaceHistorySection from './cycles/CyclePaceHistorySection';
import MonthEndHistoryList from './MonthEndHistoryList';
import TabSectionStack from './TabSectionStack';

export default function SummaryContent({ bundle }) {
  const { t } = useI18n();
  const currency = getCurrencySymbol(bundle.financials.currencyCode);
  const tabInsight = getTabInsight('summary', bundle.insights, t);
  const cyclesEnabled = bundle.financials.budget?.cyclesEnabled === true;

  return (
    <TabSectionStack>
      <Text style={{ ...T.helper }}>
        {t('dashboard.summaryScreen.intro')}
      </Text>
      {tabInsight ? <AIInsightSection paragraphs={tabInsight.paragraphs} /> : null}
      <BudgetSummaryTable
        financials={bundle.financials}
        insights={bundle.insights}
        currency={currency}
        t={t}
        getSectionInsight={getSectionInsight}
      />
      <CyclePaceHistorySection bundle={bundle} currency={currency} />
      {!cyclesEnabled ? (
        <MonthEndHistoryList budget={bundle.financials.budget} currency={currency} />
      ) : null}
    </TabSectionStack>
  );
}
