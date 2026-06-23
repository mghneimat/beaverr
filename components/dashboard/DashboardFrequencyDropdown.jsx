import { useRef, useState } from 'react';
import {
  View,
  Pressable,
  Modal,
  Platform,
  StyleSheet,
} from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useI18n } from '../../lib/i18n';
import { C, R } from '../../constants/onboarding-theme';
import { elevationShadow } from '../../lib/shadow';
import { CardHeaderChevron } from './CardHeaderActionButton';

export const DASHBOARD_FREQ_OPTIONS = ['daily', 'weekly', 'monthly'];

const MENU_WIDTH = 168;

const DROPDOWN_TONES = {
  income: {
    bg: C.heroIncomeBg,
    bgHover: '#DCFCE7',
    bgPressed: '#BBF7D0',
    border: C.heroIncomeBorder,
    text: C.heroIncomeBadge,
  },
  expense: {
    bg: C.heroExpenseBg,
    bgHover: '#FEE2E2',
    bgPressed: '#FECACA',
    border: C.heroExpenseBorder,
    text: C.heroExpenseBadge,
  },
};

function FrequencyMenuOption({ label, selected, onPress }) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const active = pressed || hovered;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="menuitemradio"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: 40,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: R.pill,
        marginHorizontal: 4,
        backgroundColor: selected
          ? C.infoWashBg
          : active
            ? C.overlayHover
            : 'transparent',
        ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
      }}
    >
      <Text style={{
        fontSize: 13,
        fontWeight: selected ? '700' : '600',
        color: selected ? C.primary : C.text,
      }}>
        {label}
      </Text>
      {selected ? (
        <Text style={{ fontSize: 12, fontWeight: '700', color: C.accent }}>✓</Text>
      ) : null}
    </Pressable>
  );
}

/**
 * Compact pill dropdown for dashboard period selection (Daily / Weekly / Monthly).
 * @param {'income'|'expense'} [tone] — hero section tint
 * @param {boolean} [compact] — card header sizing
 */
export default function DashboardFrequencyDropdown({
  value,
  onChange,
  tone,
  compact = false,
  style,
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState(null);
  const triggerRef = useRef(null);
  const palette = tone ? DROPDOWN_TONES[tone] : null;

  const close = () => {
    setOpen(false);
    setAnchor(null);
  };

  const openMenu = () => {
    const node = triggerRef.current;
    if (!node?.measureInWindow) {
      setOpen(true);
      return;
    }
    node.measureInWindow((x, y, width, height) => {
      setAnchor({ x, y, width, height });
      setOpen(true);
    });
  };

  const handleSelect = (freq) => {
    close();
    if (freq !== value) onChange(freq);
  };

  const menuTop = anchor ? anchor.y + anchor.height + 6 : 0;
  const menuLeft = anchor
    ? Math.max(8, anchor.x + anchor.width - MENU_WIDTH)
    : 0;

  const triggerLabel = t(`common.${value}`);

  return (
    <>
      <View ref={triggerRef} collapsable={false} style={[{ flexShrink: 0 }, style]}>
        <Pressable
          onPress={() => (open ? close() : openMenu())}
          accessibilityRole="button"
          accessibilityLabel={t('dashboard.frequencyDropdown.triggerA11y', { period: triggerLabel })}
          accessibilityState={{ expanded: open }}
          style={({ pressed, hovered }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            minHeight: compact ? 32 : 36,
            paddingVertical: compact ? 6 : 8,
            paddingHorizontal: compact ? 12 : 14,
            borderRadius: R.pill,
            borderWidth: 1,
            borderColor: palette?.border ?? C.infoWashBorder,
            backgroundColor: open || pressed
              ? (palette?.bgPressed ?? C.overlayPressed)
              : hovered
                ? (palette?.bgHover ?? C.overlayHover)
                : (palette?.bg ?? C.infoWashBg),
            ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
          })}
        >
          <Text style={{
            fontSize: compact ? 12 : 13,
            fontWeight: '600',
            color: palette?.text ?? C.primary,
          }}
          numberOfLines={1}
          >
            {triggerLabel}
          </Text>
          <CardHeaderChevron expanded={open} color={palette?.text ?? C.muted} active={open} />
        </Pressable>
      </View>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={close}
        statusBarTranslucent
      >
        <View style={styles.overlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={close}
            accessibilityRole="button"
            accessibilityLabel={t('common.cancel')}
          />
          {anchor ? (
            <View
              accessibilityRole="menu"
              accessibilityLabel={t('dashboard.frequencyDropdown.menuA11y')}
              style={{
                position: 'absolute',
                top: menuTop,
                left: menuLeft,
                width: MENU_WIDTH,
                backgroundColor: C.surface,
                borderRadius: R.card,
                paddingVertical: 6,
                borderWidth: 1,
                borderColor: C.border,
                ...elevationShadow(8),
              }}
            >
              {DASHBOARD_FREQ_OPTIONS.map((freq) => (
                <FrequencyMenuOption
                  key={freq}
                  label={t(`common.${freq}`)}
                  selected={value === freq}
                  onPress={() => handleSelect(freq)}
                />
              ))}
            </View>
          ) : null}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(30, 58, 95, 0.12)',
  },
});
