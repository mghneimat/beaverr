import { View, Pressable } from 'react-native';
import { useMemo } from 'react';
import { useI18n } from '../../lib/i18n';
import { isCycleBackfillPending } from '../../lib/budgetCycle';
import { buildTrackerPreviews } from '../../lib/trackerPreview';
import SpendingPaceBanner from './SpendingPaceBanner';
import TrackerPaceSplitCard from './TrackerPaceSplitCard';

export default function TrackerSnapshotCard({ financials, currency, onOpenTracker }) {
  const { t } = useI18n();

  const activeCycle = financials.activeCycle ?? null;
  const dailyLogs = financials.dailyLogs || [];
  const cyclesEnabled = financials.budget?.cyclesEnabled === true;

  const backfillPending = useMemo(
    () => Boolean(activeCycle && isCycleBackfillPending(activeCycle, dailyLogs)),
    [activeCycle, dailyLogs],
  );

  const previews = buildTrackerPreviews({
    budget: financials.budget,
    effectiveMonthlyFlexible: financials.effectiveMonthlyFlexible ?? financials.monthlyFlexible,
    dailyLogs,
    activeCycle,
    cycleAdjustments: financials.cycleAdjustments || [],
  });

  const paceBannerContext = activeCycle || !cyclesEnabled ? previews.periodPace : null;

  return (
    <View style={{ marginBottom: 16 }}>
      <SpendingPaceBanner
        backfillPending={backfillPending}
        periodPace={paceBannerContext}
        style={{ marginBottom: 12 }}
      />
      <Pressable
        onPress={onOpenTracker}
        accessibilityRole="button"
        accessibilityLabel={t('dashboard.home.trackerSnapshot.a11y')}
        style={({ pressed }) => ({ opacity: pressed ? 0.92 : 1 })}
      >
        <TrackerPaceSplitCard previews={previews} currency={currency} />
      </Pressable>
    </View>
  );
}
