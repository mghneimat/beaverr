import { useState } from 'react';
import { View, Pressable } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useRouter } from 'expo-router';
import { toMonthly, formatCurrency } from '../../lib/finance';
import { categoryMonthlyTotal, EDIT_SECTION_ROUTES } from '../../lib/householdBudget';
import { C, R, T, tabularNums } from '../../constants/onboarding-theme';
import ExpandCollapseIcon from '../onboarding/ExpandCollapseIcon';
const SECTION_INSIGHT_KEYS = {
  income: 'income',
  housing: 'housing',
  transport: 'transport',
  health: 'health',
  children: 'children',
  pets: 'pets',
  subscriptions: 'subscriptions',
  other: 'other',
  debts: 'debts',
  budget: 'budget',
  goals: 'goals',
};

function AmountCell({ amount, currency, color = C.primary, size = 15 }) {
  return (
    <Text
      style={{
        fontSize: size,
        fontWeight: '600',
        color,
        textAlign: 'right',
        minWidth: 100,
        ...tabularNums,
      }}
    >
      {formatCurrency(amount, currency)}
    </Text>
  );
}

function SectionBlock({
  title,
  monthlyTotal,
  items,
  currency,
  editLabel,
  editRoute,
  insight,
  insightLabel,
  expanded,
  onToggle,
}) {
  const router = useRouter();

  return (
    <View style={{ borderTopWidth: 1, borderTopColor: C.divider }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', minHeight: 44 }}>
        <Pressable
          onPress={onToggle}
          accessibilityRole="button"
          accessibilityState={{ expanded }}
          style={({ pressed, hovered }) => ({
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 12,
            paddingHorizontal: 16,
            backgroundColor: pressed ? C.overlayHover : hovered ? C.overlayHover : 'transparent',
          })}
        >
          {({ pressed, hovered }) => (
            <>
              <Text style={{ flex: 1, fontSize: 15, fontWeight: '600', color: C.primary }}>{title}</Text>
              <AmountCell amount={monthlyTotal} currency={currency} />
              <ExpandCollapseIcon
                expanded={expanded}
                color={C.muted}
                compact
                size={16}
                style={{ marginLeft: 8 }}
                hovered={hovered}
                pressed={pressed}
              />
            </>
          )}
        </Pressable>
        {editRoute ? (
          <Pressable
            onPress={() => router.push(editRoute)}
            accessibilityRole="button"
            accessibilityLabel={editLabel}
            style={({ pressed }) => ({
              paddingHorizontal: 12,
              paddingVertical: 12,
              minHeight: 44,
              justifyContent: 'center',
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text style={{ fontSize: 13, fontWeight: '600', color: C.accent }}>{editLabel}</Text>
          </Pressable>
        ) : null}
      </View>
      {expanded ? (
        <View style={{ paddingHorizontal: 16, paddingBottom: 12, backgroundColor: C.bg }}>
          {items.map((item, idx) => (
            <View
              key={`${item.label}-${idx}`}
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                paddingVertical: 6,
                gap: 12,
              }}
            >
              <Text style={{ flex: 1, fontSize: 13, color: C.muted }} numberOfLines={2}>{item.label}</Text>
              <Text style={{ fontSize: 13, color: C.text, ...tabularNums }}>
                {formatCurrency(toMonthly(item.amount, item.frequency), currency)}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

export default function BudgetSummaryTable({
  financials,
  insights,
  currency,
  t,
  getSectionInsight,
}) {
  const [expanded, setExpanded] = useState({});

  const toggle = (key) => setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  const inc = financials.income;
  const userMonthly = toMonthly(inc?.amount || 0, inc?.frequency || 'monthly');
  const partnerMonthly = toMonthly(inc?.partnerAmount || 0, inc?.partnerFrequency || 'monthly');
  const incomeItems = [];
  if (userMonthly > 0) incomeItems.push({ label: t('onboarding.budget.budgetSplit.incomeUser'), amount: userMonthly, frequency: 'monthly' });
  if (partnerMonthly > 0) incomeItems.push({ label: t('onboarding.budget.budgetSplit.incomePartner'), amount: partnerMonthly, frequency: 'monthly' });
  (inc?.otherIncomeRows || []).forEach((r, idx) => {
    if (r.amount) {
      incomeItems.push({
        label: r.label || `${t('onboarding.budget.budgetSplit.incomeOther')} ${idx + 1}`,
        amount: r.amount,
        frequency: r.frequency || 'monthly',
      });
    }
  });

  const debtItems = (financials.debts || []).map((debt, idx) => {
    const typeKey = `onboarding.debts.debtDetails.${debt.type || 'other'}`;
    const translated = t(typeKey);
    const label = translated !== typeKey ? translated : t('dashboard.recurring.debtPayment');
    return {
      label: `${label} ${idx + 1}`,
      amount: parseFloat(debt.minPayment || 0),
      frequency: 'monthly',
    };
  }).filter((d) => d.amount > 0);

  return (
    <View style={{
      borderRadius: R.card,
      borderWidth: 1,
      borderColor: C.border,
      backgroundColor: C.surface,
      overflow: 'hidden',
    }}>
      <View style={{
        paddingVertical: 14,
        paddingHorizontal: 16,
        backgroundColor: C.bg,
        borderBottomWidth: 1,
        borderBottomColor: C.divider,
      }}>
        <Text style={{ fontSize: 13, fontWeight: '600', color: C.muted }}>
          {t('dashboard.summaryScreen.tableNote', { currency })}
        </Text>
      </View>

      <SectionBlock
        title={t('onboarding.budget.budgetSplit.income')}
        monthlyTotal={financials.totalIncome}
        items={incomeItems}
        currency={currency}
        editLabel={t('dashboard.summaryScreen.edit')}
        editRoute={EDIT_SECTION_ROUTES.income}
        insight={getSectionInsight('income', insights, t)}
        insightLabel={t('dashboard.insights.slotLabel')}
        expanded={expanded.income}
        onToggle={() => toggle('income')}
      />

      {financials.byCategory.map((cat) => (
        <SectionBlock
          key={cat.category}
          title={cat.label}
          monthlyTotal={-categoryMonthlyTotal(cat)}
          items={cat.items}
          currency={currency}
          editLabel={t('dashboard.summaryScreen.edit')}
          editRoute={EDIT_SECTION_ROUTES[cat.category] || EDIT_SECTION_ROUTES.other}
          insight={getSectionInsight(SECTION_INSIGHT_KEYS[cat.category] || cat.category, insights, t)}
          insightLabel={t('dashboard.insights.slotLabel')}
          expanded={expanded[cat.category]}
          onToggle={() => toggle(cat.category)}
        />
      ))}

      {debtItems.length > 0 ? (
        <SectionBlock
          title={t('onboarding.budget.budgetSplit.debtPayments')}
          monthlyTotal={-financials.debtPayments}
          items={debtItems}
          currency={currency}
          editLabel={t('dashboard.summaryScreen.edit')}
          editRoute={EDIT_SECTION_ROUTES.debts}
          insight={getSectionInsight('debts', insights, t)}
          insightLabel={t('dashboard.insights.slotLabel')}
          expanded={expanded.debts}
          onToggle={() => toggle('debts')}
        />
      ) : null}

      {(financials.financialRisks || []).length > 0 ? (
        <View style={{ borderTopWidth: 1, borderTopColor: C.divider }}>
          <View style={{
            paddingVertical: 14,
            paddingHorizontal: 16,
            backgroundColor: C.warningBg || 'rgba(200,140,40,0.08)',
            borderBottomWidth: 1,
            borderBottomColor: C.divider,
          }}>
            <Text style={{ fontSize: 15, fontWeight: '600', color: C.primary }}>
              {t('dashboard.summaryScreen.risksTitle')}
            </Text>
            <Text style={{ ...T.caption, color: C.muted, marginTop: 4 }}>
              {t('dashboard.summaryScreen.risksNote')}
            </Text>
          </View>
          <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
            {financials.financialRisks.map((risk) => (
              <View
                key={risk.id}
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  paddingVertical: 8,
                  gap: 12,
                }}
              >
                <Text style={{ flex: 1, fontSize: 13, color: C.text }} numberOfLines={2}>
                  {risk.label}
                </Text>
                <Text style={{ fontSize: 13, fontWeight: '600', color: C.warning || '#B45309', ...tabularNums }}>
                  {formatCurrency(risk.exposureAmount, currency)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderTopWidth: 1,
        borderTopColor: C.divider,
        backgroundColor: C.infoWashBg,
      }}>
        <Text style={{ fontSize: 15, fontWeight: '700', color: C.primary }}>
          {t('onboarding.budget.budgetSplit.budgetLabel')}
        </Text>
        <AmountCell amount={financials.monthlyFlexible} currency={currency} color={C.positive} />
      </View>
    </View>
  );
}
