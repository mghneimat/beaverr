# PocketOS Pre-Alpha Review

> **Review Date:** 2026-06-12  
> **Reviewed Files:** `onboarding-extraction.md`, `beaverr-project-plan.md`  
> **Reviewer:** AI Code Assistant

---

## Executive Summary

| Aspect | Rating | Summary |
|--------|--------|---------|
| **Expense Coverage** | 7.5/10 | Good foundation, missing expat-specific and CZ financial products |
| **Question Quality** | 8/10 | Well-structured, needs minor CZ-specific enhancements |
| **Architecture** | 8/10 | Solid, appropriate for Phase 1, consider XState for Phase 2 |
| **Overall Readiness** | 7.5/10 | Ready to build Phase 1, but incorporate missing expenses before launch |

---

## 1. Expense Coverage Analysis for Czech Republic Expats/Locals

### ✅ What You've Captured Well

Your expense coverage is **quite comprehensive** for the Czech market:

| Category | Items Covered | CZ-Specific Details |
|----------|---------------|---------------------|
| **Housing** | Rent, mortgage, utilities, internet | ✓ |
| **Government Taxes** | Waste tax (1,080 Kč/yr), TV licence (1,620 Kč/yr), Radio licence (540 Kč/yr) | ✓ Pre-filled |
| **Transport** | Fuel, car insurance (povinné ručení), zone parking, STK, public transport | ✓ Prague zone parking noted |
| **Health Insurance** | Employer-covered vs private, OSVČ handling | ✓ |
| **Pets** | Dog tax (1,500 Kč/yr Prague rate) | ✓ Pre-filled |
| **Self-employed** | OSVČ social/health contributions | ✓ Mentioned |
| **Debts** | Credit cards, loans, BNPL, car leasing | ✓ |

### ⚠️ Missing or Incomplete Expenses

Here are expenses commonly faced by expats/locals in CZ that are **missing or underrepresented**:

#### Expat-Specific Costs
- **Visa/Residence permit renewal fees** (2,500-5,000 Kč annually for many)
- **Translation and notarization costs** (ongoing for documents)
- **Foreign currency transfers** to home country (remittances)
- **Home country tax obligations** (US citizens especially)

#### Czech Financial Products
- **Stavební spoření** (building savings) - very popular, ~500-1,700 Kč/month
- **Doplňkové penzijní spoření** (supplementary pension) - employer often matches
- These are distinct from general "savings" and have tax benefits

#### Housing Gaps
- **SVJ/BD contributions** (condo association fees) - separate from rent/mortgage
- **Daň z nemovitosti** (property tax) - annual, often forgotten
- **Building insurance vs contents insurance** - you mention "home insurance" but these are separate in CZ

#### Healthcare Gaps
- **Dental care** - largely out-of-pocket in CZ
- **Vision/glasses** - not covered by public insurance
- **Private specialist visits** - common to skip queues
- **Pharmacy co-pays** - regular expense

#### Children CZ-Specific
- **Školní jídelna** (school lunch) - ~800-1,200 Kč/month
- **Družina** (after-school care) - ~300-500 Kč/month
- **Tábory** (summer camps) - significant seasonal expense
- **ISIC/student cards** - annual fees

#### Employment-Related
- **Meal voucher top-ups** (if employer provides partial)
- **Professional development** (courses, certifications)

#### Missing Subscriptions (CZ-specific)
- Voyo, SledovaniTV, O2 TV
- Alza Premium, Rohlík Premium, Košík

---

## 2. Question Correctness & Follow-up Needs

### ✅ Questions That Are Well-Structured

Most questions follow good UX patterns with clear titles, helpers, and validation. The branching logic is sound.

### ⚠️ Questions Needing Improvement or Follow-ups

