import { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, Pressable, Modal, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useI18n } from '../../lib/i18n';
import { getData, setData } from '../../lib/storage';
import { C, S, T, R } from '../../constants/onboarding-theme';
import QuestionScreen from '../../components/onboarding/QuestionScreen';
import PlaceholderIllustration from '../../components/onboarding/PlaceholderIllustration';
import PillToggle from '../../components/onboarding/PillToggle';
import DatePicker from '../../components/onboarding/DatePicker';
import AnimatedSlideIn from '../../components/onboarding/AnimatedSlideIn';
import RemoveButton from '../../components/onboarding/RemoveButton';
import LabeledInput from '../../components/onboarding/LabeledInput';
import YesNoToggle from '../../components/onboarding/YesNoToggle';
import AddAnotherButton from '../../components/onboarding/AddAnotherButton';

const DEBT_TYPES = ['creditCard', 'personalLoan', 'carLoan', 'studentLoan', 'medical', 'family', 'bnpl', 'other'];

/** Day-of-month dropdown (1–31) matching the DatePicker Dropdown style. */
function DayPicker({ value, onChange, placeholder }) {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const triggerRef = useRef(null);
  const [triggerLayout, setTriggerLayout] = useState(null);

  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const displayValue = value ? String(value) : '';

  const handleOpen = () => {
    if (triggerRef.current) {
      triggerRef.current.measureInWindow((x, y, width, height) => {
        setTriggerLayout({ x, y, width, height });
        setOpen(true);
      });
    }
  };

  return (
    <View>
      <Pressable
        ref={triggerRef}
        onPress={handleOpen}
        onHoverIn={() => setHovered(true)}
        onHoverOut={() => setHovered(false)}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        style={{
          paddingVertical: 12,
          paddingHorizontal: 12,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: C.border,
          backgroundColor: hovered ? C.bg : pressed ? C.addPressed : C.surface,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: 44,
        }}
      >
        <Text style={{
          fontSize: 14,
          color: displayValue ? C.text : C.placeholder,
          fontWeight: displayValue ? '500' : '400',
        }}>
          {displayValue || placeholder}
        </Text>
        <Text style={{ fontSize: 10, color: C.muted, marginLeft: 4 }}>▼</Text>
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="none"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={{ flex: 1 }} onPress={() => setOpen(false)}>
          {triggerLayout && (
            <View
              style={{
                position: 'absolute',
                top: triggerLayout.y + triggerLayout.height + 2,
                left: triggerLayout.x,
                width: triggerLayout.width,
                backgroundColor: C.surface,
                borderRadius: 12,
                maxHeight: 200,
                overflow: 'hidden',
                borderWidth: 1,
                borderColor: C.border,
                elevation: 8,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 8,
              }}
            >
              <ScrollView style={{ maxHeight: 200 }} bounces={false} keyboardShouldPersistTaps="handled">
                {days.map((day) => {
                  const isSelected = String(day) === String(value);
                  return (
                    <Pressable
                      key={day}
                      onPress={() => { onChange(String(day)); setOpen(false); }}
                      style={({ pressed: btnPressed }) => ({
                        paddingVertical: 12,
                        paddingHorizontal: 16,
                        backgroundColor: isSelected
                          ? C.chipSelectedBg
                          : btnPressed
                            ? C.bg
                            : 'transparent',
                        borderBottomWidth: 1,
                        borderBottomColor: C.border,
                      })}
                    >
                      <Text style={{
                        fontSize: 14,
                        color: isSelected ? C.primary : C.text,
                        fontWeight: isSelected ? '600' : '400',
                      }}>
                        {day}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </Pressable>
      </Modal>
    </View>
  );
}

export default function DebtsScreen() {
  const { t } = useI18n();
  const router = useRouter();

  // ── Loaded data ──
  const [currency, setCurrency] = useState('Kč');

  const [step, setStep] = useState('q13');
  const [validationError, setValidationError] = useState('');

  // Q13 — Has debts
  const [hasDebts, setHasDebts] = useState(null);

  // Q13a — Debt details
  const [debts, setDebts] = useState([]);
  const [visibleDebts, setVisibleDebts] = useState({});

  // ── Load currency from location data ──
  useEffect(() => {
    (async () => {
      const loc = await getData('pocketos_location');
      if (loc?.currency) setCurrency(loc.currency);
    })();
  }, []);

  const handleContinue = async () => {
    setValidationError('');

    if (step === 'q13') {
      if (hasDebts === null) {
        setValidationError(t('onboarding.debts.q13.validation'));
        return;
      }
      if (hasDebts) {
        if (debts.length === 0) addDebt();
        setStep('q13a');
      } else {
        await setData('pocketos_debts', []);
        await setData('pocketos_onboarding', {
          completed: false,
          currentStep: 'debts',
          percentComplete: 90,
        });
        router.replace('/(onboarding)/splash-budget');
      }
      return;
    }

    if (step === 'q13a') {
      for (let i = 0; i < debts.length; i++) {
        if (!debts[i].balance || !debts[i].minPayment) {
          setValidationError(t('onboarding.debts.q13a.validation'));
          return;
        }
      }

      await setData('pocketos_debts', debts);
      await setData('pocketos_onboarding', {
        completed: false,
        currentStep: 'debts',
        percentComplete: 90,
      });
      router.replace('/(onboarding)/splash-budget');
      return;
    }
  };

  const handleBack = () => {
    setValidationError('');
    if (step === 'q13a') { setStep('q13'); return; }
    // On the first question — navigate back to the debts splash screen
    router.replace('/(onboarding)/splash-debts');
  };

  const addDebt = () => {
    const newIdx = debts.length;
    setDebts([...debts, {
      type: null,
      balance: '',
      minPayment: '',
      apr: '',
      promoEndDate: '',
      paymentDueDay: '',
      notes: '',
    }]);
    // Start hidden, then animate in on next tick
    setVisibleDebts(prev => ({ ...prev, [newIdx]: false }));
    setTimeout(() => {
      setVisibleDebts(prev => ({ ...prev, [newIdx]: true }));
    }, 50);
  };

  const updateDebt = (idx, updates) => {
    const updated = [...debts];
    updated[idx] = { ...updated[idx], ...updates };
    setDebts(updated);
  };

  const removeDebt = (idx) => {
    // Animate out first, then remove after animation
    setVisibleDebts(prev => ({ ...prev, [idx]: false }));
    setTimeout(() => {
      setDebts(prev => prev.filter((_, i) => i !== idx));
    }, 300);
  };

  const progress = 90;
  const progressLabel = t('onboarding.progress', { percent: progress });

  const renderQ13 = () => (
    <View>
      <Text style={{ ...T.helper, color: C.muted, marginBottom: 16 }}>
        {t('onboarding.debts.q13.helper')}
      </Text>
      <YesNoToggle
        value={hasDebts}
        onChange={(val) => { setHasDebts(val); setValidationError(''); }}
        yesLabel={t('onboarding.debts.q13.yes')}
        noLabel={t('onboarding.debts.q13.no')}
      />
    </View>
  );

  const renderDebtForm = (debt, idx) => (
    <AnimatedSlideIn key={idx} visible={visibleDebts[idx] !== false}>
      <View style={{ marginBottom: 20, padding: 16, backgroundColor: C.surface, borderRadius: 12, borderWidth: 1, borderColor: C.border }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <Text style={{ fontSize: 15, fontWeight: '600', color: C.primary }}>
            {t('onboarding.debts.q13a.debtLabel', { n: idx + 1 })}
          </Text>
          {debts.length > 1 && (
            <RemoveButton onPress={() => removeDebt(idx)} />
          )}
        </View>

        {/* Debt type pills */}
        <Text style={{ ...T.fieldLabel, color: C.muted, marginBottom: 8 }}>
          {t('onboarding.debts.q13a.typeLabel')}
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {DEBT_TYPES.map(type => (
            <Pressable
              key={type}
              onPress={() => updateDebt(idx, { type })}
              style={{
                paddingVertical: 8,
                paddingHorizontal: 14,
                borderRadius: 8,
                backgroundColor: debt.type === type ? C.chipSelectedBg : C.bg,
                borderWidth: 1,
                borderColor: debt.type === type ? C.primary : C.border,
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: '500', color: debt.type === type ? C.primary : C.muted }}>
                {t(`onboarding.debts.q13a.${type}`)}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Balance */}
        <LabeledInput
          label={t('onboarding.debts.q13a.balanceLabel')}
          value={debt.balance}
          onChangeText={(v) => updateDebt(idx, { balance: v })}
          numeric
          placeholder={t('onboarding.debts.q13a.balancePlaceholder')}
          large
          currency={currency}
        />

        {/* Min payment */}
        <LabeledInput
          label={t('onboarding.debts.q13a.minPaymentLabel')}
          value={debt.minPayment}
          onChangeText={(v) => updateDebt(idx, { minPayment: v })}
          numeric
          placeholder={t('onboarding.debts.q13a.minPaymentPlaceholder')}
          large
          currency={currency}
        />
        <Text style={{ ...T.caption, color: C.muted, marginTop: -8, marginBottom: 12 }}>
          {t('onboarding.debts.q13a.minPaymentHelper')}
        </Text>

        {/* APR */}
        <LabeledInput
          label={t('onboarding.debts.q13a.aprLabel')}
          value={debt.apr}
          onChangeText={(v) => updateDebt(idx, { apr: v })}
          numeric
          placeholder={t('onboarding.debts.q13a.aprPlaceholder')}
        />
        <Text style={{ ...T.caption, color: C.muted, marginTop: -4, marginBottom: 8 }}>
          {t('onboarding.debts.q13a.aprHelper')}
        </Text>

        {/* High APR flag */}
        {parseFloat(debt.apr) > 20 && (
          <View style={{ padding: 10, backgroundColor: C.dangerBg, borderRadius: 8, borderWidth: 1, borderColor: C.dangerBorder, marginBottom: 8 }}>
            <Text style={{ fontSize: 13, color: '#991B1B', lineHeight: 20 }}>
              {t('onboarding.debts.q13a.highAprWarning')}
            </Text>
          </View>
        )}

        {/* Promo end date (if APR = 0) */}
        {parseFloat(debt.apr) === 0 && (
          <View style={{ marginBottom: 8 }}>
            <Text style={{ ...T.fieldLabel, color: C.muted, marginBottom: S.labelGap }}>
              {t('onboarding.debts.q13a.promoEndLabel')}
            </Text>
            <DatePicker
              value={debt.promoEndDate}
              onChange={(v) => updateDebt(idx, { promoEndDate: v })}
              showDay={false}
            />
          </View>
        )}

        {/* Payment due day */}
        <Text style={{ ...T.fieldLabel, color: C.muted, marginBottom: S.labelGap }}>
          {t('onboarding.debts.q13a.dueDayLabel')}
        </Text>
        <DayPicker
          value={debt.paymentDueDay}
          onChange={(v) => updateDebt(idx, { paymentDueDay: v })}
          placeholder={t('onboarding.debts.q13a.dueDayPlaceholder')}
        />

        {/* Notes */}
        <LabeledInput
          label={t('onboarding.debts.q13a.notesLabel')}
          value={debt.notes}
          onChangeText={(v) => updateDebt(idx, { notes: v })}
          placeholder={t('onboarding.debts.q13a.notesPlaceholder')}
          multiline
        />
      </View>
    </AnimatedSlideIn>
  );

  const renderQ13a = () => (
    <View>
      <Text style={{ ...T.helper, color: C.muted, marginBottom: 16 }}>
        {t('onboarding.debts.q13a.helper')}
      </Text>
      {debts.map((debt, idx) => renderDebtForm(debt, idx))}
      <AddAnotherButton
        label={t('onboarding.debts.q13a.addDebt')}
        onPress={addDebt}
      />
    </View>
  );

  const stepTitles = {
    q13: t('onboarding.debts.q13.title'),
    q13a: t('onboarding.debts.q13a.title'),
  };

  return (
    <QuestionScreen
      chapter={t('onboarding.debts.chapter')}
      title={stepTitles[step]}
      illustration={<PlaceholderIllustration />}
      onContinue={handleContinue}
      onBack={handleBack}
      validationError={validationError}
      progress={progress}
      progressLabel={progressLabel}
      animationKey={step}
    >
      {step === 'q13' && renderQ13()}
      {step === 'q13a' && renderQ13a()}
    </QuestionScreen>
  );
}
