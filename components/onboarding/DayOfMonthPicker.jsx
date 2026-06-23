import { useState, useRef } from 'react';
import { View, Text, Pressable, Modal, ScrollView } from 'react-native';
import { C, R } from '../../constants/onboarding-theme';
import { elevationShadow } from '../../lib/shadow';
import OnboardingPressable from './OnboardingPressable';
import FieldError from './FieldError';
import { listRowBg, washBg } from './pressableFeedback';

/**
 * Day-of-month picker (1–31) for charge days and payment due days.
 *
 * @param {Object} props
 * @param {string|number} [props.value]
 * @param {(day: string) => void} props.onChange
 * @param {string} [props.placeholder]
 * @param {string} [props.errorText]
 * @param {object} [props.style]
 */
export default function DayOfMonthPicker({ value, onChange, placeholder, errorText, style }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  const [triggerLayout, setTriggerLayout] = useState(null);
  const isInvalid = Boolean(errorText);

  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const displayValue = value ? String(value) : '';

  const handleOpen = () => {
    if (triggerRef.current) {
      triggerRef.current.measureInWindow((x, y, width, height) => {
        setTriggerLayout({ x, y, width, height });
        setOpen(true);
      });
    }
  };

  return (
    <View style={style}>
      <View ref={triggerRef} collapsable={false}>
        <OnboardingPressable
          onPress={handleOpen}
          contentStyle={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
          }}
          style={({ pressed, hovered }) => ({
            paddingVertical: 12,
            paddingHorizontal: 16,
            borderRadius: R.pill,
            borderWidth: isInvalid ? 2 : 1,
            borderColor: isInvalid ? C.danger : C.border,
            backgroundColor: washBg({ pressed, hovered }, C.surface),
            flexDirection: 'row',
            alignItems: 'center',
            minHeight: 48,
          })}
        >
          <Text
            style={{
              flex: 1,
              fontSize: 14,
              color: displayValue ? C.text : C.placeholder,
              fontWeight: displayValue ? '500' : '400',
            }}
            numberOfLines={1}
          >
            {displayValue || placeholder}
          </Text>
          <Text style={{ fontSize: 10, color: C.muted, marginLeft: 8, flexShrink: 0 }}>▼</Text>
        </OnboardingPressable>
      </View>

      {errorText ? <FieldError message={errorText} style={{ marginTop: 6 }} /> : null}

      <Modal
        visible={open}
        transparent
        animationType="none"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={{ flex: 1 }} onPress={() => setOpen(false)}>
          {triggerLayout && (
            <View
              style={{
                position: 'absolute',
                top: triggerLayout.y + triggerLayout.height + 2,
                left: triggerLayout.x,
                width: triggerLayout.width,
                backgroundColor: C.surface,
                borderRadius: R.card,
                maxHeight: 200,
                overflow: 'hidden',
                borderWidth: 1,
                borderColor: C.border,
                ...elevationShadow({ offsetY: 4, blur: 8, opacity: 0.15 }),
              }}
            >
              <ScrollView style={{ maxHeight: 200 }} bounces={false} keyboardShouldPersistTaps="handled">
                {days.map((day) => {
                  const isSelected = String(day) === String(value);
                  return (
                    <OnboardingPressable
                      key={day}
                      onPress={() => { onChange(String(day)); setOpen(false); }}
                      style={({ pressed, hovered }) => ({
                        paddingVertical: 12,
                        paddingHorizontal: 16,
                        backgroundColor: listRowBg({ pressed, hovered, selected: isSelected }),
                      })}
                    >
                      <Text style={{
                        fontSize: 14,
                        color: isSelected ? C.primary : C.text,
                        fontWeight: isSelected ? '600' : '400',
                      }}>
                        {day}
                      </Text>
                    </OnboardingPressable>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </Pressable>
      </Modal>
    </View>
  );
}
