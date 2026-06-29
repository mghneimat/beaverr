import { useEffect, useMemo, useState } from 'react';
import { View, Pressable } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useI18n } from '../../lib/i18n';
import { getJarTitle } from '../../lib/jarRouting';
import { buildStashDestinationOptions, getStashBalance } from '../../lib/stashTransfers';
import { parseAmount, amountToString } from '../../lib/sectionEditStorage';
import { C, T } from '../../constants/onboarding-theme';
import FormInput from '../ui/FormInput';
import PrimaryButton from '../ui/PrimaryButton';
import OutlineButton from '../ui/OutlineButton';
import StashTabSelectField from './StashTabSelectField';
import DashboardScrollSheet from './DashboardScrollSheet';

/**
 * Move money from one stash tab to another.
 */
export default function TransferStashSheet({
  visible,
  onClose,
  sourceLine,
  budget,
  income,
  currency,
  onTransfer,
}) {
  const { t } = useI18n();
  const [amountText, setAmountText] = useState('');
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [errorText, setErrorText] = useState('');
  const [saving, setSaving] = useState(false);

  const sourceRef = sourceLine?.id ?? null;
  const sourceBalance = Number(sourceLine?.balance) || 0;
  const sourceTitle = sourceLine ? getJarTitle(sourceLine, t) : '';

  const destinationOptions = useMemo(
    () => buildStashDestinationOptions(budget, income, t, { excludeRef: sourceRef }).map(
      (option) => ({
        id: option.id,
        label: option.label,
        balance: getStashBalance(budget, income, option.id),
      }),
    ),
    [budget, income, t, sourceRef],
  );

  useEffect(() => {
    if (!visible) return;
    setAmountText('');
    setSelectedDestination(null);
    setErrorText('');
    setSaving(false);
  }, [visible, sourceRef]);

  const handleClose = () => {
    if (saving) return;
    onClose();
  };

  const resolveErrorMessage = (code) => {
    if (code === 'same') return t('dashboard.budgetScreen.jars.transferSheet.validationSame');
    if (code === 'insufficient') return t('dashboard.budgetScreen.jars.transferSheet.validationInsufficient');
    if (code === 'invalid') return t('dashboard.budgetScreen.jars.transferSheet.validationAmount');
    return t('dashboard.budgetScreen.jars.transferSheet.saveError');
  };

  const handleMoveAll = () => {
    setAmountText(amountToString(sourceBalance));
    setErrorText('');
  };

  const handleTransfer = async () => {
    if (!sourceRef || !selectedDestination) {
      setErrorText(t('dashboard.budgetScreen.jars.transferSheet.validationDestination'));
      return;
    }

    setSaving(true);
    setErrorText('');
    try {
      const amount = parseAmount(amountText);
      const error = await onTransfer(sourceRef, selectedDestination, amount);
      if (error) {
        setErrorText(resolveErrorMessage(error));
      }
    } catch {
      setErrorText(t('dashboard.budgetScreen.jars.transferSheet.saveError'));
    } finally {
      setSaving(false);
    }
  };

  if (!visible || !sourceLine) return null;

  return (
    <DashboardScrollSheet
      visible={visible}
      onClose={handleClose}
      closeA11yLabel={t('dashboard.budgetScreen.jars.transferSheet.closeA11y')}
    >
      <Text style={{ ...T.cardTitle, marginBottom: 4 }}>
        {t('dashboard.budgetScreen.jars.transferSheet.title')}
      </Text>
      <Text style={{ ...T.caption, color: C.muted, marginBottom: 20 }}>
        {t('dashboard.budgetScreen.jars.transferSheet.fromLabel', { name: sourceTitle })}
      </Text>

      <FormInput
        label={t('dashboard.budgetScreen.jars.transferSheet.amountLabel')}
        value={amountText}
        onChangeText={(text) => {
          setAmountText(text);
          setErrorText('');
        }}
        placeholder={t('dashboard.budgetScreen.jars.transferSheet.amountPlaceholder')}
        numeric
        currency={currency}
        disabled={saving}
        containerStyle={{ marginBottom: 4 }}
      />

      <Pressable
        onPress={handleMoveAll}
        accessibilityRole="button"
        accessibilityLabel={t('dashboard.budgetScreen.jars.transferSheet.moveAllA11y')}
        style={{ alignSelf: 'flex-start', marginBottom: 20 }}
      >
        <Text style={{ ...T.caption, color: C.primary, fontWeight: '600' }}>
          {t('dashboard.budgetScreen.jars.transferSheet.moveAll')}
        </Text>
      </Pressable>

      <StashTabSelectField
        label={t('dashboard.budgetScreen.jars.transferSheet.toLabel')}
        options={destinationOptions}
        selectedId={selectedDestination}
        onSelect={(id) => {
          setSelectedDestination(id);
          setErrorText('');
        }}
        currency={currency}
      />

      {errorText ? (
        <Text style={{ ...T.caption, color: C.danger, marginTop: 12 }}>{errorText}</Text>
      ) : null}

      <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
        <View style={{ flex: 1 }}>
          <OutlineButton onPress={handleClose} disabled={saving} destructive>
            {t('common.cancel')}
          </OutlineButton>
        </View>
        <View style={{ flex: 1 }}>
          <PrimaryButton onPress={handleTransfer} disabled={saving}>
            {t('dashboard.budgetScreen.jars.transferSheet.transfer')}
          </PrimaryButton>
        </View>
      </View>
    </DashboardScrollSheet>
  );
}
