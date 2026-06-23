import { useState } from 'react';
import { View, Modal, Pressable, Platform } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useI18n } from '../../lib/i18n';
import { C, R, S, T } from '../../constants/onboarding-theme';
import { InfoIcon } from '../app/AppNavIcons';
import DashboardFrequencyDropdown from './DashboardFrequencyDropdown';

const INFO_SIZE = 16;
const INFO_HIT = 28;

function FrequencyHelperModal({ scope, visible, onClose }) {
  const { t } = useI18n();
  const prefix = `dashboard.frequencyHelper.${scope}`;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={{
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
        }}
        >
          <Text style={{ fontSize: 17, fontWeight: '600', color: C.primary, marginBottom: 10 }}>
            {t('dashboard.frequencyHelper.modalTitle')}
          </Text>
          <Text style={{ ...T.body, color: C.muted, marginBottom: 20 }}>
            {t(`${prefix}.detail`)}
          </Text>
          <Pressable
            onPress={onClose}
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
  );
}

function FrequencyInfoButton({ scope, onPress }) {
  const { t } = useI18n();
  const prefix = `dashboard.frequencyHelper.${scope}`;

  return (
    <Pressable
      onPress={onPress}
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
  );
}

/**
 * Frequency toggle + info modal for dashboard sections.
 * @param {'home'|'income'|'expenses'|'budget'} scope
 * @param {'income'|'expense'} [tone] — match hero card tint (income/expense tabs)
 * @param {'stacked'|'inline'} [layout='stacked'] — stacked: title + dropdown/info on one row, summary below
 * @param {string} [title] — section title when layout is stacked
 * @param {string} [summary] — helper line below the toggle row
 */
export default function DashboardFrequencyHeaderControls({
  scope,
  value,
  onChange,
  tone,
  layout = 'stacked',
  title,
  summary,
  style,
}) {
  const { t } = useI18n();
  const [infoOpen, setInfoOpen] = useState(false);
  const prefix = `dashboard.frequencyHelper.${scope}`;
  const summaryText = summary ?? (layout === 'stacked' ? t(`${prefix}.summary`) : null);

  const dropdown = (
    <DashboardFrequencyDropdown
      value={value}
      onChange={onChange}
      tone={tone}
      compact
    />
  );

  const controls = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 0 }}>
      {dropdown}
      <FrequencyInfoButton scope={scope} onPress={() => setInfoOpen(true)} />
    </View>
  );

  if (layout === 'stacked') {
    return (
      <View style={[{ width: '100%', marginBottom: 16 }, style]}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: title ? 'space-between' : 'flex-end',
          gap: 12,
          width: '100%',
        }}
        >
          {title ? (
            <Text
              accessibilityRole="header"
              style={{ ...T.cardTitle, flex: 1, flexShrink: 1, minWidth: 0 }}
              numberOfLines={2}
            >
              {title}
            </Text>
          ) : null}
          {controls}
        </View>
        {summaryText ? (
          <Text style={{ ...T.caption, color: C.muted, marginTop: 8 }}>
            {summaryText}
          </Text>
        ) : null}
        <FrequencyHelperModal scope={scope} visible={infoOpen} onClose={() => setInfoOpen(false)} />
      </View>
    );
  }

  return (
    <>
      <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 2, flexShrink: 0 }, style]}>
        {controls}
      </View>
      <FrequencyHelperModal scope={scope} visible={infoOpen} onClose={() => setInfoOpen(false)} />
    </>
  );
}
