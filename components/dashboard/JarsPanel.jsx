import { useState } from 'react';
import { View, Pressable, Platform } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useI18n } from '../../lib/i18n';
import { formatCurrency } from '../../lib/finance';
import { C, R, T, tabularNums } from '../../constants/onboarding-theme';
import { compactChildren } from '../../lib/compactChildren';
import { getJarTitle } from '../../lib/jarRouting';
import InCardSectionHeader from './InCardSectionHeader';
import { InfoIcon } from '../app/AppNavIcons';
import JarsAnimatedCell from './JarsAnimatedCell';
import JarsBudgetGrid from './JarsBudgetGrid';

const INFO_SIZE = 16;
const INFO_HIT = 28;

export function JarFillMeter({ balance, cap, isFull }) {
  if (cap == null || cap <= 0) return null;
  const pct = Math.min(100, Math.round((balance / cap) * 100));
  return (
    <View style={{ marginTop: 8, width: '100%' }}>
      <View style={{
        height: 6,
        borderRadius: R.pill,
        backgroundColor: C.border,
        overflow: 'hidden',
      }}>
        <View style={{
          height: '100%',
          width: `${pct}%`,
          borderRadius: R.pill,
          backgroundColor: isFull ? C.positive : C.primary,
        }} />
      </View>
    </View>
  );
}

function JarBody({ line, currency, t }) {
  const title = getJarTitle(line, t);
  const helperParams = { ...(line.helperParams || {}) };
  if (helperParams.cap != null) {
    helperParams.cap = formatCurrency(Number(helperParams.cap), currency);
  }
  const cadenceLabel = line.cadence === 'daily'
    ? t('dashboard.home.jars.cadenceDaily')
    : t('dashboard.home.jars.cadenceMonthly');

  return (
    <>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: C.text }} numberOfLines={2}>
            {title}
          </Text>
          <Text style={{ ...T.caption, color: C.muted, marginTop: 2 }}>
            {cadenceLabel}
          </Text>
        </View>
        <Text style={{ fontSize: 16, fontWeight: '700', color: C.primary, ...tabularNums }} numberOfLines={1}>
          {formatCurrency(Number(line.balance) || 0, currency)}
        </Text>
      </View>
      {line.showFillMeter ? (
        <JarFillMeter balance={line.balance} cap={line.cap} isFull={line.isFull} />
      ) : null}
      <Text style={{ ...T.caption, color: C.muted, marginTop: 8 }}>
        {line.helperText || (line.helperKey ? t(line.helperKey, helperParams) : '')}
      </Text>
    </>
  );
}

function DashboardJarRow({ line, currency, t, onPress }) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const hoverProps = Platform.OS === 'web'
    ? { onMouseEnter: () => setHovered(true), onMouseLeave: () => setHovered(false) }
    : {};

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={t('dashboard.home.jars.openBudgetA11y', { jar: getJarTitle(line, t) })}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      {...hoverProps}
      style={{
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: R.input,
        backgroundColor: pressed
          ? C.breakdownRowHover
          : hovered
            ? C.breakdownRowHover
            : C.breakdownStripeBg,
        width: '100%',
        opacity: pressed ? 0.92 : 1,
        ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
      }}
    >
      <JarBody line={line} currency={currency} t={t} />
    </Pressable>
  );
}

/**
 * @param {'dashboard'|'budget'} variant
 * @param {() => void} [onJarPress] — dashboard: navigate to Budget tab
 */
export default function JarsPanel({
  jarLines,
  currency,
  strategyLabel,
  animationKey = 'free',
  variant = 'dashboard',
  onJarPress,
  onAddStash,
  focusJarId,
  style,
}) {
  const { t } = useI18n();

  if (variant === 'budget') {
    return (
      <JarsBudgetGrid
        jarLines={jarLines || []}
        currency={currency}
        animationKey={animationKey}
        onJarPress={onJarPress}
        onAddStash={onAddStash}
        focusJarId={focusJarId}
        style={style}
      />
    );
  }

  if (!jarLines?.length) return null;

  return (
    <View style={[{ width: '100%' }, style]}>
      {compactChildren(
        <>
          <InCardSectionHeader title={t('dashboard.home.jars.sectionTitle')} />
          <Text style={{ ...T.caption, color: C.muted, marginTop: -8, marginBottom: 12 }}>
            {strategyLabel}
          </Text>
          <View style={{ gap: 8, width: '100%' }}>
            {jarLines.map((line, index) => (
              <JarsAnimatedCell
                key={line.id}
                animationKey={animationKey}
                index={index}
              >
                <DashboardJarRow
                  line={line}
                  currency={currency}
                  t={t}
                  onPress={onJarPress}
                />
              </JarsAnimatedCell>
            ))}
          </View>
        </>,
      )}
    </View>
  );
}

export function SavedSoFarLabel({ onInfoPress }) {
  const { t } = useI18n();

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 }}>
      <Text style={{ fontSize: 13, fontWeight: '600', color: C.muted }}>
        {t('dashboard.home.savedSoFar.title')}
      </Text>
      <Pressable
        onPress={onInfoPress}
        accessibilityRole="button"
        accessibilityLabel={t('dashboard.home.savedSoFar.infoA11y')}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={({ pressed, hovered }) => ({
          width: INFO_HIT,
          height: INFO_HIT,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: R.input,
          backgroundColor: pressed
            ? C.overlayPressed
            : hovered && Platform.OS === 'web'
              ? C.overlayHover
              : 'transparent',
          ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
        })}
      >
        <InfoIcon color={C.muted} size={INFO_SIZE} />
      </Pressable>
    </View>
  );
}
