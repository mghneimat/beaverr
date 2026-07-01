import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Pressable,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Platform,
  useWindowDimensions,
  KeyboardAvoidingView,
  StyleSheet,
} from 'react-native';
import { Text } from '@gluestack-ui/themed';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolate,
  Extrapolation,
  runOnJS,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useI18n } from '../../lib/i18n';
import { useCoachChat } from '../../lib/advice/useCoachChat';
import { useCoachChatContext } from '../../lib/advice/CoachChatContext';
import { useReducedMotion } from '../../lib/useReducedMotion';
import { useTheme } from '../../lib/theme';
import { C, T } from '../../constants/onboarding-theme';
import { PHONE_MAX } from '../../lib/layoutBreakpoints';
import { DASHBOARD_MOTION_EASE, ENTER_DURATION_MS } from '../../lib/dashboardMotion';
import AiConsentModal from '../consent/AiConsentModal';
import AdviceSourceLinks from './AdviceSourceLinks';
import CoachFabGlowShell from './CoachFabGlowShell';
import { SparklesIcon, ArrowUpIcon } from '../app/AppNavIcons';
import LucideStrokeIcon from '../app/LucideStrokeIcon';
import { X_NODES, MINUS_NODES, SEARCH_NODES, HISTORY_NODES, TRASH_2_NODES } from '../app/lucidePaths';
import { fetchChatThreadList, deleteChatThread } from '../../lib/advice/fetchChatHistory';
import ConfirmDialog from '../ui/ConfirmDialog';

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** @param {{ content: string, query: string, isUser: boolean, styles: ReturnType<typeof createStyles> }} props */
function MessageText({ content, query, isUser, styles }) {
  const textStyle = [styles.bubbleText, isUser && styles.bubbleTextUser];
  const trimmed = query.trim();
  if (!trimmed) {
    return <Text style={textStyle}>{content}</Text>;
  }

  const parts = content.split(new RegExp(`(${escapeRegExp(trimmed)})`, 'gi'));
  return (
    <Text style={textStyle}>
      {parts.map((part, index) =>
        part.toLowerCase() === trimmed.toLowerCase() ? (
          <Text key={`${index}-${part}`} style={styles.searchHighlight}>
            {part}
          </Text>
        ) : (
          part
        ),
      )}
    </Text>
  );
}

const TAB_TITLE_KEYS = {
  home: 'dashboard.chat.titleHome',
  income: 'dashboard.chat.titleIncome',
  expenses: 'dashboard.chat.titleExpenses',
  budget: 'dashboard.chat.titleBudget',
  savings: 'dashboard.chat.titleSavings',
  goals: 'dashboard.chat.titleGoals',
  tracker: 'dashboard.chat.titleTracker',
  summary: 'dashboard.chat.titleSummary',
  alerts: 'dashboard.chat.titleAlerts',
};

const HISTORY_TAB_KEYS = {
  home: 'dashboard.chat.historyTab.home',
  income: 'dashboard.chat.historyTab.income',
  expenses: 'dashboard.chat.historyTab.expenses',
  budget: 'dashboard.chat.historyTab.budget',
  savings: 'dashboard.chat.historyTab.savings',
  goals: 'dashboard.chat.historyTab.goals',
  tracker: 'dashboard.chat.historyTab.tracker',
  summary: 'dashboard.chat.historyTab.summary',
  alerts: 'dashboard.chat.historyTab.alerts',
};

