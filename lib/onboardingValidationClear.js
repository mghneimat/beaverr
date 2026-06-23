import { createContext, useContext } from 'react';

/** Clears QuestionScreen-level validation when the user edits a field or makes a selection. */
export const OnboardingValidationClearContext = createContext(null);

export function useClearOnboardingValidation() {
  return useContext(OnboardingValidationClearContext);
}
