import { createContext, useState } from 'react';
import { View, Platform } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { C, R, S, T } from '../../constants/onboarding-theme';
import RemoveButton from './RemoveButton';
import FieldError from './FieldError';

export const DropdownElevateContext = createContext(null);

/**
 * Groups related inputs (amount + frequency pills, etc.) with a shared card background.
 * The optional group label is rendered inside the panel so it shares the same background.
 *
 * @param {string} [props.label] - Heading inside the panel (omit when QuestionScreen title already shows it)
 * @param {boolean} [props.optional] - Appends muted "(optional)" after the group label
 * @param {boolean} [props.nested] - Inside another card — inset panel with surface background
 * @param {Function} [props.onRemove] - Optional remove control in the label row
 * @param {string} [props.errorText] - Validation message; red border on panel
 * @param {boolean} [props.showErrorMessage=true] - Render message below the panel (not inside)
 * @param {object} [props.style] - Additional outer styles
 */
export default function InputGroup({
  label,
  optional = false,
  nested = false,
  onRemove,
  errorText,
  showErrorMessage = true,
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
        {label || onRemove ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            {label ? (
              <Text style={{ ...T.fieldLabel, flex: 1 }}>
                {label}
                {optional ? (
                  <Text style={{ fontWeight: '400', fontSize: 11, color: C.muted }}>{' (optional)'}</Text>
                ) : null}
              </Text>
            ) : <View style={{ flex: 1 }} />}

            {onRemove ? <RemoveButton onPress={onRemove} /> : null}
          </View>
        ) : null}
        {children}
        </View>
      </DropdownElevateContext.Provider>
      {showErrorMessage && errorText ? (
        <FieldError message={errorText} style={{ marginTop: 6 }} />
      ) : null}
    </View>
  );
}
