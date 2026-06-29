import { useMemo, useState } from 'react';
import { View, Pressable, Platform } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useI18n } from '../../lib/i18n';
import { getCustomStashById } from '../../lib/customStashes';
import { computeCommitmentProgress } from '../../lib/commitmentActions';
import { getJarTitle } from '../../lib/jarRouting';
import { C } from '../../constants/onboarding-theme';
import { RefreshCcwIcon, TrashIcon } from '../app/AppNavIcons';
import GoalProgressBar from './GoalProgressBar';
import ConfirmDialog from '../ui/ConfirmDialog';
import CommitmentSourceIcon from './CommitmentSourceIcon';

const ACTION_HIT = 36;
const ROW_ICON_SIZE = 44;
const DELETE_ICON_COLOR = '#D14040';

function CommitmentActionButton({
  onPress,
  accessibilityLabel,
  children,
}) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  return (
    <Pressable
      onPress={onPress}
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
      {children}
    </Pressable>
  );
}

function CommitmentProgressRow({
  title,
  dueDate,
  percent,
  isComplete,
  sourceKey,
  onRenew,
  onDelete,
  renewA11y,
  deleteA11y,
}) {
  return (
    <View
      style={{
        paddingVertical: 14,
        borderTopWidth: 1,
        borderTopColor: C.border,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <CommitmentSourceIcon sourceKey={sourceKey} size={ROW_ICON_SIZE} />

        <View style={{
          flex: 1,
          minWidth: 0,
          height: ROW_ICON_SIZE,
          justifyContent: 'space-between',
        }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text
              style={{ fontSize: 13, lineHeight: 16, fontWeight: '400', color: C.text, flex: 1, minWidth: 0 }}
              numberOfLines={1}
            >
              {title}
            </Text>
            {dueDate ? (
              <Text style={{ fontSize: 12, lineHeight: 16, color: C.muted, flexShrink: 0 }}>
                {dueDate}
              </Text>
            ) : null}
          </View>

          <GoalProgressBar percent={percent} />
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, flexShrink: 0 }}>
          {isComplete ? (
            <CommitmentActionButton onPress={onRenew} accessibilityLabel={renewA11y}>
              <RefreshCcwIcon color={C.primary} size={16} />
            </CommitmentActionButton>
          ) : null}
          <CommitmentActionButton onPress={onDelete} accessibilityLabel={deleteA11y}>
            <TrashIcon color={DELETE_ICON_COLOR} size={16} />
          </CommitmentActionButton>
        </View>
      </View>
    </View>
  );
}

/**
 * Compact progress list for auto sinking-fund commitments.
 */
export default function CommitmentProgressList({
  commitmentLines,
  budget,
  onRenewCommitment,
  onDeleteCommitment,
}) {
  const { t } = useI18n();
  const [deleteTarget, setDeleteTarget] = useState(null);

  const rows = useMemo(() => (
    (commitmentLines || []).map((line) => {
      const stashId = line.id.startsWith('stash:') ? line.id.slice('stash:'.length) : null;
      const stash = stashId ? getCustomStashById(budget, stashId) : null;
      const progress = stash ? computeCommitmentProgress(stash) : { percent: 0, isComplete: false, dueDate: null };
      const title = getJarTitle(line, t);
      const dueDate = progress.dueDate
        ? t('dashboard.savingsScreen.commitments.dueDate', { date: progress.dueDate })
        : null;
      return {
        line,
        stashId,
        sourceKey: stash?.sinkingSourceKey || null,
        title,
        dueDate,
        percent: progress.percent,
        isComplete: progress.isComplete,
        balance: Number(line.balance) || 0,
      };
    })
  ), [budget, commitmentLines, t]);

  if (!rows.length) return null;

  return (
    <>
      <View>
        {rows.map((row) => (
          <CommitmentProgressRow
            key={row.line.id}
            title={row.title}
            dueDate={row.dueDate}
            percent={row.percent}
            isComplete={row.isComplete}
            sourceKey={row.sourceKey}
            onRenew={() => row.stashId && onRenewCommitment?.(row.stashId)}
            onDelete={() => {
              if (!row.stashId) return;
              if (row.balance > 0) {
                onDeleteCommitment?.(row.stashId, { line: row.line, hasBalance: true });
                return;
              }
              setDeleteTarget(row);
            }}
            renewA11y={t('dashboard.savingsScreen.commitments.renewA11y', { name: row.title })}
            deleteA11y={t('dashboard.savingsScreen.commitments.deleteA11y', { name: row.title })}
          />
        ))}
      </View>

      <ConfirmDialog
        visible={deleteTarget != null}
        title={t('dashboard.savingsScreen.commitments.deleteTitle')}
        message={t('dashboard.savingsScreen.commitments.deleteBody', { name: deleteTarget?.title || '' })}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        destructive
        onConfirm={async () => {
          if (deleteTarget?.stashId) {
            await onDeleteCommitment?.(deleteTarget.stashId);
          }
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
