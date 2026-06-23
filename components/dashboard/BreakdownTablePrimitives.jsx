import { Children, useCallback, useEffect, useState } from 'react';
import { View, Pressable, Platform } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { C, R, tabularNums } from '../../constants/onboarding-theme';
import BudgetExpandChevron from '../onboarding/BudgetExpandChevron';
import CardHeaderActionButton, { CardHeaderExpandIcon } from './CardHeaderActionButton';
import BreakdownSectionIcon from './BreakdownSectionIcon';
import { DASHBOARD_MOTION_DURATION_FAST, DASHBOARD_MOTION_EASE } from '../../lib/dashboardMotion';
import { useReducedMotion } from '../../lib/useReducedMotion';
import { elevationShadow } from '../../lib/shadow';
import { compactChildren } from '../../lib/compactChildren';

const PILL_ICON_SLOT = 36;
const PILL_CHEVRON_SLOT = 32;
const PILL_ROW_GAP = 10;
/** Proportional pill-table columns — share sits left of amount, not pinned to the far edge. */
const PILL_NAME_FLEX = 1.2;
const PILL_SHARE_FLEX = 0.85;
const PILL_AMOUNT_FLEX = 1.05;

function pillColumnHeaderTextStyle(align = 'left') {
  return {
    fontSize: 11,
    fontWeight: '600',
    color: C.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    textAlign: align,
    width: '100%',
  };
}

/** Maytech-style table frame — legacy wrapper for export/detail tables. */
export function MaytechTableFrame({ children, style }) {
  return (
    <View style={[{
      borderRadius: R.input,
      overflow: 'hidden',
      backgroundColor: C.surface,
      borderWidth: 1,
      borderColor: C.tableRowBorder,
    }, style]}
    >
      {children}
    </View>
  );
}

export function MaytechTableHeaderBand({ children, style }) {
  return (
    <View style={[{
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: C.tableHeaderBg,
      borderBottomWidth: 1,
      borderBottomColor: C.tableRowBorder,
    }, style]}
    >
      {children}
    </View>
  );
}

export function BreakdownCell({ children, width, minWidth, flex, align = 'left', narrow = false }) {
  let sizing;
  if (width != null) {
    sizing = { width, flexShrink: narrow ? 1 : 0 };
  } else if (flex != null) {
    sizing = {
      flexGrow: flex,
      flexShrink: 1,
      flexBasis: 0,
      minWidth: minWidth ?? 0,
    };
  } else if (minWidth != null) {
    sizing = { minWidth, flexShrink: 0, flexGrow: 0 };
  } else {
    sizing = {
      flexGrow: 1,
      flexShrink: 1,
      flexBasis: 0,
      minWidth: 0,
    };
  }

  return (
    <View style={{
      ...sizing,
      alignItems: align === 'right' ? 'flex-end' : align === 'center' ? 'center' : 'flex-start',
      justifyContent: 'center',
    }}>
      {compactChildren(children)}
    </View>
  );
}

export function BreakdownRow({ children, style }) {
  return (
    <View style={[{
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      width: '100%',
      alignSelf: 'stretch',
    }, style]}
    >
      {compactChildren(children)}
    </View>
  );
}

function ledgerCardShellStyle({ index, selected, pressed, hovered }) {
  const striped = index % 2 === 1;
  let bg = striped ? C.breakdownStripeBg : C.surface;
  if (selected) bg = C.pillSelectedBg;
  else if (pressed || hovered) bg = C.breakdownRowHover;
  return {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: R.card,
    backgroundColor: bg,
    borderWidth: 1,
    borderColor: selected ? C.pillSelectedBg : C.tableRowBorder,
    width: '100%',
    minHeight: 44,
    opacity: pressed ? 0.92 : 1,
  };
}

/**
 * Phone layout — stacked label/value pairs for ledger tables.
 * @param {Function} [renderCell] — (col) => ReactNode; overrides cells[col.key]
 */
