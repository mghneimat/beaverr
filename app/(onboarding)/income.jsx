import { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useI18n } from '../../lib/i18n';
import { getData, setData } from '../../lib/storage';
import { toMonthly, formatCurrency } from '../../lib/finance';
import { C, S, T, R } from '../../constants/onboarding-theme';
import QuestionScreen from '../../components/onboarding/QuestionScreen';
import PlaceholderIllustration from '../../components/onboarding/PlaceholderIllustration';
import PillToggle from '../../components/onboarding/PillToggle';
import DatePicker from '../../components/onboarding/DatePicker';
import AnimatedSlideIn from '../../components/onboarding/AnimatedSlideIn';
import AnimatedRow from '../../components/onboarding/AnimatedRow';
import RemoveButton from '../../components/onboarding/RemoveButton';
import LabeledInput from '../../components/onboarding/LabeledInput';
import YesNoToggle from '../../components/onboarding/YesNoToggle';
import FrequencyPills from '../../components/onboarding/FrequencyPills';
import AddAnotherButton from '../../components/onboarding/AddAnotherButton';

const FREQUENCIES = ['daily', 'weekly', 'fortnightly', 'monthly'];

/**
 * Q5 — Your income (title adapts by occupation)
 * Q5a — Partner's income (partner branch only)
 * Q5b — Other income sources (toggle + repeating rows)
 * Q5c — Savings (balance + monthly target)
 * Q5d — Financial goal (toggle + description + amount + date)
 */
