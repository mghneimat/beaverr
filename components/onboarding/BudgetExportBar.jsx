import { View, Text } from 'react-native';

import { useI18n } from '../../lib/i18n';

import { C, R, T } from '../../constants/onboarding-theme';
import OnboardingPressable from './OnboardingPressable';
import { chipBg } from './pressableFeedback';

/**
 * Themed export action bar for the flexible budget summary table.
 * All format buttons share the same chip style as onboarding suggestion chips.
 *
 * @param {Object} props
 * @param {() => void} props.onExportCsv
 * @param {() => void} props.onExportXlsx
 * @param {() => void} props.onExportPdf
 */
export default function BudgetExportBar({ onExportCsv, onExportXlsx, onExportPdf }) {
  const { t } = useI18n();

  const buttons = [
    { key: 'csv', label: t('onboarding.budget.budgetSplit.exportCsv'), onPress: onExportCsv },
    { key: 'xlsx', label: t('onboarding.budget.budgetSplit.exportXlsx'), onPress: onExportXlsx },
    { key: 'pdf', label: t('onboarding.budget.budgetSplit.exportPdf'), onPress: onExportPdf },
  ];

  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ ...T.fieldLabel, color: C.muted, marginBottom: 8 }}>
        {t('onboarding.budget.budgetSplit.exportLabel')}
      </Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {buttons.map((btn) => (
          <OnboardingPressable
            key={btn.key}
            onPress={btn.onPress}
            accessibilityRole="button"
            accessibilityLabel={btn.label}
            style={({ pressed, hovered }) => ({
              flex: 1,
              minHeight: 44,
              paddingVertical: 10,
              paddingHorizontal: 8,
              borderRadius: R.chip,
              borderWidth: 1.5,
              borderColor: pressed || hovered ? C.primary : C.border,
              backgroundColor: pressed || hovered ? C.surfaceTint : C.surface,
              alignItems: 'center',
              justifyContent: 'center',
            })}
          >
            {({ pressed, hovered }) => (
              <Text style={{
                fontSize: 13,
                fontWeight: '500',
                color: pressed || hovered ? C.primary : C.muted,
              }}>
                {btn.label}
              </Text>
            )}
          </OnboardingPressable>
        ))}
      </View>
    </View>
  );
}
