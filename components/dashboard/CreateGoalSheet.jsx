import { useEffect, useMemo, useState } from 'react';
import { View, Modal, Pressable, Platform, ScrollView } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useI18n } from '../../lib/i18n';
import { formatCurrency } from '../../lib/finance';
import { getCurrencySymbol } from '../../lib/currency';
import { C, R, T, tabularNums } from '../../constants/onboarding-theme';
import FormInput from '../ui/FormInput';
import PrimaryButton from '../ui/PrimaryButton';
import OutlineButton from '../ui/OutlineButton';
import {
  appendDebtPayoffGoal,
  appendGoal,
  buildCustomGoal,
  buildManualDebtGoal,
  listDebtsAvailableForGoalCreation,
} from '../../lib/goals/goalCrud';
import { resolveDebtEntryLabel } from '../../lib/goals/goalSync';
import { notifyDashboardRefresh } from '../../lib/dashboardRefresh';
import { parseAmount } from '../../lib/sectionEditStorage';
import { SavingsIcon, CreditCardIcon } from '../app/AppNavIcons';
import GoalDeadlineFields from './GoalDeadlineFields';
import { startOfToday } from '../../lib/goals/goalFundingSchedule';

function GoalKindOption({ Icon, label, subtitle, selected, onPress }) {
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

function DebtSelectRow({ label, balance, currency, selected, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed, hovered }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: R.input,
        borderWidth: 1,
        borderColor: selected ? C.primary : C.border,
        backgroundColor: selected
          ? C.surfaceTint
          : pressed || hovered
            ? C.bg
            : C.surface,
        marginBottom: 8,
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
        <CreditCardIcon color={C.muted} size={18} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ ...T.fieldLabel, color: C.text }} numberOfLines={1}>{label}</Text>
        <Text style={{ ...T.caption, color: C.muted, marginTop: 2, ...tabularNums }}>
          {formatCurrency(balance, currency)}
        </Text>
      </View>
    </Pressable>
  );
}

