import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useI18n } from '../../../lib/i18n';
import { getData } from '../../../lib/storage';
import { SECTION_STORAGE_KEYS, parseAmount, amountToString } from '../../../lib/sectionEditStorage';
import {
  GOAL_INTENTS,
  SAVE_MODES,
  DEFAULT_GOAL_INTENTS,
  buildIncomeGoalPayload,
  goalIntentsIncludeSaving,
  hasAnyGoalIntent,
  restoreGoalSelection,
  toggleGoalIntent,
} from '../../../lib/incomeGoals';
import { C, T } from '../../../constants/onboarding-theme';
import SectionEditForm from '../SectionEditForm';
import FocusGate from '../FocusGate';
import { useSectionEditFocus } from '../../../lib/SectionEditFocusContext';
import AmountFrequencyFields from '../AmountFrequencyFields';
import LabeledInput from '../../onboarding/LabeledInput';
import InputGroup from '../../onboarding/InputGroup';
import OptionCard from '../../onboarding/OptionCard';
import SplitDateFields from '../../onboarding/SplitDateFields';

function toEditState(saved) {
  const s = saved || {};
  const restoredGoal = restoreGoalSelection(s);
  return {
    amount: amountToString(s.amount),
    frequency: s.frequency || 'monthly',
    partnerAmount: amountToString(s.partnerAmount),
    partnerFrequency: s.partnerFrequency || 'monthly',
    savingsBalance: amountToString(s.savingsBalance),
    savingsMonthlyTarget: amountToString(s.savingsMonthlyTarget),
    goalIntents: restoredGoal.goalIntents,
    saveMode: restoredGoal.saveMode,
    goalDescription: s.goalDescription || '',
    goalAmount: amountToString(s.goalAmount),
    goalDate: s.goalDate || '',
    otherIncomeRows: (s.otherIncomeRows || []).map((r, i) => ({
      id: i,
      amount: amountToString(r.amount),
      frequency: r.frequency || 'monthly',
      label: r.label || '',
    })),
    hasOtherIncome: s.hasOtherIncome === true,
  };
}

function toPayload(draft) {
  return {
    amount: parseAmount(draft.amount),
    frequency: draft.frequency,
    partnerAmount: parseAmount(draft.partnerAmount),
    partnerFrequency: draft.partnerFrequency,
    hasOtherIncome: draft.hasOtherIncome,
    otherIncomeRows: draft.hasOtherIncome
      ? draft.otherIncomeRows.map((r) => ({
        amount: parseAmount(r.amount),
        frequency: r.frequency,
        label: r.label || null,
      }))
      : [],
    ...buildIncomeGoalPayload({
      goalIntents: draft.goalIntents,
      saveMode: draft.saveMode,
      savingsBalance: draft.savingsBalance,
      savingsMonthlyTarget: draft.savingsMonthlyTarget,
      goalDescription: draft.goalDescription,
      goalAmount: draft.goalAmount,
      goalDate: draft.goalDate,
    }),
  };
}

