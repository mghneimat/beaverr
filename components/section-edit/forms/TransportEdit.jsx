import { View } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useI18n } from '../../../lib/i18n';
import { SECTION_STORAGE_KEYS, parseAmount, amountToString } from '../../../lib/sectionEditStorage';
import { C, T } from '../../../constants/onboarding-theme';
import SectionEditForm from '../SectionEditForm';
import FocusGate from '../FocusGate';
import { useSectionEditFocus } from '../../../lib/SectionEditFocusContext';
import AmountFrequencyFields from '../AmountFrequencyFields';
import OptionalPaymentDatesFields from '../../onboarding/OptionalPaymentDatesFields';
import LabeledInput from '../../onboarding/LabeledInput';
import InputGroup from '../../onboarding/InputGroup';

function toDraft(saved) {
  const s = saved || {};
  return {
    _original: saved,
    hasPublicTransport: s.hasPublicTransport === true,
    ptAmount: amountToString(s.ptAmount),
    ptFrequency: s.ptFrequency || 'monthly',
    ptEndDate: s.ptEndDate || s.ptValidUntil || '',
    ptDueDate: s.ptDueDate || '',
    ptChargeDay: s.ptChargeDay != null ? String(s.ptChargeDay) : '',
    vehicles: (s.vehicles || []).map((v, i) => ({
      id: v.id || `vehicle_${i}`,
      category: v.category || '',
      fuelCost: amountToString(v.fuelCost),
      fuelEndDate: v.fuelEndDate || '',
      fuelDueDate: v.fuelDueDate || '',
      fuelChargeDay: v.fuelChargeDay != null ? String(v.fuelChargeDay) : '',
      insurancePremium: amountToString(v.insurancePremium),
      insuranceFrequency: v.insuranceFrequency || 'annual',
      parkingAmount: amountToString(v.parkingAmount),
      parkingFrequency: v.parkingFrequency || 'monthly',
      parkingEndDate: v.parkingEndDate || '',
      parkingDueDate: v.parkingDueDate || '',
      parkingChargeDay: v.parkingChargeDay != null ? String(v.parkingChargeDay) : '',
    })),
    hasVehicle: s.hasVehicle !== false && (s.vehicles || []).length > 0,
  };
}

function toPayload(draft) {
  const orig = draft._original || {};
  const vehicles = (draft.vehicles || []).map((v, i) => {
    const origV = orig.vehicles?.[i] || {};
    return {
      ...origV,
      category: v.category || origV.category,
      fuelCost: parseAmount(v.fuelCost),
      fuelEndDate: v.fuelEndDate || null,
      fuelDueDate: v.fuelDueDate || null,
      fuelChargeDay: v.fuelChargeDay ? parseInt(v.fuelChargeDay, 10) || null : null,
      insurancePremium: parseAmount(v.insurancePremium),
      insuranceFrequency: v.insuranceFrequency,
      parkingAmount: parseAmount(v.parkingAmount),
      parkingFrequency: v.parkingFrequency,
      parkingEndDate: v.parkingEndDate || null,
      parkingDueDate: v.parkingDueDate || null,
      parkingChargeDay: v.parkingChargeDay ? parseInt(v.parkingChargeDay, 10) || null : null,
      hasInsurance: parseAmount(v.insurancePremium) > 0 || origV.hasInsurance,
      hasParking: parseAmount(v.parkingAmount) > 0 || origV.hasParking,
    };
  });

  return {
    ...orig,
    hasVehicle: draft.hasVehicle,
    vehicles,
    hasPublicTransport: draft.hasPublicTransport,
    ptAmount: draft.hasPublicTransport ? parseAmount(draft.ptAmount) : null,
    ptFrequency: draft.hasPublicTransport ? draft.ptFrequency : null,
    ptEndDate: draft.hasPublicTransport ? draft.ptEndDate || null : null,
    ptDueDate: draft.hasPublicTransport ? draft.ptDueDate || null : null,
    ptChargeDay: draft.hasPublicTransport && draft.ptChargeDay
      ? parseInt(draft.ptChargeDay, 10) || null
      : null,
    ptValidUntil: draft.hasPublicTransport ? draft.ptEndDate || null : null,
    fuelCost: vehicles[0] ? parseAmount(vehicles[0].fuelCost) : null,
    insurancePremium: vehicles[0] ? parseAmount(vehicles[0].insurancePremium) : null,
  };
}

