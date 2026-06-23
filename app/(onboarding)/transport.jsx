import { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text } from 'react-native';
import OnboardingPressable from '../../components/onboarding/OnboardingPressable';
import { washBg } from '../../components/onboarding/pressableFeedback';
import { useRouter } from 'expo-router';
import { useI18n } from '../../lib/i18n';
import { navigateBack, navigateForward } from '../../lib/onboardingNavigation';
import { getData, setData } from '../../lib/storage';
import { getCurrencySymbol } from '../../lib/currency';
import { formatCurrency } from '../../lib/finance';
import { C, S, T, R } from '../../constants/onboarding-theme';
import { useOnboardingLayout } from '../../lib/onboardingLayout';
import CarSalesmanIllustration from '../../components/onboarding/CarSalesmanIllustration';
import CarDrivingPanaIllustration from '../../components/onboarding/CarDrivingPanaIllustration';
import OnTheWayIllustration from '../../components/onboarding/OnTheWayIllustration';
import RideABicycleIllustration from '../../components/onboarding/RideABicycleIllustration';
import BusStopBroIllustration from '../../components/onboarding/BusStopBroIllustration';
import PillToggle from '../../components/onboarding/PillToggle';
import SplitDateFields from '../../components/onboarding/SplitDateFields';
import { addYearsToStoredDate } from '../../lib/datePicker';
import { calcMotNextDateFromExpiry, stkIntervalYearsForCategory } from '../../lib/vehicleMot';
import InsuranceContractFields from '../../components/onboarding/InsuranceContractFields';
import RevealAfterToggle from '../../components/onboarding/RevealAfterToggle';
import AnimatedRow from '../../components/onboarding/AnimatedRow';
import RemoveButton, { REMOVE_BUTTON_SIZE } from '../../components/onboarding/RemoveButton';
import LabeledInput from '../../components/onboarding/LabeledInput';
import YesNoToggle from '../../components/onboarding/YesNoToggle';
import FrequencyPills from '../../components/onboarding/FrequencyPills';
import CardHeaderActionButton from '../../components/dashboard/CardHeaderActionButton';
import InputGroup from '../../components/onboarding/InputGroup';
import OptionalPaymentDatesFields from '../../components/onboarding/OptionalPaymentDatesFields';
import OptionCard from '../../components/onboarding/OptionCard';
import { useSectionExit } from '../../lib/finishOnboardingSection';
import QuestionScreen from '../../components/onboarding/QuestionScreen';
import {
  FUEL_TYPES,
  PARKING_FREQUENCIES,
  VEHICLE_CATEGORIES,
  buildTransportPayload,
  buildVehiclesFromCounts,
  createMaintenanceItem,
  getCategoryLabelKey,
  isMandatoryVehicleInsurance,
  resolveTransportBack,
  resolveTransportContinue,
  serializeMaintenanceItems,
  vehicleRequiresInsurance,
  withMaintenanceIds,
} from '../../lib/transport/transportFlow';
import { normalizeOnboardingStep } from '../../lib/onboardingStepAliases';

const INSURANCE_CONTRACT_FIELD_MAP = {
  premium: 'insurancePremium',
  frequency: 'insuranceFrequency',
  customFrequencyMonths: 'insuranceCustomFrequencyMonths',
  startDate: 'insuranceStartDate',
  endDateType: 'insuranceEndDateType',
  endDate: 'insuranceEndDate',
  premiumPaidInFull: 'insurancePremiumPaidInFull',
  renewalPlan: 'insuranceRenewalPlan',
  budgetForRenewal: 'insuranceBudgetForRenewal',
  renewalBudgetMode: 'insuranceRenewalBudgetMode',
  renewalCustomMonthly: 'insuranceRenewalCustomMonthly',
  budgetForSwitch: 'insuranceBudgetForSwitch',
  switchPremiumAmount: 'insuranceSwitchPremiumAmount',
  switchPremiumFrequency: 'insuranceSwitchPremiumFrequency',
  switchCustomFrequencyMonths: 'insuranceSwitchCustomFrequencyMonths',
};

