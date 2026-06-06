import { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useI18n } from '../../lib/i18n';
import { getData, setData } from '../../lib/storage';
import { formatCurrency } from '../../lib/finance';
import { C, S, T, R } from '../../constants/onboarding-theme';
import QuestionScreen from '../../components/onboarding/QuestionScreen';
import PlaceholderIllustration from '../../components/onboarding/PlaceholderIllustration';
import PillToggle from '../../components/onboarding/PillToggle';
import DatePicker from '../../components/onboarding/DatePicker';
import AnimatedSlideIn from '../../components/onboarding/AnimatedSlideIn';
import RemoveButton from '../../components/onboarding/RemoveButton';
import LabeledInput from '../../components/onboarding/LabeledInput';
import YesNoToggle from '../../components/onboarding/YesNoToggle';
import FrequencyPills from '../../components/onboarding/FrequencyPills';
import AddAnotherButton from '../../components/onboarding/AddAnotherButton';

const FUEL_TYPES = ['petrol', 'diesel', 'electric', 'hybrid', 'lpg', 'cng'];
const FREQUENCIES = ['monthly', 'annual'];
const VEHICLE_CATEGORIES = ['passenger', 'motorcycle', 'bicycle'];

const CATEGORY_LABELS = {
  passenger: 'onboarding.transport.q7Count.passenger',
  motorcycle: 'onboarding.transport.q7Count.motorcycle',
  bicycle: 'onboarding.transport.q7Count.bicycle',
};

/** Create a fresh vehicle object for a given category */
function createVehicle(category, index) {
  return {
    id: `v_${Date.now()}_${index}`,
    category,
    fuelType: null,
    fuelCost: '',
    hasInsurance: null,
    insurancePremium: '',
    insuranceFrequency: 'annual',
    insuranceRenewalDate: '',
    hasParking: null,
    parkingAmount: '',
    parkingFrequency: 'annual',
    motDate: '',
    hasPlannedMaintenance: null,
    maintenanceItems: [],
  };
}

/** Build the vehicles array from counter values */
function buildVehiclesFromCounts(counts) {
  const vehicles = [];
  let idx = 0;
  VEHICLE_CATEGORIES.forEach(cat => {
    for (let i = 0; i < (counts[cat] || 0); i++) {
      vehicles.push(createVehicle(cat, idx));
      idx++;
    }
  });
  return vehicles;
}

/** Get a human-readable category label for the sub-header */
function getCategoryLabel(t, category) {
  const key = CATEGORY_LABELS[category];
  return key ? t(key) : category;
}

