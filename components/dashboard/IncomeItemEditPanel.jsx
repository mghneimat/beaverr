import { useState } from 'react';
import { View } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useI18n } from '../../lib/i18n';
import { toMonthly, formatCurrency } from '../../lib/finance';
import { amountToString } from '../../lib/sectionEditStorage';
import { patchPrimaryIncome, patchOtherIncomeRow, addOtherIncomeRow } from '../../lib/inlineIncomeSave';
import { runInlineSave } from '../../lib/inlineSaveImpact';
import { emitSaveFeedback } from '../../lib/dashboardSaveFeedback';
import { emitDashboardToast } from '../../lib/dashboardToast';
import AmountFrequencyFields from '../section-edit/AmountFrequencyFields';
import LabeledInput from '../onboarding/LabeledInput';
import PrimaryButton from '../ui/PrimaryButton';
import { OutlineButton } from '../ui/OutlineButton';
import { T, C } from '../../constants/onboarding-theme';

const FREQUENCY_OPTIONS = ['daily', 'weekly', 'fortnightly', 'monthly', 'annual'];

export default function IncomeItemEditPanel({ row, currency, currencyCode, onDone, onCancel }) {
  const { t } = useI18n();
  const [draftAmount, setDraftAmount] = useState(amountToString(row.rawAmount));
  const [draftFreq, setDraftFreq] = useState(row.frequency || 'monthly');
  const [draftLabel, setDraftLabel] = useState(row.subcategory || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const monthly = toMonthly(parseFloat(draftAmount) || 0, draftFreq);

  const isAdd = row.isAdd === true || row.otherIndex === -1;

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const { after, delta } = await runInlineSave(t, async () => {
        if (isAdd) {
          await addOtherIncomeRow({
            amount: draftAmount,
            frequency: draftFreq,
            label: draftLabel,
          });
        } else if (row.editKind === 'user') {
          await patchPrimaryIncome('user', { amount: draftAmount, frequency: draftFreq });
        } else if (row.editKind === 'partner') {
          await patchPrimaryIncome('partner', { amount: draftAmount, frequency: draftFreq });
        } else {
          await patchOtherIncomeRow(row.otherIndex, {
            amount: draftAmount,
            frequency: draftFreq,
            label: draftLabel,
          });
        }
      });
      emitSaveFeedback({ after, delta, currencyCode: currencyCode || 'CZK' });
      emitDashboardToast('saved');
      onDone?.();
    } catch (err) {
      setError(t('common.error'));
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View>
      {row.showLabelField ? (
        <LabeledInput
          label={t('dashboard.incomeScreen.sourceLabel')}
          value={draftLabel}
          onChangeText={setDraftLabel}
        />
      ) : null}
      <AmountFrequencyFields
        amount={draftAmount}
        frequency={draftFreq}
        onAmountChange={setDraftAmount}
        onFrequencyChange={setDraftFreq}
        currency={currency}
        frequencyOptions={FREQUENCY_OPTIONS}
      />
      <Text style={{ ...T.caption, color: C.muted, marginBottom: 12 }}>
        {t('dashboard.incomeScreen.monthlyEquivalent', {
          amount: formatCurrency(monthly, currency),
        })}
      </Text>

      {error ? (
        <Text style={{ ...T.caption, color: '#D14040', marginBottom: 8 }}>{error}</Text>
      ) : null}

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <OutlineButton onPress={onCancel} style={{ flex: 1 }} disabled={saving} destructive>
          {t('common.cancel')}
        </OutlineButton>
        <View style={{ flex: 1 }}>
          <PrimaryButton onPress={handleSave} disabled={saving}>
            {isAdd ? t('common.add') : t('common.save')}
          </PrimaryButton>
        </View>
      </View>
    </View>
  );
}
