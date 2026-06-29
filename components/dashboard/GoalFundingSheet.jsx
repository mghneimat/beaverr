import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Pressable, Platform } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import Svg, { Path } from 'react-native-svg';
import { useI18n } from '../../lib/i18n';
import { formatCurrency } from '../../lib/finance';
import { buildStashDestinationOptions, getStashBalance } from '../../lib/stashTransfers';
import { resolveStashRefLabel } from '../../lib/goals/goalFundingDisplay';
import { createFundingRuleId, resolveDebtId } from '../../lib/goals/goalIds';
import { computeRemainingToTarget } from '../../lib/goals/goalProgress';
import {
  defaultContributionStartStoredDate,
  deriveScheduleAnchors,
  isoDateToStoredDate,
  startOfToday,
  storedDateToIso,
  todayStoredDate,
  tomorrowDate,
} from '../../lib/goals/goalFundingSchedule';
import {
  patchGoal,
  applyImmediateGoalContribution,
  buildRulesAfterRemove,
} from '../../lib/goals/goalCrud';
import { notifyDashboardRefresh } from '../../lib/dashboardRefresh';
import { parseAmount } from '../../lib/sectionEditStorage';
import { C, R, T } from '../../constants/onboarding-theme';
import FormInput from '../ui/FormInput';
import PrimaryButton from '../ui/PrimaryButton';
import OutlineButton from '../ui/OutlineButton';
import StashTabSelectField from './StashTabSelectField';
import FrequencyPills from '../onboarding/FrequencyPills';
import SplitDateFields from '../onboarding/SplitDateFields';
import AnimatedCollapse from './AnimatedCollapse';
import DashboardScrollSheet from './DashboardScrollSheet';
import {
  PiggyBankIcon,
  SavingsIcon,
  WalletCardsIcon,
  TrashIcon,
  RefreshCcwIcon,
  LinkIcon,
} from '../app/AppNavIcons';

const DELETE_ICON_COLOR = '#D14040';
const TAB_PLUS_SIZE = 16;
const STASH_ICON_SIZE = 18;

function TabPlusIcon({ color }) {
  return (
    <Svg width={TAB_PLUS_SIZE} height={TAB_PLUS_SIZE} viewBox="0 0 24 24">
      <Path
        d="M12 5.5v13M5.5 12h13"
        stroke={color}
        strokeWidth={2.25}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function AddNewLinkChip({ label, accessibilityLabel, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed, hovered }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 8,
        paddingHorizontal: 14,
        minHeight: 36,
        borderRadius: R.pill,
        flexShrink: 0,
        backgroundColor: pressed
          ? C.bg
          : hovered
            ? C.bg
            : C.pillUnselectedBg,
        borderWidth: 1,
        borderColor: C.pillUnselectedBorder,
        ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
      })}
    >
      <TabPlusIcon color={C.text} />
      <Text style={{ ...T.pillLabel, fontSize: 13, fontWeight: '600', color: C.text }}>
        {label}
      </Text>
    </Pressable>
  );
}

function LinkKindOption({ Icon, label, subtitle, selected, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed, hovered }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 14,
        paddingHorizontal: 14,
        borderRadius: R.input,
        borderWidth: 1.5,
        borderColor: selected ? C.primary : C.border,
        backgroundColor: selected
          ? 'rgba(30,58,95,0.04)'
          : pressed
            ? C.overlayPressed
            : hovered
              ? C.bg
              : C.surface,
        marginBottom: 10,
        ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
      })}
    >
      <View style={{
        width: 40,
        height: 40,
        borderRadius: R.input,
        backgroundColor: C.bg,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: C.border,
      }}
      >
        <Icon color={selected ? C.primary : C.muted} size={18} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{
          fontSize: 15,
          fontWeight: selected ? '600' : '500',
          color: selected ? C.primary : C.text,
        }}
        >
          {label}
        </Text>
        <Text style={{ ...T.caption, color: C.muted, marginTop: 2 }}>
          {subtitle}
        </Text>
      </View>
    </Pressable>
  );
}

function stashIconForRef(ref) {
  if (ref === 'looseCash') return PiggyBankIcon;
  if (ref === 'savings') return SavingsIcon;
  return WalletCardsIcon;
}

