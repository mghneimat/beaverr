import { useEffect, useMemo, useState } from 'react';
import { View, Modal, Pressable, Platform } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useI18n } from '../../lib/i18n';
import { formatCurrency } from '../../lib/finance';
import { getJarTitle } from '../../lib/jarRouting';
import { buildStashDestinationOptions, getStashBalance } from '../../lib/stashTransfers';
import { C, R, T } from '../../constants/onboarding-theme';
import PrimaryButton from '../ui/PrimaryButton';
import OutlineButton from '../ui/OutlineButton';
import StashTabSelectField from './StashTabSelectField';

/**
 * Delete a custom stash — asks where to send the balance when it is greater than zero.
 */
export default function DeleteStashSheet({
  visible,
  onClose,
  line,
  budget,
  income,
  currency,
  onConfirmDelete,
}) {
  const { t } = useI18n();
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [errorText, setErrorText] = useState('');
  const [saving, setSaving] = useState(false);

  const sourceRef = line?.id ?? null;
  const balance = Number(line?.balance) || 0;
  const title = line ? getJarTitle(line, t) : '';

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
    setSelectedDestination(null);
    setErrorText('');
    setSaving(false);
  }, [visible, sourceRef]);

  const handleClose = () => {
    if (saving) return;
    onClose();
  };

  const handleDelete = async () => {
    if (!selectedDestination) {
      setErrorText(t('dashboard.budgetScreen.jars.deleteSheet.validationDestination'));
      return;
    }

    setSaving(true);
    setErrorText('');
    try {
      await onConfirmDelete(selectedDestination);
    } catch {
      setErrorText(t('dashboard.budgetScreen.jars.deleteSheet.saveError'));
      setSaving(false);
    }
  };

  if (!visible || !line) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Pressable
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(30,58,95,0.35)',
          }}
          onPress={handleClose}
          accessibilityRole="button"
          accessibilityLabel={t('dashboard.budgetScreen.jars.deleteSheet.closeA11y')}
        />
        <View
          style={{
            width: '100%',
            maxWidth: 440,
            backgroundColor: C.surface,
            borderRadius: R.card,
            borderWidth: 1,
            borderColor: C.border,
            padding: 20,
            ...(Platform.OS === 'web' ? { cursor: 'default' } : {}),
          }}
        >
          <Text style={{ ...T.cardTitle, marginBottom: 8 }}>
            {t('dashboard.budgetScreen.jars.deleteSheet.title')}
          </Text>
          <Text style={{ ...T.caption, color: C.muted, marginBottom: 20, lineHeight: 22 }}>
            {t('dashboard.budgetScreen.jars.deleteSheet.bodyWithBalance', {
              name: title,
              amount: formatCurrency(balance, currency),
            })}
          </Text>

          <StashTabSelectField
            label={t('dashboard.budgetScreen.jars.deleteSheet.toLabel')}
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
              <OutlineButton onPress={handleClose} disabled={saving}>
                {t('common.cancel')}
              </OutlineButton>
            </View>
            <View style={{ flex: 1 }}>
              <PrimaryButton
                onPress={handleDelete}
                disabled={saving}
                style={{ backgroundColor: C.danger }}
              >
                {t('common.delete')}
              </PrimaryButton>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
