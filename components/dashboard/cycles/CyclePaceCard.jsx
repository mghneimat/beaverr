import { Pressable, View, StyleSheet } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { C, R, T, tabularNums } from '../../../constants/onboarding-theme';
import { dailyAllowance, formatCurrency, formatSignedCurrency } from '../../../lib/finance';
import { useI18n } from '../../../lib/i18n';
import { buildCyclePoolBreakdown } from '../../../lib/cyclePoolBreakdown';
import { navigateFromDashboardWithFocus } from '../../../lib/screenTransition';
import { InfoIcon } from '../../app/AppNavIcons';
import SurfaceCard from '../../ui/SurfaceCard';
import AnimatedCollapse from '../AnimatedCollapse';

const INFO_SIZE = 16;
const INFO_HIT = 28;

function BreakdownDeltaRow({ label, amount, currency, omitMarginBottom = false }) {
  if (amount === 0) {
    return (
      <BreakdownValueRow
        label={label}
        amount={0}
        currency={currency}
        omitMarginBottom={omitMarginBottom}
      />
    );
  }

  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: omitMarginBottom ? 0 : 6 }}>
      <Text style={{ ...T.caption, color: C.muted, flex: 1, paddingRight: 8 }}>
        {label}
      </Text>
      <Text
        style={{
          fontSize: 13,
          fontWeight: '500',
          color: amount < 0 ? C.danger : C.positive,
          ...tabularNums,
        }}
      >
        {formatSignedCurrency(amount, currency, amount > 0)}
      </Text>
    </View>
  );
}

function BreakdownValueRow({
  label,
  amount,
  currency,
  valueColor = C.text,
  labelWeight = '400',
  valueWeight = '600',
  omitMarginBottom = false,
}) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: omitMarginBottom ? 0 : 6 }}>
      <Text style={{
        ...T.caption,
        color: C.muted,
        flex: 1,
        paddingRight: 8,
        fontWeight: labelWeight,
      }}>
        {label}
      </Text>
      <Text
        style={{
          fontSize: 13,
          fontWeight: valueWeight,
          color: valueColor,
          ...tabularNums,
        }}
      >
        {formatCurrency(amount, currency)}
      </Text>
    </View>
  );
}

function BreakdownDivider() {
  return (
    <View
      style={{
        alignSelf: 'stretch',
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: C.divider,
        marginTop: 10,
        marginBottom: 8,
      }}
    />
  );
}

/**
 * @param {import('../../../lib/schema').Budget|null|undefined} budget
 * @param {import('../../../lib/schema').BudgetCycle|null|undefined} activeCycle
 * @param {import('../../../lib/schema').CycleAdjustment[]} [cycleAdjustments]
 * @param {number} [idleDefaultBudget] — suggested budget when no active cycle
 */
