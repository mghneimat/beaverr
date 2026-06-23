import { useState, useEffect, useMemo } from 'react';
import { View, Text } from 'react-native';
import OnboardingPressable from '../../components/onboarding/OnboardingPressable';
import { listRowBg } from '../../components/onboarding/pressableFeedback';
import { useRouter } from 'expo-router';
import { useI18n } from '../../lib/i18n';
import { navigateBack, navigateForward } from '../../lib/onboardingNavigation';
import { useOnboardingLayout } from '../../lib/onboardingLayout';
import ChildrenPreparingBackpackBroIllustration from '../../components/onboarding/ChildrenPreparingBackpackBroIllustration';
import { getData, setData } from '../../lib/storage';
import { getCurrencySymbol } from '../../lib/currency';
import { C, T, R } from '../../constants/onboarding-theme';
import QuestionScreen from '../../components/onboarding/QuestionScreen';
import AnimatedSlideIn from '../../components/onboarding/AnimatedSlideIn';
import LabeledInput from '../../components/onboarding/LabeledInput';
import FrequencyPills from '../../components/onboarding/FrequencyPills';
import InputGroup from '../../components/onboarding/InputGroup';
import OnboardingCategoryAccordion from '../../components/onboarding/OnboardingCategoryAccordion';
import ChildrenCostCategoryIcon from '../../components/onboarding/ChildrenCostCategoryIcon';
import AgeGroupPills from '../../components/onboarding/AgeGroupPills';
import OptionalPaymentDatesFields from '../../components/onboarding/OptionalPaymentDatesFields';
import { useSectionExit } from '../../lib/finishOnboardingSection';
import {
  CHILD_COST_CATALOG,
  childAgeGroupLabel,
  childCostCategoriesForAge,
  childCostCategoryLabelKey,
  childCostDisplayName,
  childCostSourceLabelKey,
  normalizeChildCostSourceKey,
} from '../../lib/childrenCostsCatalog';

const FREQUENCIES = ['monthly', 'quarterly', 'annual'];
const FILL_REMOVE_MS = 300;

function childKeyFor(idx) {
  return `child_${idx}`;
}

function selectedFieldKeys(activeFields, childKey) {
  const active = activeFields[childKey] || {};
  return Object.keys(active).filter((k) => active[k]);
}

