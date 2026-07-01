import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { useI18n } from '../../lib/i18n';
import { invokeAdminApi } from '../../lib/admin/adminApi';
import ConfirmDialog from '../ui/ConfirmDialog';
import { C, R, S, T } from '../../constants/onboarding-theme';
import { elevationShadow } from '../../lib/shadow';

const TABS = ['status', 'sources', 'chunks', 'routes'];
const SOURCE_TYPES = ['book', 'country'];
const ROUTE_SUB_TABS = ['chat_keyword', 'tab', 'rule'];

function RouteSubTabBar({ active, onChange, t }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 4,
        marginBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: C.border,
        paddingBottom: 4,
      }}
    >
      {ROUTE_SUB_TABS.map((key) => {
        const selected = active === key;
        return (
          <Pressable
            key={key}
            onPress={() => onChange(key)}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderBottomWidth: 2,
              borderBottomColor: selected ? C.accent : 'transparent',
              marginBottom: -5,
              ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
            }}
          >
            <Text style={{
              fontSize: 14,
              fontWeight: selected ? '700' : '500',
              color: selected ? C.accent : C.textMuted,
            }}>
              {t(`admin.knowledge.routeTypes.${key}`)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function RouteEditForm({ editRoute, routeSubTab, t, onChange, onSave, onCancel }) {
  const routeType = editRoute?.route_type || routeSubTab;
  return (
    <Card style={{ borderColor: C.accent, marginBottom: 16 }}>
      <Text style={{ fontWeight: '700', color: C.text, marginBottom: 4 }}>
        {editRoute?.id ? t('admin.knowledge.editRoute') : t('admin.knowledge.newRoute')}
      </Text>
      <Text style={{ fontSize: 12, color: C.textMuted, marginBottom: 12 }}>
        {t(`admin.knowledge.routeTypes.${routeType}`)}
      </Text>
      {routeType === 'rule' ? (
        <Field label={t('admin.knowledge.fields.ruleId')} hint={t('admin.knowledge.fields.ruleIdHint')} value={editRoute.rule_id || ''} onChangeText={(rule_id) => onChange({ ...editRoute, rule_id })} placeholder="fixed_cost_ratio_tight" />
      ) : null}
      {routeType === 'tab' ? (
        <Field label={t('admin.knowledge.fields.tabKey')} hint={t('admin.knowledge.fields.tabKeyHint')} value={editRoute.tab_key || ''} onChangeText={(tab_key) => onChange({ ...editRoute, tab_key })} placeholder="budget" />
      ) : null}
      {routeType === 'chat_keyword' ? (
        <Field label={t('admin.knowledge.fields.keywords')} hint={t('admin.knowledge.fields.keywordsHint')} value={formatList(editRoute.keywords)} onChangeText={(text) => onChange({ ...editRoute, keywords: parseList(text) })} multiline placeholder="rent, tenant, lease" />
      ) : null}
      <Field label={t('admin.knowledge.fields.chunkIds')} hint={t('admin.knowledge.fields.chunkIdsHint')} value={formatList(editRoute.chunk_ids)} onChangeText={(text) => onChange({ ...editRoute, chunk_ids: parseList(text) })} multiline placeholder="sethi_csp#fixed_costs_crisis, cfpb#fragility" />
      <Field label={t('admin.knowledge.fields.countryCode')} value={editRoute.country_code || 'CZ'} onChangeText={(country_code) => onChange({ ...editRoute, country_code })} />
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
        <Pressable onPress={onSave} style={{ paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8, backgroundColor: C.accent }}>
          <Text style={{ color: '#fff', fontWeight: '600' }}>{t('common.save')}</Text>
        </Pressable>
        <Pressable onPress={onCancel} style={{ paddingHorizontal: 14, paddingVertical: 10 }}>
          <Text style={{ color: C.textMuted }}>{t('common.cancel')}</Text>
        </Pressable>
      </View>
    </Card>
  );
}

function InfoBox({ title, body, steps }) {
  return (
    <View
      style={{
        backgroundColor: C.heroIncomeBg,
        borderWidth: 1,
        borderColor: C.heroIncomeBorder,
        borderRadius: R.card,
        padding: 16,
        marginBottom: 20,
      }}
    >
      {title ? (
        <Text style={{ fontSize: 14, fontWeight: '700', color: C.text, marginBottom: 6 }}>{title}</Text>
      ) : null}
      <Text style={{ fontSize: 13, lineHeight: 20, color: C.textMuted }}>{body}</Text>
      {steps?.length ? (
        <View style={{ marginTop: 12, gap: 6 }}>
          {steps.map((step, i) => (
            <Text key={step} style={{ fontSize: 13, lineHeight: 20, color: C.text }}>
              {`${i + 1}. ${step}`}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const EMPTY_SOURCE = {
  id: '',
  type: 'book',
  title: '',
  locale: 'en',
  doc_path: '',
  country_code: '',
  is_active: true,
};

const EMPTY_ROUTE = {
  route_type: 'chat_keyword',
  rule_id: '',
  tab_key: '',
  country_code: 'CZ',
  keywords: [],
  chunk_ids: [],
  priority: 0,
};

function SectionHeader({ title, actionLabel, onAction }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
      <Text style={{ ...T.sectionTitle, color: C.text }}>{title}</Text>
      {onAction ? (
        <Pressable
          onPress={onAction}
          style={{
            paddingHorizontal: 14,
            paddingVertical: 8,
            borderRadius: R.pill,
            backgroundColor: C.accent,
            ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
          }}
        >
          <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function Field({ label, hint, value, onChangeText, multiline, placeholder }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ fontSize: 13, fontWeight: '600', color: C.text, marginBottom: 4 }}>{label}</Text>
      {hint ? <Text style={{ fontSize: 12, color: C.textMuted, marginBottom: 6 }}>{hint}</Text> : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        placeholder={placeholder}
        placeholderTextColor={C.textMuted}
        style={{
          borderWidth: 1,
          borderColor: C.border,
          borderRadius: R.input,
          paddingHorizontal: 12,
          paddingVertical: Platform.OS === 'web' ? 10 : 8,
          color: C.text,
          backgroundColor: C.bg,
          minHeight: multiline ? 88 : undefined,
          textAlignVertical: multiline ? 'top' : 'center',
        }}
      />
    </View>
  );
}

function TypePills({ options, value, onChange, labelKeyPrefix, t }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
      {options.map((opt) => {
        const active = value === opt;
        return (
          <Pressable
            key={opt}
            onPress={() => onChange(opt)}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: R.pill,
              borderWidth: 1,
              borderColor: active ? C.accent : C.border,
              backgroundColor: active ? C.accentSoft : C.surface,
            }}
          >
            <Text style={{ color: active ? C.accent : C.textMuted, fontSize: 13, fontWeight: '600' }}>
              {t(`${labelKeyPrefix}.${opt}`)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function Card({ children, style }) {
  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: C.border,
        borderRadius: R.card,
        padding: 14,
        marginBottom: 10,
        backgroundColor: C.surface,
        ...elevationShadow({ offsetY: 2, blur: 8, opacity: 0.04 }),
        ...style,
      }}
    >
      {children}
    </View>
  );
}

function ActionRow({ onEdit, onDelete, editLabel, deleteLabel }) {
  return (
    <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
      <Pressable
        onPress={onEdit}
        style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: C.accentSoft }}
      >
        <Text style={{ color: C.accent, fontSize: 12, fontWeight: '600' }}>{editLabel}</Text>
      </Pressable>
      <Pressable
        onPress={onDelete}
        style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: C.dangerBg }}
      >
        <Text style={{ color: C.danger, fontSize: 12, fontWeight: '600' }}>{deleteLabel}</Text>
      </Pressable>
    </View>
  );
}

function parseList(value) {
  return String(value || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function formatList(list) {
  return Array.isArray(list) ? list.join(', ') : '';
}

export default function AdminKnowledgeScreen() {
  const { t } = useI18n();
  const [tab, setTab] = useState('status');
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);
  const [sources, setSources] = useState([]);
  const [chunks, setChunks] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [editChunk, setEditChunk] = useState(null);
  const [editSource, setEditSource] = useState(null);
  const [editRoute, setEditRoute] = useState(null);
  const [routeSubTab, setRouteSubTab] = useState('chat_keyword');
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadStatus = useCallback(async () => {
    const result = await invokeAdminApi('knowledge.status');
    if (result.ok) setStatus(result.data);
  }, []);

  const loadSources = useCallback(async () => {
    const result = await invokeAdminApi('knowledge.listSources');
    if (result.ok) setSources(result.data?.sources ?? []);
  }, []);

  const loadChunks = useCallback(async () => {
    const result = await invokeAdminApi('knowledge.listChunks');
    if (result.ok) setChunks(result.data?.chunks ?? []);
  }, []);

  const loadRoutes = useCallback(async () => {
    const result = await invokeAdminApi('knowledge.listRoutes');
    if (result.ok) setRoutes(result.data?.routes ?? []);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    if (tab === 'status') await loadStatus();
    if (tab === 'sources') await loadSources();
    if (tab === 'chunks') await loadChunks();
    if (tab === 'routes') await loadRoutes();
    setLoading(false);
  }, [tab, loadStatus, loadSources, loadChunks, loadRoutes]);

  useEffect(() => {
    load();
  }, [load]);

  const seedBundle = async (publish) => {
    const result = await invokeAdminApi('knowledge.seed', { publish });
    if (!result.ok) {
      Alert.alert(t('admin.knowledge.seedFailed'), result.error);
      return;
    }
    Alert.alert(t('admin.knowledge.seedDone'), t('admin.knowledge.seedDoneBody', { count: result.data?.inserted ?? 0 }));
    load();
  };

  const publish = async () => {
    const result = await invokeAdminApi('knowledge.publish');
    if (!result.ok) {
      Alert.alert(t('admin.knowledge.publishFailed'), result.error);
      return;
    }
    Alert.alert(
      t('admin.knowledge.publishDone'),
      t('admin.knowledge.publishDoneBody', {
        coach: result.data?.coachVersion,
        chat: result.data?.chatVersion,
      }),
    );
    load();
  };

  const saveChunk = async () => {
    if (!editChunk?.id) return;
    const result = await invokeAdminApi('knowledge.upsertChunk', { chunk: editChunk });
    if (!result.ok) {
      Alert.alert(t('admin.knowledge.saveFailed'), result.error);
      return;
    }
    setEditChunk(null);
    loadChunks();
  };

  const saveSource = async () => {
    if (!editSource?.id?.trim()) return;
    const payload = {
      ...editSource,
      id: editSource.id.trim(),
      doc_path: editSource.doc_path?.trim() || null,
      country_code: editSource.country_code?.trim() || null,
    };
    const result = await invokeAdminApi('knowledge.upsertSource', { source: payload });
    if (!result.ok) {
      Alert.alert(t('admin.knowledge.saveFailed'), result.error);
      return;
    }
    setEditSource(null);
    loadSources();
  };

  const saveRoute = async () => {
    if (!editRoute?.route_type) return;
    const result = await invokeAdminApi('knowledge.upsertRoute', { route: editRoute });
    if (!result.ok) {
      Alert.alert(t('admin.knowledge.saveFailed'), result.error);
      return;
    }
    setEditRoute(null);
    loadRoutes();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const { kind, id } = deleteTarget;
    let result;
    if (kind === 'source') result = await invokeAdminApi('knowledge.deleteSource', { sourceId: id });
    else if (kind === 'route') result = await invokeAdminApi('knowledge.deleteRoute', { routeId: id });
    else if (kind === 'chunk') result = await invokeAdminApi('knowledge.deleteChunk', { chunkId: id });
    setDeleteTarget(null);
    if (!result?.ok) {
      Alert.alert(t('admin.knowledge.deleteFailed'), result?.error);
      return;
    }
    load();
  };

  const activeRoutes = useMemo(
    () => routes.filter((r) => r.route_type === routeSubTab),
    [routes, routeSubTab],
  );

  const routeIntroSteps = useMemo(() => ([
    t(`admin.knowledge.routeTabIntro.${routeSubTab}.edit1`),
    t(`admin.knowledge.routeTabIntro.${routeSubTab}.edit2`),
    t(`admin.knowledge.routeTabIntro.${routeSubTab}.edit3`),
  ]), [routeSubTab, t]);

  const renderRouteSummary = (route) => {
    if (route.route_type === 'rule') {
      return t('admin.knowledge.routeSummary.rule', { rule: route.rule_id || '—' });
    }
    if (route.route_type === 'tab') {
      return t('admin.knowledge.routeSummary.tab', { tab: route.tab_key || '—' });
    }
    return t('admin.knowledge.routeSummary.keywords', {
      keywords: (route.keywords || []).slice(0, 4).join(', ') || '—',
    });
  };

  const introSteps = [
    t('admin.knowledge.workflow.step1'),
    t('admin.knowledge.workflow.step2'),
    t('admin.knowledge.workflow.step3'),
  ];

  const openNewRoute = () => {
    setEditRoute({
      ...EMPTY_ROUTE,
      route_type: routeSubTab,
      keywords: [],
      chunk_ids: [],
    });
  };

  const handleRouteSubTabChange = (next) => {
    setRouteSubTab(next);
    setEditRoute(null);
  };

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: S.pagePadH, paddingVertical: S.pagePadV, maxWidth: 920, alignSelf: 'center', width: '100%' }}>
      <Text style={{ ...T.pageTitle, color: C.text, marginBottom: 8 }}>{t('admin.knowledge.title')}</Text>
      <Text style={{ color: C.textMuted, marginBottom: 16, lineHeight: 22 }}>{t('admin.knowledge.subtitle')}</Text>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20, gap: 8 }}>
        {TABS.map((key) => (
          <Pressable
            key={key}
            onPress={() => setTab(key)}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 9,
              borderRadius: R.pill,
              backgroundColor: tab === key ? C.accent : C.surface,
              borderWidth: 1,
              borderColor: tab === key ? C.accent : C.border,
            }}
          >
            <Text style={{ color: tab === key ? '#fff' : C.textMuted, fontWeight: '600', fontSize: 13 }}>
              {t(`admin.knowledge.tabs.${key}`)}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator color={C.accent} />
      ) : (
        <>
          {tab === 'status' ? (
            <View>
              <InfoBox
                title={t('admin.knowledge.statusIntroTitle')}
                body={t('admin.knowledge.statusIntroBody')}
                steps={introSteps}
              />
              {status ? (
                <Card>
                  <Text style={{ color: C.text, fontWeight: '600', marginBottom: 8 }}>
                    {t('admin.knowledge.statusLine', {
                      published: status.publishedChunks,
                      total: status.totalChunks,
                      coach: status.coachVersion,
                      chat: status.chatVersion,
                    })}
                  </Text>
                  <Text style={{ color: status.liveInDb ? C.accent : C.textMuted, lineHeight: 20 }}>
                    {status.liveInDb ? t('admin.knowledge.live') : t('admin.knowledge.draftOnly')}
                  </Text>
                </Card>
              ) : null}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 }}>
                <Pressable onPress={() => seedBundle(false)} style={{ paddingHorizontal: 16, paddingVertical: 11, borderRadius: R.input, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border }}>
                  <Text style={{ color: C.text, fontWeight: '600' }}>{t('admin.knowledge.seedDraft')}</Text>
                  <Text style={{ color: C.textMuted, fontSize: 11, marginTop: 2 }}>{t('admin.knowledge.seedDraftHint')}</Text>
                </Pressable>
                <Pressable onPress={() => seedBundle(true)} style={{ paddingHorizontal: 16, paddingVertical: 11, borderRadius: R.input, backgroundColor: C.accentSoft, borderWidth: 1, borderColor: C.accent }}>
                  <Text style={{ color: C.accent, fontWeight: '600' }}>{t('admin.knowledge.seedPublish')}</Text>
                </Pressable>
                <Pressable onPress={publish} style={{ paddingHorizontal: 16, paddingVertical: 11, borderRadius: R.input, backgroundColor: C.accent }}>
                  <Text style={{ color: '#fff', fontWeight: '600' }}>{t('admin.knowledge.publish')}</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 11, marginTop: 2 }}>{t('admin.knowledge.publishHint')}</Text>
                </Pressable>
              </View>
            </View>
          ) : null}

          {tab === 'sources' ? (
            <View>
              <InfoBox title={t('admin.knowledge.sourcesIntroTitle')} body={t('admin.knowledge.sourcesIntroBody')} />
              <SectionHeader
                title={t('admin.knowledge.sourcesListTitle')}
                actionLabel={t('admin.knowledge.addSource')}
                onAction={() => setEditSource({ ...EMPTY_SOURCE })}
              />
              {editSource ? (
                <Card style={{ borderColor: C.accent, marginBottom: 16 }}>
                  <Text style={{ fontWeight: '700', color: C.text, marginBottom: 12 }}>
                    {editSource.id && sources.some((s) => s.id === editSource.id)
                      ? t('admin.knowledge.editSource')
                      : t('admin.knowledge.newSource')}
                  </Text>
                  <Field label={t('admin.knowledge.fields.sourceId')} hint={t('admin.knowledge.fields.sourceIdHint')} value={editSource.id} onChangeText={(id) => setEditSource((s) => ({ ...s, id }))} placeholder="sethi_csp" />
                  <Text style={{ fontSize: 13, fontWeight: '600', color: C.text, marginBottom: 6 }}>{t('admin.knowledge.fields.sourceType')}</Text>
                  <TypePills options={SOURCE_TYPES} value={editSource.type} onChange={(type) => setEditSource((s) => ({ ...s, type }))} labelKeyPrefix="admin.knowledge.sourceTypes" t={t} />
                  <Field label={t('admin.knowledge.fields.title')} value={editSource.title} onChangeText={(title) => setEditSource((s) => ({ ...s, title }))} />
                  <Field label={t('admin.knowledge.fields.docPath')} hint={t('admin.knowledge.fields.docPathHint')} value={editSource.doc_path || ''} onChangeText={(doc_path) => setEditSource((s) => ({ ...s, doc_path }))} placeholder="docs/knowledge-sethi-csp.md" />
                  {editSource.type === 'country' ? (
                    <Field label={t('admin.knowledge.fields.countryCode')} value={editSource.country_code || ''} onChangeText={(country_code) => setEditSource((s) => ({ ...s, country_code }))} placeholder="CZ" />
                  ) : null}
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                    <Pressable onPress={saveSource} style={{ paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8, backgroundColor: C.accent }}>
                      <Text style={{ color: '#fff', fontWeight: '600' }}>{t('common.save')}</Text>
                    </Pressable>
                    <Pressable onPress={() => setEditSource(null)} style={{ paddingHorizontal: 14, paddingVertical: 10 }}>
                      <Text style={{ color: C.textMuted }}>{t('common.cancel')}</Text>
                    </Pressable>
                  </View>
                </Card>
              ) : null}
              {sources.length === 0 ? (
                <Text style={{ color: C.textMuted }}>{t('admin.knowledge.sourcesEmpty')}</Text>
              ) : (
                sources.map((source) => (
                  <Card key={source.id}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <View style={{ flex: 1, paddingRight: 8 }}>
                        <Text style={{ color: C.text, fontWeight: '700', fontSize: 15 }}>{source.title}</Text>
                        <Text style={{ color: C.textMuted, fontSize: 12, marginTop: 4 }}>
                          {t('admin.knowledge.sourceMeta', {
                            id: source.id,
                            type: t(`admin.knowledge.sourceTypes.${source.type}`),
                          })}
                        </Text>
                        {source.doc_path ? (
                          <Text style={{ color: C.textMuted, fontSize: 12, marginTop: 4 }}>{source.doc_path}</Text>
                        ) : null}
                        {source.country_code ? (
                          <Text style={{ color: C.textMuted, fontSize: 12, marginTop: 2 }}>
                            {t('admin.knowledge.countryPack', { code: source.country_code })}
                          </Text>
                        ) : null}
                      </View>
                      <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: R.pill, backgroundColor: source.is_active ? C.heroIncomeBg : C.dangerBg }}>
                        <Text style={{ fontSize: 10, fontWeight: '700', color: source.is_active ? C.heroIncomeBadge : C.danger }}>
                          {source.is_active ? t('admin.knowledge.active') : t('admin.knowledge.inactive')}
                        </Text>
                      </View>
                    </View>
                    <ActionRow
                      editLabel={t('common.edit')}
                      deleteLabel={t('common.delete')}
                      onEdit={() => setEditSource({ ...source, doc_path: source.doc_path || '', country_code: source.country_code || '' })}
                      onDelete={() => setDeleteTarget({ kind: 'source', id: source.id, label: source.title })}
                    />
                  </Card>
                ))
              )}
            </View>
          ) : null}

          {tab === 'chunks' ? (
            <View>
              <InfoBox title={t('admin.knowledge.chunksIntroTitle')} body={t('admin.knowledge.chunksIntroBody')} />
              {editChunk ? (
                <Card style={{ borderColor: C.accent, marginBottom: 16 }}>
                  <Text style={{ fontWeight: '700', color: C.text, marginBottom: 8 }}>{editChunk.id}</Text>
                  <Text style={{ fontSize: 12, color: C.textMuted, marginBottom: 8 }}>{t('admin.knowledge.chunkEditHint')}</Text>
                  <Field label={t('admin.knowledge.fields.excerpt')} value={editChunk.excerpt} onChangeText={(excerpt) => setEditChunk((c) => ({ ...c, excerpt }))} multiline />
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <Pressable onPress={saveChunk} style={{ paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8, backgroundColor: C.accent }}>
                      <Text style={{ color: '#fff', fontWeight: '600' }}>{t('common.save')}</Text>
                    </Pressable>
                    <Pressable onPress={() => setEditChunk(null)} style={{ paddingHorizontal: 14, paddingVertical: 10 }}>
                      <Text style={{ color: C.textMuted }}>{t('common.cancel')}</Text>
                    </Pressable>
                  </View>
                </Card>
              ) : null}
              {chunks.length === 0 ? (
                <Text style={{ color: C.textMuted }}>{t('admin.knowledge.chunksEmpty')}</Text>
              ) : (
                chunks.map((chunk) => (
                  <Card key={chunk.id}>
                    <Text style={{ color: C.text, fontWeight: '700' }}>{chunk.id}</Text>
                    <Text style={{ color: chunk.is_published ? C.accent : C.textMuted, fontSize: 12, marginTop: 4 }}>
                      {chunk.is_published ? t('admin.knowledge.published') : t('admin.knowledge.draft')}
                      {' · '}
                      {t('admin.knowledge.chunkSourceRef', { source: chunk.source_id })}
                    </Text>
                    <Text style={{ color: C.textMuted, marginTop: 6, lineHeight: 20 }} numberOfLines={3}>{chunk.excerpt}</Text>
                    <ActionRow
                      editLabel={t('common.edit')}
                      deleteLabel={t('common.delete')}
                      onEdit={() => setEditChunk(chunk)}
                      onDelete={() => setDeleteTarget({ kind: 'chunk', id: chunk.id, label: chunk.id })}
                    />
                  </Card>
                ))
              )}
            </View>
          ) : null}

          {tab === 'routes' ? (
            <View>
              <RouteSubTabBar active={routeSubTab} onChange={handleRouteSubTabChange} t={t} />
              <InfoBox
                title={t(`admin.knowledge.routeTabIntro.${routeSubTab}.title`)}
                body={t(`admin.knowledge.routeTabIntro.${routeSubTab}.body`)}
                steps={routeIntroSteps}
              />
              <SectionHeader
                title={t(`admin.knowledge.routeTypes.${routeSubTab}`)}
                actionLabel={t('admin.knowledge.addRoute')}
                onAction={openNewRoute}
              />
              {editRoute && (editRoute.route_type === routeSubTab || !editRoute.id) ? (
                <RouteEditForm
                  editRoute={{ ...editRoute, route_type: editRoute.route_type || routeSubTab }}
                  routeSubTab={routeSubTab}
                  t={t}
                  onChange={setEditRoute}
                  onSave={saveRoute}
                  onCancel={() => setEditRoute(null)}
                />
              ) : null}
              {activeRoutes.length === 0 ? (
                <Text style={{ color: C.textMuted, lineHeight: 20 }}>
                  {t(`admin.knowledge.routeTabIntro.${routeSubTab}.empty`)}
                </Text>
              ) : (
                activeRoutes.map((route) => (
                  <Card key={route.id}>
                    <Text style={{ color: C.text, fontWeight: '600' }}>{renderRouteSummary(route)}</Text>
                    <Text style={{ color: C.textMuted, fontSize: 12, marginTop: 6, lineHeight: 18 }}>
                      {t('admin.knowledge.routeChunksLabel')}: {(route.chunk_ids || []).join(', ')}
                    </Text>
                    <Text style={{ color: C.textMuted, fontSize: 11, marginTop: 4 }}>
                      {t('admin.knowledge.routeCountry', { code: route.country_code || 'CZ' })}
                    </Text>
                    <ActionRow
                      editLabel={t('common.edit')}
                      deleteLabel={t('common.delete')}
                      onEdit={() => setEditRoute({ ...route, keywords: route.keywords || [], chunk_ids: route.chunk_ids || [] })}
                      onDelete={() => setDeleteTarget({ kind: 'route', id: route.id, label: renderRouteSummary(route) })}
                    />
                  </Card>
                ))
              )}
            </View>
          ) : null}
        </>
      )}

      <ConfirmDialog
        visible={Boolean(deleteTarget)}
        title={t('admin.knowledge.deleteConfirmTitle')}
        message={t('admin.knowledge.deleteConfirmMessage', { name: deleteTarget?.label || '' })}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        destructive
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </ScrollView>
  );
}
