import React from 'react';
import Svg, { Line, Path, Rect } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { useI18n } from '../../lib/i18n';
import SplashScreen from '../../components/onboarding/SplashScreen';

/** Section 11 splash — Debts */
export default function SplashDebtsScreen() {
  const { t } = useI18n();
  const router = useRouter();

  return (
    <SplashScreen
      eyebrow={t('onboarding.s11.eyebrow')}
      heading={t('onboarding.s11.heading')}
      body={t('onboarding.s11.body')}
      cta={t('common.continue')}
      onContinue={() => router.replace('/(onboarding)/debts')}
      chapter={t('onboarding.debts.chapter')}
      onBack={() => router.replace('/(onboarding)/other-costs')}
      progress={90}
      progressLabel={t('onboarding.progress', { percent: '90' })}
    >
      {/* Debts / balance illustration — design token colours */}
      <Svg width="200" height="160" viewBox="0 0 200 160" fill="none">
        <Line x1="100" y1="30" x2="100" y2="80" stroke="#1D3557" strokeWidth="2.5" strokeLinecap="round" opacity={0.35} />
        <Line x1="50" y1="50" x2="150" y2="50" stroke="#1D3557" strokeWidth="2.5" strokeLinecap="round" opacity={0.25} />
        <Path d="M50 50 L40 80 L60 80 Z" fill="#6B4FA0" opacity={0.18} />
        <Rect x="35" y="80" width="30" height="8" rx="2" fill="#6B4FA0" opacity={0.12} />
        <Path d="M150 50 L140 35 L160 35 Z" fill="#3A8C6E" opacity={0.18} />
        <Rect x="135" y="35" width="30" height="8" rx="2" fill="#3A8C6E" opacity={0.12} />
        <Rect x="65" y="100" width="70" height="45" rx="6" fill="#FDFCFA" stroke="#6B4FA0" strokeWidth="1.5" opacity={0.35} />
        <Rect x="75" y="112" width="50" height="4" rx="2" fill="#6B4FA0" opacity={0.18} />
        <Rect x="75" y="122" width="35" height="3" rx="1.5" fill="#6B4FA0" opacity={0.12} />
        <Rect x="75" y="130" width="40" height="3" rx="1.5" fill="#6B4FA0" opacity={0.12} />
        <Path d="M100 90 L95 85 L100 90 L105 85" stroke="#6B4FA0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={0.4} />
      </Svg>
    </SplashScreen>
  );
}
