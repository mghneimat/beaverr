import { View } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useI18n } from '../../lib/i18n';
import { wordmarkTextStyle, wordmarkTailTextStyle } from '../../lib/fonts';

/**
 * “Beaver” bold italic + final “r” medium italic/lighter.
 */
export default function BeaverrWordmark({
  style,
  tailStyle,
  onLayout,
  accessibilityLabel,
}) {
  const { t } = useI18n();
  const name = t('app.name');
  const stem = name.slice(0, -1);
  const tail = name.slice(-1);

  return (
    <View
      accessibilityLabel={accessibilityLabel ?? name}
      onLayout={onLayout}
      style={{ flexDirection: 'row', alignItems: 'baseline' }}
    >
      <Text style={wordmarkTextStyle(style)}>
        {stem}
      </Text>
      <Text style={wordmarkTailTextStyle({ ...style, ...tailStyle })}>
        {tail}
      </Text>
    </View>
  );
}
