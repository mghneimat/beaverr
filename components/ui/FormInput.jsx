import React from 'react';
import {
  FormControl,
  FormControlLabel,
  FormControlLabelText,
  FormControlHelper,
  FormControlHelperText,
  FormControlError,
  FormControlErrorText,
  Input,
  InputField,
} from '@gluestack-ui/themed';

/**
 * FormInput - Simplified input wrapper for GlueStack UI
 * Replaces the old LabeledInput component
 * 
 * @param {Object} props
 * @param {string} [props.label] - Label text
 * @param {boolean} [props.required=false] - Shows asterisk if true
 * @param {boolean} [props.optional=false] - Shows "(optional)" text
 * @param {string} props.value - Controlled value
 * @param {Function} props.onChangeText - Change handler
 * @param {string} [props.placeholder] - Placeholder text
 * @param {'sm'|'md'|'lg'} [props.size='md'] - Input size
 * @param {boolean} [props.numeric=false] - Numeric keyboard
 * @param {boolean} [props.multiline=false] - Multiline input
 * @param {number} [props.maxLength] - Max character count
 * @param {string} [props.helperText] - Helper text below input
 * @param {string} [props.errorText] - Error text (shows error state)
 * @param {boolean} [props.disabled=false] - Disabled state
 * 
 * @example
 * <FormInput
 *   label="Email"
 *   value={email}
 *   onChangeText={setEmail}
 *   placeholder="Enter your email"
 *   required
 * />
 * 
 * @example
 * <FormInput
 *   label="Amount"
 *   value={amount}
 *   onChangeText={setAmount}
 *   numeric
 *   size="lg"
 *   errorText="Please enter a valid amount"
 * />
 */
export function FormInput({
  label,
  required = false,
  optional = false,
  value,
  onChangeText,
  placeholder,
  size = 'md',
  numeric = false,
  multiline = false,
  maxLength,
  helperText,
  errorText,
  disabled = false,
  ...props
}) {
  const isInvalid = !!errorText;

  return (
    <FormControl isInvalid={isInvalid} isDisabled={disabled} size={size}>
      {label && (
        <FormControlLabel>
          <FormControlLabelText>
            {label}
            {required && <FormControlLabelText color="$error"> *</FormControlLabelText>}
            {optional && (
              <FormControlLabelText color="$textLight400" fontSize="$xs">
                {' '}(optional)
              </FormControlLabelText>
            )}
          </FormControlLabelText>
        </FormControlLabel>
      )}

      <Input>
        <InputField
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          keyboardType={numeric ? 'numeric' : 'default'}
          maxLength={maxLength}
          multiline={multiline}
          {...props}
        />
      </Input>

      {helperText && !isInvalid && (
        <FormControlHelper>
          <FormControlHelperText>{helperText}</FormControlHelperText>
        </FormControlHelper>
      )}

      {errorText && (
        <FormControlError>
          <FormControlErrorText>{errorText}</FormControlErrorText>
        </FormControlError>
      )}
    </FormControl>
  );
}

export default FormInput;
