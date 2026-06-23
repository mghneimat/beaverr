import { View } from 'react-native';
import { S } from '../../constants/onboarding-theme';
import { compactChildren } from '../../lib/compactChildren';

/**
 * Standard vertical rhythm for stacked sections on dashboard / app tabs.
 * @param {boolean} [tight] — smaller gap for related blocks (e.g. tab bar rows)
 */
export default function TabSectionStack({ children, style, tight = false }) {
  return (
    <View style={[{ gap: tight ? S.tabSectionTightGap : S.tabSectionGap }, style]}>
      {compactChildren(children)}
    </View>
  );
}
