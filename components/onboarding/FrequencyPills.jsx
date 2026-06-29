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
 * @param {number} [props.columns] - Choice variant: equal-width grid columns (default 2)
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
  columns: columnsProp,
}) {
  const { t } = useI18n();

  const getLabel = (freq) => {
    if (labelMap && labelMap[freq]) return labelMap[freq];
    return t(`common.${freq}`);
  };

  const groupLabel = label ?? t('common.frequency');
  const isSegment = variant === 'segment';
  const isChoice = variant === 'choice';
  const columns = isChoice ? (columnsProp ?? 2) : columnsProp;
  const choiceGap = 8;
  const choiceCellBasis =
    columns === 3 ? '31%' : columns === 2 ? '48%' : '100%';

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
          gap: isSegment ? 4 : isChoice ? choiceGap : 8,
          width: isChoice ? '100%' : undefined,
          ...(isSegment ? {
            backgroundColor: C.bg,
            borderRadius: R.pill,
            padding: 4,
            borderWidth: 1,
            borderColor: C.border,
          } : {}),
        }}
      >
      {options.map((freq) => {
        const pillProps = {
          label: getLabel(freq),
          selected: value === freq,
          onPress: () => onChange(freq),
          paddingVertical: small || isChoice ? 10 : 14,
          paddingHorizontal: small || isChoice ? 14 : 20,
          fontSize: small || isChoice ? 13 : 14,
          fontWeight: '500',
          borderRadius: isSegment || isChoice ? R.button : 99,
          variant,
          minHeight: isSegment ? (small ? 36 : 40) : isChoice ? 40 : 44,
          expand: isSegment || isChoice,
        };

        if (isChoice && columns) {
          return (
            <View
              key={freq}
              style={{
                flexGrow: 1,
                flexShrink: 0,
                flexBasis: choiceCellBasis,
                maxWidth: choiceCellBasis,
              }}
            >
              <PillToggle {...pillProps} style={{ width: '100%', alignSelf: 'stretch' }} />
            </View>
          );
        }

        return <PillToggle key={freq} {...pillProps} />;
      })}
      </View>
    </View>
  );
}
