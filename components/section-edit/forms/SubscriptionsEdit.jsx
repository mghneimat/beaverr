import { View } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useI18n } from '../../../lib/i18n';
import { SECTION_STORAGE_KEYS, parseAmount, amountToString } from '../../../lib/sectionEditStorage';
import { C, T } from '../../../constants/onboarding-theme';
import SectionEditForm from '../SectionEditForm';
import FocusGate from '../FocusGate';
import { useSectionEditFocus } from '../../../lib/SectionEditFocusContext';
import AmountFrequencyFields from '../AmountFrequencyFields';
import RemoveButton from '../../onboarding/RemoveButton';

function subLabel(t, name) {
  const key = `onboarding.subscriptions.serviceSelection.services.${name}`;
  const translated = t(key);
  return translated !== key ? translated : (name || t('sectionEdit.subscriptions.unnamed'));
}

function toEditState(saved) {
  return (saved || []).map((s, i) => ({
    id: s.id || `sub_${i}`,
    name: s.name || '',
    cost: amountToString(s.cost),
    frequency: s.frequency || 'monthly',
    autoRenews: s.autoRenews,
    renewalDate: s.renewalDate || '',
  }));
}

function toPayload(rows) {
  return rows.map((s) => ({
    name: s.name,
    cost: parseAmount(s.cost),
    frequency: s.frequency,
    autoRenews: s.autoRenews,
    renewalDate: s.renewalDate || null,
  }));
}

export default function SubscriptionsEdit() {
  const { t } = useI18n();
  const { focusKey } = useSectionEditFocus();

  return (
    <SectionEditForm
      storageKey={SECTION_STORAGE_KEYS.subscriptions}
      initialData={[]}
      loadTransform={(saved) => toEditState(saved)}
      transformBeforeSave={toPayload}
      validate={(rows, tr) => {
        const indices = focusKey?.startsWith('sub-')
          ? [parseInt(focusKey.replace('sub-', ''), 10)]
          : rows.map((_, i) => i);
        for (const i of indices) {
          if (!rows[i]) continue;
          if (!parseAmount(rows[i].cost)) return tr('sectionEdit.subscriptions.validation');
        }
        return null;
      }}
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
        const removeRow = (idx) => setData((prev) => (prev || []).filter((_, i) => i !== idx));

        return (
          <View>
            {!focusKey ? (
              <Text style={{ ...T.helper, color: C.muted, marginBottom: 16 }}>
                {t('sectionEdit.subscriptions.helper')}
              </Text>
            ) : null}

            {!focusKey && rows.length === 0 ? (
              <Text style={{ ...T.helper }}>{t('sectionEdit.subscriptions.empty')}</Text>
            ) : null}

            {rows.map((sub, idx) => (
              <FocusGate key={sub.id || idx} focusKey={`sub-${idx}`}>
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
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: C.primary }}>
                    {subLabel(t, sub.name)}
                  </Text>
                  {!focusKey ? <RemoveButton onPress={() => removeRow(idx)} /> : null}
                </View>
                <AmountFrequencyFields
                  amount={sub.cost}
                  frequency={sub.frequency}
                  onAmountChange={(v) => updateRow(idx, { cost: v })}
                  onFrequencyChange={(v) => updateRow(idx, { frequency: v })}
                  currency={currency}
                  frequencyOptions={['monthly', 'quarterly', 'annual']}
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
