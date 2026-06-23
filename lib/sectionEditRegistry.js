export {
  CATEGORY_SECTION_IDS,
  TAB_SECTION_IDS,
  sectionEditPath,
  resolveCategorySectionId,
  EDIT_SECTION_ROUTES,
} from './sectionEditPaths';

import HouseholdEdit from '../components/section-edit/forms/HouseholdEdit';
import LocationEdit from '../components/section-edit/forms/LocationEdit';
import IncomeEdit from '../components/section-edit/forms/IncomeEdit';
import HousingEdit from '../components/section-edit/forms/HousingEdit';
import TransportEdit from '../components/section-edit/forms/TransportEdit';
import HealthEdit from '../components/section-edit/forms/HealthEdit';
import ChildrenCostsEdit from '../components/section-edit/forms/ChildrenCostsEdit';
import PetsEdit from '../components/section-edit/forms/PetsEdit';
import SubscriptionsEdit from '../components/section-edit/forms/SubscriptionsEdit';
import OtherCostsEdit from '../components/section-edit/forms/OtherCostsEdit';
import DebtsEdit from '../components/section-edit/forms/DebtsEdit';
import BudgetEdit from '../components/section-edit/forms/BudgetEdit';

/** @type {Record<string, React.ComponentType>} */
export const SECTION_EDIT_SCREENS = {
  household: HouseholdEdit,
  location: LocationEdit,
  income: IncomeEdit,
  housing: HousingEdit,
  transport: TransportEdit,
  health: HealthEdit,
  'childrenCosts': ChildrenCostsEdit,
  pets: PetsEdit,
  subscriptions: SubscriptionsEdit,
  'other-costs': OtherCostsEdit,
  debts: DebtsEdit,
  budget: BudgetEdit,
};

export const SECTION_TITLE_KEYS = {
  household: 'sectionEdit.sections.household',
  location: 'sectionEdit.sections.location',
  income: 'sectionEdit.sections.income',
  housing: 'sectionEdit.sections.housing',
  transport: 'sectionEdit.sections.transport',
  health: 'sectionEdit.sections.health',
  'childrenCosts': 'sectionEdit.sections.children',
  pets: 'sectionEdit.sections.pets',
  subscriptions: 'sectionEdit.sections.subscriptions',
  'other-costs': 'sectionEdit.sections.other',
  debts: 'sectionEdit.sections.debts',
  budget: 'sectionEdit.sections.budget',
};

