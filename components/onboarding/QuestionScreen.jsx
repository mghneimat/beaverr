import { useRef, useEffect, useCallback, useMemo, useState } from 'react';
import { View, ScrollView, Animated, Easing, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOnboardingLayout } from '../../lib/onboardingLayout';
import { useOnboardingKeyboard } from '../../lib/useOnboardingKeyboard';
import { useOnboardingViewportShell } from '../../lib/useOnboardingViewportShell';
import { isMobileWebOnboarding } from '../../lib/isMobileWebOnboarding';
import { OnboardingScrollContext, useOnboardingScrollToTop } from '../../lib/onboardingScroll';
import { useMonotonicOnboardingProgress } from '../../lib/useOnboardingProgress';
import { navigateBack, useOnboardingScreen } from '../../lib/onboardingNavigation';
import { Text } from '@gluestack-ui/themed';
import { useI18n } from '../../lib/i18n';
import { C, T, S, ONBOARDING_ILLUSTRATION } from '../../constants/onboarding-theme';
import OnboardingBottomBar from './OnboardingBottomBar';
import FadeUpView from './FadeUpView';
import OnboardingScreenShell from './OnboardingScreenShell';
import OnboardingIntroCardLayout from './OnboardingIntroCardLayout';
import OnboardingNavBackButton from './OnboardingNavBackButton';
import { injectValidationErrorIntoChildren } from './injectValidationError';
import FieldError from './FieldError';
import { useSectionEditOptional } from '../../lib/SectionEditContext';
import { OnboardingValidationClearContext } from '../../lib/onboardingValidationClear';

