# Changelog — auto-maintained by AI tools

[2026-06-06] [AI] Fixed RemoveButton vertical alignment in "add other" cards — wrapped RemoveButton and inline ✕ Pressable in fixed-height container Views matching adjacent input container height (63px for `large` variant, 44px for `inCard` variant) with `justifyContent: 'center'` so the ✕ button aligns precisely with the input box rather than the full LabeledInput height (label + input container); applied to housing.jsx Q6f/Q6h/Q6g, transport.jsx Q7bicycle/Q7d, and income.jsx Q5b | files: components/onboarding/RemoveButton.jsx, app/(onboarding)/housing.jsx, app/(onboarding)/transport.jsx, app/(onboarding)/income.jsx

[2026-06-06] [AI] Changed all currency input placeholders from "e.g. X XXX" to "0" across 17 keys in en.json — every currency/amount input now shows "0" as placeholder instead of example values like "e.g. 50 000", "e.g. 2 000", etc.; reduced `large` variant paddingVertical from 14 to 10 in both LabeledInput and CurrencyInput for slightly shorter input height | files: lib/locales/en.json, components/onboarding/LabeledInput.jsx, components/onboarding/CurrencyInput.jsx

[2026-06-06] [AI] Added labels to all inputs missing them across onboarding screens — added labels to 9 inputs in housing.jsx (q6c amount, q6f amount, q6f frequency, q6h amount, q6h frequency, q6g custom amount, q6g custom frequency, q6g custom description, q6a internet amount), 2 inputs in income.jsx (q5b amount, q5b frequency), 4 inputs in transport.jsx (q7d maintenance cost, q7d maintenance date, q7bicycle maintenance cost, q7bicycle maintenance date), 5 inputs in pets.jsx (q10a food, vet, insurance premium, grooming, other cost), 1 input in children-costs.jsx (q9 amount), 1 input in health.jsx (premium label); changed 6 amount placeholders from "Amount" to "0" in en.json | files: app/(onboarding)/housing.jsx, app/(onboarding)/income.jsx, app/(onboarding)/transport.jsx, app/(onboarding)/pets.jsx, app/(onboarding)/children-costs.jsx, app/(onboarding)/health.jsx, lib/locales/en.json

[2026-06-06] [AI] Changed all "add other" amount inputs from `inCard` to `large` variant across 7 onboarding screens — housing.jsx (q6f other costs, q6h other costs, q6g custom costs), transport.jsx (q7d maintenance, q7bicycle maintenance), pets.jsx (q10a costs, insurance, dog tax), children-costs.jsx (q9 child costs), income.jsx (q5b other income), subscriptions.jsx (q11 custom), other-costs.jsx (q12 custom), debts.jsx (q13a debts); widened constrained inputs (width 90→120, width 100→130) | files: app/(onboarding)/housing.jsx, app/(onboarding)/transport.jsx, app/(onboarding)/pets.jsx, app/(onboarding)/children-costs.jsx, app/(onboarding)/income.jsx, app/(onboarding)/subscriptions.jsx, app/(onboarding)/other-costs.jsx, app/(onboarding)/debts.jsx

[2026-06-06] [AI] Fixed input field twitching on focus in LabeledInput and CurrencyInput — made borderWidth consistent (always 2.5 for default/large, 2 for inCard) so only borderColor changes on focus/blur, eliminating layout shift; added focus state tracking to CurrencyInput (was missing entirely); added outlineStyle: 'none' / outlineWidth: 0 to prevent native browser outline | files: components/onboarding/LabeledInput.jsx, components/onboarding/CurrencyInput.jsx

[2026-06-06] [AI] Increased input focus outline thickness in LabeledInput — borderWidth now increases from 1.5→2.5 (large/default) or 1→2 (inCard) when focused, making the blue accent outline thicker and more visible on both currency mode container and standard mode TextInput | files: components/onboarding/LabeledInput.jsx

[2026-06-06] [AI] Added PlaceholderIllustration to all 14 onboarding screens — created PlaceholderIllustration.jsx component (abstract SVG with decorative circles, document shape, accent bar, dots matching blue/navy design system, viewBox 560×400); updated QuestionScreen.jsx illustration rendering to be full width, 400px high with border/background/borderRadius; added `illustration={<PlaceholderIllustration />}` prop to every <QuestionScreen> usage across budget.jsx, children-costs.jsx, debts.jsx, health.jsx, household.jsx (5 usages), housing.jsx (9 usages), income.jsx (5 usages), location.jsx, occupation.jsx (2 usages), other-costs.jsx, pets.jsx, review.jsx, subscriptions.jsx, transport.jsx | files: components/onboarding/PlaceholderIllustration.jsx, components/onboarding/QuestionScreen.jsx, app/(onboarding)/budget.jsx, app/(onboarding)/children-costs.jsx, app/(onboarding)/debts.jsx, app/(onboarding)/health.jsx, app/(onboarding)/household.jsx, app/(onboarding)/housing.jsx, app/(onboarding)/income.jsx, app/(onboarding)/location.jsx, app/(onboarding)/occupation.jsx, app/(onboarding)/other-costs.jsx, app/(onboarding)/pets.jsx, app/(onboarding)/review.jsx, app/(onboarding)/subscriptions.jsx, app/(onboarding)/transport.jsx

[2026-06-06] [AI] Added paddingVertical: 10 to both helper and description containers in QuestionScreen — the contextual text (e.g. "This unlocks a dedicated section for children's costs.") now has 10px padding on top and bottom for better visual spacing on all pages | files: components/onboarding/QuestionScreen.jsx

[2026-06-06] [AI] Added paddingVertical: 12 to description container in QuestionScreen — the longer contextual text (e.g. "This unlocks a dedicated section for children's costs.") now has 12px padding on top and bottom for better visual spacing | files: components/onboarding/QuestionScreen.jsx

[2026-06-06] [AI] Added illustration and description props to QuestionScreen — illustration renders a placeholder image/SVG centered above the title (optional); description renders longer contextual text below the helper (optional, styled at 13px/20px muted); increased ScrollView content paddingVertical from 24px to 32px for more breathing room; reduced helper marginBottom from 24px to 6px so description sits closer to the helper | files: components/onboarding/QuestionScreen.jsx

[2026-06-06] [AI] Removed circular icon container from OptionCard — icons are now rendered as plain inline text (no circular/square container, no background tint) positioned to the left of the label with marginRight: 12 | files: components/onboarding/OptionCard.jsx

[2026-06-06] [AI] Simplified progress bar from animated panel to a thin 3px line directly under the nav bar — removed the animated panel wrapper (padding, opacity animation, height animation) from both QuestionScreen.jsx and SplashScreen.jsx; progress bar is now a simple View with S.progressHeight (3px) and C.progressTrack background, containing an Animated.View fill with animated width via fillAnim; removed unused progressAnim ref, its useEffect, and animatedPanelHeight/animatedPanelOpacity interpolation variables from both components; added borderBottom (1px, C.border) to nav bar for visual separation from the progress bar line | files: components/onboarding/QuestionScreen.jsx, components/onboarding/SplashScreen.jsx

