import { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { useI18n } from '../../../lib/i18n';
import { buildTrackerPreviews } from '../../../lib/trackerPreview';
import { getClosedCycles } from '../../../lib/budgetCycle';
import { C, R } from '../../../constants/onboarding-theme';
import PillToggle from '../../onboarding/PillToggle';
import TrackerPaceSplitCard from '../TrackerPaceSplitCard';
import CycleHistoryList from './CycleHistoryList';

export default function CyclePaceHistorySection({ bundle, currency }) {
  const { t } = useI18n();

  const budget = bundle.financials.budget || {};
  const cyclesEnabled = budget.cyclesEnabled === true;
  const activeCycle = bundle.financials.activeCycle ?? null;
  const cycleStore = bundle.financials.cycleStore;
  const dailyLogs = bundle.financials.dailyLogs || [];
  const cycleAdjustments = bundle.financials.cycleAdjustments || [];
  const effectiveMonthly = bundle.financials.effectiveMonthlyFlexible
    ?? bundle.financials.monthlyFlexible;

  const closedCycles = useMemo(
    () => getClosedCycles(cycleStore),
    [cycleStore],
  );
  const hasActiveCycle = Boolean(activeCycle);
  const hasClosedCycles = closedCycles.length > 0;

  const [segment, setSegment] = useState(() => (hasActiveCycle ? 'current' : 'past'));

  useEffect(() => {
    if (!hasActiveCycle && hasClosedCycles) {
      setSegment('past');
    } else if (hasActiveCycle && !hasClosedCycles) {
      setSegment('current');
    }
  }, [hasActiveCycle, hasClosedCycles]);

  if (!cyclesEnabled || (!hasActiveCycle && !hasClosedCycles)) return null;

  const previews = hasActiveCycle
    ? buildTrackerPreviews({
      budget,
      effectiveMonthlyFlexible: effectiveMonthly,
      dailyLogs,
      activeCycle,
      cycleAdjustments,
    })
    : null;

  const showSegmentToggle = hasActiveCycle && hasClosedCycles;

  return (
    <>
      {showSegmentToggle ? (
        <View
          style={{
            flexDirection: 'row',
            borderWidth: 1,
            borderColor: C.border,
            borderRadius: R.pill,
            overflow: 'hidden',
            marginBottom: 4,
          }}
        >
          <PillToggle
            label={t('dashboard.cycles.segment.current')}
            selected={segment === 'current'}
            onPress={() => setSegment('current')}
            borderRadius={0}
          />
          <PillToggle
            label={t('dashboard.cycles.segment.past')}
            selected={segment === 'past'}
            onPress={() => setSegment('past')}
            borderRadius={0}
          />
        </View>
      ) : null}

      {segment === 'current' && previews ? (
        <TrackerPaceSplitCard previews={previews} currency={currency} detailed />
      ) : (
        <CycleHistoryList cycleStore={cycleStore} currency={currency} showEmpty />
      )}
    </>
  );
}
