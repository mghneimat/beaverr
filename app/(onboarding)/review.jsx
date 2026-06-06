import { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, Pressable, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { useI18n } from '../../lib/i18n';
import { getData, setData } from '../../lib/storage';
import { toMonthly, formatCurrency } from '../../lib/finance';
import QuestionScreen from '../../components/onboarding/QuestionScreen';
import PlaceholderIllustration from '../../components/onboarding/PlaceholderIllustration';
import { C, S, T, R } from '../../constants/onboarding-theme';

/** Maps children-costs field keys to i18n keys under onboarding.childrenCosts.q9.field */
const FIELD_I18N_MAP = {
  daycare: 'nursery',
  nanny: 'nanny',
  nappies: 'diapers',
  babySupplies: 'formula',
  kindergarten: 'kindergarten',
  afterHours: 'afterSchool',
  extracurricular: 'extracurricular',
  schoolFees: 'schoolSupplies',
  schoolSupplies: 'schoolSupplies',
  afterSchool: 'afterSchool',
  tutoring: 'extracurricular',
  drivingLessons: 'transport',
  uniFees: 'savings',
};

/** Collapsible review section */
function ReviewSection({ icon, title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  const anim = useRef(new Animated.Value(defaultOpen ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: open ? 1 : 0,
      duration: 280,
      easing: require('react-native').Easing.bezier(0.16, 1, 0.3, 1),
      useNativeDriver: false,
    }).start();
  }, [open]);

  return (
    <View style={{ marginBottom: 12, backgroundColor: C.surface, borderRadius: R.card, borderWidth: 1, borderColor: C.border, overflow: 'hidden' }}>
      <Pressable
        onPress={() => setOpen(!open)}
        style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}
      >
        <Text style={{ fontSize: 18, marginRight: 10 }}>{icon}</Text>
        <Text style={{ flex: 1, fontSize: 15, fontWeight: '600', color: C.primary }}>{title}</Text>
        <Text style={{ fontSize: 14, color: C.muted }}>{open ? '▲' : '▼'}</Text>
      </Pressable>
      <Animated.View style={{
        maxHeight: anim.interpolate({ inputRange: [0, 1], outputRange: [0, 1000] }),
        opacity: anim,
        overflow: 'hidden',
      }}>
        <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
          {children}
        </View>
      </Animated.View>
    </View>
  );
}

/** A single data row */
function DataRow({ label, value }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
      <Text style={{ ...T.caption, color: C.muted, flex: 1 }}>{label}</Text>
      <Text style={{ ...T.caption, color: C.text, fontWeight: '500', textAlign: 'right' }}>{value || '—'}</Text>
    </View>
  );
}

