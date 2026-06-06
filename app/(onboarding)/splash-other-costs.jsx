import React from 'react';
import Svg, { Rect, Circle, Text as SvgText } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { useI18n } from '../../lib/i18n';
import SplashScreen from '../../components/onboarding/SplashScreen';

/** Section 10 splash — Other Regular Costs */
export default function SplashOtherCostsScreen() {
  const { t } = useI18n();
  const router = useRouter();

  return (
    <SplashScreen
      eyebrow={t('onboarding.s10.eyebrow')}
      heading={t('onboarding.s10.heading')}
      body={t('onboarding.s10.body')}
      cta={t('common.continue')}
      onContinue={() => router.replace('/(onboarding)/other-costs')}
      chapter={t('onboarding.otherCosts.chapter')}
      onBack={() => router.replace('/(onboarding)/subscriptions')}
      progress={86}
      progressLabel={t('onboarding.progress', { percent: '86' })}
    >
      {/* Miscellaneous costs / receipt illustration — design token colours */}
      <Svg width="200" height="160" viewBox="0 0 200 160" fill="none">
        <Rect x="60" y="25" width="80" height="110" rx="6" fill="#FDFCFA" stroke="#1D3557" strokeWidth="2" opacity={0.25} />
        <Rect x="72" y="40" width="56" height="3" rx="1.5" fill="#1D3557" opacity={0.15} />
        <Rect x="72" y="50" width="48" height="3" rx="1.5" fill="#1D3557" opacity={0.12} />
        <Rect x="72" y="60" width="52" height="3" rx="1.5" fill="#1D3557" opacity={0.15} />
        <Rect x="72" y="70" width="44" height="3" rx="1.5" fill="#1D3557" opacity={0.12} />
        <Rect x="72" y="80" width="50" height="3" rx="1.5" fill="#1D3557" opacity={0.15} />
        <Rect x="72" y="90" width="46" height="3" rx="1.5" fill="#1D3557" opacity={0.12} />
        <Rect x="72" y="105" width="56" height="4" rx="2" fill="#E8825A" opacity={0.35} />
        <Circle cx="30" cy="120" r="10" stroke="#3A8C6E" strokeWidth="2" fill="none" opacity={0.25} />
        <Circle cx="50" cy="135" r="8" stroke="#3A8C6E" strokeWidth="2" fill="none" opacity={0.18} />
        <Circle cx="170" cy="115" r="9" stroke="#3A8C6E" strokeWidth="2" fill="none" opacity={0.20} />
        <Circle cx="155" cy="130" r="7" stroke="#3A8C6E" strokeWidth="2" fill="none" opacity={0.15} />
        <SvgText x="95" y="155" fontSize="16" fill="#1D3557" opacity={0.25} fontWeight="bold">+</SvgText>
      </Svg>
    </SplashScreen>
  );
}
