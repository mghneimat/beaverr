import { View, Pressable, Platform } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useRouter } from 'expo-router';
import { useI18n } from '../../lib/i18n';
import { useQuestionnaireBannerState } from '../../lib/useQuestionnaireBannerState';
import { C, R, S, T } from '../../constants/onboarding-theme';

const CONTENT_MAX_WIDTH = 900;
const BANNER_PROGRESS_HEIGHT = 6;
const BANNER_PROGRESS_ROW_HEIGHT = 18;

/**
 * Questionnaire progress strip — shown below top nav when dashboard is unlocked but full setup is incomplete.
 */
export default function QuestionnaireBanner() {
  const { t } = useI18n();
  const router = useRouter();
  const { visible, percent, navigationRoute } = useQuestionnaireBannerState();

  if (!visible) return null;

  const handleContinue = () => {
    router.push(navigationRoute);
  };

  return (
    <View style={{
      backgroundColor: C.bg,
      paddingHorizontal: S.pagePadH,
      paddingTop: 12,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: C.border,
      alignItems: 'center',
    }}>
      <Pressable
        onPress={handleContinue}
        accessibilityRole="button"
        accessibilityLabel={t('app.questionnaireBanner.progressA11y', { percent })}
        style={({ pressed, hovered }) => ({
          width: '100%',
          maxWidth: CONTENT_MAX_WIDTH,
          paddingHorizontal: 16,
          paddingVertical: 14,
          borderRadius: R.card,
          borderWidth: 1,
          borderColor: hovered || pressed ? C.accent : C.infoBorder,
          backgroundColor: pressed || hovered ? C.infoBorder : C.infoBg,
          ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
        })}
      >
        <Text style={{ fontSize: 14, fontWeight: '600', color: C.infoText, marginBottom: 4 }}>
          {t('app.questionnaireBanner.title')}
        </Text>
        <Text style={{ fontSize: 13, lineHeight: 18, color: C.infoText, marginBottom: 12 }}>
          {t('app.questionnaireBanner.progressHint')}
        </Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ flex: 1, height: BANNER_PROGRESS_ROW_HEIGHT, justifyContent: 'center' }}>
            <View
              accessibilityRole="progressbar"
              accessibilityValue={{ min: 0, max: 100, now: percent }}
              style={{
                height: BANNER_PROGRESS_HEIGHT,
                backgroundColor: C.surface,
                borderWidth: 1,
                borderColor: C.infoBorder,
                borderRadius: R.pill,
                overflow: 'hidden',
              }}
            >
              <View style={{
                width: `${percent}%`,
                height: '100%',
                backgroundColor: C.progressFill,
              }} />
            </View>
          </View>
          <Text style={{
            fontSize: 13,
            lineHeight: BANNER_PROGRESS_ROW_HEIGHT,
            fontWeight: '600',
            color: C.infoText,
            includeFontPadding: false,
            transform: [{ translateY: -2 }],
          }}>
            {percent}%
          </Text>
        </View>
      </Pressable>

      <View
        accessibilityRole="alert"
        style={{
          width: '100%',
          maxWidth: CONTENT_MAX_WIDTH,
          marginTop: 10,
          paddingHorizontal: 14,
          paddingVertical: 12,
          borderRadius: R.chip,
          backgroundColor: C.dangerBg,
          borderWidth: 1,
          borderColor: C.dangerBorder,
        }}
      >
        <Text style={{ ...T.helper, fontSize: 14, lineHeight: 20, color: C.danger, fontWeight: '500' }}>
          {t('app.questionnaireBanner.estimateWarning')}
        </Text>
      </View>
    </View>
  );
}
