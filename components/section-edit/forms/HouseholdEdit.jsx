// components/section-edit/forms/HouseholdEdit.jsx
import { View } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useI18n } from '../../../lib/i18n';
import { SECTION_STORAGE_KEYS } from '../../../lib/sectionEditStorage';
import { C, T } from '../../../constants/onboarding-theme';
import SectionEditForm from '../SectionEditForm';
import FocusGate from '../FocusGate';
import { useSectionEditFocus } from '../../../lib/SectionEditFocusContext';
import OptionCard from '../../onboarding/OptionCard';
import LabeledInput from '../../onboarding/LabeledInput';
import QuantityStepper from '../../onboarding/QuantityStepper';

function toDraft(saved) {
  const h = saved || {};
  const children = h.children || [];
  return {
    type: h.type || '',
    partnerName: h.partnerName || '',
    hasChildren: children.length > 0,
    numChildren: Math.max(children.length, 1),
    children: children.length
      ? children.map((c) => ({
          displayName: c.displayName || '',
          ageGroup: c.ageGroup || '',
        }))
      : [{ displayName: '', ageGroup: '' }],
  };
}

function toPayload(draft) {
  const children = draft.hasChildren
    ? Array.from({ length: draft.numChildren }, (_, i) => ({
        displayName: draft.children[i]?.displayName?.trim() || '',
        ageGroup: draft.children[i]?.ageGroup || '',
      }))
    : [];

  return {
    type: draft.type,
    partnerName: draft.type === 'partner' ? draft.partnerName.trim() : null,
    children,
  };
}

function resizeChildren(current, count) {
  return Array.from({ length: count }, (_, i) => current[i] || { displayName: '', ageGroup: '' });
}

