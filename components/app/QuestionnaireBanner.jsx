import { useState } from 'react';
import { View, Pressable, Platform } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useRouter } from 'expo-router';
import { useI18n } from '../../lib/i18n';
import { useQuestionnaireBannerState } from '../../lib/useQuestionnaireBannerState';
import {
  resolveContinueQuestionnaireRoute,
  resolveStartQuestionnaireRoute,
} from '../../lib/questionnaireDashboardNav';
import { TriangleAlertIcon } from './AppNavIcons';
import { C, S, T } from '../../constants/onboarding-theme';

const CONTENT_MAX_WIDTH = 900;
const BANNER_ICON_SIZE = 18;
const CTA_HOVER_BG = 'rgba(245, 158, 11, 0.14)';
const CTA_PRESSED_BG = 'rgba(245, 158, 11, 0.22)';
const BANNER_TEXT = {
  fontSize: 14,
  lineHeight: 20,
  color: C.cycleWarning,
};

/**
 * Estimate warning + compact questionnaire CTA — shown below top nav when full setup is incomplete.
 */
export default function QuestionnaireBanner() {
  const { t } = useI18n();
  const router = useRouter();
  const { visible, showContinue } = useQuestionnaireBannerState();
  const [ctaHovered, setCtaHovered] = useState(false);

  if (!visible) return null;

  const ctaLabel = showContinue
    ? t('app.sidebar.continueQuestionnaire')
    : t('app.sidebar.startNewQuestionnaire');

  const handlePress = async () => {
    const route = showContinue
      ? await resolveContinueQuestionnaireRoute()
      : await resolveStartQuestionnaireRoute();
    if (route) router.push(route);
  };

  return (
    <View style={{
      paddingHorizontal: S.pagePadH,
      paddingTop: 12,
      paddingBottom: 12,
      backgroundColor: C.warningBg,
      borderBottomWidth: 1,
      borderBottomColor: C.warningBorder,
      alignItems: 'center',
    }}>
      <View
        accessibilityRole="alert"
        style={{
          width: '100%',
          maxWidth: CONTENT_MAX_WIDTH,
          paddingHorizontal: 2,
          paddingVertical: 2,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{
            flex: 1,
            minWidth: 0,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
          }}>
            <View style={{ flexShrink: 0 }}>
              <TriangleAlertIcon color={C.cycleWarning} size={BANNER_ICON_SIZE} />
            </View>
            <Text style={{
              ...T.helper,
              ...BANNER_TEXT,
              flex: 1,
              minWidth: 0,
              fontWeight: '500',
            }}>
              {t('app.questionnaireBanner.estimateWarning')}
            </Text>
          </View>
          <Pressable
            onPress={handlePress}
            onHoverIn={() => setCtaHovered(true)}
            onHoverOut={() => setCtaHovered(false)}
            accessibilityRole="button"
            accessibilityLabel={ctaLabel}
            hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
            style={({ pressed }) => ({
              flexShrink: 0,
              justifyContent: 'center',
              paddingVertical: 4,
              paddingHorizontal: 8,
              borderRadius: 6,
              backgroundColor: pressed
                ? CTA_PRESSED_BG
                : ctaHovered
                  ? CTA_HOVER_BG
                  : 'transparent',
              ...(Platform.OS === 'web' ? {
                cursor: 'pointer',
                transitionProperty: 'background-color',
                transitionDuration: '0.12s',
              } : {}),
            })}
          >
            {({ pressed }) => (
              <Text style={{
                ...BANNER_TEXT,
                fontWeight: '600',
                color: pressed || ctaHovered ? C.warning : C.cycleWarning,
                textDecorationLine: pressed || ctaHovered ? 'underline' : 'none',
              }}>
                {ctaLabel}
              </Text>
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}
