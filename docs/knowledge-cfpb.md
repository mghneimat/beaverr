# Knowledge Extraction — CFPB (Consumer Financial Protection Bureau)
## consumerfinance.gov — Research, Guidelines, and Financial Well-Being Framework
### Source document for AI grounding — regulatory benchmarks and empirically-derived standards

---

## CHUNK 1 — What CFPB Is and Why It Belongs in This Knowledge Base

The Consumer Financial Protection Bureau is a US government agency, created in 2010 under the Dodd-Frank Act, with a mandate to protect consumers in the financial marketplace and to research and promote financial well-being. It is the only source in this knowledge base that is government-derived rather than authored by a private individual with a personal philosophy.

This distinction matters for how the AI should use it. The four books in this knowledge base (Sethi, Dacyczyn, Robin/Dominguez, Stanley/Danko) each represent a point of view — a framework developed by one or two people based on their research, experience, and values. The CFPB material represents regulatory consensus, peer-reviewed research findings, and legal standards used by lenders and financial institutions. When the AI cites a DTI threshold or an emergency fund benchmark from this source, it is citing the standard that banks, mortgage lenders, and government bodies actually use — not one author's opinion.

For a household budgeting application operating in the EU, the CFPB is a US institution and its specific legal rules (qualified mortgage standards, credit reporting law) do not apply directly. However, its research-derived benchmarks — DTI ratios, emergency fund adequacy, the financial well-being framework — are derived from large-scale empirical research and represent the most rigorously validated quantitative standards available in personal finance. They apply as guidance regardless of jurisdiction.

The AI should cite CFPB benchmarks when it needs authoritative, defensible numbers — not "some experts recommend" but "the standard used by major lenders is." This gives advice an objective grounding that the philosophical frameworks of the other books cannot provide on their own.

---

## CHUNK 2 — The CFPB Definition of Financial Well-Being: The Four Elements

The CFPB conducted extensive consumer research — in-depth interviews with hundreds of adults across the country — to produce a formal, consumer-driven definition of financial well-being. This definition is the foundation of all CFPB financial health measurement work.

Financial well-being is defined as a state in which a person:

**1. Has control over day-to-day, month-to-month finances**
The ability to manage current obligations without stress or crisis — paying bills on time, not running out of money before the end of the month, not living paycheck to paycheck. This is the present security element. It is notably subjective — it measures whether the person feels in control, not just whether the numbers technically work.

**2. Has the capacity to absorb a financial shock**
The existence of a buffer — savings, available credit, or other resources — that can absorb an unexpected expense or income disruption without causing the household to miss essential payments or take on high-interest emergency debt. This is the present resilience element.

**3. Is on track to meet financial goals**
Progress toward defined future objectives — retirement, home purchase, children's education, debt freedom. This is the future security element. Notably, the CFPB framework does not define what the goals should be — only that the person has them and is making progress toward them.

**4. Has the financial freedom to make the choices that allow them to enjoy life**
The existence of discretionary margin — money available for non-essential spending that reflects personal values and preferences. This is the future freedom element. It reflects the recognition that a life of pure financial obligation with no margin for enjoyment is not well-being even if the numbers balance.

**How the AI should use this framework:**

These four elements provide a structured diagnostic when a user is describing their financial situation in subjective terms — "I feel stressed about money," "I feel like I'm never getting ahead," "I feel okay but not great." The AI can map the user's description onto which of the four elements is missing:

- Stress about bills, running out before month-end → Element 1 (present control) is the problem
- Fear of unexpected expenses, no safety net → Element 2 (shock absorption) is the problem  
- No sense of financial progress, no goals → Element 3 (future security) is the problem
- No money for anything enjoyable, all obligation → Element 4 (freedom of choice) is the problem

This framework is also useful because it validates that financial well-being is not purely objective. Two people with identical numbers can have very different financial well-being — one feels secure because their personality and life context make their numbers feel manageable; another feels chronic anxiety about the same numbers because their context or personality creates different reference points. The AI should acknowledge this and not treat numerical benchmarks as the complete picture.

---

## CHUNK 3 — Debt-to-Income Ratio (DTI): The Primary Debt Benchmark

DTI is the most important single number in the CFPB's debt health framework, and the most widely used quantitative benchmark in mortgage lending, credit assessment, and financial health evaluation globally.

### What DTI measures
DTI = Total monthly debt payments ÷ Gross monthly income (pre-tax)

Monthly debt payments included in DTI: mortgage or rent, car loans, student loans, personal loans, credit card minimum payments, child support or alimony obligations.

Not included: groceries, utilities, insurance premiums (unless they are loan-linked), mobile phone bills, streaming subscriptions. DTI measures only the burden of contracted debt obligations, not total spending.

### The DTI thresholds — what they actually mean

