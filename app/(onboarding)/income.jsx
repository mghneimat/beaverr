import { useState, useRef, useEffect } from 'react';
import { View, Text } from 'react-native';
import OnboardingPressable from '../../components/onboarding/OnboardingPressable';
import { listRowBg } from '../../components/onboarding/pressableFeedback';
import { useI18n } from '../../lib/i18n';
import { navigateBack, navigateForward } from '../../lib/onboardingNavigation';
import { buildIncomeResumeRoute, persistIncomeDraft } from '../../lib/incomeOnboardingSave';
import { getData, setData } from '../../lib/storage';
import { getCurrencySymbol } from '../../lib/currency';
import { toMonthly, formatCurrency } from '../../lib/finance';
import { C, S, T, R } from '../../constants/onboarding-theme';
import QuestionScreen from '../../components/onboarding/QuestionScreen';
import AnimatedSlideIn from '../../components/onboarding/AnimatedSlideIn';
import LabeledInput from '../../components/onboarding/LabeledInput';
import FrequencyPills from '../../components/onboarding/FrequencyPills';
import InputGroup from '../../components/onboarding/InputGroup';
import SkipButton from '../../components/onboarding/SkipButton';
import OnboardingCategoryAccordion from '../../components/onboarding/OnboardingCategoryAccordion';
import OtherIncomeCategoryIcon from '../../components/onboarding/OtherIncomeCategoryIcon';
import { getOnboardingState } from '../../lib/onboardingProgress';
import { useSectionExit } from '../../lib/finishOnboardingSection';
import { getQuickSetupNextRoute, isQuickSetupMode } from '../../lib/onboardingQuickPath';
import { useOnboardingMultiStep } from '../../lib/useOnboardingMultiStep';
import { useOnboardingLayout } from '../../lib/onboardingLayout';
import SavingsIllustration from '../../components/onboarding/SavingsIllustration';
import MoneyReceivedIllustration from '../../components/onboarding/MoneyReceivedIllustration';
import {
  getIncomeBackTarget,
  getOccupationHelperKey,
  getOccupationTitleKey,
  hasPriorSalaryIncome,
  resolveIncomeContinue,
  resolveInitialIncomeStep,
} from '../../lib/incomeFlow';
import {
  OTHER_INCOME_CATEGORY_ORDER,
  OTHER_INCOME_CATALOG,
  OTHER_INCOME_FREQUENCIES,
  normalizeOnboardingIncomeFrequency,
  otherIncomeCategoryLabelKey,
  otherIncomeLabelKey,
  emptyOtherIncomeItem,
  otherIncomeDisplayName,
  migrateOtherIncomeRowsFromSaved,
  rowsToSavedPayload,
  getValidOtherIncomeRows,
} from '../../lib/otherIncomeCatalog';

const FREQUENCY_LABELS = (t) => ({
  daily: t('onboarding.income.yourIncome.frequencyDaily'),
  weekly: t('onboarding.income.yourIncome.frequencyWeekly'),
  monthly: t('onboarding.income.yourIncome.frequencyMonthly'),
  annual: t('onboarding.income.yourIncome.frequencyAnnual'),
});

/**
 * yourIncome — Your income (title adapts by occupation)
 * partnerIncome — Partner's income (partner branch only)
 * otherIncome — Other income sources (toggle + repeating rows)
 * savings — Savings balance
 */
