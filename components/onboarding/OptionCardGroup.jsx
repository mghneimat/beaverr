import { Children, cloneElement, isValidElement } from 'react';
import { View } from 'react-native';
import { useOnboardingLayout } from '../../lib/onboardingLayout';

/**
 * Lays out OptionCards in a row on tablet/desktop, stacked full-width on phone.
 */
export default function OptionCardGroup({ children, style, gap = 10, marginBottom }) {
  const { isPhone } = useOnboardingLayout();
  const stack = isPhone;

  const items = Children.map(children, (child) => {
    if (!isValidElement(child)) return child;
    return cloneElement(child, {
      labelLines: stack ? 2 : 1,
      style: [
        child.props.style,
        stack ? { width: '100%', flex: undefined, marginBottom: 0 } : { flex: 1, marginBottom: 0 },
      ],
    });
  });

  return (
    <View
      style={[
        {
          flexDirection: stack ? 'column' : 'row',
          gap,
          marginBottom,
        },
        style,
      ]}
    >
      {items}
    </View>
  );
}
