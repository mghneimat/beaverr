import { View } from 'react-native';
import LucideStrokeIcon from '../app/LucideStrokeIcon';
import { DROPLETS_NODES } from '../app/lucidePaths';
import { C, R } from '../../constants/onboarding-theme';

/** @type {Record<string, { nodes: import('../app/LucideStrokeIcon').LucideNode[], bg: string, fg: string }>} */
const CATEGORY_ICONS = {
  energy: {
    nodes: [['path', { d: 'M13 2 3 14h9l-1 8 10-12h-9l1-8z', key: 'e1' }]],
    bg: '#FEF3C7',
    fg: '#D97706',
  },
  waterAndWaste: {
    nodes: DROPLETS_NODES,
    bg: '#DBEAFE',
    fg: '#2563EB',
  },
  buildingFees: {
    nodes: [['path', { d: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', key: 'b1' }], ['polyline', { points: '9 22 9 12 15 12 15 22', key: 'b2' }]],
    bg: '#DCFCE7',
    fg: '#16A34A',
  },
  telecoms: {
    nodes: [['path', { d: 'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z', key: 't1' }]],
    bg: '#EDE9FE',
    fg: '#7C3AED',
  },
};

const DEFAULT = {
  nodes: [['circle', { cx: '12', cy: '12', r: '10', key: 'd1' }]],
  bg: C.surfaceTint,
  fg: C.primary,
};

export default function UtilityCategoryIcon({ categoryId, size = 40 }) {
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
