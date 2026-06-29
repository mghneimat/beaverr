import { useState } from 'react';

import { View } from 'react-native';

import { Text } from '@gluestack-ui/themed';

import { useI18n } from '../../lib/i18n';

import { buildExpenseFormState, formStateToPatchFields } from '../../lib/expenseEditFieldConfig';

import { patchExpenseRow, addExpenseForCategory } from '../../lib/inlineExpenseSave';
import { runInlineSave } from '../../lib/inlineSaveImpact';
import { emitSaveFeedback } from '../../lib/dashboardSaveFeedback';
import { emitDashboardToast } from '../../lib/dashboardToast';

import ExpenseOnboardingFields from './ExpenseOnboardingFields';

import PrimaryButton from '../ui/PrimaryButton';

import { OutlineButton } from '../ui/OutlineButton';

import { T } from '../../constants/onboarding-theme';



export default function ExpenseItemEditPanel({

  row,

  currency,

  currencyCode,

  onDone,

  onCancel,

  mode = 'edit',

  categoryKey,

}) {

  const { t } = useI18n();

  const [form, setForm] = useState(() => buildExpenseFormState(row));

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState('');



  const isAdd = mode === 'add' || row.isAdd;



  const handleSave = async () => {

    setSaving(true);

    setError('');

    try {

      const { after, delta } = await runInlineSave(t, async () => {

        const fields = formStateToPatchFields(row, form);

        if (isAdd) {

          await addExpenseForCategory(categoryKey || row.categoryKey, fields);

        } else {

          await patchExpenseRow(row, fields);

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

      <ExpenseOnboardingFields

        row={row}

        currency={currency}

        form={form}

        onChange={setForm}

      />



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

