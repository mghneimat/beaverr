import { View } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { T } from '../../constants/onboarding-theme';
import { compactChildren } from '../../lib/compactChildren';
import { useDashboardLayout } from '../../lib/dashboardLayout';

/**
 * Section title row inside a SurfaceCard — consistent T.cardTitle sizing.
 */
export default function InCardSectionHeader({ title, trailing, style, titleStyle }) {
  const { isPhone } = useDashboardLayout();

  return (
    <View style={[{
      flexDirection: 'row',
      alignItems: isPhone ? 'flex-start' : 'center',
      justifyContent: 'space-between',
      gap: 12,
      marginBottom: 16,
      flexWrap: isPhone ? 'wrap' : 'nowrap',
    }, style]}
    >
      {compactChildren(
        <>
          <Text
            accessibilityRole="header"
            style={[T.cardTitle, { flex: 1, minWidth: isPhone ? '55%' : 0 }, titleStyle]}
            numberOfLines={3}
          >
            {title}
          </Text>
          {trailing ? (
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              flexShrink: 0,
              flexWrap: isPhone ? 'wrap' : 'nowrap',
              justifyContent: 'flex-end',
              maxWidth: isPhone ? '100%' : undefined,
            }}
            >
              {trailing}
            </View>
          ) : null}
        </>,
      )}
    </View>
  );
}