| Question | Issue | Recommended Fix |
|----------|-------|-----------------|
| **Q5 (Income)** | Doesn't capture **gross vs net** confusion - expats often confuse these | Add helper: "Net = what lands in your account after tax (čistá mzda)" |
| **Q5c (Savings)** | Doesn't distinguish between **emergency fund** vs **goal-based savings** vs **stavební spoření** | Split into: Emergency buffer, Goal savings, Regulated savings products |
| **Q6b (Utilities)** | "Combined" is vague - CZ often has **zálohy** (advances) vs actual consumption | Add: "Monthly advance payment (záloha)" with note about annual reconciliation |
| **Q6g (Govt taxes)** | Missing **property tax** for homeowners | Add: Daň z nemovitosti (property tax) for "Own" branch |
| **Q7b (Car insurance)** | Only mentions **povinné ručení** | Add: Havarijní pojištění (comprehensive/collision) as optional |
| **Q8 (Health)** | Doesn't capture **which insurance company** | Add: VZP, ČPZP, OZP, etc. - useful for alerts about provider-specific benefits |
| **Q8** | Missing **dental/vision** as separate costs | Add follow-up: "Do you pay for dental or vision care separately?" |
| **Q11 (Subscriptions)** | Missing common CZ services | Add: Voyo, SledovaniTV, O2 TV, Alza Premium, Rohlík Premium, Košík |
| **Q12 (Other costs)** | Missing key CZ items | Add: Stavební spoření, Penzijní spoření, Dental care, Glasses/contacts |

### 🔄 Suggested Follow-up Questions

1. **After Q3 (Location):**
   - "Are you an expat/foreigner?" → Unlocks visa renewal reminders, foreign transfer tracking

2. **After Q5 (Income):**
   - "Do you receive any employer benefits?" → Meal vouchers, Multisport card, company car (benefit-in-kind)

3. **After Q6 (Housing - Own):**
   - "Do you pay SVJ/BD contributions separately?" → Common in Czech apartments

4. **After Q8 (Health):**
   - "Do you have any supplementary health products?" → Dental insurance, travel insurance, critical illness

5. **After Q13 (Debts):**
   - "Do you have any guarantor obligations (ručení)?" → Common in CZ, affects creditworthiness

---

## 3. Project Architecture Evaluation

### Current Architecture Overview

```
pocket-os/
├── app/                          # Expo Router (file = route)
│   ├── (onboarding)/             # 28 screens
│   └── (app)/                    # Dashboard tabs
├── components/
│   ├── onboarding/               # QuestionScreen wrapper pattern
│   ├── dashboard/                # ~60 components
│   └── ui/                       # Shared primitives
├── lib/                          # Business logic (no UI)
│   ├── storage.js                # localStorage abstraction
│   ├── finance.js                # Calculations
│   └── i18n.js                   # Localization
└── constants/                    # Design tokens
```

### Architecture Assessment

| Aspect | Score | Analysis |
|--------|-------|----------|
| **Separation of Concerns** | 8/10 | Good layering: screens → components → lib. Could be cleaner with a dedicated `hooks/` folder |
| **Scalability** | 7/10 | 28 onboarding screens as separate files is manageable but could become unwieldy |
| **Maintainability** | 7/10 | ~200 line limit is good. Component reuse via `QuestionScreen` wrapper is smart |
| **Testability** | 8/10 | Clear `__tests__/` structure mirroring source. JSDoc types help |
| **Phase Migration** | 9/10 | Storage abstraction layer makes localStorage→Supabase transition clean |

### 🔄 Alternative Architectures Considered

#### Option A: State Machine for Onboarding (XState)

**Benefits:**
- All branching logic in one place (not scattered across 28 files)
- Easier to test all paths
- Visual debugging with XState inspector
- Persistence of state machine context = resume anywhere

**Cost:** Learning curve, additional dependency

**Verdict:** Worth considering for Phase 2, but **not worth switching now** in Phase 1.

#### Option B: Form-Centric Architecture (React Hook Form + Zod)

**Benefits:**
- Centralized validation schemas
- Better form state management
- Automatic error handling

**Verdict:** **Consider for Phase 2** when adding Supabase.

#### Option C: Feature-Based Structure

**Verdict:** **Not recommended** - current structure aligns with Expo Router patterns.

### 📊 Architecture Recommendation

**Stay with current architecture for Phase 1.** Main enhancements suggested:

1. **Add a `hooks/` folder** for custom hooks (e.g., `useOnboardingProgress`, `useBudgetCalculation`)
2. **Consider XState for Phase 2** to manage complex onboarding state
3. **Add a `services/` layer** when integrating Supabase (Phase 2)

---

## 4. Additional Remarks & Recommendations

### 🎯 Critical Observations

#### A. Data Model Concerns

Current `beaverr_costs` schema stores all costs in one flat array. Recommended restructure:

```javascript
// Current: flat array
beaverr_costs → [{ id, amount, frequency, category, ... }]

// Recommended: categorized structure
beaverr_costs → {
  housing: { rent: {...}, utilities: {...} },
  transport: { fuel: {...}, insurance: {...} },
  // ...
}
```

**Why?** Easier to:
- Edit specific sections without array manipulation
- Validate category-specific rules
- Generate category reports

#### B. Currency Handling Gap

Data model stores raw numbers. Add to `lib/finance.js`:

```javascript
const formatCurrency = (amount, currency = 'CZK') => {
  return new Intl.NumberFormat('cs-CZ', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0
  }).format(amount);
};
```

#### C. Frequency Normalization

Recommend explicit enum:

```javascript
// lib/schema.js
const FREQUENCIES = ['daily', 'weekly', 'fortnightly', 'monthly', 'quarterly', 'annually'];
```

### 🔐 Security & Privacy

1. **GDPR Compliance:** Consider adding:
   - Right to data export (JSON download)
   - Right to deletion (clear all data)

2. **Sensitive Data:** localStorage is unencrypted. For Phase 1 acceptable, but plan for Phase 2:
   - Consider encrypting localStorage with user-derived key
   - Or move to Supabase sooner for RLS protection

### 📱 UX Recommendations

1. **Onboarding Length:** 28 screens is substantial. Consider:
   - "Quick setup" (essential only: income, rent, 2-3 big costs) → ~8 screens
   - "Full setup" (current flow)

2. **Progress Persistence:** Ensure:
   - Auto-save after every question (not just on "Continue")
   - Clear indication of what's saved vs unsaved

3. **Smart Defaults:** Consider:
   - Income: Show average Czech salary as placeholder (45,000 Kč net)
   - Rent: Show Prague average as helper text (~18,000 Kč)

### 🧪 Testing Gaps

Add to testing checklist:

```
[ ] Leap year handling in daily budget calculation
[ ] Currency conversion if user changes currency mid-setup
[ ] Negative numbers rejected in all amount fields
[ ] Maximum value limits (prevent 999,999,999 Kč entries)
[ ] Date picker edge cases (past dates, far future dates)
```

### 📈 Analytics Consideration (Phase 2+)

Build event structure now (stub for Phase 1):

```javascript
// lib/analytics.js
export const trackEvent = (event, properties) => {
  if (__DEV__) console.log('Analytics:', event, properties);
  // Phase 2: send to Supabase or analytics service
};
```

Metrics to track:
- Onboarding completion rate by step
- Average time per section
- Most skipped questions
- Most edited fields in Review

---

## Top 3 Priority Actions

1. **Add missing expense categories** (stavební spoření, dental, SVJ fees, expat costs) before launch
2. **Enhance Q5c** to distinguish savings types (emergency vs goal vs regulated products)
3. **Add `hooks/` folder** and analytics stubs now for Phase 2 readiness

---

## Appendix: Missing Expense Categories Checklist

### To Add to Onboarding

- [ ] Stavební spoření (building savings)
- [ ] Doplňkové penzijní spoření (supplementary pension)
- [ ] SVJ/BD contributions (condo fees)
- [ ] Daň z nemovitosti (property tax)
- [ ] Dental care
- [ ] Vision/glasses
- [ ] Pharmacy co-pays
- [ ] Školní jídelna (school lunch)
- [ ] Družina (after-school care)
- [ ] Havarijní pojištění (comprehensive car insurance)
- [ ] Visa/residence permit fees (expat)
- [ ] Foreign currency transfers (expat)

### To Add to Subscriptions Quick-Add

- [ ] Voyo
- [ ] SledovaniTV
- [ ] O2 TV
- [ ] Alza Premium
- [ ] Rohlík Premium
- [ ] Košík
