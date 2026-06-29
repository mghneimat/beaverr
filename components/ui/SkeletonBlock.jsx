import { View } from 'react-native';
import { C, R } from '../../constants/onboarding-theme';

/**
 * Static skeleton placeholder — no opacity pulse (pulse + page fades read as flicker).
 */
export default function SkeletonBlock({
  width,
  height,
  borderRadius = R.input,
  style,
}) {
  return (
    <View
      style={{
        width,
        height,
        borderRadius,
        backgroundColor: C.surfaceTint,
        borderWidth: 1,
        borderColor: C.border,
        overflow: 'hidden',
        ...style,
      }}
    />
  );
}