export default function ReviewScreen() {
  const { t } = useI18n();
  const router = useRouter();

  const handleBack = () => {
    router.replace('/(onboarding)/budget');
  };

  const [allData, setAllData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const keys = [
        'pocketos_household', 'pocketos_location', 'pocketos_occupation',
        'pocketos_income', 'pocketos_costs', 'pocketos_transport',
        'pocketos_health', 'pocketos_children_costs', 'pocketos_pets',
        'pocketos_subscriptions', 'pocketos_other_costs', 'pocketos_debts',
        'pocketos_budget',
      ];
      const data = {};
      for (const key of keys) {
        data[key] = await getData(key);
      }
      setAllData(data);
      setLoading(false);
    })();
  }, []);

  const handleComplete = async () => {
    await setData('pocketos_onboarding', {
      completed: true,
      currentStep: 'review',
      percentComplete: 100,
    });

    router.replace('/(app)/dashboard');
  };

  const handleLater = async () => {
    router.replace('/(app)/dashboard');
  };

  const h = allData['pocketos_household'];
  const loc = allData['pocketos_location'];
  const occ = allData['pocketos_occupation'];
  const inc = allData['pocketos_income'];
  const costs = allData['pocketos_costs'] || [];
  const transport = allData['pocketos_transport'];
  const health = allData['pocketos_health'];
  const childrenCosts = allData['pocketos_children_costs'];
  const pets = allData['pocketos_pets'] || [];
  const subs = allData['pocketos_subscriptions'] || [];
  const otherCosts = allData['pocketos_other_costs'] || [];
  const debts = allData['pocketos_debts'] || [];
  const budget = allData['pocketos_budget'];

  const userMonthly = toMonthly(inc?.user?.amount || 0, inc?.user?.frequency || 'monthly');
  const partnerMonthly = toMonthly(inc?.partner?.amount || 0, inc?.partner?.frequency || 'monthly');
  const otherMonthly = (inc?.otherSources || []).reduce((sum, s) => sum + toMonthly(s.amount || 0, s.frequency || 'monthly'), 0);
  const totalIncome = userMonthly + partnerMonthly + otherMonthly;

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 15, color: C.muted }}>{t('common.loading')}</Text>
      </View>
    );
  }

  return (
    <QuestionScreen
      chapter={t('onboarding.review.chapter')}
      title={t('onboarding.review.q15.title')}
      helper={t('onboarding.review.q15.helper')}
      illustration={<PlaceholderIllustration />}
      onContinue={handleComplete}
      onBack={handleBack}
      continueDisabled={false}
    >
      <View>
        {/* Household */}
        <ReviewSection icon="👫" title={t('onboarding.review.q15.sections.household')}>
          <DataRow label={t('onboarding.review.q15.labels.type')} value={h?.type ? t(`onboarding.household.type.${h.type}`) : '—'} />
          <DataRow label={t('onboarding.review.q15.labels.partner')} value={h?.partnerName || '—'} />
          <DataRow label={t('onboarding.review.q15.labels.children')} value={h?.children?.length ? String(h.children.length) : t('common.no')} />
        </ReviewSection>

        {/* Location & Occupation */}
        <ReviewSection icon="📍" title={t('onboarding.review.q15.sections.location')}>
          <DataRow label={t('onboarding.review.q15.labels.country')} value={loc?.country || '—'} />
          <DataRow label={t('onboarding.review.q15.labels.city')} value={loc?.city || '—'} />
          <DataRow label={t('onboarding.review.q15.labels.currency')} value={loc?.currency || '—'} />
          <DataRow label={t('onboarding.review.q15.labels.occupation')} value={occ?.user ? t(`onboarding.occupation.${occ.user}`) : '—'} />
          {occ?.partner && <DataRow label={t('onboarding.review.q15.labels.partnerOccupation')} value={t(`onboarding.occupation.${occ.partner}`)} />}
        </ReviewSection>

        {/* Income */}
        <ReviewSection icon="💰" title={t('onboarding.review.q15.sections.income')}>
          {inc?.user && <DataRow label={t('onboarding.review.q15.labels.yourIncome')} value={formatCurrency(userMonthly, 'CZK') + '/mo'} />}
          {inc?.partner && <DataRow label={t('onboarding.review.q15.labels.partnerIncome')} value={formatCurrency(partnerMonthly, 'CZK') + '/mo'} />}
          {inc?.otherSources?.map((s, i) => (
            <DataRow key={i} label={s.label || `${t('onboarding.review.q15.labels.otherIncome')} ${i + 1}`} value={formatCurrency(toMonthly(s.amount, s.frequency), 'CZK') + '/mo'} />
          ))}
          <DataRow label={t('onboarding.review.q15.labels.totalIncome')} value={formatCurrency(totalIncome, 'CZK') + '/mo'} />
          {inc?.savingsBalance > 0 && <DataRow label={t('onboarding.review.q15.labels.savingsBalance')} value={formatCurrency(inc.savingsBalance, 'CZK')} />}
          {inc?.savingsTarget > 0 && <DataRow label={t('onboarding.review.q15.labels.savingsTarget')} value={formatCurrency(inc.savingsTarget, 'CZK') + '/mo'} />}
          {inc?.goal && <DataRow label={t('onboarding.review.q15.labels.goal')} value={`${formatCurrency(inc.goal.amount, 'CZK')} ${t('onboarding.review.q15.labels.by')} ${inc.goal.targetDate || '—'}`} />}
        </ReviewSection>

        {/* Transport */}
        <ReviewSection icon="🚗" title={t('onboarding.review.q15.sections.transport')}>
          {transport?.hasVehicle ? (
            <>
              <DataRow label={t('onboarding.review.q15.labels.fuel')} value={transport.fuelCost ? formatCurrency(transport.fuelCost, 'CZK') + '/mo' : '—'} />
              {transport.hasInsurance && <DataRow label={t('onboarding.review.q15.labels.insurance')} value={transport.insurancePremium ? formatCurrency(transport.insurancePremium, 'CZK') + `/${transport.insuranceFrequency}` : '—'} />}
              {transport.hasParking && <DataRow label={t('onboarding.review.q15.labels.parking')} value={transport.parkingAmount ? formatCurrency(transport.parkingAmount, 'CZK') + `/${transport.parkingFrequency}` : '—'} />}
            </>
          ) : (
            <Text style={{ ...T.caption, color: C.muted }}>{t('onboarding.review.q15.labels.noVehicle')}</Text>
          )}
          {transport?.hasPublicTransport && (
            <DataRow label={t('onboarding.review.q15.labels.publicTransport')} value={transport.ptAmount ? formatCurrency(transport.ptAmount, 'CZK') + `/${transport.ptFrequency}` : '—'} />
          )}
        </ReviewSection>

        {/* Health */}
        <ReviewSection icon="🏥" title={t('onboarding.review.q15.sections.health')}>
          {health && typeof health === 'object' ? (
            Object.entries(health).map(([key, val]) => {
              let label = key;
              if (key === 'user') {
                label = t('onboarding.health.you');
              } else if (key === 'partner') {
                label = h?.partnerName || t('onboarding.review.q15.labels.partner');
              } else if (key.startsWith('child_')) {
                const childIdx = parseInt(key.replace('child_', ''), 10);
                const child = h?.children?.[childIdx];
                label = child?.displayName || `${t('onboarding.health.child')} ${childIdx + 1}`;
              }
              return (
                <DataRow key={key} label={label} value={val && val.confirmed ? (val.coverage === 'employer' ? t('onboarding.review.q15.labels.covered') : val.premium ? formatCurrency(val.premium, 'CZK') + `/${val.frequency}` : t('onboarding.review.q15.labels.private')) : t('onboarding.review.q15.labels.notConfirmed')} />
              );
            })
          ) : (
            <Text style={{ ...T.caption, color: C.muted }}>{t('onboarding.review.q15.labels.none')}</Text>
          )}
        </ReviewSection>

        {/* Children's Costs */}
        {h?.children?.length > 0 && (
          <ReviewSection icon="👶" title={t('onboarding.review.q15.sections.childrenCosts')}>
            {childrenCosts ? (
              Object.entries(childrenCosts).map(([key, fields]) => {
                const childIdx = parseInt(key.replace('child_', ''), 10);
                const child = h?.children?.[childIdx];
                const childLabel = child?.displayName || `Child ${childIdx + 1}`;
                return (
                  <View key={key} style={{ marginBottom: 8 }}>
                    <Text style={{ ...T.fieldLabel, color: C.primary, marginBottom: 4 }}>{childLabel}</Text>
                    {fields && typeof fields === 'object' && !Array.isArray(fields)
                      ? Object.entries(fields).filter(([_, v]) => v && v.amount).map(([field, val]) => {
                          const isOther = field.startsWith('other_');
                          const i18nField = FIELD_I18N_MAP[field] || field;
                          const label = isOther
                            ? t('onboarding.childrenCosts.q9.field.other')
                            : t(`onboarding.childrenCosts.q9.field.${i18nField}`);
                          return (
                            <DataRow key={field} label={label} value={formatCurrency(val.amount, 'CZK') + `/${val.frequency}`} />
                          );
                        })
                      : null}
                  </View>
                );
              })
            ) : (
              <Text style={{ ...T.caption, color: C.muted }}>{t('onboarding.review.q15.labels.none')}</Text>
            )}
          </ReviewSection>
        )}

        {/* Pets */}
        {pets.length > 0 && (
          <ReviewSection icon="🐾" title={t('onboarding.review.q15.sections.pets')}>
            {pets.map((pet, i) => (
              <View key={i} style={{ marginBottom: 8 }}>
                <Text style={{ ...T.fieldLabel, color: C.primary, marginBottom: 4 }}>
                  {pet.name || `${t('onboarding.pets.q10a.petLabel')} ${i + 1}`} ({pet.type})
                </Text>
                {pet.foodAmount ? <DataRow label={t('onboarding.review.q15.labels.food')} value={formatCurrency(pet.foodAmount, 'CZK') + `/${pet.foodFrequency}`} /> : null}
                {pet.vetAmount ? <DataRow label={t('onboarding.review.q15.labels.vet')} value={formatCurrency(pet.vetAmount, 'CZK') + `/${pet.vetFrequency}`} /> : null}
              </View>
            ))}
          </ReviewSection>
        )}

        {/* Subscriptions */}
        {subs.length > 0 && (
          <ReviewSection icon="📺" title={t('onboarding.review.q15.sections.subscriptions')}>
            {subs.map((sub, i) => (
              <DataRow key={i} label={t(`onboarding.subscriptions.q11.services.${sub.name}`)} value={sub.cost ? formatCurrency(sub.cost, 'CZK') + `/${sub.frequency}` : '—'} />
            ))}
          </ReviewSection>
        )}

        {/* Other Costs */}
        {otherCosts.length > 0 && (
          <ReviewSection icon="📋" title={t('onboarding.review.q15.sections.otherCosts')}>
            {otherCosts.map((c, i) => (
              <DataRow key={i} label={t(`onboarding.otherCosts.q12.costs.${c.name}`)} value={c.amount ? formatCurrency(c.amount, 'CZK') + `/${c.frequency}` : '—'} />
            ))}
          </ReviewSection>
        )}

        {/* Debts */}
        {debts.length > 0 && (
          <ReviewSection icon="💳" title={t('onboarding.review.q15.sections.debts')}>
            {debts.map((d, i) => (
              <View key={i} style={{ marginBottom: 8 }}>
                <Text style={{ ...T.fieldLabel, color: C.primary, marginBottom: 4 }}>
                  {t(`onboarding.debts.q13a.${d.type}`)} — {formatCurrency(d.balance, 'CZK')}
                </Text>
                <DataRow label={t('onboarding.review.q15.labels.minPayment')} value={formatCurrency(d.minPayment, 'CZK') + '/mo'} />
                {d.apr > 0 && <DataRow label={t('onboarding.review.q15.labels.apr')} value={`${d.apr}%`} />}
              </View>
            ))}
          </ReviewSection>
        )}

        {/* Budget */}
        <ReviewSection icon="📊" title={t('onboarding.review.q15.sections.budget')}>
          <DataRow label={t('onboarding.review.q15.labels.monthlyBudget')} value={budget?.monthlyFlexible ? formatCurrency(budget.monthlyFlexible, 'CZK') + '/mo' : '—'} />
          <DataRow label={t('onboarding.review.q15.labels.rollover')} value={budget?.rolloverStrategy ? t(`onboarding.budget.q14a.${budget.rolloverStrategy}`) : '—'} />
          {budget?.rolloverMultiplier ? <DataRow label={t('onboarding.review.q15.labels.multiplier')} value={`×${budget.rolloverMultiplier}`} /> : null}
        </ReviewSection>
      </View>

      {/* Secondary: I'll finish this later */}
      <Pressable onPress={handleLater} style={{ marginTop: 12, paddingVertical: 10, alignItems: 'center' }}>
        <Text style={{ ...T.btnSkip, color: C.muted }}>{t('onboarding.review.q15.skip')}</Text>
      </Pressable>
    </QuestionScreen>
  );
}
