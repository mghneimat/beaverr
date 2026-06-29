import { View } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useI18n } from '../../lib/i18n';
import { RESIDENCE_PERMIT_TYPES } from '../../lib/residencePermits';
import { T, C } from '../../constants/onboarding-theme';
import OptionCard from './OptionCard';
import InputGroup from './InputGroup';
import LabeledInput from './LabeledInput';
import SplitDateFields from './SplitDateFields';

/**
 * @param {Object} props
 * @param {string} props.permitType
 * @param {(type: string) => void} props.onPermitTypeChange
 * @param {string} props.endDate
 * @param {(date: string) => void} props.onEndDateChange
 * @param {string} props.renewalCost
 * @param {(cost: string) => void} props.onRenewalCostChange
 * @param {string} props.currency
 * @param {{ type?: string, endDate?: string, renewalCost?: string }} [props.fieldErrors]
 * @param {(field: 'type'|'endDate'|'renewalCost') => void} [props.onClearFieldError]
 */
export default function ResidencePermitFields({
  permitType,
  onPermitTypeChange,
  endDate,
  onEndDateChange,
  renewalCost,
  onRenewalCostChange,
  currency,
  fieldErrors = {},
  onClearFieldError,
}) {
  const { t } = useI18n();

  return (
    <>
      <InputGroup
        label={t('onboarding.residencePermit.typeLabel')}
        errorText={fieldErrors.type || undefined}
        showErrorMessage
      >
        {RESIDENCE_PERMIT_TYPES.map((type) => (
          <OptionCard
            key={type}
            label={t(`onboarding.residencePermit.types.${type}`)}
            selected={permitType === type}
            onPress={() => {
              onPermitTypeChange(permitType === type ? '' : type);
              onClearFieldError?.('type');
            }}
          />
        ))}
      </InputGroup>

      <View style={{ marginTop: 8 }}>
        <InputGroup
          label={t('onboarding.residencePermit.endDateLabel')}
          errorText={fieldErrors.endDate || undefined}
        >
          <SplitDateFields
            value={endDate}
            onChange={(v) => {
              onEndDateChange(v);
              onClearFieldError?.('endDate');
            }}
            errorText={fieldErrors.endDate || undefined}
            inGroup
            yearEnd={new Date().getFullYear() + 15}
          />
        </InputGroup>
        <Text style={{ ...T.caption, color: C.muted, marginTop: 8, marginBottom: 8 }}>
          {t('onboarding.residencePermit.endDateHelper')}
        </Text>

        <View style={{ marginTop: 4 }}>
        <InputGroup
          label={t('onboarding.residencePermit.renewalCostLabel')}
          errorText={fieldErrors.renewalCost || undefined}
        >
          <LabeledInput
            value={renewalCost}
            onChangeText={(v) => {
              onRenewalCostChange(v);
              onClearFieldError?.('renewalCost');
            }}
            errorText={fieldErrors.renewalCost || undefined}
            numeric
            placeholder={t('onboarding.residencePermit.renewalCostPlaceholder')}
            large
            inGroup
            currency={currency}
          />
        </InputGroup>
        <Text style={{ ...T.caption, color: C.muted, marginTop: 8 }}>
          {t('onboarding.residencePermit.renewalCostHelper')}
        </Text>
        </View>
      </View>
    </>
  );
}
