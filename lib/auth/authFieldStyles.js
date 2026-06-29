import { Platform } from 'react-native';
import { C, R, INPUT_FIELD } from '../../constants/onboarding-theme';

const AUTH_FIELD_BOX = Platform.OS === 'web' ? { boxSizing: 'border-box' } : {};

/**
 * @param {'filled' | 'outlined'} [variant]
 * @param {{ inRow?: boolean }} [options]
 * @returns {import('react-native').TextStyle}
 */
export function authInputStyle(variant = 'filled', options = {}) {
  const { inRow = false } = options;
  const base = {
    borderRadius: R.input,
    paddingHorizontal: INPUT_FIELD.paddingHorizontal,
    paddingVertical: INPUT_FIELD.paddingVertical,
    fontSize: 16,
    color: C.text,
    minHeight: INPUT_FIELD.minHeight,
    ...AUTH_FIELD_BOX,
    ...(inRow
      ? { flex: 1, minWidth: 0, width: '100%' }
      : { width: '100%', alignSelf: 'stretch' }),
  };

  if (variant === 'outlined') {
    return {
      ...base,
      borderWidth: 1,
      borderColor: C.border,
      backgroundColor: C.surface,
    };
  }

  return {
    ...base,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surface,
  };
}

/**
 * @param {'filled' | 'outlined'} [variant]
 */
export function authDropdownShellStyle(variant = 'filled') {
  const base = {
    width: '100%',
    alignSelf: 'stretch',
    borderRadius: R.input,
    paddingHorizontal: INPUT_FIELD.paddingHorizontal,
    paddingVertical: INPUT_FIELD.paddingVertical,
    minHeight: INPUT_FIELD.minHeight,
    ...AUTH_FIELD_BOX,
  };

  if (variant === 'outlined') {
    return {
      ...base,
      backgroundColor: C.surface,
      borderWidth: 1,
      borderColor: C.border,
    };
  }

  return {
    ...base,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
  };
}
