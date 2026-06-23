import { useEffect, useState } from 'react';
import { View, Pressable, Platform } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useI18n } from '../../lib/i18n';
import { C, R, T } from '../../constants/onboarding-theme';
import { elevationShadow } from '../../lib/shadow';

export default function TablePageSizeSelect({
  value,
  options,
  onChange,
  onOpenChange,
  labelKey = 'dashboard.tablePagination.rowsPerPage',
  opensUpward = true,
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    onOpenChange?.(open);
  }, [open, onOpenChange]);

  const closeMenu = () => setOpen(false);

  const menuPositionStyle = opensUpward
    ? { bottom: '100%', left: 0, marginBottom: 4 }
    : { top: '100%', left: 0, marginTop: 4 };

  const menuShadow = Platform.OS === 'web'
    ? { boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)' }
    : elevationShadow({ offsetY: 4, blur: 12, opacity: 0.12 });

  return (
    <>
      {open && Platform.OS === 'web' ? (
        <Pressable
          onPress={closeMenu}
          accessibilityRole="button"
          accessibilityLabel={t('dashboard.tablePagination.dismissMenuA11y')}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 25,
          }}
        />
      ) : null}

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Text style={{ ...T.caption, color: C.muted, fontWeight: '600' }}>
          {t(labelKey)}
        </Text>
        <View style={{ position: 'relative', zIndex: open ? 30 : 1 }}>
          <Pressable
            onPress={() => setOpen((prev) => !prev)}
            accessibilityRole="button"
            accessibilityState={{ expanded: open }}
            accessibilityLabel={t('dashboard.tablePagination.rowsPerPageA11y', { count: value })}
            style={({ pressed, hovered }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              paddingVertical: 6,
              paddingHorizontal: 10,
              minHeight: 32,
              borderRadius: R.input,
              borderWidth: 1,
              borderColor: open ? C.pillSelectedBg : C.border,
              backgroundColor: pressed || hovered ? C.bg : C.surface,
              ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
            })}
          >
            <Text style={{ ...T.caption, fontWeight: '600', color: C.primary }}>
              {String(value)}
            </Text>
            <Text style={{ ...T.caption, color: C.muted }}>
              {open && opensUpward ? '▴' : '▾'}
            </Text>
          </Pressable>

          {open ? (
            <View
              style={{
                position: 'absolute',
                ...menuPositionStyle,
                minWidth: 72,
                borderRadius: R.input,
                borderWidth: 1,
                borderColor: C.border,
                backgroundColor: C.surface,
                overflow: 'hidden',
                ...menuShadow,
              }}
            >
              {options.map((option) => {
                const selected = option === value;
                return (
                  <Pressable
                    key={option}
                    onPress={() => {
                      onChange(option);
                      closeMenu();
                    }}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    accessibilityLabel={t('dashboard.tablePagination.rowsPerPageOptionA11y', { count: option })}
                    style={({ pressed }) => ({
                      paddingVertical: 8,
                      paddingHorizontal: 12,
                      backgroundColor: selected
                        ? C.surfaceTint
                        : pressed
                          ? C.bg
                          : C.surface,
                      ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
                    })}
                  >
                    <Text style={{
                      ...T.caption,
                      fontWeight: selected ? '700' : '500',
                      color: selected ? C.primary : C.text,
                      textAlign: 'center',
                    }}
                    >
                      {String(option)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}
        </View>
      </View>
    </>
  );
}
