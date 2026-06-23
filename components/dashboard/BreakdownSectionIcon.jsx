import { View } from 'react-native';
import LucideStrokeIcon from '../app/LucideStrokeIcon';
import { CIRCLE_DOLLAR_SIGN_NODES, HANDBAG_NODES, GOAL_NODES, WALLET_NODES, PAW_PRINT_NODES } from '../app/lucidePaths';
import { C } from '../../constants/onboarding-theme';

/** @type {Record<string, { nodes: import('../app/LucideStrokeIcon').LucideNode[], bg: string, fg: string }>} */
const SECTION_ICON = {
  housing: {
    nodes: [
      ['path', { d: 'M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8', key: 'h1' }],
      ['path', { d: 'M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', key: 'h2' }],
    ],
    bg: '#DBEAFE',
    fg: '#2563EB',
  },
  transport: {
    nodes: [
      ['path', { d: 'M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2', key: 't1' }],
      ['circle', { cx: '7', cy: '17', r: '2', key: 't2' }],
      ['path', { d: 'M9 17h6', key: 't3' }],
      ['circle', { cx: '17', cy: '17', r: '2', key: 't4' }],
    ],
    bg: '#FEF3C7',
    fg: '#D97706',
  },
  health: {
    nodes: [
      ['path', { d: 'M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z', key: 'he1' }],
    ],
    bg: '#FEE2E2',
    fg: '#DC2626',
  },
  children: {
    nodes: [
      ['path', { d: 'M9 12h.01', key: 'c1' }],
      ['path', { d: 'M15 12h.01', key: 'c2' }],
      ['path', { d: 'M10 16c.5.3 1.2.5 2 .5s1.5-.2 2-.5', key: 'c3' }],
      ['path', { d: 'M19 6.3a9 9 0 0 1 1.8 3.9 2 2 0 0 1 0 3.6A9 9 0 0 1 12 21a9 9 0 0 1-8.7-6.7 2 2 0 0 1 0-3.6A9 9 0 0 1 12 3c2 0 3.8.9 5.3 2.3', key: 'c4' }],
    ],
    bg: '#FCE7F3',
    fg: '#DB2777',
  },
  pets: {
    nodes: PAW_PRINT_NODES,
    bg: '#FFEDD5',
    fg: '#EA580C',
  },
  subscriptions: {
    nodes: [
      ['path', { d: 'm16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5', key: 's1' }],
      ['rect', { x: '2', y: '6', width: '14', height: '12', rx: '2', key: 's2' }],
    ],
    bg: '#EDE9FE',
    fg: '#7C3AED',
  },
  other: {
    nodes: HANDBAG_NODES,
    bg: '#F1F5F9',
    fg: '#64748B',
  },
  debts: {
    nodes: [
      ['rect', { width: '20', height: '14', x: '2', y: '5', rx: '2', key: 'd1' }],
      ['path', { d: 'M2 10h20', key: 'd2' }],
    ],
    bg: '#FEE2E2',
    fg: '#B91C1C',
  },
  primary: {
    nodes: CIRCLE_DOLLAR_SIGN_NODES,
    bg: '#DCFCE7',
    fg: '#16A34A',
  },
  other_income: {
    nodes: WALLET_NODES,
    bg: C.infoBg,
    fg: C.primary,
  },
  user: {
    nodes: [
      ['path', { d: 'M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2', key: 'u1' }],
      ['circle', { cx: '12', cy: '7', r: '4', key: 'u2' }],
    ],
    bg: '#DCFCE7',
    fg: '#16A34A',
  },
  partner: {
    nodes: GOAL_NODES,
    bg: '#DBEAFE',
    fg: '#2563EB',
  },
};

const DEFAULT_ICON = {
  nodes: HANDBAG_NODES,
  bg: C.surfaceTint,
  fg: C.primary,
};

function resolveIconKey(sectionKey, scope) {
  if (scope === 'income' && sectionKey === 'other') return 'other_income';
  return sectionKey;
}

/**
 * Circular section icon for breakdown pill rows.
 * @param {'expense'|'income'} [scope]
 */
export default function BreakdownSectionIcon({ sectionKey, scope = 'expense', selected = false, size = 36 }) {
  const iconKey = resolveIconKey(sectionKey, scope);
  const spec = SECTION_ICON[iconKey] || SECTION_ICON[sectionKey] || DEFAULT_ICON;
  const iconSize = Math.round(size * 0.48);

  return (
    <View style={{
      width: size,
      height: size,
      borderRadius: size / 2,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      backgroundColor: selected ? 'rgba(255,255,255,0.18)' : spec.bg,
    }}>
      <LucideStrokeIcon
        nodes={spec.nodes}
        color={selected ? '#FFFFFF' : spec.fg}
        size={iconSize}
        strokeWidth={2}
      />
    </View>
  );
}
