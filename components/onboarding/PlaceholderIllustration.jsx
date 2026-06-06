import React from 'react';
import Svg, { Rect, Path, Circle, G } from 'react-native-svg';

/**
 * Placeholder illustration shown above each onboarding question.
 * Full width, 300px high, with a subtle abstract graphic matching the blue/navy design system.
 */
export default function PlaceholderIllustration() {
  return (
    <Svg
      width="100%"
      height="100%"
      viewBox="0 0 560 300"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Background */}
      <Rect width="560" height="300" fill="#F8FAFF" rx="10" />

      {/* Decorative circles */}
      <Circle cx="120" cy="100" r="60" fill="rgba(37,99,235,0.06)" />
      <Circle cx="440" cy="120" r="45" fill="rgba(30,58,95,0.04)" />
      <Circle cx="280" cy="320" r="50" fill="rgba(37,99,235,0.05)" />
      <Circle cx="80" cy="280" r="30" fill="rgba(30,58,95,0.03)" />
      <Circle cx="480" cy="300" r="35" fill="rgba(37,99,235,0.04)" />

      {/* Abstract document/chart shape */}
      <G opacity="0.15">
        <Rect x="180" y="80" width="200" height="240" rx="12" fill="#1E3A5F" />
        <Rect x="200" y="110" width="160" height="6" rx="3" fill="#D1DCF0" />
        <Rect x="200" y="130" width="120" height="6" rx="3" fill="#D1DCF0" />
        <Rect x="200" y="160" width="140" height="80" rx="4" fill="#EFF4FB" />
        <Rect x="200" y="260" width="100" height="6" rx="3" fill="#D1DCF0" />
        <Rect x="200" y="280" width="80" height="6" rx="3" fill="#D1DCF0" />
      </G>

      {/* Accent bar */}
      <Rect x="230" y="200" width="100" height="4" rx="2" fill="#2563EB" opacity="0.3" />

      {/* Small decorative dots */}
      <Circle cx="160" cy="180" r="4" fill="#2563EB" opacity="0.2" />
      <Circle cx="400" cy="200" r="3" fill="#1E3A5F" opacity="0.15" />
      <Circle cx="340" cy="310" r="5" fill="#2563EB" opacity="0.15" />
      <Circle cx="200" cy="340" r="3" fill="#1E3A5F" opacity="0.1" />
    </Svg>
  );
}
