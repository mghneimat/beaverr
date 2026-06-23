// components/section-edit/forms/LocationEdit.jsx
import { useState, useEffect, useCallback } from 'react';
import { View, TextInput, Pressable, ScrollView, Modal } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useI18n } from '../../../lib/i18n';
import { getData, setData } from '../../../lib/storage';
import { getCurrencySymbol } from '../../../lib/currency';
import { hasPartner } from '../../../lib/citizenshipFlow';
import { notifyDashboardRefresh } from '../../../lib/dashboardRefresh';
import { useSectionEditOptional } from '../../../lib/SectionEditContext';
import { parseAmount } from '../../../lib/sectionEditStorage';
import {
  COUNTRIES,
  CURRENCIES,
  PRE_ALPHA_COUNTRY_CODE,
  getFlagEmoji,
} from '../../../lib/locationConstants';
import { C, T, R, S, INPUT_FIELD } from '../../../constants/onboarding-theme';
import OnboardingPressable from '../../onboarding/OnboardingPressable';
import DropdownTrigger, { DropdownTriggerReadOnly } from '../../onboarding/DropdownTrigger';
import { listRowBg } from '../../onboarding/pressableFeedback';
import LabeledInput from '../../onboarding/LabeledInput';
import OptionCard from '../../onboarding/OptionCard';
import YesNoToggle from '../../onboarding/YesNoToggle';
import AnimatedSlideIn from '../../onboarding/AnimatedSlideIn';
import ResidencePermitFields from '../../onboarding/ResidencePermitFields';
import PrimaryButton from '../../ui/PrimaryButton';
import { OutlineButton } from '../../ui/OutlineButton';
import FocusGate from '../FocusGate';
import { useSectionEditFocus } from '../../../lib/SectionEditFocusContext';

const OCCUPATIONS = [
  { key: 'employee', icon: '💼' },
  { key: 'selfEmployed', icon: '🧾' },
  { key: 'student', icon: '🎓' },
  { key: 'notWorking', icon: '🏠' },
  { key: 'other', icon: '❓' },
];

function toDraft(location, occupation, household) {
  const loc = location || {};
  const occ = occupation || {};
  const country = COUNTRIES.find((c) => c.code === loc.country) || COUNTRIES.find((c) => c.code === 'CZ') || null;
  const permit = loc.residencePermit || {};

  return {
    _originalLocation: loc,
    hasPartner: hasPartner(household),
    partnerName: household?.partnerName || '',
    country,
    city: loc.city || '',
    currency: loc.currency || country?.currency || 'CZK',
    isCzCitizen: loc.isCzCitizen ?? null,
    partnerIsCzCitizen: loc.partnerIsCzCitizen ?? null,
    permitType: permit.type || '',
    permitEndDate: permit.endDate || '',
    permitRenewalCost: permit.renewalCost != null ? String(permit.renewalCost) : '',
    userOccupation: occ.user || '',
    userOtherText: occ.userOtherText || '',
    partnerOccupation: occ.partner || '',
    partnerOtherText: occ.partnerOtherText || '',
  };
}

function buildLocationPayload(draft) {
  const base = { ...(draft._originalLocation || {}) };
  const countryCode = draft.country?.code || PRE_ALPHA_COUNTRY_CODE;

  const next = {
    ...base,
    country: countryCode,
    city: draft.city.trim() || null,
    currency: draft.currency,
    isCzCitizen: draft.isCzCitizen,
  };

  if (draft.hasPartner) {
    next.partnerIsCzCitizen = draft.partnerIsCzCitizen;
    if (draft.partnerIsCzCitizen === true) {
      next.partnerResidencePermit = null;
    }
  }

  if (draft.isCzCitizen === true) {
    next.residencePermit = null;
  } else if (draft.isCzCitizen === false) {
    next.residencePermit = {
      type: draft.permitType,
      endDate: draft.permitEndDate,
      renewalCost: parseAmount(draft.permitRenewalCost),
    };
  }

  return next;
}

function buildOccupationPayload(draft) {
  return {
    user: draft.userOccupation,
    userOtherText: draft.userOccupation === 'other' ? draft.userOtherText.trim() || null : null,
    partner: draft.hasPartner ? draft.partnerOccupation : null,
    partnerOtherText: draft.partnerOccupation === 'other' ? draft.partnerOtherText.trim() || null : null,
  };
}

