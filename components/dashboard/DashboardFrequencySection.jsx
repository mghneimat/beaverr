import { useState } from 'react';
import { View, Modal, Pressable, Platform } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useI18n } from '../../lib/i18n';
import { C, R, S, T } from '../../constants/onboarding-theme';
import { InfoIcon } from '../app/AppNavIcons';
import DashboardFrequencyDropdown from './DashboardFrequencyDropdown';

const INFO_SIZE = 16;
const INFO_HIT = 28;

/**
 * Page-level frequency toggle + helper copy with info modal.
 * @param {'income'|'expenses'|'budget'} scope
 */
export default function DashboardFrequencySection({ scope, value, onChange, style }) {
  const { t } = useI18n();
  const [infoOpen, setInfoOpen] = useState(false);
  const prefix = `dashboard.frequencyHelper.${scope}`;

  return (
    <View style={style}>
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        maxWidth: 320,
        width: '100%',
        alignSelf: 'center',
      }}>
        <DashboardFrequencyDropdown value={value} onChange={onChange} />
        <Pressable
          onPress={() => setInfoOpen(true)}
          accessibilityRole="button"
          accessibilityLabel={t(`${prefix}.infoA11y`)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={({ pressed, hovered }) => ({
            width: INFO_HIT,
            height: INFO_HIT,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: R.input,
            flexShrink: 0,
            backgroundColor: pressed
              ? C.overlayPressed
              : hovered
                ? C.overlayHover
                : 'transparent',
            ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
          })}
        >
          <InfoIcon color={C.muted} size={INFO_SIZE} />
        </Pressable>
      </View>

      <Text
        style={{
          ...T.caption,
          fontSize: 12,
          lineHeight: 16,
          color: C.muted,
          textAlign: 'center',
          marginTop: 8,
          maxWidth: 320,
          width: '100%',
          alignSelf: 'center',
        }}
        numberOfLines={2}
      >
        {t(`${prefix}.summary`)}
      </Text>

      <Modal
        visible={infoOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setInfoOpen(false)}
        statusBarTranslucent
      >
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: S.pagePadH,
        }}>
          <Pressable
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(30,58,95,0.35)',
            }}
            onPress={() => setInfoOpen(false)}
            accessibilityRole="button"
            accessibilityLabel={t('dashboard.metricExplain.closeA11y')}
          />
          <View style={{
            width: '100%',
            maxWidth: 400,
            backgroundColor: C.surface,
            borderRadius: R.card,
            padding: 20,
            borderWidth: 1,
            borderColor: C.border,
            ...(Platform.OS === 'web' ? { cursor: 'default' } : {}),
          }}>
            <Text style={{ fontSize: 17, fontWeight: '600', color: C.primary, marginBottom: 10 }}>
              {t('dashboard.frequencyHelper.modalTitle')}
            </Text>
            <Text style={{ ...T.body, color: C.muted, marginBottom: 20 }}>
              {t(`${prefix}.detail`)}
            </Text>
            <Pressable
              onPress={() => setInfoOpen(false)}
              accessibilityRole="button"
              accessibilityLabel={t('dashboard.metricExplain.gotIt')}
              style={({ pressed }) => ({
                alignSelf: 'flex-end',
                minHeight: 44,
                paddingHorizontal: 16,
                borderRadius: R.button,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: pressed ? C.pillSelectedPressed : C.pillSelectedBg,
                ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
              })}
            >
              <Text style={{ fontSize: 15, fontWeight: '600', color: C.pillSelectedText }}>
                {t('dashboard.metricExplain.gotIt')}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
