import { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView } from 'react-native';
import OnboardingPressable from '../../components/onboarding/OnboardingPressable';
import { listRowBg } from '../../components/onboarding/pressableFeedback';
import { useRouter } from 'expo-router';
import { useI18n } from '../../lib/i18n';
import { navigateBack, navigateForward } from '../../lib/onboardingNavigation';
import { getData, setData } from '../../lib/storage';
import { getCurrencySymbol } from '../../lib/currency';
import { C, S, T, R } from '../../constants/onboarding-theme';
import { useOnboardingLayout } from '../../lib/onboardingLayout';
import InsuranceAmicoIllustration from '../../components/onboarding/InsuranceAmicoIllustration';
import QuestionScreen from '../../components/onboarding/QuestionScreen';
import OptionCard from '../../components/onboarding/OptionCard';
import PillToggle from '../../components/onboarding/PillToggle';
import AnimatedSlideIn from '../../components/onboarding/AnimatedSlideIn';
import InsuranceContractFields from '../../components/onboarding/InsuranceContractFields';
import { useSectionExit } from '../../lib/finishOnboardingSection';

export default function HealthScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const layout = useOnboardingLayout();
  const { isEditMode, completeSection, leaveSection, editContinueLabel } = useSectionExit();

  const [household, setHousehold] = useState(null);
  const [occupation, setOccupation] = useState(null);
  const [members, setMembers] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [validationError, setValidationError] = useState('');

  // Per-member health insurance data
  const [memberData, setMemberData] = useState({});

  // ── Loaded data ──
  const [currencyCode, setCurrencyCode] = useState('CZK');
  const [savingsBalance, setSavingsBalance] = useState(0);
  const currency = getCurrencySymbol(currencyCode);

  useEffect(() => {
    (async () => {
      const h = await getData('beaverr_household');
      const occ = await getData('beaverr_occupation');
      const loc = await getData('beaverr_location');
      const income = await getData('beaverr_income');
      if (loc?.currency) setCurrencyCode(loc.currency);
      if (income?.savingsBalance != null) {
        setSavingsBalance(Number(income.savingsBalance) || 0);
      }
      if (occ) setOccupation(occ);

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

  const persistHealth = async () => {
    const prunedHealth = {};
    members.forEach((member) => {
      if (memberData[member.id]) {
        prunedHealth[member.id] = memberData[member.id];
      }
    });
    await completeSection({
      persist: async () => { await setData('beaverr_health', prunedHealth); },
      onboardingPatch: { completed: false, currentStep: 'health', percentComplete: 75 },
      nextRoute: household?.children?.length > 0
        ? '/(onboarding)/splash-children'
        : '/(onboarding)/splash-pets',
      routeName: 'health',
    });
  };

  const handleContinue = async () => {
    setValidationError('');

    if (isEditMode) {
      await persistHealth();
      return;
    }

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

    await persistHealth();
  };

  const handleBack = () => {
    setValidationError('');
    if (activeTab > 0) {
      setActiveTab(activeTab - 1);
    } else {
      leaveSection(() => navigateBack());
    }
  };

  const progress = 75;
  const screenProgress = isEditMode ? undefined : progress;

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

  const isMemberEmployee = (member) => {
    if (!occupation) return false;
    if (member.ref === 'user') return occupation.user === 'employee';
    if (member.ref === 'partner') return occupation.partner === 'employee';
    return false;
  };

  const renderMemberForm = (member) => {
    const data = memberData[member.id] || {};

    // Determine which option is active
    const isEmployer = data.coverage === 'employer';
    const isPrivate = data.coverage === 'private';
    const showEmployerNote = isEmployer && isMemberEmployee(member);

    return (
      <View>
        {/* ── Employer coverage info (employees only) ── */}
        <AnimatedSlideIn visible={showEmployerNote}>
          <View style={{ padding: 16, backgroundColor: C.positiveBg || 'rgba(58,140,110,0.08)', borderRadius: R.card, borderWidth: 1, borderColor: C.positiveBorder || 'rgba(58,140,110,0.2)', marginBottom: 20 }}>
            <Text style={{ ...T.helper, color: C.text }}>
              {t('onboarding.health.coveredByEmployerNote')}
            </Text>
          </View>
        </AnimatedSlideIn>

        {/* ── Private coverage form ── */}
        <AnimatedSlideIn visible={isPrivate}>
          <View style={{ marginBottom: 20 }}>
            <InsuranceContractFields
              data={data}
              onUpdate={(updates) => updateMember(member.id, updates)}
              currency={currency}
              savingsBalance={savingsBalance}
            />
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
      illustration={<InsuranceAmicoIllustration width={layout.illustrationWidth} />}
      onContinue={handleContinue}
      onBack={handleBack}
      validationError={validationError}
        setValidationError={setValidationError}
      continueLabel={editContinueLabel}
      animationKey={activeTab}
    >
      {/* Tab row — full-width pills */}
      {members.length > 0 && (
        <View style={{ flexDirection: 'row', borderRadius: R.input, borderWidth: 1, borderColor: C.border, overflow: 'hidden', marginBottom: 20 }}>
          {members.map((member, idx) => (
            <OnboardingPressable
              key={member.id}
              onPress={() => { setActiveTab(idx); setValidationError(''); }}
              style={({ pressed, hovered }) => ({
                flex: 1,
                paddingVertical: 10,
                backgroundColor: listRowBg({ pressed, hovered, selected: activeTab === idx }),
                alignItems: 'center',
              })}
            >
              <Text style={{
                fontSize: 13,
                fontWeight: '500',
                color: activeTab === idx ? C.primary : C.muted,
              }}>
                {member.label}
              </Text>
            </OnboardingPressable>
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
