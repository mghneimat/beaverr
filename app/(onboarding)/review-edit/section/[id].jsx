import { useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useI18n } from '../../../../lib/i18n';
import { SectionEditProvider } from '../../../../lib/SectionEditContext';
import { SectionEditFocusProvider } from '../../../../lib/SectionEditFocusContext';
import { SECTION_EDIT_SCREENS, SECTION_TITLE_KEYS } from '../../../../lib/sectionEditRegistry';
import SectionEditShell from '../../../../components/app/SectionEditShell';

const DEFAULT_RETURN = '/(onboarding)/review';

function paramString(value) {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default function ReviewEditSectionScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { t } = useI18n();

  const sectionId = paramString(params.id);
  const focusKey = paramString(params.focus) || null;
  const focusLabel = paramString(params.focusLabel) || null;
  const returnTo = paramString(params.returnTo) || DEFAULT_RETURN;
  const Screen = sectionId ? SECTION_EDIT_SCREENS[sectionId] : null;
  const titleKey = sectionId ? SECTION_TITLE_KEYS[sectionId] : null;

  const handleClose = () => {
    if (router.canGoBack?.()) router.back();
    else router.replace(returnTo);
  };

  useEffect(() => {
    if (!Screen || !titleKey) {
      handleClose();
    }
  }, [Screen, titleKey]);

  if (!Screen || !titleKey) return null;

  const shellTitle = focusLabel || t(titleKey);

  return (
    <SectionEditFocusProvider focusKey={focusKey} focusLabel={focusLabel}>
      <SectionEditProvider onClose={handleClose} onSaved={handleClose}>
        <SectionEditShell
          title={shellTitle}
          onClose={handleClose}
          closeA11y={t('sectionEdit.closeA11y')}
        >
          <Screen />
        </SectionEditShell>
      </SectionEditProvider>
    </SectionEditFocusProvider>
  );
}
