import { View } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { C, R, S } from '../../constants/onboarding-theme';
import RemoveButton from './RemoveButton';

/**
 * Standardised cost/item card shell for onboarding list screens.
 *
 * @param {Object} props
 * @param {string} [props.title] - Card header label
 * @param {string} [props.icon] - Optional emoji/icon left of title
 * @param {Function} [props.onRemove] - Shows RemoveButton when provided
 * @param {'default'|'active'|'nested'} [props.variant] - Surface vs highlighted active vs inset nested card
 * @param {object} [props.style] - Additional outer View styles
 * @param {React.ReactNode} props.children - Card body (inputs, pills, etc.)
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
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            {icon ? (
              <Text style={{ fontSize: 18, marginRight: 8 }}>{icon}</Text>
            ) : null}
            <Text style={{ fontSize: 14, fontWeight: '600', color: C.primary }}>
              {title}
            </Text>
          </View>
          {onRemove ? <RemoveButton onPress={onRemove} /> : null}
        </View>
      ) : null}
      {children}
    </View>
  );
}
