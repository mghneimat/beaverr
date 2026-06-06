import React from 'react';
import Svg, { Rect, Polygon, Text as SvgText } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { useI18n } from '../../lib/i18n';
import SplashScreen from '../../components/onboarding/SplashScreen';

/** Section 9 splash — Subscriptions */
export default function SplashSubscriptionsScreen() {
  const { t } = useI18n();
  const router = useRouter();

  return (
    <SplashScreen
      eyebrow={t('onboarding.s9.eyebrow')}
      heading={t('onboarding.s9.heading')}
      body={t('onboarding.s9.body')}
      cta={t('common.continue')}
      onContinue={() => router.replace('/(onboarding)/subscriptions')}
      chapter={t('onboarding.subscriptions.chapter')}
      onBack={() => router.replace('/(onboarding)/pets')}
      progress={83}
      progressLabel={t('onboarding.progress', { percent: '83' })}
    >
      {/* Subscriptions / streaming illustration — design token colours */}
      <Svg width="200" height="160" viewBox="0 0 200 160" fill="none">
        <Rect x="50" y="40" width="100" height="70" rx="8" fill="#1D3557" opacity={0.08} />
        <Rect x="55" y="45" width="90" height="55" rx="4" fill="#1D3557" opacity={0.05} />
        <Polygon points="90,60 90,85 115,72.5" fill="#1D3557" opacity={0.28} />
        <Rect x="85" y="110" width="30" height="4" rx="2" fill="#1D3557" opacity={0.15} />
        <Rect x="75" y="114" width="50" height="4" rx="2" fill="#1D3557" opacity={0.10} />
        <SvgText x="30" y="60" fontSize="24" fill="#E8825A" opacity={0.30}>♪</SvgText>
        <SvgText x="25" y="85" fontSize="18" fill="#E8825A" opacity={0.20}>♫</SvgText>
        <SvgText x="165" y="55" fontSize="22" fill="#E8825A" opacity={0.25}>♪</SvgText>
        <SvgText x="160" y="80" fontSize="16" fill="#E8825A" opacity={0.18}>♫</SvgText>
        <Rect x="30" y="110" width="12" height="12" rx="3" fill="#1D3557" opacity={0.12} />
        <Rect x="50" y="110" width="12" height="12" rx="3" fill="#1D3557" opacity={0.12} />
        <Rect x="70" y="110" width="12" height="12" rx="3" fill="#1D3557" opacity={0.12} />
        <Rect x="118" y="110" width="12" height="12" rx="3" fill="#1D3557" opacity={0.12} />
        <Rect x="138" y="110" width="12" height="12" rx="3" fill="#1D3557" opacity={0.12} />
        <Rect x="158" y="110" width="12" height="12" rx="3" fill="#1D3557" opacity={0.12} />
      </Svg>
    </SplashScreen>
  );
}
