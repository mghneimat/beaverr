import { useState, useCallback, useEffect, useRef } from 'react';
import { View, Pressable, Platform } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useRouter } from 'expo-router';
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useI18n } from '../../lib/i18n';
import {
  setReminderPref,
  REMINDER_CHANNEL_OPTIONS,
  normalizeReminderTypes,
  resolveDraftReminderTypes,
  isReminderEffectivelyEnabled,
  isReminderDateAllowed,
  getReminderMinSelectableDate,
  resolveReminderSaveToastKind,
  formatReminderDateLabel,
  getReminderTypeDisplayLabels,
} from '../../lib/reminderPreferences';
import SplitDateFields from '../onboarding/SplitDateFields';
import FieldError from '../onboarding/FieldError';
import { buildReminderExpenseEditRoute } from '../../lib/reminderTableRows';
import { notifyDashboardRefresh } from '../../lib/dashboardRefresh';
import { emitDashboardToast } from '../../lib/dashboardToast';
import {
  DASHBOARD_MOTION_DURATION,
  DASHBOARD_MOTION_DURATION_FAST,
  DASHBOARD_MOTION_EASE,
} from '../../lib/dashboardMotion';
import { useReducedMotion } from '../../lib/useReducedMotion';
import { C, R, T, tabularNums } from '../../constants/onboarding-theme';
import InCardSectionHeader from './InCardSectionHeader';
import SurfaceCard from '../ui/SurfaceCard';
import ConfirmDialog from '../ui/ConfirmDialog';
import AnimatedCollapse from './AnimatedCollapse';
import BreakdownSectionIcon from './BreakdownSectionIcon';
import { BreakdownCell, BreakdownPillRowSlot, BreakdownRow } from './BreakdownTablePrimitives';

const WARNING_CHIP = {
  bg: '#FEF3C7',
  border: '#FCD34D',
  text: '#92400E',
};

const EMPTY_REMINDER_VALIDATION = { date: '', type: '' };

function MissingDatesWarningButton({ onPress, a11yLabel }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}
      style={({ pressed, hovered }) => ({
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 8,
        backgroundColor: pressed
          ? WARNING_CHIP.bg
          : hovered
            ? 'rgba(254, 243, 199, 0.65)'
            : 'transparent',
        ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
      })}
    >
      <Text style={{ fontSize: 16, color: '#D97706', lineHeight: 20 }}>⚠</Text>
    </Pressable>
  );
}

export function RemindersMissingDatesBanner({ count, onGoToExpenses }) {
  const { t } = useI18n();
  if (count <= 0) return null;

  return (
    <View style={{
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: R.card,
      backgroundColor: WARNING_CHIP.bg,
      borderWidth: 1,
      borderColor: WARNING_CHIP.border,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    }}>
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 0 }}>
        <Text
          accessible={false}
          style={{
            marginLeft: 4,
            fontSize: 14,
            color: '#D97706',
            lineHeight: 18,
            flexShrink: 0,
            ...(Platform.OS === 'android' ? { includeFontPadding: false, textAlignVertical: 'center' } : {}),
          }}
        >
          ⚠
        </Text>
        <Text
          style={{ flex: 1, fontSize: 13, fontWeight: '500', color: WARNING_CHIP.text, lineHeight: 18 }}
          numberOfLines={3}
        >
          {t('dashboard.remindersScreen.missingDatesBanner', { count })}
        </Text>
      </View>
      <Pressable
        onPress={onGoToExpenses}
        accessibilityRole="button"
        accessibilityLabel={t('dashboard.remindersScreen.goToExpensesA11y')}
        style={({ pressed, hovered }) => ({
          flexShrink: 0,
          paddingVertical: 4,
          paddingLeft: 8,
          paddingRight: 12,
          opacity: pressed || hovered ? 0.72 : 1,
          ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
        })}
      >
        <Text style={{ fontSize: 13, fontWeight: '700', color: WARNING_CHIP.text }}>
          {t('dashboard.remindersScreen.goToExpenses')}
        </Text>
      </Pressable>
    </View>
  );
}