function GoalLinkRow({ rule, budget, currency, t, onDelete, deleting }) {
  const TabIcon = stashIconForRef(rule.stashRef);
  const tabName = resolveStashRefLabel(rule.stashRef, budget, t);
  const amount = formatCurrency(Number(rule.amount) || 0, currency);
  const frequency = rule.frequency === 'once'
    ? t('dashboard.goalsScreen.funding.frequency.once')
    : t(`dashboard.goalsScreen.funding.frequency.${rule.frequency}`);
  const nextDate = rule.nextRunDate ? isoDateToStoredDate(rule.nextRunDate) : '';

  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderRadius: R.input,
      borderWidth: 1,
      borderColor: C.border,
      backgroundColor: C.surface,
    }}
    >
      <View style={{
        width: 40,
        height: 40,
        borderRadius: R.input,
        backgroundColor: C.bg,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: C.border,
        flexShrink: 0,
      }}
      >
        <TabIcon color={C.muted} size={STASH_ICON_SIZE} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ ...T.helper, fontWeight: '600', color: C.text }} numberOfLines={1}>
          {tabName}
        </Text>
        <Text style={{ ...T.caption, color: C.muted, marginTop: 2 }} numberOfLines={2}>
          {rule.frequency === 'once'
            ? t('dashboard.goalsScreen.funding.linkAmountOnce', { amount })
            : t('dashboard.goalsScreen.funding.linkAmountFrequency', { amount, frequency })}
        </Text>
        {nextDate ? (
          <Text style={{ ...T.caption, color: C.muted, marginTop: 2 }} numberOfLines={1}>
            {t('dashboard.goalsScreen.funding.linkNextMove', { date: nextDate })}
          </Text>
        ) : null}
      </View>
      <Pressable
        onPress={() => onDelete(rule.id)}
        disabled={deleting}
        accessibilityRole="button"
        accessibilityLabel={t('dashboard.goalsScreen.funding.deleteRuleA11y')}
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        style={({ pressed, hovered }) => ({
          width: 40,
          height: 40,
          borderRadius: 20,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: pressed
            ? 'rgba(209, 64, 64, 0.14)'
            : hovered
              ? 'rgba(209, 64, 64, 0.08)'
              : 'transparent',
          ...(Platform.OS === 'web' ? { cursor: deleting ? 'default' : 'pointer' } : {}),
        })}
      >
        <TrashIcon color={DELETE_ICON_COLOR} size={16} />
      </Pressable>
    </View>
  );
}

