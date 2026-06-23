import { View } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import PillToggle from './PillToggle';
import { useI18n } from '../../lib/i18n';
import { C, R, S, T } from '../../constants/onboarding-theme';

/**
 * Standardised frequency selector pill group — Balshet dark-grey selected state.
 *
 * @param {Object} props
 * @param {string[]} props.options - Frequency keys, e.g. ['daily','weekly','monthly']
 * @param {string} props.value - Currently selected frequency key
 * @param {Function} props.onChange - Called with the selected frequency key
 * @param {Object} [props.labelMap] - Optional override map: { daily: 'Per day', ... }
 * @param {boolean} [props.small] - Smaller pill padding/font (for use inside cards)
 * @param {string} [props.label] - Visible label above the pill group
 * @param {object} [props.containerStyle] - Additional styles on the outer View
 * @param {'default'|'segment'} [props.variant='default'] - segment = inset track, distinct from CTAs
 */
export default function FrequencyPills({
  options,
  value,
  onChange,
  labelMap,
  label,
  small = false,
  containerStyle,
  variant = 'default',
}) {
  const { t } = useI18n();

  const getLabel = (freq) => {
    if (labelMap && labelMap[freq]) return labelMap[freq];
    return t(`common.${freq}`);
  };

  const groupLabel = label ?? t('common.frequency');
  const isSegment = variant === 'segment';

  return (
    <View style={[{ marginBottom: small ? 10 : 12 }, containerStyle]}>
      {groupLabel ? (
        <Text style={{ ...T.fieldLabel, marginBottom: S.labelGap }}>{groupLabel}</Text>
      ) : null}
      <View
        accessibilityRole="radiogroup"
        accessibilityLabel={groupLabel}
        style={{
          flexDirection: 'row',
          flexWrap: isSegment ? 'nowrap' : 'wrap',
          gap: isSegment ? 4 : 8,
          ...(isSegment ? {
            backgroundColor: C.bg,
            borderRadius: R.pill,
            padding: 4,
            borderWidth: 1,
            borderColor: C.border,
          } : {}),
        }}
      >
      {options.map((freq) => (
        <PillToggle
          key={freq}
          label={getLabel(freq)}
          selected={value === freq}
          onPress={() => onChange(freq)}
          paddingVertical={small ? 8 : 14}
          paddingHorizontal={small ? 12 : 20}
          fontSize={small ? 13 : 14}
          fontWeight="500"
          borderRadius={isSegment ? R.button : 99}
          variant={variant}
          minHeight={isSegment ? (small ? 36 : 40) : 44}
        />
      ))}
      </View>
    </View>
  );
}
