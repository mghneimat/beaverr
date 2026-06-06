import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useI18n } from '../../lib/i18n';

export default function IncomeScreen() {
  const { t } = useI18n();

  return (
    <ScrollView className="flex-1 bg-bg">
      {/* Content */}
      <View className="flex-1 items-center justify-center px-5 py-12">
        <Text className="text-section text-text font-semibold text-center mb-3">
          {t('dashboard.income')}
        </Text>
        <Text className="text-body text-muted text-center">
          Coming soon
        </Text>
      </View>
    </ScrollView>
  );
}
