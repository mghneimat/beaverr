/**
 * One-off: undraw SVG → react-native-svg component (nested <G> preserved).
 * Usage: node scripts/generate-undraw-illustration.mjs <svgPath> <componentName> <i18nKey>
 */
import fs from 'fs';
import path from 'path';

const svgPath = process.argv[2];
const componentName = process.argv[3];
const i18nKey = process.argv[4];
/** Optional viewBox crop: minX,minY,width,height */
const cropArg = process.argv[5];
const assetName = path.basename(svgPath);

if (!svgPath || !componentName || !i18nKey) {
  console.error(
    'Usage: node scripts/generate-undraw-illustration.mjs <svg> <ComponentName> <i18n.key> [minX,minY,width,height]',
  );
  process.exit(1);
}

const raw = fs.readFileSync(svgPath, 'utf8');
const viewBoxMatch = raw.match(/viewBox="([^"]+)"/);
const viewBoxParts = (viewBoxMatch?.[1] ?? '0 0 800 500').split(/\s+/).map(Number);
let viewMinX = viewBoxParts[0] ?? 0;
let viewMinY = viewBoxParts[1] ?? 0;
let vw = viewBoxParts[2] ?? 800;
let vh = viewBoxParts[3] ?? 500;
if (cropArg) {
  const [cx, cy, cw, ch] = cropArg.split(',').map(Number);
  if ([cx, cy, cw, ch].every((n) => Number.isFinite(n))) {
    viewMinX = cx;
    viewMinY = cy;
    vw = cw;
    vh = ch;
  }
}

function camelAttr(name) {
  if (name === 'class') return 'className';
  if (name.includes('-')) {
    return name.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
  }
  return name;
}

function parseStyle(styleStr) {
  const result = {};
  if (!styleStr) return result;
  const fillMatch = styleStr.match(/fill:\s*([^;]+)/i);
  if (fillMatch) {
    let fill = fillMatch[1].trim();
    if (fill.startsWith('url(')) fill = '#9ca3af';
    else if (fill === 'none') fill = 'none';
    else if (fill.toLowerCase() === '#407bff') fill = '#3B82F6';
    result.fill = fill;
  }
  const opacityMatch = styleStr.match(/(?:^|;)opacity:\s*([^;]+)/i);
  if (opacityMatch) {
    result.opacity = opacityMatch[1].trim();
  }
  const fontSizeMatch = styleStr.match(/font-size:\s*([\d.]+)px/i);
  if (fontSizeMatch) {
    result.fontSize = parseFloat(fontSizeMatch[1]);
  }
  const fontWeightMatch = styleStr.match(/font-weight:\s*(\d+)/i);
  if (fontWeightMatch) {
    result.fontWeight = fontWeightMatch[1];
  }
  const letterSpacingMatch = styleStr.match(/letter-spacing:\s*([-\d.]+)em/i);
  if (letterSpacingMatch) {
    result.letterSpacingEm = parseFloat(letterSpacingMatch[1]);
  }
  const strokeMatch = styleStr.match(/stroke:\s*([^;]+)/i);
  if (strokeMatch) {
    result.stroke = strokeMatch[1].trim();
  }
  const strokeWidthMatch = styleStr.match(/stroke-width:\s*([\d.]+)(?:px)?/i);
  if (strokeWidthMatch) {
    result.strokeWidth = parseFloat(strokeWidthMatch[1]);
  }
  const strokeLinecapMatch = styleStr.match(/stroke-linecap:\s*([^;]+)/i);
  if (strokeLinecapMatch) {
    result.strokeLinecap = strokeLinecapMatch[1].trim();
  }
  const strokeLinejoinMatch = styleStr.match(/stroke-linejoin:\s*([^;]+)/i);
  if (strokeLinejoinMatch) {
    result.strokeLinejoin = strokeLinejoinMatch[1].trim();
  }
  const strokeMiterlimitMatch = styleStr.match(/stroke-miterlimit:\s*([\d.]+)/i);
  if (strokeMiterlimitMatch) {
    result.strokeMiterlimit = parseFloat(strokeMiterlimitMatch[1]);
  }
  return result;
}

function parseAttrs(attrStr) {
  const attrs = {};
  const skip = new Set(['style', 'xmlns', 'xmlnsXlink', 'role', 'artist', 'source']);
  const re = /([\w:-]+)="([^"]*)"/g;
  let m;
  while ((m = re.exec(attrStr)) !== null) {
    const key = camelAttr(m[1]);
    if (skip.has(key)) continue;
    let val = m[2];
    if (key === 'opacity') val = `{${val}}`;
    else if (key === 'fill') {
      if (val.startsWith('url(')) val = '#9ca3af';
      else if (val.toLowerCase() === '#407bff') val = '#3B82F6';
    }
    attrs[key] = val;
  }
  const styleMatch = attrStr.match(/\bstyle="([^"]*)"/);
  if (styleMatch) {
    Object.assign(attrs, parseStyle(styleMatch[1]));
  }
  return attrs;
}

