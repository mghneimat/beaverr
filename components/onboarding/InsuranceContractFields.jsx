import { useState, useCallback, useRef } from 'react';
import { View, Text, Platform } from 'react-native';
import { useI18n } from '../../lib/i18n';
import { formatCurrency } from '../../lib/finance';
import { computeRenewalSavingsPlan } from '../../lib/healthInsuranceBudget';
import { mergeContractEndDateAuto } from '../../lib/datePicker';
import { C, R, S, T } from '../../constants/onboarding-theme';
import PillToggle from './PillToggle';
import AnimatedSlideIn from './AnimatedSlideIn';
import RevealAfterToggle from './RevealAfterToggle';
import LabeledInput from './LabeledInput';
import FrequencyPills from './FrequencyPills';
import YesNoToggle from './YesNoToggle';
import InputGroup from './InputGroup';
import OptionCard from './OptionCard';
import SplitDateFields from './SplitDateFields';

const FREQUENCIES = ['monthly', 'quarterly', 'annual', 'custom'];
const SWITCH_FREQUENCIES = ['monthly', 'quarterly', 'annual', 'custom'];

function applyContractEndDateAuto(data, partial) {
  return mergeContractEndDateAuto(data, partial);
}

/**
 * Shared private-insurance contract form — premium, frequency, start/end dates,
 * renewal plan, and prepaid reserve (mirrors health insurance flow).
 *
 * @param {Object} props
 * @param {Object} props.data - Contract field values
 * @param {Function} props.onUpdate - Called with partial updates
 * @param {string} props.currency - Currency symbol
 * @param {number} props.savingsBalance - Current savings for reserve math
 * @param {string} [props.premiumLabelKey] - i18n key for premium group label
 */
