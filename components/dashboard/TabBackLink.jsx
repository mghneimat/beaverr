import { Pressable, Platform } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useRouter } from 'expo-router';
import { useI18n } from '../../lib/i18n';
import { navigateBackFromTabDetail, navigateBackToAppTab } from '../../lib/screenTransition';
import { C, T } from '../../constants/onboarding-theme';

/**
 * Text back link for hidden dashboard routes (e.g. reduce-costs → goals).
 */
export default function TabBackLink({ route, labelKey, pop = false }) {
  const { t } = useI18n();
  const router = useRouter();

  const handlePress = () => {
    if (pop) {
      navigateBackFromTabDetail(router);
      return;
    }
    navigateBackToAppTab(router, route);
  };

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={t(labelKey)}
      hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
      style={({ pressed, hovered }) => ({
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 44,
        marginBottom: 12,
        paddingVertical: 4,
        opacity: pressed ? 0.7 : 1,
        ...(Platform.OS === 'web' && hovered ? { opacity: 0.85 } : {}),
        ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
      })}
    >
      <Text style={{ ...T.helper, fontSize: 15, fontWeight: '600', color: C.accent }}>
        {`← ${t(labelKey)}`}
      </Text>
    </Pressable>
  );
}