export function LedgerCardRow({
  columns,
  cells = {},
  renderCell,
  index = 0,
  selected = false,
  onPress,
  accessibilityLabel,
  leading,
  trailing,
  skipKeys = [],
  children,
  style,
}) {
  const detailColumns = columns.filter(
    (col) => col.key !== 'name' && col.key !== 'amount' && col.label && !skipKeys.includes(col.key),
  );
  const nameValue = cells.name ?? '';
  const amountValue = cells.amount;

  const labelColor = selected ? C.pillSelectedText : C.text;
  const metaColor = selected ? 'rgba(255,255,255,0.78)' : C.muted;
  const valueColor = selected ? C.pillSelectedText : C.primary;

  const content = (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
        {leading}
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontSize: 15, fontWeight: '600', color: labelColor }} numberOfLines={3}>
            {nameValue}
          </Text>
        </View>
        {amountValue != null && amountValue !== '' ? (
          <Text
            style={{
              fontSize: 15,
              fontWeight: '700',
              color: selected ? C.pillSelectedText : C.primary,
              flexShrink: 0,
              ...tabularNums,
            }}
            numberOfLines={1}
          >
            {amountValue}
          </Text>
        ) : null}
        {trailing}
      </View>
      {detailColumns.map((col) => {
        const rendered = renderCell ? renderCell(col) : cells[col.key];
        if (rendered == null || rendered === '') return null;
        return (
          <View
            key={col.key}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: 12,
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: '600', color: metaColor, flex: 1 }} numberOfLines={2}>
              {col.label}
            </Text>
            <View style={{ flex: 1, alignItems: 'flex-end', minWidth: 0 }}>
              {typeof rendered === 'string' || typeof rendered === 'number' ? (
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: col.key === 'amount' ? '700' : '500',
                    color: valueColor,
                    textAlign: 'right',
                    ...tabularNums,
                  }}
                  numberOfLines={3}
                >
                  {rendered}
                </Text>
              ) : rendered}
            </View>
          </View>
        );
      })}
      {children}
    </View>
  );

  if (!onPress) {
    return (
      <View style={[ledgerCardShellStyle({ index, selected }), style]}>
        {content}
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected }}
      style={({ pressed, hovered }) => [
        ledgerCardShellStyle({
          index,
          selected,
          pressed,
          hovered: Platform.OS === 'web' && hovered,
        }),
        ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
        style,
      ]}
    >
      {content}
    </Pressable>
  );
}

/** Column labels above pill rows. */
export function BreakdownPillColumnHeaders({
  nameLabel,
  amountLabel,
  shareLabel,
  amountColMinW,
  shareColMinW,
}) {
  return (
    <BreakdownRow style={{ paddingHorizontal: 14, marginBottom: 8, gap: PILL_ROW_GAP }}>
      <View style={{ width: PILL_ICON_SLOT, flexShrink: 0 }} />
      <BreakdownCell flex={PILL_NAME_FLEX} align="left">
        <Text style={pillColumnHeaderTextStyle('left')}>
          {nameLabel}
        </Text>
      </BreakdownCell>
      <BreakdownCell flex={PILL_SHARE_FLEX} minWidth={shareColMinW} align="center">
        <Text style={pillColumnHeaderTextStyle('center')}>
          {shareLabel}
        </Text>
      </BreakdownCell>
      <BreakdownCell flex={PILL_AMOUNT_FLEX} minWidth={amountColMinW} align="right">
        <Text style={pillColumnHeaderTextStyle('right')}>
          {amountLabel}
        </Text>
      </BreakdownCell>
      <View style={{ width: PILL_CHEVRON_SLOT, flexShrink: 0 }} />
    </BreakdownRow>
  );
}

function pillRowColors({ index, selected, pressed, hovered }) {
  if (selected) {
    return {
      bg: C.pillSelectedBg,
      label: C.pillSelectedText,
      meta: 'rgba(255,255,255,0.78)',
      amount: C.pillSelectedText,
    };
  }
  const striped = index % 2 === 1;
  const base = striped ? C.breakdownStripeBg : 'transparent';
  let bg = base;
  if (pressed) bg = C.breakdownRowHover;
  else if (hovered) bg = C.breakdownRowHover;
  return {
    bg,
    label: C.text,
    meta: C.muted,
    amount: C.primary,
  };
}

function pillRowContainerStyle({ index, selected, pressed, hovered }) {
  const colors = pillRowColors({ index, selected, pressed, hovered });
  return {
    flexDirection: 'row',
    alignItems: 'center',
    gap: PILL_ROW_GAP,
    paddingVertical: 10,
    paddingHorizontal: 14,
    minHeight: 52,
    borderRadius: R.pill,
    backgroundColor: colors.bg,
    width: '100%',
    opacity: pressed ? 0.92 : 1,
  };
}

