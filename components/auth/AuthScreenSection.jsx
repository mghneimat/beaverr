import { View } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { C, T } from '../../constants/onboarding-theme';

const SECTION_FIELD_GAP = 10;

/**
 * Titled field group inside an auth card.
 */
export default function AuthScreenSection({ title, children, showDivider = false }) {
  return (
    <View style={{ width: '100%', gap: SECTION_FIELD_GAP }}>
      {showDivider ? (
        <View style={{ height: 1, backgroundColor: C.border, marginBottom: 2 }} />
      ) : null}
      <Text
        accessibilityRole="header"
        style={{
          ...T.sectionLabel,
          textTransform: 'uppercase',
          letterSpacing: 0.6,
        }}
      >
        {title}
      </Text>
      <View style={{ gap: SECTION_FIELD_GAP, width: '100%', alignItems: 'stretch' }}>
        {children}
      </View>
    </View>
  );
}
