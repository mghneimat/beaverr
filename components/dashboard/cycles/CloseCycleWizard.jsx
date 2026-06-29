import { useMemo, useState, useEffect, useCallback } from 'react';
import { View, Modal, Pressable, Platform } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useI18n } from '../../../lib/i18n';
import { formatCurrency } from '../../../lib/finance';
import { missingDaysInCycle } from '../../../lib/budgetCycle';
import {
  buildCoverageLimits,
  buildDefaultCoverage,
  buildEditableCoverageRows,
  normalizeCoverageForSave,
  validateCoverage,
} from '../../../lib/overspendCoverage';
import { finalizeCycleClose } from '../../../lib/cycleClose';
import { isoDateKey } from '../../../lib/dailyLog';
import {
  isBackfillCycle,
  recomputeClosedCycleTotals,
  resolveDefaultCycleCloseDate,
  validateCycleEndDate,
} from '../../../lib/cycleCloseDates';
import { storedDateToIso, isoToStoredDate } from '../../../lib/cycleDates';
import { notifyDashboardRefresh } from '../../../lib/dashboardRefresh';
import { C, R, T, tabularNums } from '../../../constants/onboarding-theme';
import PrimaryButton from '../../ui/PrimaryButton';
import YesNoToggle from '../../onboarding/YesNoToggle';
import SplitDateFields from '../../onboarding/SplitDateFields';
import CycleCoverageEditor from './CycleCoverageEditor';

