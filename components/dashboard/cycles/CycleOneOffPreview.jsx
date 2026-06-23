import { View, Pressable } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { C, R, T, tabularNums } from '../../../constants/onboarding-theme';
import { formatCurrency } from '../../../lib/finance';

function PreviewRow({ row, currency, onRemove, removeA11y }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
      <Text style={{ flex: 1, fontSize: 12, fontWeight: '500', color: C.primary }} numberOfLines={1}>
        {row.label}
      </Text>
      <Pressable onPress={() => onRemove(row)} accessibilityRole="button" accessibilityLabel={removeA11y} hitSlop={8}>
        <Text style={{ fontSize: 12, fontWeight: '600', color: C.muted }}>×</Text>
      </Pressable>
      <Text style={{ fontSize: 12, fontWeight: '700', color: C.primary, ...tabularNums }}>
        {formatCurrency(row.amount, currency)}
      </Text>
    </View>
  );
}

export default function CycleOneOffPreview({
  incomeRows = [],
  expenseRows = [],
  currency,
  onRemoveRow,
  removeA11yFor,
  dueRows = [],
  onLogDueDay,
  logDueLabel,
}) {
  if (incomeRows.length === 0 && expenseRows.length === 0) return null;

  return (
    <View
      style={{
        marginTop: 12,
        padding: 12,
        borderRadius: R.card,
        borderWidth: 1,
        borderColor: C.border,
        backgroundColor: C.surfaceTint,
      }}
    >
      {incomeRows.length > 0 ? (
        <View style={{ marginBottom: expenseRows.length > 0 ? 8 : 0 }}>
          {incomeRows.slice(0, 3).map((row) => (
            <PreviewRow
              key={row.id}
              row={row}
              currency={currency}
              onRemove={onRemoveRow}
              removeA11y={removeA11yFor(row.label)}
            />
          ))}
        </View>
      ) : null}
      {expenseRows.length > 0 ? (
        <View>
          {expenseRows.slice(0, 3).map((row) => (
            <PreviewRow
              key={row.id}
              row={row}
              currency={currency}
              onRemove={onRemoveRow}
              removeA11y={removeA11yFor(row.label)}
            />
          ))}
          {dueRows.length > 0 && onLogDueDay ? (
            <Pressable
              onPress={() => onLogDueDay(dueRows[0])}
              accessibilityRole="button"
              style={{ marginTop: 6 }}
            >
              <Text style={{ fontSize: 11, fontWeight: '600', color: C.primary }}>{logDueLabel}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
      {(incomeRows.length + expenseRows.length > 3) ? (
        <Text style={{ ...T.caption, color: C.muted, marginTop: 6, fontSize: 10 }}>
          +{incomeRows.length + expenseRows.length - 3}
        </Text>
      ) : null}
    </View>
  );
}
