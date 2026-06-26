import LucideStrokeIcon from '../app/LucideStrokeIcon';
import { CIRCLE_CHECK_NODES } from '../app/lucidePaths';
import { C } from '../../constants/onboarding-theme';

/**
 * Green circle-check for inline auth field validation success.
 */
export default function AuthFieldCircleCheck() {
  return (
    <LucideStrokeIcon
      nodes={CIRCLE_CHECK_NODES}
      color={C.positive}
      size={20}
      strokeWidth={2}
    />
  );
}
