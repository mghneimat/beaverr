import { Children, cloneElement, isValidElement } from 'react';

/** Strip whitespace text nodes — RN Web rejects them as direct View children. */
export function compactChildren(children) {
  let index = 0;
  return Children.map(Children.toArray(children), (child) => {
    if (child == null || child === false) {
      return null;
    }
    if (typeof child === 'string' && child.trim() === '') {
      return null;
    }
    if (isValidElement(child) && child.key == null) {
      return cloneElement(child, { key: `compact-${index++}` });
    }
    index += 1;
    return child;
  });
}
