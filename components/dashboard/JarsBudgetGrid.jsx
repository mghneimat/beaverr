import { useEffect, useMemo, useRef, useState, useCallback, createRef } from 'react';
import { View, Pressable, Platform } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import Svg, { Path } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { useI18n } from '../../lib/i18n';
import { formatCurrency } from '../../lib/finance';
import { getJarTitle } from '../../lib/jarRouting';
import { C, R, T } from '../../constants/onboarding-theme';
import { SavingsIcon, BudgetIcon, GoalsIcon, PiggyBankIcon, TrashIcon, ArrowRightLeftIcon, SquarePenIcon, WalletCardsIcon } from '../app/AppNavIcons';
import SurfaceCard from '../ui/SurfaceCard';
import ConfirmDialog from '../ui/ConfirmDialog';
import InCardSectionHeader from './InCardSectionHeader';
import JarsAnimatedCell from './JarsAnimatedCell';
import AnimatedCollapse from './AnimatedCollapse';
import MetricExplainCard from './MetricExplainCard';
import MetricExplainModal from './MetricExplainModal';
import JarFocusGlowOutline from './JarFocusGlowOutline';
import AddStashSheet from './AddStashSheet';
import EditStashSheet from './EditStashSheet';
import TransferStashSheet from './TransferStashSheet';
import DeleteStashSheet from './DeleteStashSheet';
import CommitmentProgressList from './CommitmentProgressList';
import { useDashboardScroll } from '../../lib/dashboardScroll';
import { useDashboardLayout } from '../../lib/dashboardLayout';

const QUAD_GRID_ITEM = { width: '47%', flexGrow: 1, flexBasis: '45%' };
const ROW_HALF_ITEM = { flex: 1, minWidth: '45%' };
const ICON_SIZE = 16;
const TAB_PLUS_SIZE = 16;
const ACTION_HIT = 40;
const CARD_ACTION_INSET = 12;
const DELETE_ICON_COLOR = '#D14040';

function TabPlusIcon({ color }) {
  return (
    <Svg width={TAB_PLUS_SIZE} height={TAB_PLUS_SIZE} viewBox="0 0 24 24">
      <Path
        d="M12 5.5v13M5.5 12h13"
        stroke={color}
        strokeWidth={2.25}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function AddNewTabChip({ label, accessibilityLabel, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed, hovered }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 8,
        paddingHorizontal: 14,
        minHeight: 36,
        borderRadius: R.pill,
        flexShrink: 0,
        backgroundColor: pressed
          ? C.bg
          : hovered
            ? C.bg
            : C.pillUnselectedBg,
        borderWidth: 1,
        borderColor: C.pillUnselectedBorder,
        ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
      })}
    >
      <TabPlusIcon color={C.text} />
      <Text style={{ ...T.pillLabel, fontSize: 13, fontWeight: '600', color: C.text }}>
        {label}
      </Text>
    </Pressable>
  );
}

function DeleteStashButton({ onPress, accessibilityLabel }) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  return (
    <Pressable
      onPress={(event) => {
        event?.stopPropagation?.();
        onPress?.();
      }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      style={{
        width: ACTION_HIT,
        height: ACTION_HIT,
        borderRadius: ACTION_HIT / 2,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: pressed
          ? 'rgba(209, 64, 64, 0.14)'
          : hovered
            ? 'rgba(209, 64, 64, 0.08)'
            : 'transparent',
        ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
      }}
    >
      <TrashIcon color={DELETE_ICON_COLOR} size={16} />
    </Pressable>
  );
}

function EditStashButton({ onPress, accessibilityLabel }) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  return (
    <Pressable
      onPress={(event) => {
        event?.stopPropagation?.();
        onPress?.();
      }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      style={{
        width: ACTION_HIT,
        height: ACTION_HIT,
        borderRadius: ACTION_HIT / 2,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: pressed
          ? C.overlayPressed
          : hovered
            ? C.overlayHover
            : 'transparent',
        ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
      }}
    >
      <SquarePenIcon color={C.text} size={16} />
    </Pressable>
  );
}

