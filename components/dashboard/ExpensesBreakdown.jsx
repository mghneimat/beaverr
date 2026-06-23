import { useState, useMemo } from 'react';
import { View, Pressable, ScrollView } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useRouter } from 'expo-router';
import { formatCurrency, toMonthly } from '../../lib/finance';
import { categoryMonthlyTotal, EDIT_SECTION_ROUTES } from '../../lib/householdBudget';
import { C, R, T, tabularNums } from '../../constants/onboarding-theme';
import ExpandableCategoryRow from './ExpandableCategoryRow';
import { subscriptionDisplayName } from '../../lib/subscriptionCatalog';

const FILTERS = ['all', 'subscriptions', 'insurance', 'housing', 'transport', 'other'];

const INSURANCE_CATEGORIES = new Set(['health', 'transport']);

function matchesFilter(category, filter, recurringKinds) {
  if (filter === 'all') return true;
  if (filter === 'subscriptions') return category === 'subscriptions';
  if (filter === 'insurance') return INSURANCE_CATEGORIES.has(category);
  if (filter === 'housing') return category === 'housing';
  if (filter === 'transport') return category === 'transport';
  if (filter === 'other') return category === 'other' || category === 'children' || category === 'pets';
  return true;
}

export default function ExpensesBreakdown({
  financials,
  alerts,
  currency,
  t,
}) {
  const router = useRouter();
  const [filter, setFilter] = useState('all');
  const [expandedCats, setExpandedCats] = useState({});

  const alertIds = useMemo(() => new Set(
    (alerts || []).filter((a) => a.status === 'active').map((a) => a.id),
  ), [alerts]);

  const filteredCategories = financials.byCategory.filter((cat) =>
    matchesFilter(cat.category, filter),
  );

  return (
    <View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingBottom: 16 }}
      >
        {FILTERS.map((key) => (
          <Pressable
            key={key}
            onPress={() => setFilter(key)}
            accessibilityRole="button"
            accessibilityState={{ selected: filter === key }}
            style={({ pressed }) => ({
              paddingVertical: 10,
              paddingHorizontal: 14,
              borderRadius: R.pill,
              borderWidth: filter === key ? 0 : 1.5,
              borderColor: filter === key ? C.chipSelectedBorder : C.border,
              backgroundColor: filter === key ? C.chipSelectedBg : pressed ? C.overlayHover : C.pillUnselectedBg,
              minHeight: 40,
              justifyContent: 'center',
            })}
          >
            <Text style={{
              fontSize: 13,
              fontWeight: filter === key ? '600' : '500',
              color: filter === key ? C.chipSelectedText : C.muted,
            }}>
              {t(`dashboard.expensesScreen.filters.${key}`)}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {filteredCategories.length === 0 ? (
        <Text style={{ ...T.helper, textAlign: 'center', paddingVertical: 24 }}>
          {t('dashboard.expensesScreen.empty')}
        </Text>
      ) : (
        filteredCategories.map((cat) => {
          const monthly = categoryMonthlyTotal(cat);
          const isExpanded = expandedCats[cat.category];
          const editRoute = EDIT_SECTION_ROUTES[cat.category] || EDIT_SECTION_ROUTES.other;

          return (
            <View
              key={cat.category}
              style={{
                marginBottom: 12,
                borderRadius: R.card,
                borderWidth: 1,
                borderColor: C.border,
                backgroundColor: C.surface,
                overflow: 'hidden',
              }}
            >
              <ExpandableCategoryRow
                label={cat.label}
                monthlyTotal={monthly}
                items={cat.items}
                currency={currency}
                expanded={isExpanded}
                onToggle={(next) => setExpandedCats((prev) => ({ ...prev, [cat.category]: next }))}
              />
              {isExpanded && cat.category === 'subscriptions' ? (
                <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
                  {(financials.sections?.subs || []).filter((s) => s.cost).map((sub, idx) => {
                    const label = subscriptionDisplayName(sub, t);
                    const monthlyAmount = toMonthly(parseFloat(sub.cost), sub.frequency || 'monthly');
                    const hasAlert = alertIds.has(`subscription_renewal-${idx}`);
                    return (
                      <View key={idx} style={{ paddingVertical: 8, borderTopWidth: 1, borderTopColor: C.divider }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
                          <Text style={{ flex: 1, fontSize: 14, fontWeight: '500', color: C.primary }}>{label}</Text>
                          <Text style={{ fontSize: 14, fontWeight: '600', color: C.primary, ...tabularNums }}>
                            {formatCurrency(monthlyAmount, currency)}
                          </Text>
                        </View>
                        {sub.renewalDate ? (
                          <Text style={{ ...T.caption, color: C.muted, marginTop: 4 }}>
                            {t('dashboard.expensesScreen.renewsOn', { date: sub.renewalDate })}
                          </Text>
                        ) : null}
                        <Text style={{ ...T.caption, color: C.muted, marginTop: 2 }}>
                          {t('dashboard.home.recurring.annual')}: {formatCurrency(monthlyAmount * 12, currency)}
                        </Text>
                        {hasAlert ? (
                          <Text style={{ ...T.caption, color: C.danger, marginTop: 4 }}>
                            {t('dashboard.expensesScreen.renewalSoon')}
                          </Text>
                        ) : null}
                      </View>
                    );
                  })}
                </View>
              ) : null}
              {isExpanded && cat.category === 'health' ? (
                <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
                  {Object.entries(financials.sections?.health || {}).map(([key, member]) => {
                    if (!member?.confirmed || member.coverage === 'employer' || !member.premium) return null;
                    const memberLabel = key === 'self'
                      ? t('dashboard.recurring.healthSelf')
                      : key === 'partner'
                        ? t('dashboard.recurring.healthPartner')
                        : t('dashboard.recurring.healthChild');
                    const freq = member.frequency || 'monthly';
                    const amount = freq === 'custom' && member.customFrequencyMonths
                      ? Number(member.premium) / Number(member.customFrequencyMonths)
                      : Number(member.premium);
                    const monthlyAmount = toMonthly(amount, freq === 'custom' ? 'monthly' : freq);
                    return (
                      <View key={key} style={{ paddingVertical: 8, borderTopWidth: 1, borderTopColor: C.divider }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                          <Text style={{ fontSize: 14, fontWeight: '500', color: C.primary }}>{memberLabel}</Text>
                          <Text style={{ fontSize: 14, fontWeight: '600', color: C.primary, ...tabularNums }}>
                            {formatCurrency(monthlyAmount, currency)}
                          </Text>
                        </View>
                        {member.endDate ? (
                          <Text style={{ ...T.caption, color: C.muted, marginTop: 4 }}>
                            {t('dashboard.expensesScreen.endsOn', { date: member.endDate })}
                          </Text>
                        ) : null}
                      </View>
                    );
                  })}
                </View>
              ) : null}
              <Pressable
                onPress={() => router.push(editRoute)}
                accessibilityRole="button"
                accessibilityLabel={t('dashboard.summaryScreen.edit')}
                style={({ pressed }) => ({
                  paddingVertical: 10,
                  paddingHorizontal: 16,
                  borderTopWidth: 1,
                  borderTopColor: C.divider,
                  alignItems: 'flex-end',
                  backgroundColor: pressed ? C.overlayHover : 'transparent',
                  minHeight: 44,
                  justifyContent: 'center',
                })}
              >
                <Text style={{ fontSize: 13, fontWeight: '600', color: C.accent }}>{t('dashboard.summaryScreen.edit')}</Text>
              </Pressable>
            </View>
          );
        })
      )}
    </View>
  );
}
