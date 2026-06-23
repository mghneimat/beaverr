import Svg from 'react-native-svg';

/**
 * Shared Svg shell for onboarding rafiki/amico illustrations — size, viewBox, a11y.
 */
export default function OnboardingIllustrationSvg({
  size,
  viewWidth,
  viewHeight,
  viewMinX = 0,
  viewMinY = 0,
  accessibilityLabel,
  children,
}) {
  const aspect = viewHeight / viewWidth;
  const height = size * aspect;

  return (
    <Svg
      width={size}
      height={height}
      viewBox={`${viewMinX} ${viewMinY} ${viewWidth} ${viewHeight}`}
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
    >
      {children}
    </Svg>
  );
}
