import { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import OnboardingPressable from '../../components/onboarding/OnboardingPressable';
import { listRowBg, chipBg } from '../../components/onboarding/pressableFeedback';
import { useRouter } from 'expo-router';
import { useI18n } from '../../lib/i18n';
import { navigateBack, navigateForward } from '../../lib/onboardingNavigation';
import { useOnboardingLayout } from '../../lib/onboardingLayout';
import MoneyStressPanaIllustration from '../../components/onboarding/MoneyStressPanaIllustration';
import { getData, setData } from '../../lib/storage';
import { getCurrencySymbol } from '../../lib/currency';
import { C, S, T, R } from '../../constants/onboarding-theme';
import QuestionScreen from '../../components/onboarding/QuestionScreen';
import PillToggle from '../../components/onboarding/PillToggle';
import SplitDateFields from '../../components/onboarding/SplitDateFields';
import AnimatedSlideIn from '../../components/onboarding/AnimatedSlideIn';
import DeleteTextButton from '../../components/onboarding/DeleteTextButton';
import LabeledInput from '../../components/onboarding/LabeledInput';
import YesNoToggle from '../../components/onboarding/YesNoToggle';
import AddAnotherButton from '../../components/onboarding/AddAnotherButton';
import InputGroup from '../../components/onboarding/InputGroup';
import ScrollFocusAnchor from '../../components/onboarding/ScrollFocusAnchor';
import DayOfMonthPicker from '../../components/onboarding/DayOfMonthPicker';
import { useSectionExit } from '../../lib/finishOnboardingSection';

const DEBT_TYPES = ['creditCard', 'personalLoan', 'carLoan', 'studentLoan', 'medical', 'family', 'bnpl', 'other'];

export default function DebtsScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const layout = useOnboardingLayout();
  const { isEditMode, completeSection, leaveSection, editContinueLabel } = useSectionExit();

  // ── Loaded data ──
  const [currencyCode, setCurrencyCode] = useState('CZK');
  const currency = getCurrencySymbol(currencyCode);

  const [step, setStep] = useState('hasDebts');
  const [validationError, setValidationError] = useState('');

  // hasDebts — Has debts
  const [hasDebts, setHasDebts] = useState(false);

  // debtDetails — Debt details
  const [debts, setDebts] = useState([]);
  const [visibleDebts, setVisibleDebts] = useState({});
  const [focusToken, setFocusToken] = useState(null);

  // ── Load currency from location data ──
  useEffect(() => {
    (async () => {
      const loc = await getData('beaverr_location');
      if (loc?.currency) setCurrencyCode(loc.currency);
    })();
  }, []);

  const persistDebts = async () => {
    const data = hasDebts === false ? [] : debts;
    await completeSection({
      persist: async () => { await setData('beaverr_debts', data); },
      onboardingPatch: { completed: false, currentStep: 'debts', percentComplete: 90 },
      nextRoute: '/(onboarding)/splash-budget',
      routeName: 'debts',
    });
  };

  const handleContinue = async () => {
    setValidationError('');

    if (isEditMode) {
      await persistDebts();
      return;
    }

    if (step === 'hasDebts') {
      if (hasDebts) {
        if (debts.length === 0) addDebt();
        setStep('debtDetails');
      } else {
        await completeSection({
          persist: async () => { await setData('beaverr_debts', []); },
          onboardingPatch: { completed: false, currentStep: 'debts', percentComplete: 90 },
          nextRoute: '/(onboarding)/splash-budget',
          routeName: 'debts',
        });
      }
      return;
    }

    if (step === 'debtDetails') {
      for (let i = 0; i < debts.length; i++) {
        if (!debts[i].balance || !debts[i].minPayment) {
          setValidationError(t('onboarding.debts.debtDetails.validation'));
          return;
        }
      }

      await completeSection({
        persist: async () => { await setData('beaverr_debts', debts); },
        onboardingPatch: { completed: false, currentStep: 'debts', percentComplete: 90 },
        nextRoute: '/(onboarding)/splash-budget',
        routeName: 'debts',
      });
      return;
    }
  };

  const handleBack = () => {
    setValidationError('');
    if (step === 'debtDetails') { setStep('hasDebts'); return; }
    leaveSection(() => navigateBack());
  };

  const addDebt = () => {
    const newIdx = debts.length;
    const id = `debt_${Date.now()}`;
    setDebts([...debts, {
      id,
      type: null,
      balance: '',
      minPayment: '',
      apr: '',
      promoEndDate: '',
      paymentDueDay: '',
      notes: '',
    }]);
    setFocusToken(id);
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
  const screenProgress = isEditMode ? undefined : progress;

  const renderHasDebts = () => (
    <View>
      <Text style={{ ...T.helper, color: C.muted, marginBottom: 16 }}>
        {t('onboarding.debts.hasDebts.helper')}
      </Text>
      <YesNoToggle
        value={hasDebts}
        onChange={(val) => { setHasDebts(val); setValidationError(''); }}
        yesLabel={t('onboarding.debts.hasDebts.yes')}
        noLabel={t('onboarding.debts.hasDebts.no')}
      />
    </View>
  );

  const renderDebtForm = (debt, idx) => (
    <ScrollFocusAnchor key={debt.id || idx} focusId={debt.id || String(idx)} focusToken={focusToken}>
    <AnimatedSlideIn visible={visibleDebts[idx] !== false}>
      <View style={{ marginBottom: 20, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24, backgroundColor: C.surface, borderRadius: 12, borderWidth: 1, borderColor: C.border }}>
        <View style={{ marginBottom: 14 }}>
          <Text style={{ fontSize: 15, fontWeight: '600', color: C.primary }}>
            {t('onboarding.debts.debtDetails.debtLabel', { n: idx + 1 })}
          </Text>
        </View>

        {/* Debt type pills */}
        <Text style={{ ...T.fieldLabel, color: C.muted, marginBottom: 8 }}>
          {t('onboarding.debts.debtDetails.typeLabel')}
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {DEBT_TYPES.map(type => (
            <OnboardingPressable
              key={type}
              onPress={() => updateDebt(idx, { type })}
              style={({ pressed, hovered }) => ({
                paddingVertical: 10,
                paddingHorizontal: 16,
                borderRadius: R.pill,
                backgroundColor: chipBg({ pressed, hovered, active: debt.type === type, activeBg: C.pillSelectedBg }),
                borderWidth: debt.type === type ? 0 : 1,
                borderColor: C.pillUnselectedBorder,
              })}
            >
              <Text style={{
                fontSize: 13,
                fontWeight: debt.type === type ? '600' : '500',
                color: debt.type === type ? C.pillSelectedText : C.pillUnselectedText,
              }}>
                {t(`onboarding.debts.debtDetails.${type}`)}
              </Text>
            </OnboardingPressable>
          ))}
        </View>

        <InputGroup label={t('onboarding.debts.debtDetails.balanceLabel')}>
          <LabeledInput
            value={debt.balance}
            onChangeText={(v) => updateDebt(idx, { balance: v })}
            numeric
            placeholder={t('onboarding.debts.debtDetails.balancePlaceholder')}
            large
            inGroup
            currency={currency}
          />
        </InputGroup>

        <InputGroup label={t('onboarding.debts.debtDetails.minPaymentLabel')}>
          <LabeledInput
            value={debt.minPayment}
            onChangeText={(v) => updateDebt(idx, { minPayment: v })}
            numeric
            placeholder={t('onboarding.debts.debtDetails.minPaymentPlaceholder')}
            large
            inGroup
            currency={currency}
          />
        </InputGroup>
        <Text style={{ ...T.caption, color: C.muted, marginTop: -8, marginBottom: 12 }}>
          {t('onboarding.debts.debtDetails.minPaymentHelper')}
        </Text>

        {/* APR */}
        <LabeledInput
          label={t('onboarding.debts.debtDetails.aprLabel')}
          value={debt.apr}
          onChangeText={(v) => updateDebt(idx, { apr: v })}
          numeric
          placeholder={t('onboarding.debts.debtDetails.aprPlaceholder')}
        />
        <Text style={{ ...T.caption, color: C.muted, marginTop: -4, marginBottom: 8 }}>
          {t('onboarding.debts.debtDetails.aprHelper')}
        </Text>

        {/* High APR flag */}
        {parseFloat(debt.apr) > 20 && (
          <View style={{ padding: 10, backgroundColor: C.dangerBg, borderRadius: 8, borderWidth: 1, borderColor: C.dangerBorder, marginBottom: 8 }}>
            <Text style={{ fontSize: 13, color: '#991B1B', lineHeight: 20 }}>
              {t('onboarding.debts.debtDetails.highAprWarning')}
            </Text>
          </View>
        )}

        {/* Promo end date (if APR = 0) */}
        {parseFloat(debt.apr) === 0 && (
          <View style={{ marginBottom: 8 }}>
            <Text style={{ ...T.fieldLabel, color: C.muted, marginBottom: S.labelGap }}>
              {t('onboarding.debts.debtDetails.promoEndLabel')}
            </Text>
            <SplitDateFields
              value={debt.promoEndDate}
              onChange={(v) => updateDebt(idx, { promoEndDate: v })}
              showDay={false}
            />
          </View>
        )}

        {/* Payment due day */}
        <Text style={{ ...T.fieldLabel, color: C.muted, marginBottom: S.labelGap }}>
          {t('onboarding.debts.debtDetails.dueDayLabel')}
        </Text>
        <DayOfMonthPicker
          value={debt.paymentDueDay}
          onChange={(v) => updateDebt(idx, { paymentDueDay: v })}
          placeholder={t('onboarding.debts.debtDetails.dueDayPlaceholder')}
          style={{ marginBottom: 0 }}
        />

        {/* Notes */}
        <LabeledInput
          label={t('onboarding.debts.debtDetails.notesLabel')}
          value={debt.notes}
          onChangeText={(v) => updateDebt(idx, { notes: v })}
          placeholder={t('onboarding.debts.debtDetails.notesPlaceholder')}
          multiline
          containerStyle={{ marginTop: 16 }}
        />

        {debts.length > 1 ? (
          <DeleteTextButton onPress={() => removeDebt(idx)} />
        ) : null}
      </View>
    </AnimatedSlideIn>
    </ScrollFocusAnchor>
  );

  const renderDebtDetails = () => (
    <View>
      <Text style={{ ...T.helper, color: C.muted, marginBottom: 16 }}>
        {t('onboarding.debts.debtDetails.helper')}
      </Text>
      {debts.map((debt, idx) => renderDebtForm(debt, idx))}
      <AddAnotherButton onPress={addDebt} />
    </View>
  );

  const stepTitles = {
    hasDebts: t('onboarding.debts.hasDebts.title'),
    debtDetails: t('onboarding.debts.debtDetails.title'),
  };

  return (
    <QuestionScreen
      illustration={<MoneyStressPanaIllustration width={layout.illustrationWidth} />}
      chapter={t('onboarding.debts.chapter')}
      title={stepTitles[step]}
      onContinue={handleContinue}
      onBack={handleBack}
      validationError={validationError}
        setValidationError={setValidationError}
      continueLabel={editContinueLabel}
      animationKey={step}
    >
      {step === 'hasDebts' && renderHasDebts()}
      {step === 'debtDetails' && renderDebtDetails()}
    </QuestionScreen>
  );
}
