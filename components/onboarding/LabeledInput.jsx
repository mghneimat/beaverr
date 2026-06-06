import { useState } from 'react';
import { View, TextInput } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { C, T, S, R } from '../../constants/onboarding-theme';

/**
 * Standardised labeled input field.
 * Updated to match UI Examples design (blue/navy palette).
 * Supports optional currency symbol on the left when `currency` prop is provided.
 *
 * @param {Object} props
 * @param {string} [props.label] - Label text shown above the input
 * @param {boolean} [props.required] - Appends a red asterisk to the label
 * @param {boolean} [props.optional] - Appends "(optional)" to the label
 * @param {string} props.value - Controlled value
 * @param {Function} props.onChangeText - Change handler
 * @param {string} [props.placeholder] - Placeholder text
 * @param {string} [props.placeholderTextColor] - Override placeholder colour
 * @param {boolean} [props.numeric] - Sets keyboardType to "numeric"
 * @param {boolean} [props.large] - Uses large font (32px bold) for amount inputs
 * @param {boolean} [props.inCard] - Uses card-variant styling (smaller, bg tinted)
 * @param {string} [props.currency] - Currency symbol to show on the left (e.g. "$", "Kč")
 * @param {string} [props.frequency] - Optional frequency suffix on the right (e.g. "/year")
 * @param {number} [props.maxLength] - Max character count
 * @param {boolean} [props.multiline] - Multiline text input
 * @param {object} [props.inputStyle] - Additional styles merged onto the TextInput
 * @param {object} [props.containerStyle] - Additional styles on the outer View
 */
export default function LabeledInput({
  label,
  required = false,
  optional = false,
  value,
  onChangeText,
  placeholder,
  placeholderTextColor,
  numeric = false,
  large = false,
  inCard = false,
  currency,
  frequency,
  maxLength,
  multiline = false,
  inputStyle,
  containerStyle,
}) {
  const [focused, setFocused] = useState(false);
  const hasCurrency = !!currency;

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

  // ── Frequency suffix style ───────────────────────────────────────────────
  const freqStyle = large
    ? { fontSize: 14, lineHeight: 22, fontWeight: '500', color: C.muted }
    : inCard
    ? { fontSize: 12, lineHeight: 18, fontWeight: '400', color: C.muted }
    : { fontSize: 13, lineHeight: 20, fontWeight: '400', color: C.muted };

  // ── Input base style ─────────────────────────────────────────────────────
  const inputBase = inCard
    ? {
        backgroundColor: C.bg,
        borderWidth: 1,
        borderColor: C.border,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 15,
        color: C.text,
      }
    : large
    ? {
        backgroundColor: C.surface,
        borderWidth: 1.5,
        borderColor: C.border,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 10,
        color: C.text,
        fontSize: 32,
        fontWeight: '700',
      }
    : {
        backgroundColor: C.surface,
        borderWidth: 1.5,
        borderColor: C.border,
        borderRadius: R.input,
        paddingHorizontal: 16,
        paddingVertical: 14,
        color: C.text,
        fontSize: 17,
        fontWeight: '400',
      };

  return (
    <View style={[{ marginBottom: 16 }, containerStyle]}>
      {label ? (
        <Text style={{
          ...T.fieldLabel,
          marginBottom: S.labelGap,
        }}>
          {label}
          {required ? (
            <Text style={{ color: C.accent }}>{' *'}</Text>
          ) : null}
          {optional ? (
            <Text style={{ fontWeight: '400', fontSize: 11, color: C.muted }}>{' (optional)'}</Text>
          ) : null}
        </Text>
      ) : null}

      {hasCurrency ? (
        /* ── Currency mode: symbol on left, input, optional frequency ── */
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

          {/* Editable amount — no inner border, outer container handles it */}
          <TextInput
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={placeholderTextColor ?? C.placeholder}
            keyboardType={numeric ? 'numeric' : 'default'}
            maxLength={maxLength}
            multiline={multiline}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            style={[
              inCard
                ? { fontSize: 15, color: C.text, paddingVertical: 0 }
                : large
                ? { fontSize: 32, fontWeight: '700', color: C.text, paddingVertical: 0 }
                : { fontSize: 17, fontWeight: '400', color: C.text, paddingVertical: 0 },
              {
                flex: 1,
                paddingVertical: 0,
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
      ) : (
        /* ── Standard mode: plain TextInput ── */
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={placeholderTextColor ?? C.placeholder}
          keyboardType={numeric ? 'numeric' : 'default'}
          maxLength={maxLength}
          multiline={multiline}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[
            inputBase,
            {
              borderColor: focused ? C.accent : C.border,
              borderWidth: borderW,
              outlineStyle: 'none',
              outlineWidth: 0,
            },
            inputStyle,
          ]}
        />
      )}
    </View>
  );
}
