import React from 'react';
import Svg, { Rect, Circle, Path, Text as SvgText } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { useI18n } from '../../lib/i18n';
import SplashScreen from '../../components/onboarding/SplashScreen';

/** Section 13 splash — Review & Confirm */
export default function SplashReviewScreen() {
  const { t } = useI18n();
  const router = useRouter();

  return (
    <SplashScreen
      eyebrow={t('onboarding.s13.eyebrow')}
      heading={t('onboarding.s13.heading')}
      body={t('onboarding.s13.body')}
      cta={t('common.continue')}
      onContinue={() => router.replace('/(onboarding)/review')}
      chapter={t('onboarding.review.chapter')}
      onBack={() => router.replace('/(onboarding)/budget')}
      progress={96}
      progressLabel={t('onboarding.progress', { percent: '96' })}
    >
      {/* Review / checklist illustration — design token colours */}
      <Svg width="200" height="160" viewBox="0 0 200 160" fill="none">
        <Rect x="60" y="25" width="80" height="110" rx="8" fill="#FDFCFA" stroke="#1D3557" strokeWidth="2" opacity={0.25} />
        <Rect x="85" y="20" width="30" height="12" rx="4" fill="#1D3557" opacity={0.25} />
        <Circle cx="78" cy="50" r="6" fill="#3A8C6E" opacity={0.22} />
        <Path d="M75 50 L77 52 L81 48" stroke="#3A8C6E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={0.55} />
        <Rect x="90" y="47" width="38" height="3" rx="1.5" fill="#1D3557" opacity={0.18} />
        <Circle cx="78" cy="70" r="6" fill="#3A8C6E" opacity={0.22} />
        <Path d="M75 70 L77 72 L81 68" stroke="#3A8C6E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={0.55} />
        <Rect x="90" y="67" width="42" height="3" rx="1.5" fill="#1D3557" opacity={0.18} />
        <Circle cx="78" cy="90" r="6" fill="#3A8C6E" opacity={0.22} />
        <Path d="M75 90 L77 92 L81 88" stroke="#3A8C6E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={0.55} />
        <Rect x="90" y="87" width="36" height="3" rx="1.5" fill="#1D3557" opacity={0.18} />
        <Circle cx="78" cy="110" r="6" fill="none" stroke="#1D3557" strokeWidth="1.5" opacity={0.20} />
        <Rect x="90" y="107" width="40" height="3" rx="1.5" fill="#1D3557" opacity={0.12} />
        <SvgText x="155" y="45" fontSize="18" fill="#E8825A" opacity={0.30}>✦</SvgText>
        <SvgText x="165" y="65" fontSize="12" fill="#E8825A" opacity={0.22}>✦</SvgText>
        <SvgText x="35" y="55" fontSize="14" fill="#E8825A" opacity={0.25}>✦</SvgText>
      </Svg>
    </SplashScreen>
  );
}
