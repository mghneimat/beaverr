import { useState, useEffect } from 'react';
import { View } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useI18n } from '../../lib/i18n';
import { C, T } from '../../constants/onboarding-theme';
import FormInput from '../ui/FormInput';
import PrimaryButton from '../ui/PrimaryButton';
import OutlineButton from '../ui/OutlineButton';
import DashboardScrollSheet from './DashboardScrollSheet';

/**
 * Modal to name and create a custom money stash.
 */
export default function AddStashSheet({ visible, onClose, onCreate }) {
  const { t } = useI18n();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [errorText, setErrorText] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setName('');
    setDescription('');
    setErrorText('');
    setSaving(false);
  }, [visible]);

  const handleClose = () => {
    if (saving) return;
    onClose();
  };

  const resolveErrorMessage = (code) => {
    if (code === 'empty') return t('dashboard.budgetScreen.jars.createSheet.validationName');
    if (code === 'tooLong') return t('dashboard.budgetScreen.jars.createSheet.validationTooLong');
    if (code === 'duplicate') return t('dashboard.budgetScreen.jars.createSheet.validationDuplicate');
    if (code === 'descriptionTooLong') {
      return t('dashboard.budgetScreen.jars.createSheet.validationDescriptionTooLong');
    }
    return t('dashboard.budgetScreen.jars.createSheet.saveError');
  };

  const handleCreate = async () => {
    setSaving(true);
    setErrorText('');
    try {
      const error = await onCreate(name, description);
      if (error) {
        setErrorText(resolveErrorMessage(error));
      }
    } catch {
      setErrorText(t('dashboard.budgetScreen.jars.createSheet.saveError'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardScrollSheet
      visible={visible}
      onClose={handleClose}
      closeA11yLabel={t('dashboard.budgetScreen.jars.createSheet.closeA11y')}
    >
      <Text style={{ ...T.cardTitle, marginBottom: 16 }}>
        {t('dashboard.budgetScreen.jars.createSheet.title')}
      </Text>

      <FormInput
        label={t('dashboard.budgetScreen.jars.createSheet.nameLabel')}
        value={name}
        onChangeText={(text) => {
          setName(text);
          setErrorText('');
        }}
        placeholder={t('dashboard.budgetScreen.jars.createSheet.namePlaceholder')}
        autoCapitalize="sentences"
        disabled={saving}
      />

      <FormInput
        label={t('dashboard.budgetScreen.jars.createSheet.descriptionLabel')}
        optional
        value={description}
        onChangeText={(text) => {
          setDescription(text);
          setErrorText('');
        }}
        placeholder={t('dashboard.budgetScreen.jars.createSheet.descriptionPlaceholder')}
        autoCapitalize="sentences"
        disabled={saving}
        containerStyle={{ marginTop: 12 }}
      />

      {errorText ? (
        <Text style={{ ...T.caption, color: C.danger, marginBottom: 12, marginTop: 12 }}>
          {errorText}
        </Text>
      ) : null}

      <View style={{ flexDirection: 'row', gap: 12, marginTop: 4 }}>
        <View style={{ flex: 1 }}>
          <OutlineButton onPress={handleClose} disabled={saving}>
            {t('dashboard.budgetScreen.jars.createSheet.cancel')}
          </OutlineButton>
        </View>
        <View style={{ flex: 1 }}>
          <PrimaryButton onPress={handleCreate} disabled={saving}>
            {t('dashboard.budgetScreen.jars.createSheet.create')}
          </PrimaryButton>
        </View>
      </View>
    </DashboardScrollSheet>
  );
}
