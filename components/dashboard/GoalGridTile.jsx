import { useState } from 'react';
import { View, Pressable, Platform } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useRouter, useSegments } from 'expo-router';
import { navigateToGoalDetail, navigateToReduceCosts, resolveActiveAppTab } from '../../lib/screenTransition';
import { useI18n } from '../../lib/i18n';
import { formatCurrency } from '../../lib/finance';
import { computeProgressPercent } from '../../lib/goals';
import { goalHasDeadline } from '../../lib/goals/goalPace';
import { computeCostReduction } from '../../lib/costReductionProgress';
import { C, R, T, tabularNums } from '../../constants/onboarding-theme';
import {
  SavingsIcon,
  GoalsIcon,
  CostsIcon,
  CreditCardIcon,
  Link2Icon,
  Unlink2Icon,
  Link2OffIcon,
  RotateCwIcon,
  SquarePenIcon,
} from '../app/AppNavIcons';
import MetricExplainCard from './MetricExplainCard';
import GoalProgressBar from './GoalProgressBar';
import AnimatedGoalStatusChip from './AnimatedGoalStatusChip';

const ICON_SIZE = 16;
const ACTION_HIT = 40;
const CARD_ACTION_INSET = 12;

function goalIconForType(type) {
  switch (type) {
    case 'savings':
      return SavingsIcon;
    case 'custom':
      return GoalsIcon;
    case 'debt':
      return CreditCardIcon;
    case 'reduceCosts':
      return CostsIcon;
    default:
      return GoalsIcon;
  }
}

function paceChipVariant(paceKey) {
  if (paceKey === 'on_track' || paceKey === 'ahead') return 'positive';
  if (paceKey === 'behind' || paceKey === 'regressed') return 'danger';
  return 'muted';
}

function lifecycleChipVariant(statusKey) {
  if (statusKey === 'completed') return 'positive';
  if (statusKey === 'on_hold') return 'info';
  return 'muted';
}

function CardIconButton({ onPress, accessibilityLabel, disabled = false, children }) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  if (disabled) {
    return (
      <View
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ disabled: true }}
        style={{
          width: ACTION_HIT,
          height: ACTION_HIT,
          borderRadius: ACTION_HIT / 2,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 1,
        }}
      >
        {children}
      </View>
    );
  }

  return (
    <Pressable
      onPress={(event) => {
        event?.stopPropagation?.();
        onPress?.();
      }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      style={{
        width: ACTION_HIT,
        height: ACTION_HIT,
        borderRadius: ACTION_HIT / 2,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: pressed
          ? C.overlayPressed
          : hovered
            ? C.overlayHover
            : 'transparent',
        ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
      }}
    >
      {children}
    </Pressable>
  );
}