**Below 20% — Excellent**
Very low debt burden. High financial flexibility. Strong candidacy for any credit product. The household has significant income margin available for savings, investing, and spending after all debt obligations are met.

**20–35% — Healthy to manageable**
The standard safe zone. Household is carrying debt but has sufficient margin to manage comfortably. Most mortgage lenders consider anything below 36% as "manageable" in the context of a new mortgage application.

**36–43% — Caution zone**
Debt burden is meaningfully elevated. The 36% threshold is the conventional back-end ratio limit used in the 28/36 rule (see Chunk 4). Above 36%, getting mortgage approval becomes more conditional — lenders look for compensating factors (credit score, reserves). At 43%, the original CFPB Qualified Mortgage rule threshold, approval for many loan types becomes significantly harder.

**43–50% — High risk**
DTI in this range signals that a large share of income is committed to debt service. Lenders typically require strong compensating factors to approve new credit. The household has very limited financial margin — an income interruption or unexpected expense has a high probability of causing missed payments.

**Above 50% — Crisis level**
More than half of gross income is consumed by debt payments before tax. This is a structural financial emergency, not a budgeting problem. The household cannot realistically service this debt load without income growth, significant debt restructuring, or both.

### The front-end ratio
The front-end ratio measures only housing costs (rent or mortgage principal, interest, property taxes, and insurance) as a percentage of gross monthly income. The standard safe threshold is **28%** — the "28" in the 28/36 rule. This is the standard used by conventional mortgage lenders.

Front-end above 30% means housing is consuming more than a third of gross income — a meaningfully elevated housing burden. Front-end above 35% of gross is the threshold at which housing is absorbing so much income that other financial goals become very difficult to fund.

### How the AI should apply DTI
Calculate DTI from the user's data whenever they have any debt tracked in the app. State it explicitly as a percentage. Map it to the threshold it falls in. Be concrete about what that threshold means practically: "At 44% DTI you would likely be declined for a mortgage if you applied today" is actionable. "Your debt is high" is not.

The AI should also calculate the front-end ratio separately for users whose housing cost is a significant portion of their total debt burden — this isolates housing as a specific variable rather than hiding it inside total DTI.

---

## CHUNK 4 — The 28/36 Rule: The Standard Housing and Debt Affordability Guideline

The 28/36 rule is the most widely cited single financial guideline in mortgage lending. It originated in conventional underwriting practice and has been adopted as a standard reference point by the CFPB and virtually all major lenders.

**Front-end: Housing costs ≤ 28% of gross monthly income**
Housing costs defined as: rent or mortgage payment (principal + interest), property taxes, homeowner's or renter's insurance, and any homeowner association fees. This should not exceed 28% of gross monthly income — income before taxes.

**Back-end: Total debt ≤ 36% of gross monthly income**
All monthly debt obligations including housing plus car loans, student loans, credit card minimums, personal loans, child support. The combined total should not exceed 36% of gross monthly income.

### Why gross income is used rather than take-home
All CFPB and lender DTI benchmarks use gross (pre-tax) income as the denominator, not take-home pay. This is important because it means the safe thresholds look higher relative to what actually reaches a person's account. A household earning 100,000 Kč gross per month may take home 75,000 Kč after tax and social contributions. The 28% housing guideline on gross income = 28,000 Kč on gross = 37% of actual take-home. The AI should clarify which basis it is using whenever quoting these thresholds.

For practical household budgeting purposes (as opposed to mortgage qualification), it is often more meaningful to apply the ratios to take-home income — the money the household actually has available. The AI should make this clear: "Mortgage lenders use gross income for these calculations. For your day-to-day budget, I'll use your take-home income, which gives a clearer picture of what's actually available."

### The 28/36 rule's limitations
The rule was designed in an era of different housing market conditions. In high cost-of-living cities — Prague, Brno, London, Amsterdam — housing costs at 28% of gross income may simply not be achievable for most households. The AI should acknowledge this context explicitly rather than flagging all users in expensive cities as having a housing problem. The question to ask is: "Given that housing in this city costs what it costs, is the rest of the household budget structurally viable — or is the housing cost creating a cascade that prevents savings, investment, and emergency buffer building?"

---

## CHUNK 5 — Emergency Fund Standards: The Research-Backed Benchmarks

The CFPB has produced some of the most rigorous research on emergency savings of any institution, including a major study linking emergency savings levels to credit outcomes, debt delinquency rates, and financial well-being scores across thousands of households. The findings are striking enough to be treated as foundational rather than aspirational.

### The headline finding
40% of consumers with no emergency savings have past-due debt. This drops to 19% for consumers with some savings (less than a month of income), and further to 5% for consumers with at least a month of income saved for emergencies. The protective effect of even a small emergency fund is dramatic and empirically validated.

