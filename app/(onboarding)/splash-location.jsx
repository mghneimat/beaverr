import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { useI18n } from '../../lib/i18n';
import SplashScreen from '../../components/onboarding/SplashScreen';

/** Section 2 splash — Location & Occupation */
export default function SplashLocationScreen() {
  const { t } = useI18n();
  const router = useRouter();

  return (
    <SplashScreen
      eyebrow={t('onboarding.s2.eyebrow')}
      heading={t('onboarding.s2.heading')}
      body={t('onboarding.s2.body')}
      cta={t('common.continue')}
      onContinue={() => router.replace('/(onboarding)/location')}
      chapter={t('onboarding.location.chapter')}
      onBack={() => router.replace('/(onboarding)/household')}
      progress={15}
      progressLabel={t('onboarding.progress', { percent: '15' })}
    >
      {/* Compass / map-pin illustration — design token colours */}
      <View style={{ width: 120, height: 120 }}>
        <Svg width="120" height="120" viewBox="0 0 120 120" fill="none">
          <Circle cx="60" cy="60" r="56" stroke="#1D3557" strokeWidth="2" strokeDasharray="6 4" opacity={0.3} />
          <Circle cx="60" cy="60" r="40" fill="#1D3557" fillOpacity={0.06} stroke="#1D3557" strokeWidth="1.5" opacity={0.4} />
          <Path d="M60 28 L66 54 L60 60 L54 54 Z" fill="#1D3557" opacity={0.6} />
          <Path d="M60 92 L54 66 L60 60 L66 66 Z" fill="#E8825A" opacity={0.5} />
          <Circle cx="60" cy="60" r="4" fill="#FDFCFA" stroke="#1D3557" strokeWidth="1.5" />
          <Path d="M60 72 C60 72 48 62 48 54 C48 47.4 53.4 42 60 42 C66.6 42 72 47.4 72 54 C72 62 60 72 60 72Z" fill="#E8825A" opacity={0.2} />
          <Circle cx="60" cy="54" r="5" fill="#E8825A" opacity={0.5} />
          <Circle cx="60" cy="18" r="2" fill="#1D3557" opacity={0.4} />
          <Circle cx="60" cy="102" r="2" fill="#1D3557" opacity={0.4} />
          <Circle cx="18" cy="60" r="2" fill="#1D3557" opacity={0.4} />
          <Circle cx="102" cy="60" r="2" fill="#1D3557" opacity={0.4} />
        </Svg>
      </View>
    </SplashScreen>
  );
}
