import { createElement, forwardRef, useImperativeHandle, useRef } from 'react';
import { View, Text, Platform } from 'react-native';
import { C, R, S, T, INPUT_FIELD } from '../../constants/onboarding-theme';

const CHEVRON = '▼';

/**
 * Native select for date parts on mobile web — no keyboard flash, no overlapping suggestion lists.
 */
const DatePartSelectWeb = forwardRef(function DatePartSelectWeb(
  {
    label,
    value,
    placeholder,
    options,
    onSelect,
    flex = 1,
    inGroup = false,
    partKind = 'day',
    invalid = false,
    accessibilityLabel,
    onFocusChange,
  },
  ref,
) {
  const selectRef = useRef(null);

  useImperativeHandle(ref, () => ({
    focus: () => {
      selectRef.current?.focus?.();
    },
  }));

  const shellStyle = {
    width: '100%',
    overflow: 'hidden',
    backgroundColor: inGroup ? 'transparent' : C.surface,
    borderWidth: invalid ? 2 : 1.5,
    borderColor: invalid ? C.danger : C.border,
    borderRadius: R.pill,
    minHeight: INPUT_FIELD.minHeight,
    justifyContent: 'center',
    position: 'relative',
  };

  const selectStyle = {
    width: '100%',
    minHeight: INPUT_FIELD.minHeight - 3,
    fontSize: 17,
    fontWeight: '400',
    color: value ? C.text : C.placeholder,
    paddingVertical: INPUT_FIELD.paddingVertical,
    paddingLeft: INPUT_FIELD.paddingHorizontal,
    paddingRight: INPUT_FIELD.paddingHorizontal + 22,
    border: 'none',
    outline: 'none',
    backgroundColor: 'transparent',
    appearance: 'none',
    WebkitAppearance: 'none',
    touchAction: 'manipulation',
  };

  return (
    <View
      style={{
        flex,
        minWidth: partKind === 'year' ? 72 : 0,
      }}
      dataSet={{ datePart: partKind }}
    >
      <Text style={{ ...T.fieldLabel, marginBottom: S.labelGap }}>{label}</Text>
      <View style={shellStyle}>
        {Platform.OS === 'web' ? createElement(
          'select',
          {
            ref: selectRef,
            value: value || '',
            'aria-label': accessibilityLabel ?? label,
            'data-date-part': partKind,
            onFocus: () => {
              requestAnimationFrame(() => onFocusChange?.(true));
            },
            onBlur: () => {
              requestAnimationFrame(() => onFocusChange?.(false));
            },
            onChange: (event) => {
              onSelect(event.target.value);
            },
            style: selectStyle,
          },
          [
            createElement('option', { key: 'placeholder', value: '' }, placeholder),
            ...options.map((option) => createElement(
              'option',
              { key: option.value, value: option.value },
              option.label,
            )),
          ],
        ) : null}
        {Platform.OS === 'web' ? (
          <Text
            pointerEvents="none"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={{
              position: 'absolute',
              right: 12,
              top: '50%',
              marginTop: -7,
              fontSize: 12,
              lineHeight: 14,
              color: C.muted,
            }}
          >
            {CHEVRON}
          </Text>
        ) : null}
      </View>
    </View>
  );
});

export default DatePartSelectWeb;
