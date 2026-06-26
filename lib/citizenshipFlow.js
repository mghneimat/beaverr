import { navigateForward } from './onboardingNavigation';
import { getData, setData } from './storage';

/** @typedef {'user'|'partner'|'child'} CitizenshipSubject */

/**
 * @param {string|string[]|undefined} value
 * @returns {string|undefined}
 */
function paramString(value) {
  if (Array.isArray(value)) return value[0];
  return value;
}

/**
 * @param {Record<string, string|string[]|undefined>} [params]
 * @returns {{ subject: CitizenshipSubject, childIndex: number }}
 */
export function parseCitizenshipSubject(params) {
  const subjectRaw = paramString(params?.subject);
  const subject = subjectRaw === 'partner' || subjectRaw === 'child'
    ? subjectRaw
    : 'user';
  const childIndex = subject === 'child'
    ? Math.max(0, parseInt(paramString(params?.childIndex) ?? '0', 10) || 0)
    : 0;
  return { subject, childIndex };
}

/**
 * @param {import('./schema').Household|null|undefined} household
 * @returns {boolean}
 */
export function hasPartner(household) {
  return household?.type === 'partner' && Boolean(household?.partnerName);
}

/**
 * @param {import('./schema').Location|null|undefined} location
 * @param {import('./schema').Household|null|undefined} household
 * @returns {boolean}
 */
export function shouldAskChildrenCitizenship(location, household) {
  const children = household?.children;
  if (!children?.length) return false;
  const userNonCitizen = location?.isCzCitizen === false;
  const partnerNonCitizen = hasPartner(household) && location?.partnerIsCzCitizen === false;
  return userNonCitizen || partnerNonCitizen;
}

/**
 * @param {boolean|null|undefined} isCzCitizen
 * @param {boolean|null|undefined} partnerIsCzCitizen
 * @param {import('./schema').Household|null|undefined} household
 * @returns {boolean}
 */
export function shouldAskChildrenCitizenshipFromDraft(isCzCitizen, partnerIsCzCitizen, household) {
  if (!household?.children?.length) return false;
  if (isCzCitizen === false) return true;
  if (hasPartner(household) && partnerIsCzCitizen === false) return true;
  return false;
}

/**
 * @typedef {{ user: boolean|null, partner: boolean|null, children: (boolean|null)[] }} CitizenshipDraft
 */

/**
 * Adults answered when user has a value and partner is answered or absent.
 * @param {CitizenshipDraft} draft
 * @param {import('./schema').Household|null|undefined} household
 * @returns {boolean}
 */
export function adultsCitizenshipAnswered(draft, household) {
  if (draft.user !== true && draft.user !== false) return false;
  if (hasPartner(household) && draft.partner !== true && draft.partner !== false) return false;
  return true;
}

/**
 * Show child rows once all adults answered and at least one is a non-citizen.
 * @param {CitizenshipDraft} draft
 * @param {import('./schema').Household|null|undefined} household
 * @returns {boolean}
 */
export function shouldRevealChildrenCitizenship(draft, household) {
  if (!household?.children?.length) return false;
  if (!adultsCitizenshipAnswered(draft, household)) return false;
  return shouldAskChildrenCitizenshipFromDraft(draft.user, draft.partner, household);
}

/**
 * Ordered non-citizens who need a residence permit screen.
 * @param {import('./schema').Location|null|undefined} location
 * @param {import('./schema').Household|null|undefined} household
 * @returns {Array<{ subject: CitizenshipSubject, childIndex: number }>}
 */
export function getNonCitizenPermitChain(location, household) {
  const chain = [];
  if (location?.isCzCitizen === false) {
    chain.push({ subject: 'user', childIndex: 0 });
  }
  if (hasPartner(household) && location?.partnerIsCzCitizen === false) {
    chain.push({ subject: 'partner', childIndex: 0 });
  }
  if (shouldAskChildrenCitizenship(location, household)) {
    const count = household?.children?.length ?? 0;
    for (let i = 0; i < count; i += 1) {
      if (location?.childrenCitizenship?.[i]?.isCzCitizen === false) {
        chain.push({ subject: 'child', childIndex: i });
      }
    }
  }
  return chain;
}

