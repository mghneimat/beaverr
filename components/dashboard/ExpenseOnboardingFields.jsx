import { View } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useI18n } from '../../lib/i18n';
import { getExpenseEditFields } from '../../lib/expenseEditFieldConfig';
import InputGroup from '../onboarding/InputGroup';
import LabeledInput from '../onboarding/LabeledInput';
import FrequencyPills from '../onboarding/FrequencyPills';
import SplitDateFields from '../onboarding/SplitDateFields';
import YesNoToggle from '../onboarding/YesNoToggle';
import { C, T } from '../../constants/onboarding-theme';

function fieldVisible(field, form) {
  if (!field.showWhen) return true;
  return form[field.showWhen.field] === field.showWhen.value;
}

function getFormKey(field) {
  if (field.key) return field.key;
  if (field.type === 'amount' && field.key !== 'minPayment' && field.key !== 'balance') {
    return 'amount';
  }
  return field.key || 'amount';
}

/**
 * Renders onboarding-matched inputs for inline expense edit/add.
 */
export default function ExpenseOnboardingFields({ row, currency, form, onChange }) {
  const { t } = useI18n();
  const fields = getExpenseEditFields(row.editKind, row.editRef);

  const update = (key, value) => onChange({ ...form, [key]: value });

  const amountFields = fields.filter((f) => f.type === 'amount' && fieldVisible(f, form));
  const otherFields = fields.filter((f) => f.type !== 'amount' && fieldVisible(f, form));

  const renderAmountBlock = () => {
    if (!amountFields.length) return null;

    const grouped = amountFields.filter((f) => f.inGroup);
    const standalone = amountFields.filter((f) => !f.inGroup);

    return (
      <>
        {grouped.length ? (
          <InputGroup
            label={grouped.length === 1 && grouped[0].labelKey ? t(grouped[0].labelKey) : undefined}
            style={{ marginBottom: 16 }}
          >
            {grouped.map((field) => {
              const key = getFormKey(field);
              return (
                <View key={key}>
                  {grouped.length > 1 && field.labelKey ? (
                    <Text style={{ ...T.fieldLabel, color: C.muted, marginBottom: 6 }}>
                      {t(field.labelKey)}
                    </Text>
                  ) : null}
                  <LabeledInput
                    value={form[key] || ''}
                    onChangeText={(v) => update(key, v)}
                    numeric={field.numeric !== false}
                    placeholder={field.placeholderKey ? t(field.placeholderKey) : undefined}
                    large
                    inGroup
                    currency={field.numeric !== false ? currency : undefined}
                  />
                  {field.annualNote ? (
                    <Text style={{ ...T.caption, color: C.muted, marginTop: 6 }}>
                      {t('dashboard.expensesScreen.edit.annualOnly')}
                    </Text>
                  ) : null}
                </View>
              );
            })}
            {fields.some((f) => f.type === 'frequency' && fieldVisible(f, form)) ? (
              <FrequencyPills
                options={fields.find((f) => f.type === 'frequency').options}
                value={form.frequency}
                onChange={(freq) => update('frequency', freq)}
                small
              />
            ) : null}
          </InputGroup>
        ) : null}

        {standalone.map((field) => {
          const key = getFormKey(field);
          return (
            <View key={key} style={{ marginBottom: 16 }}>
              {field.labelKey ? (
                <Text style={{ ...T.fieldLabel, marginBottom: 8 }}>{t(field.labelKey)}</Text>
              ) : null}
              <LabeledInput
                value={form[key] || ''}
                onChangeText={(v) => update(key, v)}
                numeric={field.numeric !== false}
                placeholder={field.placeholderKey ? t(field.placeholderKey) : undefined}
                large
                currency={field.numeric !== false ? currency : undefined}
              />
            </View>
          );
        })}
      </>
    );
  };

  return (
    <View>
      {renderAmountBlock()}

      {otherFields.map((field) => {
        const key = field.key || 'amount';

        if (field.type === 'frequency' && amountFields.some((f) => f.inGroup)) {
          return null;
        }

        if (field.type === 'frequency') {
          return (
            <View key="frequency" style={{ marginBottom: 16 }}>
              <FrequencyPills
                options={field.options}
                value={form.frequency}
                onChange={(freq) => update('frequency', freq)}
              />
            </View>
          );
        }

        if (field.type === 'toggle') {
          return (
            <View key={key} style={{ marginBottom: 16 }}>
              <Text style={{ ...T.fieldLabel, marginBottom: 8 }}>{t(field.labelKey)}</Text>
              <YesNoToggle
                value={form[key]}
                onChange={(v) => update(key, v)}
                containerStyle={{ marginBottom: 0 }}
              />
            </View>
          );
        }

        if (field.type === 'hint') {
          return (
            <Text key={key} style={{ ...T.caption, color: C.muted, marginBottom: 16 }}>
              {t(field.labelKey)}
            </Text>
          );
        }

        if (field.type === 'date') {
          const label = field.optional
            ? `${t(field.labelKey)} (${t('common.optional')})`
            : t(field.labelKey);
          return (
            <View key={key} style={{ marginBottom: 16 }}>
              <Text style={{ ...T.fieldLabel, marginBottom: 8 }}>{label}</Text>
              <SplitDateFields
                value={form[key] || ''}
                onChange={(v) => update(key, v)}
                showDay={field.showDay !== false}
              />
            </View>
          );
        }

        if (field.type === 'text' || field.type === 'number') {
          const label = field.optional
            ? `${t(field.labelKey)} (${t('common.optional')})`
            : t(field.labelKey);
          return (
            <View key={key} style={{ marginBottom: 16 }}>
              <Text style={{ ...T.fieldLabel, marginBottom: 8 }}>{label}</Text>
              <LabeledInput
                value={form[key] || ''}
                onChangeText={(v) => {
                  const cleaned = field.type === 'number' || field.numeric
                    ? v.replace(/[^0-9]/g, '')
                    : v;
                  update(key, cleaned);
                }}
                numeric={field.type === 'number' || field.numeric}
                placeholder={field.placeholderKey ? t(field.placeholderKey) : undefined}
                large
              />
            </View>
          );
        }

        return null;
      })}
    </View>
  );
}