export default function LocationEdit() {
  const { t, locale } = useI18n();
  const { focusKey } = useSectionEditFocus();
  const sectionEdit = useSectionEditOptional();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [validationError, setValidationError] = useState('');
  const [permitFieldErrors, setPermitFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [location, occupation, household] = await Promise.all([
          getData('beaverr_location'),
          getData('beaverr_occupation'),
          getData('beaverr_household'),
        ]);
        setData(toDraft(location, occupation, household));
      } catch {
        setLoadError(t('sectionEdit.loadError'));
      } finally {
        setLoading(false);
      }
    })();
  }, [t]);

  const update = useCallback((patch) => {
    setData((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  const validate = useCallback((draft) => {
    if (!draft.country) return t('onboarding.location.validation');
    if (draft.isCzCitizen !== true && draft.isCzCitizen !== false) {
      return t('onboarding.citizenship.validation');
    }
    if (draft.hasPartner && draft.partnerIsCzCitizen !== true && draft.partnerIsCzCitizen !== false) {
      return t('sectionEdit.location.validation.partnerCitizenship');
    }
    if (draft.isCzCitizen === false) {
      const permitErrors = {};
      if (!draft.permitType) permitErrors.type = t('onboarding.residencePermit.validationType');
      if (!draft.permitEndDate) permitErrors.endDate = t('onboarding.residencePermit.validationEndDate');
      if (!draft.permitRenewalCost) permitErrors.renewalCost = t('onboarding.residencePermit.validationRenewalCost');
      if (Object.keys(permitErrors).length) {
        setPermitFieldErrors(permitErrors);
        return t('sectionEdit.location.validation.permit');
      }
    }
    if (!draft.userOccupation) return t('onboarding.occupation.validation');
    if (draft.hasPartner && !draft.partnerOccupation) {
      return t('sectionEdit.location.validation.partnerOccupation');
    }
    return null;
  }, [t]);

  const handleSave = useCallback(async () => {
    setValidationError('');
    setPermitFieldErrors({});
    const err = validate(data);
    if (err) {
      setValidationError(err);
      return;
    }
    setSaving(true);
    try {
      await setData('beaverr_location', buildLocationPayload(data));
      await setData('beaverr_occupation', buildOccupationPayload(data));
      notifyDashboardRefresh();
      sectionEdit?.onSaved?.();
    } catch {
      setValidationError(t('sectionEdit.saveError'));
    } finally {
      setSaving(false);
    }
  }, [data, validate, sectionEdit, t]);

  const handleCancel = useCallback(() => {
    sectionEdit?.onClose?.();
  }, [sectionEdit]);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: S.pagePadH }}>
        <Text style={{ ...T.helper }}>{t('sectionEdit.loading')}</Text>
      </View>
    );
  }

  if (loadError || !data) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: S.pagePadH }}>
        <Text style={{ ...T.helper, color: C.danger, textAlign: 'center' }}>{loadError || t('sectionEdit.loadError')}</Text>
      </View>
    );
  }

  const countryLabel = data.country
    ? (locale === 'cs' && data.country.nameCs ? data.country.nameCs : data.country.name)
    : '';
  const currencyLocked = data.country != null && data.country.code !== 'Other';
  const selectedCurrency = CURRENCIES.find((c) => c.code === data.currency);
  const currencyDisplay = selectedCurrency
    ? `${selectedCurrency.symbol} — ${selectedCurrency.name} (${selectedCurrency.code})`
    : data.currency
      ? getCurrencySymbol(data.currency)
      : '';
  const currency = getCurrencySymbol(data.currency);
  const filteredCountries = COUNTRIES.filter((c) => {
    const q = countrySearch.toLowerCase();
    return (
      c.name.toLowerCase().includes(q)
      || (c.nameCs && c.nameCs.toLowerCase().includes(q))
      || c.code.toLowerCase().includes(q)
    );
  });

  const inputBase = {
    backgroundColor: C.surface,
    borderWidth: 2.5,
    borderColor: C.border,
    borderRadius: R.input,
    paddingHorizontal: INPUT_FIELD.paddingHorizontal,
    paddingVertical: INPUT_FIELD.paddingVertical,
    minHeight: INPUT_FIELD.minHeight,
    color: C.text,
    fontSize: 17,
    fontWeight: '400',
    textAlignVertical: 'center',
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: S.pagePadH, paddingBottom: 16 }}
        keyboardShouldPersistTaps="handled"
      >
        {!focusKey ? (
          <Text style={{ ...T.helper, color: C.muted, marginBottom: 16 }}>
            {t('sectionEdit.location.helper')}
          </Text>
        ) : null}

        <FocusGate focusKey="country">
        <Text style={{ ...T.fieldLabel, marginBottom: S.labelGap }}>
          {t('onboarding.location.countryLabel')}
        </Text>
        <DropdownTrigger
          onPress={() => setShowCountryDropdown(true)}
          value={data.country ? `${getFlagEmoji(data.country.code)} ${countryLabel}` : null}
          placeholder={t('onboarding.location.countryPlaceholder')}
          style={{ ...inputBase, marginBottom: 8 }}
        />

        </FocusGate>

        <FocusGate focusKey="currency">
        <Text style={{ ...T.fieldLabel, marginBottom: S.labelGap, marginTop: 16 }}>
          {t('onboarding.location.currencyLabel')}
        </Text>
        {currencyLocked ? (
          <DropdownTriggerReadOnly value={currencyDisplay} style={{ ...inputBase, marginBottom: 16 }} />
        ) : (
          <DropdownTrigger
            onPress={() => setShowCurrencyDropdown(true)}
            value={currencyDisplay || null}
            placeholder={t('onboarding.location.currencyPlaceholder')}
            style={{ ...inputBase, marginBottom: 16 }}
          />
        )}
        </FocusGate>

        <FocusGate focusKey="city">
        <LabeledInput
          label={t('onboarding.location.cityLabel')}
          optional
          value={data.city}
          onChangeText={(v) => update({ city: v })}
          placeholder={t('onboarding.location.cityPlaceholder')}
          maxLength={60}
          containerStyle={{ marginTop: 12 }}
        />
        </FocusGate>

        <FocusGate focusKey="citizenship">
        <Text style={{ ...T.fieldLabel, marginTop: 8, marginBottom: 10 }}>
          {t('sectionEdit.location.citizenshipSection')}
        </Text>
        <Text style={{ ...T.caption, color: C.muted, marginBottom: 10 }}>
          {t('onboarding.citizenship.title')}
        </Text>
        <YesNoToggle
          value={data.isCzCitizen}
          onChange={(v) => {
            update({ isCzCitizen: v });
            setValidationError('');
          }}
          yesLabel={t('common.yes')}
          noLabel={t('common.no')}
        />

        {data.hasPartner ? (
          <View style={{ marginTop: 16 }}>
            <Text style={{ ...T.caption, color: C.muted, marginBottom: 10 }}>
              {t('onboarding.citizenship.partnerTitle', { name: data.partnerName })}
            </Text>
            <YesNoToggle
              value={data.partnerIsCzCitizen}
              onChange={(v) => {
                update({ partnerIsCzCitizen: v });
                setValidationError('');
              }}
              yesLabel={t('common.yes')}
              noLabel={t('common.no')}
            />
          </View>
        ) : null}
        </FocusGate>

        <FocusGate focusKey="residencePermit">
        <AnimatedSlideIn visible={data.isCzCitizen === false}>
          <View style={{ marginTop: 20 }}>
            <Text style={{ ...T.fieldLabel, marginBottom: 12 }}>
              {t('sectionEdit.location.permitSection')}
            </Text>
            <ResidencePermitFields
              permitType={data.permitType}
              onPermitTypeChange={(v) => update({ permitType: v })}
              endDate={data.permitEndDate}
              onEndDateChange={(v) => update({ permitEndDate: v })}
              renewalCost={data.permitRenewalCost}
              onRenewalCostChange={(v) => update({ permitRenewalCost: v })}
              currency={currency}
              fieldErrors={permitFieldErrors}
              onClearFieldError={(field) => {
                setPermitFieldErrors((prev) => {
                  if (!prev[field]) return prev;
                  const next = { ...prev };
                  delete next[field];
                  return next;
                });
              }}
            />
          </View>
        </AnimatedSlideIn>
        </FocusGate>

        <FocusGate focusKey="occupation">
        <Text style={{ ...T.fieldLabel, marginTop: 24, marginBottom: 10 }}>
          {t('sectionEdit.location.occupationSection')}
        </Text>
        <Text style={{ ...T.caption, color: C.muted, marginBottom: 10 }}>
          {t('onboarding.occupation.title')}
        </Text>
        {OCCUPATIONS.map((occ) => (
          <OptionCard
            key={occ.key}
            icon={occ.icon}
            label={t(`onboarding.occupation.${occ.key}`)}
            selected={data.userOccupation === occ.key}
            onPress={() => {
              update({ userOccupation: occ.key });
              setValidationError('');
            }}
          />
        ))}
        <AnimatedSlideIn visible={data.userOccupation === 'other'}>
          <LabeledInput
            label={t('onboarding.occupation.otherLabel')}
            value={data.userOtherText}
            onChangeText={(v) => update({ userOtherText: v })}
            placeholder={t('onboarding.occupation.otherPlaceholder')}
            maxLength={100}
            containerStyle={{ marginTop: 4 }}
          />
        </AnimatedSlideIn>
        </FocusGate>

        <FocusGate focusKey="partnerOccupation">
        {data.hasPartner ? (
          <View style={{ marginTop: 20 }}>
            <Text style={{ ...T.caption, color: C.muted, marginBottom: 10 }}>
              {t('onboarding.occupation.partnerTitle', { name: data.partnerName })}
            </Text>
            {OCCUPATIONS.map((occ) => (
              <OptionCard
                key={`partner-${occ.key}`}
                icon={occ.icon}
                label={t(`onboarding.occupation.${occ.key}`)}
                selected={data.partnerOccupation === occ.key}
                onPress={() => {
                  update({ partnerOccupation: occ.key });
                  setValidationError('');
                }}
              />
            ))}
            <AnimatedSlideIn visible={data.partnerOccupation === 'other'}>
              <LabeledInput
                label={t('onboarding.occupation.otherLabel')}
                value={data.partnerOtherText}
                onChangeText={(v) => update({ partnerOtherText: v })}
                placeholder={t('onboarding.occupation.otherPlaceholder')}
                maxLength={100}
                containerStyle={{ marginTop: 4 }}
              />
            </AnimatedSlideIn>
          </View>
        ) : null}
        </FocusGate>

        {validationError ? (
          <Text style={{ ...T.helper, color: C.danger, marginTop: 12 }}>{validationError}</Text>
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
          <OutlineButton onPress={handleCancel} disabled={saving}>
            {t('common.cancel')}
          </OutlineButton>
        </View>
        <View style={{ flex: 1 }}>
          <PrimaryButton onPress={handleSave} disabled={saving}>
            {t('common.save')}
          </PrimaryButton>
        </View>
      </View>

      <Modal visible={showCountryDropdown} transparent animationType="fade">
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }}
          onPress={() => { setShowCountryDropdown(false); setCountrySearch(''); }}
        >
          <Pressable
            onPress={() => {}}
            style={{
              backgroundColor: C.surface,
              borderRadius: R.card,
              maxHeight: 480,
              width: '100%',
              maxWidth: 520,
              overflow: 'hidden',
              marginHorizontal: 20,
            }}
          >
            <View style={{
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: C.border,
            }}>
              <TextInput
                value={countrySearch}
                onChangeText={setCountrySearch}
                placeholder={t('onboarding.location.countryPlaceholder')}
                placeholderTextColor={C.placeholder}
                style={{
                  fontSize: 16,
                  paddingVertical: 10,
                  paddingHorizontal: 14,
                  backgroundColor: C.bg,
                  borderRadius: 8,
                  color: C.text,
                }}
                autoFocus
              />
            </View>
            <ScrollView style={{ maxHeight: 380 }}>
              {filteredCountries.map((country) => {
                const isSelected = data.country?.code === country.code;
                const isEnabled = country.code === PRE_ALPHA_COUNTRY_CODE;
                const label = locale === 'cs' && country.nameCs ? country.nameCs : country.name;
                return (
                  <OnboardingPressable
                    key={country.code}
                    disabled={!isEnabled}
                    onPress={() => {
                      if (!isEnabled) return;
                      update({ country, currency: country.currency });
                      setShowCountryDropdown(false);
                      setCountrySearch('');
                    }}
                    accessibilityRole="button"
                    accessibilityState={{ disabled: !isEnabled, selected: isSelected }}
                    style={({ pressed, hovered }) => ({
                      paddingHorizontal: 16,
                      paddingVertical: 14,
                      backgroundColor: isEnabled
                        ? listRowBg({ pressed, hovered, selected: isSelected, selectedBg: C.overlayHover })
                        : 'transparent',
                      borderBottomWidth: 0.5,
                      borderBottomColor: C.bg,
                      opacity: isEnabled ? 1 : 0.45,
                    })}
                  >
                    <Text style={{
                      fontSize: 16,
                      color: isSelected ? C.primary : isEnabled ? C.text : C.muted,
                      fontWeight: isSelected ? '500' : '400',
                    }}>
                      {label}
                    </Text>
                  </OnboardingPressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={showCurrencyDropdown} transparent animationType="fade">
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }}
          onPress={() => setShowCurrencyDropdown(false)}
        >
          <Pressable
            onPress={() => {}}
            style={{
              backgroundColor: C.surface,
              borderRadius: R.card,
              maxHeight: 400,
              width: '100%',
              maxWidth: 520,
              overflow: 'hidden',
              marginHorizontal: 20,
            }}
          >
            <ScrollView style={{ maxHeight: 380 }}>
              {CURRENCIES.map((item) => {
                const isSelected = data.currency === item.code;
                return (
                  <OnboardingPressable
                    key={item.code}
                    onPress={() => {
                      update({ currency: item.code });
                      setShowCurrencyDropdown(false);
                    }}
                    style={({ pressed, hovered }) => ({
                      paddingHorizontal: 16,
                      paddingVertical: 14,
                      backgroundColor: listRowBg({ pressed, hovered, selected: isSelected, selectedBg: C.overlayHover }),
                      borderBottomWidth: 0.5,
                      borderBottomColor: C.bg,
                    })}
                  >
                    <Text style={{
                      fontSize: 16,
                      color: isSelected ? C.primary : C.text,
                      fontWeight: isSelected ? '500' : '400',
                    }}>
                      {item.symbol} — {item.name} ({item.code})
                    </Text>
                  </OnboardingPressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
