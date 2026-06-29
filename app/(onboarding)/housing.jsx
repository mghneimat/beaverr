import { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import OnboardingPressable from '../../components/onboarding/OnboardingPressable';
import { washBg } from '../../components/onboarding/pressableFeedback';
import SkipButton from '../../components/onboarding/SkipButton';
import { useRouter } from 'expo-router';
import { useI18n } from '../../lib/i18n';
import { navigateBack, navigateForward } from '../../lib/onboardingNavigation';
import { getData, setData } from '../../lib/storage';
import { getCurrencySymbol } from '../../lib/currency';
import { useOnboardingLayout } from '../../lib/onboardingLayout';
import { formatCurrency } from '../../lib/finance';
import {
  UTILITY_CATEGORY_ORDER,
  UTILITY_CATALOG,
  UTILITY_FREQUENCIES,
  utilityCategoryLabelKey,
  utilityLabelKey,
  emptyUtilityItem,
  utilityDisplayName,
  migrateUtilityItemsFromHousing,
  computeUtilitiesMonthlyTotal,
} from '../../lib/housingUtilities';
import { C, S, T, R } from '../../constants/onboarding-theme';
import QuestionScreen from '../../components/onboarding/QuestionScreen';
import BroadcastIllustration from '../../components/onboarding/BroadcastIllustration';
import ApartmentRentRafikiIllustration from '../../components/onboarding/ApartmentRentRafikiIllustration';
import PropertyAgreementIllustration from '../../components/onboarding/PropertyAgreementIllustration';
import PrintingInvoicesRafikiIllustration from '../../components/onboarding/PrintingInvoicesRafikiIllustration';
import InvoiceRafikiIllustration from '../../components/onboarding/InvoiceRafikiIllustration';
import TaxRafikiIllustration from '../../components/onboarding/TaxRafikiIllustration';
import OptionCard from '../../components/onboarding/OptionCard';
import OptionCardGroup from '../../components/onboarding/OptionCardGroup';
import OnOffSwitch from '../../components/onboarding/OnOffSwitch';
import SplitDateFields from '../../components/onboarding/SplitDateFields';
import AnimatedSlideIn from '../../components/onboarding/AnimatedSlideIn';
import AddAnotherButton from '../../components/onboarding/AddAnotherButton';
import RevealAfterToggle from '../../components/onboarding/RevealAfterToggle';
import AnimatedRow from '../../components/onboarding/AnimatedRow';
import DeleteTextButton from '../../components/onboarding/DeleteTextButton';
import {
  ensureVisibleContributionRow,
  loadContributionRowsFromSaved,
} from '../../lib/housing/contributionRows';
import OptionalPaymentDatesFields from '../../components/onboarding/OptionalPaymentDatesFields';
import LabeledInput from '../../components/onboarding/LabeledInput';
import YesNoToggle from '../../components/onboarding/YesNoToggle';
import FrequencyPills from '../../components/onboarding/FrequencyPills';
import OnboardingFillItemList from '../../components/onboarding/OnboardingFillItemList';
import CardHeaderActionButton from '../../components/dashboard/CardHeaderActionButton';
import CostCard from '../../components/onboarding/CostCard';
import InputGroup from '../../components/onboarding/InputGroup';
import ScrollFocusAnchor from '../../components/onboarding/ScrollFocusAnchor';
import OnboardingCategoryAccordion from '../../components/onboarding/OnboardingCategoryAccordion';
import UtilityCategoryIcon from '../../components/onboarding/UtilityCategoryIcon';
import { useSectionExit } from '../../lib/finishOnboardingSection';
import {
  buildWasteTaxMemberSummary,
  estimateAnnualWasteTax,
  shouldEstimateCzechWasteTax,
} from '../../lib/wasteTax';
import {
  buildHousingPayload,
  HOUSING_ROW_VALIDATION_KEYS,
  HOUSING_UTILITY_ERROR_KEYS,
  resolveHousingBack,
  resolveHousingContinue,
} from '../../lib/housing/housingFlow';

/**
 * housingStatus — Housing type (renting / own / family)
 * rentDetails — Monthly rent (renting)
 * rentUtilities — Utilities (renting)
 * housingUtilities — Internet (all paths)
 * mortgageStatus — Mortgage toggle (own)
 * mortgageDetails — Mortgage payment (mortgage)
 * ownershipCosts — Other ownership costs (own)
 * familyHousing — Family contribution (family)
 * govtTaxes — Government & city taxes (all)
 */
export default function HousingScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const layout = useOnboardingLayout();
  const { isEditMode, completeSection, leaveSection, editContinueLabel } = useSectionExit();

  // ── Loaded data ──
  const [currencyCode, setCurrencyCode] = useState('CZK');
  const currency = getCurrencySymbol(currencyCode);

  // ── Step tracking ──
  const [step, setStep] = useState('housing-status');

  // ── housingStatus: Housing type ──
  const [housingType, setHousingType] = useState(null); // 'renting' | 'own' | 'family'

  // ── rentDetails: Monthly rent ──
  const [rentAmount, setRentAmount] = useState('');
  const [rentEndDate, setRentEndDate] = useState('');
  const [rentDueDate, setRentDueDate] = useState('');
  const [rentChargeDay, setRentChargeDay] = useState('');

  // ── rentUtilities: Utilities ──
  const [utilitiesMode, setUtilitiesMode] = useState('total'); // 'total' | 'itemized'
  const [utilitiesAmount, setUtilitiesAmount] = useState('');
  const [utilitiesFrequency, setUtilitiesFrequency] = useState('monthly');
  const [utilitiesItemStep, setUtilitiesItemStep] = useState('select'); // 'select' | 'fill'
  const [utilitySelections, setUtilitySelections] = useState([]);
  const [activeUtilityIdx, setActiveUtilityIdx] = useState(0);
  const [customUtilityPrompt, setCustomUtilityPrompt] = useState(null);
  const [utilityFieldErrors, setUtilityFieldErrors] = useState({});
  const [otherCostFieldErrors, setOtherCostFieldErrors] = useState({});
  const [familyContributionFieldErrors, setFamilyContributionFieldErrors] = useState({});
  const [utilitySearchQuery, setUtilitySearchQuery] = useState('');
  const [expandedUtilityCategoryId, setExpandedUtilityCategoryId] = useState(null);

  // ── housingUtilities: Internet ──
  const [hasInternet, setHasInternet] = useState(false);
  const [internetAmount, setInternetAmount] = useState('');
  const [internetEndDate, setInternetEndDate] = useState('');
  const [internetDueDate, setInternetDueDate] = useState('');
  const [internetChargeDay, setInternetChargeDay] = useState('');
  const [internetFrequency, setInternetFrequency] = useState('monthly');

  // ── mortgageStatus: Mortgage toggle ──
  const [hasMortgage, setHasMortgage] = useState(false);

  // ── mortgageDetails: Mortgage payment ──
  const [mortgageAmount, setMortgageAmount] = useState('');
  const [mortgageEndDate, setMortgageEndDate] = useState('');

  // ── ownershipCosts: Other ownership costs ──
  const [hasOtherCosts, setHasOtherCosts] = useState(false);
  const [otherCostRows, setOtherCostRows] = useState([
    { id: 0, amount: '', description: '', dueDate: '', visible: true },
  ]);
  const nextCostRowId = useRef(1);

  // ── familyHousing: Family contribution ──
  const [contributesToFamily, setContributesToFamily] = useState(false);
  const [familyContributionRows, setFamilyContributionRows] = useState([
    { id: 0, amount: '', description: '', dueDate: '', visible: true },
  ]);
  const nextFamilyRowId = useRef(1);

  // ── govtTaxes: Government taxes ──
  const [household, setHousehold] = useState(null);
  const [location, setLocation] = useState(null);
  const [wasteTax, setWasteTax] = useState(true);
  const [wasteTaxAmount, setWasteTaxAmount] = useState('1080');
  const [wasteTaxUserEdited, setWasteTaxUserEdited] = useState(false);
  const [tvLicence, setTvLicence] = useState(true);
  const [tvLicenceAmount, setTvLicenceAmount] = useState('1620');
  const [radioLicence, setRadioLicence] = useState(true);
  const [radioLicenceAmount, setRadioLicenceAmount] = useState('540');
  const [customTaxItems, setCustomTaxItems] = useState([]);
  const nextTaxItemId = useRef(0);
  const [focusToken, setFocusToken] = useState(null);

  // ── Validation ──
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    async function loadData() {
      const loc = await getData('beaverr_location');
      if (loc?.currency) setCurrencyCode(loc.currency);
      setLocation(loc || null);

      const hh = await getData('beaverr_household');
      setHousehold(hh || null);

      const saved = await getData('beaverr_housing');
      if (saved) {
        if (saved.type) setHousingType(saved.type);
        if (saved.rent) setRentAmount(String(saved.rent));
        if (saved.rentEndDate) setRentEndDate(saved.rentEndDate);
        if (saved.rentDueDate) setRentDueDate(saved.rentDueDate);
        if (saved.rentChargeDay != null) setRentChargeDay(String(saved.rentChargeDay));
        if (saved.utilitiesMode) setUtilitiesMode(saved.utilitiesMode);
        if (saved.utilities) setUtilitiesAmount(String(saved.utilities));
        if (saved.utilitiesFrequency) setUtilitiesFrequency(saved.utilitiesFrequency);
        setUtilitySelections(migrateUtilityItemsFromHousing(saved));
        if (saved.hasInternet !== undefined) setHasInternet(saved.hasInternet);
        if (saved.internetAmount) setInternetAmount(String(saved.internetAmount));
        if (saved.internetFrequency) setInternetFrequency(saved.internetFrequency);
        if (saved.internetEndDate) setInternetEndDate(saved.internetEndDate);
        if (saved.internetDueDate) setInternetDueDate(saved.internetDueDate);
        if (saved.internetChargeDay != null) setInternetChargeDay(String(saved.internetChargeDay));
        if (saved.hasMortgage !== undefined) setHasMortgage(saved.hasMortgage);
        if (saved.mortgageAmount) setMortgageAmount(String(saved.mortgageAmount));
        if (saved.mortgageEndDate) setMortgageEndDate(saved.mortgageEndDate);
        if (saved.hasOtherCosts !== undefined) setHasOtherCosts(saved.hasOtherCosts);
        if (saved.hasOtherCosts === true || saved.otherCostRows) {
          setOtherCostRows(loadContributionRowsFromSaved(
            saved.otherCostRows,
            saved.hasOtherCosts === true,
            nextCostRowId,
          ));
        }
        if (saved.contributesToFamily !== undefined) setContributesToFamily(saved.contributesToFamily);
        if (saved.contributesToFamily === true || saved.familyContributionRows) {
          setFamilyContributionRows(loadContributionRowsFromSaved(
            saved.familyContributionRows,
            saved.contributesToFamily === true,
            nextFamilyRowId,
          ));
        }
        if (saved.govtTaxes) {
          const userEdited = saved.govtTaxes.wasteTaxUserEdited === true;
          setWasteTaxUserEdited(userEdited);
          setWasteTax(saved.govtTaxes.wasteTax ?? true);
          if (userEdited && saved.govtTaxes.wasteTaxAmount != null) {
            setWasteTaxAmount(String(saved.govtTaxes.wasteTaxAmount));
          } else if (shouldEstimateCzechWasteTax(loc)) {
            setWasteTaxAmount(String(estimateAnnualWasteTax(hh)));
          } else if (saved.govtTaxes.wasteTaxAmount != null) {
            setWasteTaxAmount(String(saved.govtTaxes.wasteTaxAmount));
          }
          setTvLicence(saved.govtTaxes.tvLicence ?? true);
          setTvLicenceAmount(saved.govtTaxes.tvLicenceAmount != null ? String(saved.govtTaxes.tvLicenceAmount) : '1620');
          setRadioLicence(saved.govtTaxes.radioLicence ?? true);
          setRadioLicenceAmount(saved.govtTaxes.radioLicenceAmount != null ? String(saved.govtTaxes.radioLicenceAmount) : '540');
          if (saved.govtTaxes.customItems) {
            setCustomTaxItems(saved.govtTaxes.customItems.map((item, i) => ({ ...item, id: i, visible: true, frequency: item.frequency || 'annual' })));
            nextTaxItemId.current = saved.govtTaxes.customItems.length;
          }
        }
      } else if (shouldEstimateCzechWasteTax(loc)) {
        setWasteTaxAmount(String(estimateAnnualWasteTax(hh)));
      }

      if (isEditMode) setStep('housing-status');
    }
    loadData();
  }, [isEditMode]);

  const handleContinue = async () => {
    setValidationError('');

    if (isEditMode) {
      await saveAll();
      return;
    }

    const result = resolveHousingContinue({
      step,
      housingType,
      utilitiesMode,
      utilitiesItemStep,
      utilitySelections,
      rentAmount,
      hasInternet,
      internetAmount,
      hasMortgage,
      mortgageAmount,
      hasOtherCosts,
      otherCostRows,
      contributesToFamily,
      familyContributionRows,
    });

    if (result.type === 'validationError') {
      setValidationError(t(result.key));
      return;
    }
    if (result.type === 'utilityFill') {
      setUtilityFieldErrors({});
      setActiveUtilityIdx(0);
      setUtilitiesItemStep('fill');
      return;
    }
    if (result.type === 'validateUtilities') {
      const localizedErrors = {};
      utilitySelections.forEach((item) => {
        if (result.errors[item.id]?.amount) {
          localizedErrors[item.id] = { amount: t(HOUSING_UTILITY_ERROR_KEYS.amount) };
        } else if (result.errors[item.id]?.customLabel) {
          localizedErrors[item.id] = { customLabel: t(HOUSING_UTILITY_ERROR_KEYS.customLabel) };
        }
      });
      setUtilityFieldErrors(localizedErrors);
      setActiveUtilityIdx(result.firstInvalidIdx);
      return;
    }
    if (result.type === 'validateRows') {
      const localizedErrors = {};
      const rows = result.step === 'ownership-costs' ? otherCostRows : familyContributionRows;
      rows.filter((row) => row.visible).forEach((row) => {
        if (result.errors[row.id]) {
          localizedErrors[row.id] = {
            description: t(HOUSING_ROW_VALIDATION_KEYS[result.step]),
          };
        }
      });
      if (result.step === 'ownership-costs') setOtherCostFieldErrors(localizedErrors);
      else setFamilyContributionFieldErrors(localizedErrors);
      setFocusToken(String(result.firstInvalidId));
      return;
    }
    if (result.type === 'nextStep') {
      setStep(result.step);
      return;
    }
    if (result.type === 'complete') {
      await saveAll();
    }
  };

  const saveAll = async () => {
    const housingData = buildHousingPayload({
      housingType,
      rentAmount,
      rentEndDate,
      rentDueDate,
      rentChargeDay,
      utilitiesMode,
      utilitiesAmount,
      utilitiesFrequency,
      utilitySelections,
      hasInternet,
      internetAmount,
      internetFrequency,
      internetEndDate,
      internetDueDate,
      internetChargeDay,
      hasMortgage,
      mortgageAmount,
      mortgageEndDate,
      hasOtherCosts,
      otherCostRows,
      contributesToFamily,
      familyContributionRows,
      wasteTax,
      wasteTaxAmount,
      wasteTaxUserEdited,
      location,
      household,
      tvLicence,
      tvLicenceAmount,
      radioLicence,
      radioLicenceAmount,
      customTaxItems,
    });

    await completeSection({
      persist: async () => { await setData('beaverr_housing', housingData); },
      onboardingPatch: { completed: false, currentStep: 'housing', percentComplete: 65 },
      nextRoute: '/(onboarding)/splash-transport',
      routeName: 'housing',
    });
  };

  const handleBack = () => {
    setValidationError('');
    const result = resolveHousingBack({
      step,
      housingType,
      utilitiesMode,
      utilitiesItemStep,
      utilitySelections,
      activeUtilityIdx,
      hasMortgage,
    });

    if (result.type === 'utilityPrevItem') {
      setActiveUtilityIdx((i) => i - 1);
      return;
    }
    if (result.type === 'utilityBack') {
      setUtilitiesItemStep('select');
      setUtilityFieldErrors({});
      return;
    }
    if (result.type === 'setStep') {
      if (result.restoreUtilitiesFill) {
        setUtilitiesItemStep('fill');
        setActiveUtilityIdx(result.utilityFillIdx ?? 0);
      }
      setStep(result.step);
      return;
    }
    leaveSection(() => navigateBack());
  };

  // ── Helpers for repeating rows ──
  const handleHasOtherCostsChange = (value) => {
    setHasOtherCosts(value);
    if (value === true) {
      setOtherCostRows((rows) => ensureVisibleContributionRow(rows, nextCostRowId));
    }
  };

  const handleContributesToFamilyChange = (value) => {
    setContributesToFamily(value);
    if (value === true) {
      setFamilyContributionRows((rows) => ensureVisibleContributionRow(rows, nextFamilyRowId));
    }
  };

  const addCostRow = () => {
    const id = nextCostRowId.current++;
    setOtherCostRows([...otherCostRows, { id, amount: '', description: '', dueDate: '', visible: true }]);
    setFocusToken(String(id));
  };

  const updateCostRow = (index, field, value) => {
    const rows = [...otherCostRows];
    rows[index] = { ...rows[index], [field]: value };
    setOtherCostRows(rows);
    const rowId = rows[index].id;
    setOtherCostFieldErrors((prev) => {
      if (!prev[rowId]?.[field]) return prev;
      const nextRow = { ...prev[rowId] };
      delete nextRow[field];
      if (Object.keys(nextRow).length === 0) {
        const { [rowId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [rowId]: nextRow };
    });
  };

  const removeCostRow = (id) => {
    if (otherCostRows.length <= 1) return;
    setOtherCostRows(otherCostRows.map(r => r.id === id ? { ...r, visible: false } : r));
  };

  const finalizeRemoveCost = (id) => {
    setOtherCostRows((prev) => prev.filter(r => r.id !== id));
  };

  const addFamilyRow = () => {
    const id = nextFamilyRowId.current++;
    setFamilyContributionRows([...familyContributionRows, { id, amount: '', description: '', dueDate: '', visible: true }]);
    setFocusToken(String(id));
  };

  const updateFamilyRow = (index, field, value) => {
    const rows = [...familyContributionRows];
    rows[index] = { ...rows[index], [field]: value };
    setFamilyContributionRows(rows);
    const rowId = rows[index].id;
    setFamilyContributionFieldErrors((prev) => {
      if (!prev[rowId]?.[field]) return prev;
      const nextRow = { ...prev[rowId] };
      delete nextRow[field];
      if (Object.keys(nextRow).length === 0) {
        const { [rowId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [rowId]: nextRow };
    });
  };

  const removeFamilyRow = (id) => {
    if (familyContributionRows.length <= 1) return;
    setFamilyContributionRows(familyContributionRows.map(r => r.id === id ? { ...r, visible: false } : r));
  };

  const finalizeRemoveFamily = (id) => {
    setFamilyContributionRows((prev) => prev.filter(r => r.id !== id));
  };

  const isUtilitySelected = (categoryId, key) =>
    utilitySelections.some((item) => item.category === categoryId && item.key === key && key !== 'other');

  const toggleUtility = (categoryId, key) => {
    if (isUtilitySelected(categoryId, key)) {
      setUtilitySelections((prev) => prev.filter(
        (item) => !(item.category === categoryId && item.key === key),
      ));
      return;
    }
    setUtilitySelections((prev) => [...prev, emptyUtilityItem(categoryId, key)]);
  };

  const removeUtilityItem = (id) => {
    setUtilitySelections((prev) => prev.filter((item) => item.id !== id));
  };

  const addCustomUtilityToCategory = (categoryId) => {
    setExpandedUtilityCategoryId(categoryId);
    setCustomUtilityPrompt({ category: categoryId, name: '' });
  };

  const toggleUtilityCategoryExpanded = (categoryId) => {
    if (expandedUtilityCategoryId === categoryId) {
      if (customUtilityPrompt?.category === categoryId) setCustomUtilityPrompt(null);
      setExpandedUtilityCategoryId(null);
      return;
    }
    if (customUtilityPrompt) setCustomUtilityPrompt(null);
    setExpandedUtilityCategoryId(categoryId);
  };

  const confirmCustomUtility = () => {
    const name = customUtilityPrompt?.name?.trim();
    if (!name || !customUtilityPrompt?.category) {
      setCustomUtilityPrompt(null);
      return;
    }
    setUtilitySelections((prev) => [
      ...prev,
      emptyUtilityItem(customUtilityPrompt.category, 'other', name),
    ]);
    setCustomUtilityPrompt(null);
  };

  const updateUtilityItem = (id, patch) => {
    setUtilitySelections((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
    setUtilityFieldErrors((prev) => {
      if (!prev[id]) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const utilityItemErrors = (id) => utilityFieldErrors[id] || {};

  const handleUtilitiesModeChange = (mode) => {
    setUtilitiesMode(mode);
    setUtilitiesItemStep('select');
    setUtilityFieldErrors({});
    setCustomUtilityPrompt(null);
    setExpandedUtilityCategoryId(null);
    setUtilitySearchQuery('');
  };

  const utilityItemLabel = (key) => {
    const labelKey = utilityLabelKey(key);
    const translated = t(labelKey);
    return translated !== labelKey ? translated : key;
  };

  const utilityCategoryTitle = (categoryId) => {
    const labelKey = utilityCategoryLabelKey(categoryId);
    const translated = t(labelKey);
    return translated !== labelKey ? translated : categoryId;
  };

  useEffect(() => {
    if (step !== 'rent-utilities' || utilitiesMode !== 'itemized' || utilitiesItemStep === 'fill') return;
    const norm = utilitySearchQuery.trim().toLowerCase();
    if (!norm) return;
    const filtered = UTILITY_CATEGORY_ORDER.filter((categoryId) => {
      const title = utilityCategoryTitle(categoryId).toLowerCase();
      if (title.includes(norm)) return true;
      return (UTILITY_CATALOG[categoryId] || []).some(
        (key) => utilityItemLabel(key).toLowerCase().includes(norm),
      );
    });
    if (filtered.length > 0) setExpandedUtilityCategoryId(filtered[0]);
  }, [step, utilitiesMode, utilitiesItemStep, utilitySearchQuery, t]);

  const addCustomTaxItem = () => {
    const id = nextTaxItemId.current++;
    setCustomTaxItems([...customTaxItems, { id, name: '', amount: '', frequency: 'annual', visible: true }]);
    setFocusToken(String(id));
  };

  const updateCustomTaxItem = (index, field, value) => {
    const items = [...customTaxItems];
    items[index] = { ...items[index], [field]: value };
    setCustomTaxItems(items);
  };

  const removeCustomTaxItem = (id) => {
    setCustomTaxItems(customTaxItems.map(item => item.id === id ? { ...item, visible: false } : item));
  };

  const finalizeRemoveTaxItem = (id) => {
    setCustomTaxItems((prev) => prev.filter(item => item.id !== id));
  };

  // ── Progress calculation ──
  // ── housingStatus: Housing type ──
  if (step === 'housing-status') {
    const options = ['renting', 'own', 'family'];

    return (
      <QuestionScreen
        progressStep={step}
        animationKey={step}
        chapter={t('onboarding.housing.chapter')}
        title={t('onboarding.housing.housingStatus.title')}
        helper={t('onboarding.housing.housingStatus.helper')}
        illustration={<ApartmentRentRafikiIllustration width={layout.illustrationWidth} />}
        onContinue={handleContinue}
        onBack={handleBack}
        validationError={validationError}
        setValidationError={setValidationError}

        continueLabel={editContinueLabel}
      >
        <View style={{ gap: 0 }}>
          {options.map((key) => (
            <OptionCard
              key={key}
              label={t(`onboarding.housing.housingStatus.${key}`)}
              selected={housingType === key}
              onPress={() => setHousingType(key)}
            />
          ))}
        </View>
      </QuestionScreen>
    );
  }

  // ── rentDetails: Monthly rent ──
  if (step === 'rent-details') {
    return (
      <QuestionScreen
        progressStep={step}
        animationKey={step}
        chapter={t('onboarding.housing.chapter')}
        title={t('onboarding.housing.rentDetails.title')}
        helper={t('onboarding.housing.rentDetails.helper')}
        illustration={<ApartmentRentRafikiIllustration width={layout.illustrationWidth} />}
        onContinue={handleContinue}
        onBack={handleBack}
        validationError={validationError}
        setValidationError={setValidationError}

        continueLabel={editContinueLabel}
      >
        <InputGroup label={t('onboarding.housing.rentDetails.amountLabel')}>
          <LabeledInput
            value={rentAmount}
            onChangeText={setRentAmount}
            numeric
            placeholder="0"
            large
            inGroup
            currency={currency}
          />
        </InputGroup>
        <OptionalPaymentDatesFields
          values={{ rentEndDate, rentDueDate, rentChargeDay }}
          onChange={(patch) => {
            if (patch.rentEndDate !== undefined) setRentEndDate(patch.rentEndDate);
            if (patch.rentDueDate !== undefined) setRentDueDate(patch.rentDueDate);
            if (patch.rentChargeDay !== undefined) setRentChargeDay(patch.rentChargeDay);
          }}
          prefix="rent"
        />
      </QuestionScreen>
    );
  }

  // ── rentUtilities: Utilities ──
  if (step === 'rent-utilities') {
    const utilitiesSum = computeUtilitiesMonthlyTotal(utilitySelections);
    const isItemizedFill = utilitiesMode === 'itemized' && utilitiesItemStep === 'fill';
    const showUtilityTabs = isItemizedFill && utilitySelections.length > 1;
    const activeUtility = utilitySelections[activeUtilityIdx] || utilitySelections[0];
    const rentUtilitiesTitle = isItemizedFill
      ? t('onboarding.housing.rentUtilities.fillTitle')
      : t('onboarding.housing.rentUtilities.title');
    const rentUtilitiesHelper = isItemizedFill
      ? t('onboarding.housing.rentUtilities.fillHelper')
      : (utilitiesMode === 'itemized'
        ? t('onboarding.housing.rentUtilities.selectHelper')
        : t('onboarding.housing.rentUtilities.helper'));

    const utilitySearchNorm = utilitySearchQuery.trim().toLowerCase();
    const filteredUtilityCategories = !utilitySearchNorm
      ? UTILITY_CATEGORY_ORDER
      : UTILITY_CATEGORY_ORDER.filter((categoryId) => {
        const title = utilityCategoryTitle(categoryId).toLowerCase();
        if (title.includes(utilitySearchNorm)) return true;
        return (UTILITY_CATALOG[categoryId] || []).some(
          (key) => utilityItemLabel(key).toLowerCase().includes(utilitySearchNorm),
        );
      });

    const renderUtilityFillForm = (item) => {
      const errors = utilityItemErrors(item.id);
      return (
        <AnimatedSlideIn key={item.id} visible>
          <View style={{
            marginBottom: 20,
            padding: 16,
            borderRadius: R.card,
            borderWidth: 1,
            borderColor: C.border,
            backgroundColor: C.surface,
          }}>
            {utilitySelections.length === 1 ? (
              <Text style={{ fontSize: 15, fontWeight: '600', color: C.text, marginBottom: 12 }}>
                {utilityDisplayName(item, t)}
              </Text>
            ) : null}

            {item.key === 'other' ? (
              <LabeledInput
                label={t('onboarding.housing.rentUtilities.otherUtilityLabel')}
                value={item.customLabel || ''}
                onChangeText={(v) => updateUtilityItem(item.id, { customLabel: v })}
                placeholder={t('onboarding.housing.rentUtilities.otherUtilityPlaceholder')}
                containerStyle={{ marginBottom: 12 }}
                errorText={errors.customLabel}
              />
            ) : null}

            <InputGroup label={t('onboarding.housing.rentUtilities.amountLabel')}>
              <LabeledInput
                value={item.amount}
                onChangeText={(v) => updateUtilityItem(item.id, { amount: v })}
                numeric
                placeholder="0"
                large
                inGroup
                currency={currency}
                errorText={errors.amount}
              />
              <FrequencyPills
                options={UTILITY_FREQUENCIES}
                value={item.frequency}
                onChange={(freq) => updateUtilityItem(item.id, { frequency: freq })}
                labelMap={{
                  monthly: t('onboarding.housing.rentUtilities.frequencyMonthly'),
                  quarterly: t('onboarding.housing.rentUtilities.frequencyQuarterly'),
                  annual: t('onboarding.housing.rentUtilities.frequencyAnnual'),
                }}
                small
              />
            </InputGroup>
          </View>
        </AnimatedSlideIn>
      );
    };

    return (
      <QuestionScreen
        animationKey={isItemizedFill ? `rent-utilities-fill-${activeUtilityIdx}` : 'rent-utilities'}
        chapter={t('onboarding.housing.chapter')}
        title={rentUtilitiesTitle}
        helper={rentUtilitiesHelper}
        illustration={<PrintingInvoicesRafikiIllustration width={layout.illustrationWidth} />}
        onContinue={handleContinue}
        onBack={handleBack}
        validationError={validationError}
        setValidationError={setValidationError}

        continueLabel={editContinueLabel}
      >
        {!isItemizedFill ? (
          <>
            <Text style={{ ...T.fieldLabel, marginBottom: S.labelGap }}>
              {t('onboarding.housing.rentUtilities.modeLabel')}
            </Text>
            <OptionCardGroup marginBottom={16}>
              <OptionCard
                label={t('onboarding.housing.rentUtilities.modeTotal')}
                selected={utilitiesMode === 'total'}
                onPress={() => handleUtilitiesModeChange('total')}
              />
              <OptionCard
                label={t('onboarding.housing.rentUtilities.modeItemized')}
                selected={utilitiesMode === 'itemized'}
                onPress={() => handleUtilitiesModeChange('itemized')}
              />
            </OptionCardGroup>

            <AnimatedSlideIn visible={utilitiesMode === 'total'}>
              <InputGroup label={t('onboarding.housing.rentUtilities.amountLabel')}>
                <LabeledInput
                  value={utilitiesAmount}
                  onChangeText={setUtilitiesAmount}
                  numeric
                  placeholder="0"
                  large
                  inGroup
                  currency={currency}
                />
                <FrequencyPills
                  options={UTILITY_FREQUENCIES}
                  value={utilitiesFrequency}
                  onChange={setUtilitiesFrequency}
                  labelMap={{
                    monthly: t('onboarding.housing.rentUtilities.frequencyMonthly'),
                    quarterly: t('onboarding.housing.rentUtilities.frequencyQuarterly'),
                    annual: t('onboarding.housing.rentUtilities.frequencyAnnual'),
                  }}
                  small
                />
              </InputGroup>
            </AnimatedSlideIn>

            <AnimatedSlideIn visible={utilitiesMode === 'itemized'}>
              <LabeledInput
                value={utilitySearchQuery}
                onChangeText={setUtilitySearchQuery}
                placeholder={t('onboarding.housing.rentUtilities.searchPlaceholder')}
                containerStyle={{ marginBottom: 16 }}
                accessibilityLabel={t('onboarding.housing.rentUtilities.searchPlaceholder')}
              />

              <Text style={{ ...T.fieldLabel, color: C.muted, marginBottom: 10 }}>
                {t('onboarding.housing.rentUtilities.browseCategories')}
              </Text>

              {filteredUtilityCategories.length === 0 ? (
                <Text style={{ ...T.helper, color: C.muted, marginBottom: 16 }}>
                  {t('onboarding.housing.rentUtilities.noSearchResults')}
                </Text>
              ) : null}

              {filteredUtilityCategories.map((categoryId) => {
                const keys = UTILITY_CATALOG[categoryId] || [];
                const countLabel = t('onboarding.housing.rentUtilities.suggestionCount', {
                  count: keys.length,
                });
                return (
                  <OnboardingCategoryAccordion
                    key={categoryId}
                    categoryId={categoryId}
                    title={utilityCategoryTitle(categoryId)}
                    suggestionCount={countLabel}
                    selectedCountLabel={(count) => t('onboarding.housing.rentUtilities.selectedInCategory', { count })}
                    itemKeys={keys}
                    itemLabel={utilityItemLabel}
                    isItemSelected={isUtilitySelected}
                    onToggleItem={toggleUtility}
                    onAddCustom={addCustomUtilityToCategory}
                    addCustomLabel={t('common.add')}
                    expanded={expandedUtilityCategoryId === categoryId}
                    onToggleExpanded={toggleUtilityCategoryExpanded}
                    customItems={utilitySelections.filter(
                      (item) => item.category === categoryId && item.key === 'other' && item.customLabel?.trim(),
                    ).map((item) => ({ id: item.id, customName: item.customLabel }))}
                    onRemoveCustomItem={removeUtilityItem}
                    showCustomInput={customUtilityPrompt?.category === categoryId}
                    customName={customUtilityPrompt?.category === categoryId ? customUtilityPrompt.name : ''}
                    onCustomNameChange={(name) => setCustomUtilityPrompt((p) => ({ ...p, name }))}
                    onConfirmCustom={confirmCustomUtility}
                    onCancelCustom={() => setCustomUtilityPrompt(null)}
                    customPlaceholder={t('onboarding.housing.rentUtilities.otherUtilityPlaceholder')}
                    customAccessibilityLabel={t('onboarding.housing.rentUtilities.otherUtilityLabel')}
                    cancelAccessibilityLabel={t('common.cancel')}
                    renderIcon={(id) => <UtilityCategoryIcon categoryId={id} size={40} />}
                  />
                );
              })}

              {utilitySelections.length > 0 ? (
                <View style={{
                  marginTop: 16,
                  padding: 16,
                  borderRadius: R.card,
                  borderWidth: 1,
                  borderColor: C.border,
                  backgroundColor: C.surface,
                }}>
                  <Text style={{ ...T.fieldLabel, color: C.muted, marginBottom: 10 }}>
                    {t('onboarding.housing.rentUtilities.addedSoFar', { count: utilitySelections.length })}
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {utilitySelections.map((item) => (
                      <View
                        key={item.id}
                        style={{
                          paddingVertical: 8,
                          paddingHorizontal: 12,
                          borderRadius: R.pill,
                          backgroundColor: C.chipSelectedBg,
                        }}
                      >
                        <Text style={{ fontSize: 12, color: C.chipSelectedText, fontWeight: '500' }}>
                          {utilityDisplayName(item, t)}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              ) : null}
            </AnimatedSlideIn>
          </>
        ) : (
          <>
            {showUtilityTabs ? (
              <OnboardingFillItemList
                label={t('common.fillSectionItemsLabel')}
                items={utilitySelections}
                getItemKey={(item) => item.id}
                getItemLabel={(item) => utilityDisplayName(item, t)}
                activeIndex={activeUtilityIdx}
                onSelectIndex={(idx) => {
                  setActiveUtilityIdx(idx);
                  setUtilityFieldErrors({});
                }}
                getItemComplete={(item) => parseFloat(item.amount) > 0}
                getItemHasError={(item) => Object.keys(utilityItemErrors(item.id)).length > 0}
              />
            ) : null}

            {activeUtility ? renderUtilityFillForm(activeUtility) : null}

            {utilitiesSum > 0 ? (
              <View style={{
                marginTop: 4,
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderRadius: R.input,
                backgroundColor: C.bg,
                borderWidth: 1,
                borderColor: C.border,
                alignItems: 'center',
              }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: C.muted }}>
                  {t('onboarding.housing.rentUtilities.utilitiesSumMonthly', {
                    amount: formatCurrency(utilitiesSum, currency),
                  })}
                </Text>
              </View>
            ) : null}
          </>
        )}

        {!isItemizedFill ? (
          <SkipButton
            label={t('onboarding.housing.rentUtilities.skip')}
            onPress={() => {
              setUtilitiesAmount('');
              setUtilitySelections([]);
              setUtilitiesItemStep('select');
              setStep('housing-utilities');
            }}
          />
        ) : null}
      </QuestionScreen>
    );
  }

  // ── housingUtilities: Internet ──
  if (step === 'housing-utilities') {
    return (
      <QuestionScreen
        progressStep={step}
        animationKey={step}
        chapter={t('onboarding.housing.chapter')}
        title={t('onboarding.housing.housingUtilities.title')}
        helper={t('onboarding.housing.housingUtilities.helper')}
        illustration={<BroadcastIllustration width={layout.illustrationWidth} />}
        onContinue={handleContinue}
        onBack={handleBack}
        validationError={validationError}
        setValidationError={setValidationError}

        continueLabel={editContinueLabel}
      >
        <YesNoToggle
          value={hasInternet}
          onChange={setHasInternet}
          yesLabel={t('onboarding.housing.housingUtilities.yes')}
          noLabel={t('onboarding.housing.housingUtilities.no')}
          variant="segment"
        />

        <RevealAfterToggle show={hasInternet === true}>
          <InputGroup
            label={t('onboarding.housing.housingUtilities.amountLabel')}
            style={{ marginBottom: 0 }}
          >
            <LabeledInput
              value={internetAmount}
              onChangeText={setInternetAmount}
              numeric
              placeholder={t('onboarding.housing.housingUtilities.amountPlaceholder')}
              large
              inGroup
              currency={currency}
            />
            <FrequencyPills
              options={['monthly', 'annual']}
              value={internetFrequency}
              onChange={setInternetFrequency}
              small
              containerStyle={{ marginBottom: 0 }}
              labelMap={{
                monthly: t('onboarding.housing.housingUtilities.frequencyMonthly'),
                annual: t('onboarding.housing.housingUtilities.frequencyAnnual'),
              }}
            />
          </InputGroup>
          <OptionalPaymentDatesFields
            values={{ internetEndDate, internetDueDate, internetChargeDay }}
            onChange={(patch) => {
              if (patch.internetEndDate !== undefined) setInternetEndDate(patch.internetEndDate);
              if (patch.internetDueDate !== undefined) setInternetDueDate(patch.internetDueDate);
              if (patch.internetChargeDay !== undefined) setInternetChargeDay(patch.internetChargeDay);
            }}
            prefix="internet"
          />
        </RevealAfterToggle>
      </QuestionScreen>
    );
  }

  // ── mortgageStatus: Mortgage toggle ──
  if (step === 'mortgage-status') {
    return (
      <QuestionScreen
        progressStep={step}
        animationKey={step}
        chapter={t('onboarding.housing.chapter')}
        title={t('onboarding.housing.mortgageStatus.title')}
        helper={t('onboarding.housing.mortgageStatus.helper')}
        illustration={<PropertyAgreementIllustration width={layout.illustrationWidth} />}
        onContinue={handleContinue}
        onBack={handleBack}
        validationError={validationError}
        setValidationError={setValidationError}

        continueLabel={editContinueLabel}
      >
        <YesNoToggle
          value={hasMortgage}
          onChange={setHasMortgage}
          yesLabel={t('onboarding.housing.mortgageStatus.yes')}
          noLabel={t('onboarding.housing.mortgageStatus.no')}
          variant="segment"
        />
      </QuestionScreen>
    );
  }

  // ── mortgageDetails: Mortgage payment ──
  if (step === 'mortgage-details') {
    return (
      <QuestionScreen
        progressStep={step}
        animationKey={step}
        chapter={t('onboarding.housing.chapter')}
        title={t('onboarding.housing.mortgageDetails.title')}
        helper={t('onboarding.housing.mortgageDetails.helper')}
        onContinue={handleContinue}
        onBack={handleBack}
        validationError={validationError}
        setValidationError={setValidationError}

        continueLabel={editContinueLabel}
      >
        <InputGroup label={t('onboarding.housing.mortgageDetails.amountLabel')}>
          <LabeledInput
            value={mortgageAmount}
            onChangeText={setMortgageAmount}
            numeric
            placeholder="0"
            large
            inGroup
            currency={currency}
          />
        </InputGroup>

        <InputGroup label={t('onboarding.housing.mortgageDetails.endDateLabel')} optional>
          <SplitDateFields
            value={mortgageEndDate}
            onChange={setMortgageEndDate}
          />
        </InputGroup>
      </QuestionScreen>
    );
  }

  // ── ownershipCosts: Other ownership costs ──
  if (step === 'ownership-costs') {
    return (
      <QuestionScreen
        progressStep={step}
        animationKey={step}
        chapter={t('onboarding.housing.chapter')}
        title={t('onboarding.housing.ownershipCosts.title')}
        helper={t('onboarding.housing.ownershipCosts.helper')}
        onContinue={handleContinue}
        onBack={handleBack}
        validationError={validationError}
        setValidationError={setValidationError}

        continueLabel={editContinueLabel}
      >
        <YesNoToggle
          value={hasOtherCosts}
          onChange={handleHasOtherCostsChange}
          yesLabel={t('onboarding.housing.ownershipCosts.yes')}
          noLabel={t('onboarding.housing.ownershipCosts.no')}
          variant="segment"
        />

        <RevealAfterToggle show={hasOtherCosts === true}>
          {otherCostRows.map((row, index) => {
            const rowErrors = otherCostFieldErrors[row.id] || {};
            return (
            <ScrollFocusAnchor key={row.id} focusId={String(row.id)} focusToken={focusToken}>
            <AnimatedRow
              visible={row.visible}
              onAnimationEnd={() => {
                if (!row.visible) finalizeRemoveCost(row.id);
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
                  label={t('onboarding.housing.ownershipCosts.amountLabel')}
                  value={row.amount}
                  onChangeText={(v) => updateCostRow(index, 'amount', v)}
                  numeric
                  placeholder={t('onboarding.housing.ownershipCosts.amountPlaceholder')}
                  large
                  containerStyle={{ marginBottom: 10, width: '100%' }}
                  currency={currency}
                />

                <LabeledInput
                  label={t('onboarding.housing.ownershipCosts.descriptionLabel')}
                  required
                  value={row.description}
                  onChangeText={(v) => updateCostRow(index, 'description', v)}
                  placeholder={t('onboarding.housing.ownershipCosts.descriptionPlaceholder')}
                  errorText={rowErrors.description}
                  containerStyle={{ marginBottom: 10 }}
                />

                <Text style={{ ...T.fieldLabel, color: C.muted, marginBottom: S.labelGap }}>
                  {t('onboarding.housing.ownershipCosts.dueDateLabel')}
                </Text>
                <SplitDateFields
                  value={row.dueDate}
                  onChange={(v) => updateCostRow(index, 'dueDate', v)}
                />

                {otherCostRows.filter((r) => r.visible).length > 1 ? (
                  <DeleteTextButton onPress={() => removeCostRow(row.id)} />
                ) : null}
              </View>
            </AnimatedRow>
            </ScrollFocusAnchor>
            );
          })}

          <AddAnotherButton onPress={addCostRow} style={{ marginTop: 8 }} />
        </RevealAfterToggle>
      </QuestionScreen>
    );
  }

  // ── familyHousing: Family contribution ──
  if (step === 'family-housing') {
    return (
      <QuestionScreen
        progressStep={step}
        animationKey={step}
        chapter={t('onboarding.housing.chapter')}
        title={t('onboarding.housing.familyHousing.title')}
        helper={t('onboarding.housing.familyHousing.helper')}
        illustration={<InvoiceRafikiIllustration width={layout.illustrationWidth} />}
        onContinue={handleContinue}
        onBack={handleBack}
        validationError={validationError}
        setValidationError={setValidationError}

        continueLabel={editContinueLabel}
      >
        <YesNoToggle
          value={contributesToFamily}
          onChange={handleContributesToFamilyChange}
          yesLabel={t('onboarding.housing.familyHousing.yes')}
          noLabel={t('onboarding.housing.familyHousing.no')}
          variant="segment"
        />

        <RevealAfterToggle show={contributesToFamily === true}>
          {familyContributionRows.map((row, index) => {
            const rowErrors = familyContributionFieldErrors[row.id] || {};
            return (
            <ScrollFocusAnchor key={row.id} focusId={String(row.id)} focusToken={focusToken}>
            <AnimatedRow
              visible={row.visible}
              onAnimationEnd={() => {
                if (!row.visible) finalizeRemoveFamily(row.id);
              }}
            >
              <View style={{
                backgroundColor: C.bg,
                borderWidth: 1,
                borderColor: C.border,
                borderRadius: R.card,
                padding: S.cardPad,
              }}>
                <LabeledInput
                  label={t('onboarding.housing.familyHousing.amountLabel')}
                  value={row.amount}
                  onChangeText={(v) => updateFamilyRow(index, 'amount', v)}
                  numeric
                  placeholder={t('onboarding.housing.familyHousing.amountPlaceholder')}
                  large
                  containerStyle={{ marginBottom: 10, width: '100%' }}
                  currency={currency}
                />

                <LabeledInput
                  label={t('onboarding.housing.familyHousing.descriptionLabel')}
                  required
                  value={row.description}
                  onChangeText={(v) => updateFamilyRow(index, 'description', v)}
                  placeholder={t('onboarding.housing.familyHousing.descriptionPlaceholder')}
                  errorText={rowErrors.description}
                  containerStyle={{ marginBottom: 10 }}
                />

                <Text style={{ ...T.fieldLabel, color: C.muted, marginBottom: S.labelGap }}>
                  {t('onboarding.housing.familyHousing.dueDateLabel')}
                </Text>
                <SplitDateFields
                  value={row.dueDate}
                  onChange={(v) => updateFamilyRow(index, 'dueDate', v)}
                />

                {familyContributionRows.filter((r) => r.visible).length > 1 ? (
                  <DeleteTextButton onPress={() => removeFamilyRow(row.id)} />
                ) : null}
              </View>
            </AnimatedRow>
            </ScrollFocusAnchor>
            );
          })}

          <AddAnotherButton onPress={addFamilyRow} style={{ marginTop: 8 }} />
        </RevealAfterToggle>
      </QuestionScreen>
    );
  }

  const handleWasteTaxAmountChange = (value) => {
    setWasteTaxAmount(value);
    setWasteTaxUserEdited(true);
  };

  const getWasteTaxNote = () => {
    const amountLabel = formatCurrency(parseFloat(wasteTaxAmount) || 0, currency);
    if (shouldEstimateCzechWasteTax(location) && household) {
      return t('onboarding.housing.govtTaxes.wasteTaxNoteEstimated', {
        amount: amountLabel,
        summary: buildWasteTaxMemberSummary(household, t),
      });
    }
    return t('onboarding.housing.govtTaxes.wasteTaxNote', { amount: amountLabel });
  };

  // ── govtTaxes: Government & city taxes ──
  if (step === 'govt-taxes') {
    const govtChargeItems = [
      {
        key: 'wasteTax',
        labelKey: 'wasteTax',
        dontPayKey: 'dontPayWasteTax',
        enabled: wasteTax,
        setEnabled: setWasteTax,
        amount: wasteTaxAmount,
        setAmount: handleWasteTaxAmountChange,
        getNote: getWasteTaxNote,
      },
      {
        key: 'tvLicence',
        labelKey: 'tvLicence',
        noteKey: 'tvLicenceNote',
        dontPayKey: 'dontPayTvLicence',
        enabled: tvLicence,
        setEnabled: setTvLicence,
        amount: tvLicenceAmount,
        setAmount: setTvLicenceAmount,
      },
      {
        key: 'radioLicence',
        labelKey: 'radioLicence',
        noteKey: 'radioLicenceNote',
        dontPayKey: 'dontPayRadioLicence',
        enabled: radioLicence,
        setEnabled: setRadioLicence,
        amount: radioLicenceAmount,
        setAmount: setRadioLicenceAmount,
      },
    ];

    return (
      <QuestionScreen
        progressStep={step}
        animationKey={step}
        chapter={t('onboarding.housing.chapter')}
        title={t('onboarding.housing.govtTaxes.title')}
        helper={t('onboarding.housing.govtTaxes.helper')}
        illustration={<TaxRafikiIllustration width={layout.illustrationWidth} />}
        onContinue={handleContinue}
        onBack={handleBack}
        validationError={validationError}
        setValidationError={setValidationError}

        continueLabel={editContinueLabel}
      >
        {/* Pre-filled government charges as toggle cards */}
        {govtChargeItems.map((item) => (
          <CostCard key={item.key} variant="nested">
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              marginBottom: 6,
            }}>
              <Text style={{ fontSize: 15, color: C.text, fontWeight: '500', flex: 1 }}>
                {t(`onboarding.housing.govtTaxes.${item.labelKey}`)}
              </Text>
              <OnOffSwitch
                value={item.enabled}
                onValueChange={item.setEnabled}
                accessibilityLabel={t('onboarding.housing.govtTaxes.toggleA11y', {
                  charge: t(`onboarding.housing.govtTaxes.${item.labelKey}`),
                })}
              />
            </View>
            {item.enabled ? (
              <Text style={{ ...T.caption, color: C.muted, marginBottom: 8 }}>
                {item.getNote ? item.getNote() : t(`onboarding.housing.govtTaxes.${item.noteKey}`)}
              </Text>
            ) : null}
            {item.enabled ? (
              <InputGroup nested label={t('onboarding.housing.govtTaxes.customAmountLabel')}>
                <LabeledInput
                  value={item.amount}
                  onChangeText={item.setAmount}
                  numeric
                  placeholder="0"
                  large
                  inGroup
                  currency={currency}
                  frequency="/yr"
                />
              </InputGroup>
            ) : (
              <Text style={{ ...T.helper, color: C.muted, marginBottom: 8 }}>
                {t(`onboarding.housing.govtTaxes.${item.dontPayKey}`)}
              </Text>
            )}
          </CostCard>
        ))}

        {/* Custom tax items */}
        {customTaxItems.map((item, index) => (
          <ScrollFocusAnchor key={item.id} focusId={String(item.id)} focusToken={focusToken}>
          <AnimatedRow
            visible={item.visible}
            onAnimationEnd={() => {
              if (!item.visible) finalizeRemoveTaxItem(item.id);
            }}
          >
            <CostCard onRemove={() => removeCustomTaxItem(item.id)}>
              <LabeledInput
                label={t('onboarding.housing.govtTaxes.customPlaceholder')}
                value={item.name}
                onChangeText={(v) => updateCustomTaxItem(index, 'name', v)}
                placeholder={t('onboarding.housing.govtTaxes.customPlaceholder')}
                inCard
                containerStyle={{ marginBottom: 10 }}
              />
              <LabeledInput
                label={t('onboarding.housing.govtTaxes.customAmountLabel')}
                value={item.amount}
                onChangeText={(v) => updateCustomTaxItem(index, 'amount', v)}
                numeric
                placeholder={t('onboarding.housing.govtTaxes.customAmountPlaceholder')}
                inCard
                currency={currency}
                containerStyle={{ marginBottom: 10, width: '100%' }}
              />

              <FrequencyPills
                options={['monthly', 'annual']}
                value={item.frequency}
                onChange={(v) => updateCustomTaxItem(index, 'frequency', v)}
                small
                labelMap={{
                  monthly: t('onboarding.housing.govtTaxes.frequencyMonthly'),
                  annual: t('onboarding.housing.govtTaxes.frequencyAnnual'),
                }}
              />
            </CostCard>
          </AnimatedRow>
          </ScrollFocusAnchor>
        ))}

        <View style={{ alignItems: 'center', marginTop: 4 }}>
          <CardHeaderActionButton
            label={t('common.add')}
            onPress={addCustomTaxItem}
            accessibilityLabel={t('onboarding.housing.govtTaxes.addCustom')}
            style={{ alignSelf: 'stretch', minWidth: undefined, width: '100%' }}
          />
        </View>
      </QuestionScreen>
    );
  }

  return null;
}