function toInsuranceContractData(vehicle) {
  return {
    premium: vehicle.insurancePremium || '',
    frequency: vehicle.insuranceFrequency || 'annual',
    customFrequencyMonths: vehicle.insuranceCustomFrequencyMonths || '',
    startDate: vehicle.insuranceStartDate || vehicle.insuranceRenewalDate || '',
    endDateType: vehicle.insuranceEndDateType || 'ongoing',
    endDate: vehicle.insuranceEndDate || '',
    premiumPaidInFull: vehicle.insurancePremiumPaidInFull,
    renewalPlan: vehicle.insuranceRenewalPlan,
    budgetForRenewal: vehicle.insuranceBudgetForRenewal,
    renewalBudgetMode: vehicle.insuranceRenewalBudgetMode || 'suggested',
    renewalCustomMonthly: vehicle.insuranceRenewalCustomMonthly || '',
    budgetForSwitch: vehicle.insuranceBudgetForSwitch,
    switchPremiumAmount: vehicle.insuranceSwitchPremiumAmount || '',
    switchPremiumFrequency: vehicle.insuranceSwitchPremiumFrequency || 'monthly',
    switchCustomFrequencyMonths: vehicle.insuranceSwitchCustomFrequencyMonths || '',
  };
}

function mapInsuranceContractUpdates(updates) {
  const mapped = {};
  Object.entries(updates).forEach(([key, value]) => {
    const field = INSURANCE_CONTRACT_FIELD_MAP[key];
    if (field) mapped[field] = value;
  });
  if (updates.startDate !== undefined) {
    mapped.insuranceRenewalDate = updates.startDate;
  }
  return mapped;
}

function getCategoryLabel(t, category) {
  const key = getCategoryLabelKey(category);
  return key ? t(key) : category;
}