/**
 * Standard question screen wrapper.
 * Nav → progress → scrollable content → in-flow bottom bar (flex column).
 * Mobile web: viewport-locked shell; footer hidden while an input is focused.
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
  skipLabel,
  showExitActions = true,
  resumeRoute,
  exitPatch,
  onSaveDraft,
  validationError,
  setValidationError,
  onValidationClear,
  continueDisabled = false,
  progress: progressProp,
  progressStep,
  progressChildIndex,
  animationKey,
  continueLabel,
}) {
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const isEditMode = Boolean(useSectionEditOptional()?.isActive);
  useOnboardingScreen({ progressStep, childIndex: progressChildIndex });
  const computedProgress = useMonotonicOnboardingProgress({
    progressStep,
    disabled: isEditMode,
  });
  const progress = progressProp ?? computedProgress;
  const layout = useOnboardingLayout();
  const mobileWebShell = isMobileWebOnboarding(layout.width);
  const { visible: keyboardVisible } = useOnboardingKeyboard();
  const shellRef = useRef(null);
  const footerRef = useRef(null);
  const scrollRef = useRef(null);
  const contentRef = useRef(null);
  useOnboardingViewportShell({
    enabled: mobileWebShell,
    shellRef,
    footerRef,
    scrollRef,
  });
  const [submitting, setSubmitting] = useState(false);
  const fillAnim = useRef(new Animated.Value(progress !== undefined ? progress : 0)).current;
  const hasProgress = progress !== undefined;

  useOnboardingScrollToTop(scrollRef, animationKey ?? progressStep ?? 'default');

  const scrollToAnchor = useCallback((anchorRef, extraOffset = 24) => {
    if (Platform.OS === 'web') return;

    setTimeout(() => {
      if (!anchorRef?.current || !scrollRef.current || !contentRef.current) return;
      anchorRef.current.measureInWindow((_ax, anchorY) => {
        contentRef.current.measureInWindow((_cx, contentY) => {
          const offset = anchorY - contentY;
          scrollRef.current?.scrollTo({ y: Math.max(0, offset - extraOffset), animated: true });
        });
      });
    }, 320);
  }, []);

  const scrollContextValue = useMemo(
    () => ({ scrollRef, contentRef, scrollToAnchor }),
    [scrollToAnchor],
  );

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
    if (onBack) {
      onBack();
    } else {
      navigateBack();
    }
  };

  const handleContinue = async () => {
    if (submitting || continueDisabled) return;
    setSubmitting(true);
    try {
      await onContinue?.();
    } finally {
      setSubmitting(false);
    }
  };

  const isContinueDisabled = continueDisabled || submitting;
  const showExit = showExitActions && !isEditMode;
  const safeBottom = Platform.OS === 'web' ? 8 : Math.max(insets.bottom, 0);
  const keyboardOffset = Platform.OS === 'ios'
    ? S.navHeight + (hasProgress ? S.progressHeight : 0)
    : 0;
  const compactFooter = keyboardVisible && Platform.OS !== 'web';

  const clearValidation = useCallback(() => {
    if (setValidationError) {
      setValidationError('');
      return;
    }
    onValidationClear?.();
  }, [setValidationError, onValidationClear]);

  const validationClearValue = validationError ? clearValidation : null;

  const { nodes: fieldChildren, injected: errorInjected } = injectValidationErrorIntoChildren(
    children,
    validationError,
  );

  const titleBlock = (
    <>
      <Text
        accessibilityRole="header"
        style={{
          ...T.questionTitle,
          fontSize: layout.questionTitleSize,
          lineHeight: layout.questionTitleSize + 8,
          marginBottom: 8,
        }}
      >
        {title}
      </Text>

      {helper ? (
        <View style={{
          paddingTop: 10,
          alignItems: 'flex-start',
        }}>
          <Text style={{ ...T.helper }}>
            {helper}
          </Text>
        </View>
      ) : null}

      {description ? (
        <View style={{
          paddingTop: helper ? 10 : 16,
          alignItems: 'flex-start',
        }}>
          <Text style={{
            ...T.caption,
            lineHeight: 20,
            color: C.muted,
          }}>
            {description}
          </Text>
        </View>
      ) : null}
    </>
  );

  const fieldsBlock = (
    <View style={{ marginBottom: 0 }}>
      {fieldChildren}
      {!errorInjected && validationError ? (
        <FieldError message={validationError} />
      ) : null}
    </View>
  );

  return (
    <OnboardingScreenShell>
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: C.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={keyboardOffset}
    >
      <View ref={shellRef} style={{ flex: 1, minHeight: 0 }}>

        {!isEditMode ? (
          <View style={{
            backgroundColor: C.surface,
            height: S.navHeight,
            flexDirection: 'row',
            alignItems: 'center',
            borderBottomWidth: 1,
            borderBottomColor: C.border,
            flexShrink: 0,
          }}>
            <OnboardingNavBackButton onPress={handleBack} />
            <View style={{
              position: 'absolute',
              left: 0,
              right: 0,
              alignItems: 'center',
              pointerEvents: 'none',
            }}>
              {chapter ? (
                <Text
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  style={{
                    ...T.chapterLabel,
                    maxWidth: layout.width - 160,
                  }}
                >
                  {chapter}
                </Text>
              ) : null}
            </View>
            <View style={{ width: 100 }} />
          </View>
        ) : null}

        {hasProgress ? (
          <View
            accessibilityRole="progressbar"
            accessibilityValue={{ min: 0, max: 100, now: Math.round(progress) }}
            style={{
              height: S.progressHeight,
              backgroundColor: C.progressTrack,
              flexShrink: 0,
            }}
          >
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

        <ScrollView
          ref={scrollRef}
          style={{ flex: 1, minHeight: 0 }}
          contentContainerStyle={{ flexGrow: 1, paddingVertical: 32, paddingBottom: safeBottom + 24 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <OnboardingScrollContext.Provider value={scrollContextValue}>
            <OnboardingValidationClearContext.Provider value={validationClearValue}>
            <View
              ref={contentRef}
              collapsable={false}
              style={{
                width: '100%',
                maxWidth: S.maxWidth,
                paddingHorizontal: layout.pagePadH,
                alignSelf: 'center',
              }}
            >
              <FadeUpView
                animationKey={animationKey}
                duration={ONBOARDING_ILLUSTRATION.fadeDuration}
                translateY={ONBOARDING_ILLUSTRATION.fadeTranslateY}
                skipInitial
                style={{ width: '100%' }}
              >
                <OnboardingIntroCardLayout
                  illustration={illustration}
                  headerContent={titleBlock}
                  footer={(
                    <View ref={footerRef} collapsable={false}>
                      <OnboardingBottomBar
                        inCard
                        layout={layout}
                        compact={compactFooter}
                        primaryLabel={submitting ? t('common.saving') : (continueLabel || t('common.continue'))}
                        onPrimary={handleContinue}
                        primaryDisabled={isContinueDisabled}
                        primaryAccessibilityState={{ busy: submitting, disabled: isContinueDisabled }}
                        showExit={showExit}
                        resumeRoute={resumeRoute}
                        exitPatch={exitPatch}
                        onSaveDraft={onSaveDraft}
                        exitDisabled={submitting}
                        onSkip={onSkip}
                        skipLabel={skipLabel}
                      />
                    </View>
                  )}
                >
                  {fieldsBlock}
                </OnboardingIntroCardLayout>
              </FadeUpView>
            </View>
            </OnboardingValidationClearContext.Provider>
          </OnboardingScrollContext.Provider>
        </ScrollView>

      </View>
    </KeyboardAvoidingView>
    </OnboardingScreenShell>
  );
}
