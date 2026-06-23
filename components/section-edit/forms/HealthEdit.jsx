import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useI18n } from '../../../lib/i18n';
import { getData } from '../../../lib/storage';
import { SECTION_STORAGE_KEYS } from '../../../lib/sectionEditStorage';
import { useSectionEditFocus } from '../../../lib/SectionEditFocusContext';
import { C, T } from '../../../constants/onboarding-theme';
import SectionEditForm from '../SectionEditForm';
import FocusGate from '../FocusGate';
import HealthMemberFields from '../health/HealthMemberFields';

function toDraft(saved, members) {
  const s = saved || {};
  const rows = members.map((m) => {
    const md = s[m.id] || {};
    return {
      memberId: m.id,
      label: m.label,
      data: { ...md },
    };
  });
  return { _original: saved, members: rows };
}

function toPayload(draft) {
  const orig = draft._original || {};
  const next = { ...orig };
  (draft.members || []).forEach((m) => {
    next[m.memberId] = {
      ...(orig[m.memberId] || {}),
      ...m.data,
      confirmed: m.data.skipped || m.data.coverage ? true : m.data.confirmed,
    };
  });
  return next;
}

export default function HealthEdit() {
  const { t } = useI18n();
  const { focusKey } = useSectionEditFocus();
  const [memberList, setMemberList] = useState([]);
  const [savingsBalance, setSavingsBalance] = useState(0);

  useEffect(() => {
    (async () => {
      const [h, income] = await Promise.all([
        getData('beaverr_household'),
        getData('beaverr_income'),
      ]);
      const members = [{ id: 'user', label: t('onboarding.health.you') }];
      if (h?.partnerName) {
        members.push({ id: 'partner', label: h.partnerName });
      }
      (h?.children || []).forEach((child, idx) => {
        members.push({
          id: `child_${idx}`,
          label: child.displayName || `${t('onboarding.health.child')} ${idx + 1}`,
        });
      });
      setMemberList(members);
      setSavingsBalance(Number(income?.savingsBalance) || 0);
    })();
  }, [t]);

  if (memberList.length === 0) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Text style={{ ...T.helper }}>{t('sectionEdit.health.loading')}</Text>
      </View>
    );
  }

  return (
    <SectionEditForm
      key={memberList.map((m) => m.id).join(',')}
      storageKey={SECTION_STORAGE_KEYS.health}
      initialData={toDraft(null, memberList)}
      loadTransform={(saved) => toDraft(saved, memberList)}
      transformBeforeSave={toPayload}
      validate={(draft, tr) => {
        const visible = focusKey
          ? (draft.members || []).filter((m) => m.memberId === focusKey)
          : (draft.members || []);
        const active = visible.filter((m) => m.data?.coverage === 'private' && !m.data?.skipped);
        for (const m of active) {
          if (!m.data?.premium) return tr('sectionEdit.health.validation');
        }
        return null;
      }}
    >
      {({ data, setData, currency }) => {
        if (!data?.members?.length) {
          return <Text style={{ ...T.helper }}>{t('sectionEdit.health.loading')}</Text>;
        }

        return (
          <View>
            {!focusKey ? (
              <Text style={{ ...T.helper, color: C.muted, marginBottom: 16 }}>
                {t('sectionEdit.health.helper')}
              </Text>
            ) : null}

            {data.members.map((member, idx) => (
              <FocusGate key={member.memberId} focusKey={member.memberId}>
                <View
                  style={{
                    marginBottom: 16,
                    padding: focusKey ? 0 : 16,
                    borderRadius: 12,
                    borderWidth: focusKey ? 0 : 1,
                    borderColor: C.border,
                    backgroundColor: focusKey ? 'transparent' : C.surface,
                  }}
                >
                  <HealthMemberFields
                    memberId={member.memberId}
                    memberLabel={member.label}
                    data={member.data || {}}
                    onUpdate={(patch) => {
                      const members = [...data.members];
                      members[idx] = {
                        ...members[idx],
                        data: { ...members[idx].data, ...patch },
                      };
                      setData((prev) => ({ ...prev, members }));
                    }}
                    currency={currency}
                    savingsBalance={savingsBalance}
                  />
                </View>
              </FocusGate>
            ))}
          </View>
        );
      }}
    </SectionEditForm>
  );
}