/**
 * @param {import('./schema').Location|null|undefined} location
 * @param {CitizenshipSubject} subject
 * @param {number} childIndex
 * @returns {boolean|null}
 */
export function getCitizenshipStatus(location, subject, childIndex = 0) {
  if (subject === 'user') return location?.isCzCitizen ?? null;
  if (subject === 'partner') return location?.partnerIsCzCitizen ?? null;
  return location?.childrenCitizenship?.[childIndex]?.isCzCitizen ?? null;
}

/**
 * @param {import('./schema').Location|null|undefined} location
 * @param {CitizenshipSubject} subject
 * @param {number} childIndex
 * @returns {import('./schema').ResidencePermit|null|undefined}
 */
export function getResidencePermit(location, subject, childIndex = 0) {
  if (subject === 'user') return location?.residencePermit ?? null;
  if (subject === 'partner') return location?.partnerResidencePermit ?? null;
  return location?.childrenCitizenship?.[childIndex]?.residencePermit ?? null;
}

/**
 * First permit expiry date entered by an earlier family member (user → partner → children).
 * Used to pre-fill later members — family permits often share the same end date.
 * @param {import('./schema').Location|null|undefined} location
 * @param {CitizenshipSubject} subject
 * @param {number} [childIndex]
 * @returns {string|null}
 */
export function getFirstFamilyPermitEndDate(location, subject, childIndex = 0) {
  if (!location || subject === 'user') return null;

  const fromPermit = (permit) => {
    const endDate = permit?.endDate?.trim();
    return endDate || null;
  };

  if (subject === 'partner') {
    return fromPermit(location.residencePermit);
  }

  const fromUser = fromPermit(location.residencePermit);
  if (fromUser) return fromUser;

  const fromPartner = fromPermit(location.partnerResidencePermit);
  if (fromPartner) return fromPartner;

  const children = location.childrenCitizenship;
  if (Array.isArray(children)) {
    for (let i = 0; i < childIndex; i += 1) {
      const fromChild = fromPermit(children[i]?.residencePermit);
      if (fromChild) return fromChild;
    }
  }

  return null;
}

/**
 * @param {CitizenshipSubject} subject
 * @param {number} childIndex
 * @returns {string}
 */
export function citizenshipHref() {
  return '/(onboarding)/citizenship';
}

/**
 * @param {CitizenshipSubject} subject
 * @param {number} childIndex
 * @returns {string}
 */
export function residencePermitHref(subject, childIndex = 0) {
  if (subject === 'partner') return '/(onboarding)/residence-permit?subject=partner';
  if (subject === 'child') {
    return `/(onboarding)/residence-permit?subject=child&childIndex=${childIndex}`;
  }
  return '/(onboarding)/residence-permit';
}

/**
 * @param {boolean} isCzCitizen
 * @param {CitizenshipSubject} subject
 * @param {number} childIndex
 * @returns {Promise<import('./schema').Location>}
 */
export async function saveCitizenshipStatus(isCzCitizen, subject, childIndex = 0) {
  const location = (await getData('beaverr_location')) || {};

  if (subject === 'user') {
    const next = {
      ...location,
      isCzCitizen,
      residencePermit: isCzCitizen ? null : (location.residencePermit || null),
    };
    await setData('beaverr_location', next);
    return next;
  }

  if (subject === 'partner') {
    const next = {
      ...location,
      partnerIsCzCitizen: isCzCitizen,
      partnerResidencePermit: isCzCitizen ? null : (location.partnerResidencePermit || null),
    };
    await setData('beaverr_location', next);
    return next;
  }

  const children = [...(location.childrenCitizenship || [])];
  while (children.length <= childIndex) {
    children.push({ isCzCitizen: null, residencePermit: null });
  }
  children[childIndex] = {
    ...children[childIndex],
    isCzCitizen,
    residencePermit: isCzCitizen ? null : (children[childIndex]?.residencePermit || null),
  };
  const next = { ...location, childrenCitizenship: children };
  await setData('beaverr_location', next);
  return next;
}