export default function GoalFundingSheet({
  visible,
  goal,
  budget,
  income,
  debts = [],
  currency,
  onClose,
}) {
  const { t } = useI18n();
  const [stashRef, setStashRef] = useState(null);
  const [amountText, setAmountText] = useState('');
  const [startDate, setStartDate] = useState('');
  const [frequency, setFrequency] = useState('monthly');
  const [addFormStep, setAddFormStep] = useState('kind');
  const [linkKind, setLinkKind] = useState(null);
  const [oneTimeTiming, setOneTimeTiming] = useState('immediate');
  const [errorText, setErrorText] = useState('');
  const [saving, setSaving] = useState(false);
  const [addFormOpen, setAddFormOpen] = useState(false);
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);

  const handleDateElevatedChange = useCallback((open) => {
    setDateDropdownOpen(open);
  }, []);

  const dateSectionStyle = dateDropdownOpen
    ? {
        zIndex: 200,
        elevation: 12,
        overflow: 'visible',
        ...(Platform.OS === 'web' ? { position: 'relative' } : null),
      }
    : { overflow: 'visible' };

  const formFooterStyle = dateDropdownOpen
    ? {
        zIndex: 1,
        ...(Platform.OS === 'web' ? { position: 'relative' } : null),
      }
    : undefined;

  const minRecurringStartDate = useMemo(() => tomorrowDate(), []);
  const minRecurringStartIso = useMemo(
    () => storedDateToIso(defaultContributionStartStoredDate()),
    [],
  );
  const minOnceStartDate = useMemo(() => startOfToday(), []);
  const todayIso = useMemo(() => storedDateToIso(todayStoredDate()), []);

  const activeRules = useMemo(
    () => (goal?.fundingRules || []).filter((rule) => (Number(rule.amount) || 0) > 0),
    [goal?.fundingRules],
  );
  const hasLinks = activeRules.length > 0;

  const remainingToTarget = useMemo(() => {
    if (!goal) return null;
    let debtBalance;
    if (goal.type === 'debt' && goal.linkedDebtId) {
      const debt = debts.find((d, i) => resolveDebtId(d, i) === goal.linkedDebtId);
      debtBalance = debt ? Number(debt.balance) : undefined;
    }
    return computeRemainingToTarget(goal, debtBalance);
  }, [goal, debts]);

  const parsedAmount = useMemo(() => parseAmount(amountText), [amountText]);

  const oneTimeAmountError = useMemo(() => {
    if (linkKind !== 'once') return '';
    if (remainingToTarget !== null && remainingToTarget <= 0 && parsedAmount > 0) {
      return t('dashboard.goalsScreen.funding.validationGoalAtTarget');
    }
    if (
      remainingToTarget !== null
      && remainingToTarget > 0
      && parsedAmount > remainingToTarget
    ) {
      return t('dashboard.goalsScreen.funding.validationExceedsTarget', {
        remaining: formatCurrency(remainingToTarget, currency),
      });
    }
    return '';
  }, [linkKind, remainingToTarget, parsedAmount, t, currency]);

  const oneTimeAmountHelper = useMemo(() => {
    if (linkKind !== 'once' || oneTimeAmountError) return undefined;
    if (remainingToTarget === null || remainingToTarget <= 0) return undefined;
    return t('dashboard.goalsScreen.funding.amountRemainingHelper', {
      remaining: formatCurrency(remainingToTarget, currency),
    });
  }, [linkKind, oneTimeAmountError, remainingToTarget, t, currency]);

  const oneTimeAmountBlocked = Boolean(oneTimeAmountError);

  const sourceOptions = useMemo(
    () => buildStashDestinationOptions(budget, income, t).map((option) => ({
      id: option.id,
      label: option.label,
      balance: getStashBalance(budget, income, option.id),
    })),
    [budget, income, t],
  );

  const resetForm = useCallback(() => {
    setStashRef(null);
    setAmountText('');
    setStartDate(defaultContributionStartStoredDate());
    setFrequency('monthly');
    setAddFormStep('kind');
    setLinkKind(null);
    setOneTimeTiming('immediate');
    setErrorText('');
    setDateDropdownOpen(false);
  }, []);

  useEffect(() => {
    if (!visible) return;
    resetForm();
    setSaving(false);
    const linksExist = (goal?.fundingRules || []).some((rule) => (Number(rule.amount) || 0) > 0);
    setAddFormOpen(!linksExist);
  }, [visible, goal?.id, goal?.fundingRules, resetForm]);

  const handleClose = () => {
    if (saving) return;
    onClose();
  };

  const collapseAddForm = () => {
    resetForm();
    setAddFormOpen(false);
  };

  const selectLinkKind = (nextKind) => {
    setLinkKind(nextKind);
    setErrorText('');
    if (nextKind === 'once') {
      setStartDate(todayStoredDate());
      setOneTimeTiming('immediate');
    } else {
      setStartDate(defaultContributionStartStoredDate());
    }
  };

  const handleContinueFromLinkKind = () => {
    if (!linkKind) {
      setErrorText(t('dashboard.goalsScreen.funding.validationLinkKind'));
      return;
    }
    setAddFormStep('details');
    setErrorText('');
  };

  const handleBackToLinkKind = () => {
    setAddFormStep('kind');
    setErrorText('');
  };

  const handleCancelPress = () => {
    if (addFormOpen && addFormStep === 'details' && !hasLinks) {
      handleBackToLinkKind();
      return;
    }
    if (hasLinks && addFormOpen) {
      collapseAddForm();
      return;
    }
    handleClose();
  };

  const persistRules = async (nextRules, { closeAfter = false } = {}) => {
    if (!goal) return false;
    setSaving(true);
    setErrorText('');
    try {
      await patchGoal(goal.id, { fundingRules: nextRules });
      notifyDashboardRefresh();
      resetForm();
      if (closeAfter) {
        onClose();
      } else {
        setAddFormOpen(false);
      }
      return true;
    } catch {
      setErrorText(t('dashboard.goalsScreen.funding.saveError'));
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleAddRecurringRule = async () => {
    if (!goal) return;
    if (!stashRef) {
      setErrorText(t('dashboard.goalsScreen.funding.validationTab'));
      return;
    }
    const amount = parseAmount(amountText);
    if (!amount || amount <= 0) {
      setErrorText(t('dashboard.goalsScreen.funding.validationAmount'));
      return;
    }
    const nextRunIso = storedDateToIso(startDate);
    if (!nextRunIso) {
      setErrorText(t('dashboard.goalsScreen.funding.validationDate'));
      return;
    }
    if (nextRunIso < minRecurringStartIso) {
      setErrorText(t('dashboard.goalsScreen.funding.validationDateFuture'));
      return;
    }

    const duplicate = (goal.fundingRules || []).some(
      (rule) => rule.stashRef === stashRef
        && rule.frequency !== 'once'
        && rule.frequency === frequency,
    );
    if (duplicate) {
      setErrorText(t('dashboard.goalsScreen.funding.validationDuplicate'));
      return;
    }

    const anchors = deriveScheduleAnchors(nextRunIso);
    const nextRule = {
      id: createFundingRuleId(),
      stashRef,
      amount,
      frequency,
      priority: (goal.fundingRules || []).length,
      nextRunDate: nextRunIso,
      dayOfMonth: anchors.dayOfMonth,
      dayOfWeek: anchors.dayOfWeek,
      lastProcessedAt: null,
    };
    await persistRules([...(goal.fundingRules || []), nextRule], { closeAfter: !hasLinks });
  };

  const handleAddOneTimeRule = async () => {
    if (!goal) return;
    if (!stashRef) {
      setErrorText(t('dashboard.goalsScreen.funding.validationTab'));
      return;
    }
    const amount = parseAmount(amountText);
    if (!amount || amount <= 0) {
      setErrorText(t('dashboard.goalsScreen.funding.validationAmount'));
      return;
    }
    if (oneTimeAmountBlocked) {
      setErrorText(oneTimeAmountError);
      return;
    }

    if (oneTimeTiming === 'immediate') {
      setSaving(true);
      setErrorText('');
      try {
        const result = await applyImmediateGoalContribution(
          goal.id,
          { stashRef, amount },
          { budget, income, debts },
        );
        if (result.error === 'empty_source') {
          setErrorText(t('dashboard.goalsScreen.funding.validationEmptySource'));
          return;
        }
        if (result.error === 'goal_at_target') {
          setErrorText(t('dashboard.goalsScreen.funding.validationGoalAtTarget'));
          return;
        }
        if (result.error === 'insufficient' || result.error === 'goal_not_found') {
          setErrorText(t('dashboard.goalsScreen.funding.validationInsufficient'));
          return;
        }
        notifyDashboardRefresh();
        resetForm();
        onClose();
      } catch {
        setErrorText(t('dashboard.goalsScreen.funding.saveError'));
      } finally {
        setSaving(false);
      }
      return;
    }

    const nextRunIso = storedDateToIso(startDate);
    if (!nextRunIso) {
      setErrorText(t('dashboard.goalsScreen.funding.validationDate'));
      return;
    }
    if (todayIso && nextRunIso < todayIso) {
      setErrorText(t('dashboard.goalsScreen.funding.validationDateToday'));
      return;
    }

    const anchors = deriveScheduleAnchors(nextRunIso);
    const nextRule = {
      id: createFundingRuleId(),
      stashRef,
      amount,
      frequency: 'once',
      priority: (goal.fundingRules || []).length,
      nextRunDate: nextRunIso,
      dayOfMonth: anchors.dayOfMonth,
      dayOfWeek: anchors.dayOfWeek,
      lastProcessedAt: null,
    };
    await persistRules([...(goal.fundingRules || []), nextRule], { closeAfter: !hasLinks });
  };

  const handleAddRule = async () => {
    if (linkKind === 'once') {
      await handleAddOneTimeRule();
      return;
    }
    await handleAddRecurringRule();
  };

  const handleDeleteRule = async (ruleId) => {
    if (!goal) return;
    await persistRules(buildRulesAfterRemove(goal.fundingRules, ruleId));
  };

  if (!visible || !goal) return null;

  return (
    <DashboardScrollSheet
      visible={visible}
      onClose={handleClose}
      closeA11yLabel={t('dashboard.goalsScreen.funding.closeA11y')}
    >
          <Text style={{ ...T.cardTitle, marginBottom: 4 }}>
            {t('dashboard.goalsScreen.funding.title')}
          </Text>
          <Text style={{ ...T.caption, color: C.muted, marginBottom: 20 }}>
            {t('dashboard.goalsScreen.funding.subtitle', { name: goal.name })}
          </Text>

          {hasLinks ? (
            <View style={{ gap: 8, marginBottom: 16 }}>
              <Text style={{ ...T.fieldLabel, marginBottom: 4 }}>
                {t('dashboard.goalsScreen.funding.activeRules')}
              </Text>
              {activeRules.map((rule) => (
                <GoalLinkRow
                  key={rule.id}
                  rule={rule}
                  budget={budget}
                  currency={currency}
                  t={t}
                  onDelete={handleDeleteRule}
                  deleting={saving}
                />
              ))}
              {!addFormOpen ? (
                <View style={{ alignItems: 'center', marginTop: 12, width: '100%' }}>
                  <AddNewLinkChip
                    label={t('dashboard.goalsScreen.funding.addNewLink')}
                    accessibilityLabel={t('dashboard.goalsScreen.funding.addNewLinkA11y')}
                    onPress={() => {
                      resetForm();
                      setAddFormOpen(true);
                    }}
                  />
                </View>
              ) : null}
            </View>
          ) : null}

          <AnimatedCollapse visible={addFormOpen}>
            {addFormStep === 'kind' ? (
              <View>
                {!hasLinks ? (
                  <Text style={{ ...T.fieldLabel, marginBottom: 12 }}>
                    {t('dashboard.goalsScreen.funding.addRule')}
                  </Text>
                ) : (
                  <Text style={{ ...T.fieldLabel, marginBottom: 12 }}>
                    {t('dashboard.goalsScreen.funding.addRuleForm')}
                  </Text>
                )}
                <Text style={{ ...T.caption, color: C.muted, marginBottom: 12 }}>
                  {t('dashboard.goalsScreen.funding.linkKindPrompt')}
                </Text>
                <LinkKindOption
                  Icon={LinkIcon}
                  label={t('dashboard.goalsScreen.funding.linkKind.once')}
                  subtitle={t('dashboard.goalsScreen.funding.linkKind.onceHelper')}
                  selected={linkKind === 'once'}
                  onPress={() => selectLinkKind('once')}
                />
                <LinkKindOption
                  Icon={RefreshCcwIcon}
                  label={t('dashboard.goalsScreen.funding.linkKind.recurring')}
                  subtitle={t('dashboard.goalsScreen.funding.linkKind.recurringHelper')}
                  selected={linkKind === 'recurring'}
                  onPress={() => selectLinkKind('recurring')}
                />
                {errorText ? (
                  <Text style={{ ...T.caption, color: C.danger, marginBottom: 12 }}>{errorText}</Text>
                ) : null}
                <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
                  <View style={{ flex: 1 }}>
                    <OutlineButton onPress={handleCancelPress} disabled={saving} destructive>
                      {t('common.cancel')}
                    </OutlineButton>
                  </View>
                  <View style={{ flex: 1 }}>
                    <PrimaryButton onPress={handleContinueFromLinkKind} disabled={!linkKind || saving}>
                      {t('common.continue')}
                    </PrimaryButton>
                  </View>
                </View>
              </View>
            ) : (
              <View>
                <Pressable
                  onPress={handleBackToLinkKind}
                  accessibilityRole="button"
                  style={{ alignSelf: 'flex-start', marginBottom: 16 }}
                >
                  <Text style={{ ...T.caption, color: C.primary, fontWeight: '600' }}>
                    ← {t('dashboard.goalsScreen.funding.changeLinkKind')}
                  </Text>
                </Pressable>

                <StashTabSelectField
                  label={t('dashboard.goalsScreen.funding.fromTab')}
                  options={sourceOptions}
                  selectedId={stashRef}
                  onSelect={(id) => {
                    setStashRef(id);
                    setErrorText('');
                  }}
                  currency={currency}
                />

                {linkKind === 'recurring' ? (
                  <FrequencyPills
                    options={['daily', 'weekly', 'monthly', 'annual']}
                    value={frequency}
                    onChange={setFrequency}
                    label={t('dashboard.goalsScreen.funding.frequencyLabel')}
                    variant="segment"
                    small
                    containerStyle={{ marginTop: 16 }}
                  />
                ) : (
                  <FrequencyPills
                    options={['immediate', 'scheduled']}
                    value={oneTimeTiming}
                    onChange={(value) => {
                      setOneTimeTiming(value);
                      if (value === 'scheduled') {
                        setStartDate(todayStoredDate());
                      }
                    }}
                    label={t('dashboard.goalsScreen.funding.oneTimeWhenLabel')}
                    labelMap={{
                      immediate: t('dashboard.goalsScreen.funding.oneTimeWhen.immediate'),
                      scheduled: t('dashboard.goalsScreen.funding.oneTimeWhen.scheduled'),
                    }}
                    variant="segment"
                    small
                    containerStyle={{ marginTop: 16 }}
                  />
                )}

                <FormInput
                  label={t('dashboard.goalsScreen.funding.amount')}
                  value={amountText}
                  onChangeText={(text) => {
                    setAmountText(text);
                    setErrorText('');
                  }}
                  placeholder="0"
                  numeric
                  currency={currency}
                  disabled={saving}
                  helperText={oneTimeAmountHelper}
                  errorText={oneTimeAmountError}
                  containerStyle={{ marginTop: 16 }}
                />

                {linkKind === 'recurring' || oneTimeTiming === 'scheduled' ? (
                  <View style={{ marginTop: 16, ...dateSectionStyle }}>
                    <Text style={{ ...T.fieldLabel, marginBottom: 8 }}>
                      {linkKind === 'recurring'
                        ? t('dashboard.goalsScreen.funding.startDate')
                        : t('dashboard.goalsScreen.funding.oneTimeDate')}
                    </Text>
                    <SplitDateFields
                      value={startDate}
                      onChange={(value) => {
                        setStartDate(value);
                        setErrorText('');
                      }}
                      yearPast={0}
                      yearFuture={2}
                      minSelectableDate={linkKind === 'recurring' ? minRecurringStartDate : minOnceStartDate}
                      onElevatedChange={handleDateElevatedChange}
                    />
                    <Text style={{ ...T.caption, color: C.muted, marginTop: 6 }}>
                      {linkKind === 'recurring'
                        ? t('dashboard.goalsScreen.funding.startDateHelper')
                        : t('dashboard.goalsScreen.funding.oneTimeDateHelper')}
                    </Text>
                  </View>
                ) : (
                  <Text style={{ ...T.caption, color: C.muted, marginTop: 12 }}>
                    {t('dashboard.goalsScreen.funding.oneTimeImmediateHelper')}
                  </Text>
                )}

                <View style={formFooterStyle}>
                {errorText ? (
                  <Text style={{ ...T.caption, color: C.danger, marginTop: 12 }}>{errorText}</Text>
                ) : null}

                <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
                  <View style={{ flex: 1 }}>
                    <OutlineButton onPress={handleCancelPress} disabled={saving} destructive>
                      {t('common.cancel')}
                    </OutlineButton>
                  </View>
                  <View style={{ flex: 1 }}>
                    <PrimaryButton onPress={handleAddRule} disabled={saving || oneTimeAmountBlocked}>
                      {linkKind === 'once' && oneTimeTiming === 'immediate'
                        ? t('dashboard.goalsScreen.funding.saveOneTimeNow')
                        : t('dashboard.goalsScreen.funding.save')}
                    </PrimaryButton>
                  </View>
                </View>
                </View>
              </View>
            )}
          </AnimatedCollapse>

          {hasLinks && !addFormOpen ? (
            <View style={{ marginTop: 20 }}>
              <PrimaryButton onPress={handleClose}>
                {t('common.done')}
              </PrimaryButton>
            </View>
          ) : null}
    </DashboardScrollSheet>
  );
}
