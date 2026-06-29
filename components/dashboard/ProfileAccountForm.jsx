import { useCallback, useEffect, useRef, useState } from 'react';
import { View, TextInput } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import AuthUsernameInput from '../auth/AuthUsernameInput';
import PrimaryButton from '../ui/PrimaryButton';
import TextLinkButton from '../ui/TextLinkButton';
import FormActionFooter from './FormActionFooter';
import FormFieldSkeleton from '../ui/FormFieldSkeleton';
import { useI18n } from '../../lib/i18n';
import { useAuth } from '../../lib/auth/AuthProvider';
import { authInputStyle } from '../../lib/auth/authFieldStyles';
import {
  checkUsernameAvailable,
  isValidUsernameFormat,
  normalizeUsername,
} from '../../lib/auth/username';
import {
  loadAccountRegistrationFields,
  saveAccountRegistrationFields,
} from '../../lib/account/registrationProfile';
import { C, T, S } from '../../constants/onboarding-theme';

/** @typedef {'idle' | 'checking' | 'available' | 'taken' | 'invalid' | 'checkFailed'} UsernameStatus */

const disabledInputStyle = { opacity: 0.92 };

export default function ProfileAccountForm() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [savedFirstName, setSavedFirstName] = useState('');
  const [savedLastName, setSavedLastName] = useState('');
  const [savedUsername, setSavedUsername] = useState('');
  /** @type {[UsernameStatus, React.Dispatch<React.SetStateAction<UsernameStatus>>]} */
  const [usernameStatus, setUsernameStatus] = useState('idle');
  const [error, setError] = useState('');
  const usernameCheckRef = useRef(0);

  const applyFields = useCallback((fields) => {
    setFirstName(fields.firstName);
    setLastName(fields.lastName);
    setUsername(fields.username);
    setSavedFirstName(fields.firstName);
    setSavedLastName(fields.lastName);
    setSavedUsername(fields.username);
    setUsernameStatus('idle');
  }, []);

  const loadFields = useCallback(async () => {
    setLoading(true);
    try {
      const fields = await loadAccountRegistrationFields(user?.id);
      applyFields(fields);
    } finally {
      setLoading(false);
    }
  }, [applyFields, user?.id]);

  useEffect(() => {
    loadFields();
  }, [loadFields]);

  useEffect(() => {
    if (!editing) return undefined;

    const trimmed = username.trim();
    if (!trimmed) {
      setUsernameStatus('idle');
      return undefined;
    }
    if (!isValidUsernameFormat(trimmed)) {
      setUsernameStatus('invalid');
      return undefined;
    }
    if (normalizeUsername(trimmed) === normalizeUsername(savedUsername)) {
      setUsernameStatus('available');
      return undefined;
    }

    const checkId = usernameCheckRef.current + 1;
    usernameCheckRef.current = checkId;
    setUsernameStatus('checking');

    const timer = setTimeout(async () => {
      const result = await checkUsernameAvailable(trimmed);
      if (checkId !== usernameCheckRef.current) return;

      if (result.ok) {
        setUsernameStatus('available');
        return;
      }
      if (result.reason === 'taken') {
        setUsernameStatus('taken');
        return;
      }
      if (result.reason === 'invalid') {
        setUsernameStatus('invalid');
        return;
      }
      setUsernameStatus('checkFailed');
    }, 400);

    return () => clearTimeout(timer);
  }, [username, savedUsername, editing]);

  const handleEdit = () => {
    setError('');
    setEditing(true);
  };

  const handleCancel = () => {
    setError('');
    setFirstName(savedFirstName);
    setLastName(savedLastName);
    setUsername(savedUsername);
    setUsernameStatus('idle');
    setEditing(false);
  };

  const handleSave = async () => {
    setError('');

    if (usernameStatus === 'checking' || usernameStatus === 'taken' || usernameStatus === 'checkFailed') {
      setError(t('auth.errors.usernameCheckFailed'));
      return;
    }

    setSaving(true);
    try {
      const result = await saveAccountRegistrationFields({
        firstName,
        lastName,
        username,
        userId: user?.id,
      });

      if (!result.ok) {
        const key = result.error === 'required'
          ? 'auth.errors.required'
          : result.error === 'usernameTaken'
            ? 'auth.errors.usernameTaken'
            : result.error === 'usernameInvalid'
              ? 'auth.errors.usernameInvalid'
              : result.error === 'usernameCheckFailed'
                ? 'auth.errors.usernameCheckFailed'
                : 'common.error';
        setError(t(key));
        return;
      }

      setSavedFirstName(firstName);
      setSavedLastName(lastName);
      setSavedUsername(username);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View accessibilityRole="progressbar" accessibilityLabel={t('common.loading')}>
        <FormFieldSkeleton rows={3} />
      </View>
    );
  }

  return (
    <View style={{ gap: 16 }}>
      <Text style={{ ...T.helper, color: C.muted }}>
        {t('dashboard.profileScreen.accountHelper')}
      </Text>

      <View style={{ gap: 12, width: '100%' }}>
        <View style={{ flexDirection: 'row', width: '100%', gap: 8 }}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ ...T.fieldLabel, marginBottom: S.labelGap }}>
              {t('dashboard.profileScreen.fieldFirstName')}
            </Text>
            <TextInput
              value={firstName}
              onChangeText={setFirstName}
              editable={editing}
              placeholder={t('auth.fields.firstNamePlaceholder')}
              placeholderTextColor={C.muted}
              autoCapitalize="words"
              accessibilityLabel={t('dashboard.profileScreen.fieldFirstName')}
              style={[
                authInputStyle('filled', { inRow: true }),
                !editing ? disabledInputStyle : null,
              ]}
            />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ ...T.fieldLabel, marginBottom: S.labelGap }}>
              {t('dashboard.profileScreen.fieldLastName')}
            </Text>
            <TextInput
              value={lastName}
              onChangeText={setLastName}
              editable={editing}
              placeholder={t('auth.fields.lastNamePlaceholder')}
              placeholderTextColor={C.muted}
              autoCapitalize="words"
              accessibilityLabel={t('dashboard.profileScreen.fieldLastName')}
              style={[
                authInputStyle('filled', { inRow: true }),
                !editing ? disabledInputStyle : null,
              ]}
            />
          </View>
        </View>

        <View style={{ width: '100%' }}>
          <Text style={{ ...T.fieldLabel, marginBottom: S.labelGap }}>
            {t('auth.fields.username')}
          </Text>
          <AuthUsernameInput
            value={username}
            onChangeText={setUsername}
            status={usernameStatus}
            editable={editing}
          />
        </View>
      </View>

      {error ? (
        <Text style={{ ...T.helper, color: C.danger }}>
          {error}
        </Text>
      ) : null}

      {editing ? (
        <>
          <PrimaryButton onPress={handleSave} disabled={saving}>
            {saving ? t('common.saving') : t('common.save')}
          </PrimaryButton>
          <FormActionFooter>
            <TextLinkButton
              label={t('common.cancel')}
              onPress={handleCancel}
              disabled={saving}
              centered
            />
          </FormActionFooter>
        </>
      ) : (
        <FormActionFooter>
          <TextLinkButton label={t('common.edit')} onPress={handleEdit} centered color={C.text} />
        </FormActionFooter>
      )}
    </View>
  );
}