export default function InsuranceContractFields({
  data,
  onUpdate,
  currency,
  savingsBalance = 0,
  premiumLabelKey = 'onboarding.health.premiumLabel',
}) {
  const { t } = useI18n();
  const dateFocusCount = useRef(0);
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);

  const handleDateElevatedChange = useCallback((focused) => {
    dateFocusCount.current = Math.max(0, dateFocusCount.current + (focused ? 1 : -1));
    setDateDropdownOpen(dateFocusCount.current > 0);
  }, []);

  const elevatedDateSectionStyle = dateDropdownOpen
    ? {
        zIndex: 200,
        elevation: 12,
        overflow: 'visible',
        ...(Platform.OS === 'web' ? { position: 'relative' } : null),
      }
    : { overflow: 'visible' };

  const followUpSectionStyle = dateDropdownOpen
    ? {
        zIndex: 1,
        ...(Platform.OS === 'web' ? { position: 'relative' } : null),
      }
    : null;

  const showPrepaidReserve = data.endDateType === 'fixed'
    && data.premiumPaidInFull === true
    && !!data.endDate;

  const renderPrepaidReservePanel = ({ lumpPremium, budgetIncluded, onBudgetChange }) => {
    const plan = computeRenewalSavingsPlan({
      premium: lumpPremium,
      endDate: data.endDate,
      savingsBalance,
    });

    return (
      <View style={{ marginTop: 8, marginBottom: S.fieldGap }}>
        <View style={{
          padding: 16,
          backgroundColor: C.infoWashBg,
          borderRadius: R.card,
          borderWidth: 1,
          borderColor: C.border,
          marginBottom: 12,
        }}
        >
          <Text style={{ ...T.helper, color: C.text, marginBottom: 6 }}>
            {t('onboarding.health.renewReserveSummary', {
              amount: formatCurrency(plan.suggestedMonthly, currency),
              months: plan.monthsRemaining,
              total: formatCurrency(plan.totalNeeded, currency),
            })}
          </Text>
          <Text style={{ ...T.caption, color: C.muted }}>
            {t('onboarding.health.renewReserveExplain')}
          </Text>
        </View>

        {plan.isTight ? (
          <View style={{
            padding: 12,
            backgroundColor: C.warningBg || 'rgba(200,140,40,0.1)',
            borderRadius: R.card,
            borderWidth: 1,
            borderColor: C.warningBorder || 'rgba(200,140,40,0.25)',
            marginBottom: 12,
          }}
          >
            <Text style={{ ...T.caption, color: C.text }}>
              {t('onboarding.health.renewReserveTightWarning', {
                shortfall: formatCurrency(plan.shortfall, currency),
                months: plan.monthsRemaining,
              })}
            </Text>
          </View>
        ) : null}

        <Text style={{ ...T.fieldLabel, color: C.muted, marginBottom: 8 }}>
          {t('onboarding.health.budgetForRenewLabel')}
        </Text>
        <Text style={{ ...T.caption, color: C.muted, marginBottom: 10 }}>
          {t('onboarding.health.budgetForRenewHelper')}
        </Text>
        <YesNoToggle
          value={budgetIncluded}
          onChange={onBudgetChange}
        />

        <AnimatedSlideIn visible={budgetIncluded === true}>
          <View style={{ marginTop: 12, paddingBottom: S.fieldGap }}>
            <OptionCard
              label={t('onboarding.health.renewUseSuggested')}
              subtitle={t('onboarding.health.renewUseSuggestedAmount', {
                amount: formatCurrency(plan.suggestedMonthly, currency),
              })}
              selected={data.renewalBudgetMode !== 'custom'}
              onPress={() => onUpdate({ renewalBudgetMode: 'suggested' })}
              style={{ marginBottom: 8 }}
            />
            <OptionCard
              label={t('onboarding.health.renewUseCustom')}
              subtitle={t('onboarding.health.renewUseCustomHelper')}
              selected={data.renewalBudgetMode === 'custom'}
              onPress={() => onUpdate({ renewalBudgetMode: 'custom' })}
              style={{ marginBottom: 0, paddingBottom: 18 }}
            />
          </View>
          <AnimatedSlideIn visible={data.renewalBudgetMode === 'custom'}>
            <InputGroup label={t('onboarding.health.renewCustomMonthlyLabel')} style={{ marginTop: 4 }}>
              <LabeledInput
                value={data.renewalCustomMonthly || ''}
                onChangeText={(v) => onUpdate({ renewalCustomMonthly: v })}
                numeric
                placeholder={t('onboarding.health.renewCustomMonthlyPlaceholder')}
                large
                inGroup
                currency={currency}
              />
            </InputGroup>
          </AnimatedSlideIn>
        </AnimatedSlideIn>
      </View>
    );
  };

  return (
    <View>
      <InputGroup label={t(premiumLabelKey)}>
        <LabeledInput
          value={data.premium || ''}
          onChangeText={(v) => onUpdate({ premium: v })}
          numeric
          placeholder={t('onboarding.health.premiumPlaceholder')}
          large
          inGroup
          currency={currency}
        />
        <FrequencyPills
          options={FREQUENCIES}
          value={data.frequency || 'annual'}
          onChange={(freq) => {
            const partial = { frequency: freq };
            if (freq !== 'custom') partial.customFrequencyMonths = '';
            onUpdate(applyContractEndDateAuto(data, partial));
          }}
          small
        />
      </InputGroup>

      <RevealAfterToggle show={data.frequency === 'custom'} gap={12}>
        <InputGroup label={t('onboarding.health.customFrequencyLabel')} style={{ marginBottom: 0 }}>
          <LabeledInput
            value={data.customFrequencyMonths || ''}
            onChangeText={(v) => {
              const partial = { customFrequencyMonths: v };
              onUpdate(applyContractEndDateAuto(data, partial));
            }}
            numeric
            placeholder={t('onboarding.health.customFrequencyPlaceholder')}
            large
            inGroup
            containerStyle={{ marginBottom: 0 }}
          />
        </InputGroup>
      </RevealAfterToggle>

      <View style={elevatedDateSectionStyle}>
      <InputGroup label={t('onboarding.health.startDateLabel')} style={{ marginTop: 12 }}>
        <SplitDateFields
          value={data.startDate || ''}
          onChange={(v) => onUpdate(applyContractEndDateAuto(data, { startDate: v }))}
          onElevatedChange={handleDateElevatedChange}
          inGroup
          yearEnd={new Date().getFullYear() + 30}
        />
      </InputGroup>

      <Text style={{ ...T.fieldLabel, color: C.muted, marginBottom: 8, marginTop: 12 }}>
        {t('onboarding.health.contractTypeLabel')}
      </Text>
      <View
        accessibilityRole="radiogroup"
        accessibilityLabel={t('onboarding.health.contractTypeLabel')}
        style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}
      >
        <PillToggle
          label={t('onboarding.health.ongoing')}
          selected={data.endDateType === 'ongoing'}
          onPress={() => onUpdate({ endDateType: 'ongoing' })}
          paddingVertical={12}
          paddingHorizontal={12}
          fontSize={13}
          fontWeight="500"
          borderRadius={R.pill}
          minHeight={44}
        />
        <PillToggle
          label={t('onboarding.health.fixed')}
          selected={data.endDateType === 'fixed'}
          onPress={() => onUpdate(applyContractEndDateAuto(data, { endDateType: 'fixed' }))}
          paddingVertical={12}
          paddingHorizontal={12}
          fontSize={13}
          fontWeight="500"
          borderRadius={R.pill}
          minHeight={44}
        />
      </View>

      <AnimatedSlideIn visible={data.frequency === 'custom'}>
        <InputGroup label={t('onboarding.health.endDateLabel')}>
          <SplitDateFields
            value={data.endDate || ''}
            onChange={(v) => onUpdate({ endDate: v })}
            onElevatedChange={handleDateElevatedChange}
            inGroup
            yearEnd={new Date().getFullYear() + 30}
          />
        </InputGroup>
      </AnimatedSlideIn>

      <AnimatedSlideIn visible={data.endDateType === 'fixed' && data.frequency !== 'custom'}>
        <InputGroup label={t('onboarding.health.endDateLabel')} style={{ marginTop: 12 }}>
          <SplitDateFields
            value={data.endDate || ''}
            onChange={(v) => onUpdate({ endDate: v })}
            onElevatedChange={handleDateElevatedChange}
            inGroup
            yearEnd={new Date().getFullYear() + 10}
          />
        </InputGroup>
      </AnimatedSlideIn>
      </View>

      <View style={followUpSectionStyle}>
      <AnimatedSlideIn visible={data.endDateType === 'fixed' && !!data.endDate}>
        <Text style={{ ...T.fieldLabel, color: C.muted, marginBottom: 8, marginTop: 16 }}>
          {t('onboarding.health.premiumPaidInFullLabel')}
        </Text>
        <Text style={{ ...T.caption, color: C.muted, marginBottom: 10 }}>
          {t('onboarding.health.premiumPaidInFullHelper')}
        </Text>
        <YesNoToggle
          value={data.premiumPaidInFull}
          onChange={(v) => {
            const updates = { premiumPaidInFull: v };
            if (v && data.renewalPlan === 'renew') {
              updates.budgetForRenewal = data.budgetForRenewal ?? false;
              updates.renewalBudgetMode = data.renewalBudgetMode || 'suggested';
            }
            if (v && data.renewalPlan === 'switch') {
              updates.budgetForSwitch = data.budgetForSwitch ?? false;
              updates.renewalBudgetMode = data.renewalBudgetMode || 'suggested';
            }
            onUpdate(updates);
          }}
        />
      </AnimatedSlideIn>

      <AnimatedSlideIn visible={data.endDateType === 'fixed'}>
        <Text style={{ ...T.fieldLabel, color: C.muted, marginBottom: 8, marginTop: 16 }}>
          {t('onboarding.health.renewalPlanLabel')}
        </Text>
        {[
          { key: 'renew', label: 'renewalRenew', helper: 'renewalRenewHelper' },
          { key: 'switch', label: 'renewalSwitch', helper: 'renewalSwitchHelper' },
          { key: 'end', label: 'renewalEnd', helper: 'renewalEndHelper' },
        ].map((opt) => (
          <OptionCard
            key={opt.key}
            label={t(`onboarding.health.${opt.label}`)}
            subtitle={t(`onboarding.health.${opt.helper}`)}
            selected={data.renewalPlan === opt.key}
            onPress={() => {
              const updates = { renewalPlan: opt.key };
              if (opt.key === 'renew' && data.premiumPaidInFull === true) {
                updates.budgetForRenewal = data.budgetForRenewal ?? false;
                updates.renewalBudgetMode = data.renewalBudgetMode || 'suggested';
              }
              if (opt.key === 'switch' && data.premiumPaidInFull === true) {
                updates.budgetForSwitch = data.budgetForSwitch ?? false;
                updates.renewalBudgetMode = data.renewalBudgetMode || 'suggested';
              }
              onUpdate(updates);
            }}
            style={{ marginBottom: 8 }}
          />
        ))}
      </AnimatedSlideIn>

      <AnimatedSlideIn
        visible={showPrepaidReserve && data.renewalPlan === 'renew' && !!data.premium}
      >
        {renderPrepaidReservePanel({
          lumpPremium: data.premium,
          budgetIncluded: data.budgetForRenewal,
          onBudgetChange: (v) => onUpdate({
            budgetForRenewal: v,
            renewalBudgetMode: v ? (data.renewalBudgetMode || 'suggested') : 'skip',
            renewalCustomMonthly: v ? data.renewalCustomMonthly : '',
          }),
        })}
      </AnimatedSlideIn>

      <AnimatedSlideIn visible={data.endDateType === 'fixed' && data.renewalPlan === 'switch'}>
        <Text style={{ ...T.caption, color: C.muted, marginBottom: 10, marginTop: 8 }}>
          {t('onboarding.health.switchPlanIntro')}
        </Text>
        <InputGroup label={t('onboarding.health.switchPremiumLabel')}>
          <LabeledInput
            value={data.switchPremiumAmount || ''}
            onChangeText={(v) => onUpdate({ switchPremiumAmount: v })}
            numeric
            placeholder={t('onboarding.health.switchPremiumPlaceholder')}
            large
            inGroup
            currency={currency}
          />
          <Text style={{ ...T.caption, color: C.muted, marginTop: 8, marginBottom: 4 }}>
            {t('onboarding.health.switchPremiumHelper')}
          </Text>
          <FrequencyPills
            options={SWITCH_FREQUENCIES}
            value={data.switchPremiumFrequency || 'monthly'}
            onChange={(freq) => onUpdate({
              switchPremiumFrequency: freq,
              switchCustomFrequencyMonths: freq === 'custom' ? data.switchCustomFrequencyMonths : '',
            })}
            small
          />
          <AnimatedSlideIn visible={data.switchPremiumFrequency === 'custom'}>
            <InputGroup nested label={t('onboarding.health.customFrequencyLabel')}>
              <LabeledInput
                value={data.switchCustomFrequencyMonths || ''}
                onChangeText={(v) => onUpdate({ switchCustomFrequencyMonths: v })}
                numeric
                placeholder={t('onboarding.health.customFrequencyPlaceholder')}
                large
                inGroup
                containerStyle={{ marginBottom: 0 }}
              />
            </InputGroup>
          </AnimatedSlideIn>
          <Text style={{ ...T.caption, color: C.muted, marginTop: 8 }}>
            {t('onboarding.health.switchPremiumFrequencyHelper')}
          </Text>
        </InputGroup>
      </AnimatedSlideIn>

      <AnimatedSlideIn
        visible={showPrepaidReserve && data.renewalPlan === 'switch' && !!data.switchPremiumAmount}
      >
        {renderPrepaidReservePanel({
          lumpPremium: data.switchPremiumAmount,
          budgetIncluded: data.budgetForSwitch,
          onBudgetChange: (v) => onUpdate({
            budgetForSwitch: v,
            renewalBudgetMode: v ? (data.renewalBudgetMode || 'suggested') : 'skip',
            renewalCustomMonthly: v ? data.renewalCustomMonthly : '',
          }),
        })}
      </AnimatedSlideIn>
      </View>
    </View>
  );
}
