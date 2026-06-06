import React from 'react';
import Svg, { Rect, Path, Circle } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { useI18n } from '../../lib/i18n';
import SplashScreen from '../../components/onboarding/SplashScreen';

/** Section 5 splash — Transport */
export default function SplashTransportScreen() {
  const { t } = useI18n();
  const router = useRouter();

  return (
    <SplashScreen
      eyebrow={t('onboarding.s5.eyebrow')}
      heading={t('onboarding.s5.heading')}
      body={t('onboarding.s5.body')}
      cta={t('common.continue')}
      onContinue={() => router.replace('/(onboarding)/transport')}
      chapter={t('onboarding.transport.chapter')}
      onBack={() => router.replace('/(onboarding)/housing')}
      progress={62}
      progressLabel={t('onboarding.progress', { percent: '62' })}
    >
      {/* Abstract car / transport illustration — design token colours */}
      <Svg width="200" height="160" viewBox="0 0 200 160" fill="none">
        <Rect x="20" y="110" width="160" height="8" rx="4" fill="#1D3557" opacity={0.10} />
        <Rect x="30" y="113" width="12" height="2" rx="1" fill="#1D3557" opacity={0.2} />
        <Rect x="50" y="113" width="12" height="2" rx="1" fill="#1D3557" opacity={0.2} />
        <Rect x="70" y="113" width="12" height="2" rx="1" fill="#1D3557" opacity={0.2} />
        <Rect x="90" y="113" width="12" height="2" rx="1" fill="#1D3557" opacity={0.2} />
        <Rect x="110" y="113" width="12" height="2" rx="1" fill="#1D3557" opacity={0.2} />
        <Rect x="130" y="113" width="12" height="2" rx="1" fill="#1D3557" opacity={0.2} />
        <Rect x="150" y="113" width="12" height="2" rx="1" fill="#1D3557" opacity={0.2} />
        <Rect x="55" y="80" width="90" height="30" rx="8" fill="#1D3557" opacity={0.15} />
        <Path d="M70 80 L80 60 L120 60 L130 80" stroke="#1D3557" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={0.4} />
        <Rect x="82" y="64" width="16" height="14" rx="2" fill="#1D3557" opacity={0.12} />
        <Rect x="102" y="64" width="16" height="14" rx="2" fill="#1D3557" opacity={0.12} />
        <Circle cx="75" cy="110" r="10" fill="#1D3557" opacity={0.2} />
        <Circle cx="125" cy="110" r="10" fill="#1D3557" opacity={0.2} />
        <Rect x="145" y="75" width="30" height="35" rx="6" fill="#E8825A" opacity={0.18} />
        <Rect x="150" y="80" width="20" height="10" rx="2" fill="#E8825A" opacity={0.25} />
      </Svg>
    </SplashScreen>
  );
}
