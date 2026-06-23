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
import {
  CardHeaderChevron,
  cardHeaderActionLabelStyle,
  cardHeaderActionStyle,
} from './CardHeaderActionButton';

const MENU_WIDTH = 260;

function ExportOption({ format, onPress }) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  const active = pressed || hovered;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="menuitem"
      accessibilityLabel={format}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 40,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: R.pill,
        marginHorizontal: 4,
        backgroundColor: active ? C.overlayHover : 'transparent',
        ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
      }}
    >
      <Text style={{
        fontSize: 13,
        fontWeight: '600',
        letterSpacing: 0.6,
        color: active ? C.primary : C.text,
      }}>
        {format}
      </Text>
    </Pressable>
  );
}

/**
 * Export dropdown for dashboard section headers — renders above all content via Modal.
 */
export default function DashboardTableExportActions({ onExportCsv, onExportXlsx, onExportPdf }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState(null);
  const triggerRef = useRef(null);

  const options = [
    { key: 'csv', format: t('onboarding.budget.budgetSplit.exportCsv'), onPress: onExportCsv },
    { key: 'xlsx', format: t('onboarding.budget.budgetSplit.exportXlsx'), onPress: onExportXlsx },
    { key: 'pdf', format: t('onboarding.budget.budgetSplit.exportPdf'), onPress: onExportPdf },
  ];

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

  const handleSelect = (onPress) => {
    close();
    onPress();
  };

  const menuTop = anchor ? anchor.y + anchor.height + 8 : 0;
  const menuLeft = anchor
    ? Math.max(8, anchor.x + anchor.width - MENU_WIDTH)
    : 0;

  return (
    <>
      <View ref={triggerRef} collapsable={false} style={{ flexShrink: 0 }}>
        <Pressable
          onPress={() => (open ? close() : openMenu())}
          accessibilityRole="button"
          accessibilityLabel={t('dashboard.common.export')}
          accessibilityState={{ expanded: open }}
          style={({ pressed, hovered }) => cardHeaderActionStyle({
            pressed,
            hovered,
            active: open,
          })}
        >
          <Text style={cardHeaderActionLabelStyle(open)}>
            {t('dashboard.common.export')}
          </Text>
          <CardHeaderChevron expanded={open} color={C.muted} active={open} />
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
                ...elevationShadow({ offsetY: 10, blur: 24, opacity: 0.14 }),
                ...(Platform.OS === 'web' ? { zIndex: 9999 } : {}),
              }}
            >
              {options.map((opt) => (
                <ExportOption
                  key={opt.key}
                  format={opt.format}
                  onPress={() => handleSelect(opt.onPress)}
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
    backgroundColor: Platform.OS === 'web' ? 'rgba(15, 23, 42, 0.06)' : 'rgba(0, 0, 0, 0.18)',
  },
});
