import SkeletonBlock from './SkeletonBlock';

/**
 * Text-line skeleton — percentage width of parent.
 * @param {number|string} [width='100%']
 * @param {number} [height=14]
 */
export default function SkeletonLine({ width = '100%', height = 14, style }) {
  return (
    <SkeletonBlock
      width={width}
      height={height}
      borderRadius={6}
      style={style}
    />
  );
}
