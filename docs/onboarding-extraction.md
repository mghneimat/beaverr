# Beaver Onboarding — Extraction

> Questions/options text, flow hierarchy, and component architecture.  
> Source of truth for copy: `lib/locales/en.json` → `onboarding.*`  
> Last updated: 2026-06-09

---

## 1. Questions & options text

### Entry

| Screen | Question / title | Options |
|--------|------------------|---------|
| **Welcome** | Beaver — Not rich. Just ready. | CTA: Start now |
| **Consent** | Your Data, Your Privacy | Checkbox: I understand and agree to proceed |

### Section 1 — Household

| Step | Question | Options |
|------|----------|---------|
| Type | Who are we budgeting for? | Just me · Me + partner · Single parent |
| Partner name | What should we call your partner? | Text input |
| Children | Do you have any children? | Yes · No |
| Count | How many children do you have? | Number |
| Child details | Child {{n}} — a couple of quick details | Name (optional); Age: Under 3 · 3–5 · 6–15 · 16–18 · 18+ |

### Section 2 — Location & occupation

| Screen | Question | Options |
|--------|----------|---------|
| **Location** | Where are you living? | Country (select) · City/Region · Currency |
| **Occupation (you)** | What best describes your work situation? | Employee · Self-employed/Freelancer · Student · Not currently working · Other (+ specify) |
| **Occupation (partner)** | What about {{name}}'s work situation? | Same options |

### Section 3 — Income

| Step | Question | Options / fields |
|------|----------|------------------|
| q5 | Net monthly salary / income (title varies by occupation) | Amount + frequency (Daily/Weekly/Fortnightly/Monthly) |
| q5a | Partner's monthly take-home | Amount (if partner household) |
| q5b | Any other sources of income? | Yes · No → add sources (amount, frequency, label) |
| q5c | Do you have savings? | Balance amount |
| q5d | What do you want Beaver to help with? | Get clarity · Spend less · Build more |
| q5d-mode | How do you want to save? | Save toward specific amount · Ongoing monthly saving |
| q5d-details | Savings target / monthly saving | Goal description, amount, date |

### Section 4 — Housing

| Step | Question | Options |
|------|----------|---------|
| q6 | Do you rent, own, or live with family? | Renting · Own my home · Living with family/rent-free |
| q6a | Monthly rent? | Amount |
| q6b | Utilities? | Skip · Combined total · Itemized (water, heating, electricity, gas, etc.) |
| q6c | Internet separately? | No/Included · Yes + amount |
| q6d | Do you have a mortgage? | Yes · No (owned outright) |
| q6e | Monthly mortgage payment? | Amount + end date |
| q6f | Other home ownership costs? | Yes · No → list items |
| q6h | Do you contribute to household costs? | Yes · No → list (family path) |
| q6g | Government and city charges | Waste tax · TV licence · Radio licence · custom items |

### Section 5 — Transport

| Step | Question | Options |
|------|----------|---------|
| q7 | Do you have a car or other vehicle? | Yes · No |
| q7Count | How many vehicles? | Passenger · Motorcycles/scooters · Bicycles |
| q7a | Fuel and running costs (per vehicle) | Petrol · Diesel · Electric · Hybrid · LPG · CNG + cost |
| q7b | Vehicle insurance | Premium, frequency, renewal date, or skip |
| q7c | Zone parking / permits | Amount or skip |
| q7d | MOT/STK and maintenance | Expiry + maintenance items or skip |
| q7e | Public transport | Amount, frequency, pass type, or skip |

### Section 6 — Health insurance

Per household member tab (You · Partner · each Child):

- Covered by employer · Pay privately
- Premium, frequency, contract type (ongoing/fixed), dates, renewal plan (renew / switch / end)

### Section 7 — Children's costs

Per child tab — age-based cost fields:

- **Under 3:** Nursery/daycare, nanny, diapers, formula
- **3–5:** Kindergarten, toys/activities, clothing
- **6–15:** School supplies, after-school, allowance, phone, transport, extracurricular, savings
- **16–18:** + driving lessons, uni fees

### Section 8 — Pets

| Step | Question | Options |
|------|----------|---------|
| q10 | Do you have any pets? | Yes · No |
| q10a | Pet details | Type: Dog · Cat · Bird · Other; food, vet, insurance, grooming, dog tax (CZ) |

### Section 9 — Subscriptions

Single screen — quick-add chips:

Netflix, Prime Video, Disney+, Apple TV+, HBO Max, Spotify, Apple Music, YouTube Premium, Deezer, Revolut, Wise, iCloud+, Google One, Microsoft 365, Adobe CC, PlayStation Plus, Xbox Game Pass, Hulu, Twitch, Dropbox, Notion, ChatGPT Plus, GitHub, Medium, NY Times, The Economist, Other

### Section 10 — Other regular costs

Quick-add: Groceries, Mobile phone, Life insurance, Home insurance, Gym, Hair salon, Laundry, Charity, Education, Pension, OSVČ social/health (self-employed), Other

### Section 11 — Debts

| Step | Question | Options |
|------|----------|---------|
| q13 | Do you have any debts or loans? | Yes · No |
| q13a | Debt details | Credit card · Personal loan · Car loan/Leasing · Student loan · Medical · Family/Friend · BNPL · Other + balance, min payment, APR |

### Section 12 — Budget

| Step | Question | Options |
|------|----------|---------|
| q14 | Your flexible spending budget | Income/costs summary, adjustable amount, spend vs savings slider |
| q14a | What happens to unspent budget? | Free rollover · Capped rollover (×2/×3/×4 or fixed cap) · Reset each month → loose cash / savings / other goal |

### Section 13 — Review

| Step | Question | Options |
|------|----------|---------|
| q15 | Review your information | Expandable sections; CTA: Looks good — take me to my dashboard |

### Splash intros (between sections)

| Key | Eyebrow | Heading |
|-----|---------|---------|
| s2 | Section 2 — Location & Occupation | Where you live and what you do |
| s3 | Section 3 — Income | Now the numbers |
| s4 | Section 4 — Housing | Housing |
| s5 | Section 5 — Transport | Transport |
| s6 | Section 6 — Health Insurance | Health Insurance |
| s7 | Section 7 — Children's Costs | Children's Costs |
| s8 | Section 8 — Pets | Pets |
| s9 | Section 9 — Subscriptions | Subscriptions |
| s10 | Section 10 — Other Costs | Other Regular Costs |
| s11 | Section 11 — Debts & Loans | Debts & Loans |
| s12 | Section 12 — Budget | Set your flexible spending budget |
| s13 | Almost done | Check everything looks right |

---

## 2. Questions hierarchy

### Top-level flow (28 screens)

```
welcome → consent → household
  → splash-location → location → occupation
  → splash-income → income
  → splash-housing → housing
  → splash-transport → transport
  → splash-health → health
  → splash-children → children-costs  [skipped if no children]
  → splash-pets → pets
  → splash-subscriptions → subscriptions
  → splash-other-costs → other-costs
  → splash-debts → debts
  → splash-budget → budget
  → splash-review → review → dashboard
```

### In-screen sub-steps

**household:** `type` → `partner`* → `children` → `numChildren`* → `childDetails`*  
\*conditional on household type / has children

**occupation:** `user` → `partner`*

**income:** `q5` → `q5a`* → `q5b` → `q5c` → `q5d` → `q5d-mode`* → `q5d-details`*  
\*partner if applicable; savings goal steps if "Build more" selected

**housing (branching by q6 answer):**

- **Renting:** q6 → q6a → q6b → q6c → q6g
- **Own:** q6 → q6d → q6e* → q6f → q6c → q6g
- **Family:** q6 → q6h → q6c → q6g

**transport:**