function pillRowColors({ index, selected, editing, pressed, hovered }) {
  if (editing) {
    return {
      bg: C.surfaceTint,
      label: C.text,
      meta: REMINDERS_CELL_META,
    };
  }
  if (selected) {
    return {
      bg: C.pillSelectedBg,
      label: C.pillSelectedText,
      meta: 'rgba(255,255,255,0.78)',
    };
  }
  const striped = index % 2 === 1;
  let bg = striped ? C.breakdownStripeBg : 'transparent';
  if (pressed || hovered) bg = C.breakdownRowHover;
  return { bg, label: C.text, meta: REMINDERS_CELL_META };
}

function ReminderSwitch({ enabled, onToggle, disabled, a11yLabel }) {
  const reduceMotion = useReducedMotion();
  const thumbProgress = useSharedValue(enabled ? 1 : 0);

  useEffect(() => {
    if (reduceMotion) {
      thumbProgress.value = enabled ? 1 : 0;
      return;
    }
    thumbProgress.value = withTiming(enabled ? 1 : 0, {
      duration: DASHBOARD_MOTION_DURATION_FAST,
      easing: DASHBOARD_MOTION_EASE,
    });
  }, [enabled, reduceMotion, thumbProgress]);

  const trackAnimatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      thumbProgress.value,
      [0, 1],
      [C.border, C.accent],
    ),
  }));

  const thumbAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(thumbProgress.value, [0, 1], [0, 16]) }],
  }));

  const handlePress = (event) => {
    if (Platform.OS === 'web') {
      event?.stopPropagation?.();
      event?.preventDefault?.();
    }
    if (disabled) return;
    onToggle(!enabled);
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      accessibilityRole="switch"
      accessibilityState={{ checked: enabled, disabled }}
      accessibilityLabel={a11yLabel}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        opacity: disabled ? 0.45 : pressed ? 0.85 : 1,
        ...(Platform.OS === 'web' && !disabled ? { cursor: 'pointer' } : {}),
      })}
    >
      <Animated.View style={[{
        width: 40,
        height: 24,
        borderRadius: 12,
        padding: 2,
        justifyContent: 'center',
      }, trackAnimatedStyle]}>
        <Animated.View style={[{
          width: 20,
          height: 20,
          borderRadius: 10,
          backgroundColor: C.surface,
        }, thumbAnimatedStyle]} />
      </Animated.View>
    </Pressable>
  );
}

function resolveDisplayPref(row, pendingDisplay) {
  if (!pendingDisplay || pendingDisplay.rowId !== row.id) return row.pref;
  return {
    ...row.pref,
    enabled: pendingDisplay.enabled ?? row.pref?.enabled,
    remindOnDate: pendingDisplay.remindOnDate ?? row.pref?.remindOnDate ?? null,
    reminderTypes: pendingDisplay.reminderTypes ?? row.pref?.reminderTypes ?? [],
  };
}

function rowEffectivePref(row, pendingDisplay) {
  const pref = resolveDisplayPref(row, pendingDisplay);
  return {
    ...pref,
    enabled: isReminderEffectivelyEnabled(pref, { hasNextPayment: row.hasNextPayment === true }),
  };
}

function ReminderTypeMultiSelect({ value, onChange, disabled, errorText }) {
  const { t } = useI18n();
  const selected = normalizeReminderTypes(value);
  const invalid = Boolean(errorText);

  const toggle = (key) => {
    if (disabled) return;
    const next = selected.includes(key)
      ? selected.filter((item) => item !== key)
      : [...selected, key];
    onChange(next);
  };

  return (
    <View style={{ width: '100%' }}>
      <Text style={{ ...T.fieldLabel, color: C.muted, marginBottom: 8 }}>
        {t('dashboard.remindersScreen.reminderTypeLabel')}
      </Text>
      <View style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        padding: invalid ? 10 : 0,
        marginHorizontal: invalid ? -10 : 0,
        borderRadius: R.input,
        borderWidth: invalid ? 2 : 0,
        borderColor: invalid ? C.danger : 'transparent',
      }}>
        {REMINDER_CHANNEL_OPTIONS.map((key) => {
          const isSelected = selected.includes(key);
          return (
            <Pressable
              key={key}
              onPress={() => toggle(key)}
              disabled={disabled}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isSelected, disabled }}
              accessibilityLabel={t(`dashboard.remindersScreen.reminderTypes.${key}`)}
              style={({ pressed, hovered }) => ({
                paddingVertical: 8,
                paddingHorizontal: 14,
                borderRadius: R.pill,
                borderWidth: 1,
                borderColor: isSelected ? C.accent : C.border,
                backgroundColor: isSelected
                  ? C.surface
                  : pressed || hovered
                    ? C.overlayHover
                    : C.surface,
                opacity: disabled ? 0.5 : 1,
                ...(Platform.OS === 'web' && !disabled ? { cursor: 'pointer' } : {}),
              })}
            >
              <Text style={{
                fontSize: 13,
                fontWeight: isSelected ? '600' : '500',
                color: isSelected ? C.accent : C.muted,
              }}>
                {t(`dashboard.remindersScreen.reminderTypes.${key}`)}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {errorText ? <FieldError message={errorText} style={{ marginTop: 8 }} /> : null}
    </View>
  );
}

