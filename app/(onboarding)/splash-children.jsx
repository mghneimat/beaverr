import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { useI18n } from '../../lib/i18n';
import SplashScreen from '../../components/onboarding/SplashScreen';

/** Section 7 splash — Children's Costs */
export default function SplashChildrenScreen() {
  const { t } = useI18n();
  const router = useRouter();

  return (
    <SplashScreen
      eyebrow={t('onboarding.s7.eyebrow')}
      heading={t('onboarding.s7.heading')}
      body={t('onboarding.s7.body')}
      cta={t('common.continue')}
      onContinue={() => router.replace('/(onboarding)/children-costs')}
      chapter={t('onboarding.childrenCosts.chapter')}
      onBack={() => router.replace('/(onboarding)/health')}
      progress={75}
      progressLabel={t('onboarding.progress', { percent: '75' })}
    >
      {/* Children / family illustration — design token colours */}
      <Svg width="200" height="160" viewBox="0 0 200 160" fill="none">
        <Circle cx="100" cy="50" r="18" fill="#1D3557" opacity={0.15} />
        <Path d="M100 68 L100 110 M100 80 L80 100 M100 80 L120 100 M100 110 L85 135 M100 110 L115 135" stroke="#1D3557" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={0.3} />
        <Circle cx="55" cy="75" r="12" fill="#E8825A" opacity={0.2} />
        <Path d="M55 87 L55 115 M55 95 L42 108 M55 95 L68 108 M55 115 L45 130 M55 115 L65 130" stroke="#E8825A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={0.3} />
        <Circle cx="145" cy="70" r="12" fill="#E8825A" opacity={0.2} />
        <Path d="M145 82 L145 110 M145 90 L132 103 M145 90 L158 103 M145 110 L135 125 M145 110 L155 125" stroke="#E8825A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={0.3} />
        <Circle cx="170" cy="120" r="10" fill="#1D3557" opacity={0.10} />
        <Circle cx="165" cy="112" r="4" fill="#1D3557" opacity={0.10} />
        <Circle cx="175" cy="112" r="4" fill="#1D3557" opacity={0.10} />
        <Circle cx="170" cy="124" r="3" fill="#1D3557" opacity={0.15} />
      </Svg>
    </SplashScreen>
  );
}
