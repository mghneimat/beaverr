import { View } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { C } from '../../constants/onboarding-theme';

/**
 * Label + value row for read-only registration fields in profile/settings cards.
 */
export default function PreferenceReadRow({ label, value }) {
  return (
    <View style={{ gap: 4 }}>
      <Text style={{ fontSize: 13, fontWeight: '600', color: C.muted }}>
        {label}
      </Text>
      <Text style={{ fontSize: 15, fontWeight: '500', color: C.text }}>
        {value}
      </Text>
    </View>
  );
}