export default function HouseholdEdit() {
  const { t } = useI18n();
  const { focusKey } = useSectionEditFocus();

  return (
    <SectionEditForm
      storageKey={SECTION_STORAGE_KEYS.household}
      initialData={toDraft(null)}
      loadTransform={(saved) => toDraft(saved)}
      transformBeforeSave={toPayload}
      validate={(draft, tr) => {
        if (!draft.type) return tr('onboarding.household.type.validation');
        if (draft.type === 'partner' && !draft.partnerName?.trim()) {
          return tr('onboarding.household.partnerName.validation');
        }
        if (draft.hasChildren) {
          for (let i = 0; i < draft.numChildren; i += 1) {
            if (!draft.children[i]?.ageGroup) {
              return tr('onboarding.household.childDetails.validation');
            }
          }
        }
        return null;
      }}
    >
      {({ data, setData }) => {
        if (!data) return null;
        const update = (patch) => setData((prev) => ({ ...prev, ...patch }));

        return (
          <View>
            {!focusKey ? (
              <Text style={{ ...T.helper, color: C.muted, marginBottom: 16 }}>
                {t('sectionEdit.household.helper')}
              </Text>
            ) : null}

            <FocusGate focusKey="type">
              <Text style={{ ...T.fieldLabel, marginBottom: 10 }}>
                {t('onboarding.household.type.title')}
              </Text>
              <OptionCard
              icon="🧍"
              label={t('onboarding.household.type.solo')}
              selected={data.type === 'solo'}
              onPress={() => update({ type: 'solo', hasChildren: false })}
            />
            <OptionCard
              icon="👫"
              label={t('onboarding.household.type.partner')}
              selected={data.type === 'partner'}
              onPress={() => update({ type: 'partner' })}
            />
            <OptionCard
              icon="👨‍👧"
              label={t('onboarding.household.type.singleParent')}
              selected={data.type === 'single_parent'}
              onPress={() => update({ type: 'single_parent' })}
            />
            </FocusGate>

            <FocusGate focusKey="partner">
            {data.type === 'partner' ? (
              <View style={{ marginTop: 16 }}>
                <LabeledInput
                  label={t('onboarding.household.partnerName.label')}
                  value={data.partnerName}
                  onChangeText={(v) => update({ partnerName: v })}
                  placeholder={t('onboarding.household.partnerName.placeholder')}
                  maxLength={30}
                />
              </View>
            ) : null}
            </FocusGate>

            <FocusGate focusKey="children">
            {data.type && data.type !== 'solo' ? (
              <View style={{ marginTop: 20 }}>
                <Text style={{ ...T.fieldLabel, marginBottom: 10 }}>
                  {t('onboarding.household.children.title')}
                </Text>
                <View style={{ gap: 10 }}>
                  <OptionCard
                    icon="🙅"
                    label={t('common.no')}
                    selected={data.hasChildren === false}
                    onPress={() => update({ hasChildren: false })}
                  />
                  <OptionCard
                    icon="👶"
                    label={t('common.yes')}
                    selected={data.hasChildren === true}
                    onPress={() => update({ hasChildren: true })}
                  />
                </View>
              </View>
            ) : null}

            {data.hasChildren ? (
              <View style={{ marginTop: 20, alignItems: 'center' }}>
                <Text style={{ ...T.fieldLabel, marginBottom: 12, alignSelf: 'stretch' }}>
                  {t('onboarding.household.numChildren.title')}
                </Text>
                <QuantityStepper
                  value={data.numChildren}
                  min={1}
                  max={10}
                  onDecrement={() => {
                    const next = Math.max(1, data.numChildren - 1);
                    update({
                      numChildren: next,
                      children: resizeChildren(data.children, next),
                    });
                  }}
                  onIncrement={() => {
                    const next = Math.min(10, data.numChildren + 1);
                    update({
                      numChildren: next,
                      children: resizeChildren(data.children, next),
                    });
                  }}
                />
              </View>
            ) : null}

            {data.hasChildren
              ? Array.from({ length: data.numChildren }, (_, idx) => {
                  const child = data.children[idx] || { displayName: '', ageGroup: '' };
                  return (
                    <View
                      key={`child-${idx}`}
                      style={{
                        marginTop: 20,
                        paddingTop: 16,
                        borderTopWidth: idx > 0 ? 1 : 0,
                        borderTopColor: C.divider,
                      }}
                    >
                      <Text style={{ fontSize: 15, fontWeight: '600', color: C.primary, marginBottom: 12 }}>
                        {t('onboarding.household.childDetails.title', { n: idx + 1 })}
                      </Text>
                      <LabeledInput
                        label={t('onboarding.household.childDetails.nameLabel')}
                        value={child.displayName}
                        onChangeText={(v) => {
                          const children = resizeChildren(data.children, data.numChildren);
                          children[idx] = { ...children[idx], displayName: v };
                          update({ children });
                        }}
                        placeholder={t('onboarding.household.childDetails.namePlaceholder')}
                        maxLength={30}
                        containerStyle={{ marginBottom: 16 }}
                      />
                      <Text style={{ ...T.fieldLabel, color: C.muted, marginBottom: 10 }}>
                        {t('onboarding.household.childDetails.ageLabel')}
                      </Text>
                      {[
                        { key: '0-2', icon: '👶', label: t('onboarding.household.childDetails.age0') },
                        { key: '3-5', icon: '🧒', label: t('onboarding.household.childDetails.age3') },
                        { key: '6-15', icon: '🎒', label: t('onboarding.household.childDetails.age6') },
                        { key: '16-18', icon: '🧑', label: t('onboarding.household.childDetails.age16') },
                        { key: '18+', icon: '🧑‍🎓', label: t('onboarding.household.childDetails.age18') },
                      ].map((age) => (
                        <OptionCard
                          key={age.key}
                          icon={age.icon}
                          label={age.label}
                          selected={child.ageGroup === age.key}
                          onPress={() => {
                            const children = resizeChildren(data.children, data.numChildren);
                            children[idx] = { ...children[idx], ageGroup: age.key };
                            update({ children });
                          }}
                        />
                      ))}
                    </View>
                  );
                })
              : null}
            </FocusGate>
          </View>
        );
      }}
    </SectionEditForm>
  );
}
