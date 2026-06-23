import { View } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { C, R, T } from '../../constants/onboarding-theme';

const VARIANTS = {
  positive: { bg: '#D1FAE5', text: C.positive, border: C.positive },
  danger: { bg: C.dangerBg, text: C.danger, border: C.danger },
  muted: { bg: C.infoWashBg, text: C.muted, border: C.border },
  info: { bg: C.infoBg, text: C.infoText, border: C.infoText },
};

export default function StatusChip({ label, variant = 'muted', style }) {
  const colors = VARIANTS[variant] || VARIANTS.muted;

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
    }, style]}>
      <Text style={{ ...T.caption, fontWeight: '600', color: colors.text }}>{label}</Text>
    </View>
  );
}
