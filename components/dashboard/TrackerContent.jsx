import { useRef, useCallback, useMemo } from 'react';
import { View } from 'react-native';
import { buildTrackerPreviews } from '../../lib/trackerPreview';
import { useDashboardScroll } from '../../lib/dashboardScroll';
import TrackerPaceSplitCard from './TrackerPaceSplitCard';
import TrackerPeriodCard from './TrackerPeriodCard';
import MonthEndHistoryList from './MonthEndHistoryList';
import CycleTrackerShell from './cycles/CycleTrackerShell';
import CycleCalendar from './cycles/CycleCalendar';
import TabSectionStack from './TabSectionStack';
import TabInsightCard from './TabInsightCard';

export default function TrackerContent({ bundle, currency }) {
  const scrollAnchorRef = useRef(null);
  const calendarRef = useRef(null);
  const { scrollToAnchor } = useDashboardScroll();
  const handleGoBackAndLog = useCallback(() => {
    calendarRef.current?.jumpToFirstUnset?.();
    scrollToAnchor(scrollAnchorRef);
  }, [scrollToAnchor]);
  const budget = bundle.financials.budget || {};
  const cyclesEnabled = budget.cyclesEnabled === true;
  const activeCycle = bundle.financials.activeCycle ?? null;
  const dailyLogs = bundle.financials.dailyLogs || [];

  const handleLogDueDay = useCallback((isoDate) => {
    calendarRef.current?.openSpendForDate?.(isoDate);
    scrollToAnchor(scrollAnchorRef);
  }, [scrollToAnchor]);

  const monthPreviews = useMemo(() => {
    if (cyclesEnabled) return null;
    return buildTrackerPreviews({
      budget,
      effectiveMonthlyFlexible: bundle.financials.effectiveMonthlyFlexible
        ?? bundle.financials.monthlyFlexible,
      dailyLogs,
    });
  }, [cyclesEnabled, budget, bundle.financials, dailyLogs]);

  const insightSlot = (
    <TabInsightCard tabKey="tracker" financials={bundle.financials} />
  );

  const calendarSlot = (
    <View ref={scrollAnchorRef} collapsable={false}>
      <CycleCalendar
        ref={calendarRef}
        activeCycle={cyclesEnabled ? activeCycle : null}
        dailyLogs={dailyLogs}
        currency={currency}
        budget={budget}
      />
    </View>
  );

  const footerSlot = !cyclesEnabled && monthPreviews ? (
    <>
      <TrackerPaceSplitCard previews={monthPreviews} currency={currency} detailed />
      <TrackerPeriodCard period="monthly" previews={monthPreviews} currency={currency} />
      <MonthEndHistoryList budget={budget} currency={currency} />
    </>
  ) : null;

  return (
    <TabSectionStack>
      <CycleTrackerShell
        bundle={bundle}
        currency={currency}
        onGoBackAndLog={handleGoBackAndLog}
        onLogDueDay={handleLogDueDay}
        insightSlot={insightSlot}
        calendarSlot={calendarSlot}
        footerSlot={footerSlot}
      />
    </TabSectionStack>
  );
}