function ReminderSettingsExpand({
  remindOnDate,
  reminderTypes,
  onRemindOnDateChange,
  onReminderTypesChange,
  onDateDropdownOpenChange,
  validationErrors,
  disabled,
  saving,
  onSave,
  onCancel,
}) {
  const { t } = useI18n();

  return (
    <View style={{
      width: '100%',
      paddingTop: 16,
      paddingBottom: 8,
    }}>
      <View style={{
        width: '100%',
        marginBottom: 16,
        zIndex: 2,
      }}>
        <Text style={{ ...T.fieldLabel, color: C.muted, marginBottom: 8 }}>
          {t('dashboard.remindersScreen.remindOnDateLabel')}
        </Text>
        <SplitDateFields
          value={remindOnDate || ''}
          onChange={onRemindOnDateChange}
          onElevatedChange={onDateDropdownOpenChange}
          errorText={validationErrors.date || undefined}
          minSelectableDate={getReminderMinSelectableDate()}
          yearPast={0}
          showDay
        />
      </View>
      <View style={{ zIndex: 1, marginBottom: 16 }}>
        <ReminderTypeMultiSelect
          value={reminderTypes}
          onChange={onReminderTypesChange}
          disabled={disabled}
          errorText={validationErrors.type || undefined}
        />
      </View>
      <ReminderEditActions saving={saving} onSave={onSave} onCancel={onCancel} />
    </View>
  );
}

const CANCEL_ACTION_COLOR = '#64748B';

function compactActionLabel(text, color = C.accent) {
  return {
    fontSize: 12,
    fontWeight: '600',
    color,
  };
}

function ReminderEditActions({ saving, onSave, onCancel }) {
  const { t } = useI18n();

  const stopPressPropagation = (event) => {
    if (Platform.OS === 'web') {
      event?.stopPropagation?.();
    }
  };

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 10 }}>
      <Pressable
        onPress={onSave}
        onPressIn={stopPressPropagation}
        disabled={saving}
        accessibilityRole="button"
        accessibilityLabel={t('common.save')}
        style={({ pressed, hovered }) => ({
          paddingVertical: 6,
          paddingHorizontal: 12,
          borderRadius: 6,
          flexShrink: 0,
          backgroundColor: pressed || hovered ? C.overlayPressed : C.surfaceTint,
          opacity: saving ? 0.5 : 1,
          ...(Platform.OS === 'web' ? { cursor: saving ? 'default' : 'pointer' } : {}),
        })}
      >
        <Text style={compactActionLabel(t('common.save'))}>{t('common.save')}</Text>
      </Pressable>
      <Pressable
        onPress={onCancel}
        onPressIn={stopPressPropagation}
        disabled={saving}
        accessibilityRole="button"
        accessibilityLabel={t('common.cancel')}
        style={({ pressed, hovered }) => ({
          paddingVertical: 6,
          paddingHorizontal: 12,
          borderRadius: 6,
          flexShrink: 0,
          backgroundColor: saving
            ? 'transparent'
            : pressed
              ? C.overlayPressed
              : hovered
                ? C.overlayHover
                : 'transparent',
          opacity: saving ? 0.5 : 1,
          ...(Platform.OS === 'web' ? { cursor: saving ? 'default' : 'pointer' } : {}),
        })}
      >
        <Text style={compactActionLabel(t('common.cancel'), saving ? C.muted : CANCEL_ACTION_COLOR)}>
          {t('common.cancel')}
        </Text>
      </Pressable>
    </View>
  );
}