/**
 * @param {import('./schema').ResidencePermit} permit
 * @param {CitizenshipSubject} subject
 * @param {number} childIndex
 * @returns {Promise<import('./schema').Location>}
 */
export async function saveResidencePermit(permit, subject, childIndex = 0) {
  const location = (await getData('beaverr_location')) || {};

  if (subject === 'user') {
    const next = {
      ...location,
      isCzCitizen: false,
      residencePermit: permit,
    };
    await setData('beaverr_location', next);
    return next;
  }

  if (subject === 'partner') {
    const next = {
      ...location,
      partnerIsCzCitizen: false,
      partnerResidencePermit: permit,
    };
    await setData('beaverr_location', next);
    return next;
  }

  const children = [...(location.childrenCitizenship || [])];
  while (children.length <= childIndex) {
    children.push({ isCzCitizen: null, residencePermit: null });
  }
  children[childIndex] = {
    ...children[childIndex],
    isCzCitizen: false,
    residencePermit: permit,
  };
  const next = { ...location, childrenCitizenship: children };
  await setData('beaverr_location', next);
  return next;
}

/**
 * @param {CitizenshipDraft} draft
 * @param {import('./schema').Household|null|undefined} household
 * @returns {Promise<import('./schema').Location>}
 */
export async function saveAllCitizenshipStatuses(draft, household) {
  const location = (await getData('beaverr_location')) || {};
  const askChildren = shouldAskChildrenCitizenshipFromDraft(draft.user, draft.partner, household);

  const next = {
    ...location,
    isCzCitizen: draft.user,
    residencePermit: draft.user ? null : (location.residencePermit || null),
  };

  if (hasPartner(household)) {
    next.partnerIsCzCitizen = draft.partner;
    next.partnerResidencePermit = draft.partner ? null : (location.partnerResidencePermit || null);
  } else {
    next.partnerIsCzCitizen = null;
    next.partnerResidencePermit = null;
  }

  if (askChildren) {
    const childCount = household?.children?.length ?? 0;
    const children = [...(location.childrenCitizenship || [])];
    for (let i = 0; i < childCount; i += 1) {
      const isCz = draft.children[i];
      while (children.length <= i) {
        children.push({ isCzCitizen: null, residencePermit: null });
      }
      children[i] = {
        ...children[i],
        isCzCitizen: isCz,
        residencePermit: isCz ? null : (children[i]?.residencePermit || null),
      };
    }
    next.childrenCitizenship = children;
  } else {
    next.childrenCitizenship = null;
  }

  await setData('beaverr_location', next);
  return next;
}

/**
 * @param {CitizenshipDraft} draft
 * @param {import('./schema').Household|null|undefined} household
 * @param {(key: string) => string} t
 * @returns {string}
 */
export function validateCitizenshipDraft(draft, household, t) {
  if (draft.user !== true && draft.user !== false) {
    return t('onboarding.citizenship.validationAll');
  }
  if (hasPartner(household) && draft.partner !== true && draft.partner !== false) {
    return t('onboarding.citizenship.validationAll');
  }
  if (shouldRevealChildrenCitizenship(draft, household)) {
    const count = household?.children?.length ?? 0;
    for (let i = 0; i < count; i += 1) {
      if (draft.children[i] !== true && draft.children[i] !== false) {
        return t('onboarding.citizenship.validationAll');
      }
    }
  }
  return '';
}

/**
 * @param {CitizenshipDraft} draft
 * @param {import('./schema').Household|null|undefined} household
 * @param {import('expo-router').Router} router
 * @returns {Promise<void>}
 */
export async function routeAfterAllCitizenshipAnswered(draft, household, router) {
  const location = await saveAllCitizenshipStatuses(draft, household);
  const chain = getNonCitizenPermitChain(location, household);
  if (chain.length > 0) {
    const first = chain[0];
    navigateForward(residencePermitHref(first.subject, first.childIndex));
    return;
  }
  navigateForward('/(onboarding)/occupation');
}

