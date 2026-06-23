import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useI18n } from '../../../lib/i18n';
import { getData } from '../../../lib/storage';
import { C, T, R } from '../../../constants/onboarding-theme';
import OptionCard from '../../onboarding/OptionCard';
import AnimatedSlideIn from '../../onboarding/AnimatedSlideIn';
import InsuranceContractFields from '../../onboarding/InsuranceContractFields';

/**
 * Per-member health insurance editor — coverage choice + private contract fields.
 */
export default function HealthMemberFields({
  memberId,
  memberLabel,
  data,
  onUpdate,
  currency,
  savingsBalance = 0,
}) {
  const { t } = useI18n();
  const [occupation, setOccupation] = useState(null);

  useEffect(() => {
    getData('beaverr_occupation').then(setOccupation);
  }, []);

  const isEmployer = data.coverage === 'employer';
  const isPrivate = data.coverage === 'private';
  const isSkipped = data.skipped === true;

  const isEmployee = (() => {
    if (!occupation) return false;
    if (memberId === 'user') return occupation.user === 'employee';
    if (memberId === 'partner') return occupation.partner === 'employee';
    return false;
  })();

  const setCoverage = (patch) => {
    onUpdate({ ...patch, confirmed: patch.confirmed ?? data.confirmed });
  };

  return (
    <View>
      <Text style={{ fontSize: 15, fontWeight: '600', color: C.primary, marginBottom: 12 }}>
        {memberLabel}
      </Text>

      <AnimatedSlideIn visible={!isPrivate && !isSkipped}>
        <OptionCard
          label={t('onboarding.health.coveredByEmployer')}
          selected={isEmployer}
          onPress={() => {
            if (isEmployer) {
              setCoverage({ coverage: null, skipped: false, confirmed: false });
            } else {
              setCoverage({ coverage: 'employer', skipped: false, confirmed: true });
            }
          }}
        />
      </AnimatedSlideIn>

      <AnimatedSlideIn visible={!isEmployer && !isSkipped}>
        <OptionCard
          label={t('onboarding.health.payPrivately')}
          selected={isPrivate}
          onPress={() => {
            if (isPrivate) {
              setCoverage({ coverage: null, skipped: false, confirmed: false });
            } else {
              setCoverage({ coverage: 'private', skipped: false, confirmed: true });
            }
          }}
        />
      </AnimatedSlideIn>

      <AnimatedSlideIn visible={!isEmployer && !isPrivate}>
        <OptionCard
          label={t('common.skip')}
          selected={isSkipped}
          onPress={() => {
            if (isSkipped) {
              setCoverage({ skipped: false, coverage: null, confirmed: false });
            } else {
              setCoverage({ skipped: true, coverage: null, confirmed: false });
            }
          }}
        />
      </AnimatedSlideIn>

      <AnimatedSlideIn visible={isEmployer && isEmployee}>
        <View style={{
          padding: 16,
          backgroundColor: C.positiveBg || 'rgba(58,140,110,0.08)',
          borderRadius: R.card,
          borderWidth: 1,
          borderColor: C.positiveBorder || 'rgba(58,140,110,0.2)',
          marginTop: 16,
        }}>
          <Text style={{ ...T.helper, color: C.text }}>
            {t('onboarding.health.coveredByEmployerNote')}
          </Text>
        </View>
      </AnimatedSlideIn>

      <AnimatedSlideIn visible={isPrivate}>
        <View style={{ marginTop: 16 }}>
          <InsuranceContractFields
            data={data}
            onUpdate={onUpdate}
            currency={currency}
            savingsBalance={savingsBalance}
          />
        </View>
      </AnimatedSlideIn>
    </View>
  );
}
