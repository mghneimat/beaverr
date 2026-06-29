import { useState, useEffect, useCallback } from 'react';
import { View, ScrollView } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useI18n } from '../../lib/i18n';
import { getData, setData } from '../../lib/storage';
import { getCurrencySymbol } from '../../lib/currency';
import { notifyDashboardRefresh } from '../../lib/dashboardRefresh';
import { useSectionEditOptional } from '../../lib/SectionEditContext';
import { C, S, T } from '../../constants/onboarding-theme';
import { OnboardingValidationClearContext } from '../../lib/onboardingValidationClear';
import PrimaryButton from '../ui/PrimaryButton';
import { OutlineButton } from '../ui/OutlineButton';
import FormFieldSkeleton from '../ui/FormFieldSkeleton';

/**
 * Loads section data, renders inline editor, saves to storage and refreshes dashboard.
 */
export default function SectionEditForm({
  storageKey,
  initialData,
  loadTransform,
  validate,
  transformBeforeSave,
  children,
}) {
  const { t } = useI18n();
  const sectionEdit = useSectionEditOptional();
  const [data, setDataState] = useState(initialData ?? null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [validationError, setValidationError] = useState('');
  const [saving, setSaving] = useState(false);
  const [currencyCode, setCurrencyCode] = useState('CZK');
  const currency = getCurrencySymbol(currencyCode);

  useEffect(() => {
    (async () => {
      try {
        const [saved, loc] = await Promise.all([
          getData(storageKey),
          getData('beaverr_location'),
        ]);
        if (loc?.currency) setCurrencyCode(loc.currency);
        const base = saved ?? initialData ?? null;
        setDataState(loadTransform ? loadTransform(base) : base);
      } catch {
        setLoadError(t('sectionEdit.loadError'));
      } finally {
        setLoading(false);
      }
    })();
  }, [storageKey, initialData, t]);

  const handleSave = useCallback(async () => {
    setValidationError('');
    const payload = transformBeforeSave ? transformBeforeSave(data) : data;
    const err = validate?.(payload, t);
    if (err) {
      setValidationError(err);
      return;
    }
    setSaving(true);
    try {
      await setData(storageKey, payload);
      notifyDashboardRefresh();
      sectionEdit?.onSaved?.();
    } catch {
      setValidationError(t('sectionEdit.saveError'));
    } finally {
      setSaving(false);
    }
  }, [data, storageKey, transformBeforeSave, validate, t, sectionEdit]);

  const handleCancel = useCallback(() => {
    sectionEdit?.onClose?.();
  }, [sectionEdit]);

  const clearValidation = useCallback(() => {
    setValidationError('');
  }, []);

  if (loading) {
    return (
      <View
        accessibilityRole="progressbar"
        accessibilityLabel={t('sectionEdit.loading')}
        style={{ flex: 1, padding: S.pagePadH, justifyContent: 'center' }}
      >
        <FormFieldSkeleton rows={4} />
      </View>
    );
  }

  if (loadError) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: S.pagePadH }}>
        <Text style={{ ...T.helper, color: C.danger, textAlign: 'center' }}>{loadError}</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: S.pagePadH, paddingBottom: 16 }}
        keyboardShouldPersistTaps="handled"
      >
        <OnboardingValidationClearContext.Provider value={validationError ? clearValidation : null}>
          {children({ data, setData: setDataState, currency, currencyCode })}
        </OnboardingValidationClearContext.Provider>
        {validationError ? (
          <Text style={{ ...T.helper, color: C.danger, marginTop: 8 }}>{validationError}</Text>
        ) : null}
      </ScrollView>
      <View style={{
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: S.pagePadH,
        paddingVertical: 14,
        borderTopWidth: 1,
        borderTopColor: C.border,
        backgroundColor: C.bg,
      }}>
        <View style={{ flex: 1 }}>
          <OutlineButton onPress={handleCancel} disabled={saving} destructive>
            {t('common.cancel')}
          </OutlineButton>
        </View>
        <View style={{ flex: 1 }}>
          <PrimaryButton onPress={handleSave} disabled={saving}>
            {t('common.save')}
          </PrimaryButton>
        </View>
      </View>
    </View>
  );
}