The CFPB also found that 63% of Americans do not have even a month of income saved specifically for emergencies — making this the most common single gap in household financial resilience across the population.

### The standard benchmarks
**Minimum viable: 1 month of essential fixed expenses**
Even this level reduces past-due debt rates by more than half compared to having nothing. The AI should treat reaching this threshold as a meaningful milestone, not just a starting point.

**Standard recommendation: 3 months of essential fixed expenses**
Appropriate for dual-income households with stable employment. The 3-month threshold is widely regarded as the practical minimum for adequate resilience. Below this, a single income disruption of more than a month creates a high probability of missed payments.

**Recommended: 6 months of essential fixed expenses**
Appropriate for single-income households, self-employed individuals, commission-based earners, contract workers, and anyone with variable or unpredictable income. The 6-month buffer provides adequate time to find new income or restructure if the primary income source disappears.

**Extended: 12+ months of essential expenses**
Appropriate for retirees, people with significant health risk, or households with highly specialized income where re-employment would take longer than 6 months. Not the standard target for working-age households.

### What counts as "essential fixed expenses" in the calculation
The emergency fund covers only what must be paid to maintain basic functioning: rent or mortgage, utilities, basic groceries, minimum debt payments, health insurance, and essential transport. It does not need to cover discretionary spending, subscriptions, dining out, or lifestyle costs that could be eliminated in an emergency. The AI should calculate the actual emergency fund target from the user's fixed costs data, in absolute currency terms — not as an abstract "3–6 months" guideline. "Your minimum emergency fund target is 90,000 Kč based on your fixed costs of 30,000 Kč/month" is actionable. "You should have 3 months of savings" is not.

### The starter savings insight
CFPB research indicates that even small amounts of savings — the equivalent of $2,000 or slightly above — provide measurable protection against financial hardship and reduce delinquency rates significantly. For users who find the full 3-month target overwhelming, the AI should present staged milestones: first reach 25,000 Kč (a meaningful buffer against small unexpected expenses), then build toward the full 3-month target. The habit of saving matters at least as much as the absolute amount, especially early on.

---

## CHUNK 6 — Credit Utilisation: The Credit Health Benchmark

Credit utilisation is the ratio of credit card balances currently owed to the total credit card limit available across all accounts. It is one of the most heavily weighted factors in credit scoring and a useful indicator of financial stress when elevated.

**The standard benchmarks:**
- **Below 10%:** Excellent. Demonstrates credit discipline and provides maximum positive impact on credit score.
- **10–30%:** Good. Within the range that most credit scoring models consider healthy. Generally no negative credit impact.
- **30–50%:** Caution. Beginning to signal credit dependency. May start to reduce credit score. Indicates a household is regularly carrying a meaningful balance.
- **Above 50%:** Elevated risk. Strong signal that credit cards are being used to bridge income shortfalls or fund spending that income does not cover.
- **Near or at 100% (maxed out):** Immediate red flag. Indicates the household is using all available credit — a strong predictor of payment difficulty and credit score damage.

The AI should flag credit utilisation whenever credit card debt appears in the user's data. If balances are available, calculating utilisation and mapping it to these thresholds gives an immediate, concrete signal about whether credit card debt is a behaviour choice (low utilisation, sometimes carries a balance for convenience) or a structural dependency (high utilisation, credit is being used to sustain the lifestyle the income does not support).

---

## CHUNK 7 — Income Shock Resilience: The CFPB's Financial Fragility Framework

CFPB research has consistently documented what it calls financial fragility — the condition of a household whose financial position would be immediately destabilised by a common, foreseeable life event. Financial fragility is distinct from poverty: a household can be earning a reasonable income and still be financially fragile.

### Fragility indicators the AI should identify
**Cannot cover one month of expenses from savings:** The most basic fragility threshold. Means any income interruption lasting more than a few weeks creates a crisis immediately.

**Would use high-cost credit for a moderate unexpected expense (500–1,000 Kč level):** Indicates the household has no buffer and treats credit cards or personal loans as the emergency fund. This is extremely expensive — carrying a balance at 20%+ APR is a significant ongoing cost.

**Has no cushion between income and regular obligations:** Income covers expenses but nothing more. One missed paycheck or one unexpected bill immediately creates a shortfall that cascades into late payments, fees, and penalty interest.

**Has carried a credit card balance for more than 3 consecutive months:** A persistent balance — not a one-off month — indicates the household is spending more than its income sustains. The balance is growing unless specifically addressed.

**Making only minimum payments on credit cards:** Minimum payments are typically 1–2% of the balance. At this rate, a significant balance takes years or decades to pay off, and the total interest paid can exceed the original balance. This is a structural trap, not a short-term management tool.

