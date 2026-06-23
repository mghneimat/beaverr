import { View, Pressable } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { useI18n } from '../../lib/i18n';
import { formatCurrency } from '../../lib/finance';
import { buildLedgerCascade } from '../../lib/ledgerCascade';
import { navigateFromDashboard } from '../../lib/screenTransition';
import { C, R, T, tabularNums } from '../../constants/onboarding-theme';

function CascadeRow({
  label,
  value,
  amountValue,
  currency,
  onPress,
  accessibilityHint,
  emphasis = false,
  deficit = false,
  warning = false,
  subLabel,
  indent = false,
  isLast = false,
}) {
  const valueColor = deficit ? C.danger : emphasis ? C.primary : C.primary;
  const resolvedValueLabel = typeof amountValue === 'number'
    ? formatCurrency(amountValue, currency)
    : value;
  const valueStyle = {
    fontSize: emphasis ? 17 : 15,
    fontWeight: '700',
    color: valueColor,
    ...tabularNums,
    flexShrink: 0,
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityLabel={`${label}, ${resolvedValueLabel}`}
      accessibilityHint={accessibilityHint}
      style={({ pressed, hovered }) => ({
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 12,
        paddingVertical: 14,
        paddingHorizontal: indent ? 12 : 4,
        marginHorizontal: indent ? 4 : 0,
        borderRadius: R.input,
        backgroundColor: pressed && onPress
          ? C.tableRowHover
          : hovered && onPress
            ? C.tableRowHover
            : 'transparent',
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: C.tableRowBorder,
        opacity: pressed && onPress ? 0.85 : 1,
      })}
    >
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          style={{
            fontSize: emphasis ? 15 : 14,
            fontWeight: emphasis ? '600' : '500',
            color: warning ? C.heroExpenseBadge : C.text,
          }}
          numberOfLines={2}
        >
          {label}
        </Text>
        {subLabel ? (
          <Text style={{ ...T.caption, color: C.muted, marginTop: 4 }} numberOfLines={3}>
            {subLabel}
          </Text>
        ) : null}
      </View>
      {typeof amountValue === 'number' ? (
        <Text style={valueStyle} numberOfLines={1}>
          {formatCurrency(amountValue, currency)}
        </Text>
      ) : (
        <Text style={valueStyle} numberOfLines={1}>
          {value}
        </Text>
      )}
    </Pressable>
  );
}

export default function HouseholdLedgerStrip({ financials, currency, insights }) {
  const { t } = useI18n();
  const router = useRouter();
  const cascade = useMemo(
    () => buildLedgerCascade(financials, insights || {}),
    [financials, insights],
  );

  const go = (route) => navigateFromDashboard(router, route);

  const rows = [
    {
      key: 'income',
      label: t('dashboard.ledgerCascade.income'),
      value: formatCurrency(cascade.income, currency),
      amountValue: cascade.income,
      onPress: () => go('income'),
      hint: t('dashboard.ledgerCascade.openIncome'),
    },
    {
      key: 'committed',
      label: t('dashboard.ledgerCascade.committed'),
      value: formatCurrency(cascade.committed, currency),
      amountValue: cascade.committed,
      onPress: () => go('costs'),
      hint: t('dashboard.ledgerCascade.openExpenses'),
      subLabel: t('dashboard.ledgerCascade.committedHint'),
      indent: true,
    },
    {
      key: 'available',
      label: t('dashboard.ledgerCascade.available'),
      value: formatCurrency(cascade.available, currency),
      amountValue: cascade.available,
      onPress: () => go('budget'),
      hint: t('dashboard.ledgerCascade.openBudget'),
      emphasis: true,
      deficit: cascade.isOvercommitted,
    },
    ...(cascade.showCostReduction ? [{
      key: 'costReduction',
      label: t('dashboard.ledgerCascade.costsReduced'),
      value: formatCurrency(cascade.costReduction, currency),
      amountValue: cascade.costReduction,
      onPress: () => go('goals'),
      hint: t('dashboard.ledgerCascade.openGoals'),
      subLabel: cascade.costReduction > 0
        ? t('dashboard.ledgerCascade.costsReducedSince')
        : t('dashboard.ledgerCascade.costsReducedNone'),
      indent: true,
    }] : []),
    ...(cascade.showSaved ? [{
      key: 'saved',
      label: t('dashboard.ledgerCascade.saved'),
      value: formatCurrency(cascade.saved, currency),
      amountValue: cascade.saved,
      onPress: () => go('goals'),
      hint: t('dashboard.ledgerCascade.openGoals'),
      warning: cascade.savedIsInformational,
      subLabel: cascade.savedIsInformational
        ? t('dashboard.ledgerCascade.savedIncluded')
        : t('dashboard.ledgerCascade.savedDeducted'),
      indent: true,
    }] : []),
    {
      key: 'toSpend',
      label: t('dashboard.ledgerCascade.toSpend'),
      value: formatCurrency(cascade.toSpend, currency),
      amountValue: cascade.toSpend,
      onPress: () => go('budget'),
      hint: t('dashboard.ledgerCascade.openBudget'),
      subLabel: cascade.savedIsInformational
        ? t('dashboard.ledgerCascade.toSpendIncludedGoal')
        : undefined,
      indent: true,
    },
    ...(cascade.showUnallocated ? [{
      key: 'unallocated',
      label: t('dashboard.ledgerCascade.unallocated'),
      value: formatCurrency(cascade.unallocated, currency),
      amountValue: cascade.unallocated,
      onPress: () => go('budget'),
      hint: t('dashboard.ledgerCascade.openBudget'),
      emphasis: true,
    }] : []),
  ];

  return (
    <View
      accessibilityRole="summary"
      accessibilityLabel={t('dashboard.ledgerCascade.a11y')}
    >
      {rows.map((row, idx) => (
        <CascadeRow
          key={row.key}
          label={row.label}
          value={row.value}
          amountValue={row.amountValue}
          currency={currency}
          onPress={row.onPress}
          accessibilityHint={row.hint}
          emphasis={row.emphasis}
          deficit={row.deficit}
          warning={row.warning}
          subLabel={row.subLabel}
          indent={row.indent}
          isLast={idx === rows.length - 1}
        />
      ))}
    </View>
  );
}
