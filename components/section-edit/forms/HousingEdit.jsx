import { View } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useI18n } from '../../../lib/i18n';
import { SECTION_STORAGE_KEYS, parseAmount, amountToString } from '../../../lib/sectionEditStorage';
import { C, T } from '../../../constants/onboarding-theme';
import SectionEditForm from '../SectionEditForm';
import LabeledInput from '../../onboarding/LabeledInput';
import InputGroup from '../../onboarding/InputGroup';
import AmountFrequencyFields from '../AmountFrequencyFields';

function toDraft(saved) {
  const s = saved || {};
  return {
    _original: saved,
    type: s.type || 'renting',
    rent: amountToString(s.rent),
    utilities: amountToString(s.utilities),
    hasInternet: s.hasInternet === true,
    internetAmount: amountToString(s.internetAmount),
    internetFrequency: s.internetFrequency || 'monthly',
    hasMortgage: s.hasMortgage === true,
    mortgageAmount: amountToString(s.mortgageAmount),
    mortgageEndDate: s.mortgageEndDate || '',
    familyRows: (s.familyContributionRows || []).map((r, i) => ({
      id: i,
      amount: amountToString(r.amount),
      description: r.description || '',
    })),
    otherRows: (s.otherCostRows || []).map((r, i) => ({
      id: i,
      amount: amountToString(r.amount),
      description: r.description || '',
    })),
  };
}

function toPayload(draft) {
  const orig = draft._original || {};
  const type = draft.type || orig.type;
  return {
    ...orig,
    type,
    rent: type === 'renting' ? parseAmount(draft.rent) : orig.rent,
    utilities: type === 'renting' ? parseAmount(draft.utilities) : orig.utilities,
    utilitiesMode: orig.utilitiesMode || 'total',
    hasInternet: draft.hasInternet,
    internetAmount: draft.hasInternet ? parseAmount(draft.internetAmount) : null,
    internetFrequency: draft.hasInternet ? draft.internetFrequency : null,
    hasMortgage: draft.hasMortgage,
    mortgageAmount: draft.hasMortgage ? parseAmount(draft.mortgageAmount) : null,
    mortgageEndDate: draft.hasMortgage ? draft.mortgageEndDate || null : null,
    familyContributionRows: (draft.familyRows || []).map((r) => ({
      amount: parseAmount(r.amount),
      description: r.description || null,
      dueDate: null,
    })),
    otherCostRows: (draft.otherRows || []).map((r) => ({
      amount: parseAmount(r.amount),
      description: r.description || null,
      dueDate: null,
    })),
  };
}

export default function HousingEdit() {
  const { t } = useI18n();

  return (
    <SectionEditForm
      storageKey={SECTION_STORAGE_KEYS.housing}
      initialData={toDraft(null)}
      loadTransform={(saved) => toDraft(saved)}
      transformBeforeSave={toPayload}
    >
      {({ data, setData, currency }) => {
        if (!data) return null;
        const update = (patch) => setData((prev) => ({ ...prev, ...patch }));
        const type = data.type;

        return (
          <View>
            <Text style={{ ...T.helper, color: C.muted, marginBottom: 16 }}>
              {t('sectionEdit.housing.helper')}
            </Text>
            <Text style={{ ...T.fieldLabel, marginBottom: 8 }}>
              {t('sectionEdit.housing.type', {
                type: t(`onboarding.housing.housingStatus.${type}`),
              })}
            </Text>

            {type === 'renting' ? (
              <View>
                <InputGroup label={t('sectionEdit.housing.rent')}>
                  <LabeledInput
                    value={data.rent}
                    onChangeText={(v) => update({ rent: v })}
                    numeric
                    large
                    inGroup
                    currency={currency}
                  />
                </InputGroup>
                <InputGroup label={t('sectionEdit.housing.utilities')}>
                  <LabeledInput
                    value={data.utilities}
                    onChangeText={(v) => update({ utilities: v })}
                    numeric
                    large
                    inGroup
                    currency={currency}
                  />
                </InputGroup>
                <AmountFrequencyFields
                  label={t('sectionEdit.housing.internet')}
                  amount={data.internetAmount}
                  frequency={data.internetFrequency}
                  onAmountChange={(v) => update({ internetAmount: v, hasInternet: true })}
                  onFrequencyChange={(v) => update({ internetFrequency: v })}
                  currency={currency}
                />
              </View>
            ) : null}

            {type === 'own' ? (
              <View>
                <InputGroup label={t('sectionEdit.housing.mortgage')}>
                  <LabeledInput
                    value={data.mortgageAmount}
                    onChangeText={(v) => update({ mortgageAmount: v, hasMortgage: true })}
                    numeric
                    large
                    inGroup
                    currency={currency}
                  />
                </InputGroup>
                {(data.otherRows || []).map((row, idx) => (
                  <InputGroup
                    key={row.id}
                    label={row.description || t('sectionEdit.housing.otherCost', { n: idx + 1 })}
                  >
                    <LabeledInput
                      value={row.amount}
                      onChangeText={(v) => {
                        const rows = [...data.otherRows];
                        rows[idx] = { ...rows[idx], amount: v };
                        update({ otherRows: rows });
                      }}
                      numeric
                      large
                      inGroup
                      currency={currency}
                    />
                  </InputGroup>
                ))}
              </View>
            ) : null}

            {type === 'family' ? (
              <View>
                {(data.familyRows || []).map((row, idx) => (
                  <InputGroup
                    key={row.id}
                    label={row.description || t('sectionEdit.housing.familyContribution', { n: idx + 1 })}
                  >
                    <LabeledInput
                      value={row.amount}
                      onChangeText={(v) => {
                        const rows = [...data.familyRows];
                        rows[idx] = { ...rows[idx], amount: v };
                        update({ familyRows: rows });
                      }}
                      numeric
                      large
                      inGroup
                      currency={currency}
                    />
                  </InputGroup>
                ))}
              </View>
            ) : null}
          </View>
        );
      }}
    </SectionEditForm>
  );
}
