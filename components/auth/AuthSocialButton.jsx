import { useState } from 'react';
import { Pressable, Platform, View } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { R } from '../../constants/onboarding-theme';
import { AppleBrandIcon, FacebookBrandIcon, GoogleBrandIcon } from './SocialBrandIcons';

/** @typedef {import('../../lib/auth/oauth.js').OAuthProvider} OAuthProvider */

const SOCIAL_BTN_BG = '#FFFFFF';
const SOCIAL_BTN_BORDER = '#DADCE0';
const SOCIAL_BTN_TEXT = '#1F1F1F';
const SOCIAL_BTN_HOVER = '#F8F9FA';
const SOCIAL_BTN_PRESSED = '#F1F3F4';
const SOCIAL_BTN_DISABLED_BG = '#F8F9FA';
const SOCIAL_BTN_DISABLED_TEXT = '#9AA0A6';
const ICON_SIZE = 20;
const ICON_LABEL_GAP = 10;

/** @type {Record<OAuthProvider, React.ComponentType<{ size?: number }>>} */
const BRAND_ICONS = {
  google: GoogleBrandIcon,
  facebook: FacebookBrandIcon,
  apple: AppleBrandIcon,
};

/**
 * Pill OAuth CTA — white surface, brand icon + label centered as one row.
 */
export default function AuthSocialButton({
  provider,
  label,
  onPress,
  disabled = false,
  accessibilityLabel,
}) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const Icon = BRAND_ICONS[provider];

  const backgroundColor = disabled
    ? SOCIAL_BTN_DISABLED_BG
    : pressed
      ? SOCIAL_BTN_PRESSED
      : hovered && Platform.OS === 'web'
        ? SOCIAL_BTN_HOVER
        : SOCIAL_BTN_BG;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled }}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={{
        width: '100%',
        minHeight: 52,
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: R.button,
        backgroundColor,
        borderWidth: 1,
        borderColor: SOCIAL_BTN_BORDER,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled ? 0.72 : 1,
        ...(Platform.OS === 'web' ? { cursor: disabled ? 'default' : 'pointer' } : {}),
      }}
    >
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: ICON_LABEL_GAP,
        maxWidth: '100%',
      }}
      >
        <View style={{
          width: ICON_SIZE,
          height: ICON_SIZE,
          alignItems: 'center',
          justifyContent: 'center',
        }}
        >
          <Icon size={ICON_SIZE} />
        </View>
        <Text style={{
          fontSize: 15,
          fontWeight: '600',
          color: disabled ? SOCIAL_BTN_DISABLED_TEXT : SOCIAL_BTN_TEXT,
          lineHeight: 20,
          flexShrink: 1,
        }}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}
