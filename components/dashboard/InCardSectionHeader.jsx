import { View } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { T } from '../../constants/onboarding-theme';
import { compactChildren } from '../../lib/compactChildren';

/**
 * Section title row inside a SurfaceCard — consistent T.cardTitle sizing.
 */
export default function InCardSectionHeader({ title, trailing, style, titleStyle }) {
  return (
    <View style={[{
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      marginBottom: 16,
    }, style]}
    >
      {compactChildren(
        <>
          <Text
            accessibilityRole="header"
            style={[T.cardTitle, { flex: 1 }, titleStyle]}
            numberOfLines={3}
          >
            {title}
          </Text>
          {trailing ?? null}
        </>,
      )}
    </View>
  );
}
