import { useMemo, useRef, useState } from 'react';
import {
  View,
  Pressable,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { C, R } from '../../constants/onboarding-theme';
import { isTouchWeb } from '../../lib/isMobileWebTouch';
import { elevationShadow } from '../../lib/shadow';
import { CardHeaderChevron } from './CardHeaderActionButton';

const MENU_WIDTH = 216;
const MENU_ITEM_FONT = 13;
const MENU_ITEM_LINE = 16;

function MonthMenuOption({ label, selected, onPress }) {
  const touchWeb = isTouchWeb();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="menuitemradio"
      accessibilityState={{ selected }}
      style={{
        paddingHorizontal: 2,
        paddingVertical: 2,
        minHeight: touchWeb ? 44 : undefined,
        ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
      }}
    >
      {({ pressed, hovered }) => (
        <View
          style={{
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: R.pill,
            backgroundColor: selected
              ? C.infoWashBg
              : pressed || hovered
                ? C.overlayHover
                : 'transparent',
          }}
        >
          <Text
            style={{
              fontSize: MENU_ITEM_FONT,
              lineHeight: MENU_ITEM_LINE,
              fontWeight: selected ? '600' : '500',
              color: C.text,
            }}
            numberOfLines={1}
            adjustsFontSizeToFit={false}
          >
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

/**
 * Month picker for summary daily spend chart.
 * @param {{
 *   value: string,
 *   options: { value: string, label: string }[],
 *   onChange: (value: string) => void,
 *   accessibilityLabel: string,
 * }} props
 */
export default function MonthPeriodDropdown({
  value,
  options,
  onChange,
  accessibilityLabel,
}) {
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const triggerRef = useRef(null);
  const touchWeb = isTouchWeb();
  const selected = options.find((opt) => opt.value === value);

  const openMenu = () => {
    triggerRef.current?.measureInWindow((x, y, width, height) => {
      setAnchor({ x, y, width, height });
      setOpen(true);
    });
  };

  const palette = useMemo(() => ({
    bg: C.infoWashBg,
    bgHover: C.overlayHover,
    bgPressed: C.overlayPressed,
    border: C.infoWashBorder,
    text: C.text,
  }), []);

  const menuTop = anchor.y + anchor.height + 6;
  const menuLeft = Math.max(8, anchor.x + anchor.width - MENU_WIDTH);

  return (
    <>
      <Pressable
        ref={triggerRef}
        onPress={openMenu}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ expanded: open }}
        style={({ pressed, hovered }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingHorizontal: 12,
          paddingVertical: 8,
          minHeight: touchWeb ? 44 : 36,
          borderRadius: R.pill,
          borderWidth: 1,
          borderColor: palette.border,
          backgroundColor: pressed
            ? palette.bgPressed
            : hovered && Platform.OS === 'web'
              ? palette.bgHover
              : palette.bg,
          ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
        })}
      >
        <Text
          style={{
            fontSize: MENU_ITEM_FONT,
            lineHeight: MENU_ITEM_LINE,
            fontWeight: '600',
            color: palette.text,
          }}
          numberOfLines={1}
        >
          {selected?.label || value}
        </Text>
        <CardHeaderChevron expanded={open} color={C.muted} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.overlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setOpen(false)}
            accessibilityLabel="Close"
          />
          <View
            style={{
              position: 'absolute',
              top: menuTop,
              left: menuLeft,
              width: MENU_WIDTH,
              borderRadius: R.input,
              borderWidth: 1,
              borderColor: C.border,
              backgroundColor: C.surface,
              paddingVertical: 6,
              paddingHorizontal: 4,
              maxHeight: 320,
              ...elevationShadow({ offsetY: 8, blur: 20, opacity: 0.14 }),
            }}
          >
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={Platform.OS === 'web'}
              style={{ maxHeight: 308 }}
            >
              <View style={{ gap: 4 }}>
                {options.map((opt) => (
                  <MonthMenuOption
                    key={opt.value}
                    label={opt.label}
                    selected={opt.value === value}
                    onPress={() => {
                      onChange(opt.value);
                      setOpen(false);
                    }}
                  />
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
});
