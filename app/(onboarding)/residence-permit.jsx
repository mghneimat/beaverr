import { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useI18n } from '../../lib/i18n';
import { getData, setData } from '../../lib/storage';
import { patchOnboardingState } from '../../lib/onboardingProgress';
import { navigateBack, navigateForward } from '../../lib/onboardingNavigation';
import { getCurrencySymbol } from '../../lib/currency';
import {
  parseCitizenshipSubject,
  getResidencePermit,
  getFirstFamilyPermitEndDate,
  getResidencePermitCopy,
  getResidencePermitBackRoute,
  saveResidencePermit,
  routeAfterPermitComplete,
} from '../../lib/citizenshipFlow';
import { defaultChildResidencePermitRenewalCost } from '../../lib/residencePermits';
import { useOnboardingLayout } from '../../lib/onboardingLayout';
import { useOnboardingMultiStep } from '../../lib/useOnboardingMultiStep';
import QuestionScreen from '../../components/onboarding/QuestionScreen';
import ResidencePermitFields from '../../components/onboarding/ResidencePermitFields';
import CitizenshipIdCardIllustration from '../../components/onboarding/CitizenshipIdCardIllustration';

/** @typedef {{ type?: string, endDate?: string, renewalCost?: string }} PermitFieldErrors */

export default function ResidencePermitScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const layout = useOnboardingLayout();
  const params = useLocalSearchParams();
  const { subject, childIndex } = parseCitizenshipSubject(params);

  useOnboardingMultiStep('residence-permit', {
    defaultStep: subject,
    childIndex,
  });

  const [household, setHousehold] = useState(null);
  const [currencyCode, setCurrencyCode] = useState('CZK');
  const [permitType, setPermitType] = useState('');
  const [endDate, setEndDate] = useState('');
  const [renewalCost, setRenewalCost] = useState('');
  /** @type {[PermitFieldErrors, Function]} */
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    (async () => {
      const [location, hh] = await Promise.all([
        getData('beaverr_location'),
        getData('beaverr_household'),
      ]);
      setHousehold(hh);
      if (location?.currency) setCurrencyCode(location.currency);
      const permit = getResidencePermit(location, subject, childIndex);
      const familyEndDate = getFirstFamilyPermitEndDate(location, subject, childIndex);
      const childDefaultRenewal = subject === 'child'
        ? defaultChildResidencePermitRenewalCost(hh?.children?.[childIndex]?.ageGroup)
        : null;
      if (permit) {
        setPermitType(permit.type || '');
        setEndDate(permit.endDate || familyEndDate || '');
        setRenewalCost(
          permit.renewalCost != null
            ? String(permit.renewalCost)
            : childDefaultRenewal != null
              ? String(childDefaultRenewal)
              : '',
        );
      } else {
        setPermitType('');
        setEndDate(familyEndDate || '');
        setRenewalCost(childDefaultRenewal != null ? String(childDefaultRenewal) : '');
      }
    })();
  }, [subject, childIndex]);

  const currency = getCurrencySymbol(currencyCode);
  const copy = getResidencePermitCopy(subject, childIndex, household, t);

  const clearFieldError = (field) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleContinue = async () => {
    /** @type {PermitFieldErrors} */
    const nextErrors = {};
    if (!permitType) {
      nextErrors.type = t('onboarding.residencePermit.validationType');
    }
    if (!endDate) {
      nextErrors.endDate = t('onboarding.residencePermit.validationEndDate');
    }
    if (!renewalCost) {
      nextErrors.renewalCost = t('onboarding.residencePermit.validationRenewalCost');
    }
    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    setFieldErrors({});

    await saveResidencePermit(
      {
        type: permitType,
        endDate,
        renewalCost: parseFloat(renewalCost) || 0,
      },
      subject,
      childIndex,
    );

    await patchOnboardingState({
      completed: false,
      currentStep: 'occupation',
      resumeRoute: `/(onboarding)/residence-permit?subject=${subject}${subject === 'child' ? `&childIndex=${childIndex}` : ''}`,
    });

    await routeAfterPermitComplete(subject, childIndex, router);
  };

  const handleBack = async () => {
    const [location, hh] = await Promise.all([
      getData('beaverr_location'),
      getData('beaverr_household'),
    ]);
    const backRoute = getResidencePermitBackRoute(subject, childIndex, location, hh);
    if (backRoute.includes('citizenship')) {
      navigateBack();
      return;
    }
    navigateForward(backRoute);
  };

  return (
    <QuestionScreen
      animationKey={`${subject}-${childIndex}-permit`}
      chapter={t('onboarding.location.chapter')}
      illustration={<CitizenshipIdCardIllustration width={layout.illustrationWidth} />}
      title={copy.title}
      helper={copy.helper}
      onContinue={handleContinue}
      onBack={handleBack}
      resumeRoute={`/(onboarding)/residence-permit?subject=${subject}${subject === 'child' ? `&childIndex=${childIndex}` : ''}`}
    >
      <ResidencePermitFields
        permitType={permitType}
        onPermitTypeChange={setPermitType}
        endDate={endDate}
        onEndDateChange={setEndDate}
        renewalCost={renewalCost}
        onRenewalCostChange={setRenewalCost}
        currency={currency}
        fieldErrors={fieldErrors}
        onClearFieldError={clearFieldError}
      />
    </QuestionScreen>
  );
}
