import Svg, { Path, Rect, Circle, Line, Polyline } from 'react-native-svg';

const ELEMENTS = {
  path: Path,
  rect: Rect,
  circle: Circle,
  line: Line,
  polyline: Polyline,
};

/**
 * @typedef {[keyof typeof ELEMENTS, Record<string, string>]} LucideNode
 */

/**
 * Renders official Lucide stroke icons via react-native-svg.
 * @param {{ nodes: LucideNode[], color: string, size?: number, strokeWidth?: number }} props
 */
export default function LucideStrokeIcon({
  nodes,
  color,
  size = 18,
  strokeWidth = 2,
}) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {nodes.map(([type, attrs]) => {
        const El = ELEMENTS[type];
        if (!El) return null;
        const { key, ...rest } = attrs;
        return <El key={key} {...rest} />;
      })}
    </Svg>
  );
}
