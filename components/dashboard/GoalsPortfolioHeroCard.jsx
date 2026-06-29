import { View } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useI18n } from '../../lib/i18n';
import { formatCurrency } from '../../lib/finance';
import { computeGoalsPortfolioHero } from '../../lib/goals/goalsPortfolioHero';
import { useDashboardLayout } from '../../lib/dashboardLayout';
import { C, T, tabularNums } from '../../constants/onboarding-theme';
import SurfaceCard from '../ui/SurfaceCard';

const HERO_PREFIX = 'dashboard.goalsScreen.hero';

function HeroColumn({ title, value, helper }) {
  const { isPhone, isNarrow } = useDashboardLayout();
  const valueFontSize = isPhone || isNarrow ? 28 : 32;
  const valueLineHeight = isPhone || isNarrow ? 34 : 38;

  return (
    <View style={{ flex: 1, minWidth: 0, width: '100%' }}>
      <Text style={{ ...T.cardTitle, marginBottom: 8 }} numberOfLines={2}>
        {title}
      </Text>
      <Text
        style={{
          fontSize: valueFontSize,
          lineHeight: valueLineHeight,
          fontWeight: '700',
          color: C.text,
          ...tabularNums,
        }}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.7}
      >
        {value}
      </Text>
      {helper ? (
        <Text style={{ ...T.helper, color: C.muted, marginTop: 8 }} numberOfLines={2}>
          {helper}
        </Text>
      ) : null}
    </View>
  );
}

/**
 * @param {ReturnType<typeof computeGoalsPortfolioHero>} summary
 * @param {(key: string, params?: object) => string} t
 */
function formatOnTrackValue(summary, t) {
  if (!summary.hasSavingGoals) {
    return t(`${HERO_PREFIX}.noSavingGoalsValue`);
  }
  if (summary.paceEligibleCount === 0) {
    return t(`${HERO_PREFIX}.noPaceValue`);
  }
  return t(`${HERO_PREFIX}.onTrackValue`, {
    onTrack: summary.onTrackCount,
    total: summary.paceEligibleCount,
  });
}

/**
 * @param {ReturnType<typeof computeGoalsPortfolioHero>} summary
 * @param {(key: string, params?: object) => string} t
 * @returns {string|null}
 */
function buildOnTrackHelper(summary, t) {
  if (!summary.hasSavingGoals) {
    return t(`${HERO_PREFIX}.noSavingGoalsHelper`);
  }

  const parts = [];
  if (
    summary.paceEligibleCount > 0
    && summary.onTrackCount === summary.paceEligibleCount
  ) {
    parts.push(t(`${HERO_PREFIX}.onTrackAll`));
  } else if (summary.behindCount > 0) {
    parts.push(t(`${HERO_PREFIX}.behindPace`, { count: summary.behindCount }));
  }
  if (summary.onHoldCount > 0) {
    parts.push(t(`${HERO_PREFIX}.onHold`, { count: summary.onHoldCount }));
  }
  if (summary.paceEligibleCount === 0 && summary.onHoldCount === 0) {
    return t(`${HERO_PREFIX}.noPaceHelper`);
  }
  return parts.length > 0 ? parts.join(' · ') : null;
}

/**
 * @param {ReturnType<typeof computeGoalsPortfolioHero>} summary
 * @param {(key: string, params?: object) => string} t
 * @returns {string|null}
 */
function buildDebtHelper(summary, t) {
  if (summary.debtGoalCount === 0) {
    return t(`${HERO_PREFIX}.noDebtGoalsHelper`);
  }
  return t(`${HERO_PREFIX}.debtCount`, { count: summary.debtGoalCount });
}

export default function GoalsPortfolioHeroCard({ goals, debts, currency }) {
  const { t } = useI18n();
  const { isPhone, isNarrow } = useDashboardLayout();
  const stackColumns = isPhone || isNarrow;
  const summary = computeGoalsPortfolioHero(goals, debts);

  const onTrackValue = formatOnTrackValue(summary, t);
  const onTrackHelper = buildOnTrackHelper(summary, t);
  const debtValue = formatCurrency(summary.debtRemaining, currency);
  const debtHelper = buildDebtHelper(summary, t);

  return (
    <SurfaceCard
      accessibilityLabel={t(`${HERO_PREFIX}.a11y`, {
        onTrack: onTrackValue,
        debt: debtValue,
      })}
    >
      <View style={{
        flexDirection: stackColumns ? 'column' : 'row',
        alignItems: 'stretch',
        gap: stackColumns ? 16 : 0,
        width: '100%',
      }}
      >
        <View style={{
          flex: 1,
          paddingRight: stackColumns ? 0 : 12,
          minWidth: 0,
          width: stackColumns ? '100%' : undefined,
        }}
        >
          <HeroColumn
            title={t(`${HERO_PREFIX}.onTrackTitle`)}
            value={onTrackValue}
            helper={onTrackHelper}
          />
        </View>
        {!stackColumns ? (
          <View style={{ width: 1, alignSelf: 'stretch', backgroundColor: C.border, marginVertical: 4 }} />
        ) : (
          <View style={{ width: '100%', height: 1, backgroundColor: C.border }} />
        )}
        <View style={{
          flex: 1,
          paddingLeft: stackColumns ? 0 : 12,
          minWidth: 0,
          width: stackColumns ? '100%' : undefined,
        }}
        >
          <HeroColumn
            title={t(`${HERO_PREFIX}.debtRemainingTitle`)}
            value={debtValue}
            helper={debtHelper}
          />
        </View>
      </View>
    </SurfaceCard>
  );
}
