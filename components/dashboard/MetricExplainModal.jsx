import { View, Modal, Pressable, ScrollView, Platform } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { C, R, S, T, tabularNums } from '../../constants/onboarding-theme';

/**
 * @typedef {{ label: string, value: string, emphasis?: boolean }} CalculationRow
 */

export default function MetricExplainModal({
  visible,
  onClose,
  title,
  value,
  meaning,
  calculationTitle,
  rows = [],
  formula,
  warning,
  gotItLabel,
  accessibilityLabel,
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: S.pagePadH,
        }}
      >
        <Pressable
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(30,58,95,0.35)',
          }}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
        />
        <View
          style={{
            width: '100%',
            maxWidth: 440,
            maxHeight: '85%',
            backgroundColor: C.surface,
            borderRadius: R.card,
            borderWidth: 1,
            borderColor: C.border,
            overflow: 'hidden',
            ...(Platform.OS === 'web' ? { cursor: 'default' } : {}),
          }}
        >
          <ScrollView
            contentContainerStyle={{ padding: 20 }}
            bounces={false}
          >
            <Text style={{ fontSize: 13, fontWeight: '600', color: C.muted, marginBottom: 6 }}>
              {title}
            </Text>
            <Text style={{
              fontSize: 32,
              lineHeight: 38,
              fontWeight: '700',
              color: C.primary,
              marginBottom: 16,
              ...tabularNums,
            }}>
              {value}
            </Text>

            {meaning?.title ? (
              <Text style={{ fontSize: 13, fontWeight: '600', color: C.primary, marginBottom: 6 }}>
                {meaning.title}
              </Text>
            ) : null}
            {meaning?.body ? (
              <Text style={{ ...T.body, color: C.text, marginBottom: 20 }}>
                {meaning.body}
              </Text>
            ) : null}

            {warning ? (
              <View style={{
                padding: 12,
                borderRadius: R.input,
                backgroundColor: C.dangerBg,
                borderWidth: 1,
                borderColor: C.dangerBorder,
                marginBottom: 20,
              }}>
                <Text style={{ fontSize: 14, lineHeight: 20, color: C.danger }}>{warning}</Text>
              </View>
            ) : null}

            {rows.length > 0 || formula ? (
              <>
            <Text style={{ fontSize: 13, fontWeight: '600', color: C.primary, marginBottom: 10 }}>
              {calculationTitle}
            </Text>
            {rows.length > 0 ? (
            <View style={{
              borderRadius: R.input,
              borderWidth: 1,
              borderColor: C.border,
              overflow: 'hidden',
              marginBottom: formula ? 12 : 20,
            }}>
              {rows.map((row, idx) => (
                <View
                  key={`${row.label}-${idx}`}
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 12,
                    paddingVertical: 10,
                    paddingHorizontal: 14,
                    borderTopWidth: idx > 0 ? 1 : 0,
                    borderTopColor: C.divider,
                    backgroundColor: row.emphasis ? C.infoWashBg : C.surface,
                  }}
                >
                  <Text style={{
                    flex: 1,
                    fontSize: 14,
                    color: row.emphasis ? C.primary : C.muted,
                    fontWeight: row.emphasis ? '600' : '400',
                  }} numberOfLines={2}>
                    {row.label}
                  </Text>
                  <Text style={{
                    fontSize: 14,
                    fontWeight: row.emphasis ? '700' : '600',
                    color: C.primary,
                    ...tabularNums,
                  }}>
                    {row.value}
                  </Text>
                </View>
              ))}
            </View>
            ) : null}

            {formula ? (
              <Text style={{ ...T.caption, color: C.muted, marginBottom: 20, fontStyle: 'italic' }}>
                {formula}
              </Text>
            ) : null}
              </>
            ) : null}

            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel={gotItLabel}
              style={({ pressed }) => ({
                paddingVertical: 14,
                borderRadius: R.button,
                backgroundColor: pressed ? C.accentPressed : C.accent,
                alignItems: 'center',
                minHeight: 44,
                justifyContent: 'center',
              })}
            >
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#FFFFFF' }}>{gotItLabel}</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
