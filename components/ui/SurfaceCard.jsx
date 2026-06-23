import { View } from 'react-native';
import { C, R, S, SHADOW } from '../../constants/onboarding-theme';
import { compactChildren } from '../../lib/compactChildren';

/**
 * Elevated white card — soft shadow, no border (Balshet-style).
 */
export function SurfaceCard({ children, style, padded = true }) {
  return (
    <View
      style={{
        backgroundColor: C.surface,
        borderRadius: R.card,
        padding: padded ? S.cardPad : 0,
        overflow: 'hidden',
        ...SHADOW.card,
        ...style,
      }}
    >
      {compactChildren(children)}
    </View>
  );
}

export default SurfaceCard;