export default function IncomeScreen() {
  const { t } = useI18n();
  const layout = useOnboardingLayout();
  const { isEditMode, completeSection, leaveSection, editContinueLabel } = useSectionExit();
  const occupationRef = useRef(null);
  const hasPartnerRef = useRef(false);
  const quickModeRef = useRef(false);

  // ── Loaded data ──
  const [occupation, setOccupation] = useState(null);
  const [hasPartner, setHasPartner] = useState(false);
  const [partnerName, setPartnerName] = useState('');
  const [currencyCode, setCurrencyCode] = useState('CZK');
  const currency = getCurrencySymbol(currencyCode);

  const { step, setStep } = useOnboardingMultiStep('income', {
    defaultStep: 'yourIncome',
    onFocus: async () => {
      const occ = await getData('beaverr_occupation');
      const loc = await getData('beaverr_location');
      const saved = await getData('beaverr_income');
      const household = await getData('beaverr_household');

      setOccupation(occ);
      occupationRef.current = occ;
      if (loc?.currency) setCurrencyCode(loc.currency);

      const partnerHousehold = household?.type === 'partner' && household?.partnerName;
      setHasPartner(Boolean(partnerHousehold));
      hasPartnerRef.current = Boolean(partnerHousehold);
      if (partnerHousehold) setPartnerName(household.partnerName);

      const onboarding = await getOnboardingState();
      quickModeRef.current = isQuickSetupMode(onboarding);

      if (saved) {
        if (saved.amount) setIncomeAmount(String(saved.amount));
        if (saved.frequency) setIncomeFrequency(normalizeOnboardingIncomeFrequency(saved.frequency));
        if (saved.partnerAmount) setPartnerIncomeAmount(String(saved.partnerAmount));
        if (saved.partnerFrequency) setPartnerIncomeFrequency(normalizeOnboardingIncomeFrequency(saved.partnerFrequency));
        if (saved.otherIncomeRows?.length > 0) {
          setOtherIncomeRows(migrateOtherIncomeRowsFromSaved(saved.otherIncomeRows));
        }
        if (saved.savingsBalance) setSavingsBalance(String(saved.savingsBalance));
      }
    },
    loadStepFromStorage: (saved) => {
      if (saved?.incomeOnboardingStep) {
        return { step: saved.incomeOnboardingStep };
      }
      return {
        step: resolveInitialIncomeStep({
          isEditMode,
          hasPartner: hasPartnerRef.current,
          userOccupation: occupationRef.current?.user,
          partnerOccupation: occupationRef.current?.partner,
          quickMode: quickModeRef.current,
        }),
      };
    },
  });

  // ── Your income ──
  const [incomeAmount, setIncomeAmount] = useState('');
  const [incomeFrequency, setIncomeFrequency] = useState('monthly');

  // ── partnerIncome: Partner income ──
  const [partnerIncomeAmount, setPartnerIncomeAmount] = useState('');
  const [partnerIncomeFrequency, setPartnerIncomeFrequency] = useState('monthly');

  // ── otherIncome: Other income ──
  const [otherIncomeStep, setOtherIncomeStep] = useState('select'); // select | fill
  const [otherIncomeRows, setOtherIncomeRows] = useState([]);
  const [activeOtherIdx, setActiveOtherIdx] = useState(0);
  const [customOtherPrompt, setCustomOtherPrompt] = useState(null);
  const [otherFieldErrors, setOtherFieldErrors] = useState({});
  const [otherIncomeSearchQuery, setOtherIncomeSearchQuery] = useState('');
  const [expandedOtherCategoryId, setExpandedOtherCategoryId] = useState(null);

  // ── savings: Savings ──
  const [savingsBalance, setSavingsBalance] = useState('');

  // ── Validation ──
  const [validationError, setValidationError] = useState('');

  const occupationKey = occupation?.user || 'other';
  const isNotWorking = occupationKey === 'notWorking';
  const partnerOccKey = occupation?.partner;
  const partnerIsNotWorking = partnerOccKey === 'notWorking';

  const getTitleKey = (key) => getOccupationTitleKey(key);
  const getHelperKey = (key) => getOccupationHelperKey(key);

  const monthlyEquivalent = (amount, freq) => {
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) return null;
    const monthly = toMonthly(num, freq);
    return formatCurrency(monthly, currency);
  };

  const handleContinue = async () => {
    setValidationError('');

    if (isEditMode) {
      await saveIncomeSection();
      return;
    }

    const quickMode = quickModeRef.current;
    const result = resolveIncomeContinue({
      step,
      isNotWorking,
      incomeAmount,
      hasPartner,
      partnerIsNotWorking,
      partnerIncomeAmount,
      partnerName,
      otherIncomeStep,
      otherIncomeRows,
      quickMode,
    });

    if (result.type === 'validationError') {
      setValidationError(t(result.validationKey, { name: result.partnerName }));
      return;
    }
    if (result.type === 'otherIncomeFill') {
      setOtherFieldErrors({});
      setActiveOtherIdx(0);
      setOtherIncomeStep('fill');
      return;
    }
    if (result.type === 'otherIncomeErrors') {
      setValidationError(t(result.validationKey, { name: result.partnerName }));
      const localizedErrors = {};
      otherIncomeRows.forEach((row) => {
        if (result.errors[row.id]?.amount) {
          localizedErrors[row.id] = { amount: t('onboarding.income.otherIncome.validationOtherAmount') };
        } else if (result.errors[row.id]?.customLabel) {
          localizedErrors[row.id] = { customLabel: t('onboarding.income.otherIncome.validationOtherLabel') };
        }
      });
      setOtherFieldErrors(localizedErrors);
      setActiveOtherIdx(result.firstInvalidIdx);
      return;
    }
    if (result.type === 'nextStep') {
      setStep(result.step);
      return;
    }
    if (result.type === 'complete') {
      await saveIncomeSection();
    }
  };

  const buildIncomePayload = () => ({
    amount: incomeAmount ? parseFloat(incomeAmount) : null,
    frequency: incomeFrequency,
    partnerAmount: partnerIncomeAmount ? parseFloat(partnerIncomeAmount) : null,
    partnerFrequency: partnerIncomeFrequency,
    hasOtherIncome: getValidOtherIncomeRows(otherIncomeRows).length > 0,
    otherIncomeRows: rowsToSavedPayload(otherIncomeRows, t),
    savingsBalance: savingsBalance ? parseFloat(savingsBalance) : null,
  });

  const saveIncomeSection = async () => {
    const existing = (await getData('beaverr_income')) || {};
    const incomeData = { ...existing, ...buildIncomePayload() };
    const quickMode = isQuickSetupMode(await getOnboardingState());

    await completeSection({
      persist: async () => { await setData('beaverr_income', incomeData); },
      onboardingPatch: {
        completed: false,
        currentStep: 'income',
        percentComplete: quickMode ? 22 : 53,
        setupMode: quickMode ? 'quick' : 'full',
        resumeRoute: quickMode ? getQuickSetupNextRoute('income') : undefined,
      },
      nextRoute: quickMode ? getQuickSetupNextRoute('income') : '/(onboarding)/splash-strategy',
      routeName: 'income',
    });
  };

  const handleBack = async () => {
    setValidationError('');

    if (quickModeRef.current && step === 'yourIncome') {
      navigateForward('/(onboarding)/occupation');
      return;
    }
    if (step === 'savings') {
      if (otherIncomeRows.length > 0) {
        setOtherIncomeStep('fill');
        setActiveOtherIdx(Math.max(0, otherIncomeRows.length - 1));
      } else {
        setOtherIncomeStep('select');
      }
      setStep('otherIncome');
      return;
    }

    if (step === 'otherIncome') {
      if (otherIncomeStep === 'fill') {
        if (activeOtherIdx > 0) {
          setActiveOtherIdx((i) => i - 1);
          return;
        }
        setOtherIncomeStep('select');
        setOtherFieldErrors({});
        return;
      }
    }

    const backTarget = getIncomeBackTarget({
      step,
      hasPartner,
      isNotWorking,
      partnerIsNotWorking,
    });

    if (backTarget === 'splash') {
      leaveSection(() => navigateBack());
      return;
    }
    setStep(backTarget);
  };

  const handleSaveDraft = async () => {
    await persistIncomeDraft({
      step,
      incomeAmount,
      incomeFrequency,
      partnerIncomeAmount,
      partnerIncomeFrequency,
      otherIncomeRows,
      savingsBalance,
    });
  };

  const resumeRoute = buildIncomeResumeRoute(step);
  const incomeScreenProps = {
    progressStep: step,
    resumeRoute,
    onSaveDraft: handleSaveDraft,
  };

  const isOtherSelected = (categoryId, sourceKey) =>
    otherIncomeRows.some(
      (row) => row.category === categoryId && row.sourceKey === sourceKey && sourceKey !== 'other',
    );

  const toggleOtherSource = (categoryId, sourceKey) => {
    if (isOtherSelected(categoryId, sourceKey)) {
      setOtherIncomeRows((prev) => prev.filter(
        (row) => !(row.category === categoryId && row.sourceKey === sourceKey),
      ));
      return;
    }
    setOtherIncomeRows((prev) => [...prev, emptyOtherIncomeItem(categoryId, sourceKey)]);
  };

  const removeOtherSource = (id) => {
    setOtherIncomeRows((prev) => prev.filter((row) => row.id !== id));
  };

  const clearAllOtherIncome = () => {
    setOtherIncomeRows([]);
    setCustomOtherPrompt(null);
    setOtherFieldErrors({});
    setValidationError(null);
  };

  const addCustomOtherToCategory = (categoryId) => {
    setExpandedOtherCategoryId(categoryId);
    setCustomOtherPrompt({ category: categoryId, name: '' });
  };

  const toggleOtherCategoryExpanded = (categoryId) => {
    if (expandedOtherCategoryId === categoryId) {
      if (customOtherPrompt?.category === categoryId) setCustomOtherPrompt(null);
      setExpandedOtherCategoryId(null);
      return;
    }
    if (customOtherPrompt) setCustomOtherPrompt(null);
    setExpandedOtherCategoryId(categoryId);
  };

  const confirmCustomOther = () => {
    const name = customOtherPrompt?.name?.trim();
    if (!name || !customOtherPrompt?.category) {
      setCustomOtherPrompt(null);
      return;
    }
    setOtherIncomeRows((prev) => [
      ...prev,
      emptyOtherIncomeItem(customOtherPrompt.category, 'other', name),
    ]);
    setCustomOtherPrompt(null);
  };

  const otherIncomeItemLabel = (sourceKey) => {
    const labelKey = otherIncomeLabelKey(sourceKey);
    const translated = t(labelKey);
    return translated !== labelKey ? translated : sourceKey;
  };

  const otherIncomeCategoryTitle = (categoryId) => {
    const labelKey = otherIncomeCategoryLabelKey(categoryId);
    const translated = t(labelKey);
    return translated !== labelKey ? translated : categoryId;
  };

  useEffect(() => {
    if (step !== 'otherIncome' || otherIncomeStep === 'fill') return;
    const norm = otherIncomeSearchQuery.trim().toLowerCase();
    if (!norm) return;
    const filtered = OTHER_INCOME_CATEGORY_ORDER.filter((categoryId) => {
      const title = otherIncomeCategoryTitle(categoryId).toLowerCase();
      if (title.includes(norm)) return true;
      return (OTHER_INCOME_CATALOG[categoryId] || []).some(
        (key) => otherIncomeItemLabel(key).toLowerCase().includes(norm),
      );
    });
    if (filtered.length > 0) setExpandedOtherCategoryId(filtered[0]);
  }, [step, otherIncomeStep, otherIncomeSearchQuery, t]);

  const updateOtherRow = (id, patch) => {
    setOtherIncomeRows((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)));
    setOtherFieldErrors((prev) => {
      if (!prev[id]) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const otherRowErrors = (id) => otherFieldErrors[id] || {};

  // ── yourIncome: Your income ──
  if (step === 'yourIncome') {
    return (
      <QuestionScreen
        {...incomeScreenProps}
        animationKey={step}
        chapter={t('onboarding.income.chapter')}
        illustration={<MoneyReceivedIllustration width={layout.illustrationWidth} />}
        title={isNotWorking
          ? t('onboarding.income.yourIncome.titleNotWorking')
          : t(`onboarding.income.yourIncome.${getTitleKey(occupationKey)}`)}
        helper={t(`onboarding.income.yourIncome.${getHelperKey(occupationKey)}`)}
        onContinue={handleContinue}
        onBack={handleBack}
        validationError={validationError}
        setValidationError={setValidationError}

        continueLabel={editContinueLabel}
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
              {t('onboarding.income.yourIncome.notWorkingNote')}
            </Text>
          </View>
        ) : (
          <>
            <InputGroup label={t(`onboarding.income.yourIncome.${getTitleKey(occupationKey)}`)}>
              <LabeledInput
                value={incomeAmount}
                onChangeText={setIncomeAmount}
                numeric
                placeholder="0"
                large
                inGroup
                currency={currency}
              />
              <FrequencyPills
                options={OTHER_INCOME_FREQUENCIES}
                value={incomeFrequency}
                onChange={setIncomeFrequency}
                labelMap={FREQUENCY_LABELS(t)}
              />
            </InputGroup>
          </>
        )}
      </QuestionScreen>
    );
  }

  // ── partnerIncome: Partner income ──
  if (step === 'partnerIncome') {
    return (
      <QuestionScreen
        {...incomeScreenProps}
        animationKey={step}
        chapter={t('onboarding.income.chapter')}
        title={t('onboarding.income.partnerIncome.title', { name: partnerName })}
        helper={t('onboarding.income.partnerIncome.helper')}
        onContinue={handleContinue}
        onBack={handleBack}
        validationError={validationError}
        setValidationError={setValidationError}

        continueLabel={editContinueLabel}
      >
        <InputGroup label={t('onboarding.income.partnerIncome.amountLabel')}>
          <LabeledInput
            value={partnerIncomeAmount}
            onChangeText={setPartnerIncomeAmount}
            numeric
            placeholder="0"
            large
            inGroup
            currency={currency}
          />
          <FrequencyPills
            options={OTHER_INCOME_FREQUENCIES}
            value={partnerIncomeFrequency}
            onChange={setPartnerIncomeFrequency}
            labelMap={FREQUENCY_LABELS(t)}
          />
        </InputGroup>
      </QuestionScreen>
    );
  }

  // ── otherIncome: Other income sources ──
  if (step === 'otherIncome') {
    const requiresOtherIncome = !hasPriorSalaryIncome({
      isNotWorking,
      incomeAmount,
      hasPartner,
      partnerIsNotWorking,
      partnerIncomeAmount,
    });
    const isFillStep = otherIncomeStep === 'fill';
    const showTabs = isFillStep && otherIncomeRows.length > 1;
    const activeRow = otherIncomeRows[activeOtherIdx] || otherIncomeRows[0];
    const otherIncomeTitle = isFillStep
      ? t('onboarding.income.otherIncome.fillTitle')
      : t('onboarding.income.otherIncome.title');
    const otherIncomeHelper = isFillStep
      ? t('onboarding.income.otherIncome.fillHelper')
      : (requiresOtherIncome
        ? (hasPartner
          ? t('onboarding.income.otherIncome.helperRequired')
          : t('onboarding.income.otherIncome.helperRequiredSolo'))
        : t('onboarding.income.otherIncome.selectHelper'));

    const otherSearchNorm = otherIncomeSearchQuery.trim().toLowerCase();
    const filteredOtherCategories = !otherSearchNorm
      ? OTHER_INCOME_CATEGORY_ORDER
      : OTHER_INCOME_CATEGORY_ORDER.filter((categoryId) => {
        const title = otherIncomeCategoryTitle(categoryId).toLowerCase();
        if (title.includes(otherSearchNorm)) return true;
        return (OTHER_INCOME_CATALOG[categoryId] || []).some(
          (key) => otherIncomeItemLabel(key).toLowerCase().includes(otherSearchNorm),
        );
      });

    const renderOtherFillForm = (row) => {
      const errors = otherRowErrors(row.id);
      return (
        <AnimatedSlideIn key={row.id} visible>
          <View style={{
            backgroundColor: C.surface,
            borderWidth: 1,
            borderColor: C.border,
            borderRadius: R.card,
            padding: S.cardPad,
          }}>
            {otherIncomeRows.length === 1 ? (
              <Text style={{ fontSize: 15, fontWeight: '600', color: C.text, marginBottom: 12 }}>
                {otherIncomeDisplayName(row, t)}
              </Text>
            ) : null}

            {row.sourceKey === 'other' ? (
              <LabeledInput
                label={t('onboarding.income.otherIncome.nameLabel')}
                value={row.customLabel || ''}
                onChangeText={(v) => updateOtherRow(row.id, { customLabel: v })}
                placeholder={t('onboarding.income.otherIncome.namePlaceholder')}
                containerStyle={{ marginBottom: 12 }}
                errorText={errors.customLabel}
              />
            ) : null}

            <InputGroup label={t('onboarding.income.otherIncome.amountLabel')}>
              <LabeledInput
                value={row.amount}
                onChangeText={(v) => updateOtherRow(row.id, { amount: v })}
                numeric
                placeholder={t('onboarding.income.otherIncome.amountPlaceholder')}
                large
                inGroup
                currency={currency}
                errorText={errors.amount}
              />
              <FrequencyPills
                options={OTHER_INCOME_FREQUENCIES}
                value={row.frequency}
                onChange={(freq) => updateOtherRow(row.id, { frequency: freq })}
                label={t('onboarding.income.otherIncome.frequencyLabel')}
                labelMap={FREQUENCY_LABELS(t)}
                small
              />
            </InputGroup>
          </View>
        </AnimatedSlideIn>
      );
    };

    return (
      <QuestionScreen
        {...incomeScreenProps}
        animationKey={isFillStep ? `otherIncome-fill-${activeOtherIdx}` : 'otherIncome-select'}
        chapter={t('onboarding.income.chapter')}
        illustration={<MoneyReceivedIllustration width={layout.illustrationWidth} />}
        title={otherIncomeTitle}
        helper={otherIncomeHelper}
        onContinue={handleContinue}
        onBack={handleBack}
        validationError={validationError}
        setValidationError={setValidationError}

        continueLabel={editContinueLabel}
      >
        {!isFillStep ? (
          <>
            {requiresOtherIncome ? (
              <View style={{
                padding: 14,
                paddingHorizontal: 16,
                backgroundColor: C.infoBg,
                borderRadius: R.input,
                borderWidth: 1,
                borderColor: C.infoBorder,
                marginBottom: S.fieldGap,
              }}>
                <Text style={{ ...T.caption, color: C.infoText, lineHeight: 18 }}>
                  {t('onboarding.income.otherIncome.requiredNote')}
                </Text>
              </View>
            ) : null}

            <LabeledInput
              value={otherIncomeSearchQuery}
              onChangeText={setOtherIncomeSearchQuery}
              placeholder={t('onboarding.income.otherIncome.searchPlaceholder')}
              containerStyle={{ marginBottom: 16 }}
              accessibilityLabel={t('onboarding.income.otherIncome.searchPlaceholder')}
            />

            <Text style={{ ...T.fieldLabel, color: C.muted, marginBottom: 10 }}>
              {t('onboarding.income.otherIncome.browseCategories')}
            </Text>

            {filteredOtherCategories.length === 0 ? (
              <Text style={{ ...T.helper, color: C.muted, marginBottom: 16 }}>
                {t('onboarding.income.otherIncome.noSearchResults')}
              </Text>
            ) : null}

            {filteredOtherCategories.map((categoryId) => {
              const keys = OTHER_INCOME_CATALOG[categoryId] || [];
              const countLabel = t('onboarding.income.otherIncome.suggestionCount', { count: keys.length });
              return (
                <OnboardingCategoryAccordion
                  key={categoryId}
                  categoryId={categoryId}
                  title={otherIncomeCategoryTitle(categoryId)}
                  suggestionCount={countLabel}
                  selectedCountLabel={(count) => t('onboarding.income.otherIncome.selectedInCategory', { count })}
                  itemKeys={keys}
                  itemLabel={otherIncomeItemLabel}
                  isItemSelected={isOtherSelected}
                  onToggleItem={toggleOtherSource}
                  onAddCustom={addCustomOtherToCategory}
                  addCustomLabel={t('common.add')}
                  expanded={expandedOtherCategoryId === categoryId}
                  onToggleExpanded={toggleOtherCategoryExpanded}
                  customItems={otherIncomeRows.filter(
                    (row) => row.category === categoryId && row.sourceKey === 'other' && row.customLabel?.trim(),
                  ).map((row) => ({ id: row.id, customName: row.customLabel }))}
                  onRemoveCustomItem={removeOtherSource}
                  showCustomInput={customOtherPrompt?.category === categoryId}
                  customName={customOtherPrompt?.category === categoryId ? customOtherPrompt.name : ''}
                  onCustomNameChange={(name) => setCustomOtherPrompt((p) => ({ ...p, name }))}
                  onConfirmCustom={confirmCustomOther}
                  onCancelCustom={() => setCustomOtherPrompt(null)}
                  customPlaceholder={t('onboarding.income.otherIncome.namePlaceholder')}
                  customAccessibilityLabel={t('onboarding.income.otherIncome.otherSourceLabel')}
                  cancelAccessibilityLabel={t('common.cancel')}
                  renderIcon={(id) => <OtherIncomeCategoryIcon categoryId={id} size={40} />}
                />
              );
            })}

            <AnimatedSlideIn visible={otherIncomeRows.length > 0} spacingTop={16}>
              <View style={{
                padding: 16,
                borderRadius: R.card,
                borderWidth: 1,
                borderColor: C.border,
                backgroundColor: C.surface,
              }}>
                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 10,
                  gap: 12,
                }}>
                  <Text style={{ ...T.fieldLabel, color: C.muted, flex: 1 }}>
                    {t('onboarding.income.otherIncome.addedSoFar', { count: otherIncomeRows.length })}
                  </Text>
                  <OnboardingPressable
                    onPress={clearAllOtherIncome}
                    accessibilityRole="button"
                    accessibilityLabel={t('onboarding.income.otherIncome.clearAll')}
                    style={({ pressed, hovered }) => ({
                      paddingVertical: 4,
                      paddingHorizontal: 4,
                      opacity: pressed ? 0.7 : hovered ? 0.85 : 1,
                    })}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '600', color: C.primary }}>
                      {t('onboarding.income.otherIncome.clearAll')}
                    </Text>
                  </OnboardingPressable>
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {otherIncomeRows.map((row) => (
                    <View
                      key={row.id}
                      style={{
                        paddingVertical: 8,
                        paddingHorizontal: 12,
                        borderRadius: R.pill,
                        backgroundColor: C.pillSelectedBg,
                      }}
                    >
                      <Text style={{ fontSize: 12, color: C.pillSelectedText, fontWeight: '500' }}>
                        {otherIncomeDisplayName(row, t)}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </AnimatedSlideIn>

            {!requiresOtherIncome ? (
              <SkipButton
                label={t('onboarding.income.otherIncome.skip')}
                onPress={() => {
                  setOtherIncomeRows([]);
                  setOtherIncomeStep('select');
                  setStep('savings');
                }}
              />
            ) : null}
          </>
        ) : (
          <>
            {otherIncomeRows.length > 1 ? (
              <Text style={{ ...T.helper, color: C.muted, marginBottom: 16 }}>
                {t('onboarding.income.otherIncome.fillProgress', {
                  current: activeOtherIdx + 1,
                  total: otherIncomeRows.length,
                })}
              </Text>
            ) : null}

            {showTabs ? (
              <View style={{
                flexDirection: 'row',
                borderRadius: R.input,
                borderWidth: 1,
                borderColor: C.border,
                overflow: 'hidden',
                marginBottom: 20,
              }}>
                {otherIncomeRows.map((row, idx) => (
                  <OnboardingPressable
                    key={row.id}
                    onPress={() => {
                      setActiveOtherIdx(idx);
                      setOtherFieldErrors({});
                    }}
                    style={({ pressed, hovered }) => ({
                      flex: 1,
                      paddingVertical: 10,
                      paddingHorizontal: 8,
                      backgroundColor: listRowBg({ pressed, hovered, selected: activeOtherIdx === idx }),
                      alignItems: 'center',
                    })}
                  >
                    <Text
                      numberOfLines={1}
                      style={{
                        fontSize: 13,
                        fontWeight: '500',
                        color: activeOtherIdx === idx ? C.primary : C.muted,
                      }}
                    >
                      {otherIncomeDisplayName(row, t)}
                    </Text>
                  </OnboardingPressable>
                ))}
              </View>
            ) : null}

            {activeRow ? renderOtherFillForm(activeRow) : null}
          </>
        )}
      </QuestionScreen>
    );
  }

  // ── savings: Savings ──
  if (step === 'savings') {
    return (
      <QuestionScreen
        {...incomeScreenProps}
        animationKey={step}
        chapter={t('onboarding.income.chapter')}
        title={t('onboarding.income.savings.title')}
        helper={t('onboarding.income.savings.helper')}
        illustration={<SavingsIllustration width={layout.illustrationWidth} />}
        onContinue={handleContinue}
        onBack={handleBack}
        validationError={validationError}
        setValidationError={setValidationError}

        continueLabel={editContinueLabel}
      >
        <InputGroup label={t('onboarding.income.savings.balanceLabel')}>
          <LabeledInput
            value={savingsBalance}
            onChangeText={setSavingsBalance}
            numeric
            placeholder={t('onboarding.income.savings.balancePlaceholder')}
            large
            inGroup
            currency={currency}
          />
        </InputGroup>

      </QuestionScreen>
    );
  }

  return null;
}
