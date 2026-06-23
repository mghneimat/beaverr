import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { View, Text, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useI18n } from '../../lib/i18n';
import { navigateBack, navigateForward } from '../../lib/onboardingNavigation';
import { useOnboardingLayout } from '../../lib/onboardingLayout';
import PaymentInformationBroIllustration from '../../components/onboarding/PaymentInformationBroIllustration';
import { getData, setData } from '../../lib/storage';
import { getCurrencySymbol } from '../../lib/currency';
import { toMonthly, formatCurrency } from '../../lib/finance';
import {
  SUBSCRIPTION_CATEGORY_ORDER,
  SUBSCRIPTION_CATALOG,
  categoryLabelKey,
  serviceLabelKey,
  subscriptionDisplayName,
} from '../../lib/subscriptionCatalog';
import {
  loadSubscriptionsWithMigration,
  normalizeSubscriptionRow,
  isSubscriptionIncluded,
} from '../../lib/subscriptionMigration';
import { C, S, T, R } from '../../constants/onboarding-theme';
import QuestionScreen from '../../components/onboarding/QuestionScreen';
import SubscriptionCategoryAccordion from '../../components/onboarding/SubscriptionCategoryAccordion';
import AnimatedSlideIn from '../../components/onboarding/AnimatedSlideIn';
import OnboardingPressable from '../../components/onboarding/OnboardingPressable';
import { listRowBg } from '../../components/onboarding/pressableFeedback';
import LabeledInput from '../../components/onboarding/LabeledInput';
import FrequencyPills from '../../components/onboarding/FrequencyPills';
import InputGroup from '../../components/onboarding/InputGroup';
import YesNoToggle from '../../components/onboarding/YesNoToggle';
import SplitDateFields from '../../components/onboarding/SplitDateFields';
import DayOfMonthPicker from '../../components/onboarding/DayOfMonthPicker';
import SuggestionChip from '../../components/onboarding/SuggestionChip';
import FieldError from '../../components/onboarding/FieldError';
import { useSectionExit } from '../../lib/finishOnboardingSection';

const FREQUENCIES = ['monthly', 'quarterly', 'annual'];
const STORAGE_MIGRATED_KEY = 'beaverr_other_costs_migrated';

