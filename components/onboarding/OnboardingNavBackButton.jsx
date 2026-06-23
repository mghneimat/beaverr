import { useState, useRef } from 'react';
import { Pressable } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useI18n } from '../../lib/i18n';
import { C, S } from '../../constants/onboarding-theme';

function ArrowLeftIcon({ color = '#6B7A99', size = 24 }) {
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
 * Shared nav back control — icon-only, matches QuestionScreen styling.
 *
 * @param {Object} props
 * @param {Function} props.onPress - Back handler
 * @param {boolean} [props.cooldown=true] - Debounce rapid presses (500ms)
 */
export default function OnboardingNavBackButton({ onPress, cooldown = true }) {
  const { t } = useI18n();
  const [backHovered, setBackHovered] = useState(false);
  const [backPressed, setBackPressed] = useState(false);
  const backCooldown = useRef(false);

  const handlePress = () => {
    if (cooldown) {
      if (backCooldown.current) return;
      backCooldown.current = true;
      setTimeout(() => { backCooldown.current = false; }, 500);
    }
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={t('common.back')}
      hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
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
      <ArrowLeftIcon color={C.text} size={24} />
    </Pressable>
  );
}