function BreakdownPillExpandChevron({
  expanded,
  selected,
  expandA11yLabel,
  onExpandPress,
}) {
  return (
    <Pressable
      onPress={onExpandPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={expandA11yLabel}
      accessibilityState={{ expanded }}
      style={{
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
        ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
      }}
    >
      {({ pressed, hovered }) => (
        <BudgetExpandChevron
          expanded={expanded}
          color={selected ? '#FFFFFF' : C.muted}
          compact
          hovered={hovered && !selected}
          pressed={pressed && !selected}
        />
      )}
    </Pressable>
  );
}

function BreakdownPillRowCells({
  sectionKey,
  scope,
  label,
  amount,
  share,
  index,
  selected,
  amountColMinW,
  shareColMinW,
  pressed = false,
  hovered = false,
}) {
  const colors = pillRowColors({
    index,
    selected,
    pressed,
    hovered: Platform.OS === 'web' && hovered,
  });

  return (
    <>
      <BreakdownSectionIcon sectionKey={sectionKey} scope={scope} selected={selected} />
      <BreakdownCell flex={PILL_NAME_FLEX} align="left">
        <Text style={{ fontSize: 15, fontWeight: '600', color: colors.label, textAlign: 'left', width: '100%' }} numberOfLines={2}>
          {label}
        </Text>
      </BreakdownCell>
      <BreakdownCell flex={PILL_SHARE_FLEX} minWidth={shareColMinW} align="center">
        <Text style={{ fontSize: 13, fontWeight: '500', color: colors.meta, textAlign: 'center', width: '100%', ...tabularNums }} numberOfLines={1}>
          {share}
        </Text>
      </BreakdownCell>
      <BreakdownCell flex={PILL_AMOUNT_FLEX} minWidth={amountColMinW} align="right">
        <Text style={{ fontSize: 14, fontWeight: '700', color: colors.amount, textAlign: 'right', width: '100%', ...tabularNums }} numberOfLines={1}>
          {amount}
        </Text>
      </BreakdownCell>
    </>
  );
}
/**
 * Capsule breakdown row — icon, label, share, amount; tap selects for optional navigation.
 * Expand chevron is a sibling control so web never nests <button> inside <button>.
 */
export function BreakdownPillRow({
  sectionKey,
  scope = 'expense',
  label,
  amount,
  share,
  index = 0,
  selected = false,
  expandable = false,
  expanded = false,
  onSelect,
  onExpandPress,
  expandA11yLabel,
  selectA11yLabel,
  amountColMinW,
  shareColMinW,
}) {
  const rowAnimStyle = usePillRowSelectMotion(selected);
  const [rowHovered, setRowHovered] = useState(false);
  const [bodyPressed, setBodyPressed] = useState(false);

  if (expandable) {
    const rowHoverProps = Platform.OS === 'web'
      ? { onMouseEnter: () => setRowHovered(true), onMouseLeave: () => setRowHovered(false) }
      : {};

    const rowCells = (
      <BreakdownPillRowCells
        sectionKey={sectionKey}
        scope={scope}
        label={label}
        amount={amount}
        share={share}
        index={index}
        selected={selected}
        amountColMinW={amountColMinW}
        shareColMinW={shareColMinW}
        pressed={bodyPressed}
        hovered={rowHovered}
      />
    );

    return (
      <Animated.View style={[{ width: '100%' }, rowAnimStyle]}>
        <View
          {...rowHoverProps}
          style={{
            ...pillRowContainerStyle({
              index,
              selected,
              pressed: bodyPressed,
              hovered: rowHovered,
            }),
            position: 'relative',
          }}
        >
          {onSelect ? (
            <Pressable
              onPress={onSelect}
              accessibilityRole="button"
              accessibilityLabel={selectA11yLabel || label}
              accessibilityState={{ expanded, selected }}
              onPressIn={() => setBodyPressed(true)}
              onPressOut={() => setBodyPressed(false)}
              style={({ pressed, hovered }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: PILL_ROW_GAP,
                width: '100%',
                borderRadius: R.pill,
                backgroundColor: 'transparent',
                ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
                opacity: pressed ? 0.92 : 1,
              })}
            >
              {rowCells}
              <View style={{ width: PILL_CHEVRON_SLOT, flexShrink: 0 }} />
            </Pressable>
          ) : (
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: PILL_ROW_GAP,
              width: '100%',
            }}
            >
              {rowCells}
              <View style={{ width: PILL_CHEVRON_SLOT, flexShrink: 0 }} />
            </View>
          )}
          <View
            style={{
              position: 'absolute',
              right: 14,
              top: 0,
              bottom: 0,
              justifyContent: 'center',
            }}
            pointerEvents="box-none"
          >
            <BreakdownPillExpandChevron
              expanded={expanded}
              selected={selected}
              expandA11yLabel={expandA11yLabel}
              onExpandPress={onExpandPress}
            />
          </View>
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[{ width: '100%' }, rowAnimStyle]}>
    <Pressable
      onPress={onSelect}
      disabled={!onSelect}
      accessibilityRole={onSelect ? 'button' : 'text'}
      accessibilityLabel={selectA11yLabel || label}
      accessibilityState={{ selected }}
      style={({ pressed, hovered }) => ({
        ...pillRowContainerStyle({
          index,
          selected,
          pressed,
          hovered: Platform.OS === 'web' && hovered,
        }),
        ...(Platform.OS === 'web' && onSelect ? { cursor: 'pointer' } : {}),
      })}
    >
      {({ pressed, hovered }) => {
        const colors = pillRowColors({ index, selected, pressed, hovered: Platform.OS === 'web' && hovered });
        return (
          <>
            <BreakdownSectionIcon sectionKey={sectionKey} scope={scope} selected={selected} />
            <BreakdownCell flex={PILL_NAME_FLEX} align="left">
              <Text style={{ fontSize: 15, fontWeight: '600', color: colors.label, textAlign: 'left', width: '100%' }} numberOfLines={2}>
                {label}
              </Text>
            </BreakdownCell>
            <BreakdownCell flex={PILL_SHARE_FLEX} minWidth={shareColMinW} align="center">
              <Text style={{ fontSize: 13, fontWeight: '500', color: colors.meta, textAlign: 'center', width: '100%', ...tabularNums }} numberOfLines={1}>
                {share}
              </Text>
            </BreakdownCell>
            <BreakdownCell flex={PILL_AMOUNT_FLEX} minWidth={amountColMinW} align="right">
              <Text style={{ fontSize: 14, fontWeight: '700', color: colors.amount, textAlign: 'right', width: '100%', ...tabularNums }} numberOfLines={1}>
                {amount}
              </Text>
            </BreakdownCell>
            <View style={{ width: PILL_CHEVRON_SLOT, flexShrink: 0 }} />
          </>
        );
      }}
    </Pressable>
    </Animated.View>
  );
}