function MoveStashButton({
  balance,
  onPress,
  onEmptyPress,
  accessibilityLabel,
  emptyAccessibilityLabel,
}) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const isEmpty = (Number(balance) || 0) <= 0;

  return (
    <Pressable
      onPress={(event) => {
        event?.stopPropagation?.();
        if (isEmpty) {
          onEmptyPress?.();
          return;
        }
        onPress?.();
      }}
      accessibilityRole="button"
      accessibilityLabel={isEmpty ? emptyAccessibilityLabel : accessibilityLabel}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      style={{
        width: ACTION_HIT,
        height: ACTION_HIT,
        borderRadius: ACTION_HIT / 2,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: pressed
          ? C.overlayPressed
          : hovered
            ? C.overlayHover
            : 'transparent',
        ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
      }}
    >
      <ArrowRightLeftIcon color={isEmpty ? C.muted : C.primary} size={16} />
    </Pressable>
  );
}

function jarIconForLine(line) {
  if (line.id.startsWith('stash:')) return WalletCardsIcon;
  switch (line.id) {
    case 'rollover':
      return BudgetIcon;
    case 'looseCash':
      return PiggyBankIcon;
    case 'activity':
      return PiggyBankIcon;
    case 'bigPlans':
      return GoalsIcon;
    case 'savings':
      return SavingsIcon;
    default:
      return SavingsIcon;
  }
}

function jarHelperText(line, t, currency) {
  if (line.helperText) return line.helperText;
  if (!line.helperKey) return '';
  const helperParams = { ...(line.helperParams || {}) };
  if (helperParams.cap != null) {
    helperParams.cap = formatCurrency(Number(helperParams.cap), currency);
  }
  return t(line.helperKey, helperParams);
}

