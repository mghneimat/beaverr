import { useState, useCallback, useEffect } from 'react';
import { View, Modal, Pressable, Platform, ScrollView } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useI18n } from '../../../lib/i18n';
import { createCycleAdjustment } from '../../../lib/cycleAdjustments';
import { parseAmount } from '../../../lib/sectionEditStorage';
import { isoDateKey } from '../../../lib/dailyLog';
import { storedDateToIso, isoToStoredDate } from '../../../lib/cycleDates';
import { notifyDashboardRefresh } from '../../../lib/dashboardRefresh';
import { emitDashboardToast } from '../../../lib/dashboardToast';
import { C, R, T } from '../../../constants/onboarding-theme';
import FormInput from '../../ui/FormInput';
import PrimaryButton from '../../ui/PrimaryButton';
import PillToggle from '../../onboarding/PillToggle';
import OutlineButton from '../../ui/OutlineButton';
import SplitDateFields from '../../onboarding/SplitDateFields';

const TIMING_OPTIONS = ['immediate', 'scheduled', 'next_cycle'];
const FUNDING_OPTIONS = ['cycleBudget', 'elsewhere'];

export default function CycleAdjustmentSheet({
  visible,
  onClose,
  cycleId,
  currency,
  defaultKind = 'expense',
}) {
  const { t } = useI18n();
  const today = isoDateKey();
  const [kind, setKind] = useState(defaultKind);
  const [label, setLabel] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [timing, setTiming] = useState('immediate');
  const [paymentDate, setPaymentDate] = useState('');
  const [funding, setFunding] = useState('cycleBudget');
  const [saving, setSaving] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setKind(defaultKind);
    setPaymentDate(isoToStoredDate(today));
  }, [visible, today, defaultKind]);

  const handleDateElevatedChange = useCallback((open) => {
    setDateDropdownOpen(open);
  }, []);

  const resetForm = () => {
    setKind(defaultKind);
    setLabel('');
    setInputValue('');
    setTiming('immediate');
    setFunding('cycleBudget');
    setPaymentDate(isoToStoredDate(today));
    setErrorText('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const showPaymentDate = timing === 'scheduled' || timing === 'immediate';
  const showFunding = kind === 'expense' && timing !== 'next_cycle';

  const handleSave = async () => {
    const amount = parseAmount(inputValue);
    if (!label.trim()) {
      setErrorText(t('dashboard.cycles.oneOffs.sheet.validationLabel'));
      return;
    }
    if (amount == null || amount <= 0) {
      setErrorText(t('dashboard.cycles.oneOffs.sheet.validationAmount'));
      return;
    }

    let paymentDateIso = null;
    if (timing === 'immediate') {
      paymentDateIso = today;
    } else if (timing === 'scheduled') {
      paymentDateIso = storedDateToIso(paymentDate);
      if (!paymentDateIso) {
        setErrorText(t('dashboard.cycles.oneOffs.sheet.validationDate'));
        return;
      }
    }

    setSaving(true);
    setErrorText('');
    try {
      await createCycleAdjustment({
        cycleId,
        kind,
        amount,
        label: label.trim(),
        timing,
        paymentDate: paymentDateIso,
        funding: kind === 'expense' ? funding : 'cycleBudget',
      });
      notifyDashboardRefresh();
      emitDashboardToast('adjustmentSaved');
      handleClose();
    } catch {
      setErrorText(t('dashboard.cycles.oneOffs.sheet.saveError'));
    } finally {
      setSaving(false);
    }
  };

  if (!cycleId) return null;

  const dateSectionStyle = dateDropdownOpen
    ? {
        zIndex: 200,
        elevation: 12,
        overflow: 'visible',
        ...(Platform.OS === 'web' ? { position: 'relative' } : null),
      }
    : { overflow: 'visible' };

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
          accessibilityLabel={t('dashboard.cycles.oneOffs.sheet.closeA11y')}
        />
        <ScrollView
          style={{ width: '100%', maxWidth: 440, maxHeight: '90%' }}
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
          keyboardShouldPersistTaps="handled"
        >
          <View
            style={{
              width: '100%',
              backgroundColor: C.surface,
              borderRadius: R.card,
              borderWidth: 1,
              borderColor: C.border,
              padding: 20,
              overflow: 'visible',
              ...(Platform.OS === 'web' ? { cursor: 'default' } : {}),
            }}
          >
            <Text style={{ ...T.cardTitle, marginBottom: 4 }}>
              {kind === 'income'
                ? t('dashboard.cycles.oneOffs.sheet.titleIncome')
                : t('dashboard.cycles.oneOffs.sheet.titleExpense')}
            </Text>
            <Text style={{ ...T.caption, color: C.muted, marginBottom: 16 }}>
              {kind === 'income'
                ? t('dashboard.cycles.oneOffs.sheet.helperIncome')
                : t('dashboard.cycles.oneOffs.sheet.helperExpense')}
            </Text>

            <FormInput
              label={kind === 'income'
                ? t('dashboard.cycles.oneOffs.sheet.incomeSource')
                : t('dashboard.cycles.oneOffs.sheet.expenseLabel')}
              value={label}
              onChangeText={(text) => {
                setLabel(text);
                setErrorText('');
              }}
              placeholder={kind === 'income'
                ? t('dashboard.cycles.oneOffs.sheet.incomePlaceholder')
                : t('dashboard.cycles.oneOffs.sheet.expensePlaceholder')}
              autoCapitalize="sentences"
            />

            <FormInput
              label={t('dashboard.cycles.oneOffs.sheet.amountLabel')}
              value={inputValue}
              onChangeText={(text) => {
                setInputValue(text);
                setErrorText('');
              }}
              placeholder={t('dashboard.cycles.oneOffs.sheet.amountPlaceholder')}
              numeric
              currency={currency}
              disabled={saving}
              accessibilityLabel={t('dashboard.cycles.oneOffs.sheet.amountA11y')}
              containerStyle={{ marginBottom: 12 }}
            />

            <Text style={{ ...T.fieldLabel, marginBottom: 8 }}>
              {t('dashboard.cycles.oneOffs.sheet.timingLabel')}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {TIMING_OPTIONS.map((opt) => (
                <PillToggle
                  key={opt}
                  label={t(`dashboard.cycles.oneOffs.timing.${opt}`)}
                  selected={timing === opt}
                  onPress={() => setTiming(opt)}
                  paddingVertical={10}
                  paddingHorizontal={14}
                  fontSize={13}
                />
              ))}
            </View>

            {showPaymentDate && timing === 'scheduled' ? (
              <View style={[dateSectionStyle, { marginBottom: 16 }]}>
                <Text style={{ ...T.fieldLabel, marginBottom: 8 }}>
                  {t('dashboard.cycles.oneOffs.sheet.paymentDate')}
                </Text>
                <SplitDateFields
                  value={paymentDate}
                  onChange={setPaymentDate}
                  yearPast={0}
                  yearFuture={1}
                  onElevatedChange={handleDateElevatedChange}
                />
              </View>
            ) : null}

            {showFunding ? (
              <>
                <Text style={{ ...T.fieldLabel, marginBottom: 8 }}>
                  {t('dashboard.cycles.oneOffs.sheet.fundingLabel')}
                </Text>
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                  {FUNDING_OPTIONS.map((opt) => (
                    <PillToggle
                      key={opt}
                      label={t(`dashboard.cycles.oneOffs.funding.${opt}`)}
                      selected={funding === opt}
                      onPress={() => setFunding(opt)}
                      paddingVertical={10}
                      paddingHorizontal={12}
                      fontSize={13}
                    />
                  ))}
                </View>
              </>
            ) : null}

            {errorText ? (
              <Text style={{ ...T.caption, color: C.danger, marginBottom: 8 }}>{errorText}</Text>
            ) : null}

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
              <OutlineButton onPress={handleClose} style={{ flex: 1 }} disabled={saving} destructive>
                {t('common.cancel')}
              </OutlineButton>
              <PrimaryButton onPress={handleSave} disabled={saving} style={{ flex: 1 }}>
                {saving
                  ? t('dashboard.cycles.oneOffs.sheet.saving')
                  : t('dashboard.cycles.oneOffs.sheet.save')}
              </PrimaryButton>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}
