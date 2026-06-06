import { useState } from 'react';
import { View, TextInput } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { C, R, T, S } from '../../constants/onboarding-theme';

/**
 * CurrencyInput — Standardised currency amount input field.
 *
 * Matches the UI Examples Screen 5 pattern:
 *   [currency symbol] [editable amount with bottom border] [optional frequency suffix]
 *
 * Wraps a react-native TextInput inside a styled container with the currency
 * symbol rendered to the left. Uses design tokens from onboarding-theme.js.
 *
 * @param {Object} props
 * @param {string} [props.label] - Label text shown above the input
 * @param {boolean} [props.required] - Appends a red asterisk to the label
 * @param {boolean} [props.optional] - Appends "(optional)" to the label
 * @param {string} props.value - Controlled value
 * @param {Function} props.onChangeText - Change handler
 * @param {string} [props.placeholder] - Placeholder text
 * @param {string} [props.placeholderTextColor] - Override placeholder colour
 * @param {boolean} [props.numeric=true] - Sets keyboardType to "numeric"
 * @param {string} [props.currency='$'] - Currency symbol displayed on the left
 * @param {string} [props.frequency] - Optional frequency suffix (e.g. "/year", "/month")
 * @param {boolean} [props.large] - Uses large font (32px bold) for standalone amount inputs
 * @param {boolean} [props.inCard] - Uses card-variant styling (smaller, bg tinted)
 * @param {number} [props.maxLength] - Max character count
 * @param {object} [props.inputStyle] - Additional styles merged onto the TextInput
 * @param {object} [props.containerStyle] - Additional styles on the outer View
 */
export default function CurrencyInput({
  label,
  required = false,
  optional = false,
  value,
  onChangeText,
  placeholder,
  placeholderTextColor,
  numeric = true,
  currency = '$',
  frequency,
  large = false,
  inCard = false,
  maxLength,
  inputStyle,
  containerStyle,
}) {
  const [focused, setFocused] = useState(false);

  // Consistent border width — always use the focused (thicker) width so
  // the layout never shifts on focus/blur. Only the border colour changes.
  const borderW = inCard ? 2 : 2.5;

  // ── Container style ──────────────────────────────────────────────────────
  const containerBase = inCard
    ? {
        backgroundColor: C.bg,
        borderWidth: borderW,
        borderColor: C.border,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
      }
    : large
    ? {
        backgroundColor: C.surface,
        borderWidth: borderW,
        borderColor: C.border,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 10,
      }
    : {
        backgroundColor: C.surface,
        borderWidth: borderW,
        borderColor: C.border,
        borderRadius: R.input,
        paddingHorizontal: 16,
        paddingVertical: 14,
      };

  // ── Currency symbol style ────────────────────────────────────────────────
  const currencyStyle = large
    ? { fontSize: 24, lineHeight: 32, fontWeight: '600', color: C.muted }
    : inCard
    ? { fontSize: 15, lineHeight: 22, fontWeight: '500', color: C.muted }
    : { fontSize: 17, lineHeight: 24, fontWeight: '500', color: C.muted };

  // ── Input style ──────────────────────────────────────────────────────────
  const inputBase = inCard
    ? {
        fontSize: 15,
        fontWeight: '400',
        color: C.text,
        paddingVertical: 0,
      }
    : large
    ? {
        fontSize: 32,
        fontWeight: '700',
        color: C.text,
        paddingVertical: 0,
      }
    : {
        fontSize: 17,
        fontWeight: '400',
        color: C.text,
        paddingVertical: 0,
      };

  // ── Frequency suffix style ───────────────────────────────────────────────
  const freqStyle = large
    ? { fontSize: 14, lineHeight: 22, fontWeight: '500', color: C.muted }
    : inCard
    ? { fontSize: 12, lineHeight: 18, fontWeight: '400', color: C.muted }
    : { fontSize: 13, lineHeight: 20, fontWeight: '400', color: C.muted };

  return (
    <View style={[{ marginBottom: 16 }, containerStyle]}>
      {label ? (
        <Text
          style={{
            ...T.fieldLabel,
            marginBottom: S.labelGap,
          }}
        >
          {label}
          {required ? (
            <Text style={{ color: C.accent }}>{' *'}</Text>
          ) : null}
          {optional ? (
            <Text style={{ fontWeight: '400', fontSize: 11, color: C.muted }}>
              {' (optional)'}
            </Text>
          ) : null}
        </Text>
      ) : null}

      <View
        style={[
          containerBase,
          {
            flexDirection: 'row',
            alignItems: 'center',
            gap: large ? 8 : 6,
            borderColor: focused ? C.accent : C.border,
            borderWidth: borderW,
          },
        ]}
      >
        {/* Currency symbol on the left */}
        <Text style={currencyStyle}>{currency}</Text>

        {/* Editable amount with bottom border */}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={placeholderTextColor ?? C.placeholder}
          keyboardType={numeric ? 'numeric' : 'default'}
          maxLength={maxLength}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[
            inputBase,
            {
              flex: 1,
              borderBottomWidth: 1.5,
              borderBottomColor: focused ? C.accent : C.border,
              paddingBottom: large ? 4 : 2,
              outlineStyle: 'none',
              outlineWidth: 0,
            },
            inputStyle,
          ]}
        />

        {/* Optional frequency suffix on the right */}
        {frequency ? (
          <Text style={freqStyle}>{frequency}</Text>
        ) : null}
      </View>
    </View>
  );
}