- **Has vehicle:** q7 → q7Count → q7a → q7b → q7c → q7d → q7e
- **No vehicle:** q7 → q7e

**health:** Tab per member (user → partner → children); each tab = employer vs private + renewal sub-flow

**children-costs:** Tab per child (skipped entirely if no children)

**pets:** q10 → q10a* or skip section  
**debts:** q13 → q13a* or skip  
**budget:** q14 → q14a  
**subscriptions / other-costs / location / review:** single screen each

---

## 3. Project components architecture

```
pocket-os/
├── app/                          # Expo Router (file = route)
│   ├── _layout.jsx               # Root: fonts, Gluestack, i18n provider
│   ├── index.jsx                 # Entry → onboarding or app
│   ├── (onboarding)/             # Linear onboarding stack (28 screens)
│   │   ├── _layout.jsx
│   │   ├── welcome, consent, household
│   │   ├── splash-*, location, occupation, income, housing, transport...
│   │   └── review
│   └── (app)/                    # Post-onboarding shell
│       ├── _layout.jsx           # Sidebar + top nav + tab stack
│       ├── dashboard, income, costs, budget, tracker, goals, savings,
│       │   summary, alerts, subscriptions, profile, account-settings, help-feedback
│       └── edit/[section].jsx    # Re-edit onboarding sections from app
│
├── components/
│   ├── onboarding/               # Onboarding-only UI
│   │   ├── QuestionScreen.jsx    # Wrapper for all question screens
│   │   ├── SplashScreen.jsx      # Section intro splashes
│   │   ├── OptionCard, YesNoToggle, PillToggle, FrequencyPills
│   │   ├── LabeledInput, DatePicker, InputGroup, CostCard
│   │   └── BudgetSplitSlider, BudgetExportBar, ServiceIcons...
│   ├── dashboard/                # Tab content (~60 components)
│   │   ├── DashboardHome, DashboardPageShell, *Content.jsx per tab
│   │   ├── Charts/tables: ExpensesDonutChart, BurnRateVisuals, LedgerDataTable...
│   │   └── Jars*, Tracker*, Savings*, Reminders*...
│   ├── app/                      # App shell
│   │   ├── AppSidebar, AppTopNavBar, TabHeaderToolbar
│   │   ├── SidebarBrandMark, BeaverBLogo, LanguageSelector
│   │   └── ScreenTransitionShell, SectionEditShell
│   ├── section-edit/             # Post-onboarding edit forms
│   │   ├── SectionEditForm.jsx
│   │   └── forms/ (IncomeEdit, HousingEdit, BudgetEdit, ...)
│   └── ui/                       # Shared primitives
│       ├── PrimaryButton, OutlineButton, SurfaceCard, OptionCard
│       ├── FormInput, ConfirmDialog
│
├── lib/                          # Business logic (no UI)
│   ├── storage.js, schema.js     # Persistence
│   ├── finance.js, householdBudget.js, budgetSplit.js
│   ├── i18n.js                   # + locales/en.json, cs.json
│   ├── dashboardData.js, alerts.js, burnRate.js, jarRouting.js...
│   └── screenTransition.js, uiPreferences.js, sectionEditRegistry.js
│
└── constants/onboarding-theme.js # Design tokens (C, R, T, S, F)
```

### Layering rules

- **Screens** (`app/`) — routing, step state, save to storage, compose components
- **Components** — render only; dashboard panels receive data from screens/hooks
- **lib/** — calculations, persistence, i18n, navigation helpers
- **Pattern:** Onboarding uses `QuestionScreen` + section-specific JSX; App uses thin route files that mount `*Content.jsx` inside `DashboardPageShell`

### Related docs

- Full i18n keys: `lib/locales/en.json`, `lib/locales/cs.json`
- Detailed screen specs: `docs/onboarding-flow-documentation.md`
- Product/design: `PRODUCT.md`, `DESIGN.md`
