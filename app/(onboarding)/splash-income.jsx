import React from 'react';
import Svg, { Ellipse, Rect, Path, Circle, Line } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { useI18n } from '../../lib/i18n';
import SplashScreen from '../../components/onboarding/SplashScreen';

/** Section 3 splash — Income */
export default function SplashIncomeScreen() {
  const { t } = useI18n();
  const router = useRouter();

  return (
    <SplashScreen
      eyebrow={t('onboarding.s3.eyebrow')}
      heading={t('onboarding.s3.heading')}
      body={t('onboarding.s3.body')}
      cta={t('common.continue')}
      onContinue={() => router.replace('/(onboarding)/income')}
      chapter={t('onboarding.income.chapter')}
      onBack={() => router.replace('/(onboarding)/occupation')}
      progress={35}
      progressLabel={t('onboarding.progress', { percent: '35' })}
    >
      {/* Abstract savings / income illustration — design token colours */}
      <Svg width="200" height="160" viewBox="0 0 200 160" fill="none">
        <Ellipse cx="100" cy="100" rx="60" ry="45" fill="#E8825A" opacity={0.10} />
        <Ellipse cx="100" cy="100" rx="55" ry="40" fill="#E8825A" opacity={0.18} />
        <Rect x="85" y="55" width="30" height="8" rx="4" fill="#1D3557" opacity={0.4} />
        <Rect x="80" y="65" width="40" height="8" rx="4" fill="#1D3557" opacity={0.5} />
        <Rect x="75" y="75" width="50" height="8" rx="4" fill="#1D3557" opacity={0.6} />
        <Rect x="70" y="85" width="60" height="8" rx="4" fill="#1D3557" opacity={0.7} />
        <Path d="M130 120 L145 90 L155 95 L170 60" stroke="#3A8C6E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <Path d="M170 60 L163 72" stroke="#3A8C6E" strokeWidth="3" strokeLinecap="round" fill="none" />
        <Path d="M170 60 L158 67" stroke="#3A8C6E" strokeWidth="3" strokeLinecap="round" fill="none" />
        <Circle cx="50" cy="50" r="16" stroke="#1D3557" strokeWidth="2.5" fill="none" opacity={0.35} />
        <Line x1="50" y1="40" x2="50" y2="60" stroke="#1D3557" strokeWidth="2.5" strokeLinecap="round" opacity={0.35} />
        <Line x1="40" y1="50" x2="60" y2="50" stroke="#1D3557" strokeWidth="2.5" strokeLinecap="round" opacity={0.35} />
      </Svg>
    </SplashScreen>
  );
}
