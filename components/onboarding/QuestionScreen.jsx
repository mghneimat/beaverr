import { useState, useRef, useEffect } from 'react';
import { View, ScrollView, Pressable, Animated, Easing } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useRouter } from 'expo-router';
import { useI18n } from '../../lib/i18n';
import { C, R, T, S } from '../../constants/onboarding-theme';
import FadeUpView from './FadeUpView';
import Svg, { Path } from 'react-native-svg';

/**
 * Arrow-left icon using react-native-svg (fixes broken icon from gluestack).
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
 * Standard question screen wrapper.
 * Provides consistent layout for all onboarding questions:
 *   nav bar → progress bar → scrollable content → fixed bottom bar.
 *
 * Updated to match UI Examples design (blue/navy palette, back button with text, etc.)
 *
 * @param {Object} props
 * @param {string} props.chapter - Chapter label (e.g. "Income & Savings")
 * @param {string} props.title - Question title
 * @param {string} [props.helper] - Helper text below title
 * @param {string} [props.description] - Longer descriptive text below the question (e.g. "This unlocks a dedicated section for children's costs.")
 * @param {React.ReactNode} [props.illustration] - Placeholder image/SVG shown above the title
 * @param {React.ReactNode} props.children - Input area content
 * @param {Function} props.onContinue - Continue button handler
 * @param {Function} [props.onBack] - Custom back handler (defaults to router.back)
 * @param {Function} [props.onSkip] - Skip button handler (optional)
 * @param {string} [props.validationError] - Validation error message
 * @param {boolean} [props.continueDisabled] - Disable continue button
 * @param {number} [props.progress] - Progress 0–100 for the progress bar
 * @param {string} [props.progressLabel] - Label shown next to progress bar
 * @param {any} [props.animationKey] - When this changes, content area fades up
 */
export default function QuestionScreen({
  chapter,
  title,
  helper,
  description,
  illustration,
  children,
  onContinue,
  onBack,
  onSkip,
  validationError,
  continueDisabled = false,
  progress,
  progressLabel,
  animationKey,
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [backHovered, setBackHovered] = useState(false);
  const [backPressed, setBackPressed] = useState(false);
  const [continueHovered, setContinueHovered] = useState(false);
  const [continuePressed, setContinuePressed] = useState(false);
  const backCooldown = useRef(false);

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
    if (backCooldown.current) return;
    backCooldown.current = true;
    setTimeout(() => { backCooldown.current = false; }, 500);
    if (onBack) {
      onBack();
    } else if (router.canGoBack && router.canGoBack()) {
      router.back();
    }
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
        {/* Back arrow — top left, full-height hover */}
        <Pressable
          onPress={handleBack}
          onPressIn={() => setBackPressed(true)}
          onPressOut={() => setBackPressed(false)}
          onHoverIn={() => setBackHovered(true)}
          onHoverOut={() => setBackHovered(false)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingLeft: 36,
            paddingRight: 40,
            height: S.navHeight,
            backgroundColor: backHovered
              ? C.overlayHover
              : backPressed
                ? C.overlayPressed
                : 'transparent',
          }}
        >
          <ArrowLeftIcon color={C.muted} size={24} />
        </Pressable>

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

        {/* Right spacer to balance the back button */}
        <View style={{ width: 100 }} />
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

      {/* ── Scrollable content ── */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1, paddingVertical: 32 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{
          width: '100%',
          maxWidth: S.maxWidth,
          paddingHorizontal: S.pagePadH,
          alignSelf: 'center',
        }}>
          <FadeUpView animationKey={animationKey}>
            {/* Illustration / placeholder image above title — full width, 300px high */}
            {illustration ? (
              <View style={{
                width: '100%',
                height: 300,
                marginBottom: 20,
                borderRadius: R.input,
                overflow: 'hidden',
                backgroundColor: C.surface,
                borderWidth: 1,
                borderColor: C.border,
              }}>
                {illustration}
              </View>
            ) : null}

            {/* Question title */}
            <Text style={{
              ...T.questionTitle,
              marginBottom: 8,
            }}>
              {title}
            </Text>

            {/* Helper text (short instruction) */}
            {helper ? (
              <View style={{
                paddingTop: 10,
                paddingBottom: 20,
                alignItems: 'flex-start',
              }}>
                <Text style={{
                  ...T.helper,
                }}>
                  {helper}
                </Text>
              </View>
            ) : null}

            {/* Description (longer contextual text below question) */}
            {description ? (
              <View style={{
                paddingTop: 16,
                paddingBottom: 10,
                marginBottom: S.sectionGap,
                alignItems: 'flex-start',
              }}>
                <Text style={{
                  fontSize: 13,
                  lineHeight: 20,
                  color: C.muted,
                  fontFamily: 'Inter',
                }}>
                  {description}
                </Text>
              </View>
            ) : null}

            {/* Input area */}
            <View style={{ marginBottom: 32 }}>
              {children}
            </View>

            {/* Validation error */}
            {validationError ? (
              <View style={{
                marginBottom: 16,
                padding: 12,
                backgroundColor: C.dangerBg,
                borderWidth: 1,
                borderColor: C.dangerBorder,
                borderRadius: R.input,
              }}>
                <Text style={{ fontSize: 13, color: C.danger, lineHeight: 20 }}>
                  {validationError}
                </Text>
              </View>
            ) : null}
          </FadeUpView>
        </View>
      </ScrollView>

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
            disabled={continueDisabled}
            onPressIn={() => setContinuePressed(true)}
            onPressOut={() => setContinuePressed(false)}
            onHoverIn={() => setContinueHovered(true)}
            onHoverOut={() => setContinueHovered(false)}
            style={{
              flex: 1,
              paddingVertical: 16,
              paddingHorizontal: 24,
              borderRadius: R.button,
              backgroundColor: continueDisabled
                ? C.disabled
                : continuePressed ? C.accentPressed : C.accent,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: continueHovered && !continueDisabled ? 0.92 : 1,
            }}
          >
            <Text style={{ ...T.btnPrimary, color: '#FFFFFF' }}>
              {t('common.continue')}
            </Text>
          </Pressable>
        </View>

        {/* Skip button — below the bar */}
        {onSkip ? (
          <Pressable
            onPress={onSkip}
            style={{
              paddingVertical: 8,
              alignItems: 'center',
              paddingBottom: 12,
            }}
          >
            <Text style={{ ...T.btnSkip }}>
              {t('common.skip')}
            </Text>
          </Pressable>
        ) : null}
      </View>

    </View>
  );
}
