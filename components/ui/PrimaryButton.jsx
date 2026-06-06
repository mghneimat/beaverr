import React from 'react';
import { Button, ButtonText, ButtonIcon } from '@gluestack-ui/themed';

/**
 * PrimaryButton - Simplified button wrapper for GlueStack UI
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Button text
 * @param {Function} [props.onPress] - Press handler
 * @param {'sm'|'md'|'lg'} [props.size='md'] - Button size
 * @param {'primary'|'secondary'|'accent'|'outline'} [props.variant='primary'] - Button variant
 * @param {boolean} [props.disabled=false] - Disabled state
 * @param {React.ReactNode} [props.icon] - Optional icon component
 * @param {'left'|'right'} [props.iconPosition='left'] - Icon position
 * 
 * @example
 * <PrimaryButton onPress={handleContinue}>
 *   Continue
 * </PrimaryButton>
 * 
 * @example
 * <PrimaryButton variant="outline" size="sm">
 *   Cancel
 * </PrimaryButton>
 */
export function PrimaryButton({
  children,
  onPress,
  size = 'md',
  variant = 'primary',
  disabled = false,
  icon,
  iconPosition = 'left',
  ...props
}) {
  // Map variants to GlueStack UI actions
  const actionMap = {
    primary: 'primary',
    secondary: 'secondary',
    accent: 'positive', // Using positive for accent
    outline: 'secondary',
  };

  const variantMap = {
    primary: 'solid',
    secondary: 'outline',
    accent: 'solid',
    outline: 'outline',
  };

  return (
    <Button
      size={size}
      variant={variantMap[variant]}
      action={actionMap[variant]}
      onPress={onPress}
      isDisabled={disabled}
      {...props}
    >
      {icon && iconPosition === 'left' && <ButtonIcon as={icon} />}
      <ButtonText>{children}</ButtonText>
      {icon && iconPosition === 'right' && <ButtonIcon as={icon} />}
    </Button>
  );
}

export default PrimaryButton;
