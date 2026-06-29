import { View } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { C, R, T } from '../../constants/onboarding-theme';

/** @typedef {'info'|'positive'} DashboardTintedNoticeVariant */

/**
 * @param {DashboardTintedNoticeVariant} [variant='info']
 */
export function dashboardTintedNoticeTheme(variant = 'info') {
  if (variant === 'positive') {
    return {
      backgroundColor: C.heroIncomeBg,
      borderColor: C.heroIncomeBorder,
      eyebrowColor: C.muted,
      titleColor: C.heroIncomeValue,
      messageColor: C.heroIncomeValue,
      iconColor: C.heroIncomeBadge,
    };
  }

  return {
    backgroundColor: C.infoWashBg,
    borderColor: C.infoWashBorder,
    eyebrowColor: C.muted,
    titleColor: C.text,
    messageColor: C.text,
    iconColor: C.muted,
  };
}

/**
 * Tinted dashboard notice — shared by pace status, route callouts, and info banners.
 * @param {{
 *   variant?: DashboardTintedNoticeVariant,
 *   theme?: ReturnType<typeof dashboardTintedNoticeTheme>,
 *   eyebrow?: string,
 *   title?: string,
 *   message?: string,
 *   Icon?: React.ComponentType<{ color: string, size?: number }>|null,
 *   iconSize?: number,
 *   style?: import('react-native').StyleProp<import('react-native').ViewStyle>,
 * }} props
 */
export default function DashboardTintedNotice({
  variant = 'info',
  theme: themeOverride,
  eyebrow,
  title,
  message,
  Icon = null,
  iconSize = 16,
  style,
}) {
  const theme = themeOverride ?? dashboardTintedNoticeTheme(variant);
  const a11yLabel = [eyebrow, title || message].filter(Boolean).join('. ');

  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={a11yLabel}
      style={[{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: theme.backgroundColor,
        borderWidth: 1,
        borderColor: theme.borderColor,
        borderRadius: R.input,
        paddingVertical: 10,
        paddingHorizontal: 14,
      }, style]}
    >
      {Icon ? (
        <View style={{ paddingTop: message ? 0 : 1 }}>
          <Icon color={theme.iconColor} size={iconSize} />
        </View>
      ) : null}
      <View style={{ flex: 1, minWidth: 0 }}>
        {message ? (
          <Text
            style={{
              ...T.caption,
              color: theme.messageColor,
              lineHeight: 18,
              fontWeight: '600',
            }}
          >
            {message}
          </Text>
        ) : (
          <>
            {eyebrow ? (
              <Text
                style={{
                  ...T.caption,
                  color: theme.eyebrowColor,
                  lineHeight: 16,
                  fontSize: 12,
                }}
                numberOfLines={2}
              >
                {eyebrow}
              </Text>
            ) : null}
            {title ? (
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '700',
                  color: theme.titleColor,
                  marginTop: eyebrow ? 2 : 0,
                  lineHeight: 20,
                }}
                numberOfLines={2}
              >
                {title}
              </Text>
            ) : null}
          </>
        )}
      </View>
    </View>
  );
}
