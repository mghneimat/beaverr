import { createContext, useState } from 'react';
import { View, Platform } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { C, R, S, T } from '../../constants/onboarding-theme';
import DeleteTextButton from './DeleteTextButton';
import FieldError from './FieldError';

export const DropdownElevateContext = createContext(null);

/**
 * Groups related inputs with a shared card background.
 * Pass errorText for the group border; set showErrorMessage only when the group
 * itself should render the message (e.g. option lists with no field-level error).
 */
export default function InputGroup({
  label,
  optional = false,
  nested = false,
  onRemove,
  errorText,
  showErrorMessage = false,
  children,
  style,
}) {
  const [elevated, setElevated] = useState(false);
  const skipElevate = Platform.OS === 'web';
  const panelStyle = nested
    ? {
        padding: S.cardPad,
        backgroundColor: C.surface,
        borderRadius: R.input,
        borderWidth: errorText ? 2 : 1,
        borderColor: errorText ? C.danger : C.border,
        gap: S.fieldGap,
      }
    : {
        padding: S.cardPad,
        backgroundColor: C.surface,
        borderRadius: R.card,
        borderWidth: errorText ? 2 : 1,
        borderColor: errorText ? C.danger : C.border,
        gap: S.fieldGap,
      };

  return (
    <View
      style={{
        marginBottom: nested ? 0 : S.fieldGap,
        ...(elevated && !skipElevate
          ? {
              zIndex: 200,
              elevation: 12,
              ...(Platform.OS === 'web' ? { position: 'relative' } : null),
            }
          : null),
        ...style,
      }}
    >
      <DropdownElevateContext.Provider value={skipElevate ? () => {} : setElevated}>
        <View style={{ ...panelStyle, overflow: 'visible' }}>
          {label ? (
            <Text style={{ ...T.fieldLabel }}>
              {label}
              {optional ? (
                <Text style={{ fontWeight: '400', fontSize: 11, color: C.muted }}>{' (optional)'}</Text>
              ) : null}
            </Text>
          ) : null}
          {children}
          {showErrorMessage && errorText ? (
            <FieldError message={errorText} />
          ) : null}
          {onRemove ? <DeleteTextButton onPress={onRemove} /> : null}
        </View>
      </DropdownElevateContext.Provider>
    </View>
  );
}
