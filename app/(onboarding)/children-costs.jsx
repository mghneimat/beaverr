import { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useI18n } from '../../lib/i18n';
import { getData, setData } from '../../lib/storage';
import { C, S, T, R } from '../../constants/onboarding-theme';
import QuestionScreen from '../../components/onboarding/QuestionScreen';
import PlaceholderIllustration from '../../components/onboarding/PlaceholderIllustration';
import PillToggle from '../../components/onboarding/PillToggle';
import AnimatedSlideIn from '../../components/onboarding/AnimatedSlideIn';
import LabeledInput from '../../components/onboarding/LabeledInput';
import FrequencyPills from '../../components/onboarding/FrequencyPills';
import AddAnotherButton from '../../components/onboarding/AddAnotherButton';

const FREQUENCIES = ['monthly', 'quarterly', 'annual'];

/** Maps age-group field keys to the matching i18n field keys under onboarding.childrenCosts.q9.field */
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

const AGE_GROUP_FIELDS = {
  '0-2': ['daycare', 'nanny', 'nappies', 'babySupplies'],
  '3-5': ['kindergarten', 'afterHours', 'extracurricular'],
  '6-15': ['schoolFees', 'schoolSupplies', 'afterSchool', 'tutoring'],
  '16-18': ['schoolFees', 'schoolSupplies', 'afterSchool', 'tutoring', 'drivingLessons', 'uniFees'],
};