[2026-06-06] [AI] Changed onboarding nav bars (top and bottom) from light blue-gray (C.bg) to white-ish (C.surface) — updated QuestionScreen.jsx and SplashScreen.jsx nav bar, progress bar panel, and bottom bar backgrounds from C.bg (#EFF4FB) to C.surface (#F8FAFF); app layout (app/(app)/_layout.jsx) already used C.surface for both header and tab bar | files: components/onboarding/QuestionScreen.jsx, components/onboarding/SplashScreen.jsx

[2026-06-06] [AI] Changed app font to Inter — installed @expo-google-fonts/inter; updated app/_layout.jsx to load Inter fonts (400, 500, 600, 700 weights) via useFonts hook with splash screen hiding after fonts load; added fontFamily: 'Inter' to all typography tokens in constants/onboarding-theme.js (questionTitle, helper, splashHeading, splashBody, eyebrow, fieldLabel, caption, hint, inputText, inputLarge, btnPrimary, btnSkip, btnAdd, pillLabel, pillLabelLarge, pillLabelSmall, backBtn, chapterLabel, progressLabel); updated global.css with body font-family and --font-family-sans CSS variable; tailwind.config.js already had Inter configured as default sans font family | files: app/_layout.jsx, constants/onboarding-theme.js, global.css

[2026-06-06] [AI] Removed progress label text (e.g. "Household · 1 of 4") from QuestionScreen progress bar panel — progress bar now shows only the track + fill without any text label; removed `progressLabel` prop rendering and the percentage fallback; simplified panel layout from flexDirection row to single column | files: components/onboarding/QuestionScreen.jsx

[2026-06-06] [AI] Standardized OptionCard component to match blue/navy design system — added circular icon container (36px, tinted bg when selected), optional `subtitle` prop for descriptions, navy border + light blue tint on selected state, accent border on hover; removed emoji-only rendering in favor of consistent card layout with icon circle, label, subtitle, and checkmark badge; component now reused across household type, occupation, health coverage, and budget strategy screens | files: components/onboarding/OptionCard.jsx

[2026-06-06] [AI] Simplified QuestionScreen back button to icon-only — removed "Back" text label, increased pressable width (paddingLeft: 12→20, paddingRight: 16→24), hover/press overlay still covers full S.navHeight (56px); updated right spacer from 80px to 60px to balance the new icon-only button width | files: components/onboarding/QuestionScreen.jsx

[2026-06-06] [AI] Unified all currency/amount input fields across onboarding to display currency symbol on the left — created CurrencyInput component (components/onboarding/CurrencyInput.jsx) with gluestack Input/InputField, currency symbol on left, optional frequency suffix on right, matching UI Examples Screen 5 pattern; updated LabeledInput.jsx to support `currency` and `frequency` props — when `currency` is provided, renders in currency mode with symbol on left, bottom-border-only TextInput, and optional frequency suffix on right (backward compatible, existing screens without `currency` continue as before); added `currency={currency}` prop to all currency LabeledInput instances across 9 onboarding screens (income.jsx: 6 instances, housing.jsx: 8 instances, transport.jsx: 7 instances, subscriptions.jsx: 1 instance, other-costs.jsx: 1 instance, debts.jsx: 2 instances, health.jsx: 1 instance, pets.jsx: 3 instances, children-costs.jsx: 1 instance); added `currency` state + useEffect to load from pocketos_location in screens that didn't already have it (transport, subscriptions, debts, pets); replaced manual `{currency}/yr` text in housing.jsx government tax section with `frequency="/yr"` prop on LabeledInput | files: components/onboarding/CurrencyInput.jsx, components/onboarding/LabeledInput.jsx, app/(onboarding)/income.jsx, app/(onboarding)/housing.jsx, app/(onboarding)/transport.jsx, app/(onboarding)/subscriptions.jsx, app/(onboarding)/other-costs.jsx, app/(onboarding)/debts.jsx, app/(onboarding)/health.jsx, app/(onboarding)/pets.jsx, app/(onboarding)/children-costs.jsx

[2026-06-06] [AI] Applied new blue design system to Welcome, Consent, and Household screens — updated constants/onboarding-theme.js with modern blue color palette (primary: #2563EB, bg: #F8F9FA, surface: #FFFFFF); updated QuestionScreen.jsx to use design tokens with automatic progress percentage display; updated welcome.jsx with new design tokens; updated consent.jsx with new design tokens, replaced Box with View for nav bar container, changed ArrowLeftIcon color to C.primary and size to "sm" for better visibility; updated household.jsx to use design tokens (C.border, C.surface, C.muted, C.text, C.addBorder, C.overlayPressed, R.input, T.hint, T.fieldLabel) instead of hardcoded hex colors | files: constants/onboarding-theme.js, components/onboarding/QuestionScreen.jsx, app/(onboarding)/welcome.jsx, app/(onboarding)/consent.jsx, app/(onboarding)/household.jsx

[2026-06-06] [AI] Migrated onboarding pages from react-native Text to @gluestack-ui/themed Text — replaced Text imports from react-native with Text from @gluestack-ui/themed across welcome.jsx, consent.jsx, household.jsx, splash-location.jsx, location.jsx, occupation.jsx; replaced all theme constant references (C.*, S.*, T.*, R.*, inputBase, inputCard, inputLarge, btnPrimary, btnAdd) from constants/onboarding-theme.js with hardcoded values; migrated shared components QuestionScreen.jsx, SplashScreen.jsx, OptionCard.jsx, LabeledInput.jsx; kept View/Pressable/ScrollView/TextInput from react-native for reliable layout and border radius control; established pattern of react-native layout + Gluestack Text for text rendering | files: app/(onboarding)/welcome.jsx, app/(onboarding)/consent.jsx, app/(onboarding)/household.jsx, app/(onboarding)/splash-location.jsx, app/(onboarding)/location.jsx, app/(onboarding)/occupation.jsx, components/onboarding/QuestionScreen.jsx, components/onboarding/SplashScreen.jsx, components/onboarding/OptionCard.jsx, components/onboarding/LabeledInput.jsx

[2026-06-06] [AI] Migrated UI system from custom components to GlueStack UI v3 — installed @gluestack-ui/themed and react-native-svg@13.9.0 (130 packages); created gluestack-ui.config.js with PocketOS color palette mapped to GlueStack tokens; wrapped app with GluestackUIProvider in app/_layout.jsx; created custom wrapper components (PrimaryButton, FormInput, OptionCard) in components/ui/ for simplified API; created comprehensive migration documentation (GLUESTACK_SETUP.md, GLUESTACK_MIGRATION.md) with before/after examples; created working example screen (examples/gluestack-example.jsx) demonstrating forms, buttons, cards, and option selection | files: package.json, gluestack-ui.config.js, app/_layout.jsx, components/ui/index.js, components/ui/PrimaryButton.jsx, components/ui/FormInput.jsx, components/ui/OptionCard.jsx, GLUESTACK_SETUP.md, GLUESTACK_MIGRATION.md, examples/gluestack-example.jsx

[2026-06-05] [AI] Added card background wrapper to onboarding content areas — wrapped scrollable content in QuestionScreen.jsx and centered content in SplashScreen.jsx with a card View using C.surface background, 1px C.border border, R.card (10px) border-radius, and S.pagePadH (20px) padding; moved paddingVertical to ScrollView contentContainerStyle in QuestionScreen so card has vertical spacing; replaced hardcoded paddingHorizontal:24 with S.pagePadH in SplashScreen centered content | files: components/onboarding/QuestionScreen.jsx, components/onboarding/SplashScreen.jsx

[2026-06-05] [AI] Centered chapter label in top nav bar and made it more visible — changed nav bar justifyContent from flex-end to center in both QuestionScreen and SplashScreen; updated T.chapterLabel design token from {fontSize:11, fontWeight:500, letterSpacing:1.2} to {fontSize:13, fontWeight:600, letterSpacing:0.8} for larger, bolder appearance | files: components/onboarding/QuestionScreen.jsx, components/onboarding/SplashScreen.jsx, constants/onboarding-theme.js

[2026-06-05] [AI] Applied design tokens (C, S, T) from onboarding-theme.js to 4 main app shell files — replaced hardcoded colors (#F7F8FA→C.bg, #4F46E5→C.primary, #1D3557→C.primary, #6B7280→C.muted, #F4F3EF→C.bg, #FDFCFA→C.surface, #E4E2DC→C.border, #1A1A1A→C.text, #7A7770→C.muted, #FFFFFF→C.surface, #E5E7EB→C.border, #EEF2FF→C.infoBg, #22C55E→C.positive, #7C3AED→C.accent, #F59E0B→C.muted) and hardcoded spacing/typography (paddingHorizontal:20→S.pagePadH, height:56→S.navHeight, fontSize:17→...T.inputText, fontSize:11/fontWeight:500/letterSpacing:1.2→...T.eyebrow) | files: app/index.jsx, app/(app)/_layout.jsx, components/HamburgerMenu.jsx, app/(app)/dashboard.jsx

[2026-06-05] [AI] Standardized all amount-type LabeledInput instances to use `large` variant (32px/600w) across 4 onboarding screens — added `large` prop to savingsBalance, savingsMonthlyTarget, goalAmount in income.jsx; internetAmount, mortgageAmount in housing.jsx; fuelCost, insurancePremium, parkingAmount in transport.jsx; balance, minPayment in debts.jsx | files: app/(onboarding)/income.jsx, app/(onboarding)/housing.jsx, app/(onboarding)/transport.jsx, app/(onboarding)/debts.jsx

[2026-06-05] [AI] Replaced QuestionScreen bottom buttons with bottom menu bar styled like main app tab bar — removed Back button from top nav bar (kept chapter label on right); added 74px bottom bar with C.surface background, C.border border top, Back button on left with overlay hover/press effects (C.overlayHover/C.overlayPressed), Continue button on right with hover opacity and press effects (C.primaryPressed); added continueHovered/continuePressed state; added router.canGoBack() safety check to prevent Unmatched Route errors | files: components/onboarding/QuestionScreen.jsx

[2026-06-05] [AI] Replaced SplashScreen CTA button with bottom menu bar matching QuestionScreen pattern — removed Back button from top nav bar (kept chapter label on right); removed CTA button from centered content area; added 74px bottom bar with C.surface background, C.border border top, Back button on left (conditionally shown when onBack prop provided), Continue button on right with hover/press effects; added continueHovered/continuePressed state | files: components/onboarding/SplashScreen.jsx

[2026-06-05] [AI] Fixed consent screen Back button causing Unmatched Route error — replaced router.back() (which tried to go back to index.jsx that immediately redirects to welcome) with router.replace('/(onboarding)/welcome') for direct navigation | files: app/(onboarding)/consent.jsx

[2026-06-05] [AI] Integrated shared components into all 10 onboarding question screens — replaced hardcoded TextInputs with LabeledInput, ad-hoc Yes/No PillToggle pairs with YesNoToggle, duplicated frequency pill groups with FrequencyPills, and dashed-border add buttons with AddAnotherButton across household.jsx, income.jsx, housing.jsx, transport.jsx, health.jsx, children-costs.jsx, pets.jsx, subscriptions.jsx, other-costs.jsx, debts.jsx; budget.jsx had no TextInputs to replace (monthlyFlexible set programmatically); all components use design tokens from onboarding-theme.js | files: app/(onboarding)/household.jsx, app/(onboarding)/income.jsx, app/(onboarding)/housing.jsx, app/(onboarding)/transport.jsx, app/(onboarding)/health.jsx, app/(onboarding)/children-costs.jsx, app/(onboarding)/pets.jsx, app/(onboarding)/subscriptions.jsx, app/(onboarding)/other-costs.jsx, app/(onboarding)/debts.jsx

[2026-06-05] [AI] Created onboarding design token file (constants/onboarding-theme.js) — single source of truth for all inline colour, radius, typography, and spacing values used across onboarding; eliminates hardcoded hex values scattered across 15+ files; exports C (colours), R (radii), T (typography), S (spacing), inputBase, inputCard, inputLarge, btnPrimary, btnAdd helpers | files: constants/onboarding-theme.js

[2026-06-05] [AI] Updated QuestionScreen, SplashScreen, OptionCard, PillToggle to import and use design tokens from onboarding-theme.js instead of hardcoded hex values; OptionCard gains hover state (accent border + tinted bg on web hover); SplashScreen and QuestionScreen import Easing directly instead of via require(); all four components now have zero hardcoded colour literals | files: components/onboarding/QuestionScreen.jsx, components/onboarding/SplashScreen.jsx, components/onboarding/OptionCard.jsx, components/onboarding/PillToggle.jsx

[2026-06-05] [AI] Created standardised shared onboarding components — LabeledInput (label-on-top TextInput with required/optional markers, normal/large/inCard variants), YesNoToggle (canonical binary toggle replacing ad-hoc PillToggle Yes/No patterns), FrequencyPills (canonical frequency selector replacing duplicated pill groups), AddAnotherButton (canonical dashed-border add button); all use design tokens from onboarding-theme.js; DRY: these replace ~30 duplicated inline patterns across 12 screens | files: components/onboarding/LabeledInput.jsx, components/onboarding/YesNoToggle.jsx, components/onboarding/FrequencyPills.jsx, components/onboarding/AddAnotherButton.jsx

[2026-06-05] [AI] Renamed all 12 numbered splash screens to semantic names (s2-splash→splash-location, s3-splash→splash-income, s4-splash→splash-housing, s5-splash→splash-transport, s6-splash→splash-health, s7-splash→splash-children, s8-splash→splash-pets, s9-splash→splash-subscriptions, s10-splash→splash-other-costs, s11-splash→splash-debts, s12-splash→splash-budget, s13-splash→splash-review); deleted old numbered files; updated _layout.jsx with semantic names and section comments; updated all router.replace() navigation references across 11 question screens; SVG illustrations updated to use design token colours (#1D3557 primary, #E8825A accent, #3A8C6E positive) instead of old indigo (#4F46E5) | files: app/(onboarding)/_layout.jsx, app/(onboarding)/splash-location.jsx, app/(onboarding)/splash-income.jsx, app/(onboarding)/splash-housing.jsx, app/(onboarding)/splash-transport.jsx, app/(onboarding)/splash-health.jsx, app/(onboarding)/splash-children.jsx, app/(onboarding)/splash-pets.jsx, app/(onboarding)/splash-subscriptions.jsx, app/(onboarding)/splash-other-costs.jsx, app/(onboarding)/splash-debts.jsx, app/(onboarding)/splash-budget.jsx, app/(onboarding)/splash-review.jsx, app/(onboarding)/household.jsx, app/(onboarding)/occupation.jsx, app/(onboarding)/income.jsx, app/(onboarding)/housing.jsx, app/(onboarding)/transport.jsx, app/(onboarding)/health.jsx, app/(onboarding)/children-costs.jsx, app/(onboarding)/pets.jsx, app/(onboarding)/subscriptions.jsx, app/(onboarding)/other-costs.jsx, app/(onboarding)/debts.jsx, app/(onboarding)/budget.jsx

[2026-06-05] [AI] Fixed SplashScreen layout — eyebrow and heading now left-aligned (was centered); SVG illustration explicitly centered via `alignItems: 'center'` on its wrapper; content column widened to `maxWidth: 480` with `paddingHorizontal: 24` so heading no longer wraps prematurely; removed tight `maxWidth` constraints from heading and body text; CTA button now fills full content column width (no `maxWidth: 360` cap) | files: components/onboarding/SplashScreen.jsx

[2026-06-05] [AI] Standardised all splash screens (s2–s13) — redesigned SplashScreen.jsx: added `eyebrow` prop (small uppercase accent label above heading), changed heading to serif font (`fontFamily: 'serif'`, 30px, letterSpacing -0.3) matching DM Serif Display from design reference, fixed CTA button color from indigo (#4F46E5) to navy (#1D3557) per design system, moved SVG illustration below body text, improved button font to 15px/500 weight; added `eyebrow` locale keys for all s2–s13 in EN and CS locales; updated all 12 splash screen files (s2–s13) to pass the new `eyebrow` prop | files: components/onboarding/SplashScreen.jsx, app/(onboarding)/s2-splash.jsx, app/(onboarding)/s3-splash.jsx, app/(onboarding)/s4-splash.jsx, app/(onboarding)/s5-splash.jsx, app/(onboarding)/s6-splash.jsx, app/(onboarding)/s7-splash.jsx, app/(onboarding)/s8-splash.jsx, app/(onboarding)/s9-splash.jsx, app/(onboarding)/s10-splash.jsx, app/(onboarding)/s11-splash.jsx, app/(onboarding)/s12-splash.jsx, app/(onboarding)/s13-splash.jsx, lib/locales/en.json, lib/locales/cs.json

[2026-06-05] [AI] Fixed splash screen body text padding — added `paddingHorizontal: 20` to the body `<Text>` in SplashScreen component so text never touches screen edges regardless of content length, without affecting layout positions | files: components/onboarding/SplashScreen.jsx

[2026-06-05] [AI] Fixed welcome page Get Started button width — switched from Tailwind classes (`w-full max-w-sm`) to inline styles matching SplashScreen Continue button exactly (`width: '100%', maxWidth: 360`, `paddingVertical: 16`, `paddingHorizontal: 32`, `borderRadius: 12`, `fontSize: 16`, `fontWeight: '600'`) so both buttons are identical in appearance | files: app/(onboarding)/welcome.jsx

[2026-06-05] [AI] Refined welcome page typography — made "Pocket" word thinner (`font-light`) while keeping "OS" bold (`font-bold`); reduced motto size from `text-display` to `text-xl` and weight from `font-bold` to `font-medium` | files: app/(onboarding)/welcome.jsx

[2026-06-05] [AI] Revamped welcome page — replaced SVG illustration with styled "PocketOS" brand text; changed motto from "Your household finances, finally clear." to "Your pocket. Upgraded."; replaced old tagline with a brief project description ("A smart household budgeting tool that helps you track income, manage costs, and take control of your finances — all in one place."); removed `react-native-svg` import from welcome.jsx; updated EN and CS locale files with new tagline and description keys | files: app/(onboarding)/welcome.jsx, lib/locales/en.json, lib/locales/cs.json

[2026-06-05] [AI] Fixed broken labels on review page — children's costs section was using wrong translation key path (`onboarding.childrenCosts.fields.${field}.label` instead of `onboarding.childrenCosts.q9.field.${i18nField}`); added `FIELD_I18N_MAP` constant to map internal field keys to correct i18n keys; added `other_*` custom field handling; fixed health section labels to show proper display names (`t('onboarding.health.you')`, partner name from household data, child names from household data) instead of raw member IDs (`user`, `partner`, `child_0`) | files: app/(onboarding)/review.jsx

[2026-06-05] [AI] Fixed "Unexpected text node" error on review page — converted `{condition && <Component />}` patterns to `{condition ? <Component /> : null}` in pets section (foodAmount, vetAmount) and budget section (rolloverMultiplier); added type guards for `Object.entries()` calls in childrenCosts and health sections to prevent iterating over non-object values | files: app/(onboarding)/review.jsx

[2026-06-05] [AI] Removed savings row from budget summary table — savings is a separate goal, not part of the budget calculation; removed `savingsTarget` state and `savings` local variable from budget.jsx; updated `availableBudget()` in finance.js to no longer accept/use a savings target parameter (now takes 3 args: income, fixedCosts, debtPayments); updated tests accordingly | files: app/(onboarding)/budget.jsx, lib/finance.js, __tests__/lib/finance.test.js

[2026-06-05] [AI] Made budget summary table header taller (pv:10→14) and text bolder (fw:600→700, fs:11→12); added "Expand all / Collapse all" toggle button below table header that expands/collapses all rows and category sub-rows simultaneously with 280ms animated transitions matching existing animation scheme | files: app/(onboarding)/budget.jsx

[2026-06-05] [AI] Fixed health insurance amount displaying as "300 002 000" in budget summary — root cause: `premium` stored as string from TextInput, `toMonthly()` returned raw string for unknown `"custom"` frequency, causing `+` operator to concatenate strings instead of adding numbers in `totalMonthlyCosts`; fixed `toMonthly()` to parse amount via `Number()` (always returns number), fixed budget.jsx to parse `member.premium` as `Number()` and compute monthly equivalent for custom frequency (`premium / customFrequencyMonths`), fixed health.jsx to strip non-numeric chars from premium input | files: lib/finance.js, app/(onboarding)/budget.jsx, app/(onboarding)/health.jsx

[2026-06-05] [AI] Fixed extra white space in budget summary table between 'Other' and 'Debt payments' — added onFixedCostsContentLayout onLayout handler on the inner content View of renderCostsBreakdown that measures the actual rendered height and updates contentHeights.fixedCosts; if the measured height differs from the current animated value, smoothly animates to the correct height; this ensures the outer Animated.View always matches the exact rendered content height regardless of text layout variations; also fixed reverse (collapse) animation for fixedCosts main row — toggleRow now uses expandAnims.fixedCosts.__getValue() as the starting point for collapse animation instead of contentHeights.fixedCosts (which stores the target height, not the current animated position) | files: app/(onboarding)/budget.jsx

[2026-06-05] [AI] Fixed table spacing issue in budget summary — replaced onLayout-based content height measurement for fixedCosts section with dynamic height calculation (recalcFixedCostsHeight) that sums category headers (36px each) plus only expanded category items; removed position:absolute from inner View so collapsed category items no longer contribute to measured height; recalcFixedCostsHeight is called on category toggle and on category content layout measurement | files: app/(onboarding)/budget.jsx

[2026-06-05] [AI] Added expand/collapse feature to budget summary table — income row expands to show user/partner/other income breakdown, fixed costs row expands to show per-category breakdown (housing, transport, health, children, pets, subscriptions, other); uses Animated.Value height interpolation with onLayout-measured content heights for smooth 280ms expand/collapse animation (no empty white space when collapsed); added chevron indicators (▲/▼) on expandable rows; restructured useEffect to preserve categorized costs alongside flat array; added `incomeUser`, `incomePartner`, `incomeOther`, and `cat.*` translation keys to both EN and CS locales | files: app/(onboarding)/budget.jsx, lib/locales/en.json, lib/locales/cs.json

[2026-06-05] [AI] Restyled budget summary card as minimalistic table — replaced the bordered summary card with a clean three-column table layout (Description, Amount, Currency) with uppercase header row, individual data rows with color-coded amounts (navy income, rose fixed costs, purple debt payments, emerald savings), and a highlighted total row for "Your monthly flexible budget" with bold green/red coloring; added `amount` and `currency` i18n keys to both EN and CS locales | files: app/(onboarding)/budget.jsx, lib/locales/en.json, lib/locales/cs.json

[2026-06-05] [AI] Fixed budget screen income not updating — budget.jsx was accessing income data with wrong property paths (`inc?.user?.amount`, `inc?.partner?.amount`, `inc?.otherSources`, `inc?.savingsTarget`) that didn't match the actual saved structure from income.jsx (`inc.amount`, `inc.partnerAmount`, `inc.otherIncomeRows`, `inc.savingsMonthlyTarget`); fixed both the useEffect loader and renderQ14 summary panel to use correct paths | files: app/(onboarding)/budget.jsx

[2026-06-05] [AI] Fixed budget screen only showing debt payments — useEffect was only loading `pocketos_costs` (never written to) instead of aggregating costs from all 7+ storage keys; now loads housing, transport, health, children, pets, subscriptions, and other costs with proper data structure parsing for each section | files: app/(onboarding)/budget.jsx

[2026-06-05] [AI] Fixed review page translation keys — corrected 3 broken i18n paths: `onboarding.subscriptions.chips.*` → `onboarding.subscriptions.q11.services.*`, `onboarding.otherCosts.chips.*` → `onboarding.otherCosts.q12.costs.*`, `onboarding.debts.q13a.types.*` → `onboarding.debts.q13a.*` | files: app/(onboarding)/review.jsx

[2026-06-05] [AI] Removed ScrollView from review page — replaced ScrollView wrapper with plain View to eliminate nested scroll areas | files: app/(onboarding)/review.jsx

[2026-06-05] [AI] Implemented Debts screen (Q13/Q13a) — Yes/No PillToggle for hasDebts, debt type selection pills (creditCard, personalLoan, carLoan, studentLoan, medical, family, bnpl, other), balance/minimum payment/APR text inputs, high-APR warning banner (>20%), promo end date DatePicker (when APR=0, month/year only), custom DayPicker component for payment due day (1-31) using Modal with measureInWindow positioning, notes text input, dashed "Add debt" button, AnimatedSlideIn add/remove animation with RemoveButton, back navigation to s11-splash | files: app/(onboarding)/debts.jsx

[2026-06-05] [AI] Implemented Budget screen (Q14/Q14a) — loads all financial data (income, costs, debts, savings) for live calculation; summary panel showing income (green), fixed costs (red), debt payments (purple), savings target (green), divider, and available budget (green if ≥0, red if negative); editable monthly flexible budget input (centered, 24px font, navy border); rollover strategy selection via OptionCard (♾️ Free rollover, 🎯 Capped ×2/×3/×4, 🔁 Reset monthly); AnimatedSlideIn for capped multiplier pills; saves to pocketos_budget; navigates to s13-splash | files: app/(onboarding)/budget.jsx

[2026-06-05] [AI] Implemented Review & Confirm screen — loads all 13 onboarding data stores (household through budget); collapsible ReviewSection components for each category (Household, Location & Occupation, Income, Transport, Health, Children's Costs, Pets, Subscriptions, Other Costs, Debts, Budget) with ▲/▼ toggle and bezier(0.16,1,0.3,1) easing at 280ms; DataRow component for label/value pairs; live monthly income calculation (user + partner + other sources); "I'll finish this later" secondary CTA; handleComplete marks onboarding as completed:true and navigates to dashboard | files: app/(onboarding)/review.jsx

[2026-06-05] [AI] Added OSVČ auto-prompt to other-costs.jsx — when user occupation is selfEmployed, shows indigo info card with quick-add buttons for social security (osvcSocial) and health insurance (osvcHealth) contributions; uses indigo (#4F46E5) buttons matching CZ self-employed context | files: app/(onboarding)/other-costs.jsx, lib/locales/en.json, lib/locales/cs.json

[2026-06-05] [AI] Added AnimatedOtherInput component to occupation.jsx — wraps "Other" text input in AnimatedSlideIn for smooth slide/fade reveal when user/partner selects 'other' occupation; added animationKey={step} to both QuestionScreen instances for re-animation on step transition | files: app/(onboarding)/occupation.jsx

[2026-06-05] [AI] Updated FadeUpView defaults — reduced default duration from 700ms→400ms, translateY from 18→12px for snappier entrance animation; switched easing to bezier(0.16,1,0.3,1) that settles quickly without sticky end-feel | files: components/onboarding/FadeUpView.jsx

[2026-06-05] [AI] Created shared AnimatedSlideIn, AnimatedRow, and RemoveButton components — AnimatedSlideIn uses opacity+translateY with useNativeDriver:true for smooth 60fps reveal/hide (avoids janky maxHeight animation); AnimatedRow adds translateX slide-in from right with onAnimationEnd callback; RemoveButton provides consistent ✕ delete button with red-tinted rgba hover/press effects (#D14040) | files: components/onboarding/AnimatedSlideIn.jsx, components/onboarding/AnimatedRow.jsx, components/onboarding/RemoveButton.jsx

[2026-06-04] [AI] Fixed section animations glitching towards end of transition across entire onboarding — reduced FadeUpView default duration from 700ms→400ms, translateY from 18→12px, and switched easing from slow-lingering bezier(0.25,0.46,0.45,0.94) to snappy bezier(0.16,1,0.3,1) that settles quickly without sticky end-feel; created shared AnimatedSlideIn, AnimatedRow, and RemoveButton components with useNativeDriver:true (opacity+translateY instead of janky maxHeight) and replaced 10+ duplicated local implementations across income.jsx, housing.jsx, transport.jsx, other-costs.jsx, children-costs.jsx, debts.jsx, health.jsx, pets.jsx, subscriptions.jsx, budget.jsx, occupation.jsx; reduced QuestionScreen/SplashScreen progress bar panel animation from 600ms→350ms and fill bar from 500ms→400ms with same improved easing; updated review.jsx ReviewSection easing to match | files: components/onboarding/FadeUpView.jsx, components/onboarding/AnimatedSlideIn.jsx, components/onboarding/AnimatedRow.jsx, components/onboarding/RemoveButton.jsx, components/onboarding/QuestionScreen.jsx, components/onboarding/SplashScreen.jsx, app/(onboarding)/income.jsx, app/(onboarding)/housing.jsx, app/(onboarding)/transport.jsx, app/(onboarding)/other-costs.jsx, app/(onboarding)/children-costs.jsx, app/(onboarding)/debts.jsx, app/(onboarding)/health.jsx, app/(onboarding)/pets.jsx, app/(onboarding)/subscriptions.jsx, app/(onboarding)/budget.jsx, app/(onboarding)/occupation.jsx, app/(onboarding)/review.jsx

[2026-06-04] [AI] Fixed other-costs.jsx — added missing `q12` segment to all i18n key paths (title, helper, quickAdd, costs, amountLabel, amountPlaceholder, frequencyLabel, dueDateLabel, validation, osvcNote); transformed chips from simple text pills to toggle-style with navy checkmark badge; replaced "Delete" text with ✕ icon (always red #D14040, hover bg rgba(209,64,64,0.1)); wrapped cost cards in AnimatedSlideIn with visibleCosts state for smooth add/remove animation; moved frequency pills below amount input with labels; removed showDay={false} from DatePicker to show day dropdown; added missing `other` and `validation` keys to both EN and CS locale files | files: app/(onboarding)/other-costs.jsx, lib/locales/en.json, lib/locales/cs.json

[2026-06-04] [AI] Removed nested ScrollView wrappers from subscriptions.jsx and other-costs.jsx — cards now render directly in the page flow instead of inside a fixed-height ScrollView, eliminating nested scroll areas when multiple chips are selected | files: app/(onboarding)/subscriptions.jsx, app/(onboarding)/other-costs.jsx

[2026-06-04] [AI] Replaced hand-crafted SVG icons in ServiceIcons.jsx with actual brand logo SVGs from simpleicons.org — installed `react-native-svg` (v15.15.4 dependency, v^15.15.5 devDependency); downloaded 19 brand SVG files (netflix, primevideo, disneyplus, appletv, hbomax, spotify, applemusic, youtubemusic, deezer, amazonprime, revolut, wise, icloud, googleone, microsoft365, adobecreativecloud, playstationplus, xbox, gym) to assets/brand-icons/; rewrote ServiceIcons.jsx to use SvgXml with actual SVG path data from simpleicons; for services not on simpleicons (Disney+, Google One, Microsoft 365, PlayStation Plus, Gym, Other), used closest available SVG or hand-crafted approximation | files: components/onboarding/ServiceIcons.jsx, assets/brand-icons/, package.json

[2026-06-04] [AI] Transformed subscription quick-add chips from simple text pills to toggle-style chips matching pets.jsx pattern — added toggleSubscription/hasSub functions for toggle behavior; chips show navy border/background when active with checkmark badge; integrated SERVICE_ICON_COMPONENTS from ServiceIcons.jsx to render SVG brand logos inside each chip | files: app/(onboarding)/subscriptions.jsx, components/onboarding/ServiceIcons.jsx

[2026-06-04] [AI] Fixed subscriptions.jsx i18n key paths — all labels were showing raw translation keys (e.g. "onboarding.subscriptions.title") because key paths were missing the `q11` segment; fixed 10+ key paths across title, helper, quickAdd, services, amountPlaceholder, autoRenewLabel, renewalLabel, streamingFlag, validation, customAdd to include `q11`; added missing `validation` key to both EN and CS locale files | files: app/(onboarding)/subscriptions.jsx, lib/locales/en.json, lib/locales/cs.json

[2026-06-04] [AI] Added 11 missing service entries to subscriptions locale — primeVideo, deezer, revolut, wise, icloudPlus, googleOne, adobeCC, playstationPlus, xboxGamePass, gym, other were present in QUICK_ADD_CHIPS but missing from locale services object; added to both EN and CS locale files | files: lib/locales/en.json, lib/locales/cs.json

[2026-06-04] [AI] Fixed pets.jsx insurance section UI issues: changed insurance premium input border from gray (#E4E2DC) to navy (#1D3557) to match other input fields; added navy "Insurance premium" label above the input; added 12px spacer between insurance section and dog tax section; removed `paddingHorizontal: 2` from AnimatedSlideIn to prevent border clipping | files: app/(onboarding)/pets.jsx

[2026-06-04] [AI] Fixed systemic back-navigation bug across all 13 onboarding question screens — replaced `router.back()` fallthrough with explicit `router.replace()` to the correct previous splash screen; root cause: the entire onboarding flow uses `router.replace()` for forward navigation, so the navigation stack never builds proper history and `router.back()` jumps to welcome/consent instead of the expected previous screen; each screen now navigates directly to its preceding splash screen (e.g. transport → s5-splash, budget → s12-splash) | files: app/(onboarding)/household.jsx, app/(onboarding)/location.jsx, app/(onboarding)/occupation.jsx, app/(onboarding)/income.jsx, app/(onboarding)/housing.jsx, app/(onboarding)/transport.jsx, app/(onboarding)/health.jsx, app/(onboarding)/children-costs.jsx, app/(onboarding)/pets.jsx, app/(onboarding)/subscriptions.jsx, app/(onboarding)/other-costs.jsx, app/(onboarding)/debts.jsx, app/(onboarding)/budget.jsx

[2026-06-04] [AI] Fixed fade-up animation not replaying on step transitions in household, income, housing, and occupation screens — added `animationKey={currentStep}` (or `animationKey={step}`) to each `<QuestionScreen>` instance so React unmounts/mounts a fresh component on step change, triggering FadeUpView re-animation; previously React reconciled separate `if`-block QuestionScreen instances as the same component, preventing re-mount | files: app/(onboarding)/household.jsx, app/(onboarding)/income.jsx, app/(onboarding)/housing.jsx, app/(onboarding)/occupation.jsx

[2026-06-04] [AI] Restyled consent checkbox as a bordered card with custom green outline (rgb(52, 140, 43)) and matching translucent background (rgba(52, 140, 43, 0.06)) when checked, using inline styles for precise color control | files: app/(onboarding)/consent.jsx

[2026-06-04] [AI] Slowed fade-up animation from 350ms→500ms and switched easing to Easing.bezier(0.16, 1, 0.3, 1) for a smoother, more natural ease-out feel; added FadeUpView to welcome.jsx and consent.jsx (the last two screens without animation) so all 29 onboarding screens now animate on mount/transition | files: components/onboarding/FadeUpView.jsx, app/(onboarding)/welcome.jsx, app/(onboarding)/consent.jsx

[2026-06-04] [AI] Added smooth fade-up animation (opacity 0→1, translateY 18→0, 350ms cubic-bezier) to all onboarding question and splash screen transitions via new FadeUpView component; integrated into QuestionScreen.jsx (wraps content area with animationKey prop for step/tab changes) and SplashScreen.jsx (wraps centered content for mount animation); passed animationKey to all single-QuestionScreen screens with dynamic content (pets, children-costs, transport, health, debts, budget) to trigger re-animation on step/tab switch | files: components/onboarding/FadeUpView.jsx, components/onboarding/QuestionScreen.jsx, components/onboarding/SplashScreen.jsx, app/(onboarding)/pets.jsx, app/(onboarding)/children-costs.jsx, app/(onboarding)/transport.jsx, app/(onboarding)/health.jsx, app/(onboarding)/debts.jsx, app/(onboarding)/budget.jsx

[2026-06-04] [AI] Fixed splash screen back navigation — all 12 splash screens (s2–s13) now use router.replace() to navigate to the correct previous section screen instead of router.back(); this fixes the issue where pressing back on a splash screen would skip the previous section and go to the consent page, caused by household.jsx and other section screens using router.replace() to navigate to splash screens (removing themselves from the stack) | files: app/(onboarding)/s2-splash.jsx, app/(onboarding)/s3-splash.jsx, app/(onboarding)/s4-splash.jsx, app/(onboarding)/s5-splash.jsx, app/(onboarding)/s6-splash.jsx, app/(onboarding)/s7-splash.jsx, app/(onboarding)/s8-splash.jsx, app/(onboarding)/s9-splash.jsx, app/(onboarding)/s10-splash.jsx, app/(onboarding)/s11-splash.jsx, app/(onboarding)/s12-splash.jsx, app/(onboarding)/s13-splash.jsx

[2026-06-04] [AI] Restyled cost sections in Pets and Children's Costs as suggestion chips: replaced segmented-control pills with rounded suggestion chips (borderRadius: 12, width: 48% in 2-column grid matching continue button width); selected chips get navy border + checkmark badge; revealed inputs now show proper navy label above + "Frequency" label; added activeFields state to children-costs for chip toggle tracking; added common.frequency and childrenCosts.q9.suggestions i18n keys; fixed AnimatedSlideIn border clipping by adding paddingHorizontal: 2; fixed back navigation in both screens to persist data and navigate to previous onboarding screen via router.back() | files: app/(onboarding)/pets.jsx, app/(onboarding)/children-costs.jsx, lib/locales/en.json, lib/locales/cs.json

[2026-06-04] [AI] Pets section overhaul: replaced always-visible cost inputs (food, vet, grooming) with selectable toggle pills + AnimatedSlideIn sections; added "Other cost" option; removed dog walking cost section; simplified cost pill labels (removed "Monthly"/"Annual" prefixes); added costsLabel i18n key; added overflow:hidden to AnimatedSlideIn for smooth collapse-out animation; cleaned up unused locale keys (fish, rabbit, unnamed) | files: app/(onboarding)/pets.jsx, lib/locales/en.json, lib/locales/cs.json

[2026-06-04] [AI] Children-costs refinements: changed child name toggles back to horizontal row with flex:1 to fill continue-button width; removed predefined 'other' field from AGE_GROUP_FIELDS; added nanny i18n key to fix duplicate "Nursery / daycare" label; removed textAlign:center from input; added "Other" i18n key for field labels; added hover/press effects on ✕ delete button matching RemoveButton pattern in housing/transport | files: app/(onboarding)/children-costs.jsx, lib/locales/en.json

[2026-06-04] [AI] Children-costs layout rework: changed child name toggles from horizontal ScrollView to full-width stacked buttons (matching continue button width); restructured each field row from side-by-side to vertical stacking (input on top, frequency pills below); added "Add other cost" button with dashed border at end of each child's form (matching housing.jsx pattern); added addAnother i18n key to childrenCosts.q9 | files: app/(onboarding)/children-costs.jsx, lib/locales/en.json

[2026-06-04] [AI] Fixed children-costs field hints and frequency pill layout: added FIELD_I18N_MAP to map age-group field keys to correct i18n keys, added field label above each input, changed input from flex:1 to fixed 120px width so frequency pills have adequate space, updated placeholder to use amountPlaceholder | files: app/(onboarding)/children-costs.jsx

[2026-06-04] [AI] Added nav bar (back button + chapter label) and animated progress bar to all 12 onboarding splash screens (s2–s13); updated SplashScreen component to accept chapter/onBack/progress/progressLabel props matching QuestionScreen pattern | files: components/onboarding/SplashScreen.jsx, app/(onboarding)/s2-splash.jsx, app/(onboarding)/s3-splash.jsx, app/(onboarding)/s4-splash.jsx, app/(onboarding)/s5-splash.jsx, app/(onboarding)/s6-splash.jsx, app/(onboarding)/s7-splash.jsx, app/(onboarding)/s8-splash.jsx, app/(onboarding)/s9-splash.jsx, app/(onboarding)/s10-splash.jsx, app/(onboarding)/s11-splash.jsx, app/(onboarding)/s12-splash.jsx, app/(onboarding)/s13-splash.jsx

[2026-06-04] [AI] Fixed children-costs page: corrected i18n title key from `childrenCosts.title` to `childrenCosts.q9.title`, added proper helper text via `childrenCosts.q9.helper`, increased child toggle tab padding (pv:10→12, ph:16→20), enlarged frequency pill font (11→12) and padding (ph:8→12) | files: app/(onboarding)/children-costs.jsx

[2026-06-04] [AI] Created S5-S13 onboarding sections (Transport, Health Insurance, Children's Costs, Pets, Subscriptions, Other Regular Costs, Debts, Budget & Strategy, Review & Confirm) with full branching logic, per-member tabs, quick-add chips, collapsible review, and inline SVG splash screens | files: app/(onboarding)/s5-splash.jsx, app/(onboarding)/transport.jsx, app/(onboarding)/s6-splash.jsx, app/(onboarding)/health.jsx, app/(onboarding)/s7-splash.jsx, app/(onboarding)/children-costs.jsx, app/(onboarding)/s8-splash.jsx, app/(onboarding)/pets.jsx, app/(onboarding)/s9-splash.jsx, app/(onboarding)/subscriptions.jsx, app/(onboarding)/s10-splash.jsx, app/(onboarding)/other-costs.jsx, app/(onboarding)/s11-splash.jsx, app/(onboarding)/debts.jsx, app/(onboarding)/s12-splash.jsx, app/(onboarding)/budget.jsx, app/(onboarding)/s13-splash.jsx, app/(onboarding)/review.jsx

[2026-06-04] [AI] Registered all S5-S13 onboarding screens (s5-splash through review) in Stack navigator | files: app/(onboarding)/_layout.jsx

[2026-06-04] [AI] Updated housing.jsx to route to S5 Transport splash instead of dashboard after completion | files: app/(onboarding)/housing.jsx

[2026-06-04] [AI] Added EN/CS i18n keys for Sections 5-13 (Transport, Health Insurance, Children's Costs, Pets, Subscriptions, Other Regular Costs, Debts, Budget & Strategy, Review & Confirm) with full CZ translations | files: lib/locales/en.json, lib/locales/cs.json

[2026-06-04] [AI] Added JSDoc schema types for Transport, HealthInsurance, ChildrenCosts, Pets, Subscriptions, OtherCosts, Debts, Budget (with RolloverStrategy), and OnboardingState data models | files: lib/schema.js

[2026-06-03] [AI] Fixed QuestionScreen nav bar to maintain stable 56px height with persistent border; added smooth animated progress bar slide-down (600ms cubic-bezier) and fill bar animation (500ms) | files: components/onboarding/QuestionScreen.jsx

[2026-06-03] [AI] Fixed consent screen header height to match QuestionScreen nav bar (h-14 = 56px) for consistent transition | files: app/(onboarding)/consent.jsx

[2026-06-03] [AI] Centered question content vertically in QuestionScreen via justifyContent center on ScrollView | files: components/onboarding/QuestionScreen.jsx

[2026-06-03] [AI] Converted HamburgerMenu language selector from inline expand to animated dropdown with scale+opacity animation and chevron rotation | files: components/HamburgerMenu.jsx

[2026-06-03] [AI] Replaced dashboard tab bar with fully custom implementation using tabBar prop; added persistent selected-state pill background with useSegments() for active detection | files: app/(app)/_layout.jsx

[2026-06-03] [AI] Added mouse hover support (onHoverIn/onHoverOut) to tab bar buttons with lighter background than selected state | files: app/(app)/_layout.jsx

[2026-06-03] [AI] Changed tab bar hover/press effect to cover full rectangle with square corners (removed borderRadius and inset padding) | files: app/(app)/_layout.jsx

[2026-06-03] [AI] Added consistent 56px header bar to (app)/_layout wrapping all dashboard tabs; removed individual headers from dashboard, income, and goals screens | files: app/(app)/_layout.jsx, app/(app)/dashboard.jsx, app/(app)/income.jsx, app/(app)/goals.jsx

[2026-06-03] [AI] Centered progress bar content vertically within panel (balanced paddingTop/paddingBottom 12) | files: components/onboarding/QuestionScreen.jsx

[2026-06-03] [AI] Initial project setup with Expo + NativeWind; configured Tailwind with design system tokens | files: tailwind.config.js, babel.config.js, global.css, constants/colors.js

[2026-06-03] [AI] Created storage abstraction layer for localStorage/AsyncStorage to support Phase 1 data persistence | files: lib/storage.js

[2026-06-03] [AI] Implemented i18n system with EN/CS translations and context provider for language switching | files: lib/i18n.js, lib/locales/en.json, lib/locales/cs.json

[2026-06-03] [AI] Created finance utility functions (toMonthly, dailyAllowance, debtPayoff, formatCurrency) following DRY principle | files: lib/finance.js

[2026-06-03] [AI] Defined JSDoc data schema types for all storage structures to enforce type safety | files: lib/schema.js

[2026-06-03] [AI] Implemented root layout with onboarding gate routing logic - checks localStorage and redirects appropriately | files: app/_layout.jsx

[2026-06-03] [AI] Created onboarding flow with welcome screen featuring inline SVG illustration using design tokens | files: app/(onboarding)/_layout.jsx, app/(onboarding)/welcome.jsx

[2026-06-03] [AI] Built dashboard shell with 5-tab navigation (Dashboard, Costs, Budget, Alerts, Summary) and placeholder screens | files: app/(app)/_layout.jsx, app/(app)/dashboard.jsx, app/(app)/costs.jsx, app/(app)/budget.jsx, app/(app)/alerts.jsx, app/(app)/summary.jsx

[2026-06-03] [AI] Added language toggle and "Redo Setup" functionality to dashboard; included abstract pie chart SVG illustration | files: app/(app)/dashboard.jsx

[2026-06-03] [AI] Created comprehensive unit tests for i18n (translation, interpolation) and finance utilities (all calculation functions) | files: __tests__/lib/i18n.test.js, __tests__/lib/finance.test.js

[2026-06-03] [AI] Fixed NativeWind configuration by creating metro.config.js to enable Tailwind CSS processing | files: metro.config.js

[2026-06-03] [AI] Created QuestionScreen wrapper component for consistent onboarding question layout with validation | files: components/onboarding/QuestionScreen.jsx

[2026-06-03] [AI] Created OptionCard component for selectable option cards with icons and selection state | files: components/onboarding/OptionCard.jsx

[2026-06-03] [AI] Built consent screen with GDPR compliance checkbox - required before onboarding | files: app/(onboarding)/consent.jsx

[2026-06-03] [AI] Implemented household setup flow (Q1-Q2b) with conditional branching: household type, partner name, children count, and child details | files: app/(onboarding)/household.jsx

[2026-06-03] [AI] Updated welcome screen to navigate to consent instead of directly to dashboard | files: app/(onboarding)/welcome.jsx

[2026-06-03] [AI] Added EN/CS translations for consent and household setup screens with interpolation support | files: lib/locales/en.json, lib/locales/cs.json

[2026-06-03] [AI] Fixed layout width by adding max-w-2xl constraint to all onboarding screens for better readability on wide screens | files: components/onboarding/QuestionScreen.jsx, app/(onboarding)/consent.jsx

[2026-06-03] [AI] Fixed text node error by wrapping stepper buttons in Pressable components instead of using onPress on Text | files: app/(onboarding)/household.jsx

[2026-06-03] [AI] Removed emojis from Yes/No option cards for cleaner design | files: app/(onboarding)/household.jsx

[2026-06-03] [AI] Implemented custom back button handler in household flow to persist data and navigate between steps correctly | files: app/(onboarding)/household.jsx, components/onboarding/QuestionScreen.jsx

[2026-06-03] [AI] Added 18+ age group option for children to cover all age ranges | files: app/(onboarding)/household.jsx, lib/locales/en.json, lib/locales/cs.json

[2026-06-03] [AI] Created S2 splash screen for Section 2 (Location & Occupation) with compass SVG illustration using design token colors | files: app/(onboarding)/s2-splash.jsx

[2026-06-03] [AI] Implemented location screen (Q3) with searchable country dropdown (CZ priority), city text input, and auto-selected editable currency badge | files: app/(onboarding)/location.jsx

[2026-06-03] [AI] Implemented occupation screen (Q4 + Q4a) with 5 option cards for user and partner occupation, with conditional "Other" text input | files: app/(onboarding)/occupation.jsx

[2026-06-03] [AI] Registered new onboarding screens (s2-splash, location, occupation) in Stack navigator | files: app/(onboarding)/_layout.jsx

[2026-06-03] [AI] Updated household.jsx to navigate to S2 splash screen instead of dashboard after completion | files: app/(onboarding)/household.jsx

[2026-06-03] [AI] Added EN/CS i18n keys for Section 3 (Income) — splash, Q5, Q5a, Q5b, Q5c, Q5d with occupation-adaptive titles and frequency options | files: lib/locales/en.json, lib/locales/cs.json

[2026-06-03] [AI] Created S3 splash screen for Section 3 (Income) with piggy bank / savings SVG illustration using design token colors | files: app/(onboarding)/s3-splash.jsx

[2026-06-03] [AI] Implemented income screen (Q5 + Q5a + Q5b + Q5c + Q5d) with occupation-adaptive title, frequency selector with live monthly conversion, partner income branch, other income repeating rows, savings inputs, and financial goal toggle | files: app/(onboarding)/income.jsx

[2026-06-03] [AI] Registered new onboarding screens (s3-splash, income) in Stack navigator | files: app/(onboarding)/_layout.jsx

[2026-06-03] [AI] Updated occupation.jsx to navigate to S3 splash screen instead of dashboard after completion | files: app/(onboarding)/occupation.jsx

[2026-06-03] [AI] Fixed income input field layout — separated TextInput border from currency badge to avoid conflicting outlines and pure rectangle shape | files: app/(onboarding)/income.jsx

[2026-06-04] [AI] Added Housing data types (HousingType, HousingCostItem, Housing) to schema.js for Section 4 data model | files: lib/schema.js

[2026-06-04] [AI] Added EN/CS i18n keys for Section 4 (Housing) — splash, Q6, Q6a, Q6b, Q6c, Q6d, Q6e, Q6f, Q6h, Q6g with CZ pre-filled tax items | files: lib/locales/en.json, lib/locales/cs.json

[2026-06-04] [AI] Created S4 splash screen for Section 4 (Housing) with house SVG illustration using design token colors | files: app/(onboarding)/s4-splash.jsx

[2026-06-04] [AI] Implemented housing screen (Q6-Q6h) with full branching: renting (Q6a rent, Q6b utilities), own (Q6d mortgage toggle, Q6e payment, Q6f other costs), family (Q6h contributions), internet (Q6c), and government taxes (Q6g) with CZ pre-filled checkboxes | files: app/(onboarding)/housing.jsx

[2026-06-04] [AI] Registered new onboarding screens (s4-splash, housing) in Stack navigator | files: app/(onboarding)/_layout.jsx

[2026-06-04] [AI] Updated income.jsx to navigate to S4 splash screen instead of dashboard after completion | files: app/(onboarding)/income.jsx

[2026-06-04] [AI] Added frequency selector (Monthly/Annual pills) and smooth AnimatedRow add/remove animation to Q6g custom tax items in housing screen | files: app/(onboarding)/housing.jsx, lib/locales/en.json, lib/locales/cs.json

[2026-06-04] [AI] Made Q6b (utilities) optional/skippable — removed validation, added dashed "Skip" button; updated Q6a helper text to explain the rent/utilities split choice | files: app/(onboarding)/housing.jsx, lib/locales/en.json, lib/locales/cs.json

[2026-06-04] [AI] Fixed "React is not defined" runtime error — root cause was React.useState(false) in income.jsx where React wasn't imported (jsxImportSource: "nativewind" doesn't auto-import React); changed to destructured useState | files: app/(onboarding)/income.jsx

[2026-06-04] [AI] Added missing `import React from 'react'` to 15 JSX files using JSX without React import as preventive fix | files: app/_layout.jsx, app/(onboarding)/_layout.jsx, app/(onboarding)/welcome.jsx, app/(onboarding)/s2-splash.jsx, app/(onboarding)/s3-splash.jsx, app/(onboarding)/s4-splash.jsx, app/(app)/dashboard.jsx, app/(app)/income.jsx, app/(app)/costs.jsx, app/(app)/budget.jsx, app/(app)/alerts.jsx, app/(app)/summary.jsx, app/(app)/goals.jsx, components/onboarding/SplashScreen.jsx, components/onboarding/OptionCard.jsx

[2026-06-04] [AI] Refactored frequency pills in income.jsx "Net monthly salary" to use subtle rgba overlay pattern (matching dashboard tab bar) with hover/press/selected states covering full padding area; removed gap between pills for flush layout; increased pill height (paddingVertical 10→14) | files: app/(onboarding)/income.jsx

[2026-06-04] [AI] Fixed "Rendered more hooks than during the previous render" error by extracting frequency pill into separate component (not inside .map() callback within conditional render) | files: app/(onboarding)/income.jsx

[2026-06-04] [AI] Added hover/press effects to back button in QuestionScreen with expanded hit area (alignSelf stretch, paddingHorizontal 20, full 56px height) matching top/left screen edges; restored right margin for chapter text | files: components/onboarding/QuestionScreen.jsx

[2026-06-04] [AI] Created reusable PillToggle component with configurable padding/font/fontWeight using the same rgba overlay pattern (selected=0.08, hovered=0.04, pressed=0.06, default=transparent) with borderRadius:0 for full-rectangle coverage | files: components/onboarding/PillToggle.jsx

[2026-06-04] [AI] Applied PillToggle across all onboarding screens — replaced inline Pressable patterns in income.jsx (Q5 frequency, Q5a frequency, Q5b Yes/No, Q5b other income rows, Q5d Yes/No) and housing.jsx (Q6c Yes/No, Q6c frequency, Q6d Yes/No, Q6f Yes/No, Q6h Yes/No, Q6g custom tax frequency) | files: app/(onboarding)/income.jsx, app/(onboarding)/housing.jsx

[2026-06-04] [AI] Added `darker` prop to PillToggle (selected=0.12, hovered=0.07, pressed=0.09) for Yes/No toggles; applied to all Yes/No pills in income.jsx (Q5b, Q5d) and housing.jsx (Q6c, Q6d, Q6f, Q6h) | files: components/onboarding/PillToggle.jsx, app/(onboarding)/income.jsx, app/(onboarding)/housing.jsx

[2026-06-04] [AI] Restructured Q5b other income rows to stack vertically: Amount (top, full width) → frequency pills (middle, full width) → label + remove (bottom) | files: app/(onboarding)/income.jsx

[2026-06-04] [AI] Darkened "Add another" button in Q5b — border #E4E2DC→#C4C2BC, text #7A7770→#5C5A55, pressed bg #F4F3EF→#E8E6E0 | files: app/(onboarding)/income.jsx

[2026-06-04] [AI] Added borderRadius prop to PillToggle (default 0); wrapped all pill groups in containers with borderRadius:10 + overflow:hidden so outer edges are rounded like app inputs while pills remain flush | files: components/onboarding/PillToggle.jsx, app/(onboarding)/income.jsx, app/(onboarding)/housing.jsx

[2026-06-04] [AI] Increased Yes/No darker selection color from 0.12 to 0.18 for better visibility | files: components/onboarding/PillToggle.jsx

[2026-06-04] [AI] Created RemoveButton component with red-tinted rgba hover/press effects for ✕ delete buttons in Q5b other income rows | files: app/(onboarding)/income.jsx

[2026-06-04] [AI] Removed overflow:hidden from AnimatedSlideIn in income.jsx to prevent clipping of native TextInput focus outlines (blue ring trimmed on sides/bottom in Q5d) | files: app/(onboarding)/income.jsx

[2026-06-04] [AI] Removed overflow:hidden from AnimatedSlideIn and AnimatedRow in housing.jsx to prevent clipping of native TextInput focus outlines (blue ring trimmed on top/sides in Q6c internet amount) | files: app/(onboarding)/housing.jsx

[2026-06-04] [AI] Standardized skip button (Q6b) and all "add another" buttons (Q6f, Q6h) in housing.jsx to darker colors matching income.jsx — border #E4E2DC→#C4C2BC, text #7A7770→#5C5A55, pressed bg #F4F3EF→#E8E6E0; skip button bg #F4F3EF→#E8E6E0 | files: app/(onboarding)/housing.jsx

[2026-06-04] [AI] Darkened "Add custom item" button in Q6g (Government & city charges) to match other "add another" buttons; replaced plain ✕ Pressable with RemoveButton component with hover/press effects | files: app/(onboarding)/housing.jsx

[2026-06-04] [AI] Fixed fuel type translation key mismatch in transport.jsx — removed extra `.fuel` segment from key path; aligned FUEL_TYPES array with locale keys (replaced 'other' with 'lpg', 'cng') | files: app/(onboarding)/transport.jsx

[2026-06-04] [AI] Removed `common.perMonth` text from transport.jsx (key doesn't exist in any locale); replaced fuel type pills with PillToggle component for consistent styling with frequency pills | files: app/(onboarding)/transport.jsx

[2026-06-04] [AI] Made fuel cost label dynamic — shows "charging cost" text when electric fuel type is selected; added `costLabelElectric` translation key to en.json and cs.json | files: app/(onboarding)/transport.jsx, lib/locales/en.json, lib/locales/cs.json

[2026-06-04] [AI] Replaced emoji-based Yes/No buttons in transport.jsx Q7 with PillToggle component for consistent styling | files: app/(onboarding)/transport.jsx

[2026-06-04] [AI] Standardized spacing between content and Continue button across all onboarding screens — increased children wrapper marginBottom from 24 to 32 in QuestionScreen.jsx | files: components/onboarding/QuestionScreen.jsx

[2026-06-04] [AI] Redesigned Government and city charges section (Q6g) in housing.jsx — replaced checkbox-based design with card-based layout using PillToggle Yes/No toggles and amount TextInputs | files: app/(onboarding)/housing.jsx

[2026-06-04] [AI] Fixed shrunk Yes/No toggles on Government charges cards by adding minWidth: 120 to toggle container and increasing font size from 12 to 13 | files: app/(onboarding)/housing.jsx

[2026-06-04] [AI] Added multi-vehicle support to transport onboarding flow — vehicle counters for passenger/motorcycle/bicycle categories (Q7Count), per-vehicle iteration through Q7a-Q7d with sub-headers, bicycle shortcut to simplified maintenance screen (Q7bicycle), converted all custom Pressable Yes/No toggles to PillToggle, updated data model with vehicles[] array and backward-compatible flat fields | files: app/(onboarding)/transport.jsx, lib/locales/en.json, lib/locales/cs.json

[2026-06-04] [AI] Added missing translation keys — q7Count section (vehicle category labels, helper, validation), vehicleLabel under q7a-q7d, q7bicycle section, q7.validation, common frequency keys (daily, weekly, monthly, annual) to both en.json and cs.json | files: lib/locales/en.json, lib/locales/cs.json

[2026-06-04] [AI] Fixed inconsistent spacing between content and Continue button across all onboarding screens — moved Continue and Skip buttons outside ScrollView into a fixed bottom container so they stay at the same screen position regardless of content height; removed justifyContent:center from ScrollView content container | files: components/onboarding/QuestionScreen.jsx

[2026-06-04] [AI] Fixed missing translation key `addMaintenance` → `addItem` in transport.jsx Q7d "Planned maintenance items" section; added missing placeholder translations (maintenanceDescPlaceholder, maintenanceCostPlaceholder, maintenanceDatePlaceholder) to en.json and cs.json; restyled "+ Add item" button from plain text link to dashed border pattern matching housing.jsx | files: app/(onboarding)/transport.jsx, lib/locales/en.json, lib/locales/cs.json

[2026-06-04] [AI] Added RemoveButton component with red-tinted rgba hover/press effects to maintenance item cards in transport.jsx Q7d (matching housing.jsx pattern) | files: app/(onboarding)/transport.jsx

[2026-06-04] [AI] Fixed bicycles showing "Fuel and running costs" screen — added category check in q7Count handler to skip fuel for bicycles; also fixed multi-vehicle iteration so bicycles at any position skip fuel/insurance/parking and go straight to maintenance | files: app/(onboarding)/transport.jsx

[2026-06-04] [AI] Created reusable DatePicker component with Modal-based dropdown selectors for Day, Month (full textual month names from locale), and Year; supports `showDay` prop to toggle between DD/MM/YYYY and MM/YYYY formats | files: components/onboarding/DatePicker.jsx

[2026-06-04] [AI] Added month names (January–December) and date picker labels (Day/Month/Year) to en.json and cs.json locale files | files: lib/locales/en.json, lib/locales/cs.json

[2026-06-04] [AI] Replaced all date TextInputs across 8 onboarding screens with DatePicker component — transport.jsx (insuranceRenewalDate, motDate, maintenanceItems.date, ptValidUntil), housing.jsx (mortgageEndDate, q6f dueDate, q6h dueDate), health.jsx (startDate, endDate), income.jsx (goalDate), debts.jsx (promoEndDate), pets.jsx (insuranceRenewalDate), subscriptions.jsx (renewalDate), other-costs.jsx (dueDate) | files: app/(onboarding)/transport.jsx, app/(onboarding)/housing.jsx, app/(onboarding)/health.jsx, app/(onboarding)/income.jsx, app/(onboarding)/debts.jsx, app/(onboarding)/pets.jsx, app/(onboarding)/subscriptions.jsx, app/(onboarding)/other-costs.jsx

[2026-06-04] [AI] Added descriptive labels above DatePicker fields that were missing them — maintenanceItems.date (transport), q6f/q6h dueDate (housing), insuranceRenewalDate (pets), renewalDate (subscriptions), dueDate (other-costs); added corresponding translation keys to en.json and cs.json | files: app/(onboarding)/transport.jsx, app/(onboarding)/housing.jsx, app/(onboarding)/pets.jsx, app/(onboarding)/subscriptions.jsx, app/(onboarding)/other-costs.jsx, lib/locales/en.json, lib/locales/cs.json

[2026-06-04] [AI] Changed vehicle insurance renewal date DatePicker to show day dropdown (showDay removed, defaults to true) since insurance renewals are specific calendar dates; MOT/STK expiry remains month/year only | files: app/(onboarding)/transport.jsx

[2026-06-04] [AI] Added `react-native-svg` devDependency for inline SVG illustrations across splash screens and dashboard icons | files: package.json

[2026-06-04] [AI] Created Jest test infrastructure with react-native preset, mock setup for AsyncStorage and expo-router, and coverage configuration targeting lib/ and components/ | files: jest.config.js, jest.setup.js

[2026-06-04] [AI] Created README.md documenting Phase 1 Increment 1 — project foundation, i18n system, storage layer, onboarding flow (S1-S13), dashboard shell, and test suite | files: README.md

[2026-06-04] [AI] Added goals tab screen to dashboard tab bar alongside existing dashboard, income, costs, budget, alerts, and summary tabs | files: app/(app)/goals.jsx

[2026-06-04] [AI] Created app.json with Expo configuration for PocketOS project metadata, splash screen, and platform settings | files: app.json

[2026-06-04] [AI] Replaced bicycle monthly cost input with planned maintenance pattern (toggle + maintenance items with description, cost, date) matching passenger/motorcycle UX; removed bicycleCost field; updated en.json and cs.json locale keys for q7bicycle section | files: app/(onboarding)/transport.jsx, lib/locales/en.json, lib/locales/cs.json

[2026-06-04] [AI] Added missing validUntilLabel translation key to en.json and cs.json for public transport pass validity date label | files: lib/locales/en.json, lib/locales/cs.json

[2026-06-04] [AI] Removed showDay={false} from public transport pass valid-until DatePicker so day dropdown is shown for specific expiry dates | files: app/(onboarding)/transport.jsx

[2026-06-04] [AI] Added missing health translation keys (title, helper, you, child, coveredByEmployer, confirmCoverage, confirmed, coverageType, payPrivately, premiumRequired, ongoing, fixed) at onboarding.health.* level — code references these at top level but they were only nested under q8 | files: lib/locales/en.json, lib/locales/cs.json

[2026-06-04] [AI] Made family member tab pills in health screen full-width (flex: 1, equal share) instead of content-width, matching continue button width; removed horizontal ScrollView wrapper | files: app/(onboarding)/health.jsx

[2026-06-04] [AI] Added "Skip" option alongside "Confirm coverage" in health screen for both employee and non-employee branches; handleContinue now accepts skipped members; uses common.skip translation key | files: app/(onboarding)/health.jsx

[2026-06-04] [AI] Fixed health screen title/helper interpolation — now passes currentMember.label as {{name}} parameter to t('onboarding.health.title') and t('onboarding.health.helper') so "Health insurance for {{name}}" renders correctly (e.g. "Health insurance for You", "Health insurance for John") | files: app/(onboarding)/health.jsx

[2026-06-04] [AI] Unified health insurance screen — replaced two-branch UI (employee vs non-employee) with three stacked coverage options for all members using OptionCard component (matching household setup UI): "Covered by employer" (green info note), "Pay privately" (premium form), and "Skip"; selection immediately resolves the member (no confirm button or resolved badge); employer info note and private form wrapped in AnimatedSlideIn for smooth transitions; added common.skipped translation key; removed unused occupation state variable and custom coveragePillStyle helpers | files: app/(onboarding)/health.jsx, lib/locales/en.json, lib/locales/cs.json

[2026-06-04] [AI] Fixed private coverage form in health screen — changed premium label from "Monthly premium" to "Premium" (frequency is specified below); added missing common.quarterly translation key to en.json and cs.json; removed showDay={false} from fixed end date DatePicker so day dropdown is shown; repositioned DatePicker modal dropdown from center to top-left (marginTop: 120) so options list appears closer to the trigger | files: app/(onboarding)/health.jsx, components/onboarding/DatePicker.jsx, lib/locales/en.json, lib/locales/cs.json

[2026-06-04] [AI] Added day dropdown to start date DatePicker in health screen private coverage form (removed showDay={false}); added "Custom" end date option with duration (months) TextInput that auto-calculates end date from start date + months (user can still edit the calculated date); rewrote DatePicker Dropdown component to use absolute positioning (top: '100%') below each trigger instead of a centered Modal — each dropdown's options list now appears directly below its own trigger with backdrop for outside-tap dismissal | files: app/(onboarding)/health.jsx, components/onboarding/DatePicker.jsx

[2026-06-04] [AI] Restructured private coverage form in health screen — changed custom frequency label to "How many months?"; moved start date (with day/month/year) before contract type; changed "End date" label to "Contract Type"; removed "Custom" end date pill (kept only Ongoing / Fixed end date); when "Fixed end date" is selected with custom frequency, end date auto-fills from start date + custom frequency months | files: app/(onboarding)/health.jsx, lib/locales/en.json, lib/locales/cs.json

[2026-06-04] [AI] Fixed DatePicker Dropdown overlay rendering — rewrote Dropdown to use Modal with measureInWindow for precise positioning near each trigger; backdrop now covers full screen via Modal's transparent overlay, preventing z-index clipping inside nested AnimatedSlideIn wrappers | files: components/onboarding/DatePicker.jsx

[2026-06-04] [AI] Added "Custom" frequency option to premium frequency pills in health screen private coverage form (Monthly / Quarterly / Annual / Custom); added common.custom and customFrequencyPlaceholder translation keys to en.json and cs.json; custom frequency shows "How many months?" numeric TextInput wrapped in AnimatedSlideIn | files: app/(onboarding)/health.jsx, lib/locales/en.json, lib/locales/cs.json

[2026-06-04] [AI] Fixed auto-fill end date calculation in health screen — calcEndDate now deducts 1 day from calculated date (e.g. start 15/01/2026 + 3 months = 14/04/2026); end date DatePicker now shows for both Ongoing and Fixed contract types when custom frequency is active (not just Fixed), since even ongoing contracts have end dates that auto-renew | files: app/(onboarding)/health.jsx

[2026-06-04] [AI] Enhanced health screen option cards with smooth collapse/expand animation — when user selects an option, the other two cards smoothly slide+fade away to save space; clicking the selected option again deselects it and reveals all three; rewrote AnimatedSlideIn to use onLayout-measured real height with custom cubic-bezier easing (0.4, 0, 0.2, 1) at 500ms for a more settled, organic feel instead of fixed maxHeight interpolation | files: app/(onboarding)/health.jsx

[2026-06-04] [AI] Fixed animation jank when switching between family member tabs in health screen — extracted option cards into persistent renderOptionCards() that stays mounted across tab switches so AnimatedSlideIn refs survive; added prevVisible guard to prevent redundant animation triggers on re-render | files: app/(onboarding)/health.jsx

[2026-06-04] [AI] Fixed end date DatePicker not appearing in health screen private coverage form — relaxed visibility condition from `frequency === 'custom' && startDate && customFrequencyMonths` to just `frequency === 'custom'` so the end date picker shows as soon as custom frequency is selected; removed Notes (optional) TextInput section | files: app/(onboarding)/health.jsx

[2026-06-04] [AI] Fixed Continue button navigation in health screen — now finds the next unresolved member (not confirmed/skipped) instead of simply incrementing the tab index, so toggling between already-filled members doesn't skip over unresolved ones | files: app/(onboarding)/health.jsx
