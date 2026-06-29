import { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useI18n } from '../../lib/i18n';
import { getData, setData } from '../../lib/storage';
import { patchOnboardingState } from '../../lib/onboardingProgress';
import { navigateBack } from '../../lib/onboardingNavigation';
import {
  hasPartner,
  routeAfterAllCitizenshipAnswered,
  shouldRevealChildrenCitizenship,
  validateCitizenshipDraft,
} from '../../lib/citizenshipFlow';
import { useOnboardingLayout } from '../../lib/onboardingLayout';
import { useOnboardingMultiStep } from '../../lib/useOnboardingMultiStep';
import { C, R, S, T } from '../../constants/onboarding-theme';
import { getCountryDisplayName, PRE_ALPHA_COUNTRY_CODE } from '../../lib/locationConstants';
import { InfoIcon } from '../../components/app/AppNavIcons';
import QuestionScreen from '../../components/onboarding/QuestionScreen';
import YesNoToggle from '../../components/onboarding/YesNoToggle';
import AnimatedSlideIn from '../../components/onboarding/AnimatedSlideIn';
import CitizenshipIdCardIllustration from '../../components/onboarding/CitizenshipIdCardIllustration';

const INFO_SIZE = 16;

function CitizenshipListDivider() {
  return (
    <View
      style={{
        height: StyleSheet.hairlineWidth,
        backgroundColor: C.divider,
        alignSelf: 'stretch',
      }}
    />
  );
}

/** @param {string} ageGroup */
function householdAgeGroupLabel(ageGroup, t) {
  const labels = {
    '0-2': t('onboarding.household.childDetails.age0'),
    '3-5': t('onboarding.household.childDetails.age3'),
    '6-15': t('onboarding.household.childDetails.age6'),
    '16-18': t('onboarding.household.childDetails.age16'),
    '18+': t('onboarding.household.childDetails.age18'),
  };
  return labels[ageGroup] ?? '';
}

function CitizenshipInfoBanner({ message }) {
  return (
    <View
      accessibilityRole="text"
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        backgroundColor: C.surfaceTint,
        borderRadius: R.input,
        padding: 12,
      }}
    >
      <View style={{ width: 28, height: 28, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <InfoIcon color={C.primary} size={INFO_SIZE} />
      </View>
      <Text style={{ ...T.caption, color: C.muted, flex: 1, lineHeight: 18 }}>
        {message}
      </Text>
    </View>
  );
}

function CitizenshipMemberRow({
  label,
  value,
  onChange,
  yesLabel,
  noLabel,
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        gap: 12,
      }}
    >
      <Text
        style={{ ...T.cardTitle, flex: 1, minWidth: 0, fontSize: 15 }}
        numberOfLines={2}
      >
        {label}
      </Text>
      <YesNoToggle
        value={value}
        onChange={onChange}
        yesLabel={yesLabel}
        noLabel={noLabel}
        allowUnset
        variant="inline"
      />
    </View>
  );
}

export default function CitizenshipScreen() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const layout = useOnboardingLayout();

  useOnboardingMultiStep('citizenship', { defaultStep: 'user' });

  const [household, setHousehold] = useState(null);
  const [countryName, setCountryName] = useState(() => getCountryDisplayName(PRE_ALPHA_COUNTRY_CODE, locale));
  const [draft, setDraft] = useState({ user: null, partner: null, children: [] });
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    (async () => {
      const [location, hh] = await Promise.all([
        getData('beaverr_location'),
        getData('beaverr_household'),
      ]);
      setHousehold(hh);
      setCountryName(getCountryDisplayName(location?.country, locale));
      const storedChildren = location?.childrenCitizenship || [];
      setDraft({
        user: location?.isCzCitizen ?? null,
        partner: hasPartner(hh) ? (location?.partnerIsCzCitizen ?? null) : null,
        children: (hh?.children || []).map((_, i) => storedChildren[i]?.isCzCitizen ?? null),
      });
    })();
  }, [locale]);

  const showChildren = useMemo(
    () => shouldRevealChildrenCitizenship(draft, household),
    [draft, household],
  );

  const clearChildrenIfHidden = useCallback((nextDraft, hh) => {
    if (!shouldRevealChildrenCitizenship(nextDraft, hh)) {
      return { ...nextDraft, children: [] };
    }
    return nextDraft;
  }, []);

  const handleUserChange = (val) => {
    setDraft((prev) => clearChildrenIfHidden({ ...prev, user: val }, household));
    setValidationError('');
  };

  const handlePartnerChange = (val) => {
    setDraft((prev) => clearChildrenIfHidden({ ...prev, partner: val }, household));
    setValidationError('');
  };

  const handleChildChange = (index, val) => {
    setDraft((prev) => {
      const children = [...prev.children];
      children[index] = val;
      return { ...prev, children };
    });
    setValidationError('');
  };

  const handleContinue = async () => {
    const error = validateCitizenshipDraft(draft, household, t);
    if (error) {
      setValidationError(error);
      return;
    }

    await patchOnboardingState({
      completed: false,
      currentStep: showChildren ? 'childrenCitizenship' : 'citizenship',
      resumeRoute: '/(onboarding)/citizenship',
    });

    await routeAfterAllCitizenshipAnswered(draft, household, router);
  };

  const handleBack = () => {
    navigateBack();
  };

  const childRows = household?.children || [];
  const partnerPresent = hasPartner(household);

  const formatChildLabel = (child, index) => {
    const name = child.displayName?.trim()
      || `${t('onboarding.health.child')} ${index + 1}`;
    const age = householdAgeGroupLabel(child.ageGroup, t);
    return age
      ? t('onboarding.citizenship.memberWithAge', { name, age })
      : name;
  };

  return (
    <QuestionScreen
      animationKey="citizenship-all"
      chapter={t('onboarding.splashResidence.chapter')}
      illustration={<CitizenshipIdCardIllustration width={layout.illustrationWidth} />}
      title={t('onboarding.citizenship.allTitle', { country: countryName })}
      helper={t('onboarding.citizenship.allHelper')}
      onContinue={handleContinue}
      onBack={handleBack}
      validationError={validationError}
      setValidationError={setValidationError}
      resumeRoute="/(onboarding)/citizenship"
    >
      <View style={{ overflow: 'hidden' }}>
        <CitizenshipMemberRow
          label={t('onboarding.health.you')}
          value={draft.user}
          onChange={handleUserChange}
          yesLabel={t('common.yes')}
          noLabel={t('common.no')}
        />
        {partnerPresent || showChildren ? <CitizenshipListDivider /> : null}

        {partnerPresent ? (
          <>
            <CitizenshipMemberRow
              label={household.partnerName}
              value={draft.partner}
              onChange={handlePartnerChange}
              yesLabel={t('common.yes')}
              noLabel={t('common.no')}
            />
            {showChildren ? <CitizenshipListDivider /> : null}
          </>
        ) : null}

        <AnimatedSlideIn visible={showChildren} spacingTop={0}>
          <View style={{ paddingVertical: S.labelGap + 6 }}>
            <CitizenshipInfoBanner message={t('onboarding.citizenship.childHelper')} />
          </View>
          {childRows.map((child, index) => (
            <View key={`child-${index}`}>
              <CitizenshipListDivider />
              <CitizenshipMemberRow
                label={formatChildLabel(child, index)}
                value={draft.children[index] ?? null}
                onChange={(val) => handleChildChange(index, val)}
                yesLabel={t('common.yes')}
                noLabel={t('common.no')}
              />
            </View>
          ))}
        </AnimatedSlideIn>
      </View>
    </QuestionScreen>
  );
}
