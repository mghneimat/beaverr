import { View, Pressable, Platform } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { C, R, T, tabularNums } from '../../constants/onboarding-theme';

const EMPTY_VALUE = '—';

function CardFieldStack({ label, children, labelColor }) {
  return (
    <View style={{ gap: 2, width: '100%' }}>
      <Text style={{ fontSize: 12, fontWeight: '600', color: labelColor }} numberOfLines={2}>
        {label}
      </Text>
      <View style={{ minWidth: 0 }}>
        {children}
      </View>
    </View>
  );
}

/**
 * Compact reminder row for narrow viewports — grouped payment + reminder fields.
 */
export default function ReminderCardRow({
  columns,
  cells,
  index,
  selected,
  onPress,
  onEdit,
  editLabel,
  editA11yLabel,
  accessibilityLabel,
  leading,
  reminderStatus,
  reminderTypeContent,
  formattedReminderDate,
  displayPref,
  hasNextPayment,
}) {
  const nextPaymentCol = columns.find((c) => c.key === 'nextPayment');
  const endDateCol = columns.find((c) => c.key === 'endDate');
  const reminderDateCol = columns.find((c) => c.key === 'reminderDate');
  const reminderTypeCol = columns.find((c) => c.key === 'reminderType');

  const striped = index % 2 === 1;
  let bg = striped ? C.breakdownStripeBg : C.surface;
  if (selected) bg = C.pillSelectedBg;

  const labelColor = selected ? C.pillSelectedText : C.text;
  const metaColor = selected ? 'rgba(255,255,255,0.78)' : C.muted;
  const valueColor = selected ? C.pillSelectedText : C.text;

  const reminderEnabled = displayPref?.enabled === true;
  const showReminderFields = reminderEnabled && hasNextPayment;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected }}
      style={({ pressed, hovered }) => ({
        paddingVertical: 14,
        paddingHorizontal: 14,
        borderRadius: R.card,
        backgroundColor: pressed
          ? C.breakdownRowHover
          : hovered && Platform.OS === 'web'
            ? C.breakdownRowHover
            : bg,
        borderWidth: 1,
        borderColor: selected ? C.pillSelectedBg : C.tableRowBorder,
        width: '100%',
        minHeight: 44,
        opacity: pressed ? 0.92 : 1,
        ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
      })}
    >
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 12,
      }}>
        {leading}
        <Text style={{
          flex: 1,
          fontSize: 15,
          fontWeight: '600',
          color: labelColor,
          minWidth: 0,
        }}
        numberOfLines={2}
        >
          {cells.name}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {reminderStatus}
          <Pressable
            onPress={(e) => {
              e?.stopPropagation?.();
              onEdit?.();
            }}
            accessibilityRole="button"
            accessibilityLabel={editA11yLabel}
            hitSlop={8}
            style={({ pressed, hovered }) => ({
              paddingVertical: 4,
              paddingHorizontal: 10,
              borderRadius: R.pill,
              backgroundColor: pressed
                ? C.overlayPressed
                : hovered
                  ? C.overlayHover
                  : selected
                    ? 'rgba(255,255,255,0.15)'
                    : C.bg,
              ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
            })}
          >
            <Text style={{ ...T.caption, fontWeight: '600', color: selected ? C.pillSelectedText : C.primary }}>
              {editLabel}
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={{ gap: 10 }}>
        {nextPaymentCol ? (
          <CardFieldStack label={nextPaymentCol.label} labelColor={metaColor}>
            <Text style={{ fontSize: 14, fontWeight: '500', color: valueColor, ...tabularNums }}>
              {cells.nextPayment || EMPTY_VALUE}
            </Text>
          </CardFieldStack>
        ) : null}
        {endDateCol ? (
          <CardFieldStack label={endDateCol.label} labelColor={metaColor}>
            <Text style={{ fontSize: 14, fontWeight: '500', color: metaColor, ...tabularNums }}>
              {cells.endDate || EMPTY_VALUE}
            </Text>
          </CardFieldStack>
        ) : null}
        {reminderDateCol ? (
          <CardFieldStack label={reminderDateCol.label} labelColor={metaColor}>
            <Text style={{ fontSize: 14, fontWeight: '500', color: valueColor, ...tabularNums }}>
              {showReminderFields ? (formattedReminderDate || EMPTY_VALUE) : EMPTY_VALUE}
            </Text>
          </CardFieldStack>
        ) : null}
        {reminderTypeCol ? (
          <CardFieldStack label={reminderTypeCol.label} labelColor={metaColor}>
            {showReminderFields ? reminderTypeContent : (
              <Text style={{ fontSize: 14, fontWeight: '500', color: metaColor }}>
                {EMPTY_VALUE}
              </Text>
            )}
          </CardFieldStack>
        ) : null}
      </View>
    </Pressable>
  );
}

/** Stacked edit summary for card mode — name + key fields before settings panel. */
export function ReminderCardEditSummary({
  columns,
  cells,
  leading,
  reminderStatus,
  colors,
}) {
  const nextPaymentCol = columns.find((c) => c.key === 'nextPayment');

  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 4,
    }}>
      {leading}
      <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
        <Text style={{ fontSize: 15, fontWeight: '600', color: colors.label }} numberOfLines={2}>
          {cells.name}
        </Text>
        {nextPaymentCol ? (
          <Text style={{ fontSize: 13, color: colors.meta, ...tabularNums }}>
            {nextPaymentCol.label}: {cells.nextPayment}
          </Text>
        ) : null}
      </View>
      {reminderStatus}
    </View>
  );
}
