import { View } from 'react-native';
import LucideStrokeIcon from '../app/LucideStrokeIcon';
import { COINS_NODES } from '../app/lucidePaths';
import { C, R } from '../../constants/onboarding-theme';

/** @type {Record<string, { nodes: import('../app/LucideStrokeIcon').LucideNode[], bg: string, fg: string }>} */
const CATEGORY_ICONS = {
  propertyRentals: {
    nodes: [['path', { d: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', key: 'p1' }], ['polyline', { points: '9 22 9 12 15 12 15 22', key: 'p2' }]],
    bg: '#DCFCE7',
    fg: '#16A34A',
  },
  investmentsDividends: {
    nodes: [['path', { d: 'M3 3v18h18', key: 'i1' }], ['path', { d: 'm19 9-5 5-4-4-3 3', key: 'i2' }]],
    bg: '#DBEAFE',
    fg: '#2563EB',
  },
  pensionRetirement: {
    nodes: [['rect', { width: '20', height: '14', x: '2', y: '7', rx: '2', key: 'w1' }], ['path', { d: 'M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16', key: 'w2' }]],
    bg: C.infoBg,
    fg: C.primary,
  },
  benefitsSupport: {
    nodes: [['path', { d: 'M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z', key: 's1' }]],
    bg: '#FEE2E2',
    fg: '#DC2626',
  },
  sideIncome: {
    nodes: [['path', { d: 'M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z', key: 'si1' }], ['path', { d: 'M3 6h18', key: 'si2' }], ['path', { d: 'M16 10a4 4 0 0 1-8 0', key: 'si3' }]],
    bg: '#FFEDD5',
    fg: '#EA580C',
  },
  otherPassive: {
    nodes: COINS_NODES,
    bg: '#F3E8FF',
    fg: '#9333EA',
  },
};

const DEFAULT = {
  nodes: [['circle', { cx: '12', cy: '12', r: '10', key: 'd1' }]],
  bg: C.surfaceTint,
  fg: C.primary,
};

export default function OtherIncomeCategoryIcon({ categoryId, size = 40 }) {
  const spec = CATEGORY_ICONS[categoryId] || DEFAULT;
  const iconSize = Math.round(size * 0.48);

  return (
    <View style={{
      width: size,
      height: size,
      borderRadius: R.card,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      backgroundColor: spec.bg,
    }}>
      <LucideStrokeIcon nodes={spec.nodes} color={spec.fg} size={iconSize} strokeWidth={2} />
    </View>
  );
}