function newSubId(category, serviceKey) {
  return `sub_${category}_${serviceKey}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function emptySub(category, serviceKey, customName = '') {
  return normalizeSubscriptionRow({
    id: newSubId(category, serviceKey),
    serviceKey,
    customName,
    category: category || null,
    cost: '',
    frequency: 'monthly',
    chargeDay: '',
    autoRenews: true,
    endDate: '',
  });
}

export default function SubscriptionsScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const layout = useOnboardingLayout();
  const { isEditMode, completeSection, leaveSection, editContinueLabel } = useSectionExit();

  const [currencyCode, setCurrencyCode] = useState('CZK');
  const currency = getCurrencySymbol(currencyCode);
  const [occupation, setOccupation] = useState(null);

  const [step, setStep] = useState('select');
  const [fillCategoryIdx, setFillCategoryIdx] = useState(0);
  const [activeSubIdx, setActiveSubIdx] = useState(0);
  const [subscriptions, setSubscriptions] = useState([]);
  const [validationError, setValidationError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [customPrompt, setCustomPrompt] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategoryId, setExpandedCategoryId] = useState(null);

  const dateFocusCount = useRef(0);
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);

  const handleDateElevatedChange = useCallback((focused) => {
    dateFocusCount.current = Math.max(0, dateFocusCount.current + (focused ? 1 : -1));
    setDateDropdownOpen(dateFocusCount.current > 0);
  }, []);

  const elevatedDateStyle = dateDropdownOpen
    ? {
        zIndex: 200,
        elevation: 12,
        overflow: 'visible',
        ...(Platform.OS === 'web' ? { position: 'relative' } : null),
      }
    : { overflow: 'visible' };

  useEffect(() => {
    (async () => {
      const [loc, occ, subs, otherCosts, migratedFlag] = await Promise.all([
        getData('beaverr_location'),
        getData('beaverr_occupation'),
        getData('beaverr_subscriptions'),
        getData('beaverr_other_costs'),
        getData(STORAGE_MIGRATED_KEY),
      ]);
      if (loc?.currency) setCurrencyCode(loc.currency);
      setOccupation(occ);

      const { subscriptions: loaded, migrated } = loadSubscriptionsWithMigration(
        subs,
        otherCosts,
        migratedFlag === true,
      );
      setSubscriptions(loaded);

      if (migrated) {
        await setData(STORAGE_MIGRATED_KEY, true);
      }
    })();
  }, []);

  const isSelfEmployed = occupation?.user === 'selfEmployed';

  const findSubIndex = (category, serviceKey, customName = '') => {
    if (serviceKey === 'other' && customName) {
      return subscriptions.findIndex(
        (s) => s.category === category && s.serviceKey === 'other' && s.customName === customName,
      );
    }
    return subscriptions.findIndex(
      (s) => s.category === category && s.serviceKey === serviceKey,
    );
  };

  const isSelected = (category, serviceKey) =>
    subscriptions.some((s) => s.category === category && s.serviceKey === serviceKey && serviceKey !== 'other');

  const toggleService = (category, serviceKey) => {
    const idx = findSubIndex(category, serviceKey);
    if (idx !== -1) {
      setSubscriptions((prev) => prev.filter((_, i) => i !== idx));
    } else {
      setSubscriptions((prev) => [...prev, emptySub(category, serviceKey)]);
    }
  };

  const removeCustomItem = (id) => {
    setSubscriptions((prev) => prev.filter((s) => s.id !== id));
  };

  const addCustomToCategory = (category) => {
    setExpandedCategoryId(category);
    setCustomPrompt({ category, name: '' });
  };

  const toggleCategoryExpanded = (categoryId) => {
    if (expandedCategoryId === categoryId) {
      if (customPrompt?.category === categoryId) setCustomPrompt(null);
      setExpandedCategoryId(null);
      return;
    }
    if (customPrompt) setCustomPrompt(null);
    setExpandedCategoryId(categoryId);
  };

  const confirmCustom = () => {
    const name = customPrompt?.name?.trim();
    if (!name || !customPrompt?.category) {
      setCustomPrompt(null);
      return;
    }
    setSubscriptions((prev) => [
      ...prev,
      emptySub(customPrompt.category, 'other', name),
    ]);
    setCustomPrompt(null);
  };

  const updateSub = (id, updates) => {
    setSubscriptions((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
    setFieldErrors((prev) => {
      if (!prev[id]) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const subFieldErrors = (subId) => fieldErrors[subId] || {};

  const categoriesWithSelections = useMemo(() => SUBSCRIPTION_CATEGORY_ORDER.filter((catId) =>
    subscriptions.some((s) => s.category === catId || (s.category === null && fillCategoryIdx === 0)),
  ), [subscriptions, fillCategoryIdx]);

  const fillCategories = useMemo(() => {
    const cats = SUBSCRIPTION_CATEGORY_ORDER.filter((catId) =>
      subscriptions.some((s) => s.category === catId),
    );
    const uncategorized = subscriptions.filter((s) => s.category === null);
    if (uncategorized.length > 0 && !cats.includes('__uncategorized')) {
      return ['__uncategorized', ...cats];
    }
    return cats.length ? cats : (uncategorized.length ? ['__uncategorized'] : []);
  }, [subscriptions]);

  const currentFillCategory = fillCategories[fillCategoryIdx];
  const itemsInCurrentCategory = useMemo(() => {
    if (currentFillCategory === '__uncategorized') {
      return subscriptions.filter((s) => s.category === null);
    }
    return subscriptions.filter((s) => s.category === currentFillCategory);
  }, [subscriptions, currentFillCategory]);

  const validateSub = (sub) => {
    if (!isSubscriptionIncluded(sub)) return null;
    if (!sub.cost) {
      return { field: 'cost', message: t('onboarding.subscriptions.serviceSelection.validation') };
    }
    if (sub.category === null) {
      return { field: 'category', message: t('onboarding.subscriptions.serviceSelection.categoryRequired') };
    }
    if (sub.autoRenews === false && !sub.endDate?.trim()) {
      return { field: 'endDate', message: t('onboarding.subscriptions.serviceSelection.endDateRequired') };
    }
    if (sub.serviceKey === 'other' && !sub.customName?.trim()) {
      return { field: 'customName', message: t('onboarding.subscriptions.serviceSelection.customNameRequired') };
    }
    return null;
  };

  const validateCurrentCategory = () => {
    const nextErrors = {};
    for (const sub of itemsInCurrentCategory) {
      const err = validateSub(sub);
      if (err) {
        nextErrors[sub.id] = { [err.field]: err.message };
      }
    }
    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleContinue = async () => {
    setValidationError('');

    if (step === 'select') {
      if (isSelfEmployed && !subscriptions.some((s) => s.serviceKey === 'osvcSocial')) {
        // Soft-add OSVČ suggestions if none selected — user can remove on fill step
      }
      if (subscriptions.length === 0) {
        await persistAndExit();
        return;
      }
      setFillCategoryIdx(0);
      setStep('fill');
      return;
    }

    if (!validateCurrentCategory()) {
      const firstInvalidIdx = itemsInCurrentCategory.findIndex((sub) => validateSub(sub) !== null);
      if (firstInvalidIdx !== -1) setActiveSubIdx(firstInvalidIdx);
      return;
    }

    setFieldErrors({});

    if (fillCategoryIdx < fillCategories.length - 1) {
      setFillCategoryIdx((i) => i + 1);
      setActiveSubIdx(0);
      return;
    }

    await persistAndExit();
  };

  const persistAndExit = async () => {
    await completeSection({
      persist: async () => {
        await setData('beaverr_subscriptions', subscriptions);
        await setData(STORAGE_MIGRATED_KEY, true);
      },
      onboardingPatch: { completed: false, currentStep: 'subscriptions', percentComplete: 85 },
      nextRoute: '/(onboarding)/splash-debts',
      routeName: 'subscriptions',
    });
  };

  const handleBack = () => {
    setValidationError('');
    setFieldErrors({});
    if (step === 'fill') {
      if (activeSubIdx > 0) {
        setActiveSubIdx((i) => i - 1);
        return;
      }
      if (fillCategoryIdx > 0) {
        setFillCategoryIdx((i) => i - 1);
        return;
      }
      setStep('select');
      return;
    }
    leaveSection(() => navigateBack());
  };

  const streamingKeys = SUBSCRIPTION_CATALOG.entertainmentStreaming.filter((k) => k !== 'other');
  const streamingCount = subscriptions.filter(
    (s) => isSubscriptionIncluded(s) && streamingKeys.includes(s.serviceKey),
  ).length;
  const streamingMonthlyTotal = subscriptions
    .filter((s) => isSubscriptionIncluded(s) && streamingKeys.includes(s.serviceKey))
    .reduce((sum, s) => sum + toMonthly(parseFloat(s.cost) || 0, s.frequency), 0);

  useEffect(() => {
    setActiveSubIdx(0);
  }, [fillCategoryIdx]);

  const serviceLabel = (key) => {
    const labelKey = serviceLabelKey(key);
    const translated = t(labelKey);
    return translated !== labelKey ? translated : key;
  };

  const categoryTitle = (categoryId) => {
    const key = categoryLabelKey(categoryId);
    const translated = t(key);
    return translated !== key ? translated : categoryId;
  };

  const searchNorm = searchQuery.trim().toLowerCase();

  const filteredCategories = useMemo(() => {
    if (!searchNorm) return SUBSCRIPTION_CATEGORY_ORDER;
    return SUBSCRIPTION_CATEGORY_ORDER.filter((categoryId) => {
      const title = categoryTitle(categoryId).toLowerCase();
      if (title.includes(searchNorm)) return true;
      const services = SUBSCRIPTION_CATALOG[categoryId] || [];
      return services.some((serviceKey) => {
        if (serviceKey === 'other') return false;
        return serviceLabel(serviceKey).toLowerCase().includes(searchNorm);
      });
    });
  }, [searchNorm, t]);

  useEffect(() => {
    if (!searchNorm) return;
    if (filteredCategories.length > 0) {
      setExpandedCategoryId(filteredCategories[0]);
    }
  }, [searchNorm, filteredCategories]);

  const renderSelectStep = () => (
    <View>
      {isSelfEmployed ? (
        <View style={{
          padding: 12,
          backgroundColor: C.infoWashBg,
          borderRadius: R.card,
          borderWidth: 1,
          borderColor: C.border,
          marginBottom: 16,
        }}>
          <Text style={{ ...T.helper, color: C.text }}>
            {t('onboarding.subscriptions.serviceSelection.osvcNote')}
          </Text>
        </View>
      ) : null}

      <LabeledInput
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder={t('onboarding.subscriptions.serviceSelection.searchPlaceholder')}
        containerStyle={{ marginBottom: 16 }}
        accessibilityLabel={t('onboarding.subscriptions.serviceSelection.searchPlaceholder')}
      />

      <Text style={{ ...T.fieldLabel, color: C.muted, marginBottom: 10 }}>
        {t('onboarding.subscriptions.serviceSelection.browseCategories')}
      </Text>

      {filteredCategories.length === 0 ? (
        <Text style={{ ...T.helper, color: C.muted, marginBottom: 16 }}>
          {t('onboarding.subscriptions.serviceSelection.noSearchResults')}
        </Text>
      ) : null}

      {filteredCategories.map((categoryId) => {
        const services = SUBSCRIPTION_CATALOG[categoryId] || [];
        const countLabel = t('onboarding.subscriptions.serviceSelection.suggestionCount', { count: services.filter((s) => s !== 'other').length });
        const title = categoryTitle(categoryId);
        return (
          <SubscriptionCategoryAccordion
            key={categoryId}
            categoryId={categoryId}
            title={title}
            suggestionCount={countLabel}
            selectedCountLabel={(count) => t('onboarding.subscriptions.serviceSelection.selectedInCategory', { count })}
            services={services}
            serviceLabel={serviceLabel}
            isSelected={isSelected}
            onToggleService={toggleService}
            onAddCustom={addCustomToCategory}
            addCustomLabel={t('common.add')}
            expanded={expandedCategoryId === categoryId}
            onToggleExpanded={toggleCategoryExpanded}
            customItems={subscriptions.filter(
              (s) => s.category === categoryId && s.serviceKey === 'other' && s.customName?.trim(),
            )}
            onRemoveCustomItem={removeCustomItem}
            showCustomInput={customPrompt?.category === categoryId}
            customName={customPrompt?.category === categoryId ? customPrompt.name : ''}
            onCustomNameChange={(name) => setCustomPrompt((p) => ({ ...p, name }))}
            onConfirmCustom={confirmCustom}
            onCancelCustom={() => setCustomPrompt(null)}
          />
        );
      })}

      {subscriptions.length > 0 ? (
        <View style={{
          marginTop: 16,
          padding: 16,
          borderRadius: R.card,
          borderWidth: 1,
          borderColor: C.border,
          backgroundColor: C.surface,
        }}>
          <Text style={{ ...T.fieldLabel, color: C.muted, marginBottom: 10 }}>
            {t('onboarding.subscriptions.serviceSelection.addedSoFar', { count: subscriptions.length })}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {subscriptions.map((sub) => (
              <View
                key={sub.id}
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  borderRadius: R.pill,
                  backgroundColor: C.pillSelectedBg,
                }}
              >
                <Text style={{ fontSize: 12, color: C.pillSelectedText, fontWeight: '500' }}>
                  {subscriptionDisplayName(sub, t)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );

  const renderSubFillForm = (sub) => {
    const errors = subFieldErrors(sub.id);
    return (
      <AnimatedSlideIn key={sub.id} visible>
        <View style={{
          marginBottom: 20,
          padding: 16,
          borderRadius: R.card,
          borderWidth: 1,
          borderColor: C.border,
          backgroundColor: C.surface,
        }}>
          {itemsInCurrentCategory.length === 1 ? (
            <Text style={{ fontSize: 15, fontWeight: '600', color: C.text, marginBottom: 12 }}>
              {subscriptionDisplayName(sub, t)}
            </Text>
          ) : null}

          {sub.category === null ? (
            <View style={{ marginBottom: 12 }}>
              <Text style={{ ...T.fieldLabel, color: C.muted, marginBottom: 8 }}>
                {t('onboarding.subscriptions.serviceSelection.pickCategoryLabel')}
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {SUBSCRIPTION_CATEGORY_ORDER.map((catId) => (
                  <SuggestionChip
                    key={catId}
                    label={categoryTitle(catId)}
                    active={false}
                    onPress={() => updateSub(sub.id, { category: catId })}
                    style={{ width: undefined, maxWidth: '100%' }}
                  />
                ))}
              </View>
              {errors.category ? <FieldError message={errors.category} /> : null}
            </View>
          ) : null}

          {sub.serviceKey === 'other' ? (
            <LabeledInput
              label={t('onboarding.subscriptions.serviceSelection.customLabel')}
              value={sub.customName || ''}
              onChangeText={(v) => updateSub(sub.id, { customName: v })}
              placeholder={t('onboarding.subscriptions.serviceSelection.customPlaceholder')}
              containerStyle={{ marginBottom: 12 }}
              errorText={errors.customName}
            />
          ) : null}

          <InputGroup label={t('onboarding.subscriptions.serviceSelection.amountLabel')}>
            <LabeledInput
              value={sub.cost}
              onChangeText={(v) => updateSub(sub.id, { cost: v })}
              numeric
              placeholder={t('onboarding.subscriptions.serviceSelection.amountPlaceholder')}
              large
              inGroup
              currency={currency}
              errorText={errors.cost}
            />
            <FrequencyPills
              options={FREQUENCIES}
              value={sub.frequency}
              onChange={(freq) => updateSub(sub.id, { frequency: freq })}
              small
            />
          </InputGroup>

          <Text style={{ ...T.fieldLabel, color: C.muted, marginTop: 12, marginBottom: 6 }}>
            {t('onboarding.subscriptions.serviceSelection.chargeDayLabel')}
          </Text>
          <DayOfMonthPicker
            value={sub.chargeDay}
            onChange={(v) => updateSub(sub.id, { chargeDay: v })}
            placeholder={t('onboarding.subscriptions.serviceSelection.chargeDayPlaceholder')}
            errorText={errors.chargeDay}
          />

          <Text style={{ ...T.fieldLabel, color: C.muted, marginTop: 16, marginBottom: 8 }}>
            {t('onboarding.subscriptions.serviceSelection.autoRenewLabel')}
          </Text>
          <YesNoToggle
            value={sub.autoRenews}
            onChange={(v) => updateSub(sub.id, { autoRenews: v, ...(v ? {} : {}) })}
            containerStyle={{ marginBottom: 12 }}
          />

          <View style={elevatedDateStyle}>
            <InputGroup
              label={sub.autoRenews === false
                ? t('onboarding.subscriptions.serviceSelection.endDateLabel')
                : t('onboarding.subscriptions.serviceSelection.endDateOptionalLabel')}
              style={{ marginTop: 4 }}
            >
              <SplitDateFields
                value={sub.endDate || ''}
                onChange={(v) => updateSub(sub.id, { endDate: v })}
                onElevatedChange={handleDateElevatedChange}
                inGroup
                yearEnd={new Date().getFullYear() + 10}
                errorText={errors.endDate}
              />
            </InputGroup>
          </View>
        </View>
      </AnimatedSlideIn>
    );
  };

  const renderFillStep = () => {
    const categoryTitleFill = currentFillCategory === '__uncategorized'
      ? t('onboarding.subscriptions.serviceSelection.uncategorizedTitle')
      : categoryTitle(currentFillCategory);
    const showSubTabs = itemsInCurrentCategory.length > 1;
    const activeSub = itemsInCurrentCategory[activeSubIdx] || itemsInCurrentCategory[0];

    return (
      <View>
        <Text style={{ ...T.helper, color: C.muted, marginBottom: 16 }}>
          {t('onboarding.subscriptions.serviceSelection.fillCategoryProgress', {
            category: categoryTitleFill,
            current: fillCategoryIdx + 1,
            total: fillCategories.length,
          })}
        </Text>

        {showSubTabs ? (
          <View style={{
            flexDirection: 'row',
            borderRadius: R.input,
            borderWidth: 1,
            borderColor: C.border,
            overflow: 'hidden',
            marginBottom: 20,
          }}>
            {itemsInCurrentCategory.map((sub, idx) => (
              <OnboardingPressable
                key={sub.id}
                onPress={() => {
                  setActiveSubIdx(idx);
                  setFieldErrors({});
                }}
                style={({ pressed, hovered }) => ({
                  flex: 1,
                  paddingVertical: 10,
                  paddingHorizontal: 8,
                  backgroundColor: listRowBg({ pressed, hovered, selected: activeSubIdx === idx, selectedBg: C.pillSelectedBg }),
                  alignItems: 'center',
                })}
              >
                <Text
                  numberOfLines={1}
                  style={{
                    fontSize: 13,
                    fontWeight: activeSubIdx === idx ? '600' : '500',
                    color: activeSubIdx === idx ? C.pillSelectedText : C.pillUnselectedText,
                  }}
                >
                  {subscriptionDisplayName(sub, t)}
                </Text>
              </OnboardingPressable>
            ))}
          </View>
        ) : null}

        {activeSub ? renderSubFillForm(activeSub) : null}
      </View>
    );
  };

  const progress = 85;
  const screenProgress = isEditMode ? undefined : progress;

  const title = step === 'select'
    ? t('onboarding.subscriptions.serviceSelection.title')
    : t('onboarding.subscriptions.serviceSelection.fillTitle');

  const helper = step === 'select'
    ? t('onboarding.subscriptions.serviceSelection.helper')
    : t('onboarding.subscriptions.serviceSelection.fillHelper');

  return (
    <QuestionScreen
      illustration={<PaymentInformationBroIllustration width={layout.illustrationWidth} />}
      chapter={t('onboarding.subscriptions.chapter')}
      title={title}
      helper={helper}
      onContinue={handleContinue}
      onBack={handleBack}
      validationError={step === 'select' ? validationError : ''}
      setValidationError={setValidationError}
      continueLabel={editContinueLabel}
      animationKey={step === 'fill' ? `${fillCategoryIdx}-${activeSubIdx}` : step}
    >
      {step === 'select' ? renderSelectStep() : renderFillStep()}

      {step === 'select' ? (
        <AnimatedSlideIn visible={streamingCount >= 3}>
          <View style={{
            marginTop: 16,
            padding: 12,
            backgroundColor: 'rgba(245,158,11,0.08)',
            borderRadius: R.card,
            borderWidth: 1,
            borderColor: 'rgba(245,158,11,0.2)',
          }}>
            <Text style={{ fontSize: 13, color: '#92400E', lineHeight: 20 }}>
              {t('onboarding.subscriptions.serviceSelection.streamingFlag', {
                count: streamingCount,
                amount: formatCurrency(streamingMonthlyTotal, currency),
              })}
            </Text>
          </View>
        </AnimatedSlideIn>
      ) : null}
    </QuestionScreen>
  );
}
