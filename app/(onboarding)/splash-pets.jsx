import React from 'react';
import Svg, { Ellipse, Path, Circle } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { useI18n } from '../../lib/i18n';
import SplashScreen from '../../components/onboarding/SplashScreen';

/** Section 8 splash — Pets */
export default function SplashPetsScreen() {
  const { t } = useI18n();
  const router = useRouter();

  return (
    <SplashScreen
      eyebrow={t('onboarding.s8.eyebrow')}
      heading={t('onboarding.s8.heading')}
      body={t('onboarding.s8.body')}
      cta={t('common.continue')}
      onContinue={() => router.replace('/(onboarding)/pets')}
      chapter={t('onboarding.pets.chapter')}
      onBack={() => router.replace('/(onboarding)/children-costs')}
      progress={80}
      progressLabel={t('onboarding.progress', { percent: '80' })}
    >
      {/* Pets illustration — design token colours */}
      <Svg width="200" height="160" viewBox="0 0 200 160" fill="none">
        <Ellipse cx="75" cy="95" rx="25" ry="20" fill="#1D3557" opacity={0.10} />
        <Path d="M58 80 L52 62 L68 75" stroke="#1D3557" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={0.3} />
        <Path d="M92 80 L98 62 L82 75" stroke="#1D3557" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={0.3} />
        <Circle cx="67" cy="90" r="3" fill="#1D3557" opacity={0.4} />
        <Circle cx="83" cy="90" r="3" fill="#1D3557" opacity={0.4} />
        <Path d="M73 96 L75 98 L77 96" stroke="#1D3557" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={0.4} />
        <Path d="M50 100 C35 95 30 80 40 75" stroke="#1D3557" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity={0.2} />
        <Ellipse cx="135" cy="100" rx="28" ry="22" fill="#E8825A" opacity={0.12} />
        <Ellipse cx="115" cy="80" rx="6" ry="12" fill="#E8825A" opacity={0.2} transform="rotate(-15 115 80)" />
        <Ellipse cx="155" cy="80" rx="6" ry="12" fill="#E8825A" opacity={0.2} transform="rotate(15 155 80)" />
        <Circle cx="127" cy="95" r="3" fill="#E8825A" opacity={0.4} />
        <Circle cx="143" cy="95" r="3" fill="#E8825A" opacity={0.4} />
        <Ellipse cx="135" cy="103" rx="4" ry="3" fill="#E8825A" opacity={0.35} />
        <Path d="M163 95 C175 90 178 78 170 72" stroke="#E8825A" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity={0.25} />
        <Circle cx="30" cy="130" r="4" fill="#1D3557" opacity={0.12} />
        <Circle cx="28" cy="122" r="2.5" fill="#1D3557" opacity={0.12} />
        <Circle cx="34" cy="122" r="2.5" fill="#1D3557" opacity={0.12} />
        <Circle cx="170" cy="135" r="4" fill="#E8825A" opacity={0.12} />
        <Circle cx="168" cy="127" r="2.5" fill="#E8825A" opacity={0.12} />
        <Circle cx="174" cy="127" r="2.5" fill="#E8825A" opacity={0.12} />
      </Svg>
    </SplashScreen>
  );
}
