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

function toEditState(saved) {
  return (saved || []).map((p, i) => ({
    id: p.id || `pet_${i}`,
    type: p.type || '',
    name: p.name || '',
    foodAmount: amountToString(p.foodAmount),
    foodFrequency: p.foodFrequency || 'monthly',
    foodEndDate: p.foodEndDate || '',
    foodDueDate: p.foodDueDate || '',
    foodChargeDay: p.foodChargeDay != null ? String(p.foodChargeDay) : '',
    vetAmount: amountToString(p.vetAmount),
    vetFrequency: p.vetFrequency || 'monthly',
    vetEndDate: p.vetEndDate || '',
    vetDueDate: p.vetDueDate || '',
    vetChargeDay: p.vetChargeDay != null ? String(p.vetChargeDay) : '',
  }));
}

function toPayload(rows) {
  return rows.map((p) => ({
    type: p.type,
    name: p.name,
    foodAmount: parseAmount(p.foodAmount),
    foodFrequency: p.foodFrequency,
    foodEndDate: p.foodEndDate || null,
    foodDueDate: p.foodDueDate || null,
    foodChargeDay: p.foodChargeDay ? parseInt(p.foodChargeDay, 10) || null : null,
    vetAmount: parseAmount(p.vetAmount),
    vetFrequency: p.vetFrequency,
    vetEndDate: p.vetEndDate || null,
    vetDueDate: p.vetDueDate || null,
    vetChargeDay: p.vetChargeDay ? parseInt(p.vetChargeDay, 10) || null : null,
  }));
}

export default function PetsEdit() {
  const { t } = useI18n();
  const { focusKey } = useSectionEditFocus();

  return (
    <SectionEditForm
      storageKey={SECTION_STORAGE_KEYS.pets}
      initialData={[]}
      loadTransform={(saved) => toEditState(saved)}
      transformBeforeSave={toPayload}
    >
      {({ data, setData, currency }) => {
        const rows = data || [];
        const updateRow = (idx, patch) => {
          setData((prev) => {
            const next = [...(prev || [])];
            next[idx] = { ...next[idx], ...patch };
            return next;
          });
        };

        return (
          <View>
            {!focusKey ? (
              <Text style={{ ...T.helper, color: C.muted, marginBottom: 16 }}>
                {t('sectionEdit.pets.helper')}
              </Text>
            ) : null}

            {!focusKey && rows.length === 0 ? (
              <Text style={{ ...T.helper }}>{t('sectionEdit.pets.empty')}</Text>
            ) : null}

            {rows.map((pet, idx) => (
              <FocusGate key={pet.id || idx} focusKey={`pet-${idx}`}>
              <View
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
                  {pet.name || t('sectionEdit.pets.unnamed', { n: idx + 1 })}
                </Text>
                <LabeledInput
                  label={t('sectionEdit.pets.name')}
                  value={pet.name}
                  onChangeText={(v) => updateRow(idx, { name: v })}
                />
                <AmountFrequencyFields
                  label={t('sectionEdit.pets.food')}
                  amount={pet.foodAmount}
                  frequency={pet.foodFrequency}
                  onAmountChange={(v) => updateRow(idx, { foodAmount: v })}
                  onFrequencyChange={(v) => updateRow(idx, { foodFrequency: v })}
                  currency={currency}
                />
                <OptionalPaymentDatesFields
                  prefix="food"
                  values={pet}
                  onChange={(patch) => updateRow(idx, patch)}
                  compact
                />
                <AmountFrequencyFields
                  label={t('sectionEdit.pets.vet')}
                  amount={pet.vetAmount}
                  frequency={pet.vetFrequency}
                  onAmountChange={(v) => updateRow(idx, { vetAmount: v })}
                  onFrequencyChange={(v) => updateRow(idx, { vetFrequency: v })}
                  currency={currency}
                />
                <OptionalPaymentDatesFields
                  prefix="vet"
                  values={pet}
                  onChange={(patch) => updateRow(idx, patch)}
                  compact
                />
              </View>
              </FocusGate>
            ))}
          </View>
        );
      }}
    </SectionEditForm>
  );
}
