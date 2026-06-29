import { View } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useI18n } from '../../lib/i18n';
import { C, R, T } from '../../constants/onboarding-theme';

/**
 * Category / item header for multi-step fill flows (subscriptions, utilities, other income).
 */
export default function OnboardingFillSectionHeader({
  title,
  current,
  total,
  style,
}) {
  const { t } = useI18n();
  const showProgress = Number(total) > 1;
  const safeCurrent = Math.min(Math.max(1, Number(current) || 1), Number(total) || 1);
  const safeTotal = Math.max(1, Number(total) || 1);

  return (
    <View
      style={[{
        marginBottom: 16,
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: R.card,
        borderWidth: 1,
        borderColor: C.border,
        backgroundColor: C.surface,
      }, style]}
      accessibilityRole="summary"
      accessibilityLabel={showProgress
        ? `${title}, ${t('common.sectionOfTotal', { current: safeCurrent, total: safeTotal })}`
        : title}
    >
      <View style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 12,
        marginBottom: showProgress ? 12 : 0,
      }}>
        <Text
          accessibilityRole="header"
          style={{ ...T.cardTitle, flex: 1 }}
          numberOfLines={2}
        >
          {title}
        </Text>
        {showProgress ? (
          <View style={{
            paddingVertical: 4,
            paddingHorizontal: 10,
            borderRadius: R.pill,
            backgroundColor: C.surfaceTint,
            borderWidth: 1,
            borderColor: C.border,
            flexShrink: 0,
          }}>
            <Text style={{ ...T.caption, color: C.muted, fontWeight: '500' }}>
              {t('common.sectionOfTotal', { current: safeCurrent, total: safeTotal })}
            </Text>
          </View>
        ) : null}
      </View>

      {showProgress ? (
        <View
          style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}
          accessibilityRole="progressbar"
          accessibilityValue={{ min: 1, max: safeTotal, now: safeCurrent }}
        >
          {Array.from({ length: safeTotal }, (_, index) => {
            const step = index + 1;
            const isComplete = step < safeCurrent;
            const isCurrent = step === safeCurrent;
            return (
              <View
                key={step}
                style={{
                  flex: 1,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: isCurrent
                    ? C.progressFill
                    : isComplete
                      ? C.positive
                      : C.border,
                  opacity: 1,
                }}
              />
            );
          })}
        </View>
      ) : null}
    </View>
  );
}