/** Centers reminder status/icon in the column. */
function ReminderColumnCenter({ children, minHeight = 36 }) {
  return (
    <View style={{
      width: '100%',
      minHeight,
      alignItems: 'center',
      justifyContent: 'center',
    }}
    >
      {children}
    </View>
  );
}

function ReminderColumnCell({
  row,
  editing,
  draftEnabled,
  saving,
  pendingDisplay,
  colors,
  selected,
  onDraftChange,
}) {
  const { t } = useI18n();
  const hasNextPayment = row.hasNextPayment === true;
  const savedEnabled = rowEffectivePref(row, pendingDisplay).enabled === true;

  const viewContent = !hasNextPayment ? (
    <ReminderColumnCenter>
      <Text
        accessible={false}
        style={{ fontSize: 16, color: '#D97706', lineHeight: 20 }}
      >
        ⚠
      </Text>
    </ReminderColumnCenter>
  ) : (
    <ReminderColumnCenter>
      <Text style={{
        fontSize: 13,
        fontWeight: '600',
        color: selected ? colors.label : (savedEnabled ? C.positive : REMINDERS_CELL_META),
        textAlign: 'center',
      }}>
        {savedEnabled
          ? t('dashboard.remindersScreen.reminderOn')
          : t('dashboard.remindersScreen.reminderOff')}
      </Text>
    </ReminderColumnCenter>
  );

  const editContent = (
    <ReminderColumnCenter>
      <ReminderSwitch
        enabled={draftEnabled}
        onToggle={onDraftChange}
        disabled={!hasNextPayment || saving}
        a11yLabel={t('dashboard.remindersScreen.enableAlert')}
      />
    </ReminderColumnCenter>
  );

  if (!editing) {
    return viewContent;
  }

  return editContent;
}

function ReminderTypesCell({ pref, colors, t, hasNextPayment }) {
  if (!pref?.enabled) {
    return (
      <Text style={{
        fontSize: 14,
        fontWeight: '500',
        color: colors.meta,
        textAlign: 'center',
        width: '100%',
      }}>
        {t('dashboard.expensesScreen.noDate')}
      </Text>
    );
  }

  const labels = getReminderTypeDisplayLabels(pref, t, { short: true, hasNextPayment });
  if (!labels?.length) {
    return (
      <Text style={{
        fontSize: 13,
        fontWeight: '500',
        color: colors.meta,
        textAlign: 'center',
        width: '100%',
      }}>
        {t('dashboard.remindersScreen.reminderTypePleaseSelect')}
      </Text>
    );
  }

  if (labels.length === 1) {
    return (
      <Text style={{
        fontSize: 13,
        fontWeight: '500',
        color: colors.meta,
        textAlign: 'center',
        width: '100%',
      }}>
        {labels[0]}
      </Text>
    );
  }

  return (
    <View style={{ width: '100%', alignItems: 'center', gap: 2 }}>
      {labels.map((label) => (
        <Text
          key={label}
          style={{
            fontSize: 12,
            fontWeight: '500',
            color: colors.meta,
            textAlign: 'center',
            lineHeight: 15,
          }}
        >
          {label}
        </Text>
      ))}
    </View>
  );
}

function remindersColumnAlign(col) {
  if (col.key === 'name') return 'left';
  return col.align || 'center';
}

function remindersColumnTextAlign(align) {
  if (align === 'center') return 'center';
  if (align === 'right') return 'right';
  return 'left';
}

function remindersColumnSizing(col) {
  return {
    flex: 1,
    align: remindersColumnAlign(col),
  };
}

function RemindersLedgerCell({ col, sizing, children }) {
  return (
    <BreakdownCell
      key={col.key}
      flex={sizing.flex}
      width={sizing.width}
      minWidth={sizing.minWidth}
      align={sizing.align}
    >
      {children}
    </BreakdownCell>
  );
}

const REMINDERS_ROW_PAD_H = 14;
/** Slightly darker than C.muted — table cell dates and meta labels. */
const REMINDERS_CELL_META = '#64748B';

