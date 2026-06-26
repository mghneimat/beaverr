import { useState } from 'react';
import { View, Pressable, Platform } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { DropdownElevateContext } from '../onboarding/InputGroup';
import FieldError from '../onboarding/FieldError';
import FieldNotice from '../onboarding/FieldNotice';
import PrimaryButton from '../ui/PrimaryButton';
import AuthScreenBackLink from './AuthScreenBackLink';
import { C, R, S, T } from '../../constants/onboarding-theme';

const AUTH_CARD_GAP = 16;

/**
 * Auth card — left-aligned title, fields, error, footer CTAs, then centered account-switch link.
 */
export default function AuthScreenCard({
  title,
  switchPrompt,
  switchLinkLabel,
  onSwitchPress,
  switchA11yLabel,
  switchSection,
  errorText,
  noticeText,
  submitLabel,
  onSubmit,
  submitDisabled = false,
  footnote,
  onBackPress,
  children,
}) {
  const [elevated, setElevated] = useState(false);
  const skipElevate = Platform.OS === 'web';

  return (
    <View
      style={{
        width: '100%',
        maxWidth: S.maxWidth,
        alignSelf: 'center',
        ...(elevated && !skipElevate
          ? {
              zIndex: 200,
              elevation: 12,
              ...(Platform.OS === 'web' ? { position: 'relative' } : null),
            }
          : null),
      }}
    >
      <DropdownElevateContext.Provider value={skipElevate ? () => {} : setElevated}>
        <View style={{
          padding: S.cardPad,
          backgroundColor: C.surface,
          borderRadius: R.card,
          borderWidth: errorText ? 2 : 1,
          borderColor: errorText ? C.danger : C.border,
          gap: AUTH_CARD_GAP,
          overflow: 'visible',
          alignItems: 'stretch',
        }}
        >
          <Text
            accessibilityRole="header"
            style={{
              ...T.questionTitle,
              textAlign: 'left',
              marginBottom: 4,
            }}
          >
            {title}
          </Text>

          {children}

          {errorText ? <FieldError message={errorText} style={{ marginTop: 2 }} /> : null}
          {!errorText && noticeText ? <FieldNotice message={noticeText} style={{ marginTop: 2 }} /> : null}

          <View style={{
            flexDirection: 'column',
            alignItems: 'stretch',
            gap: 12,
            marginTop: 4,
            width: '100%',
          }}
          >
            <PrimaryButton onPress={onSubmit} disabled={submitDisabled}>
              {submitLabel}
            </PrimaryButton>
            <AuthScreenBackLink variant="footer" onPress={onBackPress} />
          </View>

          {switchSection ?? (switchPrompt && switchLinkLabel && onSwitchPress ? (
            <View style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              justifyContent: 'center',
              alignItems: 'center',
            }}
            >
              <Text style={{ ...T.helper, fontSize: 14, color: C.muted }}>
                {switchPrompt}
                {' '}
              </Text>
              <Pressable
                onPress={onSwitchPress}
                accessibilityRole="link"
                accessibilityLabel={switchA11yLabel || switchLinkLabel}
                hitSlop={8}
              >
                <Text style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: C.accent,
                  textDecorationLine: 'underline',
                }}
                >
                  {switchLinkLabel}
                </Text>
              </Pressable>
            </View>
          ) : null)}

          {footnote ? (
            <Text style={{
              ...T.hint,
              textAlign: 'center',
              color: C.muted,
              marginTop: 2,
            }}
            >
              {footnote}
            </Text>
          ) : null}
        </View>
      </DropdownElevateContext.Provider>
    </View>
  );
}
