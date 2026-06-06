import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useI18n } from '../../lib/i18n';
import { useRouter } from 'expo-router';
import { setData } from '../../lib/storage';
import Svg, { Circle, Path, Rect, G } from 'react-native-svg';
import { C } from '../../constants/onboarding-theme';

export default function DashboardScreen() {
  const { t } = useI18n();
  const router = useRouter();

  const handleRedoSetup = async () => {
    await setData('pocketos_onboarding', {
      completed: false,
      currentStep: 'welcome',
      percentComplete: 0,
    });
    router.replace('/(onboarding)/welcome');
  };

  return (
    <ScrollView className="flex-1 bg-bg">
      {/* Content */}
      <View className="flex-1 items-center justify-center px-5 py-12">
        {/* Placeholder Illustration */}
        <View className="mb-8">
          <Svg width="240" height="240" viewBox="0 0 240 240">
            {/* Abstract financial dashboard illustration */}
            <Circle cx="120" cy="120" r="100" fill={C.infoBg} />
            <Circle cx="120" cy="120" r="80" fill={C.primary} opacity="0.1" />
            
            {/* Pie chart segments */}
            <G transform="translate(120, 120)">
              <Path
                d="M 0,-60 A 60,60 0 0,1 52,-30 L 0,0 Z"
                fill={C.primary}
                opacity="0.8"
              />
              <Path
                d="M 52,-30 A 60,60 0 0,1 52,30 L 0,0 Z"
                fill={C.positive}
                opacity="0.8"
              />
              <Path
                d="M 52,30 A 60,60 0 0,1 0,60 L 0,0 Z"
                fill={C.accent}
                opacity="0.8"
              />
              <Path
                d="M 0,60 A 60,60 0 0,1 0,-60 L 0,0 Z"
                fill={C.muted}
                opacity="0.8"
              />
            </G>

            {/* Decorative elements */}
            <Circle cx="180" cy="60" r="16" fill={C.primary} opacity="0.3" />
            <Circle cx="60" cy="180" r="12" fill={C.positive} opacity="0.3" />
            <Rect x="40" y="40" width="8" height="8" rx="2" fill={C.accent} opacity="0.3" />
          </Svg>
        </View>

        {/* Placeholder Text */}
        <Text className="text-section text-text font-semibold text-center mb-3">
          {t('dashboard.placeholder.title')}
        </Text>
        <Text className="text-body text-muted text-center mb-8 max-w-sm">
          {t('dashboard.placeholder.subtitle')}
        </Text>

        {/* Settings Button */}
        <Pressable
          onPress={handleRedoSetup}
          className="px-6 py-3 border border-border rounded-lg active:bg-chip-active"
        >
          <Text className="text-body text-primary font-medium">
            {t('settings.redoSetup')}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