export default function TransportScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const layout = useOnboardingLayout();
  const { isEditMode, completeSection, leaveSection, editContinueLabel } = useSectionExit();

  // ── Loaded data ──
  const [currencyCode, setCurrencyCode] = useState('CZK');
  const [savingsBalance, setSavingsBalance] = useState(0);
  const currency = getCurrencySymbol(currencyCode);

  // Step management
  const [step, setStep] = useState('vehicle-ownership');
  const [validationError, setValidationError] = useState('');

  // vehicleOwnership — Vehicle ownership
  const [hasVehicle, setHasVehicle] = useState(false);

  // ── Load currency from location data ──
  useEffect(() => {
    (async () => {
      const loc = await getData('beaverr_location');
      const income = await getData('beaverr_income');
      if (loc?.currency) setCurrencyCode(loc.currency);
      if (income?.savingsBalance != null) {
        setSavingsBalance(Number(income.savingsBalance) || 0);
      }
    })();
  }, []);

  // vehicleCounts — Vehicle counts per category
  const [vehicleCounts, setVehicleCounts] = useState({
    passenger: 0,
    motorcycle: 0,
    bicycle: 0,
  });

  // Per-vehicle data
  const [vehicles, setVehicles] = useState([]);
  const [vehicleIndex, setVehicleIndex] = useState(0);

  // publicTransport — Public transport
  const [hasPublicTransport, setHasPublicTransport] = useState(false);
  const [ptAmount, setPtAmount] = useState('');
  const [ptFrequency, setPtFrequency] = useState('monthly');
  const [ptEndDate, setPtEndDate] = useState('');
  const [ptDueDate, setPtDueDate] = useState('');
  const [ptChargeDay, setPtChargeDay] = useState('');

  // ─── Helpers ──────────────────────────────────────────────

  /** Get the current vehicle object */
  const currentVehicle = vehicles[vehicleIndex];

  /** Update a field on the current vehicle */
  function updateVehicleFields(updates) {
    setVehicles((prev) => {
      const next = [...prev];
      if (next[vehicleIndex]) {
        next[vehicleIndex] = { ...next[vehicleIndex], ...updates };
      }
      return next;
    });
  }

  function updateVehicle(field, value) {
    updateVehicleFields({ [field]: value });
  }

  function handleMotDateChange(val) {
    const updates = { motDate: val };
    updates.motNextDate = calcMotNextDateFromExpiry(
      val,
      currentVehicle?.category,
      addYearsToStoredDate,
    );
    updateVehicleFields(updates);
  }

  function handlePlannedMaintenanceChange(val) {
    const v = currentVehicle;
    const updates = { hasPlannedMaintenance: val };
    if (val === true && (!v?.maintenanceItems || v.maintenanceItems.length === 0)) {
      updates.maintenanceItems = [createMaintenanceItem()];
    }
    updateVehicleFields(updates);
  }

  function updateMaintenanceItem(index, patch) {
    const items = withMaintenanceIds(currentVehicle?.maintenanceItems, String(vehicleIndex));
    items[index] = { ...items[index], ...patch };
    updateVehicle('maintenanceItems', items);
  }

  function addMaintenanceItem() {
    const items = withMaintenanceIds(currentVehicle?.maintenanceItems, String(vehicleIndex));
    updateVehicle('maintenanceItems', [...items, createMaintenanceItem()]);
  }

  function removeMaintenanceItem(id) {
    const items = withMaintenanceIds(currentVehicle?.maintenanceItems, String(vehicleIndex));
    const activeCount = items.filter((item) => item.visible !== false).length;
    if (activeCount <= 1) return;
    updateVehicle(
      'maintenanceItems',
      items.map((item) => (item.id === id ? { ...item, visible: false } : item)),
    );
  }

  function finalizeMaintenanceItemRemove(id) {
    setVehicles((prev) => {
      const next = [...prev];
      const vehicle = next[vehicleIndex];
      if (!vehicle) return prev;
      next[vehicleIndex] = {
        ...vehicle,
        maintenanceItems: (vehicle.maintenanceItems || []).filter((item) => item.id !== id),
      };
      return next;
    });
  }

  /** Total number of vehicles across all categories */
  const totalVehicles = vehicles.length;

  const persistTransport = async () => {
    const transportData = buildTransportPayload({
      hasVehicle,
      vehicleCounts,
      vehicles,
      hasPublicTransport,
      ptAmount,
      ptFrequency,
      ptEndDate,
      ptDueDate,
      ptChargeDay,
    });

    await completeSection({
      persist: async () => { await setData('beaverr_transport', transportData); },
      onboardingPatch: { completed: false, currentStep: 'transport', percentComplete: 70 },
      nextRoute: '/(onboarding)/splash-health',
      routeName: 'transport',
    });
  };

  // ─── Continue handler ─────────────────────────────────────

  const handleContinue = async () => {
    setValidationError('');

    if (isEditMode) {
      await persistTransport();
      return;
    }

    const result = resolveTransportContinue({
      step,
      hasVehicle,
      vehicleCounts,
      currentVehicle,
      vehicleIndex,
      totalVehicles,
      hasPublicTransport,
      ptAmount,
      vehicles,
    });

    if (result.type === 'validationError') {
      setValidationError(t(result.key));
      return;
    }
    if (result.type === 'nextStep') {
      if (result.vehicles) setVehicles(result.vehicles);
      if (result.vehicleIndex != null) setVehicleIndex(result.vehicleIndex);
      setStep(result.step);
      return;
    }
    if (result.type === 'complete') {
      await persistTransport();
    }
  };

  // ─── Back handler ─────────────────────────────────────────

  const handleBack = () => {
    setValidationError('');

    const result = resolveTransportBack({
      step,
      vehicleIndex,
      currentVehicle,
      hasVehicle,
      totalVehicles,
    });

    if (result.type === 'setStep') {
      if (result.vehicleIndex != null) setVehicleIndex(result.vehicleIndex);
      setStep(result.step);
      return;
    }
    leaveSection(() => navigateBack());
  };

  // ─── Progress ─────────────────────────────────────────────

  const progress = 70;
  const screenProgress = isEditMode ? undefined : progress;

  const showPassengerIllustration =
    ['vehicle-fuel', 'vehicle-insurance', 'vehicle-maintenance', 'vehicle-summary'].includes(step) && currentVehicle?.category === 'passenger';

  const showMotorcycleIllustration =
    ['vehicle-fuel', 'vehicle-insurance', 'vehicle-maintenance', 'vehicle-summary'].includes(step) && currentVehicle?.category === 'motorcycle';

  const showBicycleIllustration =
    ['vehicle-insurance', 'vehicle-summary'].includes(step) && currentVehicle?.category === 'bicycle';

  // ─── Vehicle sub-header ───────────────────────────────────

  const renderVehicleHeader = () => {
    if (!currentVehicle) return null;
    const catLabel = getCategoryLabel(t, currentVehicle.category);
    return (
      <Text style={{ ...T.fieldLabel, color: C.muted, marginBottom: 12, fontStyle: 'italic' }}>
        {t('onboarding.transport.vehicleFuel.vehicleLabel', { n: vehicleIndex + 1, total: totalVehicles, category: catLabel })}
      </Text>
    );
  };

  // ─── Render: vehicleOwnership ───────────────────────

  const renderVehicleOwnership = () => (
    <View>
      <Text style={{ ...T.helper, color: C.muted, marginBottom: 16 }}>
        {t('onboarding.transport.vehicleOwnership.helper')}
      </Text>
      <YesNoToggle
        value={hasVehicle}
        onChange={(val) => { setHasVehicle(val); setValidationError(''); }}
        yesLabel={t('onboarding.transport.vehicleOwnership.yes')}
        noLabel={t('onboarding.transport.vehicleOwnership.no')}
      />
    </View>
  );

  // ─── Render: vehicleCounts ─────────────────

  const renderVehicleCounts = () => (
    <View>
      <Text style={{ ...T.helper, color: C.muted, marginBottom: 16 }}>
        {t('onboarding.transport.vehicleCounts.helper')}
      </Text>
      {VEHICLE_CATEGORIES.map(cat => (
        <View
          key={cat}
          style={{
            backgroundColor: C.surface,
            borderWidth: 1,
            borderColor: C.border,
            borderRadius: R.card,
            padding: S.cardPad,
            marginBottom: 10,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <Text style={{ flex: 1, fontSize: 15, color: C.text, fontWeight: '500' }}>
            {t(getCategoryLabelKey(cat))}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 0 }}>
            <OnboardingPressable
              onPress={() => {
                setVehicleCounts(prev => ({
                  ...prev,
                  [cat]: Math.max(0, (prev[cat] || 0) - 1),
                }));
                setValidationError('');
              }}
              style={({ pressed, hovered }) => ({
                width: 40,
                height: 40,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: C.border,
                backgroundColor: washBg({ pressed, hovered }, C.surface),
                alignItems: 'center',
                justifyContent: 'center',
              })}
            >
              <Text style={{ fontSize: 20, color: C.text, fontWeight: '500', lineHeight: 22 }}>–</Text>
            </OnboardingPressable>
            <View style={{ width: 48, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 18, color: C.text, fontWeight: '600' }}>
                {vehicleCounts[cat] || 0}
              </Text>
            </View>
            <OnboardingPressable
              onPress={() => {
                setVehicleCounts(prev => ({
                  ...prev,
                  [cat]: (prev[cat] || 0) + 1,
                }));
                setValidationError('');
              }}
              style={({ pressed, hovered }) => ({
                width: 40,
                height: 40,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: C.border,
                backgroundColor: washBg({ pressed, hovered }, C.surface),
                alignItems: 'center',
                justifyContent: 'center',
              })}
            >
              <Text style={{ fontSize: 20, color: C.text, fontWeight: '500', lineHeight: 22 }}>+</Text>
            </OnboardingPressable>
          </View>
        </View>
      ))}
    </View>
  );

  // ─── Render: vehicleFuel ──────────────────

  const renderVehicleFuel = () => {
    if (!currentVehicle) return null;
    const v = currentVehicle;

    // Bicycles skip fuel — this step won't be reached for bicycles
    return (
      <View>
        {renderVehicleHeader()}
        <Text style={{ ...T.helper, color: C.muted, marginBottom: 16 }}>
          {t('onboarding.transport.vehicleFuel.helper')}
        </Text>
        {/* Fuel type pills */}
        <Text style={{ ...T.fieldLabel, color: C.muted, marginBottom: 10 }}>
          {t('onboarding.transport.vehicleFuel.fuelLabel')}
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', borderRadius: R.input, borderWidth: 1, borderColor: C.border, overflow: 'hidden', marginBottom: 20 }}>
          {FUEL_TYPES.map(type => (
            <PillToggle
              key={type}
              label={t(`onboarding.transport.vehicleFuel.${type}`)}
              selected={v.fuelType === type}
              onPress={() => { updateVehicle('fuelType', type); setValidationError(''); }}
              paddingVertical={12}
              fontSize={13}
              fontWeight="500"
            />
          ))}
        </View>
        <InputGroup label={v.fuelType === 'electric' ? t('onboarding.transport.vehicleFuel.costLabelElectric') : t('onboarding.transport.vehicleFuel.costLabel')}>
          <LabeledInput
            value={v.fuelCost}
            onChangeText={(val) => updateVehicle('fuelCost', val)}
            numeric
            placeholder={t('onboarding.transport.vehicleFuel.costPlaceholder')}
            large
            inGroup
            currency={currency}
          />
        </InputGroup>
        <OptionalPaymentDatesFields
          prefix="fuel"
          values={v}
          onChange={(patch) => updateVehicleFields(patch)}
          compact
        />
      </View>
    );
  };

  // ─── Render: vehicleInsurance ──────────────────────

  const renderVehicleInsurance = () => {
    if (!currentVehicle) return null;
    const v = currentVehicle;
    const insuranceMandatory = isMandatoryVehicleInsurance(v.category);
    const showInsuranceForm = vehicleRequiresInsurance(v);

    return (
      <View>
        {renderVehicleHeader()}
        <Text style={{ ...T.helper, color: C.muted, marginBottom: 16 }}>
          {insuranceMandatory
            ? t('onboarding.transport.vehicleInsurance.helperMandatory')
            : t('onboarding.transport.vehicleInsurance.helper')}
        </Text>
        {!insuranceMandatory ? (
          <YesNoToggle
            value={v.hasInsurance}
            onChange={(val) => { updateVehicle('hasInsurance', val); setValidationError(''); }}
            yesLabel={t('common.yes')}
            noLabel={t('common.no')}
          />
        ) : null}
        <RevealAfterToggle show={showInsuranceForm}>
          <Text style={{ fontSize: 14, color: C.primary, marginBottom: 12, fontWeight: '500' }}>
            {t('onboarding.transport.vehicleInsurance.coverageTypeLabel')}
          </Text>
          <OptionCard
            label={t('onboarding.transport.vehicleInsurance.coverageTpl')}
            selected={v.insuranceCoverageType === 'tpl'}
            onPress={() => {
              updateVehicle('insuranceCoverageType', v.insuranceCoverageType === 'tpl' ? null : 'tpl');
              setValidationError('');
            }}
          />
          <OptionCard
            label={t('onboarding.transport.vehicleInsurance.coverageComprehensive')}
            selected={v.insuranceCoverageType === 'comprehensive'}
            onPress={() => {
              updateVehicle('insuranceCoverageType', v.insuranceCoverageType === 'comprehensive' ? null : 'comprehensive');
              setValidationError('');
            }}
          />

          <RevealAfterToggle show={v.insuranceCoverageType === 'tpl'}>
            <InputGroup label={t('onboarding.transport.vehicleInsurance.liabilityAmountLabel')}>
              <LabeledInput
                value={v.insuranceLiabilityAmount}
                onChangeText={(val) => updateVehicle('insuranceLiabilityAmount', val)}
                numeric
                placeholder={t('onboarding.transport.vehicleInsurance.liabilityAmountPlaceholder')}
                large
                inGroup
                currency={currency}
              />
              <Text style={{ ...T.caption, color: C.muted, marginTop: 8 }}>
                {t('onboarding.transport.vehicleInsurance.liabilityAmountHelper')}
              </Text>
            </InputGroup>
          </RevealAfterToggle>

          <RevealAfterToggle show={!!v.insuranceCoverageType}>
            <InsuranceContractFields
              data={toInsuranceContractData(v)}
              onUpdate={(updates) => updateVehicleFields(mapInsuranceContractUpdates(updates))}
              currency={currency}
              savingsBalance={savingsBalance}
              premiumLabelKey="onboarding.transport.vehicleInsurance.premiumLabel"
            />
          </RevealAfterToggle>
        </RevealAfterToggle>
      </View>
    );
  };

  // ─── Render: vehicleMaintenance ─────────────────

  const renderVehicleMaintenance = () => {
    if (!currentVehicle) return null;
    const v = currentVehicle;

    return (
      <View>
        {renderVehicleHeader()}
        <Text style={{ ...T.helper, color: C.muted, marginBottom: 16 }}>
          {t('onboarding.transport.vehicleMaintenance.helper')}
        </Text>
        <YesNoToggle
          value={v.hasParking}
          onChange={(val) => { updateVehicle('hasParking', val); setValidationError(''); }}
          yesLabel={t('common.yes')}
          noLabel={t('common.no')}
        />
        <RevealAfterToggle show={v.hasParking === true}>
          <InputGroup label={t('onboarding.transport.vehicleMaintenance.amountLabel')}>
            <LabeledInput
              value={v.parkingAmount}
              onChangeText={(val) => updateVehicle('parkingAmount', val)}
              numeric
              placeholder={t('onboarding.transport.vehicleMaintenance.amountPlaceholder')}
              large
              inGroup
              currency={currency}
            />
            <FrequencyPills
              options={PARKING_FREQUENCIES}
              value={v.parkingFrequency}
              onChange={(val) => updateVehicle('parkingFrequency', val)}
              small
            />
          </InputGroup>
          <OptionalPaymentDatesFields
            prefix="parking"
            values={v}
            onChange={(patch) => updateVehicleFields(patch)}
            compact
          />
        </RevealAfterToggle>
      </View>
    );
  };

  // ─── Render: vehicleService — MOT / STK and maintenance ──────────────

  const renderMaintenanceItemsList = (prefix) => {
    const localePrefix = normalizeOnboardingStep('transport', prefix) || prefix;
    const descKey = `onboarding.transport.${localePrefix}.maintenanceDescPlaceholder`;
    const descText = t(descKey);
    const items = withMaintenanceIds(currentVehicle?.maintenanceItems, String(vehicleIndex));
    const activeCount = items.filter((item) => item.visible !== false).length;

    return (
      <>
        {items.map((item, idx) => (
          <AnimatedRow
            key={item.id}
            visible={item.visible !== false}
            onAnimationEnd={() => {
              if (item.visible === false) finalizeMaintenanceItemRemove(item.id);
            }}
          >
            <View style={{
              padding: S.cardPad,
              backgroundColor: C.surface,
              borderRadius: R.card,
              borderWidth: 1,
              borderColor: C.border,
              marginBottom: 10,
            }}>
              <LabeledInput
                label={descText}
                value={item.description}
                onChangeText={(val) => updateMaintenanceItem(idx, { description: val })}
                placeholder={descText}
                containerStyle={{ marginBottom: 10 }}
              />
              <Text style={{ ...T.fieldLabel, marginBottom: S.labelGap }}>
                {t(`onboarding.transport.${localePrefix}.maintenanceCostLabel`)}
              </Text>
              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 10, width: '100%' }}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <LabeledInput
                    value={item.cost}
                    onChangeText={(val) => updateMaintenanceItem(idx, { cost: val })}
                    numeric
                    placeholder={t(`onboarding.transport.${localePrefix}.maintenanceCostPlaceholder`)}
                    accessibilityLabel={t(`onboarding.transport.${localePrefix}.maintenanceCostLabel`)}
                    currency={currency}
                    containerStyle={{ marginBottom: 0, width: '100%' }}
                  />
                </View>
                {activeCount > 1 ? (
                  <RemoveButton onPress={() => removeMaintenanceItem(item.id)} />
                ) : (
                  <View style={{ width: REMOVE_BUTTON_SIZE, height: REMOVE_BUTTON_SIZE }} />
                )}
              </View>
              <Text style={{ ...T.fieldLabel, marginBottom: S.labelGap }}>
                {t(`onboarding.transport.${localePrefix}.maintenanceDateLabel`)}
                <Text style={{ fontWeight: '400', fontSize: 11, color: C.muted }}>
                  {` (${t('common.optional')})`}
                </Text>
              </Text>
              <SplitDateFields
                value={item.date || ''}
                onChange={(val) => updateMaintenanceItem(idx, { date: val })}
                yearEnd={new Date().getFullYear() + 10}
              />
            </View>
          </AnimatedRow>
        ))}
        <View style={{ alignItems: 'center', marginTop: 4 }}>
          <CardHeaderActionButton
            label={t('common.add')}
            onPress={addMaintenanceItem}
            accessibilityLabel={t(`onboarding.transport.${localePrefix}.addItem`)}
            style={{ alignSelf: 'stretch', minWidth: undefined, width: '100%' }}
          />
        </View>
      </>
    );
  };

  const renderVehicleService = () => {
    if (!currentVehicle) return null;
    const v = currentVehicle;

    // Bicycle mode — planned maintenance items (no MOT/STK, no monthly cost)
    if (v.category === 'bicycle') {
      return (
        <View>
          {renderVehicleHeader()}
          <Text style={{ ...T.helper, color: C.muted, marginBottom: 16 }}>
            {t('onboarding.transport.bicycle.helper')}
          </Text>
          {/* Planned maintenance toggle */}
          <Text style={{ fontSize: 14, color: C.primary, marginBottom: 12, fontWeight: '500' }}>
            {t('onboarding.transport.bicycle.maintenanceLabel')}
          </Text>
          <YesNoToggle
            value={v.hasPlannedMaintenance}
            onChange={handlePlannedMaintenanceChange}
            yesLabel={t('common.yes')}
            noLabel={t('common.no')}
          />
          <RevealAfterToggle show={v.hasPlannedMaintenance === true}>
            {renderMaintenanceItemsList('bicycle')}
          </RevealAfterToggle>
        </View>
      );
    }

    // Full maintenance for passenger & motorcycle
    return (
      <View>
        {renderVehicleHeader()}
        <Text style={{ ...T.helper, color: C.muted, marginBottom: 16 }}>
          {t('onboarding.transport.vehicleService.helper')}
        </Text>
        <InputGroup
          label={t('onboarding.transport.vehicleService.motLabel')}
          style={{ marginBottom: 20 }}
        >
          <SplitDateFields
            value={v.motDate}
            onChange={handleMotDateChange}
            showDay={false}
            inGroup
            yearEnd={new Date().getFullYear() + 10}
          />
        </InputGroup>
        <InputGroup
          label={t('onboarding.transport.vehicleService.inspectionCostLabel')}
          style={{ marginBottom: 20 }}
        >
          <LabeledInput
            value={v.motInspectionCost}
            onChangeText={(val) => updateVehicle('motInspectionCost', val)}
            numeric
            placeholder={t('onboarding.transport.vehicleService.inspectionCostPlaceholder')}
            large
            inGroup
            currency={currency}
          />
        </InputGroup>
        <InputGroup
          label={t('onboarding.transport.vehicleService.nextMotLabel')}
          style={{ marginBottom: 20 }}
        >
          <SplitDateFields
            value={v.motNextDate}
            onChange={(val) => updateVehicle('motNextDate', val)}
            showDay={false}
            inGroup
            yearEnd={new Date().getFullYear() + 15}
          />
          <Text style={{ ...T.caption, color: C.muted, marginTop: 8 }}>
            {t('onboarding.transport.vehicleService.nextMotHelper', {
              years: stkIntervalYearsForCategory(v.category),
            })}
          </Text>
        </InputGroup>
        {/* Planned maintenance toggle */}
        <Text style={{ fontSize: 14, color: C.primary, marginBottom: 12, fontWeight: '500' }}>
          {t('onboarding.transport.vehicleService.maintenanceLabel')}
        </Text>
        <YesNoToggle
          value={v.hasPlannedMaintenance}
          onChange={handlePlannedMaintenanceChange}
          containerStyle={{ marginBottom: 16 }}
        />
        <RevealAfterToggle show={v.hasPlannedMaintenance === true}>
          {renderMaintenanceItemsList('vehicle-summary')}
        </RevealAfterToggle>
      </View>
    );
  };

  // ─── Render: publicTransport ───────────────────────

  const renderPublicTransport = () => (
    <View>
      <Text style={{ ...T.helper, color: C.muted, marginBottom: 16 }}>
        {t('onboarding.transport.publicTransport.helper')}
      </Text>
      <YesNoToggle
        value={hasPublicTransport}
        onChange={(val) => { setHasPublicTransport(val); setValidationError(''); }}
        containerStyle={{ marginBottom: 20 }}
      />
      <RevealAfterToggle show={hasPublicTransport === true}>
        <InputGroup label={t('onboarding.transport.publicTransport.amountLabel')}>
          <LabeledInput
            value={ptAmount}
            onChangeText={setPtAmount}
            numeric
            placeholder={t('onboarding.transport.publicTransport.amountPlaceholder')}
            large
            inGroup
            currency={currency}
          />
          <FrequencyPills
            options={['daily', 'weekly', 'monthly', 'annual']}
            value={ptFrequency}
            onChange={setPtFrequency}
            small
          />
        </InputGroup>
        <OptionalPaymentDatesFields
          prefix="pt"
          values={{ ptEndDate, ptDueDate, ptChargeDay }}
          onChange={(patch) => {
            if (patch.ptEndDate !== undefined) setPtEndDate(patch.ptEndDate);
            if (patch.ptDueDate !== undefined) setPtDueDate(patch.ptDueDate);
            if (patch.ptChargeDay !== undefined) setPtChargeDay(patch.ptChargeDay);
          }}
        />
      </RevealAfterToggle>
    </View>
  );

  // ─── Step titles ──────────────────────────────────────────

  const stepTitles = {
    'vehicle-ownership': t('onboarding.transport.vehicleOwnership.title'),
    'vehicle-counts': t('onboarding.transport.vehicleCounts.title'),
    'vehicle-fuel': t('onboarding.transport.vehicleFuel.title'),
    'vehicle-insurance': t('onboarding.transport.vehicleInsurance.title'),
    'vehicle-maintenance': t('onboarding.transport.vehicleMaintenance.title'),
    'vehicle-summary': currentVehicle?.category === 'bicycle'
      ? t('onboarding.transport.bicycle.title')
      : t('onboarding.transport.vehicleService.title'),
    'public-transport': t('onboarding.transport.publicTransport.title'),
  };

  return (
    <QuestionScreen
      chapter={t('onboarding.transport.chapter')}
      title={stepTitles[step]}
      illustration={
        step === 'vehicle-ownership' || step === 'vehicle-counts' ? (
          <CarSalesmanIllustration width={layout.illustrationWidth} />
        ) : showPassengerIllustration ? (
          <CarDrivingPanaIllustration width={layout.illustrationWidth} />
        ) : showMotorcycleIllustration ? (
          <OnTheWayIllustration width={layout.illustrationWidth} />
        ) : showBicycleIllustration ? (
          <RideABicycleIllustration width={layout.illustrationWidth} />
        ) : step === 'public-transport' ? (
          <BusStopBroIllustration width={layout.illustrationWidth} />
        ) : undefined
      }
      onContinue={handleContinue}
      onBack={handleBack}
      validationError={validationError}
        setValidationError={setValidationError}
      continueLabel={editContinueLabel}
      animationKey={step}
    >
      {step === 'vehicle-ownership' && renderVehicleOwnership()}
      {step === 'vehicle-counts' && renderVehicleCounts()}
      {step === 'vehicle-fuel' && renderVehicleFuel()}
      {step === 'vehicle-insurance' && renderVehicleInsurance()}
      {step === 'vehicle-maintenance' && renderVehicleMaintenance()}
      {step === 'vehicle-summary' && renderVehicleService()}
      {step === 'public-transport' && renderPublicTransport()}
    </QuestionScreen>
  );
}