export default function CreateGoalSheet({ visible, onClose, financials, goals = [] }) {
  const { t } = useI18n();
  const currency = getCurrencySymbol(financials?.currencyCode);
  const [step, setStep] = useState('kind');
  const [kind, setKind] = useState(null);
  const [name, setName] = useState('');
  const [deadlineMode, setDeadlineMode] = useState('none');
  const [endDate, setEndDate] = useState('');
  const [targetText, setTargetText] = useState('');
  const [selectedDebtId, setSelectedDebtId] = useState(null);
  const [debtName, setDebtName] = useState('');
  const [debtBalanceText, setDebtBalanceText] = useState('');
  const [debtMinPaymentText, setDebtMinPaymentText] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);
  const minSelectableDate = useMemo(() => startOfToday(), []);

  const availableDebts = useMemo(
    () => listDebtsAvailableForGoalCreation(financials?.debts, goals),
    [financials?.debts, goals],
  );

  useEffect(() => {
    if (!visible) return;
    setStep('kind');
    setKind(null);
    setName('');
    setDeadlineMode('none');
    setEndDate('');
    setTargetText('');
    setSelectedDebtId(null);
    setDebtName('');
    setDebtBalanceText('');
    setDebtMinPaymentText('');
    setError('');
    setSaving(false);
    setDateDropdownOpen(false);
  }, [visible]);

  const selectKind = (nextKind) => {
    if (nextKind !== kind) {
      setName('');
      setDeadlineMode('none');
      setEndDate('');
      setTargetText('');
      setSelectedDebtId(null);
      setDebtName('');
      setDebtBalanceText('');
      setDebtMinPaymentText('');
    }
    setKind(nextKind);
    setError('');
  };

  const handleContinueFromKind = () => {
    if (!kind) {
      setError(t('dashboard.goalsScreen.create.validationKind'));
      return;
    }
    setStep('details');
    setError('');
  };

  const handleBackToKind = () => {
    setStep('kind');
    setError('');
  };

  const clearDebtSelection = () => {
    setSelectedDebtId(null);
  };

  const handleSaveSavings = async () => {
    if (!name.trim()) {
      setError(t('dashboard.goalsScreen.create.validationName'));
      return;
    }
    const targetAmount = parseAmount(targetText);
    if (!targetAmount || targetAmount <= 0) {
      setError(t('dashboard.goalsScreen.create.validationTarget'));
      return;
    }
    if (deadlineMode === 'set' && !endDate.trim()) {
      setError(t('dashboard.goalsScreen.setDeadline.validationDate'));
      return;
    }

    setSaving(true);
    try {
      const goal = buildCustomGoal({
        name,
        endDate: deadlineMode === 'set' ? endDate.trim() : null,
        targetAmount,
      });
      await appendGoal(goal);
      notifyDashboardRefresh();
      onClose();
    } catch {
      setError(t('dashboard.goalsScreen.create.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDebt = async () => {
    if (selectedDebtId) {
      const selected = availableDebts.find((entry) => entry.debtId === selectedDebtId);
      if (!selected) {
        setError(t('dashboard.goalsScreen.create.validationDebt'));
        return;
      }

      setSaving(true);
      try {
        const goal = buildManualDebtGoal(selected.debt, selected.index, t);
        await appendGoal(goal);
        notifyDashboardRefresh();
        onClose();
      } catch {
        setError(t('dashboard.goalsScreen.create.saveError'));
      } finally {
        setSaving(false);
      }
      return;
    }

    if (!debtName.trim()) {
      setError(t('dashboard.goalsScreen.create.validationDebtName'));
      return;
    }
    const balance = parseAmount(debtBalanceText);
    if (!balance || balance <= 0) {
      setError(t('dashboard.goalsScreen.create.validationDebtBalance'));
      return;
    }
    const minPayment = parseAmount(debtMinPaymentText) || 0;

    setSaving(true);
    try {
      await appendDebtPayoffGoal({
        creditor: debtName,
        balance,
        minPayment,
      }, t);
      notifyDashboardRefresh();
      onClose();
    } catch {
      setError(t('dashboard.goalsScreen.create.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleSave = () => {
    if (kind === 'debt') {
      handleSaveDebt();
      return;
    }
    handleSaveSavings();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(30, 58, 95, 0.35)', justifyContent: 'center', padding: 24 }}
        onPress={onClose}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            maxWidth: 440,
            width: '100%',
            alignSelf: 'center',
            backgroundColor: C.surface,
            borderRadius: R.card,
            padding: 24,
          }}
        >
          {step === 'details' ? (
            <Pressable
              onPress={handleBackToKind}
              accessibilityRole="button"
              accessibilityLabel={t('dashboard.goalsScreen.create.backToKindA11y')}
              style={({ pressed, hovered }) => ({
                alignSelf: 'flex-start',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                marginBottom: 12,
                paddingVertical: 4,
                paddingHorizontal: 2,
                opacity: pressed ? 0.7 : 1,
                ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
              })}
            >
              <Text style={{ ...T.caption, color: C.primary, fontWeight: '600' }}>
                ← {t('common.back')}
              </Text>
            </Pressable>
          ) : null}
          <Text style={{ ...T.cardTitle, marginBottom: 4 }}>
            {t('dashboard.goalsScreen.create.title')}
          </Text>
          <Text style={{ ...T.caption, color: C.muted, marginBottom: 16 }}>
            {step === 'kind'
              ? t('dashboard.goalsScreen.create.kindPrompt')
              : kind === 'debt'
                ? t('dashboard.goalsScreen.create.debtHelper')
                : t('dashboard.goalsScreen.create.savingsHelper')}
          </Text>

          {step === 'kind' ? (
            <View>
              <GoalKindOption
                Icon={SavingsIcon}
                label={t('dashboard.goalsScreen.create.kind.savings')}
                subtitle={t('dashboard.goalsScreen.create.kind.savingsHelper')}
                selected={kind === 'savings'}
                onPress={() => selectKind('savings')}
              />
              <GoalKindOption
                Icon={CreditCardIcon}
                label={t('dashboard.goalsScreen.create.kind.debt')}
                subtitle={t('dashboard.goalsScreen.create.kind.debtHelper')}
                selected={kind === 'debt'}
                onPress={() => selectKind('debt')}
              />
              {error ? (
                <Text style={{ ...T.caption, color: C.danger, marginBottom: 12 }}>{error}</Text>
              ) : null}
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
                <View style={{ flex: 1 }}>
                  <OutlineButton onPress={onClose}>
                    {t('common.cancel')}
                  </OutlineButton>
                </View>
                <View style={{ flex: 1 }}>
                  <PrimaryButton onPress={handleContinueFromKind} disabled={!kind}>
                    {t('common.continue')}
                  </PrimaryButton>
                </View>
              </View>
            </View>
          ) : (
            <ScrollView
              style={{
                maxHeight: 520,
                ...(dateDropdownOpen ? { overflow: 'visible' } : null),
              }}
              contentContainerStyle={{
                paddingBottom: dateDropdownOpen ? 240 : 4,
                ...(dateDropdownOpen ? { overflow: 'visible' } : null),
              }}
              scrollEnabled={!dateDropdownOpen}
              keyboardShouldPersistTaps="handled"
            >
              {kind === 'savings' ? (
                <>
                  <FormInput
                    label={t('dashboard.goalsScreen.create.name')}
                    value={name}
                    onChangeText={setName}
                    placeholder={t('dashboard.goalsScreen.create.namePlaceholder')}
                  />
                  <GoalDeadlineFields
                    mode={deadlineMode}
                    onModeChange={(mode) => {
                      setDeadlineMode(mode);
                      setError('');
                    }}
                    endDate={endDate}
                    onEndDateChange={(value) => {
                      setEndDate(value);
                      setError('');
                    }}
                    minSelectableDate={minSelectableDate}
                    onElevatedChange={setDateDropdownOpen}
                    errorText={error && deadlineMode === 'set' ? error : undefined}
                  />
                  <FormInput
                    label={t('dashboard.goalsScreen.create.target')}
                    value={targetText}
                    onChangeText={setTargetText}
                    keyboardType="decimal-pad"
                    placeholder="0"
                    currency={currency}
                  />
                </>
              ) : (
                <>
                  {availableDebts.length > 0 ? (
                    <View style={{ marginBottom: 16 }}>
                      <Text style={{ ...T.fieldLabel, marginBottom: 8 }}>
                        {t('dashboard.goalsScreen.create.existingDebts')}
                      </Text>
                      {availableDebts.map(({ debt, index, debtId }) => (
                        <DebtSelectRow
                          key={debtId}
                          label={resolveDebtEntryLabel(debt, t)}
                          balance={Number(debt.balance) || 0}
                          currency={currency}
                          selected={selectedDebtId === debtId}
                          onPress={() => {
                            setSelectedDebtId(debtId);
                            setDebtName('');
                            setDebtBalanceText('');
                            setDebtMinPaymentText('');
                            setError('');
                          }}
                        />
                      ))}
                    </View>
                  ) : null}

                  <Text style={{ ...T.fieldLabel, marginBottom: 8 }}>
                    {availableDebts.length > 0
                      ? t('dashboard.goalsScreen.create.addNewDebt')
                      : t('dashboard.goalsScreen.create.debtDetails')}
                  </Text>
                  <FormInput
                    label={t('dashboard.goalsScreen.create.debtName')}
                    value={debtName}
                    onChangeText={(text) => {
                      clearDebtSelection();
                      setDebtName(text);
                      setError('');
                    }}
                    placeholder={t('dashboard.goalsScreen.create.debtNamePlaceholder')}
                  />
                  <FormInput
                    label={t('dashboard.goalsScreen.create.debtBalance')}
                    value={debtBalanceText}
                    onChangeText={(text) => {
                      clearDebtSelection();
                      setDebtBalanceText(text);
                      setError('');
                    }}
                    placeholder="0"
                    numeric
                    currency={currency}
                  />
                  <FormInput
                    label={t('dashboard.goalsScreen.create.debtMinPayment')}
                    value={debtMinPaymentText}
                    onChangeText={(text) => {
                      clearDebtSelection();
                      setDebtMinPaymentText(text);
                      setError('');
                    }}
                    placeholder="0"
                    numeric
                    currency={currency}
                    helperText={t('dashboard.goalsScreen.create.debtMinPaymentHelper')}
                  />
                </>
              )}

              {error && deadlineMode !== 'set' ? (
                <Text style={{ ...T.caption, color: C.danger, marginBottom: 12 }}>{error}</Text>
              ) : null}
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
                <View style={{ flex: 1 }}>
                  <OutlineButton onPress={onClose} disabled={saving}>
                    {t('common.cancel')}
                  </OutlineButton>
                </View>
                <View style={{ flex: 1 }}>
                  <PrimaryButton onPress={handleSave} disabled={saving}>
                    {t('common.save')}
                  </PrimaryButton>
                </View>
              </View>
            </ScrollView>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
