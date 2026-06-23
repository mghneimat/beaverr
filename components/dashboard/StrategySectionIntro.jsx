import { View } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { C, T } from '../../constants/onboarding-theme';

/**
 * In-card section title + helper for budget strategy pickers.
 */
export default function StrategySectionIntro({ sectionLabel, helper, style }) {
  return (
    <View style={[{ marginBottom: 16 }, style]}>
      <Text
        accessibilityRole="header"
        style={{
          ...T.cardTitle,
          marginBottom: 6,
        }}
      >
        {sectionLabel}
      </Text>
      <Text style={{ ...T.helper, color: C.muted, lineHeight: 20 }}>
        {helper}
      </Text>
    </View>
  );
}
