import { View } from 'react-native';
import PillToggle from './PillToggle';
import { useI18n } from '../../lib/i18n';
import { C } from '../../constants/onboarding-theme';

/**
 * Standardised Yes / No binary toggle.
 * Wraps two PillToggle instances in a rounded container — the single canonical
 * pattern for all binary yes/no questions across onboarding.
 *
 * @param {Object} props
 * @param {boolean|null} props.value - Current selection: true=yes, false=no, null=unset
 * @param {Function} props.onChange - Called with true or false
 * @param {string} [props.yesLabel] - Override "Yes" label (defaults to common.yes)
 * @param {string} [props.noLabel] - Override "No" label (defaults to common.no)
 * @param {object} [props.containerStyle] - Additional styles on the outer View
 */
export default function YesNoToggle({ value, onChange, yesLabel, noLabel, containerStyle }) {
  const { t } = useI18n();

  return (
    <View style={[{
      flexDirection: 'row',
      borderRadius: 10,
      overflow: 'hidden',
      marginBottom: 20,
      borderWidth: 1,
      borderColor: C.border,
    }, containerStyle]}>
      <PillToggle
        label={noLabel ?? t('common.no')}
        selected={value === false}
        onPress={() => onChange(false)}
        paddingVertical={14}
        fontSize={15}
        fontWeight="500"
        darker
      />
      <PillToggle
        label={yesLabel ?? t('common.yes')}
        selected={value === true}
        onPress={() => onChange(true)}
        paddingVertical={14}
        fontSize={15}
        fontWeight="500"
        darker
      />
    </View>
  );
}