export default function CloseCycleWizard({
  visible,
  onClose,
  onGoBackAndLog,
  cycle,
  budget,
  income,
  dailyLogs,
  currency,
  cycleAdjustments = [],
}) {
  const { t } = useI18n();
  const today = isoDateKey();
  const [step, setStep] = useState(0);
  const [confirmUnset, setConfirmUnset] = useState(false);
  const [endDate, setEndDate] = useState('');
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);
  /** @type {[import('../../../lib/schema').OverspendCoverage[], Function]} */
  const [coverageRows, setCoverageRows] = useState([]);
  const [saving, setSaving] = useState(false);
  const [errorText, setErrorText] = useState('');

  const needsCloseDateChoice = Boolean(cycle && isBackfillCycle(cycle, today));

  const defaultCloseIso = useMemo(
    () => (cycle ? resolveDefaultCycleCloseDate(cycle, dailyLogs, today) : today),
    [cycle, dailyLogs, today],
  );

  const closedAtIso = useMemo(() => {
    if (!needsCloseDateChoice) return today;
    return storedDateToIso(endDate) || defaultCloseIso;
  }, [needsCloseDateChoice, endDate, defaultCloseIso, today]);

  const closeBalance = useMemo(() => {
    if (!cycle) {
      return { pool: 0, spentTotal: 0, deficit: 0, surplus: 0 };
    }
    return recomputeClosedCycleTotals(
      cycle,
      dailyLogs,
      budget,
      closedAtIso,
      cycleAdjustments,
    );
  }, [cycle, dailyLogs, budget, closedAtIso, cycleAdjustments]);

  const spentTotal = closeBalance.spentTotal;
  const effectivePool = closeBalance.pool;
  const deficit = closeBalance.deficit;
  const surplus = closeBalance.surplus;
  const unsetDays = useMemo(
    () => (
      cycle
        ? missingDaysInCycle(
          cycle,
          dailyLogs,
          needsCloseDateChoice ? closedAtIso : undefined,
        )
        : []
    ),
    [cycle, dailyLogs, needsCloseDateChoice, closedAtIso],
  );

  const coverageLimits = useMemo(
    () => buildCoverageLimits({
      cycleSavingsRemaining: cycle?.plannedSavingsAmount || 0,
      generalSavingsBalance: Number(income?.savingsBalance) || 0,
      rolloverBalance: Number(budget?.rolloverBalance) || 0,
      looseMoneyBalance: Number(budget?.looseMoneyBalance) || 0,
    }),
    [cycle, income, budget],
  );

  const resetCoverageRows = useCallback(() => {
    if (deficit <= 0) {
      setCoverageRows([]);
      return;
    }
    const defaults = buildDefaultCoverage({
      deficit,
      cycleSavingsRemaining: cycle?.plannedSavingsAmount || 0,
      generalSavingsBalance: Number(income?.savingsBalance) || 0,
      rolloverBalance: Number(budget?.rolloverBalance) || 0,
      looseMoneyBalance: Number(budget?.looseMoneyBalance) || 0,
    });
    setCoverageRows(buildEditableCoverageRows(defaults, coverageLimits, deficit));
  }, [deficit, cycle, income, budget, coverageLimits]);

  useEffect(() => {
    if (visible && cycle) {
      setStep(0);
      setConfirmUnset(false);
      setErrorText('');
      setEndDate(isoToStoredDate(defaultCloseIso));
      resetCoverageRows();
    }
  }, [visible, cycle, defaultCloseIso, resetCoverageRows]);

  const handleDateElevatedChange = useCallback((open) => {
    setDateDropdownOpen(open);
  }, []);

  const dateSectionStyle = dateDropdownOpen
    ? {
        zIndex: 200,
        elevation: 12,
        overflow: 'visible',
        marginBottom: 16,
        ...(Platform.OS === 'web' ? { position: 'relative' } : null),
      }
    : { overflow: 'visible', marginBottom: 16 };

  const reset = () => {
    setStep(0);
    setConfirmUnset(false);
    setErrorText('');
    resetCoverageRows();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFinalize = async () => {
    if (!cycle) return;

    if (needsCloseDateChoice) {
      const endErr = validateCycleEndDate(cycle.startedAt, closedAtIso, today);
      if (endErr) {
        if (endErr === 'validationEndBeforeStart') {
          setErrorText(t('dashboard.cycles.close.validationEndBeforeStart'));
        } else if (endErr === 'validationEndFuture') {
          setErrorText(t('dashboard.cycles.close.validationEndFuture'));
        } else {
          setErrorText(t('dashboard.cycles.close.validationEndDate'));
        }
        return;
      }
    }

    const normalized = normalizeCoverageForSave(coverageRows);
    const validation = validateCoverage(normalized, deficit, coverageLimits);
    if (deficit > 0 && !validation.valid) {
      if (validation.code === 'sum') {
        setErrorText(t('dashboard.cycles.close.coverageSumError'));
      } else if (validation.code === 'limit') {
        setErrorText(t('dashboard.cycles.close.coverageLimitError'));
      } else {
        setErrorText(t('dashboard.cycles.close.coverageEmptyError'));
      }
      return;
    }

    setSaving(true);
    setErrorText('');
    try {
      await finalizeCycleClose({
        cycleId: cycle.id,
        closedAt: closedAtIso,
        dailyLogs,
        budget: budget || {},
        income,
        coverage: deficit > 0 ? normalized : undefined,
        surplusRouting: surplus > 0
          ? { destination: 'rollover', amount: surplus }
          : undefined,
        closedWithUnsetDays: unsetDays.length > 0 && confirmUnset,
        cycleAdjustments,
      });
      notifyDashboardRefresh();
      handleClose();
    } catch {
      setErrorText(t('dashboard.cycles.close.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleUnsetChoice = (acceptClose) => {
    if (!acceptClose) {
      handleClose();
      onGoBackAndLog?.();
      return;
    }
    setConfirmUnset(true);
    if (deficit > 0) {
      setStep(1);
    } else {
      handleFinalize();
    }
  };

  const advance = () => {
    if (step === 0 && unsetDays.length > 0 && !confirmUnset) {
      setErrorText(t('dashboard.cycles.close.unsetRequired'));
      return;
    }
    if (step === 0 && needsCloseDateChoice) {
      const endErr = validateCycleEndDate(cycle.startedAt, closedAtIso, today);
      if (endErr) {
        if (endErr === 'validationEndBeforeStart') {
          setErrorText(t('dashboard.cycles.close.validationEndBeforeStart'));
        } else if (endErr === 'validationEndFuture') {
          setErrorText(t('dashboard.cycles.close.validationEndFuture'));
        } else {
          setErrorText(t('dashboard.cycles.close.validationEndDate'));
        }
        return;
      }
    }
    setErrorText('');

    if (step === 0) {
      if (deficit > 0) {
        setStep(1);
      } else {
        handleFinalize();
      }
      return;
    }

    if (step === 1) {
      handleFinalize();
    }
  };

  const isLastStep = step === 1 || (step === 0 && deficit <= 0);
  const hideFooterContinue = step === 0 && unsetDays.length > 0;

  if (!cycle) return null;

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
          accessibilityLabel={t('dashboard.cycles.close.closeA11y')}
        />
        <View
          style={{
            width: '100%',
            maxWidth: 440,
            maxHeight: '90%',
            backgroundColor: C.surface,
            borderRadius: R.card,
            borderWidth: 1,
            borderColor: C.border,
            padding: 20,
            overflow: 'visible',
          }}
        >
          <Text style={{ ...T.cardTitle, marginBottom: 8 }}>
            {t('dashboard.cycles.close.title')}
          </Text>

          {step === 0 ? (
            <>
              {needsCloseDateChoice ? (
                <View style={dateSectionStyle}>
                  <Text style={{ ...T.helper, color: C.muted, marginBottom: 12 }}>
                    {t('dashboard.cycles.close.endDateHelper')}
                  </Text>
                  <Text style={{ ...T.caption, color: C.muted, fontWeight: '600', marginBottom: 8 }}>
                    {t('dashboard.cycles.close.endDateLabel')}
                  </Text>
                  <SplitDateFields
                    value={endDate}
                    onChange={(next) => {
                      setEndDate(next);
                      setErrorText('');
                    }}
                    yearPast={3}
                    onElevatedChange={handleDateElevatedChange}
                  />
                </View>
              ) : null}
              <View style={{ gap: 8, marginBottom: 16 }}>
                <Text style={{ ...T.helper, ...tabularNums }}>
                  {t('dashboard.cycles.close.spent')}: {formatCurrency(spentTotal, currency)}
                </Text>
                <Text style={{ ...T.helper, ...tabularNums }}>
                  {t('dashboard.cycles.close.budget')}: {formatCurrency(effectivePool, currency)}
                </Text>
                {surplus > 0 ? (
                  <Text style={{ ...T.helper, color: C.positive, ...tabularNums }}>
                    {t('dashboard.cycles.close.surplus')}: {formatCurrency(surplus, currency)}
                  </Text>
                ) : null}
                {deficit > 0 ? (
                  <Text style={{ ...T.helper, color: C.danger, ...tabularNums }}>
                    {t('dashboard.cycles.close.deficit')}: {formatCurrency(deficit, currency)}
                  </Text>
                ) : null}
              </View>
              <Text style={{ ...T.caption, color: C.muted, marginBottom: unsetDays.length > 0 ? 0 : 16 }}>
                {t('dashboard.cycles.close.finishHelper')}
              </Text>
              {unsetDays.length > 0 ? (
                <>
                  <Text style={{ ...T.caption, color: C.cycleWarning, marginBottom: 12 }}>
                    {t('dashboard.cycles.close.unsetWarning', { count: String(unsetDays.length) })}
                  </Text>
                  <YesNoToggle
                    value={confirmUnset}
                    onChange={handleUnsetChoice}
                    yesLabel={t('dashboard.cycles.close.unsetConfirmYes')}
                    noLabel={t('dashboard.cycles.close.unsetConfirmNo')}
                  />
                </>
              ) : null}
            </>
          ) : null}

          {step === 1 && deficit > 0 ? (
            <>
              <Text style={{ ...T.helper, color: C.muted, marginBottom: 12 }}>
                {t('dashboard.cycles.close.coverageEditHelper')}
              </Text>
              <CycleCoverageEditor
                rows={coverageRows}
                onChange={setCoverageRows}
                limits={coverageLimits}
                deficit={deficit}
                currency={currency}
              />
              <Pressable
                onPress={resetCoverageRows}
                accessibilityRole="button"
                accessibilityLabel={t('dashboard.cycles.close.coverageResetA11y')}
                style={({ pressed }) => ({
                  alignSelf: 'flex-start',
                  marginTop: 8,
                  opacity: pressed ? 0.65 : 1,
                })}
              >
                <Text style={{ ...T.caption, color: C.accent, fontWeight: '600' }}>
                  {t('dashboard.cycles.close.coverageReset')}
                </Text>
              </Pressable>
            </>
          ) : null}

          {errorText ? (
            <Text style={{ ...T.caption, color: C.danger, marginTop: 12 }}>{errorText}</Text>
          ) : null}

          {!hideFooterContinue ? (
            <PrimaryButton
              onPress={advance}
              disabled={saving}
              style={{ marginTop: 16 }}
            >
              {saving
                ? t('dashboard.cycles.close.saving')
                : isLastStep
                  ? t('dashboard.cycles.close.finish')
                  : t('common.continue')}
            </PrimaryButton>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}
