import fs from 'fs';
import path from 'path';

const svgFile = process.argv[2] ?? path.join('logo', 'Beaver Logo V1.5.svg');
const svg = fs.readFileSync(svgFile, 'utf8');
const match = svg.match(/<path d="([^"]+)" fill="rgb\(24,81,77\)"/);
if (!match) {
  console.error(`Could not find green B path in ${svgFile}`);
  process.exit(1);
}

/** Compact path for react-native-svg (same format as BeaverBLogo.jsx). */
const compact = match[1]
  .replace(/,/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()
  .replace(/([MLHVCSQTAZ])\s+/gi, '$1')
  .replace(/([mlhvcsqta])\s+/g, '$1');

const out = `import Svg, { Path } from 'react-native-svg';

/** Wordmark green used beside the B in the sidebar */
export const BEAVER_BRAND_GREEN = '#18514D';

export const BEAVER_LOGO_COLOR = '#000000';

export const BEAVER_LOGO_VIEWBOX = '320 270 380 480';

/** Center of BEAVER_LOGO_VIEWBOX — used when scaling into other SVG scenes */
export const BEAVER_LOGO_CENTER = { x: 510, y: 510 };

export const B_PATH = '${compact}';

/**
 * Stylized “B” mark — synced from logo/Beaver Logo V1.5.svg via scripts/sync-beaver-logo.mjs
 * Source SVG: ${svgFile.replace(/\\/g, '/')}
 */
export default function BeaverBLogo({ size = 28, color = BEAVER_LOGO_COLOR }) {
  return (
    <Svg width={size} height={size} viewBox={BEAVER_LOGO_VIEWBOX} accessibilityRole="image">
      <Path d={B_PATH} fill={color} />
    </Svg>
  );
}
`;

const componentOut = path.join('components', 'app', 'BeaverBLogo.jsx');
const assetOut = path.join('assets', 'images', 'beaver-logo.svg');
fs.writeFileSync(componentOut, out);
fs.copyFileSync(svgFile, assetOut);
console.log(`Synced BeaverBLogo.jsx + ${assetOut} from ${svgFile} (${compact.length} chars)`);
