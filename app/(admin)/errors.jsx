import { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Platform } from 'react-native';
import { useI18n } from '../../lib/i18n';
import { invokeAdminApi } from '../../lib/admin/adminApi';
import { MaytechTableFrame, MaytechTableHeaderBand } from '../../components/dashboard/BreakdownTablePrimitives';
import { C, S, T, R } from '../../constants/onboarding-theme';

const ROW_PAD_H = 16;
const COL_GAP = 12;
const COL = {
  severity: 104,
  category: 80,
  time: 196,
  status: 96,
};

function formatErrorTime(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const pad2 = (n) => String(n).padStart(2, '0');
  const dd = pad2(d.getDate());
  const mm = pad2(d.getMonth() + 1);
  const yyyy = d.getFullYear();
  const hh = pad2(d.getHours());
  const mi = pad2(d.getMinutes());
  const ss = pad2(d.getSeconds());
  const ms = String(d.getMilliseconds()).padStart(3, '0');
  return `${dd}-${mm}-${yyyy}:${hh}:${mi}:${ss}.${ms}`;
}

function TableCol({ width, flex, align = 'left', children }) {
  return (
    <View
      style={{
        width: flex ? undefined : width,
        flex: flex ? 1 : undefined,
        flexShrink: flex ? 1 : 0,
        minWidth: flex ? 0 : width,
        alignItems: align === 'right' ? 'flex-end' : align === 'center' ? 'center' : 'flex-start',
        justifyContent: 'center',
      }}
    >
      {children}
    </View>
  );
}

function TableRow({ children, style }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: COL_GAP,
        paddingHorizontal: ROW_PAD_H,
        width: '100%',
        ...style,
      }}
    >
      {children}
    </View>
  );
}

function SeverityBadge({ severity, label }) {
  const isBlocker = severity === 'blocker';
  return (
    <View
      style={{
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: R.pill,
        backgroundColor: isBlocker ? '#FEE2E2' : C.accentSoft,
      }}
    >
      <Text
        style={{
          fontSize: 11,
          fontWeight: '600',
          color: isBlocker ? C.danger : C.accent,
          textTransform: 'capitalize',
        }}
      >
        {label}
      </Text>
    </View>
  );
}

function StatusBadge({ resolved, openLabel, resolvedLabel }) {
  return (
    <View
      style={{
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: R.pill,
        backgroundColor: resolved ? C.positiveBg || 'rgba(58,140,110,0.1)' : C.surface,
        borderWidth: 1,
        borderColor: resolved ? (C.positiveBorder || 'rgba(58,140,110,0.25)') : C.border,
      }}
    >
      <Text
        style={{
          fontSize: 11,
          fontWeight: '500',
          color: resolved ? (C.positive || '#3A8C6E') : C.textMuted,
        }}
      >
        {resolved ? resolvedLabel : openLabel}
      </Text>
    </View>
  );
}

function FilterChip({ label, selected, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ hovered, pressed }) => ({
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: R.pill,
        borderWidth: 1,
        borderColor: selected ? C.accent : C.border,
        backgroundColor: selected ? C.accent : pressed || hovered ? C.tableRowHover : C.surface,
      })}
    >
      <Text style={{ fontSize: 13, fontWeight: selected ? '600' : '500', color: selected ? '#fff' : C.textMuted }}>
        {label}
      </Text>
    </Pressable>
  );
}

function FilterGroup({ label, children }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
      <Text style={{ fontSize: 12, fontWeight: '600', color: C.muted, marginRight: 4 }}>{label}</Text>
      {children}
    </View>
  );
}

const headerLabelStyle = {
  fontSize: 11,
  fontWeight: '600',
  color: C.muted,
  textTransform: 'uppercase',
  letterSpacing: 0.4,
};

