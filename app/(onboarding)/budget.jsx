import { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, ScrollView, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { useI18n } from '../../lib/i18n';
import { getData, setData } from '../../lib/storage';
import { toMonthly, formatCurrency, totalMonthlyCosts, availableBudget } from '../../lib/finance';
import QuestionScreen from '../../components/onboarding/QuestionScreen';
import PlaceholderIllustration from '../../components/onboarding/PlaceholderIllustration';
import OptionCard from '../../components/onboarding/OptionCard';
import AnimatedSlideIn from '../../components/onboarding/AnimatedSlideIn';
import { C, S, T, R } from '../../constants/onboarding-theme';

export default function BudgetScreen() {
  const { t } = useI18n();
  const router = useRouter();

  const [step, setStep] = useState('q14');
  const [validationError, setValidationError] = useState('');

  // Financial data for live calculation
  const [income, setIncome] = useState(null);
  const [costs, setCosts] = useState([]);
  const [costsByCategory, setCostsByCategory] = useState([]);
  const [debts, setDebts] = useState([]);

  // Q14 — Monthly budget
  const [monthlyFlexible, setMonthlyFlexible] = useState('');
  const [calculatedBudget, setCalculatedBudget] = useState(0);

  // Q14a — Rollover strategy
  const [rolloverStrategy, setRolloverStrategy] = useState(null);
  const [rolloverMultiplier, setRolloverMultiplier] = useState(null);

  // Expanded rows state for the summary table
  const [expandedRows, setExpandedRows] = useState({});
  const [tableVisible, setTableVisible] = useState(false);
  const [allExpanded, setAllExpanded] = useState(false);

  // Animated values for expand/collapse height — store actual pixel heights directly
  const expandAnims = useRef({
    income: new Animated.Value(0),
    fixedCosts: new Animated.Value(0),
  }).current;

  // Measured content heights for each expandable section
  const contentHeights = useRef({ income: 0, fixedCosts: 0 }).current;

  // Dynamic animated values for per-category expand within costs breakdown
  const catExpandAnims = useRef({}).current;
  const catContentHeights = useRef({}).current;

  const getCatAnim = (catKey) => {
    if (!catExpandAnims[catKey]) {
      catExpandAnims[catKey] = new Animated.Value(0);
    }
    return catExpandAnims[catKey];
  };

  const getCatHeight = (catKey) => {
    if (!catContentHeights[catKey]) {
      catContentHeights[catKey] = 0;
    }
    return catContentHeights[catKey];
  };

  const setCatHeight = (catKey, h) => {
    catContentHeights[catKey] = h;
  };

  // Calculate the height of a category's items based on item count (each item row ~28px)
  const getCategoryItemsHeight = (cat) => {
    return cat.items.length * 28; // paddingVertical:6*2 + fontSize:12*1.2 + borderTop:1 ≈ 27.4px, rounded to 28
  };

  const toggleRow = (key) => {
    const isExpanding = !expandedRows[key];

    if (key === 'fixedCosts') {
      // fixedCosts uses direct pixel values (not normalized 0→1)
      const targetHeight = isExpanding ? (contentHeights.fixedCosts || 200) : 0;
      // Use the current animated value as the starting point for collapse animation,
      // so it smoothly animates from wherever it currently is down to 0
      const currentAnimValue = isExpanding ? 0 : (expandAnims.fixedCosts.__getValue() || contentHeights.fixedCosts || 200);
      expandAnims.fixedCosts.setValue(currentAnimValue);
      Animated.timing(expandAnims.fixedCosts, {
        toValue: targetHeight,
        duration: 280,
        useNativeDriver: false,
      }).start();
    } else {
      // income uses normalized 0→1 with interpolation
      const toValue = isExpanding ? 1 : 0;
      Animated.timing(expandAnims[key], {
        toValue,
        duration: 280,
        useNativeDriver: false,
      }).start();
    }

    setExpandedRows(prev => ({ ...prev, [key]: isExpanding }));
  };

  const toggleCategory = (catKey) => {
    const isExpanding = !expandedRows[catKey];
    const toValue = isExpanding ? 1 : 0;

    const anim = getCatAnim(catKey);
    Animated.timing(anim, {
      toValue,
      duration: 280,
      useNativeDriver: false,
    }).start();

    setExpandedRows(prev => ({ ...prev, [catKey]: isExpanding }));

    // Recalculate fixedCosts height immediately (synchronously) so both animations start at the same time
    // Pass the new expanded state directly since React state update hasn't committed yet
    recalcFixedCostsHeight(true, { [catKey]: isExpanding });
  };

  const toggleAll = () => {
    const willExpand = !allExpanded;
    setAllExpanded(willExpand);

    const newExpanded = { ...expandedRows };
    newExpanded.income = willExpand;
    newExpanded.fixedCosts = willExpand;

    costsByCategory.forEach((cat) => {
      const catKey = `cat_${cat.category}`;
      newExpanded[catKey] = willExpand;
    });

    setExpandedRows(newExpanded);

    // Animate income
    const incomeToValue = willExpand ? 1 : 0;
    expandAnims.income.setValue(willExpand ? 0 : 1);
    Animated.timing(expandAnims.income, {
      toValue: incomeToValue,
      duration: 280,
      useNativeDriver: false,
    }).start();

    // Animate all category sub-rows
    costsByCategory.forEach((cat) => {
      const catKey = `cat_${cat.category}`;
      const anim = getCatAnim(catKey);
      const catToValue = willExpand ? 1 : 0;
      anim.setValue(willExpand ? 0 : 1);
      Animated.timing(anim, {
        toValue: catToValue,
        duration: 280,
        useNativeDriver: false,
      }).start();
    });

    // Animate fixedCosts main container
    recalcFixedCostsHeight(true, newExpanded);
    const fixedTarget = willExpand ? (contentHeights.fixedCosts || 200) : 0;
    const fixedCurrent = willExpand ? 0 : (expandAnims.fixedCosts.__getValue() || contentHeights.fixedCosts || 200);
    expandAnims.fixedCosts.setValue(fixedCurrent);
    Animated.timing(expandAnims.fixedCosts, {
      toValue: fixedTarget,
      duration: 280,
      useNativeDriver: false,
    }).start();
  };

  const onContentLayout = (key, event) => {
    const h = event.nativeEvent.layout.height;
    if (h > 0 && contentHeights[key] !== h) {
      contentHeights[key] = h;
      // If already expanded, set animated value to match new height
      if (expandedRows[key]) {
        if (key === 'fixedCosts') {
          // fixedCosts uses direct pixel values — only update if not currently animating
          // (recalcFixedCostsHeight or toggleRow handles animation; this is a fallback for layout shifts)
          expandAnims.fixedCosts.setValue(h);
        } else {
          expandAnims[key].setValue(1);
        }
      }
    }
  };

  // Dedicated onLayout handler for the fixedCosts inner content View
  // Updates contentHeights.fixedCosts with the actual rendered height.
  // If the section is expanded and the measured height differs from the current animated value,
  // smoothly animate to the measured height.
  const onFixedCostsContentLayout = (event) => {
    const h = event.nativeEvent.layout.height;
    if (h > 0 && contentHeights.fixedCosts !== h) {
      const oldHeight = contentHeights.fixedCosts;
      contentHeights.fixedCosts = h;
      if (expandedRows.fixedCosts && oldHeight > 0) {
        const currentAnim = expandAnims.fixedCosts.__getValue();
        if (Math.abs(currentAnim - h) > 1) {
          expandAnims.fixedCosts.setValue(currentAnim);
          Animated.timing(expandAnims.fixedCosts, {
            toValue: h,
            duration: 280,
            useNativeDriver: false,
          }).start();
        }
      }
    }
  };

  const onCatContentLayout = (catKey, event) => {
    const h = event.nativeEvent.layout.height;
    if (h > 0 && catContentHeights[catKey] !== h) {
      catContentHeights[catKey] = h;
      if (expandedRows[catKey]) {
        const anim = getCatAnim(catKey);
        anim.setValue(1);
        // Recalculate fixedCosts height using the newly measured height
        // Use animate=true so the outer container smoothly adjusts if measured height differs from calculated
        recalcFixedCostsHeight(true);
      }
    }
  };

  // Get the height of a category's expanded items, using measured height if available, otherwise calculated
  const getCategoryContentHeight = (cat) => {
    const catKey = `cat_${cat.category}`;
    const measured = getCatHeight(catKey);
    if (measured > 0) return measured;
    return getCategoryItemsHeight(cat);
  };

  // Recalculate the fixedCosts content height based on which categories are expanded
  // overrideState can be passed to override expandedRows for a specific category (used during toggle before state updates)
  const recalcFixedCostsHeight = (animate = false, overrideState = null) => {
    // Sum up: category headers (each ~33px based on paddingVertical:8*2 + fontSize:13*~1.3 ≈ 33px) + expanded items
    let total = 0;
    costsByCategory.forEach((cat) => {
      const catKey = `cat_${cat.category}`;
      // Category header height (paddingVertical:8*2 + fontSize:13*~1.3 + borderTop:1 ≈ 33px)
      total += 33;
      // Use override state if provided for this category, otherwise use current expandedRows state
      const isExpanded = overrideState && overrideState[catKey] !== undefined ? overrideState[catKey] : expandedRows[catKey];
      if (isExpanded) {
        // Use measured height if available (from onCatContentLayout), otherwise calculate from data
        total += getCategoryContentHeight(cat);
      }
    });
    if (total > 0 && contentHeights.fixedCosts !== total) {
      const oldTotal = contentHeights.fixedCosts;
      contentHeights.fixedCosts = total;
      if (expandedRows.fixedCosts) {
        if (animate) {
          // Animate the pixel height directly from oldTotal to newTotal
          expandAnims.fixedCosts.setValue(oldTotal);
          Animated.timing(expandAnims.fixedCosts, {
            toValue: total,
            duration: 280,
            useNativeDriver: false,
          }).start();
        } else {
          expandAnims.fixedCosts.setValue(total);
        }
      }
    }
  };

  useEffect(() => {
    (async () => {
      const inc = await getData('pocketos_income');
      const d = await getData('pocketos_debts') || [];
      setIncome(inc);
      setDebts(d);

      // Aggregate all fixed costs from separate storage keys
      const housing = await getData('pocketos_housing') || {};
      const transport = await getData('pocketos_transport') || {};
      const health = await getData('pocketos_health') || {};
      const childrenCosts = await getData('pocketos_children_costs') || {};
      const pets = await getData('pocketos_pets') || [];
      const subs = await getData('pocketos_subscriptions') || [];
      const otherCosts = await getData('pocketos_other_costs') || [];

      const allCosts = [];
      const byCategory = [];

      // Housing costs
      const housingItems = [];
      if (housing.type === 'renting') {
        if (housing.rent) housingItems.push({ label: 'Rent', amount: housing.rent, frequency: 'monthly' });
        if (housing.utilities) housingItems.push({ label: 'Utilities', amount: housing.utilities, frequency: 'monthly' });
      }
      if (housing.internetAmount) housingItems.push({ label: 'Internet', amount: housing.internetAmount, frequency: housing.internetFrequency || 'monthly' });
      if (housing.mortgageAmount) housingItems.push({ label: 'Mortgage', amount: housing.mortgageAmount, frequency: 'monthly' });
      if (housing.hasOtherCosts && housing.otherCostRows) {
        housing.otherCostRows.forEach((r, idx) => {
          if (r.amount) housingItems.push({ label: r.label || `Other cost ${idx + 1}`, amount: r.amount, frequency: 'monthly' });
        });
      }
      if (housing.contributesToFamily && housing.familyContributionRows) {
        housing.familyContributionRows.forEach((r, idx) => {
          if (r.amount) housingItems.push({ label: r.label || `Family contribution ${idx + 1}`, amount: r.amount, frequency: 'monthly' });
        });
      }
      // Government taxes
      if (housing.govtTaxes) {
        const gt = housing.govtTaxes;
        if (gt.wasteTax && gt.wasteTaxAmount) housingItems.push({ label: 'Waste tax', amount: gt.wasteTaxAmount, frequency: 'annual' });
        if (gt.tvLicence && gt.tvLicenceAmount) housingItems.push({ label: 'TV licence', amount: gt.tvLicenceAmount, frequency: 'annual' });
        if (gt.radioLicence && gt.radioLicenceAmount) housingItems.push({ label: 'Radio licence', amount: gt.radioLicenceAmount, frequency: 'annual' });
        if (gt.customItems) {
          gt.customItems.forEach((item, idx) => {
            if (item.amount) housingItems.push({ label: item.label || `Tax ${idx + 1}`, amount: item.amount, frequency: item.frequency || 'annual' });
          });
        }
      }
      if (housingItems.length > 0) {
        byCategory.push({ category: 'housing', label: t('onboarding.budget.q14.cat.housing'), items: housingItems });
        allCosts.push(...housingItems);
      }

      // Transport costs
      const transportItems = [];
      if (transport.hasVehicle && transport.vehicles) {
        transport.vehicles.forEach((v, vi) => {
          const prefix = transport.vehicles.length > 1 ? `Vehicle ${vi + 1} ` : '';
          if (v.fuelCost) transportItems.push({ label: `${prefix}Fuel`, amount: v.fuelCost, frequency: 'monthly' });
          if (v.hasInsurance && v.insurancePremium) transportItems.push({ label: `${prefix}Insurance`, amount: v.insurancePremium, frequency: v.insuranceFrequency || 'annual' });
          if (v.hasParking && v.parkingAmount) transportItems.push({ label: `${prefix}Parking`, amount: v.parkingAmount, frequency: v.parkingFrequency || 'annual' });
        });
      }
      if (transport.hasPublicTransport && transport.ptAmount) {
        transportItems.push({ label: 'Public transport', amount: transport.ptAmount, frequency: transport.ptFrequency || 'monthly' });
      }
      if (transportItems.length > 0) {
        byCategory.push({ category: 'transport', label: t('onboarding.budget.q14.cat.transport'), items: transportItems });
        allCosts.push(...transportItems);
      }

      // Health insurance costs
      const healthItems = [];
      if (health) {
        Object.entries(health).forEach(([key, member]) => {
          if (member && member.confirmed && member.coverage !== 'employer' && member.premium) {
            const name = key === 'self' ? 'Your insurance' : key === 'partner' ? "Partner's insurance" : `Child's insurance`;
            // For custom frequency, compute monthly equivalent from premium / customFrequencyMonths
            const freq = member.frequency || 'monthly';
            const amount = freq === 'custom' && member.customFrequencyMonths
              ? Number(member.premium) / Number(member.customFrequencyMonths)
              : Number(member.premium);
            healthItems.push({ label: name, amount, frequency: freq === 'custom' ? 'monthly' : freq });
          }
        });
      }
      if (healthItems.length > 0) {
        byCategory.push({ category: 'health', label: t('onboarding.budget.q14.cat.health'), items: healthItems });
        allCosts.push(...healthItems);
      }

      // Children's costs
      const childrenItems = [];
      if (Object.keys(childrenCosts).length > 0) {
        Object.entries(childrenCosts).forEach(([childKey, child]) => {
          if (child && typeof child === 'object') {
            Object.entries(child).forEach(([fieldKey, field]) => {
              if (field && field.amount) {
                const fieldLabel = fieldKey === 'nursery' ? 'Nursery' : fieldKey === 'school' ? 'School' : fieldKey === 'afterSchool' ? 'After-school' : fieldKey === 'clubs' ? 'Clubs' : fieldKey === 'other' ? 'Other' : fieldKey;
                childrenItems.push({ label: `${fieldLabel}`, amount: field.amount, frequency: field.frequency || 'monthly' });
              }
            });
          }
        });
      }
      if (childrenItems.length > 0) {
        byCategory.push({ category: 'children', label: t('onboarding.budget.q14.cat.children'), items: childrenItems });
        allCosts.push(...childrenItems);
      }

      // Pet costs
      const petItems = [];
      pets.forEach((pet, pi) => {
        const prefix = pet.name ? `${pet.name} ` : `Pet ${pi + 1} `;
        if (pet.foodAmount) petItems.push({ label: `${prefix}Food`, amount: pet.foodAmount, frequency: pet.foodFrequency || 'monthly' });
        if (pet.vetAmount) petItems.push({ label: `${prefix}Vet`, amount: pet.vetAmount, frequency: pet.vetFrequency || 'monthly' });
      });
      if (petItems.length > 0) {
        byCategory.push({ category: 'pets', label: t('onboarding.budget.q14.cat.pets'), items: petItems });
        allCosts.push(...petItems);
      }

      // Subscriptions
      const subItems = [];
      subs.forEach(sub => {
        if (sub.cost) {
          const transKey = `onboarding.subscriptions.q11.services.${sub.name}`;
          const translated = t(transKey);
          // t() returns the key itself if not found
          const subLabel = translated !== transKey ? translated : (sub.name || 'Subscription');
          subItems.push({ label: subLabel, amount: parseFloat(sub.cost), frequency: sub.frequency || 'monthly' });
        }
      });
      if (subItems.length > 0) {
        byCategory.push({ category: 'subscriptions', label: t('onboarding.budget.q14.cat.subscriptions'), items: subItems });
        allCosts.push(...subItems);
      }

      // Other costs
      const otherItems = [];
      otherCosts.forEach(c => {
        if (c.amount) {
          const transKey = `onboarding.otherCosts.q12.costs.${c.name}`;
          const translated = t(transKey);
          // t() returns the key itself if not found
          const costLabel = translated !== transKey ? translated : (c.name || 'Other cost');
          otherItems.push({ label: costLabel, amount: parseFloat(c.amount), frequency: c.frequency || 'monthly' });
        }
      });
      if (otherItems.length > 0) {
        byCategory.push({ category: 'other', label: t('onboarding.budget.q14.cat.other'), items: otherItems });
        allCosts.push(...otherItems);
      }

      setCosts(allCosts);
      setCostsByCategory(byCategory);

      // Initialize fixedCosts content height based on category headers only (all collapsed initially)
      const initialHeight = byCategory.reduce((sum, cat) => sum + 33, 0);
      if (initialHeight > 0) {
        contentHeights.fixedCosts = initialHeight;
      }

      // Calculate available budget
      const userMonthly = toMonthly(inc?.amount || 0, inc?.frequency || 'monthly');
      const partnerMonthly = toMonthly(inc?.partnerAmount || 0, inc?.partnerFrequency || 'monthly');
      const otherMonthly = (inc?.otherIncomeRows || []).reduce((sum, s) => sum + toMonthly(s.amount || 0, s.frequency || 'monthly'), 0);
      const totalIncome = userMonthly + partnerMonthly + otherMonthly;

      // Fixed costs from all aggregated costs
      const fixedCosts = totalMonthlyCosts(allCosts);

      // Min debt payments
      const debtPayments = d.reduce((sum, debt) => sum + parseFloat(debt.minPayment || 0), 0);

      const avail = availableBudget(totalIncome, fixedCosts, debtPayments);
      setCalculatedBudget(avail);
      setMonthlyFlexible(String(Math.round(avail)));

      // Show the table with animation once data is ready
      setTableVisible(true);
    })();
  }, []);

  const handleContinue = async () => {
    setValidationError('');

    if (step === 'q14') {
      if (!monthlyFlexible) {
        setValidationError(t('onboarding.budget.q14.validation'));
        return;
      }
      setStep('q14a');
      return;
    }

    if (step === 'q14a') {
      if (!rolloverStrategy) {
        setValidationError(t('onboarding.budget.q14a.validation'));
        return;
      }

      await setData('pocketos_budget', {
        monthlyFlexible: parseFloat(monthlyFlexible) || 0,
        rolloverStrategy,
        rolloverMultiplier: rolloverStrategy === 'capped' ? rolloverMultiplier : null,
        rolloverBalance: 0,
      });

      await setData('pocketos_onboarding', {
        completed: false,
        currentStep: 'budget',
        percentComplete: 95,
      });

      router.replace('/(onboarding)/splash-review');
      return;
    }
  };

  const handleBack = () => {
    setValidationError('');
    if (step === 'q14a') { setStep('q14'); return; }
    router.replace('/(onboarding)/splash-budget');
  };

  const progress = 95;
  const progressLabel = t('onboarding.progress', { percent: progress });

  const renderQ14 = () => {
    const userMonthly = toMonthly(income?.amount || 0, income?.frequency || 'monthly');
    const partnerMonthly = toMonthly(income?.partnerAmount || 0, income?.partnerFrequency || 'monthly');
    const otherMonthly = (income?.otherIncomeRows || []).reduce((sum, s) => sum + toMonthly(s.amount || 0, s.frequency || 'monthly'), 0);
    const totalIncome = userMonthly + partnerMonthly + otherMonthly;
    const fixedCosts = totalMonthlyCosts(costs);
    const debtPayments = debts.reduce((sum, debt) => sum + parseFloat(debt.minPayment || 0), 0);

    const currency = 'CZK';

    const rows = [
      {
        key: 'income',
        label: t('onboarding.budget.q14.income'),
        amount: totalIncome,
        expandable: true,
      },
      {
        key: 'fixedCosts',
        label: t('onboarding.budget.q14.fixedCosts'),
        amount: -fixedCosts,
        expandable: true,
      },
      {
        key: 'debtPayments',
        label: t('onboarding.budget.q14.debtPayments'),
        amount: -debtPayments,
        expandable: false,
      },
    ];

    const renderChevron = (isExpanded) => (
      <Text style={{ fontSize: 12, color: C.placeholder, marginLeft: 6 }}>
        {isExpanded ? '▲' : '▼'}
      </Text>
    );

    const renderIncomeBreakdown = () => {
      const breakdowns = [];
      if (userMonthly > 0) {
        breakdowns.push({ label: t('onboarding.budget.q14.incomeUser'), amount: userMonthly, indent: 28 });
      }
      if (partnerMonthly > 0) {
        breakdowns.push({ label: t('onboarding.budget.q14.incomePartner'), amount: partnerMonthly, indent: 28 });
      }
      // Individual other income rows
      const otherRows = income?.otherIncomeRows || [];
      otherRows.forEach((r, idx) => {
        const monthly = toMonthly(r.amount || 0, r.frequency || 'monthly');
        if (monthly > 0) {
          breakdowns.push({ label: r.label || `Other income ${idx + 1}`, amount: monthly, indent: 28 });
        }
      });

      const h = expandAnims.income.interpolate({
        inputRange: [0, 1],
        outputRange: [0, contentHeights.income || 200],
      });

      return (
        <Animated.View style={{ height: h, overflow: 'hidden' }}>
          <View
            onLayout={(e) => onContentLayout('income', e)}
            style={{ backgroundColor: C.bg }}
          >
            {breakdowns.map((b, i) => (
              <View
                key={i}
                style={{
                  flexDirection: 'row',
                  borderTopWidth: 1,
                  borderTopColor: C.divider,
                  borderBottomWidth: i === breakdowns.length - 1 ? 1 : 0,
                  borderBottomColor: C.divider,
                }}
              >
                <View style={{ flex: 1, paddingVertical: 8, paddingLeft: b.indent, justifyContent: 'flex-start', borderRightWidth: 1, borderRightColor: C.divider }}>
                  <Text style={{ fontSize: 13, color: C.muted }}>{b.label}</Text>
                </View>
                <View style={{ width: 140, paddingVertical: 8, paddingRight: 16, flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ flex: 1, alignItems: 'center' }}>
                    <Text style={{ fontSize: 13, fontWeight: '500', color: C.primary }}>
                      {formatCurrency(b.amount, '')}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 11, fontWeight: '400', color: C.placeholder }}>{currency}</Text>
                </View>
              </View>
            ))}
          </View>
        </Animated.View>
      );
    };

    const renderCostsBreakdown = () => {
      return (
        <Animated.View style={{ height: expandAnims.fixedCosts, overflow: 'hidden' }}>
          <View
            onLayout={onFixedCostsContentLayout}
            style={{ backgroundColor: C.bg }}
          >
            {costsByCategory.map((cat, i) => {
              const catKey = `cat_${cat.category}`;
              const catMonthly = totalMonthlyCosts(cat.items);
              const isCatExpanded = expandedRows[catKey];
              const catAnim = getCatAnim(catKey);
              // Use calculated height from data (reliable immediately) with onLayout measurement as fallback
              const calculatedCatItemsHeight = getCategoryItemsHeight(cat);
              const measuredCatHeight = getCatHeight(catKey);
              const targetCatHeight = measuredCatHeight > 0 ? measuredCatHeight : (calculatedCatItemsHeight > 0 ? calculatedCatItemsHeight : 100);
              const catHeight = catAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, targetCatHeight],
              });

              return (
                <View key={catKey}>
                  {/* Category header row — pressable toggle */}
                  <Pressable
                    onPress={() => toggleCategory(catKey)}
                    style={({ pressed }) => ({
                      flexDirection: 'row',
                      borderTopWidth: 1,
                      borderTopColor: C.divider,
                      backgroundColor: pressed ? C.divider : C.overlayHoverDarker,
                    })}
                  >
                    <View style={{ flex: 1, paddingVertical: 8, paddingLeft: 28, justifyContent: 'flex-start', borderRightWidth: 1, borderRightColor: C.divider, flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: C.text }}>{cat.label}</Text>
                      <Text style={{ fontSize: 10, color: C.disabled, marginLeft: 6 }}>
                        {isCatExpanded ? '▲' : '▼'}
                      </Text>
                    </View>
                    <View style={{ width: 140, paddingVertical: 8, paddingRight: 16, flexDirection: 'row', alignItems: 'center' }}>
                      <View style={{ flex: 1, alignItems: 'center' }}>
                        <Text style={{ fontSize: 13, fontWeight: '600', color: C.danger }}>
                          {formatCurrency(catMonthly, '')}
                        </Text>
                      </View>
                      <Text style={{ fontSize: 11, fontWeight: '400', color: C.placeholder }}>{currency}</Text>
                    </View>
                  </Pressable>
                  {/* Individual items within category — animated expand/collapse */}
                  <Animated.View style={{ height: catHeight, overflow: 'hidden' }}>
                    <View
                      onLayout={(e) => onCatContentLayout(catKey, e)}
                    >
                      {cat.items.map((item, j) => {
                        const itemMonthly = toMonthly(item.amount || 0, item.frequency || 'monthly');
                        const isLastItem = j === cat.items.length - 1;
                        return (
                          <View
                            key={j}
                            style={{
                              flexDirection: 'row',
                              borderTopWidth: 1,
                              borderTopColor: C.divider,
                              borderBottomWidth: isLastItem ? 1 : 0,
                              borderBottomColor: C.divider,
                            }}
                          >
                            <View style={{ flex: 1, paddingVertical: 6, paddingLeft: 44, justifyContent: 'flex-start', borderRightWidth: 1, borderRightColor: C.divider }}>
                              <Text style={{ fontSize: 12, color: C.muted }}>{item.label}</Text>
                            </View>
                            <View style={{ width: 140, paddingVertical: 6, paddingRight: 16, flexDirection: 'row', alignItems: 'center' }}>
                              <View style={{ flex: 1, alignItems: 'center' }}>
                                <Text style={{ fontSize: 12, fontWeight: '400', color: C.muted }}>
                                  {formatCurrency(itemMonthly, '')}
                                </Text>
                              </View>
                              <Text style={{ fontSize: 10, fontWeight: '400', color: C.disabled }}>{currency}</Text>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  </Animated.View>
                </View>
              );
            })}
          </View>
        </Animated.View>
      );
    };

    return (
      <View>
        {/* Minimalistic summary table — animate in on mount */}
        <AnimatedSlideIn visible={tableVisible} duration={400}>
        <View style={{
          marginTop: 20,
          marginBottom: 20,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: C.border,
          backgroundColor: C.surface,
          overflow: 'hidden',
        }}>
          {/* Table header */}
          <View style={{
            flexDirection: 'row',
            backgroundColor: C.bg,
            borderBottomWidth: 1,
            borderBottomColor: C.divider,
          }}>
            <View style={{ flex: 1, paddingVertical: 14, paddingLeft: 16, borderRightWidth: 1, borderRightColor: C.divider }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: C.muted, textTransform: 'uppercase', letterSpacing: 0.6 }}>
                Description
              </Text>
            </View>
            <View style={{ width: 140, paddingVertical: 14, paddingRight: 16, alignItems: 'center' }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: C.muted, textTransform: 'uppercase', letterSpacing: 0.6 }}>
                Amount
              </Text>
            </View>
          </View>

          {/* Expand/collapse all button */}
          <Pressable
            onPress={toggleAll}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 8,
              backgroundColor: pressed ? C.overlayHoverDarker : C.bg,
              borderBottomWidth: 1,
              borderBottomColor: C.divider,
            })}
          >
            <Text style={{ fontSize: 12, fontWeight: '600', color: C.primary, marginRight: 6 }}>
              {allExpanded ? 'Collapse all' : 'Expand all'}
            </Text>
            <Text style={{ fontSize: 10, color: C.primary }}>
              {allExpanded ? '▲' : '▼'}
            </Text>
          </Pressable>

          {/* Table rows */}
          {rows.map((row, i) => (
            <View key={row.key}>
              <Pressable
                onPress={row.expandable ? () => toggleRow(row.key) : undefined}
                disabled={!row.expandable}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  borderBottomWidth: i < rows.length - 1 ? 1 : 0,
                  borderBottomColor: C.divider,
                  backgroundColor: pressed && row.expandable ? C.overlayHoverDarker : 'transparent',
                })}
              >
                <View style={{ flex: 1, paddingVertical: 12, paddingLeft: 16, justifyContent: 'flex-start', borderRightWidth: 1, borderRightColor: C.divider, flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ fontSize: 14, color: C.text }}>
                    {row.label}
                  </Text>
                  {row.expandable && renderChevron(expandedRows[row.key])}
                </View>
                <View style={{ width: 140, paddingVertical: 12, paddingRight: 16, flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ flex: 1, alignItems: 'center' }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: C.text }}>
                      {row.amount >= 0 ? formatCurrency(row.amount, '') : `-${formatCurrency(Math.abs(row.amount), '')}`}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 11, fontWeight: '400', color: C.placeholder }}>{currency}</Text>
                </View>
              </Pressable>

              {/* Expanded content */}
              {row.key === 'income' && renderIncomeBreakdown()}
              {row.key === 'fixedCosts' && renderCostsBreakdown()}
            </View>
          ))}

          {/* Total row */}
          <View style={{
            flexDirection: 'row',
            backgroundColor: C.bg,
            borderTopWidth: 1,
            borderTopColor: C.divider,
          }}>
            <View style={{ flex: 1, paddingVertical: 14, paddingLeft: 16, justifyContent: 'flex-start', borderRightWidth: 1, borderRightColor: C.divider }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: C.primary }}>
                Your monthly flexible budget
              </Text>
            </View>
            <View style={{ width: 140, paddingVertical: 14, paddingRight: 16, flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ fontSize: 16, fontWeight: '800', color: calculatedBudget >= 0 ? C.positive : C.danger }}>
                  {formatCurrency(calculatedBudget, '')}
                </Text>
              </View>
              <Text style={{ fontSize: 12, fontWeight: '500', color: C.placeholder }}>{currency}</Text>
            </View>
          </View>
        </View>
        </AnimatedSlideIn>

        <Text style={{ ...T.helper, color: C.muted, marginBottom: 12 }}>
          {t('onboarding.budget.q14.helper')}
        </Text>
      </View>
    );
  };

  const renderQ14a = () => (
    <View>
      <Text style={{ ...T.helper, color: C.muted, marginBottom: 20 }}>
        {t('onboarding.budget.q14a.helper')}
      </Text>

      <OptionCard
        icon="♾️"
        label={t('onboarding.budget.q14a.free')}
        selected={rolloverStrategy === 'free'}
        onPress={() => { setRolloverStrategy('free'); setValidationError(''); }}
      />
      <OptionCard
        icon="🎯"
        label={t('onboarding.budget.q14a.capped')}
        selected={rolloverStrategy === 'capped'}
        onPress={() => { setRolloverStrategy('capped'); setValidationError(''); }}
      />
      <OptionCard
        icon="🔁"
        label={t('onboarding.budget.q14a.reset')}
        selected={rolloverStrategy === 'reset'}
        onPress={() => { setRolloverStrategy('reset'); setValidationError(''); }}
      />

      <AnimatedSlideIn visible={rolloverStrategy === 'capped'}>
        <Text style={{ ...T.fieldLabel, color: C.muted, marginTop: 16, marginBottom: S.labelGap }}>
          {t('onboarding.budget.q14a.multiplierLabel')}
        </Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {[2, 3, 4].map(m => (
            <Pressable
              key={m}
              onPress={() => setRolloverMultiplier(m)}
              style={({ pressed }) => ({
                flex: 1,
                paddingVertical: S.pillPadV,
                borderRadius: R.input,
                borderWidth: 1.5,
                borderColor: rolloverMultiplier === m ? C.primary : C.border,
                backgroundColor: rolloverMultiplier === m ? C.chipSelectedBg : C.surface,
                alignItems: 'center',
              })}
            >
              <Text style={{ fontSize: 16, fontWeight: '600', color: rolloverMultiplier === m ? C.primary : C.text }}>
                ×{m}
              </Text>
            </Pressable>
          ))}
        </View>
      </AnimatedSlideIn>
    </View>
  );

  const stepTitles = {
    q14: t('onboarding.budget.q14.title'),
    q14a: t('onboarding.budget.q14a.title'),
  };

  return (
    <QuestionScreen
      animationKey={step}
      chapter={t('onboarding.budget.chapter')}
      title={stepTitles[step]}
      illustration={<PlaceholderIllustration />}
      onContinue={handleContinue}
      onBack={handleBack}
      validationError={validationError}
      progress={progress}
      progressLabel={progressLabel}
    >
      {step === 'q14' && renderQ14()}
      {step === 'q14a' && renderQ14a()}
    </QuestionScreen>
  );
}