export default function ChildrenCostsScreen() {
  const { t } = useI18n();
  const router = useRouter();

  const [household, setHousehold] = useState(null);
  const [children, setChildren] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [validationError, setValidationError] = useState('');

  // Per-child cost data
  const [costsData, setCostsData] = useState({});

  // Track which fields are "activated" (suggestion chips toggled on)
  const [activeFields, setActiveFields] = useState({});

  // ── Loaded data ──
  const [currency, setCurrency] = useState('Kč');

  useEffect(() => {
    (async () => {
      const h = await getData('pocketos_household');
      setHousehold(h);
      const loc = await getData('pocketos_location');
      if (loc?.currency) setCurrency(loc.currency);

      if (!h?.children?.length) {
        // No children — skip to S8
        router.replace('/(onboarding)/splash-pets');
        return;
      }

      setChildren(h.children);

      const initData = {};
      const initActive = {};
      h.children.forEach((child, idx) => {
        const fields = AGE_GROUP_FIELDS[child.ageGroup] || [];
        const fieldData = {};
        fields.forEach(f => { fieldData[f] = { amount: '', frequency: 'monthly' }; });
        initData[`child_${idx}`] = fieldData;
        initActive[`child_${idx}`] = {};
      });
      setCostsData(initData);
      setActiveFields(initActive);
    })();
  }, []);

  const toggleField = (childKey, field) => {
    setActiveFields(prev => ({
      ...prev,
      [childKey]: {
        ...prev[childKey],
        [field]: !prev[childKey]?.[field],
      },
    }));
  };

  const updateField = (childKey, field, updates) => {
    setCostsData(prev => ({
      ...prev,
      [childKey]: {
        ...prev[childKey],
        [field]: { ...prev[childKey][field], ...updates },
      },
    }));
  };

  const addOtherField = (childKey) => {
    let newKey = null;
    setCostsData(prev => {
      const childData = { ...prev[childKey] };
      // Find the next available 'other' index
      let otherIdx = 1;
      while (childData[`other_${otherIdx}`]) {
        otherIdx++;
      }
      newKey = `other_${otherIdx}`;
      childData[newKey] = { amount: '', frequency: 'monthly' };
      return { ...prev, [childKey]: childData };
    });
    // Auto-activate the new other field after state update
    setTimeout(() => {
      if (newKey) toggleField(childKey, newKey);
    }, 50);
    return newKey;
  };

  const removeOtherField = (childKey, fieldKey) => {
    setCostsData(prev => {
      const childData = { ...prev[childKey] };
      delete childData[fieldKey];
      return { ...prev, [childKey]: childData };
    });
  };

  const handleContinue = async () => {
    setValidationError('');

    if (activeTab < children.length - 1) {
      setActiveTab(activeTab + 1);
      return;
    }

    // Save all children costs
    await setData('pocketos_children_costs', costsData);
    await setData('pocketos_onboarding', {
      completed: false,
      currentStep: 'children-costs',
      percentComplete: 78,
    });

    router.replace('/(onboarding)/splash-pets');
  };

  const handleBack = async () => {
    setValidationError('');
    if (activeTab > 0) {
      setActiveTab(activeTab - 1);
      return;
    }
    // Save children costs data before navigating back
    await setData('pocketos_children_costs', costsData);
    router.replace('/(onboarding)/splash-children');
  };

  const progress = 78;
  const progressLabel = t('onboarding.progress', { percent: progress });

  const renderChildForm = (child, idx) => {
    const childKey = `child_${idx}`;
    const fields = AGE_GROUP_FIELDS[child.ageGroup] || [];
    const data = costsData[childKey] || {};
    const active = activeFields[childKey] || {};

    // Collect all field keys: predefined fields + any additional 'other_X' fields
    const allFieldKeys = [...fields];
    Object.keys(data).forEach(k => {
      if (k.startsWith('other_') && !allFieldKeys.includes(k)) {
        allFieldKeys.push(k);
      }
    });

    return (
      <View>
        {/* Suggestion chips row */}
        <Text style={{ ...T.fieldLabel, color: C.muted, marginBottom: 10 }}>
          {t('onboarding.childrenCosts.q9.suggestions')}
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 16 }}>
          {allFieldKeys.map(field => {
            const isOther = field.startsWith('other_');
            const i18nField = FIELD_I18N_MAP[field] || field;
            const isActive = active[field];
            return (
              <Pressable
                key={field}
                onPress={() => toggleField(childKey, field)}
                style={({ pressed }) => ({
                  width: '48%',
                  paddingVertical: 12,
                  paddingHorizontal: 14,
                  borderRadius: 12,
                  borderWidth: 1.5,
                  borderColor: isActive ? C.primary : pressed ? C.placeholder : C.border,
                  backgroundColor: isActive
                    ? C.chipSelectedBg
                    : pressed
                      ? C.bg
                      : C.surface,
                  marginBottom: 8,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                })}
              >
                <Text style={{
                  fontSize: 13,
                  fontWeight: isActive ? '600' : '500',
                  color: isActive ? C.primary : C.muted,
                  marginRight: isActive ? 6 : 0,
                }}>
                  {isOther
                    ? t('onboarding.childrenCosts.q9.field.other')
                    : t(`onboarding.childrenCosts.q9.field.${i18nField}`)}
                </Text>
                {isActive && (
                  <View style={{
                    width: 18,
                    height: 18,
                    borderRadius: 9,
                    backgroundColor: C.primary,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '700' }}>{'✓'}</Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        {/* Expanded cost fields for active suggestions */}
        {allFieldKeys.map(field => {
          const isActive = active[field];
          if (!isActive) return null;
          const isOther = field.startsWith('other_');
          const i18nField = FIELD_I18N_MAP[field] || field;
          return (
            <AnimatedSlideIn visible={isActive} key={field}>
              <View style={{ marginBottom: 16, padding: S.cardPad, backgroundColor: C.chipSelectedBg, borderRadius: R.card, borderWidth: 1, borderColor: C.chipSelectedBorder }}>
                {/* Proper label */}
                <Text style={{ fontSize: 13, color: C.primary, fontWeight: '600', marginBottom: 8 }}>
                  {isOther
                    ? t('onboarding.childrenCosts.q9.field.other')
                    : t(`onboarding.childrenCosts.q9.field.${i18nField}`)}
                </Text>
                {/* Input row with delete button for other fields */}
                <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                  <LabeledInput
                    label={isOther
                      ? t('onboarding.childrenCosts.q9.field.other')
                      : t(`onboarding.childrenCosts.q9.field.${i18nField}`)}
                    value={data[field]?.amount || ''}
                    onChangeText={(v) => updateField(childKey, field, { amount: v })}
                    numeric
                    placeholder={t('onboarding.childrenCosts.q9.amountPlaceholder')}
                    large
                    containerStyle={{ flex: 1 }}
                    currency={currency}
                  />
                  {isOther && (
                    <Pressable
                      onPress={() => removeOtherField(childKey, field)}
                      style={({ pressed }) => ({
                        padding: 8,
                        borderRadius: 6,
                        backgroundColor: pressed ? 'rgba(209,64,64,0.12)' : 'transparent',
                      })}
                    >
                      <Text style={{ fontSize: 18, color: '#D14040' }}>✕</Text>
                    </Pressable>
                  )}
                </View>
                {/* Frequency label + toggles */}
                <FrequencyPills
                  options={FREQUENCIES}
                  value={data[field]?.frequency}
                  onChange={(freq) => updateField(childKey, field, { frequency: freq })}
                  small
                />
              </View>
            </AnimatedSlideIn>
          );
        })}

        {/* Add other cost button */}
        <AddAnotherButton
          label={t('onboarding.childrenCosts.q9.addAnother')}
          onPress={() => addOtherField(childKey)}
        />
      </View>
    );
  };

  const currentChild = children[activeTab];

  return (
    <QuestionScreen
      chapter={t('onboarding.childrenCosts.chapter')}
      title={currentChild ? t('onboarding.childrenCosts.q9.title', { name: currentChild.displayName || `${t('onboarding.childrenCosts.child')} ${activeTab + 1}` }) : ''}
      helper={currentChild ? t('onboarding.childrenCosts.q9.helper', { name: currentChild.displayName || `${t('onboarding.childrenCosts.child')} ${activeTab + 1}`, ageGroup: currentChild.ageGroup || '' }) : ''}
      illustration={<PlaceholderIllustration />}
      onContinue={handleContinue}
      onBack={handleBack}
      validationError={validationError}
      progress={progress}
      progressLabel={progressLabel}
      animationKey={activeTab}
    >
      {/* Tab row — toggles as wide as continue button */}
      {children.length > 0 && (
        <View style={{ flexDirection: 'row', borderRadius: R.input, borderWidth: 1, borderColor: C.border, overflow: 'hidden', marginBottom: 20 }}>
          {children.map((child, idx) => (
            <Pressable
              key={idx}
              onPress={() => { setActiveTab(idx); setValidationError(''); }}
              style={{
                flex: 1,
                paddingVertical: 14,
                paddingHorizontal: 12,
                backgroundColor: activeTab === idx ? C.chipSelectedBg : 'transparent',
                alignItems: 'center',
              }}
            >
              <Text style={{
                fontSize: 13,
                fontWeight: '500',
                color: activeTab === idx ? C.primary : C.muted,
              }}>
                {child.displayName || `${t('onboarding.childrenCosts.child')} ${idx + 1}`}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {currentChild && renderChildForm(currentChild, activeTab)}
    </QuestionScreen>
  );
}