function ErrorLogHeader() {
  const { t } = useI18n();
  return (
    <MaytechTableHeaderBand style={{ paddingHorizontal: 0, paddingVertical: 10 }}>
      <TableRow>
        <TableCol width={COL.severity} align="center">
          <Text style={[headerLabelStyle, { textAlign: 'center', width: '100%' }]}>{t('admin.errors.columns.severity')}</Text>
        </TableCol>
        <TableCol width={COL.category} align="center">
          <Text style={[headerLabelStyle, { textAlign: 'center', width: '100%' }]}>{t('admin.errors.columns.category')}</Text>
        </TableCol>
        <TableCol flex align="left">
          <Text style={[headerLabelStyle, { textAlign: 'left', width: '100%' }]}>{t('admin.errors.columns.message')}</Text>
        </TableCol>
        <TableCol width={COL.time} align="center">
          <Text style={[headerLabelStyle, { textAlign: 'center', width: '100%' }]}>{t('admin.errors.columns.time')}</Text>
        </TableCol>
        <TableCol width={COL.status} align="center">
          <Text style={[headerLabelStyle, { textAlign: 'center', width: '100%' }]}>{t('admin.errors.columns.status')}</Text>
        </TableCol>
      </TableRow>
    </MaytechTableHeaderBand>
  );
}