### How the AI should address fragility
When fragility indicators are present, the immediate priority is building a minimum buffer before any other financial optimisation. There is no point in discussing investment allocation, subscription cost-per-use, or retirement planning if an income interruption next month would cause the household to miss rent or utilities. The AI should sequence advice accordingly: fragility first, optimisation second.

---

## CHUNK 8 — Financial Goal Setting: CFPB's Evidence-Based Approach

CFPB research on financial capability consistently finds that goal-setting is one of the highest-leverage activities for improving financial outcomes — more so than financial literacy or knowledge alone. People who have specific, written, measurable financial goals consistently make better financial decisions and build more savings than people who have the same financial knowledge but no defined goals.

The research supports specific-goal superiority over generic intention: "save 5,000 Kč per month for an emergency fund of 90,000 Kč" produces better outcomes than "save more money." The specificity creates a target, makes progress visible, and makes decision points concrete ("does buying this thing make it harder to hit my 5,000 Kč target this month?").

### Goal categories the CFPB framework identifies as most common and impactful
**Short-term (under 1 year):** Emergency fund building, paying off a specific debt, saving for a specific purchase, clearing a credit card balance.

**Medium-term (1–5 years):** Home down payment, car replacement fund, education costs, wedding, significant home repair reserve.

**Long-term (5+ years):** Retirement funding, children's education, financial independence.

### How the AI should use this in the context of Beaverr
Beaverr already has savings goals and stash jars — this is the correct architectural implementation of CFPB goal-setting research. The AI should reinforce the goal structure rather than advising around it. When a user has named, funded savings goals, the AI should affirm this as the single highest-impact financial behaviour they can sustain. When a user has no savings goals, establishing one specific goal with a number and a timeline should be the first action item recommended — before any other financial advice.

---

## CHUNK 9 — What CFPB Adds That the Other Books Miss

**Regulatory legitimacy and defensibility.** The other four books are authoritative — they are well-researched and well-regarded — but they are one perspective each. CFPB benchmarks are derived from large-scale peer-reviewed research and are used by financial institutions as legal standards. When the AI needs to give a user a number they can take to a bank conversation, a mortgage application, or a financial adviser appointment, CFPB benchmarks are the ones to use.

**The financial fragility lens.** None of the four books focus specifically on the population that is one emergency away from crisis — the employed, moderately-earning household that looks stable but has no buffer. The CFPB research on emergency savings, shock resilience, and financial fragility is the most practically important content in the knowledge base for this demographic, which is extremely common.

**The definition of financial well-being as a four-element framework.** This gives the AI a structured way to decode subjective financial distress — turning "I feel stressed about money" into a diagnosis of which element is missing. No other book in this knowledge base provides this.

**Income shock and credit health monitoring.** DTI, credit utilisation, and fragility indicators give the AI concrete numbers to compute from the user's data and map to defined risk thresholds. These are not philosophical positions — they are measurable quantities with empirically validated threshold effects.

---

## CHUNK 10 — When to Apply CFPB Frameworks and When Not To

**Apply CFPB frameworks when:**
- A user has debt and the AI needs to give a concrete, defensible risk assessment — compute DTI and map it to thresholds
- A user is asking about housing affordability — use the 28/36 rule and explain the gross vs. take-home distinction
- A user has no emergency fund or a very small one — use the fragility research to explain why even a small buffer matters enormously
- A user is asking whether their financial position is "okay" in objective terms — the four-element well-being framework gives a structured diagnostic
- A user's financial distress is about shock risk rather than ongoing spending — the emergency savings framework is the right tool
- A user asks how much emergency savings they need — compute it in absolute terms from their fixed costs data

**Do not lead with CFPB frameworks when:**
- A user needs motivational reframing or values alignment — reach for Robin/Dominguez (life energy, fulfillment curve) instead
- A user needs practical tactics for reducing spending — reach for Dacyczyn (cost-per-use, category analysis) instead
- A user needs a system for allocating their income — reach for Sethi (Conscious Spending Plan) instead
- A user wants to benchmark their long-term wealth trajectory — reach for Stanley/Danko (PAW formula) instead

**How CFPB fits in the overall framework:**
CFPB provides the objective, numerical, regulatory layer that grounds the advice from the other four books in defensible standards. The AI should think of it this way: the four books tell the user *what to do and why*; the CFPB tells the AI *what the numbers mean* when it looks at the data. It is the measurement layer that sits underneath the advice layer.

A complete assessment of a user's financial position draws on all five sources: Dacyczyn for category-level tactics if income is tight; Robin/Dominguez for values alignment if the user is dissatisfied despite adequate income; Sethi for system design if the user needs an allocation framework; Stanley/Danko for long-term trajectory benchmarking; and CFPB for the objective numerical health indicators (DTI, emergency fund adequacy, fragility flags, credit utilisation) that give any of the above advice its grounding in measurable reality.
