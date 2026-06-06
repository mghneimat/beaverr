import React from 'react';
import { View, Pressable } from 'react-native';
import { Box, Text } from '@gluestack-ui/themed';
import { useRouter } from 'expo-router';
import { useI18n } from '../../lib/i18n';
import { C, R, T, S } from '../../constants/onboarding-theme';
import FadeUpView from '../../components/onboarding/FadeUpView';

export default function WelcomeScreen() {
  const { t } = useI18n();
  const router = useRouter();

  const handleGetStarted = async () => {
    router.push('/(onboarding)/consent');
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', paddingHorizontal: S.pagePadH }}>
      <FadeUpView style={{ alignItems: 'center', width: '100%', maxWidth: S.maxWidth }}>
        {/* Brand title — "Pocket" thinner, "OS" bold */}
        <Box style={{ marginBottom: 32, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}>
          <Text style={{ fontSize: 48, fontWeight: '300', letterSpacing: -0.5, color: C.primary }}>
            Pocket
          </Text>
          <Text style={{ fontSize: 48, fontWeight: '700', letterSpacing: -0.5, color: C.primary }}>
            OS
          </Text>
        </Box>

        {/* Motto */}
        <Text
          style={{ fontSize: 20, color: C.text, fontWeight: '500', textAlign: 'center', marginBottom: 12 }}
        >
          {t('app.tagline')}
        </Text>

        {/* Brief project description */}
        <Text
          style={{ fontSize: 15, lineHeight: 24, color: C.muted, textAlign: 'center', marginBottom: 32, paddingHorizontal: 24, maxWidth: 360 }}
        >
          {t('app.description')}
        </Text>

        {/* CTA Button */}
        <Pressable
          onPress={handleGetStarted}
          style={({ pressed }) => ({
            backgroundColor: pressed ? C.accentPressed : C.accent,
            paddingVertical: 16,
            paddingHorizontal: 32,
            borderRadius: R.button,
            width: '100%',
            maxWidth: 360,
            alignItems: 'center',
          })}
        >
          <Text style={{ color: '#FFFFFF', ...T.btnPrimary }}>
            {t('onboarding.welcome.cta')}
          </Text>
        </Pressable>
      </FadeUpView>
    </View>
  );
}
