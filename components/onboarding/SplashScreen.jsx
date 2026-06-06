import { useState, useRef, useEffect } from 'react';
import { View, Pressable, Animated, Easing } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useRouter } from 'expo-router';
import { useI18n } from '../../lib/i18n';
import { C, R, T, S } from '../../constants/onboarding-theme';
import FadeUpView from './FadeUpView';
import Svg, { Path } from 'react-native-svg';

/**
 * Arrow-left icon using react-native-svg.
 */
function ArrowLeftIcon({ color = '#6B7A99', size = 16 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5m7-7l-7 7 7 7"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * Full-screen section intro splash screen.
 * Standardised layout: eyebrow → heading (serif) → body → SVG (optional) → bottom bar.
 * Updated to match UI Examples design.
 *
 * @param {Object} props
 * @param {React.ReactNode} [props.children] - Inline SVG illustration (optional)
 * @param {string} [props.eyebrow] - Small uppercase accent label above heading
 * @param {string} props.heading - Main heading (1–2 lines)
 * @param {string} [props.body] - Supporting body text (optional)
 * @param {string} props.cta - CTA button label
 * @param {Function} props.onContinue - Continue handler
 * @param {string} [props.chapter] - Chapter label shown in nav bar (optional)
 * @param {Function} [props.onBack] - Back button handler (shows back button if provided)
 * @param {number} [props.progress] - Progress 0–100 for the progress bar
 * @param {string} [props.progressLabel] - Label shown next to progress bar
 */
export default function SplashScreen({
  children,
  eyebrow,
  heading,
  body,
  cta,
  onContinue,
  chapter,
  onBack,
  progress,
  progressLabel,
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [backHovered, setBackHovered] = useState(false);
  const [backPressed, setBackPressed] = useState(false);
  const [continueHovered, setContinueHovered] = useState(false);
  const [continuePressed, setContinuePressed] = useState(false);

  const fillAnim = useRef(new Animated.Value(progress !== undefined ? progress : 0)).current;
  const hasProgress = progress !== undefined;

  useEffect(() => {
    if (hasProgress) {
      Animated.timing(fillAnim, {
        toValue: Math.min(100, Math.max(0, progress)),
        duration: 400,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
        useNativeDriver: false,
      }).start();
    }
  }, [progress, hasProgress]);

  const handleBack = () => {
    if (onBack) { onBack(); } else { router.back(); }
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>

      {/* ── Nav bar ── */}
      <View style={{
        backgroundColor: C.surface,
        height: S.navHeight,
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: C.border,
      }}>
        {/* Back arrow — top left (only shown when onBack is provided) */}
        {onBack ? (
          <Pressable
            onPress={handleBack}
            onPressIn={() => setBackPressed(true)}
            onPressOut={() => setBackPressed(false)}
            onHoverIn={() => setBackHovered(true)}
            onHoverOut={() => setBackHovered(false)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingLeft: 12,
              paddingRight: 16,
              height: S.navHeight,
              backgroundColor: backHovered
                ? C.overlayHover
                : backPressed
                  ? C.overlayPressed
                  : 'transparent',
            }}
          >
            <ArrowLeftIcon color={C.muted} size={16} />
            <Text style={{
              ...T.backBtn,
              marginLeft: 4,
            }}>
              {t('common.back')}
            </Text>
          </Pressable>
        ) : (
          <View style={{ width: 16 }} />
        )}

        {/* Chapter title — centered */}
        <View style={{
          position: 'absolute',
          left: 0,
          right: 0,
          alignItems: 'center',
          pointerEvents: 'none',
        }}>
          {chapter ? (
            <Text style={{
              ...T.chapterLabel,
              textTransform: 'uppercase',
            }}>
              {chapter}
            </Text>
          ) : null}
        </View>

        {/* Right spacer */}
        <View style={{ width: 80 }} />
      </View>

      {/* ── Progress bar (thin line under nav bar) ── */}
      {hasProgress ? (
        <View style={{
          height: S.progressHeight,
          backgroundColor: C.progressTrack,
        }}>
          <Animated.View style={{
            height: '100%',
            width: fillAnim.interpolate({
              inputRange: [0, 100],
              outputRange: ['0%', '100%'],
            }),
            backgroundColor: C.progressFill,
          }} />
        </View>
      ) : null}

      {/* ── Centered content ── */}
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: S.pagePadH }}>
        <View style={{
          width: '100%',
          maxWidth: S.maxWidth,
        }}>
          <FadeUpView duration={350} translateY={18} style={{ width: '100%' }}>
            {/* Eyebrow */}
            {eyebrow ? (
              <Text style={{
                ...T.eyebrow,
                textTransform: 'uppercase',
                textAlign: 'left',
                marginBottom: 14,
              }}>
                {eyebrow}
              </Text>
            ) : null}

            {/* Heading */}
            <Text style={{
              ...T.splashHeading,
              textAlign: 'left',
              marginBottom: body ? 12 : 32,
            }}>
              {heading}
            </Text>

            {/* Body */}
            {body ? (
              <Text style={{
                ...T.splashBody,
                textAlign: 'left',
                marginBottom: 32,
                paddingHorizontal: 0,
              }}>
                {body}
              </Text>
            ) : null}

            {/* Illustration */}
            {children ? (
              <View style={{ marginBottom: 32, alignItems: 'center' }}>
                {children}
              </View>
            ) : null}
          </FadeUpView>
        </View>
      </View>

      {/* ── Bottom bar (fixed, matching UI Examples) ── */}
      <View style={{
        backgroundColor: C.surface,
        borderTopWidth: 1,
        borderTopColor: C.border,
      }}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          height: 74,
          paddingHorizontal: S.pagePadH,
          maxWidth: S.maxWidth,
          width: '100%',
          alignSelf: 'center',
        }}>
          {/* Continue button — full width */}
          <Pressable
            onPress={onContinue}
            onPressIn={() => setContinuePressed(true)}
            onPressOut={() => setContinuePressed(false)}
            onHoverIn={() => setContinueHovered(true)}
            onHoverOut={() => setContinueHovered(false)}
            style={{
              flex: 1,
              paddingVertical: 16,
              paddingHorizontal: 24,
              borderRadius: R.button,
              backgroundColor: continuePressed ? C.accentPressed : C.accent,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: continueHovered ? 0.92 : 1,
            }}
          >
            <Text style={{ ...T.btnPrimary, color: '#FFFFFF' }}>
              {cta}
            </Text>
          </Pressable>
        </View>
      </View>

    </View>
  );
}
