import React from 'react';
import Svg, { Rect, Path, Circle, Text as SvgText } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { useI18n } from '../../lib/i18n';
import SplashScreen from '../../components/onboarding/SplashScreen';

/** Section 4 splash — Housing */
export default function SplashHousingScreen() {
  const { t } = useI18n();
  const router = useRouter();

  return (
    <SplashScreen
      eyebrow={t('onboarding.s4.eyebrow')}
      heading={t('onboarding.s4.heading')}
      body={t('onboarding.s4.body')}
      cta={t('common.continue')}
      onContinue={() => router.replace('/(onboarding)/housing')}
      chapter={t('onboarding.housing.chapter')}
      onBack={() => router.replace('/(onboarding)/income')}
      progress={55}
      progressLabel={t('onboarding.progress', { percent: '55' })}
    >
      {/* Abstract house / home illustration — design token colours */}
      <Svg width="200" height="160" viewBox="0 0 200 160" fill="none">
        <Rect x="50" y="70" width="100" height="75" rx="4" fill="#1D3557" opacity={0.08} />
        <Rect x="55" y="75" width="90" height="65" rx="3" fill="#1D3557" opacity={0.12} />
        <Path d="M40 75 L100 35 L160 75" stroke="#1D3557" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={0.5} />
        <Rect x="88" y="105" width="24" height="35" rx="3" fill="#E8825A" opacity={0.35} />
        <Rect x="62" y="85" width="20" height="18" rx="2" fill="#E8825A" opacity={0.25} />
        <Rect x="118" y="85" width="20" height="18" rx="2" fill="#E8825A" opacity={0.25} />
        <Rect x="130" y="40" width="14" height="25" rx="2" fill="#1D3557" opacity={0.2} />
        <Circle cx="137" cy="32" r="5" fill="#1D3557" opacity={0.15} />
        <Circle cx="143" cy="24" r="4" fill="#1D3557" opacity={0.10} />
        <Circle cx="148" cy="18" r="3" fill="#1D3557" opacity={0.07} />
        <Circle cx="170" cy="120" r="14" stroke="#3A8C6E" strokeWidth="2" fill="none" opacity={0.4} />
        <SvgText x="170" y="125" textAnchor="middle" fontSize="14" fill="#3A8C6E" opacity={0.5} fontWeight="bold">Kč</SvgText>
      </Svg>
    </SplashScreen>
  );
}
