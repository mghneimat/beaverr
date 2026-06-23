/** Dashboard cost category → edit section id */
export const CATEGORY_SECTION_IDS = {
  income: 'income',
  housing: 'housing',
  transport: 'transport',
  health: 'health',
  children: 'childrenCosts',
  pets: 'pets',
  subscriptions: 'subscriptions',
  other: 'other-costs',
  debts: 'debts',
  budget: 'budget',
};

/** App tab → default section edit id */
export const TAB_SECTION_IDS = {
  income: 'income',
  budget: 'budget',
  goals: 'income',
};

export function sectionEditPath(sectionId) {
  return `/(app)/edit/${sectionId}`;
}

export function resolveCategorySectionId(category) {
  return CATEGORY_SECTION_IDS[category] || 'other-costs';
}

/** In-app modal routes for editing a section from the dashboard */
export const EDIT_SECTION_ROUTES = {
  income: sectionEditPath('income'),
  housing: sectionEditPath('housing'),
  transport: sectionEditPath('transport'),
  health: sectionEditPath('health'),
  children: sectionEditPath('childrenCosts'),
  pets: sectionEditPath('pets'),
  subscriptions: sectionEditPath('subscriptions'),
  other: sectionEditPath('other-costs'),
  debts: sectionEditPath('debts'),
  budget: sectionEditPath('budget'),
};
