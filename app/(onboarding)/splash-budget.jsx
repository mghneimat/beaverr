import React from 'react';
import Svg, { Circle, Path, Polyline } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { useI18n } from '../../lib/i18n';
import SplashScreen from '../../components/onboarding/SplashScreen';

/** Section 12 splash — Budget & Strategy */
export default function SplashBudgetScreen() {
  const { t } = useI18n();
  const router = useRouter();

  return (
    <SplashScreen
      eyebrow={t('onboarding.s12.eyebrow')}
      heading={t('onboarding.s12.heading')}
      body={t('onboarding.s12.body')}
      cta={t('common.continue')}
      onContinue={() => router.replace('/(onboarding)/budget')}
      chapter={t('onboarding.budget.chapter')}
      onBack={() => router.replace('/(onboarding)/debts')}
      progress={93}
      progressLabel={t('onboarding.progress', { percent: '93' })}
    >
      {/* Budget / pie chart illustration — design token colours */}
      <Svg width="200" height="160" viewBox="0 0 200 160" fill="none">
        <Circle cx="100" cy="75" r="50" fill="none" stroke="#E4E2DC" strokeWidth="2" opacity={0.4} />
        <Path d="M100 75 L100 25 A50 50 0 0 1 143 43 Z" fill="#1D3557" opacity={0.22} />
        <Path d="M100 75 L143 43 A50 50 0 0 1 150 75 Z" fill="#3A8C6E" opacity={0.18} />
        <Path d="M100 75 L150 75 A50 50 0 0 1 130 118 Z" fill="#E8825A" opacity={0.18} />
        <Path d="M100 75 L130 118 A50 50 0 0 1 70 118 Z" fill="#6B4FA0" opacity={0.14} />
        <Path d="M100 75 L70 118 A50 50 0 0 1 57 75 Z" fill="#F59E0B" opacity={0.14} />
        <Path d="M100 75 L57 75 A50 50 0 0 1 100 25 Z" fill="#1D3557" opacity={0.12} />
        <Circle cx="100" cy="75" r="6" fill="#FDFCFA" stroke="#1D3557" strokeWidth="2" opacity={0.35} />
        <Circle cx="100" cy="75" r="20" fill="none" stroke="#3A8C6E" strokeWidth="1" opacity={0.18} strokeDasharray="4 4" />
        <Polyline points="30,130 60,110 90,120 120,95 150,105 170,80" stroke="#3A8C6E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={0.35} />
      </Svg>
    </SplashScreen>
  );
}
