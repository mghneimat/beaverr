import { useState, useEffect } from 'react';
import { View, Modal, Pressable, Platform } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useI18n } from '../../lib/i18n';
import { C, R, T } from '../../constants/onboarding-theme';
import FormInput from '../ui/FormInput';
import PrimaryButton from '../ui/PrimaryButton';
import OutlineButton from '../ui/OutlineButton';

/**
 * Modal to edit a custom money stash tab.
 * @param {{ visible: boolean, initialName: string, initialDescription?: string, onClose: () => void, onSave: (name: string, description: string) => Promise<'empty'|'tooLong'|'duplicate'|'descriptionTooLong'|'notFound'|'unchanged'|null> }} props
 */
export default function EditStashSheet({
  visible,
  initialName = '',
  initialDescription = '',
  onClose,
  onSave,
}) {
  const { t } = useI18n();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [errorText, setErrorText] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setName(initialName);
    setDescription(initialDescription);
    setErrorText('');
    setSaving(false);
  }, [visible, initialName, initialDescription]);

  const handleClose = () => {
    if (saving) return;
    onClose();
  };

  const resolveErrorMessage = (code) => {
    if (code === 'empty') return t('dashboard.budgetScreen.jars.editSheet.validationName');
    if (code === 'tooLong') return t('dashboard.budgetScreen.jars.editSheet.validationTooLong');
    if (code === 'duplicate') return t('dashboard.budgetScreen.jars.editSheet.validationDuplicate');
    if (code === 'descriptionTooLong') {
      return t('dashboard.budgetScreen.jars.editSheet.validationDescriptionTooLong');
    }
    return t('dashboard.budgetScreen.jars.editSheet.saveError');
  };

  const handleSave = async () => {
    setSaving(true);
    setErrorText('');
    try {
      const error = await onSave(name, description);
      if (error && error !== 'unchanged') {
        setErrorText(resolveErrorMessage(error));
      }
    } catch {
      setErrorText(t('dashboard.budgetScreen.jars.editSheet.saveError'));
    } finally {
      setSaving(false);
    }
  };

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
          accessibilityLabel={t('dashboard.budgetScreen.jars.editSheet.closeA11y')}
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
          <Text style={{ ...T.cardTitle, marginBottom: 16 }}>
            {t('dashboard.budgetScreen.jars.editSheet.title')}
          </Text>

          <FormInput
            label={t('dashboard.budgetScreen.jars.editSheet.nameLabel')}
            value={name}
            onChangeText={(text) => {
              setName(text);
              setErrorText('');
            }}
            placeholder={t('dashboard.budgetScreen.jars.editSheet.namePlaceholder')}
            autoCapitalize="sentences"
            disabled={saving}
          />

          <FormInput
            label={t('dashboard.budgetScreen.jars.editSheet.descriptionLabel')}
            optional
            value={description}
            onChangeText={(text) => {
              setDescription(text);
              setErrorText('');
            }}
            placeholder={t('dashboard.budgetScreen.jars.editSheet.descriptionPlaceholder')}
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
                {t('dashboard.budgetScreen.jars.editSheet.cancel')}
              </OutlineButton>
            </View>
            <View style={{ flex: 1 }}>
              <PrimaryButton onPress={handleSave} disabled={saving}>
                {t('dashboard.budgetScreen.jars.editSheet.save')}
              </PrimaryButton>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