/**
 * @param {CitizenshipSubject} subject
 * @param {number} childIndex
 * @param {import('expo-router').Router} router
 * @returns {Promise<void>}
 */
export async function routeAfterPermitComplete(subject, childIndex, router) {
  const household = await getData('beaverr_household');
  const location = (await getData('beaverr_location')) || {};
  const chain = getNonCitizenPermitChain(location, household);
  const idx = chain.findIndex(
    (item) => item.subject === subject && item.childIndex === childIndex,
  );
  const next = chain[idx + 1];
  if (next) {
    navigateForward(residencePermitHref(next.subject, next.childIndex));
    return;
  }
  navigateForward('/(onboarding)/occupation');
}

/**
 * @param {CitizenshipSubject} subject
 * @param {number} childIndex
 * @param {import('./schema').Location|null|undefined} location
 * @param {import('./schema').Household|null|undefined} household
 * @returns {string}
 */
export function getCitizenshipBackRoute() {
  return '/(onboarding)/splash-residence';
}

/**
 * @param {CitizenshipSubject} subject
 * @param {number} childIndex
 * @param {import('./schema').Location|null|undefined} location
 * @param {import('./schema').Household|null|undefined} household
 * @returns {string}
 */
export function getResidencePermitBackRoute(subject, childIndex, location, household) {
  const chain = getNonCitizenPermitChain(location, household);
  const idx = chain.findIndex(
    (item) => item.subject === subject && item.childIndex === childIndex,
  );
  if (idx <= 0) return citizenshipHref();
  const prev = chain[idx - 1];
  return residencePermitHref(prev.subject, prev.childIndex);
}

/**
 * Route occupation back should land on the last permit screen or consolidated citizenship.
 * @param {import('./schema').Location|null|undefined} location
 * @param {import('./schema').Household|null|undefined} household
 * @returns {string}
 */
export function getOccupationBackRoute(location, household) {
  const chain = getNonCitizenPermitChain(location, household);
  if (chain.length > 0) {
    const last = chain[chain.length - 1];
    return residencePermitHref(last.subject, last.childIndex);
  }
  return citizenshipHref();
}

/**
 * @param {CitizenshipSubject} subject
 * @param {number} childIndex
 * @param {import('./schema').Household|null|undefined} household
 * @param {(key: string, params?: object) => string} t
 * @returns {{ title: string, helper: string }}
 */
export function getCitizenshipCopy(subject, childIndex, household, t) {
  if (subject === 'partner') {
    return {
      title: t('onboarding.citizenship.partnerTitle', { name: household?.partnerName || '' }),
      helper: t('onboarding.citizenship.partnerHelper'),
    };
  }
  if (subject === 'child') {
    const child = household?.children?.[childIndex];
    const name = child?.displayName?.trim();
    return {
      title: name
        ? t('onboarding.citizenship.childTitle', { name })
        : t('onboarding.citizenship.childTitleNumber', { n: childIndex + 1 }),
      helper: t('onboarding.citizenship.childHelper'),
    };
  }
  return {
    title: t('onboarding.citizenship.title'),
    helper: t('onboarding.citizenship.helper'),
  };
}

/**
 * @param {CitizenshipSubject} subject
 * @param {number} childIndex
 * @param {import('./schema').Household|null|undefined} household
 * @param {(key: string, params?: object) => string} t
 * @returns {{ title: string, helper: string }}
 */
export function getResidencePermitCopy(subject, childIndex, household, t) {
  if (subject === 'partner') {
    return {
      title: t('onboarding.residencePermit.partnerTitle', { name: household?.partnerName || '' }),
      helper: t('onboarding.residencePermit.partnerHelper'),
    };
  }
  if (subject === 'child') {
    const child = household?.children?.[childIndex];
    const name = child?.displayName?.trim();
    return {
      title: name
        ? t('onboarding.residencePermit.childTitle', { name })
        : t('onboarding.residencePermit.childTitleNumber', { n: childIndex + 1 }),
      helper: t('onboarding.residencePermit.childHelper'),
    };
  }
  return {
    title: t('onboarding.residencePermit.title'),
    helper: t('onboarding.residencePermit.helper'),
  };
}