export default function TransportScreen() {
  const { t } = useI18n();
  const router = useRouter();

  // ── Loaded data ──
  const [currency, setCurrency] = useState('Kč');

  // Step management
  const [step, setStep] = useState('q7');
  const [validationError, setValidationError] = useState('');

  // Q7 — Vehicle ownership
  const [hasVehicle, setHasVehicle] = useState(null);

  // ── Load currency from location data ──
  useEffect(() => {
    (async () => {
      const loc = await getData('pocketos_location');
      if (loc?.currency) setCurrency(loc.currency);
    })();
  }, []);

  // Q7-Counters — Vehicle counts per category
  const [vehicleCounts, setVehicleCounts] = useState({
    passenger: 0,
    motorcycle: 0,
    bicycle: 0,
  });

  // Per-vehicle data
  const [vehicles, setVehicles] = useState([]);
  const [vehicleIndex, setVehicleIndex] = useState(0);

  // Q7e — Public transport
  const [hasPublicTransport, setHasPublicTransport] = useState(null);
  const [ptAmount, setPtAmount] = useState('');
  const [ptFrequency, setPtFrequency] = useState('monthly');
  const [ptValidUntil, setPtValidUntil] = useState('');

  // ─── Helpers ──────────────────────────────────────────────

  /** Get the current vehicle object */
  const currentVehicle = vehicles[vehicleIndex];

  /** Update a field on the current vehicle */
  function updateVehicle(field, value) {
    setVehicles(prev => {
      const next = [...prev];
      if (next[vehicleIndex]) {
        next[vehicleIndex] = { ...next[vehicleIndex], [field]: value };
      }
      return next;
    });
  }

  /** Total number of vehicles across all categories */
  const totalVehicles = vehicles.length;

  // ─── Continue handler ─────────────────────────────────────

  const handleContinue = async () => {
    setValidationError('');

    if (step === 'q7') {
      if (hasVehicle === null) {
        setValidationError(t('onboarding.transport.q7.validation'));
        return;
      }
      if (hasVehicle) {
        setStep('q7Count');
      } else {
        setStep('q7e');
      }
      return;
    }

    if (step === 'q7Count') {
      const total = vehicleCounts.passenger + vehicleCounts.motorcycle + vehicleCounts.bicycle;
      if (total === 0) {
        setValidationError(t('onboarding.transport.q7Count.validation'));
        return;
      }
      const newVehicles = buildVehiclesFromCounts(vehicleCounts);
      setVehicles(newVehicles);
      setVehicleIndex(0);
      // Bicycles skip fuel — go straight to maintenance
      if (newVehicles[0]?.category === 'bicycle') {
        setStep('q7d');
      } else {
        setStep('q7a');
      }
      return;
    }

    if (step === 'q7a') {
      const v = currentVehicle;
      if (!v) return;

      // Bicycles skip fuel — go straight to maintenance
      if (v.category === 'bicycle') {
        setStep('q7d');
        return;
      }

      if (!v.fuelType || !v.fuelCost) {
        setValidationError(t('onboarding.transport.q7a.validation'));
        return;
      }
      setStep('q7b');
      return;
    }

    if (step === 'q7b') {
      const v = currentVehicle;
      if (!v) return;

      if (v.hasInsurance === null) {
        setValidationError(t('onboarding.transport.q7b.validation'));
        return;
      }
      if (v.hasInsurance && !v.insurancePremium) {
        setValidationError(t('onboarding.transport.q7b.validation'));
        return;
      }
      setStep('q7c');
      return;
    }

    if (step === 'q7c') {
      const v = currentVehicle;
      if (!v) return;

      if (v.hasParking === null) {
        setValidationError(t('onboarding.transport.q7c.validation'));
        return;
      }
      if (v.hasParking && !v.parkingAmount) {
        setValidationError(t('onboarding.transport.q7c.validation'));
        return;
      }
      setStep('q7d');
      return;
    }

    if (step === 'q7d') {
      // Check if there are more vehicles to configure
      if (vehicleIndex < totalVehicles - 1) {
        const nextIdx = vehicleIndex + 1;
        setVehicleIndex(nextIdx);
        // Bicycles skip fuel, insurance, parking — go straight to maintenance
        if (vehicles[nextIdx]?.category === 'bicycle') {
          setStep('q7d');
        } else {
          setStep('q7a');
        }
      } else {
        setStep('q7e');
      }
      return;
    }

    if (step === 'q7e') {
      if (hasPublicTransport === null) {
        setValidationError(t('onboarding.transport.q7e.validation'));
        return;
      }
      if (hasPublicTransport && !ptAmount) {
        setValidationError(t('onboarding.transport.q7e.validation'));
        return;
      }

      // Save all transport data
      const transportData = {
        hasVehicle,
        vehicleCounts: hasVehicle ? vehicleCounts : null,
        vehicles: hasVehicle ? vehicles.map(v => ({
          ...v,
          fuelCost: v.fuelCost ? parseFloat(v.fuelCost) || 0 : null,
          insurancePremium: v.insurancePremium ? parseFloat(v.insurancePremium) || 0 : null,
          parkingAmount: v.parkingAmount ? parseFloat(v.parkingAmount) || 0 : null,
        })) : [],
        // Also keep flat fields for backward compatibility (primary vehicle)
        fuelType: hasVehicle && vehicles[0] ? vehicles[0].fuelType : null,
        fuelCost: hasVehicle && vehicles[0] ? parseFloat(vehicles[0].fuelCost) || 0 : null,
        hasInsurance: hasVehicle && vehicles[0] ? vehicles[0].hasInsurance : null,
        insurancePremium: hasVehicle && vehicles[0] && vehicles[0].hasInsurance ? parseFloat(vehicles[0].insurancePremium) || 0 : null,
        insuranceFrequency: hasVehicle && vehicles[0] && vehicles[0].hasInsurance ? vehicles[0].insuranceFrequency : null,
        insuranceRenewalDate: hasVehicle && vehicles[0] && vehicles[0].hasInsurance ? vehicles[0].insuranceRenewalDate || null : null,
        hasParking: hasVehicle && vehicles[0] ? vehicles[0].hasParking : null,
        parkingAmount: hasVehicle && vehicles[0] && vehicles[0].hasParking ? parseFloat(vehicles[0].parkingAmount) || 0 : null,
        parkingFrequency: hasVehicle && vehicles[0] && vehicles[0].hasParking ? vehicles[0].parkingFrequency : null,
        motDate: hasVehicle && vehicles[0] ? vehicles[0].motDate || null : null,
        hasPlannedMaintenance: hasVehicle && vehicles[0] ? vehicles[0].hasPlannedMaintenance : null,
        maintenanceItems: hasVehicle && vehicles[0] && vehicles[0].hasPlannedMaintenance ? vehicles[0].maintenanceItems : [],
        hasPublicTransport,
        ptAmount: hasPublicTransport ? parseFloat(ptAmount) || 0 : null,
        ptFrequency: hasPublicTransport ? ptFrequency : null,
        ptValidUntil: hasPublicTransport ? ptValidUntil || null : null,
      };

      await setData('pocketos_transport', transportData);
      await setData('pocketos_onboarding', {
        completed: false,
        currentStep: 'transport',
        percentComplete: 70,
      });

      router.replace('/(onboarding)/splash-health');
      return;
    }
  };

  // ─── Back handler ─────────────────────────────────────────

  const handleBack = () => {
    setValidationError('');

    if (step === 'q7') {
      // On the first question — navigate back to the transport splash screen
      router.replace('/(onboarding)/splash-transport');
      return;
    }

    if (step === 'q7Count') { setStep('q7'); return; }

    if (step === 'q7a') {
      if (vehicleIndex > 0) {
        setVehicleIndex(vehicleIndex - 1);
        setStep('q7d');
      } else {
        setStep('q7Count');
      }
      return;
    }

    if (step === 'q7b') { setStep('q7a'); return; }
    if (step === 'q7c') { setStep('q7b'); return; }

    if (step === 'q7d') {
      const v = currentVehicle;
      if (v && v.category === 'bicycle') {
        // Bicycles skip q7a-q7c, so going back from q7d goes to q7Count
        if (vehicleIndex > 0) {
          setVehicleIndex(vehicleIndex - 1);
          setStep('q7d');
        } else {
          setStep('q7Count');
        }
      } else {
        setStep('q7c');
      }
      return;
    }

    if (step === 'q7e') {
      if (hasVehicle && totalVehicles > 0) {
        setVehicleIndex(totalVehicles - 1);
        setStep('q7d');
      } else {
        setStep('q7');
      }
      return;
    }
  };

  // ─── Progress ─────────────────────────────────────────────

  const progress = 70;
  const progressLabel = t('onboarding.progress', { percent: progress });

  // ─── Vehicle sub-header ───────────────────────────────────

  const renderVehicleHeader = () => {
    if (!currentVehicle) return null;
    const catLabel = getCategoryLabel(t, currentVehicle.category);
    return (
      <Text style={{ ...T.fieldLabel, color: C.muted, marginBottom: 12, fontStyle: 'italic' }}>
        {t('onboarding.transport.q7a.vehicleLabel', { n: vehicleIndex + 1, total: totalVehicles, category: catLabel })}
      </Text>
    );
  };

  // ─── Render: Q7 — Vehicle ownership ───────────────────────

  const renderQ7 = () => (
    <View>
      <Text style={{ ...T.helper, color: C.muted, marginBottom: 16 }}>
        {t('onboarding.transport.q7.helper')}
      </Text>
      <YesNoToggle
        value={hasVehicle}
        onChange={(val) => { setHasVehicle(val); setValidationError(''); }}
        yesLabel={t('onboarding.transport.q7.yes')}
        noLabel={t('onboarding.transport.q7.no')}
      />
    </View>
  );

  // ─── Render: Q7-Counters — Vehicle counts ─────────────────

  const renderQ7Count = () => (
    <View>
      <Text style={{ ...T.helper, color: C.muted, marginBottom: 16 }}>
        {t('onboarding.transport.q7Count.helper')}
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
            {t(CATEGORY_LABELS[cat])}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 0 }}>
            <Pressable
              onPress={() => {
                setVehicleCounts(prev => ({
                  ...prev,
                  [cat]: Math.max(0, (prev[cat] || 0) - 1),
                }));
                setValidationError('');
              }}
              style={({ pressed }) => ({
                width: 40,
                height: 40,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: C.border,
                backgroundColor: pressed ? C.bg : C.surface,
                alignItems: 'center',
                justifyContent: 'center',
              })}
            >
              <Text style={{ fontSize: 20, color: C.text, fontWeight: '500', lineHeight: 22 }}>–</Text>
            </Pressable>
            <View style={{ width: 48, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 18, color: C.text, fontWeight: '600' }}>
                {vehicleCounts[cat] || 0}
              </Text>
            </View>
            <Pressable
              onPress={() => {
                setVehicleCounts(prev => ({
                  ...prev,
                  [cat]: (prev[cat] || 0) + 1,
                }));
                setValidationError('');
              }}
              style={({ pressed }) => ({
                width: 40,
                height: 40,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: C.border,
                backgroundColor: pressed ? C.bg : C.surface,
                alignItems: 'center',
                justifyContent: 'center',
              })}
            >
              <Text style={{ fontSize: 20, color: C.text, fontWeight: '500', lineHeight: 22 }}>+</Text>
            </Pressable>
          </View>
        </View>
      ))}
    </View>
  );

  // ─── Render: Q7a — Fuel & running costs ──────────────────

  const renderQ7a = () => {
    if (!currentVehicle) return null;
    const v = currentVehicle;

    // Bicycles skip fuel — this step won't be reached for bicycles
    return (
      <View>
        {renderVehicleHeader()}
        <Text style={{ ...T.helper, color: C.muted, marginBottom: 16 }}>
          {t('onboarding.transport.q7a.helper')}
        </Text>
        {/* Fuel type pills */}
        <Text style={{ ...T.fieldLabel, color: C.muted, marginBottom: 10 }}>
          {t('onboarding.transport.q7a.fuelLabel')}
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', borderRadius: R.input, borderWidth: 1, borderColor: C.border, overflow: 'hidden', marginBottom: 20 }}>
          {FUEL_TYPES.map(type => (
            <PillToggle
              key={type}
              label={t(`onboarding.transport.q7a.${type}`)}
              selected={v.fuelType === type}
              onPress={() => { updateVehicle('fuelType', type); setValidationError(''); }}
              paddingVertical={12}
              fontSize={13}
              fontWeight="500"
            />
          ))}
        </View>
        <LabeledInput
          label={v.fuelType === 'electric' ? t('onboarding.transport.q7a.costLabelElectric') : t('onboarding.transport.q7a.costLabel')}
          value={v.fuelCost}
          onChangeText={(val) => updateVehicle('fuelCost', val)}
          numeric
          placeholder={t('onboarding.transport.q7a.costPlaceholder')}
          large
          currency={currency}
        />
      </View>
    );
  };

  // ─── Render: Q7b — Vehicle insurance ──────────────────────

  const renderQ7b = () => {
    if (!currentVehicle) return null;
    const v = currentVehicle;

    return (
      <View>
        {renderVehicleHeader()}
        <Text style={{ ...T.helper, color: C.muted, marginBottom: 16 }}>
          {t('onboarding.transport.q7b.helper')}
        </Text>
        <YesNoToggle
          value={v.hasInsurance}
          onChange={(val) => { updateVehicle('hasInsurance', val); setValidationError(''); }}
          yesLabel={t('common.yes')}
          noLabel={t('common.no')}
        />
        <AnimatedSlideIn visible={v.hasInsurance === true}>
          <LabeledInput
            label={t('onboarding.transport.q7b.premiumLabel')}
            value={v.insurancePremium}
            onChangeText={(val) => updateVehicle('insurancePremium', val)}
            numeric
            placeholder={t('onboarding.transport.q7b.premiumPlaceholder')}
            large
            currency={currency}
          />
          <FrequencyPills
            options={FREQUENCIES}
            value={v.insuranceFrequency}
            onChange={(val) => updateVehicle('insuranceFrequency', val)}
            small
          />
          {/* Renewal date */}
          <Text style={{ ...T.fieldLabel, color: C.muted, marginBottom: 6, marginTop: 12 }}>
            {t('onboarding.transport.q7b.renewalLabel')}
          </Text>
          <DatePicker
            value={v.insuranceRenewalDate}
            onChange={(val) => updateVehicle('insuranceRenewalDate', val)}
          />
        </AnimatedSlideIn>
      </View>
    );
  };

  // ─── Render: Q7c — Zone parking / permits ─────────────────

  const renderQ7c = () => {
    if (!currentVehicle) return null;
    const v = currentVehicle;

    return (
      <View>
        {renderVehicleHeader()}
        <Text style={{ ...T.helper, color: C.muted, marginBottom: 16 }}>
          {t('onboarding.transport.q7c.helper')}
        </Text>
        <YesNoToggle
          value={v.hasParking}
          onChange={(val) => { updateVehicle('hasParking', val); setValidationError(''); }}
          yesLabel={t('common.yes')}
          noLabel={t('common.no')}
        />
        <AnimatedSlideIn visible={v.hasParking === true}>
          <LabeledInput
            label={t('onboarding.transport.q7c.amountLabel')}
            value={v.parkingAmount}
            onChangeText={(val) => updateVehicle('parkingAmount', val)}
            numeric
            placeholder={t('onboarding.transport.q7c.amountPlaceholder')}
            large
            currency={currency}
          />
          <FrequencyPills
            options={FREQUENCIES}
            value={v.parkingFrequency}
            onChange={(val) => updateVehicle('parkingFrequency', val)}
            small
          />
        </AnimatedSlideIn>
      </View>
    );
  };

  // ─── Render: Q7d — MOT / STK and maintenance ──────────────

  const renderQ7d = () => {
    if (!currentVehicle) return null;
    const v = currentVehicle;

    // Bicycle mode — planned maintenance items (no MOT/STK, no monthly cost)
    if (v.category === 'bicycle') {
      return (
        <View>
          {renderVehicleHeader()}
          <Text style={{ ...T.helper, color: C.muted, marginBottom: 16 }}>
            {t('onboarding.transport.q7bicycle.helper')}
          </Text>
          {/* Planned maintenance toggle */}
          <Text style={{ fontSize: 14, color: C.primary, marginBottom: 12, fontWeight: '500' }}>
            {t('onboarding.transport.q7bicycle.maintenanceLabel')}
          </Text>
          <YesNoToggle
            value={v.hasPlannedMaintenance}
            onChange={(val) => updateVehicle('hasPlannedMaintenance', val)}
            yesLabel={t('common.yes')}
            noLabel={t('common.no')}
          />
          <AnimatedSlideIn visible={v.hasPlannedMaintenance === true}>
            {v.maintenanceItems.map((item, idx) => (
              <View key={idx} style={{ padding: S.cardPad, backgroundColor: C.surface, borderRadius: R.card, borderWidth: 1, borderColor: C.border, marginBottom: 10 }}>
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                  <LabeledInput
                    label={t('onboarding.transport.q7bicycle.maintenanceDescPlaceholder')}
                    value={item.description}
                    onChangeText={(val) => {
                      const items = [...v.maintenanceItems];
                      items[idx] = { ...items[idx], description: val };
                      updateVehicle('maintenanceItems', items);
                    }}
                    placeholder={t('onboarding.transport.q7bicycle.maintenanceDescPlaceholder')}
                    inCard
                    containerStyle={{ flex: 1, marginBottom: 0 }}
                  />
                  <LabeledInput
                    label={t('onboarding.transport.q7bicycle.maintenanceCostPlaceholder')}
                    value={item.cost}
                    onChangeText={(val) => {
                      const items = [...v.maintenanceItems];
                      items[idx] = { ...items[idx], cost: val };
                      updateVehicle('maintenanceItems', items);
                    }}
                    numeric
                    placeholder={t('onboarding.transport.q7bicycle.maintenanceCostPlaceholder')}
                    large
                    containerStyle={{ width: 130, marginBottom: 0 }}
                    currency={currency}
                  />
                  {v.maintenanceItems.length > 1 && (
                    <View style={{ height: 63, justifyContent: 'center' }}>
                      <RemoveButton
                        onPress={() => {
                          const items = v.maintenanceItems.filter((_, i) => i !== idx);
                          updateVehicle('maintenanceItems', items);
                        }}
                      />
                    </View>
                  )}
                </View>
                <Text style={{ ...T.fieldLabel, color: C.muted, marginBottom: 6 }}>
                  {t('onboarding.transport.q7bicycle.maintenanceDateLabel')}
                </Text>
                <DatePicker
                  value={item.date}
                  onChange={(val) => {
                    const items = [...v.maintenanceItems];
                    items[idx] = { ...items[idx], date: val };
                    updateVehicle('maintenanceItems', items);
                  }}
                />
              </View>
            ))}
            <AddAnotherButton
              label={t('onboarding.transport.q7bicycle.addItem')}
              onPress={() => {
                const items = [...v.maintenanceItems, { description: '', cost: '', date: '' }];
                updateVehicle('maintenanceItems', items);
              }}
            />
          </AnimatedSlideIn>
        </View>
      );
    }

    // Full maintenance for passenger & motorcycle
    return (
      <View>
        {renderVehicleHeader()}
        <Text style={{ ...T.helper, color: C.muted, marginBottom: 16 }}>
          {t('onboarding.transport.q7d.helper')}
        </Text>
        {/* MOT / STK date */}
        <Text style={{ ...T.fieldLabel, color: C.muted, marginBottom: 6 }}>
          {t('onboarding.transport.q7d.motLabel')}
        </Text>
        <View style={{ marginBottom: 20 }}>
          <DatePicker
            value={v.motDate}
            onChange={(val) => updateVehicle('motDate', val)}
            showDay={false}
          />
        </View>
        {/* Planned maintenance toggle */}
        <Text style={{ fontSize: 14, color: C.primary, marginBottom: 12, fontWeight: '500' }}>
          {t('onboarding.transport.q7d.maintenanceLabel')}
        </Text>
        <YesNoToggle
          value={v.hasPlannedMaintenance}
          onChange={(val) => updateVehicle('hasPlannedMaintenance', val)}
          containerStyle={{ marginBottom: 16 }}
        />
        <AnimatedSlideIn visible={v.hasPlannedMaintenance === true}>
          {v.maintenanceItems.map((item, idx) => (
            <View key={idx} style={{ padding: S.cardPad, backgroundColor: C.surface, borderRadius: R.card, borderWidth: 1, borderColor: C.border, marginBottom: 10 }}>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                <LabeledInput
                  label={t('onboarding.transport.q7d.maintenanceDescPlaceholder')}
                  value={item.description}
                  onChangeText={(val) => {
                    const items = [...v.maintenanceItems];
                    items[idx] = { ...items[idx], description: val };
                    updateVehicle('maintenanceItems', items);
                  }}
                  placeholder={t('onboarding.transport.q7d.maintenanceDescPlaceholder')}
                  inCard
                  containerStyle={{ flex: 1 }}
                />
                <LabeledInput
                  label={t('onboarding.transport.q7d.maintenanceCostPlaceholder')}
                  value={item.cost}
                  onChangeText={(val) => {
                    const items = [...v.maintenanceItems];
                    items[idx] = { ...items[idx], cost: val };
                    updateVehicle('maintenanceItems', items);
                  }}
                  numeric
                  placeholder={t('onboarding.transport.q7d.maintenanceCostPlaceholder')}
                  large
                  containerStyle={{ width: 130 }}
                  currency={currency}
                />
                {v.maintenanceItems.length > 1 && (
                  <View style={{ height: 63, justifyContent: 'center' }}>
                    <RemoveButton
                      onPress={() => {
                        const items = v.maintenanceItems.filter((_, i) => i !== idx);
                        updateVehicle('maintenanceItems', items);
                      }}
                    />
                  </View>
                )}
              </View>
              <Text style={{ ...T.fieldLabel, color: C.muted, marginBottom: 6 }}>
                {t('onboarding.transport.q7d.maintenanceDateLabel')}
              </Text>
              <DatePicker
                value={item.date}
                onChange={(val) => {
                  const items = [...v.maintenanceItems];
                  items[idx] = { ...items[idx], date: val };
                  updateVehicle('maintenanceItems', items);
                }}
              />
            </View>
          ))}
          <AddAnotherButton
            label={t('onboarding.transport.q7d.addItem')}
            onPress={() => {
              const items = [...v.maintenanceItems, { description: '', cost: '', date: '' }];
              updateVehicle('maintenanceItems', items);
            }}
          />
        </AnimatedSlideIn>
      </View>
    );
  };

  // ─── Render: Q7e — Public transport ───────────────────────

  const renderQ7e = () => (
    <View>
      <Text style={{ ...T.helper, color: C.muted, marginBottom: 16 }}>
        {t('onboarding.transport.q7e.helper')}
      </Text>
      <YesNoToggle
        value={hasPublicTransport}
        onChange={(val) => { setHasPublicTransport(val); setValidationError(''); }}
        containerStyle={{ marginBottom: 20 }}
      />
      <AnimatedSlideIn visible={hasPublicTransport === true}>
        <LabeledInput
          label={t('onboarding.transport.q7e.amountLabel')}
          value={ptAmount}
          onChangeText={setPtAmount}
          numeric
          placeholder={t('onboarding.transport.q7e.amountPlaceholder')}
          large
          currency={currency}
        />
        <FrequencyPills
          options={['daily', 'weekly', 'monthly', 'annual']}
          value={ptFrequency}
          onChange={setPtFrequency}
          small
          containerStyle={{ marginBottom: 12 }}
        />
        {/* Pass valid until */}
        <Text style={{ ...T.fieldLabel, color: C.muted, marginBottom: 6 }}>
          {t('onboarding.transport.q7e.validUntilLabel')}
        </Text>
        <DatePicker
          value={ptValidUntil}
          onChange={setPtValidUntil}
        />
      </AnimatedSlideIn>
    </View>
  );

  // ─── Step titles ──────────────────────────────────────────

  const stepTitles = {
    q7: t('onboarding.transport.q7.title'),
    q7Count: t('onboarding.transport.q7Count.title'),
    q7a: t('onboarding.transport.q7a.title'),
    q7b: t('onboarding.transport.q7b.title'),
    q7c: t('onboarding.transport.q7c.title'),
    q7d: currentVehicle?.category === 'bicycle'
      ? t('onboarding.transport.q7bicycle.title')
      : t('onboarding.transport.q7d.title'),
    q7e: t('onboarding.transport.q7e.title'),
  };

  return (
    <QuestionScreen
      chapter={t('onboarding.transport.chapter')}
      title={stepTitles[step]}
      illustration={<PlaceholderIllustration />}
      onContinue={handleContinue}
      onBack={handleBack}
      validationError={validationError}
      progress={progress}
      progressLabel={progressLabel}
      animationKey={step}
    >
      {step === 'q7' && renderQ7()}
      {step === 'q7Count' && renderQ7Count()}
      {step === 'q7a' && renderQ7a()}
      {step === 'q7b' && renderQ7b()}
      {step === 'q7c' && renderQ7c()}
      {step === 'q7d' && renderQ7d()}
      {step === 'q7e' && renderQ7e()}
    </QuestionScreen>
  );
}