export default function TransportEdit() {
  const { t } = useI18n();
  const { focusKey } = useSectionEditFocus();

  return (
    <SectionEditForm
      storageKey={SECTION_STORAGE_KEYS.transport}
      initialData={toDraft(null)}
      loadTransform={(saved) => toDraft(saved)}
      transformBeforeSave={toPayload}
    >
      {({ data, setData, currency }) => {
        if (!data) return null;
        const update = (patch) => setData((prev) => ({ ...prev, ...patch }));

        return (
          <View>
            {!focusKey ? (
              <Text style={{ ...T.helper, color: C.muted, marginBottom: 16 }}>
                {t('sectionEdit.transport.helper')}
              </Text>
            ) : null}

            <FocusGate focusKey="publicTransport">
            {data.hasPublicTransport ? (
              <>
                <AmountFrequencyFields
                  label={t('sectionEdit.transport.publicTransport')}
                  amount={data.ptAmount}
                  frequency={data.ptFrequency}
                  onAmountChange={(v) => update({ ptAmount: v })}
                  onFrequencyChange={(v) => update({ ptFrequency: v })}
                  currency={currency}
                />
                <OptionalPaymentDatesFields
                  prefix="pt"
                  values={data}
                  onChange={(patch) => update(patch)}
                  compact
                />
              </>
            ) : null}
            </FocusGate>

            <FocusGate focusKey="fuel">
            {(data.vehicles || []).map((vehicle, idx) => (
              <View
                key={vehicle.id}
                style={{
                  marginBottom: 16,
                  padding: 16,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: C.border,
                  backgroundColor: C.surface,
                }}
              >
                <Text style={{ fontSize: 15, fontWeight: '600', color: C.primary, marginBottom: 12 }}>
                  {t('sectionEdit.transport.vehicle', { n: idx + 1 })}
                </Text>
                <InputGroup label={t('sectionEdit.transport.fuel')}>
                  <LabeledInput
                    value={vehicle.fuelCost}
                    onChangeText={(v) => {
                      const vehicles = [...data.vehicles];
                      vehicles[idx] = { ...vehicles[idx], fuelCost: v };
                      update({ vehicles });
                    }}
                    numeric
                    large
                    inGroup
                    currency={currency}
                  />
                </InputGroup>
                <OptionalPaymentDatesFields
                  prefix="fuel"
                  values={vehicle}
                  onChange={(patch) => {
                    const vehicles = [...data.vehicles];
                    vehicles[idx] = { ...vehicles[idx], ...patch };
                    update({ vehicles });
                  }}
                  compact
                />
              </View>
            ))}
            </FocusGate>

            <FocusGate focusKey="insurance">
            {(data.vehicles || []).map((vehicle, idx) => (
              <View
                key={`${vehicle.id}-insurance`}
                style={{
                  marginBottom: 16,
                  padding: 16,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: C.border,
                  backgroundColor: C.surface,
                }}
              >
                <AmountFrequencyFields
                  label={t('sectionEdit.transport.insurance')}
                  amount={vehicle.insurancePremium}
                  frequency={vehicle.insuranceFrequency}
                  onAmountChange={(v) => {
                    const vehicles = [...data.vehicles];
                    vehicles[idx] = { ...vehicles[idx], insurancePremium: v };
                    update({ vehicles });
                  }}
                  onFrequencyChange={(v) => {
                    const vehicles = [...data.vehicles];
                    vehicles[idx] = { ...vehicles[idx], insuranceFrequency: v };
                    update({ vehicles });
                  }}
                  currency={currency}
                />
              </View>
            ))}
            </FocusGate>

            {!focusKey && !data.hasPublicTransport && (data.vehicles || []).length === 0 ? (
              <Text style={{ ...T.helper }}>{t('sectionEdit.transport.empty')}</Text>
            ) : null}
          </View>
        );
      }}
    </SectionEditForm>
  );
}