function CardArchiveChip({ label, accessibilityLabel, onPress }) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  return (
    <Pressable
      onPress={(event) => {
        event?.stopPropagation?.();
        onPress?.();
      }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={{
        paddingVertical: 5,
        paddingHorizontal: 8,
        minHeight: 28,
        borderRadius: R.button,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: pressed
          ? C.pillUnselectedBg
          : hovered
            ? C.bg
            : C.surface,
        borderWidth: 1,
        borderColor: C.pillUnselectedBorder,
        ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
      }}
    >
      <Text style={{ fontSize: 11, fontWeight: '600', color: C.primary }}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function GoalGridTile({
  goal,
  currency,
  financials,
  onEdit,
  onArchive,
  onFundingPress,
  onResetPress,
}) {
  const { t } = useI18n();
  const router = useRouter();
  const segments = useSegments();
  const currentRoute = resolveActiveAppTab(segments);
  const isReduceCosts = goal.type === 'reduceCosts';
  const reduction = isReduceCosts && financials
    ? computeCostReduction(financials)
    : null;

  const debt = goal.type === 'debt' && goal.linkedDebtId
    ? (financials?.debts || []).find((d, i) => (d.id || `debt_${i}`) === goal.linkedDebtId)
    : null;
  const debtBalance = debt ? Number(debt.balance) : undefined;
  const progress = computeProgressPercent(goal, debtBalance);

  const Icon = goalIconForType(goal.type);
  const isArchived = goal.lifecycleStatus === 'archived';
  const isActive = goal.lifecycleStatus === 'active';
  const isCompleted = goal.lifecycleStatus === 'completed';
  const isOnHold = goal.lifecycleStatus === 'on_hold';
  const hasDeadline = goalHasDeadline(goal);
  const paceKey = goal.paceStatus || 'on_track';
  const showPace = goal.paceStatus && isActive && hasDeadline;
  const showLifecycle = !showPace && goal.lifecycleStatus !== 'active';
  const hasFundingRules = (goal.fundingRules || []).some((rule) => (Number(rule.amount) || 0) > 0);
  const showFundingAction = isActive && !isReduceCosts;
  const canResetProgress = progress > 0;
  const showResetAction = isActive && !isReduceCosts && !!onResetPress;
  const showDisabledLink = isCompleted && !isReduceCosts;
  const showEditAction = !isArchived && !isReduceCosts;
  const showArchiveAction = isCompleted && !!onArchive;
  const hasActionRow = showFundingAction || showResetAction || showDisabledLink || showEditAction || showArchiveAction;

  const footerLabel = isReduceCosts
    ? t('dashboard.goalsScreen.reduceCostsTap')
    : undefined;

  const footerMeta = !isReduceCosts ? (
    <Text style={{ ...T.caption, color: C.muted }} numberOfLines={1}>
      {hasDeadline
        ? t('dashboard.goalsScreen.deadline', { date: goal.endDate })
        : t('dashboard.goalsScreen.noDeadline')}
    </Text>
  ) : null;

  const value = isReduceCosts
    ? (reduction?.hasBaseline
      ? formatCurrency(reduction.reduced, currency)
      : t('dashboard.goalsScreen.reduceCostsPending'))
    : formatCurrency(goal.currentAmount, currency);

  const amountValue = isReduceCosts
    ? (reduction?.hasBaseline ? reduction.reduced : undefined)
    : Number(goal.currentAmount) || 0;

  const isDebtGoal = goal.type === 'debt';

  const targetValueMeta = !isReduceCosts && goal.targetAmount ? (
    <View style={{ flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', columnGap: 6 }}>
      <Text style={{ ...T.caption, color: C.muted, fontWeight: '600' }}>
        {t(isDebtGoal ? 'dashboard.goalsScreen.totalDebt' : 'dashboard.goalsScreen.target')}
      </Text>
      <Text
        style={{
          fontSize: 14,
          lineHeight: 20,
          fontWeight: '600',
          color: C.muted,
          ...tabularNums,
        }}
      >
        {formatCurrency(Number(goal.targetAmount) || 0, currency)}
      </Text>
    </View>
  ) : null;

  const statusChip = isOnHold
    ? {
      label: t('dashboard.goalsScreen.lifecycle.on_hold'),
      variant: lifecycleChipVariant('on_hold'),
    }
    : showPace
      ? {
        label: t(`dashboard.goalsScreen.pace.${paceKey}`),
        variant: paceChipVariant(paceKey),
      }
      : showLifecycle
        ? {
          label: t(`dashboard.goalsScreen.lifecycle.${goal.lifecycleStatus}`),
          variant: lifecycleChipVariant(goal.lifecycleStatus),
        }
        : undefined;

  const handlePress = () => {
    if (isArchived) return;
    if (isReduceCosts) {
      navigateToReduceCosts(router, currentRoute);
      return;
    }
    navigateToGoalDetail(router, goal.id);
  };

  const showTopRightColumn = hasActionRow || !!statusChip;
  const trailingInset = showTopRightColumn
    ? (showArchiveAction ? 118 : hasActionRow ? (showResetAction ? 130 : 88) : 76)
    : 0;

  return (
    <View style={{ flex: 1, alignSelf: 'stretch', position: 'relative' }}>
      <MetricExplainCard
        label={goal.name}
        labelIcon={<Icon color={C.muted} size={ICON_SIZE} />}
        value={value}
        amountValue={typeof amountValue === 'number' ? amountValue : undefined}
        amountCurrency={currency}
        valueMeta={targetValueMeta}
        footerLabel={footerLabel}
        footerMeta={footerMeta}
        onPress={isArchived ? undefined : handlePress}
        frequencySlot={!isReduceCosts ? (
          <GoalProgressBar percent={progress} />
        ) : null}
        frequencySlotVisible={!isReduceCosts && hasDeadline}
        layoutAnimated={!isReduceCosts}
        accessibilityLabel={isOnHold
          ? t('dashboard.goalsScreen.gridCardA11yOnHold', { name: goal.name })
          : targetValueMeta
            ? t(isDebtGoal
              ? 'dashboard.goalsScreen.gridCardA11yWithDebt'
              : 'dashboard.goalsScreen.gridCardA11yWithTarget', {
              name: goal.name,
              current: value,
              paid: value,
              target: formatCurrency(goal.targetAmount, currency),
              total: formatCurrency(goal.targetAmount, currency),
            })
            : t('dashboard.goalsScreen.gridCardA11y', {
              name: goal.name,
              amount: value,
            })}
        style={{ flex: 1, alignSelf: 'stretch' }}
        trailingInset={trailingInset}
      />

      {showTopRightColumn ? (
        <View
          style={{
            position: 'absolute',
            top: CARD_ACTION_INSET,
            right: CARD_ACTION_INSET,
            zIndex: 10,
            alignItems: 'flex-end',
            gap: 4,
            maxWidth: '58%',
          }}
        >
          {hasActionRow ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 2,
              }}
            >
              {showArchiveAction ? (
                <CardArchiveChip
                  label={t('dashboard.goalsScreen.archive')}
                  accessibilityLabel={t('dashboard.goalsScreen.archiveA11y', { name: goal.name })}
                  onPress={() => onArchive(goal)}
                />
              ) : null}
              {showFundingAction ? (
                <CardIconButton
                  onPress={() => onFundingPress?.(goal)}
                  accessibilityLabel={hasFundingRules
                    ? t('dashboard.goalsScreen.funding.editA11y', { name: goal.name })
                    : t('dashboard.goalsScreen.funding.setupA11y', { name: goal.name })}
                >
                  {hasFundingRules ? (
                    <Link2Icon color={C.positive} size={16} />
                  ) : (
                    <Unlink2Icon color={C.danger} size={16} />
                  )}
                </CardIconButton>
              ) : null}
              {showResetAction ? (
                canResetProgress ? (
                  <CardIconButton
                    onPress={() => onResetPress?.(goal)}
                    accessibilityLabel={t('dashboard.goalsScreen.reset.a11y', { name: goal.name })}
                  >
                    <RotateCwIcon color={C.muted} size={16} />
                  </CardIconButton>
                ) : (
                  <CardIconButton
                    disabled
                    accessibilityLabel={t('dashboard.goalsScreen.reset.disabledA11y', { name: goal.name })}
                  >
                    <RotateCwIcon color={C.muted} size={16} />
                  </CardIconButton>
                )
              ) : null}
          {showDisabledLink ? (
            <CardIconButton
              disabled
              accessibilityLabel={t('dashboard.goalsScreen.funding.linkDisabledA11y', { name: goal.name })}
            >
              <Link2OffIcon color={C.muted} size={16} />
            </CardIconButton>
          ) : null}
              {showEditAction ? (
                <CardIconButton
                  onPress={() => onEdit?.(goal)}
                  accessibilityLabel={t('dashboard.goalsScreen.editA11y', { name: goal.name })}
                >
                  <SquarePenIcon color={C.text} size={16} />
                </CardIconButton>
              ) : null}
            </View>
          ) : null}
          <AnimatedGoalStatusChip
            chip={statusChip}
            style={{ marginTop: 0, marginBottom: 0, alignSelf: 'flex-end' }}
          />
        </View>
      ) : null}
    </View>
  );
}
