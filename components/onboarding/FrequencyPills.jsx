import { View } from 'react-native';
import PillToggle from './PillToggle';
import { useI18n } from '../../lib/i18n';
import { C } from '../../constants/onboarding-theme';

/**
 * Standardised frequency selector pill group.
 * Updated to match UI Examples — pills are rounded-full with navy selected state.
 *
 * @param {Object} props
 * @param {string[]} props.options - Frequency keys, e.g. ['daily','weekly','monthly']
 * @param {string} props.value - Currently selected frequency key
 * @param {Function} props.onChange - Called with the selected frequency key
 * @param {Object} [props.labelMap] - Optional override map: { daily: 'Per day', ... }
 * @param {boolean} [props.small] - Smaller pill padding/font (for use inside cards)
 * @param {object} [props.containerStyle] - Additional styles on the outer View
 */
export default function FrequencyPills({
  options,
  value,
  onChange,
  labelMap,
  small = false,
  containerStyle,
}) {
  const { t } = useI18n();

  const getLabel = (freq) => {
    if (labelMap && labelMap[freq]) return labelMap[freq];
    return t(`common.${freq}`);
  };

  return (
    <View style={[{
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: small ? 10 : 12,
    }, containerStyle]}>
      {options.map((freq) => (
        <PillToggle
          key={freq}
          label={getLabel(freq)}
          selected={value === freq}
          onPress={() => onChange(freq)}
          paddingVertical={small ? 10 : 14}
          paddingHorizontal={small ? 16 : 20}
          fontSize={small ? 13 : 14}
          fontWeight="500"
          borderRadius={99}
        />
      ))}
    </View>
  );
}
