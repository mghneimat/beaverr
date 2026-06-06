import { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useI18n } from '../../lib/i18n';
import { getData, setData } from '../../lib/storage';
import { C, S, T, R } from '../../constants/onboarding-theme';
import QuestionScreen from '../../components/onboarding/QuestionScreen';
import PlaceholderIllustration from '../../components/onboarding/PlaceholderIllustration';
import OptionCard from '../../components/onboarding/OptionCard';
import PillToggle from '../../components/onboarding/PillToggle';
import DatePicker from '../../components/onboarding/DatePicker';
import AnimatedSlideIn from '../../components/onboarding/AnimatedSlideIn';
import LabeledInput from '../../components/onboarding/LabeledInput';
import FrequencyPills from '../../components/onboarding/FrequencyPills';

const FREQUENCIES = ['monthly', 'quarterly', 'annual', 'custom'];

/**
 * Calculate end date from start date + months, minus 1 day.
 * Returns "DD/MM/YYYY" string or empty string if inputs are invalid.
 */
function calcEndDate(startDate, months) {
  if (!startDate || !months) return '';
  const parts = startDate.split('/');
  if (parts.length !== 3) return '';
  const d = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const y = parseInt(parts[2], 10);
  const numMonths = parseInt(months, 10);
  if (isNaN(d) || isNaN(m) || isNaN(y) || isNaN(numMonths) || numMonths <= 0) return '';
  const end = new Date(y, m - 1 + numMonths, d - 1);
  const endDay = String(end.getDate()).padStart(2, '0');
  const endMonth = String(end.getMonth() + 1).padStart(2, '0');
  const endYear = String(end.getFullYear());
  return `${endDay}/${endMonth}/${endYear}`;
}

