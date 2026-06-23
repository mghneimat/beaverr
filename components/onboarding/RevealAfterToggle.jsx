import { View } from 'react-native';
import { S } from '../../constants/onboarding-theme';
import AnimatedSlideIn from './AnimatedSlideIn';

/**
 * Content revealed after a Yes/No toggle — fixed gap as a layout sibling (not inside maxHeight animation).
 */
export default function RevealAfterToggle({
  show,
  gap = S.toggleRevealGap,
  duration,
  children,
}) {
  return (
    <>
      {show ? <View style={{ height: gap, flexShrink: 0 }} /> : null}
      <AnimatedSlideIn visible={show} duration={duration}>
        {children}
      </AnimatedSlideIn>
    </>
  );
}
