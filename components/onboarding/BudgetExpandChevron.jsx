import { C } from '../../constants/onboarding-theme';
import ExpandCollapseIcon from './ExpandCollapseIcon';

/** Compact expand/collapse indicator — sits beside the label, not at column edge. */
export default function BudgetExpandChevron({
  expanded,
  color = C.primary,
  compact = false,
  active = false,
  hovered = false,
  pressed = false,
}) {
  return (
    <ExpandCollapseIcon
      expanded={expanded}
      color={color}
      active={active}
      compact={compact}
      hovered={hovered}
      pressed={pressed}
      style={compact ? undefined : { marginLeft: 6 }}
    />
  );
}