/** @param {string} iso @param {string} locale */
function formatThreadDate(iso, locale) {
  try {
    const tag = locale === 'cs' ? 'cs-CZ' : 'en-GB';
    return new Date(iso).toLocaleDateString(tag, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

const MODAL_WIDTH = 400;
const MODAL_HEIGHT = 500;
const FAB_SIZE = 52;
const ANCHOR_GAP = 16;
const PANEL_GAP = 14;
const PANEL_EXIT_MS = 200;
const PANEL_ENTER = { scale: 0.9, translateY: 16, opacity: 0 };

function stripCoachChatInputChrome() {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;
  document.getElementById('coach-chat-composer')?.querySelectorAll('textarea, input').forEach((el) => {
    el.style.setProperty('outline', 'none', 'important');
    el.style.setProperty('border', 'none', 'important');
    el.style.setProperty('box-shadow', 'none', 'important');
    el.style.setProperty('outline-offset', '0', 'important');
  });
}

function useHoverPress() {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  return {
    active: hovered || pressed,
    hovered,
    pressed,
    bind: {
      onPressIn: () => setPressed(true),
      onPressOut: () => setPressed(false),
      onHoverIn: () => setHovered(true),
      onHoverOut: () => setHovered(false),
    },
  };
}

/** @param {{ nodes: import('../app/LucideStrokeIcon').LucideNode[], label: string, onPress: () => void, styles: ReturnType<typeof createStyles>, active?: boolean }} props */
function HeaderIconButton({ nodes, label, onPress, styles, active: selected = false }) {
  const { active, pressed, bind } = useHoverPress();
  const iconColor = active || selected ? C.text : C.muted;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      hitSlop={8}
      {...bind}
      style={[
        styles.headerIconBtn,
        (active || selected) && styles.headerIconBtnHovered,
        selected && styles.headerIconBtnActive,
        pressed && styles.headerIconBtnPressed,
      ]}
    >
      <LucideStrokeIcon nodes={nodes} color={iconColor} size={18} />
    </Pressable>
  );
}

/** @param {{ label: string, onPress: () => void, styles: ReturnType<typeof createStyles> }} props */
function HistoryNewChatButton({ label, onPress, styles }) {
  const { active, pressed, bind } = useHoverPress();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      {...bind}
      style={[
        styles.historyNewChatBtn,
        active && styles.historyNewChatBtnHovered,
        pressed && styles.historyNewChatBtnPressed,
      ]}
    >
      <Text style={styles.historyNewChatText}>{label}</Text>
    </Pressable>
  );
}

/**
 * @param {{
 *   thread: import('../../lib/advice/fetchChatHistory').ChatThreadSummary,
 *   tabLabel: string,
 *   dateLabel: string,
 *   messageCountLabel: string,
 *   previewFallback: string,
 *   deleteA11y: string,
 *   isActive: boolean,
 *   onOpen: () => void,
 *   onDelete: () => void,
 *   styles: ReturnType<typeof createStyles>,
 * }} props
 */
function HistoryThreadRow({
  thread,
  tabLabel,
  dateLabel,
  messageCountLabel,
  previewFallback,
  deleteA11y,
  isActive,
  onOpen,
  onDelete,
  styles,
}) {
  const mainHover = useHoverPress();
  const deleteHover = useHoverPress();
  const deleteIconColor = deleteHover.active ? C.danger : C.muted;

  return (
    <View style={[styles.historyItem, isActive && styles.historyItemActive]}>
      <Pressable
        onPress={onOpen}
        accessibilityRole="button"
        accessibilityState={{ selected: isActive }}
        {...mainHover.bind}
        style={[
          styles.historyItemMain,
          mainHover.active && styles.historyItemMainHovered,
          mainHover.pressed && styles.historyItemMainPressed,
        ]}
      >
        <Text style={styles.historyItemPreview} numberOfLines={2}>
          {thread.preview || previewFallback}
        </Text>
        <Text style={styles.historyItemMeta}>
          {tabLabel}
          {' · '}
          {dateLabel}
          {' · '}
          {messageCountLabel}
        </Text>
      </Pressable>
      <Pressable
        onPress={onDelete}
        accessibilityRole="button"
        accessibilityLabel={deleteA11y}
        hitSlop={6}
        {...deleteHover.bind}
        style={[
          styles.historyDeleteBtn,
          deleteHover.active && styles.historyDeleteBtnHovered,
          deleteHover.pressed && styles.historyDeleteBtnPressed,
        ]}
      >
        <LucideStrokeIcon nodes={TRASH_2_NODES} color={deleteIconColor} size={16} />
      </Pressable>
    </View>
  );
}

/** @param {boolean} isDark */
function createStyles(isDark) {
  const panelShadow = isDark
    ? {
        web: { boxShadow: '0 16px 48px rgba(0, 0, 0, 0.45), 0 4px 12px rgba(0, 0, 0, 0.25)' },
        default: {
          elevation: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.4,
          shadowRadius: 20,
        },
      }
    : {
        web: { boxShadow: '0 16px 48px rgba(20, 39, 78, 0.2), 0 4px 12px rgba(20, 39, 78, 0.1)' },
        default: {
          elevation: 16,
          shadowColor: '#14274E',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.2,
          shadowRadius: 20,
        },
      };

  return StyleSheet.create({
    anchorRoot: {
      position: 'absolute',
      zIndex: 1000,
      alignItems: 'flex-end',
      ...(Platform.OS === 'web' ? { position: 'fixed' } : {}),
    },
    panel: {
      backgroundColor: C.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: C.border,
      overflow: 'hidden',
      ...Platform.select(panelShadow),
      ...(Platform.OS === 'web' ? { transformOrigin: 'bottom right' } : {}),
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: C.border,
      gap: 8,
      backgroundColor: C.surface,
    },
    headerTextCol: {
      flex: 1,
      minWidth: 0,
    },
    headerTitle: {
      ...T.cardTitle,
      fontSize: 15,
      color: C.text,
    },
    headerSubtitle: {
      fontSize: 12,
      color: C.accent,
      marginTop: 2,
      fontWeight: '500',
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
    },
    headerIconBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
    },
    headerIconBtnPressed: {
      backgroundColor: C.overlayPressed,
    },
    headerIconBtnHovered: {
      backgroundColor: C.overlayHover,
    },
    headerIconBtnActive: {
      backgroundColor: isDark ? 'rgba(99, 140, 255, 0.12)' : 'rgba(20, 39, 78, 0.08)',
    },
    scroll: {
      flex: 1,
      backgroundColor: C.surface,
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingVertical: 14,
      flexGrow: 1,
    },
    emptyText: {
      ...T.helper,
      color: C.muted,
      lineHeight: 22,
      fontSize: 14,
    },
    bubble: {
      maxWidth: '88%',
      marginBottom: 12,
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 14,
    },
    bubbleUser: {
      alignSelf: 'flex-end',
      backgroundColor: C.primary,
    },
    bubbleAssistant: {
      alignSelf: 'flex-start',
      backgroundColor: C.bg,
      borderWidth: isDark ? 1 : 0,
      borderColor: C.border,
    },
    bubbleText: {
      fontSize: 14,
      lineHeight: 21,
      color: C.text,
    },
    bubbleTextUser: {
      color: C.selectedText,
    },
    loadingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 4,
    },
    loadingText: {
      ...T.helper,
      color: C.muted,
      fontSize: 13,
    },
    errorText: {
      ...T.helper,
      color: C.danger,
      marginTop: 8,
      fontSize: 13,
    },
    composerWrap: {
      paddingHorizontal: 12,
      paddingTop: 8,
      paddingBottom: 12,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: C.border,
      backgroundColor: C.surface,
    },
    composer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: C.border,
      backgroundColor: C.bg,
      paddingLeft: 14,
      paddingRight: 6,
      paddingVertical: 6,
      minHeight: 48,
    },
    inputWrap: {
      flex: 1,
      minHeight: 36,
      maxHeight: 96,
      position: 'relative',
    },
    input: {
      flex: 1,
      minHeight: 36,
      maxHeight: 96,
      paddingVertical: 8,
      paddingHorizontal: 0,
      fontSize: 15,
      lineHeight: 20,
      color: C.text,
      backgroundColor: 'transparent',
      borderWidth: 0,
      borderColor: 'transparent',
      ...(Platform.OS === 'web'
        ? {
            outlineStyle: 'none',
            outlineWidth: 0,
            outlineColor: 'transparent',
            shadowOpacity: 0,
            shadowRadius: 0,
          }
        : {}),
    },
    sendBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'center',
      flexShrink: 0,
      ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
    },
    sendBtnActive: {
      backgroundColor: 'transparent',
    },
    sendBtnDisabled: {
      backgroundColor: 'transparent',
    },
    sendBtnPressed: {
      opacity: 0.88,
      transform: [{ scale: 0.94 }],
    },
    sendBtnHovered: {
      backgroundColor: C.overlayHover,
    },
    disclaimer: {
      fontSize: 10,
      lineHeight: 14,
      color: C.muted,
      marginTop: 8,
      textAlign: 'center',
    },
    searchRow: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: C.border,
      backgroundColor: C.surface,
      gap: 4,
    },
    searchInput: {
      borderRadius: 10,
      borderWidth: 1,
      borderColor: C.border,
      backgroundColor: C.bg,
      paddingHorizontal: 12,
      paddingVertical: Platform.OS === 'web' ? 8 : 6,
      fontSize: 14,
      color: C.text,
      ...(Platform.OS === 'web'
        ? { outlineStyle: 'none', outlineWidth: 0 }
        : {}),
    },
    searchMeta: {
      fontSize: 11,
      color: C.muted,
      paddingHorizontal: 2,
    },
    searchHighlight: {
      backgroundColor: isDark ? 'rgba(255, 200, 80, 0.35)' : 'rgba(255, 214, 102, 0.65)',
      color: C.text,
    },
    historyPanel: {
      flex: 1,
      backgroundColor: C.surface,
    },
    historyPanelHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: C.border,
    },
    historyPanelTitle: {
      fontSize: 13,
      fontWeight: '600',
      color: C.text,
    },
    historyNewChatBtn: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
      backgroundColor: C.bg,
      borderWidth: 1,
      borderColor: C.border,
      ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
    },
    historyNewChatBtnHovered: {
      backgroundColor: C.overlayHover,
      borderColor: C.accent,
    },
    historyNewChatBtnPressed: {
      backgroundColor: C.overlayPressed,
    },
    historyNewChatText: {
      fontSize: 12,
      fontWeight: '600',
      color: C.accent,
    },
    historyList: {
      flex: 1,
    },
    historyListContent: {
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    historyItem: {
      flexDirection: 'row',
      alignItems: 'stretch',
      borderRadius: 10,
      borderWidth: 1,
      borderColor: C.border,
      backgroundColor: C.bg,
      marginBottom: 8,
      overflow: 'hidden',
    },
    historyItemMain: {
      flex: 1,
      paddingHorizontal: 12,
      paddingVertical: 10,
      ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
    },
    historyItemMainHovered: {
      backgroundColor: C.overlayHover,
    },
    historyItemMainPressed: {
      backgroundColor: C.overlayPressed,
    },
    historyDeleteBtn: {
      width: 44,
      alignItems: 'center',
      justifyContent: 'center',
      borderLeftWidth: StyleSheet.hairlineWidth,
      borderLeftColor: C.border,
      ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
    },
    historyDeleteBtnHovered: {
      backgroundColor: C.dangerBg,
    },
    historyDeleteBtnPressed: {
      backgroundColor: C.overlayPressed,
    },
    historyItemActive: {
      borderColor: C.accent,
      backgroundColor: isDark ? 'rgba(99, 140, 255, 0.12)' : 'rgba(20, 39, 78, 0.06)',
    },
    historyItemPreview: {
      fontSize: 14,
      lineHeight: 20,
      color: C.text,
    },
    historyItemMeta: {
      fontSize: 11,
      color: C.muted,
      marginTop: 4,
    },
    fabInner: {
      width: '100%',
      height: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: FAB_SIZE / 2,
      ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
    },
    fabHovered: {
      backgroundColor: C.overlayHover,
    },
    fabPressed: {
      transform: [{ scale: 0.9 }],
      backgroundColor: C.overlayPressed,
    },
  });
}