/** Nested line item inside an expanded section. */
export function BreakdownPillSubRow({
  label,
  amount,
  share,
  amountColMinW,
  shareColMinW,
  isLast = false,
}) {
  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      gap: PILL_ROW_GAP,
      paddingVertical: 8,
      paddingHorizontal: 14,
      paddingLeft: 14 + PILL_ICON_SLOT + PILL_ROW_GAP,
      marginBottom: isLast ? 0 : 4,
      width: '100%',
      alignSelf: 'stretch',
    }}>
      <BreakdownCell flex={PILL_NAME_FLEX} align="left">
        <Text style={{ fontSize: 13, color: C.muted, textAlign: 'left', width: '100%' }} numberOfLines={2}>
          {label}
        </Text>
      </BreakdownCell>
      <BreakdownCell flex={PILL_SHARE_FLEX} minWidth={shareColMinW} align="center">
        <Text style={{ fontSize: 12, color: C.muted, textAlign: 'center', width: '100%', ...tabularNums }} numberOfLines={1}>
          {share}
        </Text>
      </BreakdownCell>
      <BreakdownCell flex={PILL_AMOUNT_FLEX} minWidth={amountColMinW} align="right">
        <Text style={{ fontSize: 13, fontWeight: '600', color: C.text, textAlign: 'right', width: '100%', ...tabularNums }} numberOfLines={1}>
          {amount}
        </Text>
      </BreakdownCell>
      <View style={{ width: PILL_CHEVRON_SLOT, flexShrink: 0 }} />
    </View>
  );
}

/** Subtle scale when a pill row is selected — shared by breakdown + ledger tables. */
export function usePillRowSelectMotion(selected) {
  const reduceMotion = useReducedMotion();
  const selectProgress = useSharedValue(selected ? 1 : 0);

  useEffect(() => {
    if (reduceMotion) {
      selectProgress.value = selected ? 1 : 0;
      return;
    }
    selectProgress.value = withTiming(selected ? 1 : 0, {
      duration: DASHBOARD_MOTION_DURATION_FAST,
      easing: DASHBOARD_MOTION_EASE,
    });
  }, [selected, reduceMotion, selectProgress]);

  return useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(selectProgress.value, [0, 1], [1, 1.008]) }],
  }));
}