function RemindersColumnHeaders({ columns }) {
  return (
    <BreakdownRow style={{
      paddingHorizontal: REMINDERS_ROW_PAD_H,
      marginBottom: 8,
      gap: 10,
    }}>
      <View style={{ width: 36, flexShrink: 0 }} />
      {columns.map((col) => {
        const sizing = remindersColumnSizing(col);
        return (
          <RemindersLedgerCell key={col.key} col={col} sizing={sizing}>
            {col.label ? (
              <Text style={{
                fontSize: 11,
                fontWeight: '600',
                color: C.muted,
                textTransform: 'uppercase',
                letterSpacing: 0.4,
                textAlign: remindersColumnTextAlign(sizing.align),
                width: '100%',
              }}
              numberOfLines={1}
              >
                {col.label}
              </Text>
            ) : null}
          </RemindersLedgerCell>
        );
      })}
    </BreakdownRow>
  );
}

function RemindersTableRow({
  row,
  columns,
  index,
  selected,
  inSession,
  editExpanded,
  draftEnabled,
  settingsPanelOpen,
  draftRemindOnDate,
  draftReminderTypes,
  validationErrors,
  saving,
  pendingDisplay,
  iconSectionKey,
  iconScope,
  onSelect,
  onEdit,
  onMissingDatesPress,
  onDraftChange,
  onRemindOnDateChange,
  onReminderTypesChange,
  onSave,
  onCancel,
}) {
  const { t } = useI18n();
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);
  const [editActionReady, setEditActionReady] = useState(false);
  const displayPref = rowEffectivePref(row, pendingDisplay);
  const hasNextPayment = row.hasNextPayment === true;
  const editing = inSession && editExpanded;
  const rowSelected = selected || editing;
  const c = pillRowColors({ index, selected: rowSelected && !editing, editing: false, pressed: false, hovered: false });
  const settingsExpanded = editing && draftEnabled && settingsPanelOpen;
  const rowRadius = editing ? R.card : R.pill;

  const staticColors = editing
    ? pillRowColors({ index, selected: false, editing: true, pressed: false, hovered: false })
    : c;

  const rowName = row.cells?.name || row.name || '';
  const selectA11yLabel = t('dashboard.ledgerTable.selectRowA11y', { label: rowName });
  const editA11yLabel = t('dashboard.remindersScreen.editReminderA11y', { name: rowName });

  useEffect(() => {
    if (!settingsExpanded) setDateDropdownOpen(false);
  }, [settingsExpanded]);

  useEffect(() => {
    if (!selected || editing) {
      setEditActionReady(false);
      return undefined;
    }
    const timer = setTimeout(() => setEditActionReady(true), 0);
    return () => clearTimeout(timer);
  }, [selected, editing]);

  const handleEditPress = () => {
    if (!row.hasNextPayment) {
      onMissingDatesPress();
      return;
    }
    onEdit();
  };

  const rowShellStyle = {
    borderRadius: rowRadius,
    borderWidth: editing ? 1 : 0,
    width: '100%',
  };

  const rowCellsStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: REMINDERS_ROW_PAD_H,
    minHeight: 52,
    width: '100%',
  };

  const resolveRowShellColors = (pressed, hovered) => {
    if (editing) {
      return staticColors;
    }
    return pillRowColors({
      index,
      selected: rowSelected,
      editing: false,
      pressed,
      hovered: Platform.OS === 'web' && hovered,
    });
  };

  const renderRowCells = (colors) => (
    <>
      <BreakdownSectionIcon
        sectionKey={row.iconSectionKey || iconSectionKey}
        scope={row.iconScope || iconScope}
        selected={rowSelected}
      />
      {columns.map((col) => {
        const sizing = remindersColumnSizing(col);
        const isName = col.key === 'name';
        const cellValue = col.key === 'reminderDate'
          ? formatReminderDateLabel(displayPref, t, { hasNextPayment })
          : row.cells[col.key];

        if (col.key === 'reminderType') {
          return (
            <RemindersLedgerCell key={col.key} col={col} sizing={sizing}>
              <ReminderTypesCell pref={displayPref} colors={colors} t={t} hasNextPayment={hasNextPayment} />
            </RemindersLedgerCell>
          );
        }

        if (col.key === 'reminder') {
          return (
            <RemindersLedgerCell key={col.key} col={col} sizing={sizing}>
              <ReminderColumnCell
                row={row}
                editing={editing}
                draftEnabled={draftEnabled}
                saving={saving}
                pendingDisplay={pendingDisplay}
                colors={colors}
                selected={rowSelected && !editing}
                onDraftChange={onDraftChange}
              />
            </RemindersLedgerCell>
          );
        }

        return (
          <RemindersLedgerCell key={col.key} col={col} sizing={sizing}>
            <Text style={{
              fontSize: isName ? 15 : 14,
              fontWeight: isName ? '600' : '500',
              color: isName ? colors.label : colors.meta,
              textAlign: remindersColumnTextAlign(sizing.align),
              width: '100%',
              ...(!isName ? tabularNums : {}),
            }}
            numberOfLines={isName ? 2 : 1}
            >
              {cellValue}
            </Text>
          </RemindersLedgerCell>
        );
      })}
    </>
  );

  const rowShellVisual = (pressed = false, hovered = false) => {
    const colors = editing ? staticColors : resolveRowShellColors(pressed, hovered);
    return {
      ...rowShellStyle,
      backgroundColor: colors.bg,
      borderColor: editing ? C.border : 'transparent',
    };
  };

  const editCardShellStyle = {
    width: '100%',
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: staticColors.bg,
    borderRadius: R.card,
    overflow: dateDropdownOpen ? 'visible' : 'hidden',
    ...(dateDropdownOpen ? { zIndex: 200, position: 'relative' } : null),
  };

  const rowPressable = editing ? (
    <View style={editCardShellStyle}>
      <View style={rowCellsStyle}>
        {renderRowCells(staticColors)}
      </View>
      <AnimatedCollapse
        visible={settingsExpanded}
        fallbackHeight={280}
        style={dateDropdownOpen ? { overflow: 'visible', zIndex: 200 } : undefined}
      >
        <View style={{
          paddingHorizontal: REMINDERS_ROW_PAD_H,
          paddingBottom: 18,
          borderTopWidth: 1,
          borderTopColor: C.border,
          overflow: 'visible',
        }}>
          <ReminderSettingsExpand
            remindOnDate={draftRemindOnDate}
            reminderTypes={draftReminderTypes}
            onRemindOnDateChange={onRemindOnDateChange}
            onReminderTypesChange={onReminderTypesChange}
            onDateDropdownOpenChange={setDateDropdownOpen}
            validationErrors={validationErrors}
            disabled={saving}
            saving={saving}
            onSave={onSave}
            onCancel={onCancel}
          />
        </View>
      </AnimatedCollapse>
      <AnimatedCollapse visible={!settingsExpanded} fallbackHeight={58}>
        <View style={{
          paddingHorizontal: REMINDERS_ROW_PAD_H,
          paddingTop: 12,
          paddingBottom: 14,
          borderTopWidth: 1,
          borderTopColor: C.border,
        }}>
          <ReminderEditActions saving={saving} onSave={onSave} onCancel={onCancel} />
        </View>
      </AnimatedCollapse>
    </View>
  ) : (
    <Pressable
      onPress={onSelect}
      accessibilityRole="button"
      accessibilityLabel={selectA11yLabel}
      accessibilityState={{ selected }}
      style={({ pressed, hovered }) => ({
        ...rowShellVisual(pressed, Platform.OS === 'web' && hovered),
        ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
        opacity: pressed ? 0.92 : 1,
      })}
    >
      {({ pressed, hovered }) => (
        <View style={rowCellsStyle}>
          {renderRowCells(resolveRowShellColors(
            pressed,
            Platform.OS === 'web' && hovered,
          ))}
        </View>
      )}
    </Pressable>
  );

  return (
    <BreakdownPillRowSlot
      selected={rowSelected}
      actionVisible={selected && !editing && editActionReady}
      crudAction={{
        editLabel: t('common.edit'),
        deleteLabel: t('common.delete'),
        onEdit: handleEditPress,
        onDelete: () => {},
        showDelete: false,
        editA11yLabel,
        deleteA11yLabel: '',
      }}
    >
      {rowPressable}
    </BreakdownPillRowSlot>
  );
}

