import React from 'react';
import { View, Text } from 'react-native';
import { useI18n } from '../../lib/i18n';

export default function SummaryScreen() {
  const { t } = useI18n();

  return (
    <View className="flex-1 bg-bg items-center justify-center px-5">
      <Text className="text-section text-text font-semibold mb-2">
        {t('dashboard.summary')}
      </Text>
      <Text className="text-body text-muted text-center">
        Coming in future increments
      </Text>
    </View>
  );
}