function attrsToJsx(attrs, indent) {
  return Object.entries(attrs)
    .map(([k, v]) => {
      if (k === 'transform') return `${indent}transform="${v}"`;
      if (k === 'opacity') return `${indent}opacity={${v.replace(/[{}]/g, '')}}`;
      if (k === 'fill') return `${indent}fill="${v}"`;
      if (k === 'd' || k === 'points') return `${indent}${k}="${v}"`;
      if (['cx', 'cy', 'r', 'rx', 'ry', 'x', 'y', 'width', 'height', 'fontSize', 'letterSpacing', 'x1', 'y1', 'x2', 'y2', 'strokeWidth', 'strokeMiterlimit'].includes(k)) {
        const num = Number(v);
        return `${indent}${k}={${Number.isNaN(num) ? `"${v}"` : num}}`;
      }
      if (k === 'fontWeight') return `${indent}fontWeight="${v}"`;
      if (k === 'stroke' || k === 'strokeLinecap' || k === 'strokeLinejoin') {
        return `${indent}${k}="${v}"`;
      }
      return `${indent}${k}="${v}"`;
    })
    .join('\n');
}

const tagMap = {
  path: 'Path',
  ellipse: 'Ellipse',
  circle: 'Circle',
  rect: 'Rect',
  polygon: 'Polygon',
  polyline: 'Polyline',
  line: 'Line',
  g: 'G',
  text: 'Text',
  tspan: 'TSpan',
};
const usedTags = new Set();

function convertTextElement(nodeStr, depth, tag) {
  const indent = '  '.repeat(depth);
  const rnTag = tagMap[tag];
  usedTags.add(rnTag);

  const openMatch = nodeStr.match(/^<(\w+)([^>]*?)(\/?)>/);
  if (!openMatch) return '';

  const attrs = parseAttrs(openMatch[2] || '');
  if (attrs.letterSpacingEm != null) {
    const fs = attrs.fontSize ?? 16;
    attrs.letterSpacing = attrs.letterSpacingEm * fs;
    delete attrs.letterSpacingEm;
  }
  if (!attrs.fill) attrs.fill = '#000000';

  const closeTag = `</${tag}>`;
  const closeIdx = nodeStr.lastIndexOf(closeTag);
  const inner = nodeStr.slice(openMatch[0].length, closeIdx);

  const childParts = [];
  let i = 0;
  while (i < inner.length) {
    const nextOpen = inner.indexOf('<', i);
    if (nextOpen === -1) break;
    if (inner[nextOpen + 1] === '/') {
      i = inner.indexOf('>', nextOpen) + 1;
      continue;
    }
    const pos = findElementEnd(inner, nextOpen);
    const childTag = inner.slice(nextOpen + 1).match(/^(\w+)/)?.[1];
    if (childTag === 'tspan') {
      childParts.push(convertTextElement(inner.slice(nextOpen, pos), depth + 1, 'tspan'));
    }
    i = pos;
  }

  if (childParts.length > 0) {
    return `${indent}<${rnTag}\n${attrsToJsx(attrs, indent + '  ')}\n${indent}>\n${childParts.join('\n')}\n${indent}</${rnTag}>`;
  }

  const text = inner.trim();
  if (text) {
    return `${indent}<${rnTag}\n${attrsToJsx(attrs, indent + '  ')}\n${indent}>{${JSON.stringify(text)}}</${rnTag}>`;
  }
  return `${indent}<${rnTag}\n${attrsToJsx(attrs, indent + '  ')}\n${indent}/>`;
}

/** Return end index (exclusive) for one SVG element starting at `start`. */
function findElementEnd(source, start) {
  const tagStart = source.slice(start + 1).match(/^(\w+)/);
  if (!tagStart) return start + 1;
  const childTag = tagStart[1];
  const afterTag = start + 1 + childTag.length;
  const closeAngle = source.indexOf('>', afterTag);
  if (closeAngle === -1) return source.length;
  if (source[closeAngle - 1] === '/') return closeAngle + 1;

  let depth = 1;
  let pos = closeAngle + 1;
  while (depth > 0 && pos < source.length) {
    const subOpen = source.indexOf(`<${childTag}`, pos);
    const subClose = source.indexOf(`</${childTag}>`, pos);
    if (subClose === -1) break;
    if (subOpen !== -1 && subOpen < subClose) {
      depth += 1;
      pos = subOpen + childTag.length + 1;
    } else {
      depth -= 1;
      pos = subClose + childTag.length + 3;
    }
  }
  return pos;
}