/**
 * Persistent bottom-right coach FAB + floating chat panel (assistant-ui modal pattern).
 */
export default function CoachChatShell() {
  const { t } = useI18n();
  const { mode, isDark } = useTheme();
  const styles = useMemo(() => createStyles(isDark), [mode, isDark]);
  const fabIconColor = isDark ? '#FFFFFF' : 'rgb(20, 39, 78)';
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  const {
    showFab,
    panelOpen,
    sessionKey,
    contextKey,
    insightContext,
    financials,
    locale,
    session,
    configured,
    togglePanel,
    minimizePanel,
    discardChat,
    beginNewChatSession,
    consentModalOpen,
    onConsentAccepted,
    onConsentDeclined,
  } = useCoachChatContext();

  const [draft, setDraft] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyThreads, setHistoryThreads] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [panelRendered, setPanelRendered] = useState(panelOpen);

  const tabKey = insightContext?.tabKey ?? 'home';
  const coachParagraphs = insightContext?.coachParagraphs ?? [];
  const seedSnapshot = insightContext?.snapshot ?? null;
  const seedRules = insightContext?.triggeredRules ?? null;

  const { messages, sources, phase, threadId, sendMessage, loadThread } = useCoachChat({
    tabKey,
    financials,
    locale,
    triggeredRules: seedRules,
    snapshot: seedSnapshot,
    coachParagraphs,
    session,
    sessionKey,
    contextKey,
  });

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const visibleMessages = useMemo(() => {
    if (!normalizedSearch) {
      return messages.map((msg, index) => ({ msg, index }));
    }
    return messages
      .map((msg, index) => ({ msg, index }))
      .filter(({ msg }) => msg.content.toLowerCase().includes(normalizedSearch));
  }, [messages, normalizedSearch]);

  const searchMatchCount = normalizedSearch
    ? messages.filter((msg) => msg.content.toLowerCase().includes(normalizedSearch)).length
    : 0;

  const panelProgress = useSharedValue(panelOpen ? 1 : 0);

  const titleKey = insightContext
    ? TAB_TITLE_KEYS[tabKey] || 'dashboard.chat.title'
    : 'dashboard.chat.titleGeneral';

  const isLoading = phase === 'loading';
  const canSend = draft.trim().length > 0 && !isLoading && configured && session;
  const fabHover = useHoverPress();
  const sendHover = useHoverPress();

  const handleInputFocus = useCallback(() => {
    stripCoachChatInputChrome();
    if (Platform.OS === 'web') {
      requestAnimationFrame(stripCoachChatInputChrome);
    }
  }, []);

  const handleInputPointerDown = useCallback(() => {
    stripCoachChatInputChrome();
  }, []);
  const isPhoneWeb = Platform.OS === 'web' && width < PHONE_MAX;

  const panelSize = useMemo(() => {
    const maxW = Math.min(MODAL_WIDTH, width - ANCHOR_GAP * 2);
    const reservedBottom = FAB_SIZE + ANCHOR_GAP + insets.bottom + PANEL_GAP;
    const maxH = Math.min(MODAL_HEIGHT, height - insets.top - reservedBottom - ANCHOR_GAP);
    return { width: maxW, height: Math.max(300, maxH) };
  }, [width, height, insets.top, insets.bottom]);

  const anchorBottom = ANCHOR_GAP + insets.bottom;
  const anchorRight = ANCHOR_GAP + insets.right;

  useEffect(() => {
    if (reduceMotion) {
      setPanelRendered(panelOpen);
      panelProgress.value = panelOpen ? 1 : 0;
      return;
    }

    if (panelOpen) {
      setPanelRendered(true);
      panelProgress.value = withTiming(1, {
        duration: ENTER_DURATION_MS,
        easing: DASHBOARD_MOTION_EASE,
      });
      return;
    }

    if (!panelRendered) return;

    panelProgress.value = withTiming(
      0,
      { duration: PANEL_EXIT_MS, easing: DASHBOARD_MOTION_EASE },
      (finished) => {
        if (finished) runOnJS(setPanelRendered)(false);
      },
    );
  }, [panelOpen, panelRendered, reduceMotion, panelProgress]);

  useEffect(() => {
    setSearchOpen(false);
    setSearchQuery('');
    setHistoryOpen(false);
  }, [sessionKey]);

  const loadHistoryThreads = useCallback(async () => {
    if (!session) return;
    setHistoryLoading(true);
    const result = await fetchChatThreadList();
    if (result.ok) {
      setHistoryThreads(result.threads);
    } else {
      setHistoryThreads([]);
    }
    setHistoryLoading(false);
  }, [session]);

  useEffect(() => {
    if (panelOpen && historyOpen && session) {
      loadHistoryThreads();
    }
  }, [panelOpen, historyOpen, session, loadHistoryThreads]);

  const handleToggleHistory = useCallback(() => {
    setHistoryOpen((open) => {
      const next = !open;
      if (next) setSearchOpen(false);
      return next;
    });
  }, []);

  const handleSelectHistoryThread = useCallback(
    async (id) => {
      const ok = await loadThread(id);
      if (ok) setHistoryOpen(false);
    },
    [loadThread],
  );

  const handleNewChatFromHistory = useCallback(async () => {
    await beginNewChatSession();
    setHistoryOpen(false);
  }, [beginNewChatSession]);

  const handleConfirmDeleteThread = useCallback(async () => {
    if (!deleteTarget) return;

    const targetId = deleteTarget.id;
    const result = await deleteChatThread(targetId);
    setDeleteTarget(null);

    if (!result.ok) return;

    setHistoryThreads((prev) => prev.filter((thread) => thread.id !== targetId));
    if (threadId === targetId) {
      await beginNewChatSession();
    }
  }, [deleteTarget, threadId, beginNewChatSession]);

  const historySearchQuery = historyOpen ? searchQuery.trim().toLowerCase() : '';
  const filteredHistoryThreads = useMemo(() => {
    if (!historySearchQuery) return historyThreads;
    return historyThreads.filter(
      (thread) =>
        thread.preview.toLowerCase().includes(historySearchQuery)
        || (HISTORY_TAB_KEYS[thread.tabKey]
          && t(HISTORY_TAB_KEYS[thread.tabKey]).toLowerCase().includes(historySearchQuery)),
    );
  }, [historyThreads, historySearchQuery, t]);

  useEffect(() => {
    if (panelOpen && scrollRef.current) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120);
    }
  }, [panelOpen, messages.length]);

  useEffect(() => {
    if (Platform.OS !== 'web' || !panelRendered || !configured || !session) return;

    stripCoachChatInputChrome();
    const root = document.getElementById('coach-chat-composer');
    if (!root) return;

    const onFocusIn = () => stripCoachChatInputChrome();
    const onPointerDown = () => stripCoachChatInputChrome();

    root.addEventListener('focusin', onFocusIn, true);
    root.addEventListener('mousedown', onPointerDown, true);
    root.addEventListener('pointerdown', onPointerDown, true);

    const observer = new MutationObserver(stripCoachChatInputChrome);
    observer.observe(root, { childList: true, subtree: true });

    const id = requestAnimationFrame(stripCoachChatInputChrome);
    return () => {
      cancelAnimationFrame(id);
      observer.disconnect();
      root.removeEventListener('focusin', onFocusIn, true);
      root.removeEventListener('mousedown', onPointerDown, true);
      root.removeEventListener('pointerdown', onPointerDown, true);
    };
  }, [panelRendered, configured, session]);

  const panelAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(panelProgress.value, [0, 1], [PANEL_ENTER.opacity, 1], Extrapolation.CLAMP),
    transform: [
      {
        translateY: interpolate(
          panelProgress.value,
          [0, 1],
          [PANEL_ENTER.translateY, 0],
          Extrapolation.CLAMP,
        ),
      },
      {
        scale: interpolate(
          panelProgress.value,
          [0, 1],
          [PANEL_ENTER.scale, 1],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  const handleSend = async () => {
    if (!canSend) return;
    const text = draft.trim();
    setDraft('');
    await sendMessage(text);
  };

  const unavailableMessage = !configured
    ? t('dashboard.advice.notConfigured')
    : t('dashboard.advice.signInHelper');

  if (!showFab) {
    return (
      <AiConsentModal
        visible={consentModalOpen}
        onClose={onConsentDeclined}
        onAccepted={onConsentAccepted}
      />
    );
  }

  return (
    <>
      <View
        pointerEvents="box-none"
        style={[styles.anchorRoot, { bottom: anchorBottom, right: anchorRight }]}
      >
        {panelRendered ? (
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            pointerEvents="box-none"
            style={{
              position: 'absolute',
              right: 0,
              bottom: FAB_SIZE + PANEL_GAP,
              width: panelSize.width,
              height: panelSize.height,
            }}
          >
            <Animated.View
              style={[
                styles.panel,
                { width: panelSize.width, height: panelSize.height },
                panelAnimatedStyle,
              ]}
              pointerEvents={panelOpen ? 'auto' : 'none'}
            >
              <View style={styles.header}>
                <View style={styles.headerTextCol}>
                  <Text accessibilityRole="header" style={styles.headerTitle} numberOfLines={1}>
                    {t(titleKey)}
                  </Text>
                  {insightContext ? (
                    <Text style={styles.headerSubtitle} numberOfLines={1}>
                      {t('dashboard.chat.insightContextLabel')}
                    </Text>
                  ) : null}
                </View>
                <View style={styles.headerActions}>
                  {configured && session ? (
                    <HeaderIconButton
                      nodes={HISTORY_NODES}
                      label={t('dashboard.chat.historyA11y')}
                      onPress={handleToggleHistory}
                      active={historyOpen}
                      styles={styles}
                    />
                  ) : null}
                  {messages.length > 0 && !historyOpen ? (
                    <HeaderIconButton
                      nodes={SEARCH_NODES}
                      label={t('dashboard.chat.searchA11y')}
                      active={searchOpen}
                      onPress={() => {
                        setSearchOpen((open) => !open);
                        if (!searchOpen) setHistoryOpen(false);
                      }}
                      styles={styles}
                    />
                  ) : null}
                  <HeaderIconButton
                    nodes={MINUS_NODES}
                    label={t('dashboard.chat.minimizeA11y')}
                    onPress={minimizePanel}
                    styles={styles}
                  />
                  <HeaderIconButton
                    nodes={X_NODES}
                    label={t('dashboard.chat.discardA11y')}
                    onPress={discardChat}
                    styles={styles}
                  />
                </View>
              </View>

              {historyOpen && configured && session ? (
                <View style={styles.historyPanel}>
                  <View style={styles.historyPanelHeader}>
                    <Text style={styles.historyPanelTitle}>{t('dashboard.chat.historyTitle')}</Text>
                    <HistoryNewChatButton
                      label={t('dashboard.chat.historyNewChat')}
                      onPress={handleNewChatFromHistory}
                      styles={styles}
                    />
                  </View>
                  <View style={styles.searchRow}>
                    <TextInput
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      placeholder={t('dashboard.chat.historySearchPlaceholder')}
                      placeholderTextColor={C.muted}
                      style={styles.searchInput}
                      accessibilityLabel={t('dashboard.chat.historySearchPlaceholder')}
                      autoCorrect={false}
                      autoCapitalize="none"
                    />
                  </View>
                  <ScrollView
                    style={styles.historyList}
                    contentContainerStyle={styles.historyListContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={!isPhoneWeb}
                  >
                    {historyLoading ? (
                      <View style={styles.loadingRow}>
                        <ActivityIndicator size="small" color={C.accent} />
                        <Text style={styles.loadingText}>{t('dashboard.chat.historyLoading')}</Text>
                      </View>
                    ) : null}

                    {!historyLoading && filteredHistoryThreads.length === 0 ? (
                      <Text style={styles.emptyText}>
                        {historySearchQuery
                          ? t('dashboard.chat.searchNoMatches')
                          : t('dashboard.chat.historyEmpty')}
                      </Text>
                    ) : null}

                    {!historyLoading
                      ? filteredHistoryThreads.map((thread) => {
                          const tabLabelKey = HISTORY_TAB_KEYS[thread.tabKey];
                          const tabLabel = tabLabelKey
                            ? t(tabLabelKey)
                            : t('dashboard.chat.historyPreviewFallback');
                          return (
                            <HistoryThreadRow
                              key={thread.id}
                              thread={thread}
                              tabLabel={tabLabel}
                              dateLabel={formatThreadDate(thread.updatedAt, locale)}
                              messageCountLabel={t('dashboard.chat.historyMessageCount', {
                                count: thread.messageCount,
                              })}
                              previewFallback={t('dashboard.chat.historyPreviewFallback')}
                              deleteA11y={t('dashboard.chat.historyDeleteA11y')}
                              isActive={thread.id === threadId}
                              onOpen={() => handleSelectHistoryThread(thread.id)}
                              onDelete={() => setDeleteTarget(thread)}
                              styles={styles}
                            />
                          );
                        })
                      : null}
                  </ScrollView>
                </View>
              ) : null}

              {searchOpen && messages.length > 0 && !historyOpen ? (
                <View style={styles.searchRow}>
                  <TextInput
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder={t('dashboard.chat.searchPlaceholder')}
                    placeholderTextColor={C.muted}
                    style={styles.searchInput}
                    accessibilityLabel={t('dashboard.chat.searchPlaceholder')}
                    autoCorrect={false}
                    autoCapitalize="none"
                  />
                  {normalizedSearch ? (
                    <Text style={styles.searchMeta}>
                      {searchMatchCount > 0
                        ? t('dashboard.chat.searchMatchCount', { count: searchMatchCount })
                        : t('dashboard.chat.searchNoMatches')}
                    </Text>
                  ) : null}
                </View>
              ) : null}

              {!historyOpen ? (
              <ScrollView
                ref={scrollRef}
                keyboardShouldPersistTaps="handled"
                bounces={false}
                showsVerticalScrollIndicator={!isPhoneWeb}
                contentContainerStyle={styles.scrollContent}
                style={styles.scroll}
              >
                {!configured || !session ? (
                  <Text style={styles.emptyText}>{unavailableMessage}</Text>
                ) : (
                  <>
                    {messages.length === 0 ? (
                      <Text style={styles.emptyText}>
                        {insightContext
                          ? t('dashboard.chat.emptyHintInsight')
                          : t('dashboard.chat.emptyHintGeneral')}
                      </Text>
                    ) : null}

                    {visibleMessages.map(({ msg, index }) => {
                      const isUser = msg.role === 'user';
                      return (
                        <View
                          key={`${index}-${msg.content.slice(0, 16)}`}
                          style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}
                        >
                          <MessageText
                            content={msg.content}
                            query={searchQuery}
                            isUser={isUser}
                            styles={styles}
                          />
                        </View>
                      );
                    })}

                    {normalizedSearch && searchMatchCount === 0 ? (
                      <Text style={styles.emptyText}>{t('dashboard.chat.searchNoMatches')}</Text>
                    ) : null}

                    {isLoading ? (
                      <View style={styles.loadingRow}>
                        <ActivityIndicator size="small" color={C.accent} />
                        <Text style={styles.loadingText}>{t('dashboard.chat.loading')}</Text>
                      </View>
                    ) : null}

                    {phase === 'error' ? (
                      <Text style={styles.errorText}>{t('dashboard.chat.error')}</Text>
                    ) : null}

                    {messages.length > 0 && sources.length > 0 && !isLoading ? (
                      <AdviceSourceLinks sources={sources} />
                    ) : null}
                  </>
                )}
              </ScrollView>
              ) : null}

              {configured && session && !historyOpen ? (
                <View style={styles.composerWrap}>
                  <View
                    nativeID="coach-chat-composer"
                    {...(Platform.OS === 'web' ? { dataSet: { coachChatComposer: 'true' } } : {})}
                    style={styles.composer}
                  >
                    <View style={styles.inputWrap}>
                      <TextInput
                        ref={inputRef}
                        nativeID="coach-chat-input"
                        {...(Platform.OS === 'web'
                          ? {
                              dataSet: {
                                coachChatInput: 'true',
                                gramm: 'false',
                                grammEditor: 'false',
                                enableGrammarly: 'false',
                              },
                              onMouseDown: handleInputPointerDown,
                            }
                          : {})}
                        value={draft}
                        onChangeText={(text) => {
                          setDraft(text);
                          stripCoachChatInputChrome();
                        }}
                        placeholder={t('dashboard.chat.placeholder')}
                        placeholderTextColor={C.muted}
                        multiline
                        scrollEnabled
                        maxLength={1000}
                        editable={!isLoading}
                        autoCorrect={false}
                        spellCheck={false}
                        style={[
                          styles.input,
                          { textAlignVertical: draft.length === 0 ? 'center' : 'top' },
                        ]}
                        accessibilityLabel={t('dashboard.chat.placeholder')}
                        onFocus={handleInputFocus}
                        onSubmitEditing={handleSend}
                        blurOnSubmit={false}
                      />
                    </View>
                    <Pressable
                      onPress={canSend ? handleSend : undefined}
                      accessibilityRole="button"
                      accessibilityState={{ disabled: !canSend }}
                      accessibilityLabel={t('dashboard.chat.sendA11y')}
                      {...(canSend ? sendHover.bind : {})}
                      style={({ pressed }) => [
                        styles.sendBtn,
                        canSend ? styles.sendBtnActive : styles.sendBtnDisabled,
                        canSend && sendHover.active && styles.sendBtnHovered,
                        (pressed || sendHover.pressed) && canSend && styles.sendBtnPressed,
                        Platform.OS === 'web' && !canSend ? { cursor: 'default' } : null,
                      ]}
                    >
                      <ArrowUpIcon
                        color={canSend ? C.accent : C.muted}
                        size={18}
                      />
                    </Pressable>
                  </View>
                  <Text style={styles.disclaimer}>{t('dashboard.advice.disclaimer')}</Text>
                </View>
              ) : null}
            </Animated.View>
          </KeyboardAvoidingView>
        ) : null}

        <CoachFabGlowShell size={FAB_SIZE}>
          <Pressable
            onPress={togglePanel}
            accessibilityRole="button"
            accessibilityLabel={
              panelOpen ? t('dashboard.chat.minimizeA11y') : t('dashboard.chat.fabA11y')
            }
            {...fabHover.bind}
            style={[
              styles.fabInner,
              fabHover.active && styles.fabHovered,
              fabHover.pressed && styles.fabPressed,
            ]}
          >
            {panelOpen ? (
              <LucideStrokeIcon nodes={MINUS_NODES} color={fabIconColor} size={22} strokeWidth={2.25} />
            ) : (
              <SparklesIcon color={fabIconColor} size={22} />
            )}
          </Pressable>
        </CoachFabGlowShell>
      </View>

      <AiConsentModal
        visible={consentModalOpen}
        onClose={onConsentDeclined}
        onAccepted={onConsentAccepted}
      />

      <ConfirmDialog
        visible={Boolean(deleteTarget)}
        title={t('dashboard.chat.historyDeleteTitle')}
        message={t('dashboard.chat.historyDeleteMessage')}
        confirmLabel={t('dashboard.chat.historyDeleteConfirm')}
        cancelLabel={t('common.cancel')}
        destructive
        onConfirm={handleConfirmDeleteThread}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
