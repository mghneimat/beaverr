import { View } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { C, R, S } from '../../constants/onboarding-theme';
import DeleteTextButton from './DeleteTextButton';

/**
 * Standardised cost/item card shell for onboarding list screens.
 *
 * @param {Object} props
 * @param {string} [props.title] - Card header label
 * @param {string} [props.icon] - Optional emoji/icon left of title
 * @param {Function} [props.onRemove] - Centred delete link below card body
 * @param {'default'|'active'|'nested'} [props.variant]
 * @param {object} [props.style]
 * @param {React.ReactNode} props.children
 */
export default function CostCard({
  title,
  icon,
  onRemove,
  variant = 'default',
  style,
  children,
}) {
  const isActive = variant === 'active';
  const isNested = variant === 'nested';

  return (
    <View style={{
      padding: S.cardPad,
      backgroundColor: isActive ? C.navSelectedBg : isNested ? C.bg : C.surface,
      borderRadius: R.card,
      borderWidth: 1,
      borderColor: isActive ? C.navSelectedBorder : C.border,
      marginBottom: 10,
      ...style,
    }}>
      {title ? (
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 12,
        }}>
          {icon ? (
            <Text style={{ fontSize: 18, marginRight: 8 }}>{icon}</Text>
          ) : null}
          <Text style={{ fontSize: 14, fontWeight: '600', color: C.primary, flex: 1 }}>
            {title}
          </Text>
        </View>
      ) : null}
      {children}
      {onRemove ? <DeleteTextButton onPress={onRemove} /> : null}
    </View>
  );
}
