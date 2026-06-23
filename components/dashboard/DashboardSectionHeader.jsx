import { View } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { C, T } from '../../constants/onboarding-theme';

/** Shared subsection title style for all dashboard tabs. */
export const dashboardSectionTitleStyle = T.cardTitle;

/**
 * Section-wide header with optional trailing actions and divider below.
 */
export default function DashboardSectionHeader({
  title,
  trailing,
  accessibilityRole = 'header',
  style,
  dividerStyle,
  contentStyle,
}) {
  return (
    <View style={style}>
      <View style={[{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        paddingBottom: 12,
      }, contentStyle]}>
        <Text
          accessibilityRole={accessibilityRole}
          style={[dashboardSectionTitleStyle, { flex: 1 }]}
          numberOfLines={2}
        >
          {title}
        </Text>
        {trailing ?? null}
      </View>
      <View style={[{
        height: 1,
        backgroundColor: C.divider,
        marginBottom: 16,
      }, dividerStyle]} />
    </View>
  );
}
