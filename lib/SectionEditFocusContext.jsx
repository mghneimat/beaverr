import { createContext, useContext } from 'react';

const SectionEditFocusContext = createContext(null);

export function SectionEditFocusProvider({ focusKey, focusLabel, children }) {
  return (
    <SectionEditFocusContext.Provider value={{ focusKey: focusKey || null, focusLabel: focusLabel || null }}>
      {children}
    </SectionEditFocusContext.Provider>
  );
}

export function useSectionEditFocus() {
  const ctx = useContext(SectionEditFocusContext);
  return ctx || { focusKey: null, focusLabel: null };
}

export function useSectionEditFocusOptional() {
  return useContext(SectionEditFocusContext);
}
