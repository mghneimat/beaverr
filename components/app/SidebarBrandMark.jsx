import { View } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { useI18n } from '../../lib/i18n';
import { C, R } from '../../constants/onboarding-theme';
import { sansFontFamily } from '../../lib/fonts';
import BeaverrWordmark from './BeaverrWordmark';

const WORDMARK_FONT_SIZE = 24;
const WORDMARK_LINE_HEIGHT = 28;
const BRAND_ROW_HEIGHT = WORDMARK_LINE_HEIGHT;
const BRAND_ROW_PAD_EXPANDED = 20;
/** Wordmark + alpha badge clip width */
const BRAND_CLIP_WIDTH = 182;

/**
 * Sidebar brand — “Beaverr” + alpha badge; clips away on collapse.
 */
export default function SidebarBrandMark({
  collapseProgress,
  animateCollapse = true,
  alphaLabel,
  accessibilityLabel,
}) {
  const { t } = useI18n();

  const brandRowStyle = useAnimatedStyle(() => {
    if (!animateCollapse) {
      return { paddingLeft: BRAND_ROW_PAD_EXPANDED };
    }
    return {
      paddingLeft: interpolate(
        collapseProgress.value,
        [0, 1],
        [BRAND_ROW_PAD_EXPANDED, 8],
        Extrapolation.CLAMP,
      ),
    };
  });

  const brandClipStyle = useAnimatedStyle(() => {
    if (!animateCollapse) {
      return { width: BRAND_CLIP_WIDTH, opacity: 1 };
    }
    return {
      width: interpolate(
        collapseProgress.value,
        [0, 1],
        [BRAND_CLIP_WIDTH, 0],
        Extrapolation.CLAMP,
      ),
      opacity: interpolate(
        collapseProgress.value,
        [0, 0.75, 1],
        [1, 0.4, 0],
        Extrapolation.CLAMP,
      ),
    };
  });

  return (
    <Animated.View
      accessibilityLabel={accessibilityLabel}
      style={[{ flexDirection: 'row', alignItems: 'center', height: BRAND_ROW_HEIGHT }, brandRowStyle]}
    >
      <Animated.View
        style={[{
          overflow: 'hidden',
          flexDirection: 'row',
          alignItems: 'center',
        }, brandClipStyle]}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', width: BRAND_CLIP_WIDTH }}>
          <BeaverrWordmark
            style={{
              fontSize: WORDMARK_FONT_SIZE,
              lineHeight: WORDMARK_LINE_HEIGHT,
              color: C.text,
              letterSpacing: -0.3,
            }}
          />

          <View style={{
            marginLeft: 6,
            paddingHorizontal: 5,
            paddingVertical: 1,
            borderRadius: R.pill,
            backgroundColor: C.infoWashBg,
            borderWidth: 1,
            borderColor: C.border,
          }}>
            <Text style={{
              fontSize: 9,
              fontFamily: sansFontFamily('600'),
              color: C.muted,
              letterSpacing: 0.3,
            }}>
              {alphaLabel}
            </Text>
          </View>
        </View>
      </Animated.View>
    </Animated.View>
  );
}