/** Fade/slide below-row overlay — keeps mounted until exit timing finishes. */
function useBreakdownOverlayMotion(visible, onStackElevatedChange) {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(visible ? 1 : 0);
  const [rendered, setRendered] = useState(visible);

  const finishExit = useCallback(() => {
    setRendered(false);
    onStackElevatedChange?.(false);
  }, [onStackElevatedChange]);

  useEffect(() => {
    if (reduceMotion) {
      progress.value = visible ? 1 : 0;
      setRendered(visible);
      onStackElevatedChange?.(visible);
      return;
    }

    if (visible) {
      setRendered(true);
      onStackElevatedChange?.(true);
    }

    progress.value = withTiming(visible ? 1 : 0, {
      duration: DASHBOARD_MOTION_DURATION_FAST,
      easing: DASHBOARD_MOTION_EASE,
    }, (finished) => {
      if (finished && !visible) {
        runOnJS(finishExit)();
      }
    });
  }, [visible, reduceMotion, progress, finishExit, onStackElevatedChange]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      { translateY: interpolate(progress.value, [0, 1], [8, 0]) },
    ],
  }));

  return { animatedStyle, rendered };
}

/** Vertical space reserved below a selected row so action buttons are not covered by the next row. */
const ACTION_OVERLAY_RESERVE = 44;

/** Edit + delete actions — overlays below a selected pill row. */
export function BreakdownRowActionOverlay({
  visible,
  anchorTop = 0,
  editLabel,
  deleteLabel,
  onEdit,
  onDelete,
  showDelete = true,
  editA11yLabel,
  deleteA11yLabel,
  onStackElevatedChange,
}) {
  const { animatedStyle, rendered } = useBreakdownOverlayMotion(visible, onStackElevatedChange);

  if (!rendered) return null;
  if (visible && anchorTop <= 0) return null;

  const actionBtnStyle = (pressed, hovered, destructive = false) => ({
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    minHeight: 36,
    borderRadius: R.pill,
    backgroundColor: pressed
      ? (destructive ? '#DC2626' : C.primaryPressed)
      : hovered && Platform.OS === 'web'
        ? (destructive ? C.danger : C.accent)
        : (destructive ? C.danger : C.primary),
    ...elevationShadow({ offsetY: 4, blur: 12, opacity: 0.12 }),
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  });

  return (
    <Animated.View
      style={[{
        position: 'absolute',
        left: 0,
        right: 0,
        width: '100%',
        top: anchorTop,
        pointerEvents: visible ? 'auto' : 'none',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        zIndex: 20,
      }, animatedStyle]}
    >
      <Pressable
        onPress={onEdit}
        accessibilityRole="button"
        accessibilityLabel={editA11yLabel || editLabel}
        style={({ pressed, hovered }) => actionBtnStyle(pressed, hovered)}
      >
        <Text style={{ fontSize: 13, fontWeight: '600', color: '#FFFFFF', lineHeight: 16 }}>
          {editLabel}
        </Text>
      </Pressable>
      {showDelete ? (
        <Pressable
          onPress={onDelete}
          accessibilityRole="button"
          accessibilityLabel={deleteA11yLabel || deleteLabel}
          style={({ pressed, hovered }) => actionBtnStyle(pressed, hovered, true)}
        >
          <Text style={{ fontSize: 13, fontWeight: '600', color: '#FFFFFF', lineHeight: 16 }}>
            {deleteLabel}
          </Text>
        </Pressable>
      ) : null}
    </Animated.View>
  );
}

