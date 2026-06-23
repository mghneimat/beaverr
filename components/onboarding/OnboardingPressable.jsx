import { useState, Children } from 'react';
import { Pressable, Platform, View } from 'react-native';

/** RN Web rejects whitespace-only text nodes as direct View children. */
function stripWhitespaceChildren(children) {
  return Children.toArray(children).filter(
    (child) => !(typeof child === 'string' && !child.trim()),
  );
}

/**
 * Pressable with `hovered` in style/children callbacks — use for all onboarding clickables.
 */
export default function OnboardingPressable({ style, contentStyle, children, disabled, ...rest }) {
  const [hovered, setHovered] = useState(false);

  const webCursor = Platform.OS === 'web'
    ? { cursor: disabled ? 'default' : 'pointer' }
    : null;

  const mergedStyle = typeof style === 'function'
    ? (state) => {
        const resolved = style({ ...state, hovered });
        return webCursor ? [resolved, webCursor] : resolved;
      }
    : webCursor ? [style, webCursor] : style;

  const renderChildren = (state) => {
    if (typeof children === 'function') {
      const rendered = children({ ...state, hovered });
      if (contentStyle) {
        return <View collapsable={false} style={contentStyle}>{rendered}</View>;
      }
      return rendered;
    }
    const nodes = stripWhitespaceChildren(children);
    if (nodes.length === 0) return null;
    if (nodes.length === 1) return nodes[0];
    return <View collapsable={false} style={contentStyle}>{nodes}</View>;
  };

  return (
    <Pressable
      {...rest}
      disabled={disabled}
      onHoverIn={(e) => {
        if (disabled) return;
        setHovered(true);
        rest.onHoverIn?.(e);
      }}
      onHoverOut={(e) => {
        if (disabled) return;
        setHovered(false);
        rest.onHoverOut?.(e);
      }}
      style={mergedStyle}
    >
      {typeof children === 'function'
        ? (state) => renderChildren(state)
        : renderChildren({ pressed: false })}
    </Pressable>
  );
}
