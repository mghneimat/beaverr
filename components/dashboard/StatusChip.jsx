import { View } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { C, R, T } from '../../constants/onboarding-theme';

/** Resolve at render time so theme tokens stay in sync with dark/light mode. */
function chipColors(variant) {
  switch (variant) {
    case 'positive':
      return { bg: C.positiveBg, text: C.positive, border: C.positiveBorder };
    case 'danger':
      return { bg: C.dangerBg, text: C.danger, border: C.dangerBorder };
    case 'info':
      return { bg: C.infoBg, text: C.infoText, border: C.infoBorder };
    default:
      return { bg: C.surfaceTint, text: C.muted, border: C.border };
  }
}

export default function StatusChip({ label, variant = 'muted', style }) {
  const colors = chipColors(variant);

  return (
    <View style={[{
      alignSelf: 'flex-start',
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: R.pill,
      backgroundColor: colors.bg,
      borderWidth: 1,
      borderColor: colors.border,
      marginTop: 8,
      marginBottom: 4,
    }, style]}
    >
      <Text style={{ ...T.caption, fontWeight: '500', color: colors.text }}>{label}</Text>
    </View>
  );
}