/** Full-width row slot — action overlay anchors below the pill row only. */
export function BreakdownPillRowSlot({
  selected = false,
  actionVisible = false,
  actionLabel,
  actionA11yLabel,
  onAction,
  crudAction,
  children,
}) {
  const [rowHeight, setRowHeight] = useState(0);
  const [stackElevated, setStackElevated] = useState(false);
  const handleStackElevatedChange = useCallback((elevated) => {
    setStackElevated(elevated);
  }, []);
  const childList = Children.toArray(children);
  const row = childList[0] ?? null;
  const belowRow = childList.slice(1);
  const anchorTop = rowHeight > 0 ? rowHeight + 2 : 0;
  const stackOnTop = selected || stackElevated;
  const reserveActive = actionVisible || stackElevated;
  const reduceMotion = useReducedMotion();
  const reserveProgress = useSharedValue(reserveActive ? 1 : 0);

  useEffect(() => {
    if (reduceMotion) {
      reserveProgress.value = reserveActive ? 1 : 0;
      return;
    }
    reserveProgress.value = withTiming(reserveActive ? 1 : 0, {
      duration: DASHBOARD_MOTION_DURATION_FAST,
      easing: DASHBOARD_MOTION_EASE,
    });
  }, [reserveActive, reduceMotion, reserveProgress]);

  const slotAnimStyle = useAnimatedStyle(() => ({
    paddingBottom: interpolate(reserveProgress.value, [0, 1], [0, ACTION_OVERLAY_RESERVE]),
  }));

  const overlay = crudAction ? (
    <BreakdownRowActionOverlay
      visible={actionVisible}
      anchorTop={anchorTop}
      onStackElevatedChange={handleStackElevatedChange}
      editLabel={crudAction.editLabel}
      deleteLabel={crudAction.deleteLabel}
      onEdit={crudAction.onEdit}
      onDelete={crudAction.onDelete}
      showDelete={crudAction.showDelete !== false}
      editA11yLabel={crudAction.editA11yLabel}
      deleteA11yLabel={crudAction.deleteA11yLabel}
    />
  ) : (
    <BreakdownSectionOpenOverlay
      visible={actionVisible}
      anchorTop={anchorTop}
      onStackElevatedChange={handleStackElevatedChange}
      actionLabel={actionLabel}
      a11yLabel={actionA11yLabel}
      onPress={onAction}
    />
  );

  return (
    <Animated.View style={[{
      width: '100%',
      alignSelf: 'stretch',
      position: 'relative',
      zIndex: stackOnTop ? 100 : 0,
      overflow: 'visible',
      ...(Platform.OS === 'android' && stackOnTop ? { elevation: 8 } : {}),
      ...(Platform.OS === 'web' && stackOnTop ? { isolation: 'isolate' } : {}),
    }, slotAnimStyle]}
    >
      <View
        onLayout={(event) => {
          const nextHeight = event.nativeEvent.layout.height;
          if (nextHeight > 0 && Math.abs(nextHeight - rowHeight) > 0.5) {
            setRowHeight(nextHeight);
          }
        }}
      >
        {row}
      </View>
      {overlay}
      {belowRow}
    </Animated.View>
  );
}

/** Floating confirm button — overlays below the row without shifting layout. */
export function BreakdownSectionOpenOverlay({
  visible,
  anchorTop = 0,
  onPress,
  actionLabel,
  a11yLabel,
  onStackElevatedChange,
}) {
  const { animatedStyle, rendered } = useBreakdownOverlayMotion(visible, onStackElevatedChange);

  if (!rendered) return null;
  if (visible && anchorTop <= 0) return null;

  return (
    <Animated.View
      style={[{
        position: 'absolute',
        left: 0,
        right: 0,
        width: '100%',
        top: anchorTop,
        pointerEvents: visible ? 'auto' : 'none',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 20,
      }, animatedStyle]}
    >
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={a11yLabel || actionLabel}
        style={({ pressed, hovered }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: 8,
          paddingHorizontal: 16,
          minHeight: 36,
          borderRadius: R.pill,
          backgroundColor: pressed
            ? C.primaryPressed
            : hovered && Platform.OS === 'web'
              ? C.accent
              : C.primary,
          ...elevationShadow({ offsetY: 4, blur: 12, opacity: 0.12 }),
          ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
        })}
      >
        <Text style={{ fontSize: 13, fontWeight: '600', color: '#FFFFFF', lineHeight: 16 }}>
          {actionLabel}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

/** @deprecated Use BreakdownSectionOpenOverlay */
export function BreakdownSectionOpenAction(props) {
  return <BreakdownSectionOpenOverlay {...props} visible />;
}

/** Expand/collapse all — compact control for breakdown card headers. */
export function BreakdownExpandAllButton({ allExpanded, onToggle, t }) {
  return (
    <CardHeaderActionButton
      label={allExpanded
        ? t('onboarding.budget.budgetSplit.collapseAll')
        : t('onboarding.budget.budgetSplit.expandAll')}
      onPress={onToggle}
      accessibilityLabel={allExpanded
        ? t('onboarding.budget.budgetSplit.a11y.collapseAll')
        : t('onboarding.budget.budgetSplit.a11y.expandAll')}
      trailingIcon={<CardHeaderExpandIcon expanded={allExpanded} color={C.muted} active={allExpanded} />}
    />
  );
}
