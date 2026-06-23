import { useState, useRef, useEffect } from 'react';
import { View, TextInput, Platform } from 'react-native';
import { webFocusRing } from '../../lib/a11y';
import { useOnboardingScroll } from '../../lib/onboardingScroll';
import {
  FormControl,
  FormControlLabel,
  FormControlLabelText,
  FormControlHelper,
  FormControlHelperText,
  FormControlError,
  FormControlErrorText,
  Text,
} from '@gluestack-ui/themed';
import { C, T, S, R, INPUT_FIELD } from '../../constants/onboarding-theme';
import AnimatedCollapse from '../dashboard/AnimatedCollapse';
import { sanitizeAmountInput } from '../../lib/finance';
import { parseAmount, amountToString } from '../../lib/sectionEditStorage';
import { useClearOnboardingValidation } from '../../lib/onboardingValidationClear';

/**
 * Gluestack-backed labeled input — full parity with legacy LabeledInput.
 * Uses FormControl for label/error; TextInput for reliable border-radius on web.
 */
export function FormInput({
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
  helperText,
  errorText,
  onErrorClear,
  disabled = false,
  size = 'md',
  inGroup = false,
  accessibilityLabel,
  onFocus,
  onBlur,
}) {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef(null);
  const fieldAnchorRef = useRef(null);
  const { scrollToAnchor } = useOnboardingScroll();
  const clearValidation = useClearOnboardingValidation();
  const hasCurrency = !!currency;
  const isAmountInput = hasCurrency;
  const isInvalid = !!errorText;
  const borderW = isInvalid ? 2 : 1.5;
  const fieldRadius = inCard ? R.input : R.pill;

  const fieldBorderColor = isInvalid ? C.danger : focused ? C.accent : C.border;

  useEffect(() => {
    if (!errorText) return;
    inputRef.current?.focus?.();
  }, [errorText]);

  const groupedLargeBg = inGroup ? 'transparent' : C.surface;

  const fieldPadH = inCard ? 14 : INPUT_FIELD.paddingHorizontal;
  const fieldPadV = INPUT_FIELD.paddingVertical;
  const fieldMinH = INPUT_FIELD.minHeight;
  const hasValue = Boolean((value || '').length);
  /** Keep empty multiline fields single-line (centered placeholder) until the user types. */
  const effectiveMultiline = multiline && hasValue;
  const textAlignVertical = effectiveMultiline ? 'top' : 'center';
  const multilineFieldRadius = multiline ? R.input : fieldRadius;

  const amountKeyboardType = Platform.OS === 'web' ? 'numeric' : 'decimal-pad';

  const handleChangeText = (text) => {
    if (!onChangeText) return;
    if (errorText) {
      onErrorClear?.();
      clearValidation?.();
    }
    onChangeText(isAmountInput ? sanitizeAmountInput(text) : text);
  };

  const handleFocus = () => {
    setFocused(true);
    if (Platform.OS !== 'web') {
      scrollToAnchor(fieldAnchorRef);
    }
    onFocus?.();
  };

  const handleBlur = () => {
    setFocused(false);
    if (isAmountInput && onChangeText && value) {
      const parsed = parseAmount(value);
      if (parsed != null) {
        onChangeText(amountToString(parsed));
      }
    }
    onBlur?.();
  };

  const containerBase = inCard
    ? {
        backgroundColor: C.bg,
        borderWidth: borderW,
        borderColor: C.border,
        borderRadius: R.input,
        paddingHorizontal: fieldPadH,
        paddingVertical: fieldPadV,
        minHeight: fieldMinH,
      }
    : large
    ? {
        backgroundColor: groupedLargeBg,
        borderWidth: borderW,
        borderColor: C.border,
        borderRadius: fieldRadius,
        paddingHorizontal: INPUT_FIELD.paddingHorizontal,
        paddingVertical: fieldPadV,
        minHeight: fieldMinH,
      }
    : {
        backgroundColor: C.surface,
        borderWidth: borderW,
        borderColor: C.border,
        borderRadius: fieldRadius,
        paddingHorizontal: INPUT_FIELD.paddingHorizontal,
        paddingVertical: fieldPadV,
        minHeight: fieldMinH,
      };

  const currencyStyle = large
    ? { fontSize: 18, lineHeight: 26, fontWeight: '600', color: C.muted }
    : inCard
    ? { fontSize: 15, lineHeight: 22, fontWeight: '500', color: C.muted }
    : { fontSize: 17, lineHeight: 24, fontWeight: '500', color: C.muted };

  const freqStyle = large
    ? { fontSize: 13, lineHeight: 20, fontWeight: '500', color: C.muted, paddingRight: frequency ? 4 : 0 }
    : inCard
    ? { fontSize: 12, lineHeight: 18, fontWeight: '400', color: C.muted }
    : { fontSize: 13, lineHeight: 20, fontWeight: '400', color: C.muted };

  const inputBase = inCard
    ? {
        backgroundColor: C.bg,
        borderWidth: borderW,
        borderColor: C.border,
        borderRadius: R.input,
        paddingHorizontal: fieldPadH,
        paddingVertical: fieldPadV,
        minHeight: fieldMinH,
        fontSize: 15,
        color: C.text,
      }
    : large
    ? {
        backgroundColor: groupedLargeBg,
        borderWidth: borderW,
        borderColor: C.border,
        borderRadius: fieldRadius,
        paddingHorizontal: INPUT_FIELD.paddingHorizontal,
        paddingVertical: fieldPadV,
        minHeight: fieldMinH,
        color: C.text,
        fontSize: 22,
        fontWeight: '600',
      }
    : {
        backgroundColor: C.surface,
        borderWidth: borderW,
        borderColor: C.border,
        borderRadius: fieldRadius,
        paddingHorizontal: INPUT_FIELD.paddingHorizontal,
        paddingVertical: fieldPadV,
        minHeight: fieldMinH,
        color: C.text,
        fontSize: 17,
        fontWeight: '400',
      };

  const renderInput = () => {
    if (hasCurrency) {
      return (
        <View
          style={[
            containerBase,
            {
              flexDirection: 'row',
              alignItems: 'center',
              gap: large ? 8 : 6,
              borderColor: fieldBorderColor,
              borderWidth: borderW,
              opacity: disabled ? 0.6 : 1,
              ...webFocusRing(focused, { invalid: isInvalid }),
            },
          ]}
        >
          <Text style={currencyStyle}>{currency}</Text>
          <TextInput
            ref={inputRef}
            value={value}
            onChangeText={handleChangeText}
            placeholder={placeholder}
            placeholderTextColor={placeholderTextColor ?? C.placeholder}
            keyboardType={isAmountInput ? amountKeyboardType : 'default'}
            {...(Platform.OS === 'web' && isAmountInput ? { inputMode: 'decimal' } : {})}
            maxLength={maxLength}
            multiline={effectiveMultiline}
            editable={!disabled}
            accessibilityLabel={accessibilityLabel ?? label}
            autoComplete={Platform.OS === 'web' && isAmountInput ? 'off' : undefined}
            onFocus={handleFocus}
            onBlur={handleBlur}
            returnKeyType="done"
            blurOnSubmit={!effectiveMultiline}
            onSubmitEditing={() => {
              if (!effectiveMultiline) inputRef.current?.blur?.();
            }}
            style={[
              inCard
                ? { fontSize: 15, color: C.text, paddingVertical: 0, textAlignVertical }
                : large
                ? { fontSize: 22, fontWeight: '600', color: C.text, paddingVertical: 0, textAlignVertical }
                : { fontSize: 17, fontWeight: '400', color: C.text, paddingVertical: 0, textAlignVertical },
              {
                flex: 1,
                paddingVertical: 0,
                outlineStyle: 'none',
                outlineWidth: 0,
                ...(Platform.OS === 'web' ? { outline: 'none', boxShadow: 'none' } : {}),
              },
              inputStyle,
            ]}
          />
          {frequency ? <Text style={freqStyle}>{frequency}</Text> : null}
        </View>
      );
    }

    const innerInputStyle = inCard
      ? { fontSize: 15, color: C.text, paddingVertical: 0, textAlignVertical }
      : large
        ? { fontSize: 22, fontWeight: '600', color: C.text, paddingVertical: 0, textAlignVertical }
        : { fontSize: 17, fontWeight: '400', color: C.text, paddingVertical: 0, textAlignVertical };

    return (
      <View
        style={[
          {
            backgroundColor: inCard ? (inGroup ? 'transparent' : C.bg) : large ? groupedLargeBg : (inGroup ? 'transparent' : C.surface),
            borderWidth: borderW,
            borderColor: fieldBorderColor,
            borderRadius: multilineFieldRadius,
            minHeight: fieldMinH,
            paddingHorizontal: inCard ? fieldPadH : INPUT_FIELD.paddingHorizontal,
            paddingVertical: fieldPadV,
            justifyContent: effectiveMultiline ? 'flex-start' : 'center',
            opacity: disabled ? 0.6 : 1,
          },
          webFocusRing(focused, { invalid: isInvalid }),
        ]}
      >
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={handleChangeText}
          placeholder={placeholder}
          placeholderTextColor={placeholderTextColor ?? C.placeholder}
          keyboardType={isAmountInput ? amountKeyboardType : 'default'}
          {...(Platform.OS === 'web' && isAmountInput ? { inputMode: 'decimal' } : {})}
          maxLength={maxLength}
          multiline={effectiveMultiline}
          editable={!disabled}
          accessibilityLabel={accessibilityLabel ?? label}
          autoComplete={Platform.OS === 'web' && isAmountInput ? 'off' : undefined}
          onFocus={handleFocus}
          onBlur={handleBlur}
          returnKeyType={effectiveMultiline ? 'default' : 'done'}
          blurOnSubmit={!effectiveMultiline}
          onSubmitEditing={() => {
            if (!effectiveMultiline) inputRef.current?.blur?.();
          }}
          style={[
            innerInputStyle,
            {
              width: '100%',
              borderWidth: 0,
              paddingVertical: 0,
              backgroundColor: 'transparent',
              outlineStyle: 'none',
              outlineWidth: 0,
              ...(Platform.OS === 'web' ? { outline: 'none', boxShadow: 'none' } : {}),
              textAlignVertical,
            },
            inputStyle,
          ]}
        />
      </View>
    );
  };

  return (
    <View ref={fieldAnchorRef} collapsable={false} {...(Platform.OS === 'web' && isAmountInput ? { dataSet: { amountInput: 'true' } } : {})}>
    <FormControl
      isInvalid={isInvalid}
      isDisabled={disabled}
      size={size}
      style={[{ marginBottom: inGroup ? 0 : 16 }, containerStyle]}
    >
      {label ? (
        <FormControlLabel style={{ marginBottom: S.labelGap }}>
          <FormControlLabelText style={T.fieldLabel}>
            {label}
            {required ? (
              <FormControlLabelText style={{ color: C.accent }}>{' *'}</FormControlLabelText>
            ) : null}
            {optional ? (
              <FormControlLabelText style={{ fontWeight: '400', fontSize: 11, color: C.muted }}>
                {' (optional)'}
              </FormControlLabelText>
            ) : null}
          </FormControlLabelText>
        </FormControlLabel>
      ) : null}

      {renderInput()}

      <AnimatedCollapse visible={!!helperText && !isInvalid} fallbackHeight={20}>
        {helperText ? (
          <FormControlHelper style={{ marginTop: 4 }}>
            <FormControlHelperText style={T.hint}>{helperText}</FormControlHelperText>
          </FormControlHelper>
        ) : null}
      </AnimatedCollapse>

      <AnimatedCollapse visible={!!errorText} fallbackHeight={18}>
        {errorText ? (
          <FormControlError style={{ marginTop: 4, paddingTop: 0 }}>
            <FormControlErrorText
              accessibilityRole="alert"
              accessibilityLiveRegion="polite"
              style={{ color: C.danger, fontSize: 13, lineHeight: 16 }}
            >
              {errorText}
            </FormControlErrorText>
          </FormControlError>
        ) : null}
      </AnimatedCollapse>
    </FormControl>
    </View>
  );
}

FormInput.displayName = 'FormInput';

export default FormInput;