function JarBudgetGridCard({
  line,
  currency,
  t,
  onPress,
  onInfoPress,
  infoA11y,
  enterKey,
  enterIndex,
  onDeletePress,
  deleteA11y,
  onEditPress,
  editA11y,
  showTransferAction,
  onTransferPress,
  onEmptyPress,
  transferA11y,
  emptyTransferA11y,
  fill = true,
}) {
  const title = getJarTitle(line, t);
  const Icon = jarIconForLine(line);
  const deletable = Boolean(onDeletePress);
  const editable = Boolean(onEditPress);
  const hasActionRow = showTransferAction || deletable || editable;
  const infoReserved = showTransferAction && !deletable;

  return (
    <View style={{ flex: fill ? 1 : undefined, position: 'relative' }}>
      <MetricExplainCard
        enterKey={enterKey}
        enterIndex={enterIndex}
        label={title}
        labelIcon={<Icon color={C.muted} size={ICON_SIZE} />}
        value={formatCurrency(line.balance, currency)}
        amountValue={Number(line.balance) || 0}
        amountCurrency={currency}
        footerLabel={jarHelperText(line, t, currency)}
        onPress={onPress ? () => onPress(line) : undefined}
        onInfoPress={deletable ? undefined : onInfoPress}
        infoAccessibilityLabel={infoA11y}
        accessibilityLabel={t('dashboard.budgetScreen.jars.cardA11y', {
          jar: title,
          amount: formatCurrency(line.balance, currency),
        })}
      />
      {hasActionRow ? (
        <View
          style={{
            position: 'absolute',
            top: CARD_ACTION_INSET,
            right: infoReserved ? CARD_ACTION_INSET + ACTION_HIT : CARD_ACTION_INSET,
            zIndex: 10,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          {showTransferAction ? (
            <MoveStashButton
              balance={line.balance}
              onPress={onTransferPress}
              onEmptyPress={onEmptyPress}
              accessibilityLabel={transferA11y}
              emptyAccessibilityLabel={emptyTransferA11y}
            />
          ) : null}
          {editable ? (
            <EditStashButton onPress={onEditPress} accessibilityLabel={editA11y} />
          ) : null}
          {deletable ? (
            <DeleteStashButton onPress={onDeletePress} accessibilityLabel={deleteA11y} />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function renderJarCell({
  line,
  index,
  animationKey,
  currency,
  t,
  onJarPress,
  setExplainLine,
  infoA11y,
  getJarAnchorRef,
  glowJarId,
  glowToken,
  handleGlowComplete,
  cellStyle,
  motion,
  exiting,
  onExitComplete,
  onDeletePress,
  deleteA11y,
  onEditPress,
  editA11y,
  showTransferAction,
  onTransferPress,
  onEmptyPress,
  transferA11y,
  emptyTransferA11y,
  outlineFill = true,
}) {
  return (
    <JarsAnimatedCell
      animationKey={animationKey}
      index={index}
      style={cellStyle}
      motion={motion}
      exiting={exiting}
      onExitComplete={onExitComplete}
    >
      <View
        ref={getJarAnchorRef(line.id)}
        collapsable={false}
        style={outlineFill ? { flex: 1 } : undefined}
      >
        <JarFocusGlowOutline
          glowToken={glowJarId === line.id ? glowToken : 0}
          onComplete={glowJarId === line.id ? handleGlowComplete : undefined}
          variant="surface"
          fill={outlineFill}
        >
          <JarBudgetGridCard
            line={line}
            currency={currency}
            t={t}
            onPress={onJarPress}
            onInfoPress={() => setExplainLine(line)}
            infoA11y={infoA11y}
            enterKey={animationKey}
            enterIndex={index}
            onDeletePress={onDeletePress}
            deleteA11y={deleteA11y}
            onEditPress={onEditPress}
            editA11y={editA11y}
            showTransferAction={showTransferAction}
            onTransferPress={onTransferPress}
            onEmptyPress={onEmptyPress}
            transferA11y={transferA11y}
            emptyTransferA11y={emptyTransferA11y}
            fill={outlineFill}
          />
        </JarFocusGlowOutline>
      </View>
    </JarsAnimatedCell>
  );
}

function StashGroupHeader({ title, style }) {
  return (
    <Text
      accessibilityRole="header"
      style={{
        ...T.cardTitle,
        fontSize: 15,
        marginBottom: 12,
        ...(style || {}),
      }}
    >
      {title}
    </Text>
  );
}

export default function JarsBudgetGrid({
  jarLines,
  primaryJarLines,
  customJarLines,
  savedCustomJarLines,
  commitmentCustomJarLines,
  layout = 'grid',
  currency,
  animationKey = 'free',
  onAddStash,
  onDeleteStash,
  onJarPress,
  onStashPress,
  onTransferStash,
  onUpdateStash,
  onRenewCommitment,
  onDeleteCommitment,
  budget,
  income,
  focusJarId,
}) {
  const { t } = useI18n();
  const router = useRouter();
  const { isPhone } = useDashboardLayout();
  const gridItemStyle = isPhone
    ? { width: '100%', flexShrink: 0 }
    : QUAD_GRID_ITEM;
  const rowHalfItemStyle = isPhone
    ? { width: '100%', flexShrink: 0 }
    : ROW_HALF_ITEM;
  const { scrollToAnchor } = useDashboardScroll();
  const [explainLine, setExplainLine] = useState(null);
  const [glowJarId, setGlowJarId] = useState(null);
  const [glowToken, setGlowToken] = useState(0);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [exitingLineId, setExitingLineId] = useState(null);
  const [deleteTargetLine, setDeleteTargetLine] = useState(null);
  const [transferSourceLine, setTransferSourceLine] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [transferEmptyInfoOpen, setTransferEmptyInfoOpen] = useState(false);
  const [editTargetLine, setEditTargetLine] = useState(null);
  const jarAnchorRefs = useRef({});
  const infoA11y = t('dashboard.home.infoA11y');
  const isSavingsLayout = layout === 'savings';
  const savingsPhoneCellStyle = isSavingsLayout && isPhone
    ? { flexShrink: 0, alignSelf: 'stretch' }
    : { flex: 1 };
  const savingsOutlineFill = !(isSavingsLayout && isPhone);

  const gridCells = useMemo(
    () => (jarLines || []).map((line) => ({ kind: 'jar', line, key: line.id })),
    [jarLines],
  );

  const primaryLines = primaryJarLines || [];
  const savedCustomLines = savedCustomJarLines ?? customJarLines ?? [];
  const commitmentLines = commitmentCustomJarLines ?? [];
  const customLines = [...savedCustomLines, ...commitmentLines];
  const hasSavedCustomTabs = savedCustomLines.length > 0;
  const hasCommitmentTabs = commitmentLines.length > 0;

  const allFocusLines = useMemo(() => {
    if (isSavingsLayout) {
      return [...primaryLines, ...customLines];
    }
    return jarLines || [];
  }, [isSavingsLayout, primaryLines, customLines, jarLines]);

  const getJarAnchorRef = useCallback((jarId) => {
    if (!jarAnchorRefs.current[jarId]) {
      jarAnchorRefs.current[jarId] = createRef();
    }
    return jarAnchorRefs.current[jarId];
  }, []);

  const handleGlowComplete = useCallback(() => {
    setGlowJarId(null);
    router.setParams({ focusJar: undefined });
  }, [router]);

  useEffect(() => {
    if (!focusJarId) return;
    const hasJar = allFocusLines.some((line) => line.id === focusJarId);
    if (!hasJar) return;

    const anchorRef = jarAnchorRefs.current[focusJarId];
    if (!anchorRef) return;

    scrollToAnchor(anchorRef, 32, () => {
      setGlowJarId(focusJarId);
      setGlowToken((token) => token + 1);
    });
  }, [focusJarId, allFocusLines, scrollToAnchor]);

  useEffect(() => {
    setExplainLine(null);
  }, [animationKey]);

  const handleStashExitComplete = useCallback(async () => {
    if (pendingDelete) {
      await onDeleteStash?.(pendingDelete.stashId, pendingDelete.destination);
      setPendingDelete(null);
    } else if (exitingLineId?.startsWith('stash:')) {
      await onDeleteStash?.(exitingLineId.slice('stash:'.length), 'looseCash');
    }
    setExitingLineId(null);
  }, [exitingLineId, onDeleteStash, pendingDelete]);

  const requestDeleteStash = useCallback((line) => {
    setDeleteTargetLine(line);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (deleteTargetLine) {
      setExitingLineId(deleteTargetLine.id);
    }
    setDeleteTargetLine(null);
  }, [deleteTargetLine]);

  const handleDeleteWithDestination = useCallback(async (destination) => {
    if (!deleteTargetLine?.id.startsWith('stash:')) return;
    const stashId = deleteTargetLine.id.slice('stash:'.length);
    setPendingDelete({ stashId, destination });
    setExitingLineId(deleteTargetLine.id);
    setDeleteTargetLine(null);
  }, [deleteTargetLine]);

  const handleTransfer = useCallback(async (fromRef, toRef, amount) => {
    const error = await onTransferStash?.(fromRef, toRef, amount);
    if (!error) {
      setTransferSourceLine(null);
    }
    return error;
  }, [onTransferStash]);

  const handleEmptyTransferPress = useCallback(() => {
    setTransferEmptyInfoOpen(true);
  }, []);

  const openTransferSheet = useCallback((line) => {
    setTransferSourceLine(line);
  }, []);

  const showTransferAction = isSavingsLayout && Boolean(onTransferStash);

  const deleteTargetTitle = deleteTargetLine ? getJarTitle(deleteTargetLine, t) : '';
  const deleteTargetBalance = Number(deleteTargetLine?.balance) || 0;
  const showDeleteBalanceSheet = deleteTargetLine != null && deleteTargetBalance > 0;
  const showDeleteConfirm = deleteTargetLine != null && deleteTargetBalance === 0;

  const explainTitle = explainLine ? getJarTitle(explainLine, t) : '';
  const explainValue = explainLine
    ? formatCurrency(explainLine.balance, currency)
    : '';
  const explainBody = explainLine
    ? jarHelperText(explainLine, t, currency)
    : '';

  const handleCreateStash = useCallback(async (name, description) => {
    const error = await onAddStash?.(name, description);
    if (!error) {
      setSheetOpen(false);
    }
    return error;
  }, [onAddStash]);

  const handleUpdateStash = useCallback(async (name, description) => {
    if (!editTargetLine?.id.startsWith('stash:')) return 'notFound';
    const stashId = editTargetLine.id.slice('stash:'.length);
    const error = await onUpdateStash?.(stashId, { name, description });
    if (!error || error === 'unchanged') {
      setEditTargetLine(null);
    }
    return error;
  }, [editTargetLine, onUpdateStash]);

  const editTargetTitle = editTargetLine ? getJarTitle(editTargetLine, t) : '';
  const editTargetDescription = editTargetLine?.helperText || '';

  const buildTransferProps = useCallback((line) => {
    const title = getJarTitle(line, t);
    return {
      showTransferAction,
      onTransferPress: () => openTransferSheet(line),
      onEmptyPress: handleEmptyTransferPress,
      transferA11y: t('dashboard.budgetScreen.jars.moveTabA11y', { name: title }),
      emptyTransferA11y: t('dashboard.budgetScreen.jars.moveTabEmptyA11y', { name: title }),
    };
  }, [showTransferAction, openTransferSheet, handleEmptyTransferPress, t]);

  const handleLinePress = useCallback((line) => {
    if (isSavingsLayout && onStashPress) {
      onStashPress(line);
      return;
    }
    onJarPress?.(line);
  }, [isSavingsLayout, onStashPress, onJarPress]);

  const sharedCellProps = {
    animationKey,
    currency,
    t,
    onJarPress: handleLinePress,
    setExplainLine,
    infoA11y,
    getJarAnchorRef,
    glowJarId,
    glowToken,
    handleGlowComplete,
  };

  const renderCustomStashCell = useCallback((line, index, options = {}) => {
    const title = getJarTitle(line, t);
    const isExiting = exitingLineId === line.id;
    const allowEdit = options.allowEdit !== false;

    return (
      <View key={line.id} style={gridItemStyle}>
        {renderJarCell({
          ...sharedCellProps,
          ...buildTransferProps(line),
          line,
          index,
          cellStyle: savingsPhoneCellStyle,
          motion: 'full',
          outlineFill: savingsOutlineFill,
          exiting: isExiting,
          onExitComplete: isExiting ? handleStashExitComplete : undefined,
          onDeletePress: () => requestDeleteStash(line),
          deleteA11y: t('dashboard.budgetScreen.jars.deleteTabA11y', { name: title }),
          onEditPress: allowEdit && onUpdateStash ? () => setEditTargetLine(line) : undefined,
          editA11y: t('dashboard.budgetScreen.jars.editTabA11y', { name: title }),
        })}
      </View>
    );
  }, [
    buildTransferProps,
    exitingLineId,
    gridItemStyle,
    handleStashExitComplete,
    onUpdateStash,
    requestDeleteStash,
    savingsOutlineFill,
    savingsPhoneCellStyle,
    sharedCellProps,
    t,
  ]);

  return (
    <>
      <SurfaceCard>
        <InCardSectionHeader
          title={t('dashboard.budgetScreen.jars.sectionTitle')}
          trailing={(
            <AddNewTabChip
              label={t('dashboard.budgetScreen.jars.addNewTab')}
              accessibilityLabel={t('dashboard.budgetScreen.jars.addNewTabA11y')}
              onPress={() => setSheetOpen(true)}
            />
          )}
        />

        {isSavingsLayout ? (
          <View>
            <StashGroupHeader title={t('dashboard.budgetScreen.jars.savedMoneyGroup')} />
            <View style={{ flexDirection: isPhone ? 'column' : 'row', gap: 12 }}>
              {primaryLines.map((line, index) => (
                <View key={line.id} style={rowHalfItemStyle}>
                  {renderJarCell({
                    ...sharedCellProps,
                    ...buildTransferProps(line),
                    line,
                    index,
                    cellStyle: savingsPhoneCellStyle,
                    motion: 'full',
                    outlineFill: savingsOutlineFill,
                  })}
                </View>
              ))}
            </View>

            <AnimatedCollapse visible={hasSavedCustomTabs} style={{ marginTop: hasSavedCustomTabs ? 12 : 0 }}>
              <View style={{
                flexDirection: isPhone ? 'column' : 'row',
                flexWrap: isPhone ? 'nowrap' : 'wrap',
                gap: 12,
                paddingBottom: 4,
              }}
              >
                {savedCustomLines.map((line, index) => (
                  renderCustomStashCell(line, primaryLines.length + index)
                ))}
              </View>
            </AnimatedCollapse>

            {hasCommitmentTabs ? (
              <View style={{ marginTop: 24 }}>
                <StashGroupHeader title={t('dashboard.budgetScreen.jars.commitmentsGroup')} />
                <CommitmentProgressList
                  commitmentLines={commitmentLines}
                  budget={budget}
                  onRenewCommitment={onRenewCommitment}
                  onDeleteCommitment={onDeleteCommitment}
                />
              </View>
            ) : null}
          </View>
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {gridCells.map((cell, index) => (
              <View key={cell.key} style={gridItemStyle}>
                {renderJarCell({
                  ...sharedCellProps,
                  line: cell.line,
                  index,
                  cellStyle: { flex: 1 },
                  motion: 'transform',
                })}
              </View>
            ))}
          </View>
        )}
      </SurfaceCard>

      <AddStashSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onCreate={handleCreateStash}
      />

      <EditStashSheet
        visible={editTargetLine != null}
        initialName={editTargetTitle}
        initialDescription={editTargetDescription}
        onClose={() => setEditTargetLine(null)}
        onSave={handleUpdateStash}
      />

      <MetricExplainModal
        visible={explainLine != null}
        onClose={() => setExplainLine(null)}
        title={explainTitle}
        value={explainValue}
        meaning={{
          title: t('dashboard.budgetScreen.jars.explainTitle'),
          body: explainBody,
        }}
        gotItLabel={t('dashboard.metricExplain.gotIt')}
        accessibilityLabel={t('dashboard.metricExplain.closeA11y')}
      />

      <ConfirmDialog
        visible={showDeleteConfirm}
        title={t('dashboard.budgetScreen.jars.deleteSheet.title')}
        message={t('dashboard.budgetScreen.jars.deleteSheet.body', { name: deleteTargetTitle })}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        destructive
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTargetLine(null)}
      />

      <DeleteStashSheet
        visible={showDeleteBalanceSheet}
        onClose={() => setDeleteTargetLine(null)}
        line={deleteTargetLine}
        budget={budget}
        income={income}
        currency={currency}
        onConfirmDelete={handleDeleteWithDestination}
      />

      <TransferStashSheet
        visible={transferSourceLine != null}
        onClose={() => setTransferSourceLine(null)}
        sourceLine={transferSourceLine}
        budget={budget}
        income={income}
        currency={currency}
        onTransfer={handleTransfer}
      />

      <ConfirmDialog
        visible={transferEmptyInfoOpen}
        infoOnly
        title={t('dashboard.budgetScreen.jars.transferEmptyInfo.title')}
        message={t('dashboard.budgetScreen.jars.transferEmptyInfo.body')}
        confirmLabel={t('dashboard.metricExplain.gotIt')}
        onConfirm={() => setTransferEmptyInfoOpen(false)}
        onCancel={() => setTransferEmptyInfoOpen(false)}
      />
    </>
  );
}