function convertNode(nodeStr, depth) {
  const indent = '  '.repeat(depth);
  const openMatch = nodeStr.match(/^<(\w+)([^>]*?)(\/?)>/);
  if (!openMatch) return '';

  const tag = openMatch[1];
  if (tag === 'text' || tag === 'tspan') {
    return convertTextElement(nodeStr, depth, tag);
  }

  const rnTag = tagMap[tag];
  if (!rnTag) return '';

  usedTags.add(rnTag);
  const selfClose = openMatch[3] === '/';
  const attrs = parseAttrs(openMatch[2] || '');
  if (!selfClose && !attrs.fill && ['Path', 'Rect', 'Circle', 'Ellipse', 'Polygon', 'Polyline'].includes(rnTag)) {
    attrs.fill = '#000000';
  }

  if (selfClose) {
    return `${indent}<${rnTag}\n${attrsToJsx(attrs, indent + '  ')}\n${indent}/>`;
  }

  const closeTag = `</${tag}>`;
  const closeIdx = nodeStr.lastIndexOf(closeTag);
  const inner = nodeStr.slice(openMatch[0].length, closeIdx);

  const childParts = [];
  let i = 0;
  while (i < inner.length) {
    const nextOpen = inner.indexOf('<', i);
    if (nextOpen === -1) break;
    if (inner[nextOpen + 1] === '/') {
      i = inner.indexOf('>', nextOpen) + 1;
      continue;
    }
    const pos = findElementEnd(inner, nextOpen);
    childParts.push(convertNode(inner.slice(nextOpen, pos), depth + 1));
    i = pos;
  }

  const childrenJsx = childParts.filter(Boolean).join('\n');
  if (childrenJsx) {
    return `${indent}<${rnTag}\n${attrsToJsx(attrs, indent + '  ')}\n${indent}>\n${childrenJsx}\n${indent}</${rnTag}>`;
  }
  return `${indent}<${rnTag}\n${attrsToJsx(attrs, indent + '  ')}\n${indent}/>`;
}

function collectTopLevelElements(source, depth) {
  const parts = [];
  let i = 0;
  while (i < source.length) {
    const nextOpen = source.indexOf('<', i);
    if (nextOpen === -1) break;
    if (source[nextOpen + 1] === '/') {
      i = source.indexOf('>', nextOpen) + 1;
      continue;
    }
    const pos = findElementEnd(source, nextOpen);
    parts.push(convertNode(source.slice(nextOpen, pos), depth));
    i = pos;
  }
  return parts.filter(Boolean);
}

const svgInner = raw.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').trim();
const rootGMatch = svgInner.match(/^<g transform="translate\(([^)]+)\)">([\s\S]*)<\/g>$/);
let body;
if (rootGMatch) {
  const parts = collectTopLevelElements(rootGMatch[2], 3);
  body = `      <G transform="translate(${rootGMatch[1]})">\n${parts.join('\n')}\n      </G>`;
  usedTags.add('G');
} else {
  const parts = collectTopLevelElements(svgInner, 2);
  body = parts.join('\n');
}

const imports = ['Svg', ...[...usedTags].sort()];
const aspect = vh / vw;

const out = `import { useI18n } from '../../lib/i18n';
import { ONBOARDING_ILLUSTRATION } from '../../constants/onboarding-theme';
import Svg, { ${imports.slice(1).join(', ')} } from 'react-native-svg';

const VIEW_MIN_X = ${viewMinX};
const VIEW_MIN_Y = ${viewMinY};
const VIEW_WIDTH = ${vw};
const VIEW_HEIGHT = ${vh};
const ASPECT = VIEW_HEIGHT / VIEW_WIDTH;

/** ${assetName} */
export default function ${componentName}({ width = ONBOARDING_ILLUSTRATION.width }) {
  const { t } = useI18n();
  const height = width * ASPECT;

  return (
    <Svg
      width={width}
      height={height}
      viewBox={\`\${VIEW_MIN_X} \${VIEW_MIN_Y} \${VIEW_WIDTH} \${VIEW_HEIGHT}\`}
      accessibilityRole="image"
      accessibilityLabel={t('${i18nKey}')}
    >
${body}
    </Svg>
  );
}
`;

const outPath = path.join('components', 'onboarding', `${componentName}.jsx`);
fs.writeFileSync(outPath, out);
console.log(`Wrote ${outPath} (${usedTags.size} tags, ${out.length} chars)`);
