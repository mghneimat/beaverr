import { View, Pressable } from 'react-native';
import { useState } from 'react';
import { Text } from '@gluestack-ui/themed';
import { LockIcon } from '../../app/AppNavIcons';
import { C, R, SHADOW, T, tabularNums } from '../../../constants/onboarding-theme';
import { CYCLE_CONTROL_PILL_BUTTON } from './cycleControlPill';
import { CycleControlPlusIcon } from './CycleControlButtonIcon';
import { formatCurrency, formatSignedCurrency } from '../../../lib/finance';

const PREVIEW_LIMIT = 2;
const TILE_BORDER_WIDTH = 2;

/** Square tile shell — dimensions supplied via style prop */
const TILE_SHELL_STYLE = {
  ...SHADOW.card,
};

const TILE_INNER = {
  flex: 1,
  padding: 12,
  flexDirection: 'column',
};

function tileSurfaceState(pressed, hovered) {
  if (pressed) return C.surfaceTint;
  if (hovered) return C.surfaceTint;
  return C.surface;
}

function CompactRow({ row, currency, onRemove, removeA11y, disabled }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
      <Text
        style={{ flex: 1, fontSize: 11, fontWeight: '500', color: C.primary }}
        numberOfLines={1}
      >
        {row.label}
      </Text>
      {!disabled ? (
        <Pressable
          onPress={onRemove}
          accessibilityRole="button"
          accessibilityLabel={removeA11y}
          hitSlop={8}
        >
          <Text style={{ fontSize: 11, fontWeight: '600', color: C.muted }}>×</Text>
        </Pressable>
      ) : null}
      <Text style={{ fontSize: 11, fontWeight: '700', color: C.primary, ...tabularNums }}>
        {formatCurrency(row.amount, currency)}
      </Text>
    </View>
  );
}