export default function IncomeEdit() {
  const { t } = useI18n();
  const { focusKey } = useSectionEditFocus();
  const [hasPartner, setHasPartner] = useState(false);

  useEffect(() => {
    getData('beaverr_household').then((h) => {
      setHasPartner(h?.type === 'partner' || h?.type === 'single_parent');
    });
  }, []);

  return (
    <SectionEditForm
      storageKey={SECTION_STORAGE_KEYS.income}
      initialData={toEditState(null)}
      loadTransform={(saved) => toEditState(saved)}
      transformBeforeSave={(draft) => toPayload(draft)}
      validate={(draft, tr) => {
        if (focusKey?.startsWith('otherIncome-')) {
          const idx = parseInt(focusKey.replace('otherIncome-', ''), 10);
          const row = draft.otherIncomeRows?.[idx];
          if (!parseAmount(row?.amount)) {
            return tr('onboarding.income.otherIncome.validationOtherAmount');
          }
          if (!row?.label?.trim()) {
            return tr('onboarding.income.otherIncome.validationOtherLabel');
          }
          return null;
        }
        if (focusKey === 'userIncome') {
          if (!parseAmount(draft.amount)) return tr('sectionEdit.income.validation.amount');
          return null;
        }
        if (focusKey === 'partnerIncome' || focusKey === 'savingsBalance') return null;
        if (focusKey === 'goals') {
          if (!hasAnyGoalIntent(draft.goalIntents)) {
            return tr('onboarding.strategy.goalIntents.validationType');
          }
          if (goalIntentsIncludeSaving(draft.goalIntents)) {
            if (!draft.saveMode) return tr('sectionEdit.income.validation.saveMode');
            if (draft.saveMode === SAVE_MODES.TARGET && !parseAmount(draft.goalAmount)) {
              return tr('sectionEdit.income.validation.goal');
            }
            if (draft.saveMode === SAVE_MODES.ONGOING && !parseAmount(draft.savingsMonthlyTarget)) {
              return tr('sectionEdit.income.validation.ongoing');
            }
          }
          return null;
        }
        if (focusKey) return null;
        if (!parseAmount(draft.amount)) return tr('sectionEdit.income.validation.amount');
        if (!hasAnyGoalIntent(draft.goalIntents)) {
          return tr('onboarding.strategy.goalIntents.validationType');
        }
        if (goalIntentsIncludeSaving(draft.goalIntents)) {
          if (!draft.saveMode) return tr('sectionEdit.income.validation.saveMode');
          if (draft.saveMode === SAVE_MODES.TARGET && !parseAmount(draft.goalAmount)) {
            return tr('sectionEdit.income.validation.goal');
          }
          if (draft.saveMode === SAVE_MODES.ONGOING && !parseAmount(draft.savingsMonthlyTarget)) {
            return tr('sectionEdit.income.validation.ongoing');
          }
        }
        return null;
      }}
    >
      {({ data, setData, currency }) => {
        if (!data) return null;
        const update = (patch) => setData((prev) => ({ ...prev, ...patch }));
        const goalIntents = data.goalIntents || { ...DEFAULT_GOAL_INTENTS };
        const includesSaving = goalIntentsIncludeSaving(goalIntents);

        return (
          <View>
            {!focusKey ? (
              <Text style={{ ...T.helper, color: C.muted, marginBottom: 16 }}>
                {t('sectionEdit.income.helper')}
              </Text>
            ) : null}

            <FocusGate focusKey="userIncome">
            <AmountFrequencyFields
              label={t('sectionEdit.income.yourIncome')}
              amount={data.amount}
              frequency={data.frequency}
              onAmountChange={(v) => update({ amount: v })}
              onFrequencyChange={(v) => update({ frequency: v })}
              currency={currency}
              frequencyOptions={['weekly', 'fortnightly', 'monthly', 'annual']}
            />
            </FocusGate>

            <FocusGate focusKey="partnerIncome">
            {hasPartner ? (
              <AmountFrequencyFields
                label={t('sectionEdit.income.partnerIncome')}
                amount={data.partnerAmount}
                frequency={data.partnerFrequency}
                onAmountChange={(v) => update({ partnerAmount: v })}
                onFrequencyChange={(v) => update({ partnerFrequency: v })}
                currency={currency}
                frequencyOptions={['weekly', 'fortnightly', 'monthly', 'annual']}
              />
            ) : null}
            </FocusGate>

            {(data.otherIncomeRows || []).map((row, idx) => (
              <FocusGate key={row.id ?? idx} focusKey={`otherIncome-${idx}`}>
                <LabeledInput
                  label={t('onboarding.income.otherIncome.nameLabel')}
                  value={row.label}
                  onChangeText={(v) => {
                    const next = [...(data.otherIncomeRows || [])];
                    next[idx] = { ...next[idx], label: v };
                    update({ otherIncomeRows: next, hasOtherIncome: true });
                  }}
                  placeholder={t('onboarding.income.otherIncome.namePlaceholder')}
                />
                <AmountFrequencyFields
                  label={t('onboarding.income.otherIncome.amountLabel')}
                  amount={row.amount}
                  frequency={row.frequency}
                  onAmountChange={(v) => {
                    const next = [...(data.otherIncomeRows || [])];
                    next[idx] = { ...next[idx], amount: v };
                    update({ otherIncomeRows: next, hasOtherIncome: true });
                  }}
                  onFrequencyChange={(v) => {
                    const next = [...(data.otherIncomeRows || [])];
                    next[idx] = { ...next[idx], frequency: v };
                    update({ otherIncomeRows: next, hasOtherIncome: true });
                  }}
                  currency={currency}
                  frequencyOptions={['weekly', 'fortnightly', 'monthly', 'annual']}
                />
              </FocusGate>
            ))}

            <FocusGate focusKey="savingsBalance">
            <InputGroup label={t('sectionEdit.income.savingsBalance')}>
              <LabeledInput
                value={data.savingsBalance}
                onChangeText={(v) => update({ savingsBalance: v })}
                numeric
                large
                inGroup
                currency={currency}
              />
            </InputGroup>
            </FocusGate>

            <FocusGate focusKey="goals">
            <Text style={{ ...T.fieldLabel, marginBottom: 8 }}>{t('sectionEdit.income.goalType')}</Text>
            <OptionCard
              icon="🔍"
              label={t('onboarding.strategy.goalIntents.intentClarity')}
              subtitle={t('onboarding.strategy.goalIntents.intentClarityDesc')}
              selected={goalIntents.clarity}
              onPress={() => update({
                goalIntents: toggleGoalIntent(goalIntents, GOAL_INTENTS.CLARITY),
              })}
            />
            <OptionCard
              icon="📉"
              label={t('onboarding.strategy.goalIntents.intentSpendLess')}
              subtitle={t('onboarding.strategy.goalIntents.intentSpendLessDesc')}
              selected={goalIntents.spendLess}
              onPress={() => update({
                goalIntents: toggleGoalIntent(goalIntents, GOAL_INTENTS.SPEND_LESS),
              })}
            />
            <OptionCard
              icon="📈"
              label={t('onboarding.strategy.goalIntents.intentBuildMore')}
              subtitle={t('onboarding.strategy.goalIntents.intentBuildMoreDesc')}
              selected={goalIntents.buildMore}
              onPress={() => {
                const next = toggleGoalIntent(goalIntents, GOAL_INTENTS.BUILD_MORE);
                update({
                  goalIntents: next,
                  saveMode: next.buildMore ? data.saveMode : null,
                });
              }}
            />

            {includesSaving ? (
              <View style={{ marginTop: 8 }}>
                <Text style={{ ...T.fieldLabel, marginBottom: 8 }}>{t('sectionEdit.income.saveMode')}</Text>
                <OptionCard
                  label={t('onboarding.strategy.goalMode.target')}
                  selected={data.saveMode === SAVE_MODES.TARGET}
                  onPress={() => update({ saveMode: SAVE_MODES.TARGET })}
                />
                <OptionCard
                  label={t('onboarding.strategy.goalMode.ongoing')}
                  selected={data.saveMode === SAVE_MODES.ONGOING}
                  onPress={() => update({ saveMode: SAVE_MODES.ONGOING })}
                />

                {data.saveMode === SAVE_MODES.TARGET ? (
                  <View>
                    <LabeledInput
                      label={t('sectionEdit.income.goalDescription')}
                      value={data.goalDescription}
                      onChangeText={(v) => update({ goalDescription: v })}
                    />
                    <InputGroup label={t('sectionEdit.income.goalAmount')}>
                      <LabeledInput
                        value={data.goalAmount}
                        onChangeText={(v) => update({ goalAmount: v })}
                        numeric
                        large
                        inGroup
                        currency={currency}
                      />
                    </InputGroup>
                    <Text style={{ ...T.fieldLabel, marginBottom: 8 }}>{t('sectionEdit.income.goalDate')}</Text>
                    <SplitDateFields
                      value={data.goalDate}
                      onChange={(v) => update({ goalDate: v })}
                      yearEnd={new Date().getFullYear() + 30}
                    />
                  </View>
                ) : null}

                {data.saveMode === SAVE_MODES.ONGOING ? (
                  <InputGroup label={t('sectionEdit.income.savingsMonthly')}>
                    <LabeledInput
                      value={data.savingsMonthlyTarget}
                      onChangeText={(v) => update({ savingsMonthlyTarget: v })}
                      numeric
                      large
                      inGroup
                      currency={currency}
                    />
                  </InputGroup>
                ) : null}
              </View>
            ) : null}
            </FocusGate>
          </View>
        );
      }}
    </SectionEditForm>
  );
}