export default function ChildrenCostsScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const layout = useOnboardingLayout();
  const { isEditMode, completeSection, leaveSection, editContinueLabel } = useSectionExit();

  const [children, setChildren] = useState([]);
  const [step, setStep] = useState('select');
  const [activeTab, setActiveTab] = useState(0);
  const [fillChildIdx, setFillChildIdx] = useState(0);
  const [validationError, setValidationError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const [costsData, setCostsData] = useState({});
  const [activeFields, setActiveFields] = useState({});
  const [visibleFillFields, setVisibleFillFields] = useState({});
  const [expandedCategoryId, setExpandedCategoryId] = useState(null);
  const [customCostPrompt, setCustomCostPrompt] = useState(null);

  const [currencyCode, setCurrencyCode] = useState('CZK');
  const currency = getCurrencySymbol(currencyCode);

  useEffect(() => {
    (async () => {
      const h = await getData('beaverr_household');
      const loc = await getData('beaverr_location');
      if (loc?.currency) setCurrencyCode(loc.currency);

      if (!h?.children?.length) {
        if (isEditMode) {
          leaveSection(() => {});
        } else {
          navigateForward('/(onboarding)/splash-pets');
        }
        return;
      }

      setChildren(h.children);

      const saved = await getData('beaverr_children_costs');
      const initData = {};
      const initActive = {};

      h.children.forEach((child, idx) => {
        const key = childKeyFor(idx);
        const savedChild = saved?.[key] || {};
        const normalized = {};
        Object.entries(savedChild).forEach(([fieldKey, val]) => {
          const normalizedKey = normalizeChildCostSourceKey(fieldKey);
          normalized[normalizedKey] = {
            amount: val?.amount != null ? String(val.amount) : '',
            frequency: val?.frequency || 'monthly',
            customLabel: val?.customLabel || '',
            category: val?.category,
            endDate: val?.endDate || '',
            dueDate: val?.dueDate || '',
            chargeDay: val?.chargeDay != null ? String(val.chargeDay) : '',
          };
          initActive[key] = { ...initActive[key], [normalizedKey]: true };
        });
        initData[key] = normalized;
      });

      setCostsData(initData);
      setActiveFields(initActive);
    })();
  }, []);

  const selectChildIndex = activeTab;
  const fillChildIndex = useMemo(() => {
    const indices = children
      .map((_, idx) => idx)
      .filter((idx) => selectedFieldKeys(activeFields, childKeyFor(idx)).length > 0);
    return indices[fillChildIdx] ?? indices[0] ?? 0;
  }, [children, activeFields, fillChildIdx]);

  const childrenWithSelections = useMemo(() => children
    .map((_, idx) => idx)
    .filter((idx) => selectedFieldKeys(activeFields, childKeyFor(idx)).length > 0),
  [children, activeFields]);

  const totalSelectedCount = useMemo(() => childrenWithSelections.reduce(
    (sum, idx) => sum + selectedFieldKeys(activeFields, childKeyFor(idx)).length,
    0,
  ), [children, activeFields, childrenWithSelections]);

  const currentChildIndex = step === 'select' ? selectChildIndex : fillChildIndex;
  const currentChild = children[currentChildIndex];
  const childKey = currentChild ? childKeyFor(currentChildIndex) : null;

  const toggleField = (categoryId, field) => {
    if (!childKey) return;
    const isActive = activeFields[childKey]?.[field];
    if (isActive) {
      setActiveFields((prev) => ({
        ...prev,
        [childKey]: { ...prev[childKey], [field]: false },
      }));
      return;
    }

    setCostsData((prev) => ({
      ...prev,
      [childKey]: {
        ...prev[childKey],
        [field]: prev[childKey]?.[field] || { amount: '', frequency: 'monthly', customLabel: '' },
      },
    }));
    setActiveFields((prev) => ({
      ...prev,
      [childKey]: { ...prev[childKey], [field]: true },
    }));
    setVisibleFillFields((prev) => {
      if (!prev[childKey]?.[field]) return prev;
      const nextChild = { ...prev[childKey] };
      delete nextChild[field];
      return { ...prev, [childKey]: nextChild };
    });
  };

  const deactivateField = (field, removeData = false) => {
    if (!childKey) return;
    if (removeData) {
      setCostsData((prev) => {
        const childData = { ...prev[childKey] };
        delete childData[field];
        return { ...prev, [childKey]: childData };
      });
    }
    setActiveFields((prev) => ({
      ...prev,
      [childKey]: { ...prev[childKey], [field]: false },
    }));
    setFieldErrors((prev) => {
      if (!prev[childKey]?.[field]) return prev;
      const nextChild = { ...prev[childKey] };
      delete nextChild[field];
      return { ...prev, [childKey]: nextChild };
    });
  };

  const addCustomToCategory = (categoryId) => {
    setExpandedCategoryId(categoryId);
    setCustomCostPrompt({ category: categoryId, name: '' });
  };

  const toggleCategoryExpanded = (categoryId) => {
    if (expandedCategoryId === categoryId) {
      if (customCostPrompt?.category === categoryId) setCustomCostPrompt(null);
      setExpandedCategoryId(null);
      return;
    }
    if (customCostPrompt) setCustomCostPrompt(null);
    setExpandedCategoryId(categoryId);
  };

  const confirmCustomCost = () => {
    if (!childKey) return;
    const categoryId = customCostPrompt?.category;
    const name = customCostPrompt?.name?.trim();
    if (!name || !categoryId) {
      setCustomCostPrompt(null);
      return;
    }
    let newKey = null;
    setCostsData((prev) => {
      const childData = { ...prev[childKey] };
      let otherIdx = 1;
      while (childData[`other_${otherIdx}`]) otherIdx += 1;
      newKey = `other_${otherIdx}`;
      childData[newKey] = {
        amount: '',
        frequency: 'monthly',
        customLabel: name,
        category: categoryId,
      };
      return { ...prev, [childKey]: childData };
    });
    setCustomCostPrompt(null);
    setTimeout(() => {
      if (newKey) {
        setActiveFields((prev) => ({
          ...prev,
          [childKey]: { ...prev[childKey], [newKey]: true },
        }));
      }
    }, 50);
  };

  const updateChildAgeGroup = (nextAgeGroup) => {
    setChildren((prev) => prev.map((child, idx) => (
      idx === selectChildIndex ? { ...child, ageGroup: nextAgeGroup } : child
    )));
    setExpandedCategoryId(null);
    setCustomCostPrompt(null);
  };

  const persistChildrenCosts = async () => {
    const household = await getData('beaverr_household');
    if (household) {
      await setData('beaverr_household', { ...household, children });
    }
    await completeSection({
      persist: async () => { await setData('beaverr_children_costs', costsData); },
      onboardingPatch: { completed: false, currentStep: 'childrenCosts', percentComplete: 78 },
      nextRoute: '/(onboarding)/splash-pets',
      routeName: 'childrenCosts',
    });
  };

  const validateFillChild = (childIdx) => {
    const key = childKeyFor(childIdx);
    const active = activeFields[key] || {};
    const data = costsData[key] || {};
    const nextErrors = {};
    selectedFieldKeys(activeFields, key).forEach((field) => {
      const amount = String(data[field]?.amount ?? '').trim();
      if (!amount || !Number.isFinite(parseFloat(amount)) || parseFloat(amount) <= 0) {
        nextErrors[field] = t('onboarding.childrenCosts.childrenCosts.validation');
      }
    });
    setFieldErrors((prev) => ({ ...prev, [key]: nextErrors }));
    return Object.keys(nextErrors).length === 0;
  };

  const handleContinue = async () => {
    setValidationError('');

    if (step === 'select') {
      if (selectChildIndex < children.length - 1) {
        setActiveTab(selectChildIndex + 1);
        setExpandedCategoryId(null);
        setCustomCostPrompt(null);
        return;
      }

      if (totalSelectedCount === 0) {
        await persistChildrenCosts();
        return;
      }

      setFillChildIdx(0);
      setStep('fill');
      return;
    }

    if (!validateFillChild(fillChildIndex)) return;

    if (fillChildIdx < childrenWithSelections.length - 1) {
      setFillChildIdx((i) => i + 1);
      return;
    }

    await persistChildrenCosts();
  };

  const handleBack = async () => {
    setValidationError('');
    setFieldErrors({});

    if (step === 'fill') {
      if (fillChildIdx > 0) {
        setFillChildIdx((i) => i - 1);
        return;
      }
      setStep('select');
      setActiveTab(children.length - 1);
      return;
    }

    if (selectChildIndex > 0) {
      setActiveTab(selectChildIndex - 1);
      setExpandedCategoryId(null);
      setCustomCostPrompt(null);
      return;
    }

    await setData('beaverr_children_costs', costsData);
    const household = await getData('beaverr_household');
    if (household) {
      await setData('beaverr_household', { ...household, children });
    }
    leaveSection(() => navigateBack());
  };

  const sourceLabel = (sourceKey) => {
    const key = childCostSourceLabelKey(sourceKey);
    const translated = t(key);
    return translated !== key ? translated : sourceKey;
  };

  const categoryTitle = (categoryId) => {
    const key = childCostCategoryLabelKey(categoryId);
    const translated = t(key);
    return translated !== key ? translated : categoryId;
  };

  const orderedSelectedFields = (childIdx) => {
    const key = childKeyFor(childIdx);
    const data = costsData[key] || {};
    const childAge = children[childIdx]?.ageGroup || '6-15';
    const catalog = CHILD_COST_CATALOG[childAge] || {};
    const orderedKeys = childCostCategoriesForAge(childAge).flatMap((cat) => catalog[cat] || []);
    const keys = orderedKeys.filter((field) => activeFields[key]?.[field]);
    Object.keys(data).forEach((field) => {
      if (activeFields[key]?.[field] && !keys.includes(field)) keys.push(field);
    });
    return keys;
  };

  const removeFillField = (childIdx, field, removeData) => {
    const key = childKeyFor(childIdx);
    setVisibleFillFields((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: false },
    }));
    setTimeout(() => {
      if (removeData) {
        setCostsData((prev) => {
          const childData = { ...prev[key] };
          delete childData[field];
          return { ...prev, [key]: childData };
        });
      }
      setActiveFields((prev) => ({
        ...prev,
        [key]: { ...prev[key], [field]: false },
      }));
      setFieldErrors((prev) => {
        if (!prev[key]?.[field]) return prev;
        const nextChild = { ...prev[key] };
        delete nextChild[field];
        return { ...prev, [key]: nextChild };
      });
      setVisibleFillFields((prev) => {
        const next = { ...prev };
        if (next[key]) {
          const childNext = { ...next[key] };
          delete childNext[field];
          next[key] = childNext;
        }
        return next;
      });
    }, FILL_REMOVE_MS);
  };

  const renderFillForms = (childIdx) => {
    const key = childKeyFor(childIdx);
    const data = costsData[key] || {};
    const errors = fieldErrors[key] || {};

    const updateChildField = (field, updates) => {
      setCostsData((prev) => ({
        ...prev,
        [key]: {
          ...prev[key],
          [field]: { ...prev[key]?.[field], ...updates },
        },
      }));
      setFieldErrors((prev) => {
        if (!prev[key]?.[field]) return prev;
        const nextChild = { ...prev[key] };
        delete nextChild[field];
        return { ...prev, [key]: nextChild };
      });
    };

    const removeChildField = (field, removeData) => {
      removeFillField(childIdx, field, removeData);
    };

    return orderedSelectedFields(childIdx).map((field) => {
      const isOther = field.startsWith('other_');
      const label = childCostDisplayName(field, data[field]?.customLabel, t);
      const showCard = visibleFillFields[key]?.[field] !== false;

      return (
        <AnimatedSlideIn key={field} visible={showCard}>
          <InputGroup
            label={label}
            onRemove={isOther ? () => removeChildField(field, true) : () => removeChildField(field, false)}
            style={{ marginBottom: 16 }}
          >
            <LabeledInput
              value={data[field]?.amount || ''}
              onChangeText={(v) => updateChildField(field, { amount: v })}
              numeric
              placeholder={t('onboarding.childrenCosts.childrenCosts.amountPlaceholder')}
              large
              inGroup
              currency={currency}
              errorText={errors[field]}
            />
            <FrequencyPills
              options={FREQUENCIES}
              value={data[field]?.frequency || 'monthly'}
              onChange={(freq) => updateChildField(field, { frequency: freq })}
              small
            />
            <OptionalPaymentDatesFields
              values={data[field] || {}}
              onChange={(patch) => updateChildField(field, patch)}
              compact
            />
          </InputGroup>
        </AnimatedSlideIn>
      );
    });
  };

  const renderCategoryAccordions = (childIdx) => {
    const key = childKeyFor(childIdx);
    const childAge = children[childIdx]?.ageGroup || '6-15';
    const catalog = CHILD_COST_CATALOG[childAge] || {};
    const categories = childCostCategoriesForAge(childAge);
    const data = costsData[key] || {};
    const active = activeFields[key] || {};
    const selectedCount = selectedFieldKeys(activeFields, key).length;

    return (
      <>
        <Text style={{ ...T.fieldLabel, color: C.muted, marginBottom: 10 }}>
          {t('onboarding.childrenCosts.childrenCosts.browseCategories')}
        </Text>

        {categories.map((categoryId) => {
          const keys = catalog[categoryId] || [];
          const countLabel = t('onboarding.childrenCosts.childrenCosts.suggestionCount', { count: keys.length });
          const customItems = Object.entries(data)
            .filter(([field, val]) => (
              field.startsWith('other_')
              && active[field]
              && val?.category === categoryId
              && val?.customLabel?.trim()
            ))
            .map(([field, val]) => ({ id: field, customName: val.customLabel }));

          return (
            <OnboardingCategoryAccordion
              key={categoryId}
              categoryId={categoryId}
              title={categoryTitle(categoryId)}
              suggestionCount={countLabel}
              selectedCountLabel={(count) => t('onboarding.childrenCosts.childrenCosts.selectedInCategory', { count })}
              itemKeys={keys}
              itemLabel={sourceLabel}
              isItemSelected={(catId, field) => Boolean(activeFields[key]?.[field])}
              onToggleItem={(_, field) => toggleField(categoryId, field)}
              onAddCustom={addCustomToCategory}
              addCustomLabel={t('common.add')}
              expanded={expandedCategoryId === categoryId}
              onToggleExpanded={toggleCategoryExpanded}
              customItems={customItems}
              onRemoveCustomItem={(id) => deactivateField(id, true)}
              showCustomInput={customCostPrompt?.category === categoryId}
              customName={customCostPrompt?.category === categoryId ? customCostPrompt.name : ''}
              onCustomNameChange={(name) => setCustomCostPrompt((p) => ({ ...p, name }))}
              onConfirmCustom={confirmCustomCost}
              onCancelCustom={() => setCustomCostPrompt(null)}
              customPlaceholder={t('onboarding.childrenCosts.childrenCosts.customCostPlaceholder')}
              customAccessibilityLabel={t('onboarding.childrenCosts.childrenCosts.addAnother')}
              cancelAccessibilityLabel={t('common.cancel')}
              renderIcon={(id) => <ChildrenCostCategoryIcon categoryId={id} size={40} />}
            />
          );
        })}

        {selectedCount > 0 ? (
          <View style={{
            marginTop: 16,
            padding: 16,
            borderRadius: R.card,
            borderWidth: 1,
            borderColor: C.border,
            backgroundColor: C.surface,
          }}>
            <Text style={{ ...T.fieldLabel, color: C.muted, marginBottom: 10 }}>
              {t('onboarding.childrenCosts.childrenCosts.addedSoFar', { count: selectedCount })}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {selectedFieldKeys(activeFields, key).map((field) => (
                <View
                  key={field}
                  style={{
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    borderRadius: R.pill,
                    backgroundColor: C.pillSelectedBg,
                  }}
                >
                  <Text style={{ fontSize: 12, color: C.pillSelectedText, fontWeight: '500' }}>
                    {childCostDisplayName(field, data[field]?.customLabel, t)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}
      </>
    );
  };

  const renderSelectStep = () => {
    const child = children[selectChildIndex];
    if (!child) return null;
    const childAge = child.ageGroup || '6-15';

    return (
      <>
        {children.length > 1 ? (
          <View style={{
            flexDirection: 'row',
            borderRadius: R.input,
            borderWidth: 1,
            borderColor: C.border,
            overflow: 'hidden',
            marginBottom: 16,
          }}>
            {children.map((c, idx) => (
              <OnboardingPressable
                key={idx}
                onPress={() => {
                  setActiveTab(idx);
                  setValidationError('');
                  setExpandedCategoryId(null);
                  setCustomCostPrompt(null);
                }}
                style={({ pressed, hovered }) => ({
                  flex: 1,
                  paddingVertical: 14,
                  paddingHorizontal: 12,
                  backgroundColor: listRowBg({ pressed, hovered, selected: selectChildIndex === idx }),
                  alignItems: 'center',
                })}
              >
                <Text style={{
                  fontSize: 13,
                  fontWeight: '500',
                  color: selectChildIndex === idx ? C.primary : C.muted,
                }}>
                  {c.displayName || `${t('onboarding.childrenCosts.child')} ${idx + 1}`}
                </Text>
              </OnboardingPressable>
            ))}
          </View>
        ) : null}

        <AgeGroupPills
          label={t('onboarding.childrenCosts.childrenCosts.ageGroupLabel')}
          value={childAge}
          onChange={updateChildAgeGroup}
        />

        {renderCategoryAccordions(selectChildIndex)}
      </>
    );
  };

  const renderFillStep = () => {
    const child = children[fillChildIndex];
    if (!child) return null;
    const childName = child.displayName || `${t('onboarding.childrenCosts.child')} ${fillChildIndex + 1}`;

    return (
      <View>
        <Text style={{ ...T.helper, color: C.muted, marginBottom: 16 }}>
          {t('onboarding.childrenCosts.childrenCosts.fillChildProgress', {
            name: childName,
            current: fillChildIdx + 1,
            total: childrenWithSelections.length,
          })}
        </Text>
        {renderFillForms(fillChildIndex)}
      </View>
    );
  };

  const progress = 78;
  const screenProgress = isEditMode ? undefined : progress;

  const selectChild = children[selectChildIndex];
  const fillChild = children[fillChildIndex];
  const selectChildName = selectChild?.displayName
    || `${t('onboarding.childrenCosts.child')} ${selectChildIndex + 1}`;
  const fillChildName = fillChild?.displayName
    || `${t('onboarding.childrenCosts.child')} ${fillChildIndex + 1}`;

  const title = step === 'select'
    ? t('onboarding.childrenCosts.childrenCosts.title', { name: selectChildName })
    : t('onboarding.childrenCosts.childrenCosts.fillTitle', { name: fillChildName });

  const helper = step === 'select'
    ? t('onboarding.childrenCosts.childrenCosts.helper', {
      name: selectChildName,
      ageGroup: childAgeGroupLabel(selectChild?.ageGroup || '6-15', t),
    })
    : t('onboarding.childrenCosts.childrenCosts.fillHelper', { name: fillChildName });

  return (
    <QuestionScreen
      illustration={<ChildrenPreparingBackpackBroIllustration width={layout.illustrationWidth} />}
      chapter={t('onboarding.childrenCosts.chapter')}
      title={title}
      helper={helper}
      onContinue={handleContinue}
      onBack={handleBack}
      validationError={step === 'select' ? validationError : ''}
      setValidationError={setValidationError}
      continueLabel={editContinueLabel}
      animationKey={step === 'fill' ? `fill-${fillChildIdx}` : `select-${selectChildIndex}`}
    >
      {step === 'select' ? renderSelectStep() : renderFillStep()}
    </QuestionScreen>
  );
}