export default function RemindersLedgerTable({
  title,
  columns,
  rows,
  emptyLabel,
  iconSectionKey = 'other',
  iconScope = 'expense',
}) {
  const { t } = useI18n();
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [selectedId, setSelectedId] = useState(null);
  const [editSessionId, setEditSessionId] = useState(null);
  const [editExpanded, setEditExpanded] = useState(false);
  const [draftEnabled, setDraftEnabled] = useState(false);
  const [settingsPanelOpen, setSettingsPanelOpen] = useState(false);
  const [draftRemindOnDate, setDraftRemindOnDate] = useState('');
  const [draftReminderTypes, setDraftReminderTypes] = useState([]);
  const [validationErrors, setValidationErrors] = useState(EMPTY_REMINDER_VALIDATION);
  const [saving, setSaving] = useState(false);
  const [pendingDisplay, setPendingDisplay] = useState(null);
  const [missingDatesDialogRow, setMissingDatesDialogRow] = useState(null);
  const closeTimerRef = useRef(null);

  useEffect(() => () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
  }, []);

  const finishEditSession = useCallback(({ refresh = false, displaySnapshot = null, rowId = editSessionId } = {}) => {
    setEditExpanded(false);
    if (displaySnapshot && rowId != null) {
      setPendingDisplay({ rowId, ...displaySnapshot });
    }
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    const delay = reduceMotion ? 0 : DASHBOARD_MOTION_DURATION;
    closeTimerRef.current = setTimeout(() => {
      closeTimerRef.current = null;
      setEditSessionId(null);
      setDraftRemindOnDate('');
      setDraftReminderTypes([]);
      setSettingsPanelOpen(false);
      setValidationErrors(EMPTY_REMINDER_VALIDATION);
      setPendingDisplay(null);
      if (refresh) notifyDashboardRefresh();
    }, delay);
  }, [editSessionId, reduceMotion]);

  const handleSelect = useCallback((row) => {
    if (editSessionId === row.id && editExpanded) return;
    setSelectedId((prev) => (prev === row.id ? null : row.id));
  }, [editSessionId, editExpanded]);

  const handleEdit = useCallback((row) => {
    if (!row.hasNextPayment) {
      setMissingDatesDialogRow(row);
      return;
    }
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    setSelectedId(null);
    setPendingDisplay(null);
    setEditSessionId(row.id);
    setEditExpanded(true);
    const enabled = isReminderEffectivelyEnabled(row.pref, { hasNextPayment: true });
    setDraftEnabled(enabled);
    setSettingsPanelOpen(enabled);
    setDraftRemindOnDate(row.pref?.remindOnDate || '');
    setDraftReminderTypes(resolveDraftReminderTypes(row.pref?.reminderTypes));
    setValidationErrors(EMPTY_REMINDER_VALIDATION);
  }, []);

  const handleDraftChange = useCallback((enabled) => {
    if (!editSessionId || !editExpanded) return;
    setDraftEnabled(enabled);
    setSettingsPanelOpen(enabled);
    if (enabled) {
      setDraftReminderTypes((prev) => resolveDraftReminderTypes(prev));
    } else {
      setValidationErrors(EMPTY_REMINDER_VALIDATION);
    }
  }, [editSessionId, editExpanded]);

  const handleRemindOnDateChange = useCallback((value) => {
    setDraftRemindOnDate(value);
    setValidationErrors((prev) => (prev.date ? { ...prev, date: '' } : prev));
  }, []);

  const handleReminderTypesChange = useCallback((value) => {
    const types = normalizeReminderTypes(value);
    setDraftReminderTypes(value);
    if (!types.length && draftEnabled) {
      setDraftEnabled(false);
      setSettingsPanelOpen(false);
    }
    setValidationErrors((prev) => (prev.type ? { ...prev, type: '' } : prev));
  }, [draftEnabled]);

  const handleCancel = useCallback(() => {
    if (saving) return;
    finishEditSession();
  }, [finishEditSession, saving]);

  const handleSave = useCallback(async (row) => {
    if (!row.hasNextPayment || saving) return;

    if (draftEnabled) {
      const date = draftRemindOnDate?.trim?.() || '';
      const types = normalizeReminderTypes(draftReminderTypes);
      const nextErrors = { date: '', type: '' };
      if (!date) {
        nextErrors.date = t('dashboard.remindersScreen.validationRemindDate');
      } else if (!isReminderDateAllowed(date)) {
        nextErrors.date = t('dashboard.remindersScreen.validationRemindDateFuture');
      }
      if (!types.length) {
        nextErrors.type = t('dashboard.remindersScreen.validationReminderType');
      }
      if (nextErrors.date || nextErrors.type) {
        setValidationErrors(nextErrors);
        return;
      }
    }

    setValidationErrors(EMPTY_REMINDER_VALIDATION);
    setSaving(true);
    const beforePref = row.pref;
    const nextRemindOnDate = draftEnabled ? draftRemindOnDate.trim() : null;
    const nextReminderTypes = draftEnabled ? normalizeReminderTypes(draftReminderTypes) : [];
    const nextEnabled = draftEnabled && row.hasNextPayment && nextReminderTypes.length > 0;
    const afterPref = {
      enabled: nextEnabled,
      leadDays: row.pref?.leadDays,
      remindOnDate: nextRemindOnDate,
      reminderTypes: nextReminderTypes,
    };
    try {
      await setReminderPref(row.reminderId, afterPref);
      const toastKind = resolveReminderSaveToastKind(beforePref, afterPref, {
        hasNextPayment: row.hasNextPayment,
      });
      if (toastKind) {
        emitDashboardToast(toastKind);
      }
      finishEditSession({
        refresh: true,
        displaySnapshot: {
          enabled: nextEnabled,
          remindOnDate: nextRemindOnDate,
          reminderTypes: nextReminderTypes,
        },
        rowId: row.id,
      });
    } finally {
      setSaving(false);
    }
  }, [
    draftEnabled,
    draftRemindOnDate,
    draftReminderTypes,
    finishEditSession,
    saving,
    t,
  ]);

  const handleMissingDatesConfirm = useCallback(() => {
    if (!missingDatesDialogRow) return;
    router.push(buildReminderExpenseEditRoute(missingDatesDialogRow));
    setMissingDatesDialogRow(null);
  }, [missingDatesDialogRow, router]);

  return (
    <SurfaceCard style={{ overflow: 'visible' }}>
      {title ? <InCardSectionHeader title={title} /> : null}

      {rows.length === 0 ? (
        <Text style={{ ...T.helper, textAlign: 'center', paddingVertical: 24, paddingHorizontal: 16 }}>
          {emptyLabel}
        </Text>
      ) : (
        <View style={{ gap: 8, width: '100%', alignSelf: 'stretch' }}>
          <RemindersColumnHeaders columns={columns} />
          {rows.map((row, index) => {
            const inSession = editSessionId === row.id;
            const selected = selectedId === row.id;
            const rowPendingDisplay = pendingDisplay?.rowId === row.id ? pendingDisplay : null;
            return (
              <RemindersTableRow
                key={row.id}
                row={row}
                columns={columns}
                index={index}
                selected={selected}
                inSession={inSession}
                editExpanded={editExpanded}
                draftEnabled={draftEnabled}
                settingsPanelOpen={settingsPanelOpen}
                draftRemindOnDate={draftRemindOnDate}
                draftReminderTypes={draftReminderTypes}
                validationErrors={inSession ? validationErrors : EMPTY_REMINDER_VALIDATION}
                saving={saving && inSession}
                pendingDisplay={rowPendingDisplay}
                iconSectionKey={iconSectionKey}
                iconScope={iconScope}
                onSelect={() => handleSelect(row)}
                onEdit={() => handleEdit(row)}
                onMissingDatesPress={() => setMissingDatesDialogRow(row)}
                onDraftChange={handleDraftChange}
                onRemindOnDateChange={handleRemindOnDateChange}
                onReminderTypesChange={handleReminderTypesChange}
                onSave={() => handleSave(row)}
                onCancel={handleCancel}
              />
            );
          })}
        </View>
      )}

      <ConfirmDialog
        visible={Boolean(missingDatesDialogRow)}
        title={t('dashboard.remindersScreen.needsDateDialogTitle')}
        message={t('dashboard.remindersScreen.needsDateDialogMessage')}
        confirmLabel={t('dashboard.remindersScreen.goToExpenses')}
        cancelLabel={t('common.cancel')}
        onConfirm={handleMissingDatesConfirm}
        onCancel={() => setMissingDatesDialogRow(null)}
      />
    </SurfaceCard>
  );
}