export default function IncomeScreen() {
  const { t } = useI18n();
  const router = useRouter();

  // ── Loaded data ──
  const [occupation, setOccupation] = useState(null);
  const [hasPartner, setHasPartner] = useState(false);
  const [partnerName, setPartnerName] = useState('');
  const [currency, setCurrency] = useState('Kč');

  // ── Step tracking ──
  const [step, setStep] = useState('q5'); // q5 | q5a | q5b | q5c | q5d

  // ── Q5: Your income ──
  const [incomeAmount, setIncomeAmount] = useState('');
  const [incomeFrequency, setIncomeFrequency] = useState('monthly');

  // ── Q5a: Partner income ──
  const [partnerIncomeAmount, setPartnerIncomeAmount] = useState('');
  const [partnerIncomeFrequency, setPartnerIncomeFrequency] = useState('monthly');

  // ── Q5b: Other income ──
  const [hasOtherIncome, setHasOtherIncome] = useState(null); // null | true | false
  const [otherIncomeRows, setOtherIncomeRows] = useState([
    { id: 0, amount: '', frequency: 'monthly', label: '', visible: true },
  ]);
  const nextRowId = useRef(1);

  // ── Q5c: Savings ──
  const [savingsBalance, setSavingsBalance] = useState('');
  const [savingsMonthlyTarget, setSavingsMonthlyTarget] = useState('');

  // ── Q5d: Financial goal ──
  const [hasGoal, setHasGoal] = useState(null); // null | true | false
  const [goalDescription, setGoalDescription] = useState('');
  const [goalAmount, setGoalAmount] = useState('');
  const [goalDate, setGoalDate] = useState('');

  // ── Validation ──
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    async function loadData() {
      const occ = await getData('pocketos_occupation');
      if (occ) setOccupation(occ);

      const loc = await getData('pocketos_location');
      if (loc?.currency) setCurrency(loc.currency);

      const household = await getData('pocketos_household');
      if (household?.type === 'partner' && household?.partnerName) {
        setHasPartner(true);
        setPartnerName(household.partnerName);
      }

      const saved = await getData('pocketos_income');
      if (saved) {
        if (saved.amount) setIncomeAmount(String(saved.amount));
        if (saved.frequency) setIncomeFrequency(saved.frequency);
        if (saved.partnerAmount) setPartnerIncomeAmount(String(saved.partnerAmount));
        if (saved.partnerFrequency) setPartnerIncomeFrequency(saved.partnerFrequency);
        if (saved.hasOtherIncome !== undefined) setHasOtherIncome(saved.hasOtherIncome);
        if (saved.otherIncomeRows) {
          // Restore rows with id and visible fields for animation support
          const restored = saved.otherIncomeRows.map((r, i) => ({
            id: i,
            amount: r.amount != null ? String(r.amount) : '',
            frequency: r.frequency || 'monthly',
            label: r.label || '',
            visible: true,
          }));
          setOtherIncomeRows(restored);
          nextRowId.current = restored.length;
        }
        if (saved.savingsBalance) setSavingsBalance(String(saved.savingsBalance));
        if (saved.savingsMonthlyTarget) setSavingsMonthlyTarget(String(saved.savingsMonthlyTarget));
        if (saved.hasGoal !== undefined) setHasGoal(saved.hasGoal);
        if (saved.goalDescription) setGoalDescription(saved.goalDescription);
        if (saved.goalAmount) setGoalAmount(String(saved.goalAmount));
        if (saved.goalDate) setGoalDate(saved.goalDate);
      }
    }
    loadData();
  }, []);

  const occupationKey = occupation?.user || 'other';
  const isNotWorking = occupationKey === 'notWorking';
  const partnerOccKey = occupation?.partner;
  const partnerIsNotWorking = partnerOccKey === 'notWorking';

  const getTitleKey = (key) => {
    switch (key) {
      case 'employee': return 'titleEmployee';
      case 'selfEmployed': return 'titleSelfEmployed';
      case 'student': return 'titleStudent';
      case 'notWorking': return 'titleNotWorking';
      default: return 'titleOther';
    }
  };

  const getHelperKey = (key) => {
    switch (key) {
      case 'employee': return 'helperEmployee';
      case 'selfEmployed': return 'helperSelfEmployed';
      case 'student': return 'helperStudent';
      case 'notWorking': return 'helperNotWorking';
      default: return 'helperOther';
    }
  };

  const monthlyEquivalent = (amount, freq) => {
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) return null;
    const monthly = toMonthly(num, freq);
    return formatCurrency(monthly, currency);
  };

  const handleContinue = async () => {
    setValidationError('');

    if (step === 'q5') {
      if (!isNotWorking && !incomeAmount) {
        setValidationError(t('onboarding.income.q5.validation'));
        return;
      }
      if (hasPartner && !partnerIsNotWorking) {
        setStep('q5a');
      } else {
        setStep('q5b');
      }
    } else if (step === 'q5a') {
      if (!partnerIncomeAmount) {
        setValidationError(t('onboarding.income.q5a.validation', { name: partnerName }));
        return;
      }
      setStep('q5b');
    } else if (step === 'q5b') {
      setStep('q5c');
    } else if (step === 'q5c') {
      setStep('q5d');
    } else if (step === 'q5d') {
      if (hasGoal === true && !goalAmount) {
        setValidationError(t('onboarding.income.q5d.validation'));
        return;
      }
      await saveAll();
    }
  };

  const saveAll = async () => {
    const incomeData = {
      amount: incomeAmount ? parseFloat(incomeAmount) : null,
      frequency: incomeFrequency,
      partnerAmount: partnerIncomeAmount ? parseFloat(partnerIncomeAmount) : null,
      partnerFrequency: partnerIncomeFrequency,
      hasOtherIncome,
      otherIncomeRows: hasOtherIncome ? otherIncomeRows.map(r => ({
        amount: r.amount ? parseFloat(r.amount) : null,
        frequency: r.frequency,
        label: r.label,
      })) : [],
      savingsBalance: savingsBalance ? parseFloat(savingsBalance) : null,
      savingsMonthlyTarget: savingsMonthlyTarget ? parseFloat(savingsMonthlyTarget) : null,
      hasGoal,
      goalDescription: hasGoal ? goalDescription : null,
      goalAmount: hasGoal && goalAmount ? parseFloat(goalAmount) : null,
      goalDate: hasGoal ? goalDate : null,
    };

    await setData('pocketos_income', incomeData);

    await setData('pocketos_onboarding', {
      completed: false,
      currentStep: 'income',
      percentComplete: 55,
    });

    router.replace('/(onboarding)/splash-housing');
  };

  const handleBack = () => {
    setValidationError('');
    if (step === 'q5a') { setStep('q5'); return; }
    if (step === 'q5b') {
      if (hasPartner && !partnerIsNotWorking) { setStep('q5a'); return; }
      setStep('q5');
      return;
    }
    if (step === 'q5c') { setStep('q5b'); return; }
    if (step === 'q5d') { setStep('q5c'); return; }
    // On the first question — navigate back to the income splash screen
    router.replace('/(onboarding)/splash-income');
  };

  const addOtherRow = () => {
    const id = nextRowId.current++;
    setOtherIncomeRows([...otherIncomeRows, { id, amount: '', frequency: 'monthly', label: '', visible: true }]);
  };

  const updateOtherRow = (index, field, value) => {
    const rows = [...otherIncomeRows];
    rows[index] = { ...rows[index], [field]: value };
    setOtherIncomeRows(rows);
  };

  const removeOtherRow = (id) => {
    if (otherIncomeRows.length <= 1) return;
    // Mark row as invisible to trigger exit animation
    setOtherIncomeRows(otherIncomeRows.map(r =>
      r.id === id ? { ...r, visible: false } : r
    ));
  };

  const finalizeRemove = (id) => {
    setOtherIncomeRows((prev) => prev.filter(r => r.id !== id));
  };

  // ── Progress calculation ──
  const progressMap = { q5: 45, q5a: 48, q5b: 50, q5c: 53, q5d: 55 };
  const progress = progressMap[step] || 45;

  // ── Q5: Your income ──
  if (step === 'q5') {
    return (
      <QuestionScreen
        animationKey={step}
        chapter={t('onboarding.income.chapter')}
        title={isNotWorking
          ? t('onboarding.income.q5.titleNotWorking')
          : t(`onboarding.income.q5.${getTitleKey(occupationKey)}`)}
        helper={t(`onboarding.income.q5.${getHelperKey(occupationKey)}`)}
        illustration={<PlaceholderIllustration />}
        onContinue={handleContinue}
        onBack={handleBack}
        validationError={validationError}
        progress={progress}
        progressLabel={t('onboarding.progress', { percent: String(progress) })}
      >
        {isNotWorking ? (
          <View style={{
            padding: 16,
            backgroundColor: C.infoBg,
            borderRadius: R.input,
            borderWidth: 1,
            borderColor: C.infoBorder,
          }}>
            <Text style={{ fontSize: 14, color: C.infoText, lineHeight: 22 }}>
              {t('onboarding.income.q5.notWorkingNote')}
            </Text>
          </View>
        ) : (
          <>
            <LabeledInput
              label={t('onboarding.income.q5.titleEmployee')}
              value={incomeAmount}
              onChangeText={setIncomeAmount}
              numeric
              placeholder="0"
              large
              currency={currency}
            />

            <FrequencyPills
              options={FREQUENCIES}
              value={incomeFrequency}
              onChange={setIncomeFrequency}
              labelMap={{
                daily: t('onboarding.income.q5.frequencyDaily'),
                weekly: t('onboarding.income.q5.frequencyWeekly'),
                fortnightly: t('onboarding.income.q5.frequencyFortnightly'),
                monthly: t('onboarding.income.q5.frequencyMonthly'),
              }}
            />
          </>
        )}
      </QuestionScreen>
    );
  }

  // ── Q5a: Partner income ──
  if (step === 'q5a') {
    return (
      <QuestionScreen
        animationKey={step}
        chapter={t('onboarding.income.chapter')}
        title={t('onboarding.income.q5a.title', { name: partnerName })}
        helper={t('onboarding.income.q5a.helper')}
        illustration={<PlaceholderIllustration />}
        onContinue={handleContinue}
        onBack={handleBack}
        validationError={validationError}
        progress={progress}
        progressLabel={t('onboarding.progress', { percent: String(progress) })}
      >
        <LabeledInput
          label={t('onboarding.income.q5a.title', { name: partnerName })}
          value={partnerIncomeAmount}
          onChangeText={setPartnerIncomeAmount}
          numeric
          placeholder="0"
          large
          currency={currency}
        />

        <FrequencyPills
          options={FREQUENCIES}
          value={partnerIncomeFrequency}
          onChange={setPartnerIncomeFrequency}
          labelMap={{
            daily: t('onboarding.income.q5.frequencyDaily'),
            weekly: t('onboarding.income.q5.frequencyWeekly'),
            fortnightly: t('onboarding.income.q5.frequencyFortnightly'),
            monthly: t('onboarding.income.q5.frequencyMonthly'),
          }}
        />
      </QuestionScreen>
    );
  }

  // ── Q5b: Other income sources ──
  if (step === 'q5b') {
    return (
      <QuestionScreen
        animationKey={step}
        chapter={t('onboarding.income.chapter')}
        title={t('onboarding.income.q5b.title')}
        helper={t('onboarding.income.q5b.helper')}
        illustration={<PlaceholderIllustration />}
        onContinue={handleContinue}
        onBack={handleBack}
        validationError={validationError}
        progress={progress}
        progressLabel={t('onboarding.progress', { percent: String(progress) })}
      >
        <YesNoToggle
          value={hasOtherIncome}
          onChange={setHasOtherIncome}
          yesLabel={t('onboarding.income.q5b.yes')}
          noLabel={t('onboarding.income.q5b.no')}
        />

        <AnimatedSlideIn visible={hasOtherIncome === true}>
          {otherIncomeRows.map((row, index) => (
            <AnimatedRow
              key={row.id}
              visible={row.visible}
              onAnimationEnd={() => {
                if (!row.visible) finalizeRemove(row.id);
              }}
            >
              <View style={{
                backgroundColor: C.surface,
                borderWidth: 1,
                borderColor: C.border,
                borderRadius: R.card,
                padding: S.cardPad,
              }}>
                <LabeledInput
                  label={t('onboarding.income.q5b.amountLabel')}
                  value={row.amount}
                  onChangeText={(v) => updateOtherRow(index, 'amount', v)}
                  numeric
                  placeholder={t('onboarding.income.q5b.amountPlaceholder')}
                  large
                  currency={currency}
                />

                <FrequencyPills
                  options={FREQUENCIES}
                  value={row.frequency}
                  onChange={(freq) => updateOtherRow(index, 'frequency', freq)}
                  labelMap={{
                    daily: t('onboarding.income.q5.frequencyDaily'),
                    weekly: t('onboarding.income.q5.frequencyWeekly'),
                    fortnightly: t('onboarding.income.q5.frequencyFortnightly'),
                    monthly: t('onboarding.income.q5.frequencyMonthly'),
                  }}
                />

                {/* Label + remove at bottom */}
                <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                  <LabeledInput
                    label={t('onboarding.income.q5b.labelPlaceholder')}
                    value={row.label}
                    onChangeText={(v) => updateOtherRow(index, 'label', v)}
                    placeholder={t('onboarding.income.q5b.labelPlaceholder')}
                    inCard
                    containerStyle={{ flex: 1, marginBottom: 0 }}
                  />
                  {otherIncomeRows.length > 1 && (
                    <View style={{ height: 44, justifyContent: 'center' }}>
                      <RemoveButton onPress={() => removeOtherRow(row.id)} />
                    </View>
                  )}
                </View>
              </View>
            </AnimatedRow>
          ))}

          <AddAnotherButton
            label={`+ ${t('onboarding.income.q5b.addAnother')}`}
            onPress={addOtherRow}
          />
        </AnimatedSlideIn>
      </QuestionScreen>
    );
  }

  // ── Q5c: Savings ──
  if (step === 'q5c') {
    return (
      <QuestionScreen
        animationKey={step}
        chapter={t('onboarding.income.chapter')}
        title={t('onboarding.income.q5c.title')}
        helper={t('onboarding.income.q5c.helper')}
        illustration={<PlaceholderIllustration />}
        onContinue={handleContinue}
        onBack={handleBack}
        validationError={validationError}
        progress={progress}
        progressLabel={t('onboarding.progress', { percent: String(progress) })}
      >
        <LabeledInput
          label={t('onboarding.income.q5c.balanceLabel')}
          value={savingsBalance}
          onChangeText={setSavingsBalance}
          numeric
          placeholder={t('onboarding.income.q5c.balancePlaceholder')}
          large
          currency={currency}
        />

        <LabeledInput
          label={t('onboarding.income.q5c.monthlyTargetLabel')}
          value={savingsMonthlyTarget}
          onChangeText={setSavingsMonthlyTarget}
          numeric
          placeholder={t('onboarding.income.q5c.monthlyTargetPlaceholder')}
          large
          currency={currency}
        />
      </QuestionScreen>
    );
  }

  // ── Q5d: Financial goal ──
  if (step === 'q5d') {
    return (
      <QuestionScreen
        animationKey={step}
        chapter={t('onboarding.income.chapter')}
        title={t('onboarding.income.q5d.title')}
        helper={t('onboarding.income.q5d.helper')}
        illustration={<PlaceholderIllustration />}
        onContinue={handleContinue}
        onBack={handleBack}
        validationError={validationError}
        progress={progress}
        progressLabel={t('onboarding.progress', { percent: String(progress) })}
      >
        <YesNoToggle
          value={hasGoal}
          onChange={setHasGoal}
          yesLabel={t('onboarding.income.q5d.yes')}
          noLabel={t('onboarding.income.q5d.no')}
        />

        <AnimatedSlideIn visible={hasGoal === true}>
          <LabeledInput
            label={t('onboarding.income.q5d.descriptionLabel')}
            value={goalDescription}
            onChangeText={setGoalDescription}
            placeholder={t('onboarding.income.q5d.descriptionPlaceholder')}
          />

          <LabeledInput
            label={t('onboarding.income.q5d.amountLabel')}
            value={goalAmount}
            onChangeText={setGoalAmount}
            numeric
            placeholder={t('onboarding.income.q5d.amountPlaceholder')}
            large
            currency={currency}
          />

          {/* Target date */}
          <View>
            <Text style={{
              ...T.fieldLabel,
              color: C.muted,
              marginBottom: S.labelGap,
            }}>
              {t('onboarding.income.q5d.dateLabel')}
            </Text>
            <DatePicker
              value={goalDate}
              onChange={setGoalDate}
              showDay={false}
            />
          </View>
        </AnimatedSlideIn>
      </QuestionScreen>
    );
  }

  return null;
}