export default function CyclePaceCard({
  pace,
  budget,
  activeCycle,
  cycleAdjustments = [],
  currency,
  idleDefaultBudget = 0,
}) {
  const { t } = useI18n();
  const router = useRouter();
  const idle = !pace && idleDefaultBudget > 0;
  if (!pace && !idle) return null;

  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const pool = idle ? idleDefaultBudget : pace.pool;
  const spent = idle ? 0 : pace.spent;
  const remaining = idle ? idleDefaultBudget : pace.remaining;
  const daily = idle
    ? dailyAllowance(idleDefaultBudget, daysInMonth)
    : pace.dailyAllowance;
  const barColor = idle ? C.positive : (pace.color || C.positive);

  const breakdown = useMemo(() => {
    if (idle || !activeCycle) return null;
    return buildCyclePoolBreakdown({
      cycle: activeCycle,
      budget,
      cycleAdjustments,
    });
  }, [idle, activeCycle, budget, cycleAdjustments]);

  const enteredAmount = breakdown?.enteredAmount
    ?? (idle ? idleDefaultBudget : (pace.budgetAmount ?? pool));
  const spendingPool = breakdown?.pool ?? pool;

  const poolLines = idle
    ? [{
      id: 'jarred',
      amount: 0,
      labelKey: 'dashboard.cycles.pace.breakdown.unspentDailyAllowance',
    }]
    : (breakdown?.lines ?? []);

  const bannerAmountLabel = breakdown?.showBanner
    ? formatCurrency(breakdown.reductionAmount, currency)
    : '';
  const bannerReason = breakdown?.showBanner ? t(breakdown.bannerReasonKey) : '';

  return (
    <SurfaceCard>
      <Text style={{ ...T.cardTitle, marginBottom: idle ? 0 : 16 }}>
        {t('dashboard.cycles.pace.title')}
      </Text>
      {idle ? (
        <Text style={{ ...T.caption, color: C.muted, marginTop: 4, marginBottom: 16 }}>
          {t('dashboard.cycles.pace.status.idle')}
        </Text>
      ) : null}

      <AnimatedCollapse
        visible={Boolean(breakdown?.showBanner)}
        fallbackHeight={76}
        style={{ marginBottom: 16 }}
      >
        <Pressable
          onPress={() => navigateFromDashboardWithFocus(
            router,
            breakdown.bannerRoute || 'budget',
            breakdown.bannerJarId,
          )}
          accessibilityRole="button"
          accessibilityLabel={t('dashboard.cycles.pace.breakdown.bannerA11y', {
            amount: bannerAmountLabel,
            reason: bannerReason,
          })}
          style={({ pressed, hovered }) => ({
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: 10,
            backgroundColor: C.surfaceTint,
            borderRadius: R.input,
            padding: 12,
            opacity: pressed ? 0.85 : 1,
            ...(hovered ? { backgroundColor: C.navSelectedBg } : {}),
          })}
        >
          <View
            style={{
              width: INFO_HIT,
              height: INFO_HIT,
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <InfoIcon color={C.primary} size={INFO_SIZE} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ ...T.caption, color: C.primary, lineHeight: 20, fontWeight: '600' }}>
              {t('dashboard.cycles.pace.breakdown.banner', { amount: bannerAmountLabel })}
            </Text>
            <Text style={{ ...T.caption, color: C.muted, marginTop: 4, lineHeight: 18 }}>
              {bannerReason}
            </Text>
          </View>
        </Pressable>
      </AnimatedCollapse>

      <View>
        <Text style={{ ...T.caption, color: C.muted, marginBottom: 8 }}>
          {t('dashboard.cycles.pace.breakdown.title')}
        </Text>

        <BreakdownValueRow
          label={t('dashboard.cycles.pace.breakdown.entered')}
          amount={enteredAmount}
          currency={currency}
          omitMarginBottom={poolLines.length === 0}
        />

        {poolLines.map((line, index, lines) => (
          <BreakdownDeltaRow
            key={line.id}
            label={t(line.labelKey)}
            amount={line.amount}
            currency={currency}
            omitMarginBottom={index === lines.length - 1}
          />
        ))}

        <BreakdownDivider />

        <BreakdownValueRow
          label={t('dashboard.cycles.pace.breakdown.spendingPool')}
          amount={spendingPool}
          currency={currency}
          valueWeight="700"
        />
        <BreakdownValueRow
          label={t('dashboard.cycles.pace.breakdown.dailyAllowance')}
          amount={daily}
          currency={currency}
        />
        <BreakdownValueRow
          label={t('dashboard.cycles.pace.breakdown.spent')}
          amount={spent}
          currency={currency}
          valueColor={spent > 0 ? barColor : C.text}
          omitMarginBottom
        />

        <BreakdownDivider />

        <BreakdownValueRow
          label={t('dashboard.cycles.pace.breakdown.remaining')}
          amount={remaining}
          currency={currency}
          valueColor={remaining < 0 ? C.danger : C.primary}
          valueWeight="700"
        />
      </View>
    </SurfaceCard>
  );
}