function TileBorderShell({ style, children }) {
  return (
    <View
      style={[
        TILE_SHELL_STYLE,
        {
          borderWidth: TILE_BORDER_WIDTH,
          borderColor: C.border,
          borderRadius: R.card,
          backgroundColor: C.surface,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

function TileTextLink({ label, a11y, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="link"
      accessibilityLabel={a11y}
      style={({ pressed, hovered }) => ({
        opacity: pressed || hovered ? 0.72 : 1,
      })}
    >
      <Text style={{ fontSize: 12, fontWeight: '600', color: C.muted }}>{label}</Text>
    </Pressable>
  );
}

function RecurringTileShell({ style, children }) {
  return (
    <View
      style={[
        {
          flex: 1,
          minHeight: 0,
          borderRadius: R.card,
          borderWidth: 1.5,
          borderColor: C.border,
          backgroundColor: C.surface,
          overflow: 'hidden',
          ...SHADOW.card,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export default function OneOffTile({
  title,
  helper,
  subtotal,
  subtotalPrefix = '',
  emptyLabel,
  notInBudgetLabel,
  rows = [],
  currency,
  addLabel,
  addA11y,
  onAdd,
  onRemoveRow,
  removeA11yFor,
  badgeLabel,
  dueRows = [],
  onLogDueDay,
  logDueLabel,
  style,
  disabled = false,
  lockedA11y,
}) {
  const preview = rows.slice(0, PREVIEW_LIMIT);
  const overflow = rows.length - PREVIEW_LIMIT;
  const hasRows = rows.length > 0;
  const showAmount = !disabled && hasRows && subtotal != null && subtotal > 0;
  const showPendingInPool = hasRows && !disabled && !showAmount;

  return (
    <TileBorderShell style={style}>
      <View style={[TILE_INNER, disabled ? { opacity: 0.72 } : null]}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6 }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: C.primary, flex: 1 }} numberOfLines={2}>
            {title}
          </Text>
          {disabled ? (
            <View accessibilityLabel={lockedA11y} accessibilityRole="image">
              <LockIcon color={C.muted} size={16} />
            </View>
          ) : null}
          {!disabled && badgeLabel ? (
            <View
              style={{
                paddingHorizontal: 6,
                paddingVertical: 2,
                borderRadius: R.pill,
                backgroundColor: C.surfaceTint,
              }}
            >
              <Text style={{ fontSize: 9, fontWeight: '700', color: C.muted }}>{badgeLabel}</Text>
            </View>
          ) : null}
        </View>

        <Text
          style={{
            ...T.caption,
            color: C.muted,
            marginTop: 6,
            flex: !hasRows ? 1 : 0,
          }}
          numberOfLines={4}
        >
          {helper}
        </Text>

        {showAmount ? (
          <Text
            style={{
              fontSize: 16,
              fontWeight: '700',
              color: C.primary,
              marginTop: 8,
              ...tabularNums,
            }}
            numberOfLines={1}
          >
            {formatSignedCurrency(subtotal, currency, subtotalPrefix === '+')}
          </Text>
        ) : null}

        {showPendingInPool ? (
          <Text style={{ ...T.caption, color: C.muted, marginTop: 8, fontSize: 11 }} numberOfLines={2}>
            {notInBudgetLabel || emptyLabel}
          </Text>
        ) : null}

        {hasRows && !disabled ? (
          <View style={{ flex: 1, minHeight: 0 }}>
            {preview.map((row) => (
              <CompactRow
                key={row.id}
                row={row}
                currency={currency}
                onRemove={() => onRemoveRow(row)}
                removeA11y={removeA11yFor(row.label)}
                disabled={disabled}
              />
            ))}
            {overflow > 0 ? (
              <Text style={{ ...T.caption, color: C.muted, marginTop: 4, fontSize: 10 }}>
                +{overflow}
              </Text>
            ) : null}
            {dueRows.length > 0 && onLogDueDay ? (
              <Pressable
                onPress={() => onLogDueDay(dueRows[0])}
                accessibilityRole="button"
                style={{ marginTop: 4 }}
              >
                <Text style={{ fontSize: 10, fontWeight: '600', color: C.primary }}>
                  {logDueLabel}
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        <TileFooterButton
          label={addLabel}
          a11y={disabled && lockedA11y ? lockedA11y : addA11y}
          onPress={onAdd}
          disabled={disabled}
        />
      </View>
    </TileBorderShell>
  );
}

function TileFooterButton({ label, a11y, onPress, accessibilityRole = 'button', disabled = false }) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const buttonText = label.replace(/^\+\s*/, '');

  const content = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <CycleControlPlusIcon color={disabled ? C.muted : C.primary} />
      <Text style={{
        fontSize: 14,
        fontWeight: '600',
        lineHeight: 16,
        color: disabled ? C.muted : C.primary,
      }}
      >
        {buttonText}
      </Text>
    </View>
  );

  if (disabled) {
    return (
      <View
        accessibilityRole="text"
        accessibilityLabel={a11y}
        style={{
          marginTop: 'auto',
          ...CYCLE_CONTROL_PILL_BUTTON,
          borderWidth: 1.5,
          borderColor: C.border,
          backgroundColor: C.pillUnselectedBg,
          opacity: 0.55,
        }}
      >
        {content}
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={a11y}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={{
        marginTop: 'auto',
        ...CYCLE_CONTROL_PILL_BUTTON,
        borderWidth: 1.5,
        borderColor: C.border,
        backgroundColor: tileSurfaceState(pressed, hovered),
        ...SHADOW.button,
      }}
    >
      {content}
    </Pressable>
  );
}

export function RecurringLinkTile({
  title,
  description,
  hint,
  onPress,
  a11y,
  style,
}) {
  return (
    <RecurringTileShell style={style}>
      <View
        style={{
          flex: 1,
          paddingVertical: 10,
          paddingHorizontal: 12,
          flexDirection: 'column',
          justifyContent: 'space-between',
          alignItems: 'stretch',
        }}
      >
        <View style={{ flex: 1, minHeight: 0 }}>
          <Text
            style={{ fontSize: 13, fontWeight: '600', color: C.primary, alignSelf: 'flex-start' }}
            numberOfLines={2}
          >
            {title}
          </Text>
          {description ? (
            <Text
              style={{ ...T.caption, color: C.muted, marginTop: 4 }}
              numberOfLines={3}
            >
              {description}
            </Text>
          ) : null}
        </View>
        <View style={{ alignSelf: 'flex-end', marginTop: 6 }}>
          <TileTextLink label={hint} a11y={a11y} onPress={onPress} />
        </View>
      </View>
    </RecurringTileShell>
  );
}
