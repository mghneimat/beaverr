import React from 'react';
import { FormInput } from '../ui/FormInput';

function isFormInput(type) {
  if (!type) return false;
  if (type === FormInput || type.displayName === 'FormInput') return true;
  // LabeledInput re-exports FormInput as default — compare by name for bundler safety.
  return type.name === 'FormInput';
}

/**
 * Recursively inject validationError into the first FormInput without errorText.
 * @param {React.ReactNode} node
 * @param {string} validationError
 * @param {{ injected: boolean }} stats
 * @returns {React.ReactNode}
 */
function injectIntoNode(node, validationError, stats) {
  if (!validationError || !node) return node;
  if (!React.isValidElement(node)) return node;

  let el = node;

  if (isFormInput(node.type) && node.props.errorText == null && !node.props.optional) {
    stats.injected = true;
    return React.cloneElement(node, { errorText: validationError });
  }

  const childNodes = node.props?.children;
  if (!stats.injected && childNodes) {
    const mapped = React.Children.map(childNodes, (child) =>
      injectIntoNode(child, validationError, stats),
    );
    if (mapped != null && mapped !== childNodes) {
      el = React.cloneElement(el, { children: mapped });
    }
  }

  return el;
}

/**
 * @param {React.ReactNode} children
 * @param {string} [validationError]
 * @returns {{ nodes: React.ReactNode, injected: boolean }}
 */
export function injectValidationErrorIntoChildren(children, validationError) {
  const stats = { injected: false };
  if (!validationError) {
    return { nodes: children, injected: false };
  }

  const nodes = React.Children.map(children, (child) =>
    injectIntoNode(child, validationError, stats),
  );

  return { nodes, injected: stats.injected };
}
