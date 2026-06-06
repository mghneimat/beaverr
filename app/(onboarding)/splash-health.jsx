import React from 'react';
import Svg, { Path, Rect, Polyline } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { useI18n } from '../../lib/i18n';
import SplashScreen from '../../components/onboarding/SplashScreen';

/** Section 6 splash — Health Insurance */
export default function SplashHealthScreen() {
  const { t } = useI18n();
  const router = useRouter();

  return (
    <SplashScreen
      eyebrow={t('onboarding.s6.eyebrow')}
      heading={t('onboarding.s6.heading')}
      body={t('onboarding.s6.body')}
      cta={t('common.continue')}
      onContinue={() => router.replace('/(onboarding)/health')}
      chapter={t('onboarding.health.chapter')}
      onBack={() => router.replace('/(onboarding)/transport')}
      progress={70}
      progressLabel={t('onboarding.progress', { percent: '70' })}
    >
      {/* Health / medical cross illustration — design token colours */}
      <Svg width="200" height="160" viewBox="0 0 200 160" fill="none">
        <Path d="M100 30 L150 50 L150 90 C150 120 100 140 100 140 C100 140 50 120 50 90 L50 50 Z" stroke="#1D3557" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={0.25} />
        <Rect x="95" y="65" width="10" height="35" rx="2" fill="#1D3557" opacity={0.4} />
        <Rect x="82" y="78" width="36" height="10" rx="2" fill="#1D3557" opacity={0.4} />
        <Path d="M40 100 C40 95 45 92 48 95 C51 92 56 95 56 100 C56 108 48 114 48 114 C48 114 40 108 40 100 Z" fill="#E8825A" opacity={0.25} />
        <Path d="M155 85 C155 81 159 78 162 81 C165 78 169 81 169 85 C169 91 162 96 162 96 C162 96 155 91 155 85 Z" fill="#E8825A" opacity={0.25} />
        <Polyline points="20,95 50,95 60,75 75,115 85,95 100,95 110,80 120,110 135,95 180,95" stroke="#3A8C6E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={0.35} />
      </Svg>
    </SplashScreen>
  );
}
