import { View } from 'react-native';
import LucideStrokeIcon from '../app/LucideStrokeIcon';
import { BABY_NODES, BIKE_NODES, BOOK_NODES, SCHOOL_NODES, USER_ROUND_NODES } from '../app/lucidePaths';
import { C } from '../../constants/onboarding-theme';

/** @type {Record<string, { nodes: import('../app/LucideStrokeIcon').LucideNode[], bg: string, fg: string }>} */
const CATEGORY_ICONS = {
  childcare: {
    nodes: USER_ROUND_NODES,
    bg: '#FCE7F3',
    fg: '#DB2777',
  },
  babyNeeds: {
    nodes: BABY_NODES,
    bg: '#DBEAFE',
    fg: '#2563EB',
  },
  earlyEducation: {
    nodes: BOOK_NODES,
    bg: '#EDE9FE',
    fg: '#7C3AED',
  },
  school: {
    nodes: SCHOOL_NODES,
    bg: '#DBEAFE',
    fg: '#2563EB',
  },
  activities: {
    nodes: BIKE_NODES,
    bg: '#DCFCE7',
    fg: '#16A34A',
  },
  independence: {
    nodes: [['path', { d: 'M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2', key: 'i1' }], ['circle', { cx: '7', cy: '17', r: '2', key: 'i2' }], ['circle', { cx: '17', cy: '17', r: '2', key: 'i3' }]],
    bg: '#FFEDD5',
    fg: '#EA580C',
  },
  universityEducation: {
    nodes: [['path', { d: 'M22 10v6M2 10l10-5 10 5-10 5z', key: 'u1' }], ['path', { d: 'M6 12v5c3 3 9 3 12 0v-5', key: 'u2' }]],
    bg: '#DBEAFE',
    fg: '#2563EB',
  },
  livingCosts: {
    nodes: [['path', { d: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', key: 'l1' }], ['polyline', { points: '9 22 9 12 15 12 15 22', key: 'l2' }]],
    bg: '#DCFCE7',
    fg: '#16A34A',
  },
  allowancePersonal: {
    nodes: [['path', { d: 'M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1', key: 'p1' }], ['path', { d: 'M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4', key: 'p2' }]],
    bg: '#FFEDD5',
    fg: '#EA580C',
  },
  health: {
    nodes: [['path', { d: 'M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z', key: 'h1' }]],
    bg: '#FEE2E2',
    fg: '#DC2626',
  },
};

const DEFAULT = {
  nodes: [['circle', { cx: '12', cy: '12', r: '10', key: 'd1' }]],
  bg: C.surfaceTint,
  fg: C.primary,
};

export default function ChildrenCostCategoryIcon({ categoryId, size = 40 }) {
  const spec = CATEGORY_ICONS[categoryId] || DEFAULT;
  const iconSize = Math.round(size * 0.48);

  return (
    <View style={{
      width: size,
      height: size,
      borderRadius: size / 2,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      backgroundColor: spec.bg,
    }}>
      <View style={{
        width: iconSize,
        height: iconSize,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <LucideStrokeIcon nodes={spec.nodes} color={spec.fg} size={iconSize} strokeWidth={2} />
      </View>
    </View>
  );
}
