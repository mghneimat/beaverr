import { useState, useCallback, useMemo } from 'react';
import { View, Modal, Pressable, Platform } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useI18n } from '../../../lib/i18n';
import { formatCurrency } from '../../../lib/finance';
import { computeCycleBudgetFromPayment } from '../../../lib/cycleBudgetFromPayment';
import { enableCyclesAndStart } from '../../../lib/cycleStart';
import { pendingNextCycleAdjustments, sumNextCycleAdjustments } from '../../../lib/cycleAdjustments';
import { storedDateToIso, isoToStoredDate } from '../../../lib/cycleDates';
import { isoDateKey } from '../../../lib/dailyLog';
import { notifyDashboardRefresh } from '../../../lib/dashboardRefresh';
import { C, R, T, tabularNums } from '../../../constants/onboarding-theme';
import SplitDateFields from '../../onboarding/SplitDateFields';
import FormInput from '../../ui/FormInput';
import PrimaryButton from '../../ui/PrimaryButton';
import { parseAmount, amountToString } from '../../../lib/sectionEditStorage';

export default function StartCycleWizard({
  visible,
  onClose,
  budget,
  defaultPaymentAmount,
  totalIncome,
  fixedCosts,
  debtPayments,
  budgetSpendingRatio,
  deductSavingsGoal = false,
  savingsGoalDeduction = 0,
  currency,
  cycleAdjustments = [],
  lastClosedCycleId = null,
}) {
  const { t } = useI18n();
  const [step, setStep] = useState(0);
  const [startDate, setStartDate] = useState(isoToStoredDate(isoDateKey()));
  const [paymentInput, setPaymentInput] = useState(amountToString(defaultPaymentAmount || 0));
  const [saving, setSaving] = useState(false);
  const [errorText, setErrorText] = useState('');
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

  const footerStyle = dateDropdownOpen
    ? {
        zIndex: 1,
        ...(Platform.OS === 'web' ? { position: 'relative' } : null),
      }
    : undefined;

  const reset = () => {
    setStep(0);
    setStartDate(isoToStoredDate(isoDateKey()));
    setPaymentInput(amountToString(defaultPaymentAmount || 0));
    setErrorText('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const startedAtIso = storedDateToIso(startDate);
  const needsBackfill = startedAtIso && startedAtIso !== isoDateKey();

  const carryOverPending = useMemo(
    () => (
      lastClosedCycleId
        ? pendingNextCycleAdjustments(cycleAdjustments, lastClosedCycleId)
        : []
    ),
    [cycleAdjustments, lastClosedCycleId],
  );
  const carryOverDelta = useMemo(
    () => (
      lastClosedCycleId
        ? sumNextCycleAdjustments(cycleAdjustments, lastClosedCycleId)
        : { income: 0, expense: 0 }
    ),
    [cycleAdjustments, lastClosedCycleId],
  );

  const computedFromPayment = useMemo(() => {
    const payment = parseAmount(paymentInput);
    if (payment == null || payment <= 0) {
      return { cycleBudget: 0, plannedSavingsAmount: 0 };
    }
    return computeCycleBudgetFromPayment({
      paymentAmount: payment,
      totalIncome,
      fixedCosts,
      debtPayments,
      budgetSpendingRatio,
      deductSavingsGoal,
      savingsGoalDeduction,
    });
  }, [
    paymentInput,
    totalIncome,
    fixedCosts,
    debtPayments,
    budgetSpendingRatio,
    deductSavingsGoal,
    savingsGoalDeduction,
  ]);

  const budgetAfterAdjustments = Math.max(
    0,
    computedFromPayment.cycleBudget + carryOverDelta.income - carryOverDelta.expense,
  );

  const handleContinue = () => {
    if (step === 0) {
      if (!startedAtIso) {
        setErrorText(t('dashboard.cycles.start.validationDate'));
        return;
      }
      setErrorText('');
      setStep(1);
      return;
    }

    if (step === 1) {
      const payment = parseAmount(paymentInput);
      if (payment == null || payment <= 0) {
        setErrorText(t('dashboard.cycles.start.validationPayment'));
        return;
      }
      if (computedFromPayment.cycleBudget <= 0) {
        setErrorText(t('dashboard.cycles.start.validationBudget'));
        return;
      }
      setErrorText('');
      if (needsBackfill) {
        setStep(2);
      } else {
        handleStart();
      }
    }
  };

  const handleStart = async () => {
    const payment = parseAmount(paymentInput);
    if (!startedAtIso || payment == null || payment <= 0) return;

    const { cycleBudget, plannedSavingsAmount } = computeCycleBudgetFromPayment({
      paymentAmount: payment,
      totalIncome,
      fixedCosts,
      debtPayments,
      budgetSpendingRatio,
      deductSavingsGoal,
      savingsGoalDeduction,
    });

    if (cycleBudget <= 0) return;

    setSaving(true);
    setErrorText('');
    try {
      await enableCyclesAndStart({
        startedAt: startedAtIso,
        budgetAmount: cycleBudget,
        plannedSavingsAmount,
        budget: budget || {},
      });
      notifyDashboardRefresh();
      handleClose();
    } catch {
      setErrorText(t('dashboard.cycles.start.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const showComputedBudget = computedFromPayment.cycleBudget > 0;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Pressable
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(30,58,95,0.35)',
          }}
          onPress={handleClose}
          accessibilityRole="button"
          accessibilityLabel={t('dashboard.cycles.start.closeA11y')}
        />
        <View
          style={{
            width: '100%',
            maxWidth: 440,
            backgroundColor: C.surface,
            borderRadius: R.card,
            borderWidth: 1,
            borderColor: C.border,
            padding: 20,
            overflow: 'visible',
            ...(Platform.OS === 'web' ? { cursor: 'default' } : {}),
          }}
        >
          <Text style={{ ...T.cardTitle, marginBottom: 8 }}>
            {t('dashboard.cycles.start.title')}
          </Text>

          {step === 0 ? (
            <View style={dateSectionStyle}>
              <Text style={{ ...T.helper, color: C.muted, marginBottom: 16 }}>
                {t('dashboard.cycles.start.dateHelper')}
              </Text>
              <SplitDateFields
                value={startDate}
                onChange={setStartDate}
                yearPast={2}
                errorText={errorText}
                onElevatedChange={handleDateElevatedChange}
              />
            </View>
          ) : null}

          {step === 1 ? (
            <>
              <Text style={{ ...T.helper, color: C.muted, marginBottom: 16 }}>
                {t('dashboard.cycles.start.paymentHelper')}
              </Text>
              <FormInput
                label={t('dashboard.cycles.start.paymentLabel')}
                value={paymentInput}
                onChangeText={(text) => {
                  setPaymentInput(text);
                  setErrorText('');
                }}
                numeric
                large
                currency={currency}
                errorText={errorText}
                disabled={saving}
                accessibilityLabel={t('dashboard.cycles.start.paymentA11y')}
              />
              {showComputedBudget ? (
                <View style={{ marginTop: 16, gap: 4 }}>
                  <Text style={{ ...T.caption, color: C.muted, fontWeight: '600' }}>
                    {t('dashboard.cycles.start.computedBudget')}
                  </Text>
                  <Text style={{ ...T.body, color: C.primary, fontWeight: '700', ...tabularNums }}>
                    {formatCurrency(computedFromPayment.cycleBudget, currency)}
                  </Text>
                  {computedFromPayment.plannedSavingsAmount > 0 ? (
                    <Text style={{ ...T.caption, color: C.muted, ...tabularNums }}>
                      {t('dashboard.cycles.start.computedSavings', {
                        amount: formatCurrency(computedFromPayment.plannedSavingsAmount, currency),
                      })}
                    </Text>
                  ) : null}
                </View>
              ) : null}
              {carryOverPending.length > 0 ? (
                <View style={{ marginTop: 16, gap: 6 }}>
                  <Text style={{ ...T.caption, color: C.muted, fontWeight: '600' }}>
                    {t('dashboard.cycles.start.carryOverAdjustments')}
                  </Text>
                  {carryOverPending.map((row) => (
                    <Text key={row.id} style={{ ...T.caption, color: C.muted, ...tabularNums }}>
                      {row.kind === 'income' ? '+' : '−'}
                      {formatCurrency(row.amount, currency)} — {row.label}
                    </Text>
                  ))}
                  {showComputedBudget ? (
                    <Text style={{ ...T.caption, color: C.primary, ...tabularNums }}>
                      {t('dashboard.cycles.start.budgetAfterAdjustments', {
                        amount: formatCurrency(budgetAfterAdjustments, currency),
                      })}
                    </Text>
                  ) : null}
                </View>
              ) : null}
            </>
          ) : null}

          {step === 2 ? (
            <Text style={{ ...T.helper, color: C.muted, marginBottom: 16 }}>
              {t('dashboard.cycles.start.backfillNotice')}
            </Text>
          ) : null}

          <View style={footerStyle}>
            <PrimaryButton
              onPress={step === 2 ? () => handleStart() : handleContinue}
              disabled={saving}
              accessibilityState={{ busy: saving }}
              style={{ marginTop: 16 }}
            >
              {saving
                ? t('dashboard.cycles.start.saving')
                : step === 2
                  ? t('dashboard.cycles.start.beginBackfill')
                  : t('common.continue')}
            </PrimaryButton>
          </View>
        </View>
      </View>
    </Modal>
  );
}
