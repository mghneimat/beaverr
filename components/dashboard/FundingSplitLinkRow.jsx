import { View, Pressable, Platform } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { SplitIcon, TrashIcon } from '../app/AppNavIcons';
import { C, R, T, tabularNums } from '../../constants/onboarding-theme';
import { formatCurrency } from '../../lib/finance';

const ICON_SIZE = 18;
const ICON_BOX = 40;
const DELETE_ICON_COLOR = '#D14040';
const ROW_PAD_V = 12;
const ROW_PAD_H = 14;

function LinkRowBody({ label, amountValue, currency, frequencyLabel, nextDateLine }) {
  return (
    <>
      <View style={{
        width: ICON_BOX,
        height: ICON_BOX,
        borderRadius: R.input,
        backgroundColor: C.bg,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: C.border,
        flexShrink: 0,
      }}
      >
        <SplitIcon color={C.muted} size={ICON_SIZE} />
      </View>
      <View style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
        <Text style={{ ...T.helper, fontWeight: '600', color: C.primary }} numberOfLines={2}>
          {label}
        </Text>
        {nextDateLine ? (
          <Text style={{ ...T.caption, color: C.muted, marginTop: 4 }} numberOfLines={1}>
            {nextDateLine}
          </Text>
        ) : null}
      </View>
      <View style={{ alignItems: 'flex-end', flexShrink: 0 }}>
        <Text
          style={{
            fontSize: 15,
            fontWeight: '700',
            color: C.primary,
            textAlign: 'right',
            ...tabularNums,
          }}
        >
          {formatCurrency(amountValue, currency)}
        </Text>
        {frequencyLabel ? (
          <Text style={{ ...T.caption, color: C.muted, marginTop: 2, textAlign: 'right' }}>
            {frequencyLabel}
          </Text>
        ) : null}
      </View>
    </>
  );
}

function linkMainPressableStyle({ pressed, hovered }) {
  return {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minWidth: 0,
    alignSelf: 'stretch',
    paddingVertical: ROW_PAD_V,
    paddingLeft: ROW_PAD_H,
    paddingRight: 8,
    backgroundColor: pressed ? C.bg : hovered ? C.bg : 'transparent',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  };
}

function fullRowPressableStyle({ pressed, hovered }) {
  return {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: ROW_PAD_V,
    paddingHorizontal: ROW_PAD_H,
    borderRadius: R.input,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: pressed ? C.bg : hovered ? C.bg : C.surface,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  };
}

export default function FundingSplitLinkRow({
  label,
  amountValue,
  currency,
  frequencyLabel,
  nextDateLine,
  onPress,
  accessibilityLabel,
  onDelete,
  deleting = false,
  deleteAccessibilityLabel,
}) {
  const body = (
    <LinkRowBody
      label={label}
      amountValue={amountValue}
      currency={currency}
      frequencyLabel={frequencyLabel}
      nextDateLine={nextDateLine}
    />
  );

  if (!onDelete) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={fullRowPressableStyle}
      >
        {body}
      </Pressable>
    );
  }

  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'stretch',
      borderRadius: R.input,
      borderWidth: 1,
      borderColor: C.border,
      backgroundColor: C.surface,
      overflow: 'hidden',
    }}
    >
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={linkMainPressableStyle}
      >
        {body}
      </Pressable>
      <Pressable
        onPress={onDelete}
        disabled={deleting}
        accessibilityRole="button"
        accessibilityLabel={deleteAccessibilityLabel}
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        style={({ pressed, hovered }) => ({
          width: 48,
          alignSelf: 'stretch',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          backgroundColor: pressed
            ? 'rgba(209, 64, 64, 0.14)'
            : hovered
              ? 'rgba(209, 64, 64, 0.08)'
              : 'transparent',
          ...(Platform.OS === 'web' ? { cursor: deleting ? 'default' : 'pointer' } : {}),
        })}
      >
        <TrashIcon color={DELETE_ICON_COLOR} size={16} />
      </Pressable>
    </View>
  );
}