export default function AdminErrorsScreen() {
  const { t } = useI18n();
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scopeFilter, setScopeFilter] = useState('core');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const payload = { limit: 100 };
    if (scopeFilter === 'core') payload.blockersOnly = true;
    if (statusFilter === 'open') payload.resolved = false;
    if (statusFilter === 'resolved') payload.resolved = true;

    const result = await invokeAdminApi('errors.list', payload);
    if (result.ok) setErrors(result.data?.errors ?? []);
    setLoading(false);
  }, [scopeFilter, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleRow = (row) => {
    setSelected((prev) => (prev?.id === row.id ? null : row));
  };

  const closeDetail = () => setSelected(null);

  const resolve = async (errorId) => {
    await invokeAdminApi('errors.resolve', { errorId });
    setSelected(null);
    load();
  };

  return (
    <View style={{ flex: 1, flexDirection: 'row' }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: S.pagePadH, paddingVertical: S.pagePadV, flexGrow: 1 }}
      >
        <Text style={{ ...T.pageTitle, color: C.text, marginBottom: 12 }}>{t('admin.errors.title')}</Text>

        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 16,
            marginBottom: 16,
            paddingBottom: 16,
            borderBottomWidth: 1,
            borderBottomColor: C.border,
          }}
        >
          <FilterGroup label={t('admin.errors.filters.scope')}>
            <FilterChip
              label={t('admin.errors.filters.scopeCore')}
              selected={scopeFilter === 'core'}
              onPress={() => setScopeFilter('core')}
            />
            <FilterChip
              label={t('admin.errors.filters.scopeAll')}
              selected={scopeFilter === 'all'}
              onPress={() => setScopeFilter('all')}
            />
          </FilterGroup>
          <FilterGroup label={t('admin.errors.filters.status')}>
            <FilterChip
              label={t('admin.errors.filters.statusAll')}
              selected={statusFilter === 'all'}
              onPress={() => setStatusFilter('all')}
            />
            <FilterChip
              label={t('admin.errors.filters.statusOpen')}
              selected={statusFilter === 'open'}
              onPress={() => setStatusFilter('open')}
            />
            <FilterChip
              label={t('admin.errors.filters.statusResolved')}
              selected={statusFilter === 'resolved'}
              onPress={() => setStatusFilter('resolved')}
            />
          </FilterGroup>
        </View>

        {loading ? (
          <ActivityIndicator color={C.accent} />
        ) : errors.length === 0 ? (
          <Text style={{ color: C.textMuted }}>{t('admin.errors.empty')}</Text>
        ) : (
          <MaytechTableFrame>
            <ErrorLogHeader />

            {errors.map((row, index) => {
              const isSelected = selected?.id === row.id;
              const isLast = index === errors.length - 1;
              return (
                <Pressable
                  key={row.id}
                  onPress={() => toggleRow(row)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  style={({ hovered, pressed }) => ({
                    borderBottomWidth: isLast ? 0 : 1,
                    borderBottomColor: C.tableRowBorder,
                    backgroundColor: isSelected
                      ? C.accentSoft
                      : pressed
                        ? C.tableRowHover
                        : hovered
                          ? C.tableRowHover
                          : C.surface,
                  })}
                >
                  <TableRow style={{ paddingVertical: 11 }}>
                    <TableCol width={COL.severity} align="center">
                      <SeverityBadge severity={row.severity} label={row.severity} />
                    </TableCol>
                    <TableCol width={COL.category} align="center">
                      <Text style={{ fontSize: 13, color: C.textMuted, textAlign: 'center', width: '100%' }} numberOfLines={1}>
                        {row.category}
                      </Text>
                    </TableCol>
                    <TableCol flex align="left">
                      <Text style={{ fontSize: 13, color: C.text, fontWeight: '500', width: '100%' }} numberOfLines={1}>
                        {row.message}
                      </Text>
                    </TableCol>
                    <TableCol width={COL.time} align="center">
                      <Text
                        style={{
                          fontSize: 12,
                          color: C.textMuted,
                          fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
                          textAlign: 'center',
                          width: '100%',
                        }}
                        numberOfLines={1}
                      >
                        {formatErrorTime(row.created_at)}
                      </Text>
                    </TableCol>
                    <TableCol width={COL.status} align="center">
                      <StatusBadge
                        resolved={row.resolved}
                        openLabel={t('admin.errors.status.open')}
                        resolvedLabel={t('admin.errors.resolved')}
                      />
                    </TableCol>
                  </TableRow>
                </Pressable>
              );
            })}
          </MaytechTableFrame>
        )}
      </ScrollView>

      {selected ? (
        <View
          style={{
            width: 380,
            maxWidth: '42%',
            borderLeftWidth: 1,
            borderLeftColor: C.border,
            backgroundColor: C.surface,
            flexDirection: 'column',
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 16,
              paddingVertical: 14,
              borderBottomWidth: 1,
              borderBottomColor: C.border,
            }}
          >
            <Text style={{ ...T.sectionTitle, color: C.text, flex: 1, marginRight: 8 }}>
              {t('admin.errors.detail')}
            </Text>
            <Pressable
              onPress={closeDetail}
              accessibilityRole="button"
              accessibilityLabel={t('admin.errors.closeDetailA11y')}
              hitSlop={8}
              style={({ hovered, pressed }) => ({
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: R.input,
                borderWidth: 1,
                borderColor: C.border,
                backgroundColor: pressed || hovered ? C.bg : C.surface,
              })}
            >
              <Text style={{ fontSize: 13, color: C.textMuted }}>{t('common.close')}</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={{ padding: 16 }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
              <SeverityBadge severity={selected.severity} label={selected.severity} />
              <Text style={{ fontSize: 12, color: C.textMuted, alignSelf: 'center' }}>
                {selected.category}
              </Text>
              <StatusBadge
                resolved={selected.resolved}
                openLabel={t('admin.errors.status.open')}
                resolvedLabel={t('admin.errors.resolved')}
              />
            </View>

            <Text
              style={{
                fontSize: 12,
                color: C.textMuted,
                marginBottom: 12,
                fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
              }}
            >
              {formatErrorTime(selected.created_at)}
            </Text>

            <Text style={{ color: C.text, marginBottom: 12, lineHeight: 20 }}>{selected.message}</Text>

            {selected.stack ? (
              <View
                style={{
                  padding: 12,
                  borderRadius: R.input,
                  backgroundColor: C.bg,
                  borderWidth: 1,
                  borderColor: C.border,
                  marginBottom: 12,
                }}
              >
                <Text
                  style={{
                    color: C.textMuted,
                    fontSize: 11,
                    lineHeight: 16,
                    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
                  }}
                >
                  {selected.stack}
                </Text>
              </View>
            ) : null}

            {selected.context ? (
              <View
                style={{
                  padding: 12,
                  borderRadius: R.input,
                  backgroundColor: C.bg,
                  borderWidth: 1,
                  borderColor: C.border,
                }}
              >
                <Text
                  style={{
                    color: C.textMuted,
                    fontSize: 11,
                    lineHeight: 16,
                    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
                  }}
                >
                  {JSON.stringify(selected.context, null, 2)}
                </Text>
              </View>
            ) : null}

            {!selected.resolved ? (
              <Pressable
                onPress={() => resolve(selected.id)}
                style={{
                  marginTop: 16,
                  paddingVertical: 10,
                  borderRadius: 8,
                  backgroundColor: C.accent,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#fff', fontWeight: '600' }}>{t('admin.errors.markResolved')}</Text>
              </Pressable>
            ) : null}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}