export default function HealthScreen() {
  const { t } = useI18n();
  const router = useRouter();

  const [household, setHousehold] = useState(null);
  const [members, setMembers] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [validationError, setValidationError] = useState('');

  // Per-member health insurance data
  const [memberData, setMemberData] = useState({});

  // ── Loaded data ──
  const [currency, setCurrency] = useState('Kč');

  useEffect(() => {
    (async () => {
      const h = await getData('pocketos_household');
      const loc = await getData('pocketos_location');
      if (loc?.currency) setCurrency(loc.currency);

      setHousehold(h);
      const m = [];
      m.push({ id: 'user', label: t('onboarding.health.you'), ref: 'user' });
      if (h?.partnerName) {
        m.push({ id: 'partner', label: h.partnerName, ref: 'partner' });
      }
      if (h?.children?.length) {
        h.children.forEach((child, idx) => {
          m.push({ id: `child_${idx}`, label: child.displayName || `${t('onboarding.health.child')} ${idx + 1}`, ref: `child_${idx}`, ageGroup: child.ageGroup });
        });
      }
      setMembers(m);

      // Initialise member data
      const initData = {};
      m.forEach(member => {
        initData[member.id] = { confirmed: false };
      });
      setMemberData(initData);
    })();
  }, []);

  const updateMember = (id, updates) => {
    setMemberData(prev => ({ ...prev, [id]: { ...prev[id], ...updates } }));
  };

  const handleContinue = async () => {
    setValidationError('');

    // Check current tab is confirmed or skipped
    const currentMember = members[activeTab];
    if (!currentMember) return;

    const data = memberData[currentMember.id];
    if (!data?.confirmed && !data?.skipped) {
      setValidationError(t('onboarding.health.validation'));
      return;
    }

    // Find the next unresolved member (not confirmed or skipped)
    const nextUnresolved = members.find((m, idx) => {
      if (idx <= activeTab) return false; // skip current and previous
      const d = memberData[m.id];
      return !d?.confirmed && !d?.skipped;
    });

    if (nextUnresolved) {
      // Jump to the first unresolved member
      setActiveTab(members.indexOf(nextUnresolved));
      return;
    }

    // All members resolved — save and proceed
    await setData('pocketos_health', memberData);
    await setData('pocketos_onboarding', {
      completed: false,
      currentStep: 'health',
      percentComplete: 75,
    });

    // Check if children exist → S7 splash, else skip to S8
    if (household?.children?.length > 0) {
      router.replace('/(onboarding)/splash-children');
    } else {
      router.replace('/(onboarding)/splash-pets');
    }
  };

  const handleBack = () => {
    setValidationError('');
    if (activeTab > 0) {
      setActiveTab(activeTab - 1);
    } else {
      // On the first member — navigate back to the health splash screen
      router.replace('/(onboarding)/splash-health');
    }
  };

  const progress = 75;
  const progressLabel = t('onboarding.progress', { percent: progress });

  /** Persistent option cards — lives outside renderMemberForm so its
   *  Animated.Value refs survive tab switches, enabling smooth
   *  collapse/expand transitions between members. */
  const renderOptionCards = () => {
    const member = members[activeTab];
    if (!member) return null;
    const data = memberData[member.id] || {};

    const isEmployer = data.coverage === 'employer';
    const isPrivate = data.coverage === 'private';
    const isSkipped = data.skipped === true;

    const handleEmployerPress = () => {
      if (isEmployer) {
        updateMember(member.id, { coverage: null, skipped: false, confirmed: false });
      } else {
        updateMember(member.id, { coverage: 'employer', skipped: false, confirmed: true });
      }
      setValidationError('');
    };
    const handlePrivatePress = () => {
      if (isPrivate) {
        updateMember(member.id, { coverage: null, skipped: false, confirmed: false });
      } else {
        updateMember(member.id, { coverage: 'private', skipped: false, confirmed: true });
      }
      setValidationError('');
    };
    const handleSkipPress = () => {
      if (isSkipped) {
        updateMember(member.id, { skipped: false, coverage: null, confirmed: false });
      } else {
        updateMember(member.id, { skipped: true, coverage: null, confirmed: false });
      }
      setValidationError('');
    };

    return (
      <View style={{ marginBottom: 12 }}>
        <AnimatedSlideIn visible={!isPrivate && !isSkipped}>
          <OptionCard
            label={t('onboarding.health.coveredByEmployer')}
            selected={isEmployer}
            onPress={handleEmployerPress}
          />
        </AnimatedSlideIn>
        <AnimatedSlideIn visible={!isEmployer && !isSkipped}>
          <OptionCard
            label={t('onboarding.health.payPrivately')}
            selected={isPrivate}
            onPress={handlePrivatePress}
          />
        </AnimatedSlideIn>
        <AnimatedSlideIn visible={!isEmployer && !isPrivate}>
          <OptionCard
            label={t('common.skip')}
            selected={isSkipped}
            onPress={handleSkipPress}
          />
        </AnimatedSlideIn>
      </View>
    );
  };

  const renderMemberForm = (member) => {
    const data = memberData[member.id] || {};

    // Determine which option is active
    const isEmployer = data.coverage === 'employer';
    const isPrivate = data.coverage === 'private';
    const isSkipped = data.skipped === true;

    return (
      <View>
        {/* ── Employer coverage info ── */}
        <AnimatedSlideIn visible={isEmployer}>
          <View style={{ padding: 16, backgroundColor: C.positiveBg || 'rgba(58,140,110,0.08)', borderRadius: R.card, borderWidth: 1, borderColor: C.positiveBorder || 'rgba(58,140,110,0.2)', marginBottom: 20 }}>
            <Text style={{ ...T.helper, color: C.text }}>
              {t('onboarding.health.coveredByEmployerNote')}
            </Text>
          </View>
        </AnimatedSlideIn>

        {/* ── Private coverage form ── */}
        <AnimatedSlideIn visible={isPrivate}>
          <View style={{ marginBottom: 20 }}>
            {/* Premium */}
            <LabeledInput
              label={t('onboarding.health.premiumLabel')}
              value={data.premium || ''}
              onChangeText={(v) => updateMember(member.id, { premium: v.replace(/[^0-9]/g, '') })}
              numeric
              placeholder={t('onboarding.health.premiumPlaceholder')}
              large
              currency={currency}
            />
            {/* Frequency */}
            <FrequencyPills
              options={FREQUENCIES}
              value={data.frequency}
              onChange={(freq) => updateMember(member.id, { frequency: freq })}
              small
            />
            {/* Custom frequency — months input */}
            <AnimatedSlideIn visible={data.frequency === 'custom'}>
              <LabeledInput
                label={t('onboarding.health.customFrequencyLabel')}
                value={data.customFrequencyMonths || ''}
                onChangeText={(v) => {
                  updateMember(member.id, { customFrequencyMonths: v });
                  if (data.startDate && v) {
                    const endDate = calcEndDate(data.startDate, v);
                    if (endDate) updateMember(member.id, { endDate });
                  }
                }}
                numeric
                placeholder={t('onboarding.health.customFrequencyPlaceholder')}
                large
              />
            </AnimatedSlideIn>
            {/* Start date */}
            <Text style={{ ...T.fieldLabel, color: C.muted, marginBottom: 6, marginTop: 12 }}>
              {t('onboarding.health.startDateLabel')}
            </Text>
            <DatePicker
              value={data.startDate || ''}
              onChange={(v) => {
                updateMember(member.id, { startDate: v });
                if (data.frequency === 'custom' && data.customFrequencyMonths && v) {
                  const endDate = calcEndDate(v, data.customFrequencyMonths);
                  if (endDate) updateMember(member.id, { endDate });
                }
              }}
            />
            {/* Contract type */}
            <Text style={{ ...T.fieldLabel, color: C.muted, marginBottom: 8, marginTop: 12 }}>
              {t('onboarding.health.contractTypeLabel')}
            </Text>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
              <Pressable
                onPress={() => updateMember(member.id, { endDateType: 'ongoing' })}
                style={({ pressed }) => ({
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 8,
                  borderWidth: 1.5,
                  borderColor: data.endDateType === 'ongoing' ? C.primary : C.border,
                  backgroundColor: data.endDateType === 'ongoing' ? C.chipSelectedBg : C.surface,
                  alignItems: 'center',
                })}
              >
                <Text style={{ fontSize: 13, color: data.endDateType === 'ongoing' ? C.primary : C.muted, fontWeight: '500' }}>
                  {t('onboarding.health.ongoing')}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => updateMember(member.id, { endDateType: 'fixed' })}
                style={({ pressed }) => ({
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 8,
                  borderWidth: 1.5,
                  borderColor: data.endDateType === 'fixed' ? C.primary : C.border,
                  backgroundColor: data.endDateType === 'fixed' ? C.chipSelectedBg : C.surface,
                  alignItems: 'center',
                })}
              >
                <Text style={{ fontSize: 13, color: data.endDateType === 'fixed' ? C.primary : C.muted, fontWeight: '500' }}>
                  {t('onboarding.health.fixed')}
                </Text>
              </Pressable>
            </View>
            {/* End date — shown when custom frequency is active */}
            <AnimatedSlideIn visible={data.frequency === 'custom'}>
              <Text style={{ ...T.fieldLabel, color: C.muted, marginBottom: 6 }}>
                {t('onboarding.health.endDateLabel')}
              </Text>
              <DatePicker
                value={data.endDate || ''}
                onChange={(v) => updateMember(member.id, { endDate: v })}
              />
            </AnimatedSlideIn>
          </View>
        </AnimatedSlideIn>
      </View>
    );
  };

  const currentMember = members[activeTab];

  return (
    <QuestionScreen
      chapter={t('onboarding.health.chapter')}
      title={currentMember ? t('onboarding.health.title', { name: currentMember.label }) : t('onboarding.health.title')}
      helper={currentMember ? t('onboarding.health.helper', { name: currentMember.label }) : t('onboarding.health.helper')}
      illustration={<PlaceholderIllustration />}
      onContinue={handleContinue}
      onBack={handleBack}
      validationError={validationError}
      progress={progress}
      progressLabel={progressLabel}
      animationKey={activeTab}
    >
      {/* Tab row — full-width pills */}
      {members.length > 0 && (
        <View style={{ flexDirection: 'row', borderRadius: R.input, borderWidth: 1, borderColor: C.border, overflow: 'hidden', marginBottom: 20 }}>
          {members.map((member, idx) => (
            <Pressable
              key={member.id}
              onPress={() => { setActiveTab(idx); setValidationError(''); }}
              style={{
                flex: 1,
                paddingVertical: 10,
                backgroundColor: activeTab === idx ? C.chipSelectedBg : 'transparent',
                alignItems: 'center',
              }}
            >
              <Text style={{
                fontSize: 13,
                fontWeight: '500',
                color: activeTab === idx ? C.primary : C.muted,
              }}>
                {member.label}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* Persistent option cards — stays mounted across tab switches so
          AnimatedSlideIn refs survive and transitions are smooth */}
      {renderOptionCards()}

      {/* Current member form (employer note / private form) */}
      {currentMember && renderMemberForm(currentMember)}
    </QuestionScreen>
  );
}
