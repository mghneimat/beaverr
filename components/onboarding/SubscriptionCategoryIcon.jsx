import { View } from 'react-native';
import LucideStrokeIcon from '../app/LucideStrokeIcon';
import { C, R } from '../../constants/onboarding-theme';

/** @type {Record<string, { nodes: import('../app/LucideStrokeIcon').LucideNode[], bg: string, fg: string }>} */
const CATEGORY_ICONS = {
  onlineShopping: {
    nodes: [['path', { d: 'M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z', key: 'o1' }], ['path', { d: 'M3 6h18', key: 'o2' }], ['path', { d: 'M16 10a4 4 0 0 1-8 0', key: 'o3' }]],
    bg: '#FCE7F3',
    fg: '#DB2777',
  },
  education: {
    nodes: [['path', { d: 'M22 10v6M2 10l10-5 10 5-10 5z', key: 'e1' }], ['path', { d: 'M6 12v5c3 3 9 3 12 0v-5', key: 'e2' }]],
    bg: '#DBEAFE',
    fg: '#2563EB',
  },
  itTech: {
    nodes: [['rect', { x: '2', y: '3', width: '20', height: '14', rx: '2', key: 'i1' }], ['path', { d: 'M8 21h8', key: 'i2' }], ['path', { d: 'M12 17v4', key: 'i3' }]],
    bg: C.infoBg,
    fg: C.primary,
  },
  entertainmentStreaming: {
    nodes: [['path', { d: 'm16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5', key: 'v1' }], ['rect', { x: '2', y: '6', width: '14', height: '12', rx: '2', key: 'v2' }]],
    bg: '#EDE9FE',
    fg: '#7C3AED',
  },
  productivity: {
    nodes: [['path', { d: 'M12 20h9', key: 'p1' }], ['path', { d: 'M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z', key: 'p2' }]],
    bg: '#FEF3C7',
    fg: '#D97706',
  },
  banking: {
    nodes: [['rect', { width: '20', height: '14', x: '2', y: '5', rx: '2', key: 'b1' }], ['path', { d: 'M2 10h20', key: 'b2' }]],
    bg: '#DCFCE7',
    fg: '#16A34A',
  },
  healthWellbeing: {
    nodes: [['path', { d: 'M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z', key: 'h1' }]],
    bg: '#FEE2E2',
    fg: '#DC2626',
  },
  newsReading: {
    nodes: [['path', { d: 'M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2', key: 'n1' }], ['path', { d: 'M18 14h-8', key: 'n2' }], ['path', { d: 'M15 18h-5', key: 'n3' }], ['path', { d: 'M10 6h8v4h-8V6Z', key: 'n4' }]],
    bg: '#F1F5F9',
    fg: '#64748B',
  },
  foodDelivery: {
    nodes: [['path', { d: 'M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2', key: 'f1' }], ['path', { d: 'M7 2v20', key: 'f2' }], ['path', { d: 'M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7', key: 'f3' }]],
    bg: '#FFEDD5',
    fg: '#EA580C',
  },
  travelTransport: {
    nodes: [['path', { d: 'M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2', key: 't1' }], ['circle', { cx: '7', cy: '17', r: '2', key: 't2' }], ['circle', { cx: '17', cy: '17', r: '2', key: 't3' }]],
    bg: '#DBEAFE',
    fg: '#2563EB',
  },
  familyKids: {
    nodes: [['path', { d: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2', key: 'k1' }], ['circle', { cx: '9', cy: '7', r: '4', key: 'k2' }], ['path', { d: 'M22 21v-2a4 4 0 0 0-3-3.87', key: 'k3' }], ['path', { d: 'M16 3.13a4 4 0 0 1 0 7.75', key: 'k4' }]],
    bg: '#FCE7F3',
    fg: '#DB2777',
  },
  telecomsUtilities: {
    nodes: [['path', { d: 'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z', key: 'u1' }]],
    bg: C.infoBg,
    fg: C.primary,
  },
  homeGarden: {
    nodes: [['path', { d: 'M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8', key: 'g1' }], ['path', { d: 'M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', key: 'g2' }]],
    bg: '#DCFCE7',
    fg: '#16A34A',
  },
  legalItems: {
    nodes: [['path', { d: 'M12 3v18', key: 'l1' }], ['path', { d: 'M5 8h14', key: 'l2' }], ['path', { d: 'M6 21h12', key: 'l3' }], ['path', { d: 'm8 8 4-5 4 5', key: 'l4' }]],
    bg: '#FEE2E2',
    fg: '#B91C1C',
  },
};

const DEFAULT = {
  nodes: [['circle', { cx: '12', cy: '12', r: '10', key: 'd1' }]],
  bg: C.surfaceTint,
  fg: C.primary,
};

export default function SubscriptionCategoryIcon({ categoryId, size = 40 }) {
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
