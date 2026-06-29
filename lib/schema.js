/**
 * Data schema definitions (JSDoc types)
 * Single source of truth for all storage structures
 */

/**
 * @typedef {'solo' | 'partner' | 'single_parent'} HouseholdType
 */

/**
 * @typedef {'0-2' | '3-5' | '6-15' | '16-18'} AgeGroup
 */

/**
 * @typedef {Object} Child
 * @property {string|null} displayName - Optional display name
 * @property {AgeGroup} ageGroup - Age group category
 */

/**
 * @typedef {Object} Consent
 * @property {boolean} accepted - Whether the user accepted data-processing terms
 * @property {string} acceptedAt - ISO timestamp when consent was given
 */

/**
 * Profile fields saved locally until email confirmation allows sign-in.
 * @typedef {Object} PendingSignUp
 * @property {string} firstName
 * @property {string} [lastName]
 * @property {string} username
 * @property {string} countryCode
 * @property {string} currency
 * @property {string} language
 */

/**
 * @typedef {Object} Household
 * @property {HouseholdType} type - Household type
 * @property {string|null} [displayName] - Primary account holder display name (used in UI copy)
 * @property {string|null} partnerName - Partner's display name (if applicable)
 * @property {Child[]} children - Array of children
 */

/**
 * @typedef {Object} ResidencePermit
 * @property {import('../lib/residencePermits').ResidencePermitType} type
 * @property {string} endDate - DD/MM/YYYY
 * @property {number} renewalCost - Estimated renewal fee
 * @property {string} [startDate] - Deprecated; no longer collected
 */

/**
 * @typedef {Object} Location
 * @property {string} country - Country name
 * @property {string|null} city - City/region name
 * @property {string} currency - Currency code (e.g., 'CZK', 'EUR')
 * @property {boolean|null} [isCzCitizen] - Czech citizenship (when living in CZ)
 * @property {ResidencePermit|null} [residencePermit] - Visa/permit details for non-citizens
 * @property {boolean|null} [partnerIsCzCitizen] - Partner's Czech citizenship
 * @property {ResidencePermit|null} [partnerResidencePermit] - Partner's visa/permit details
 * @property {{ isCzCitizen: boolean|null, residencePermit: ResidencePermit|null }[]|null} [childrenCitizenship] - Per-child citizenship and permits
 */

/**
 * @typedef {Object} Occupation
 * @property {string} user - User's occupation type
 * @property {string|null} partner - Partner's occupation type (if applicable)
 * @property {'user'|'partner'} [occupationOnboardingStep] - Last occupation sub-step for resume/back
 */

/**
 * @typedef {'daily' | 'weekly' | 'fortnightly' | 'monthly' | 'quarterly' | 'annual'} Frequency
 */

/**
 * @typedef {Object} IncomeSource
 * @property {number} amount - Income amount
 * @property {Frequency} frequency - Payment frequency
 * @property {string|null} label - Optional label
 */

/**
 * @typedef {Object} FinancialGoal
 * @property {number} amount - Target amount
 * @property {string} targetDate - ISO date string
 * @property {string|null} description - Optional description
 */

/**
 * @typedef {Object} Income
 * @property {IncomeSource|null} user - User's primary income
 * @property {IncomeSource|null} partner - Partner's income (if applicable)
 * @property {IncomeSource[]} otherSources - Additional income sources
 * @property {number|null} savingsBalance - Current savings balance
 * @property {number|null} savingsTarget - Monthly savings target
 * @property {FinancialGoal|null} goal - Financial goal
 */

/**
 * @typedef {Object} Cost
 * @property {string} id - Unique identifier
 * @property {number} amount - Cost amount
 * @property {Frequency} frequency - Payment frequency
 * @property {string} category - Cost category
 * @property {string|null} subcategory - Optional subcategory
 * @property {string|null} dueDate - ISO date string for due date
 * @property {string|null} renewalDate - ISO date string for renewal
 * @property {string|null} notes - Optional notes
 * @property {string|null} memberRef - Reference to household member
 * @property {Object} meta - Additional metadata
 */

/**
 * @typedef {Object} Debt
 * @property {string} id - Unique identifier
 * @property {string} type - Debt type (e.g., 'credit_card', 'personal_loan')
 * @property {number} balance - Current balance
 * @property {number} minPayment - Minimum monthly payment
 * @property {number} apr - Annual percentage rate
 * @property {string|null} promoEndDate - ISO date string for promo rate end
 * @property {string|null} contractEndDate - ISO date string for contract end
 * @property {number|null} paymentDueDay - Day of month (1-31)
 * @property {string|null} notes - Optional notes
 */

/**
 * @typedef {'free' | 'capped' | 'reset'} RolloverStrategy
 */

/**
 * @typedef {Object} UiPreferences
 * @property {boolean} sidebarVisited - User has opened the app shell at least once
 * @property {boolean} sidebarCollapsed - Sidebar rail collapsed on wide screens
 */

/**
 * @typedef {'daily' | 'weekly' | 'monthly'} BudgetDisplayFrequency
 */

/**
 * @typedef {Object} CustomStash
 * @property {string} id
 * @property {string} name
 * @property {number} balance
 * @property {string} createdAt - YYYY-MM-DD
 * @property {string|null} [description] - Optional user note shown on the tab card
 * @property {boolean} [autoCreated] - System-managed tab (sinking fund)
 * @property {string|null} [sinkingSourceKey] - Stable dedupe key, e.g. vehicle_insurance:v_1
 * @property {number|null} [sinkingTargetAmount] - Lump sum due at renewal
 * @property {string|null} [sinkingDueDate] - DD/MM/YYYY
 * @property {number|null} [sinkingSuggestedMonthly] - Suggested monthly set-aside
 */

/**
 * @typedef {Object} Budget
 * @property {number} monthlyFlexible - Monthly flexible spending budget
 * @property {BudgetDisplayFrequency} budgetDisplayFrequency - How budget is shown on dashboard
 * @property {RolloverStrategy} rolloverStrategy - How unspent budget rolls over
 * @property {number|null} rolloverMultiplier - Multiplier for capped strategy (2, 3, 4)
 * @property {'multiplier'|'amount'|null} [rolloverCapType] - How capped rollover limit is set
 * @property {number|null} [rolloverCapAmount] - Fixed max rollover balance when cap type is amount
 * @property {'forfeit'|'looseMoney'|'savings'|'otherGoal'|null} [resetUnspentDestination] - Where reset strategy sends unspent budget (forfeit is legacy → looseMoney)
 * @property {string|null} [resetOtherGoalNote] - Label for other-goal destination
 * @property {number} rolloverBalance - Current rollover balance
 * @property {number} [looseMoneyBalance] - Unallocated cash from reset-month underspend
 * @property {number} [otherGoalBalance] - Balance set aside for reset-month other-goal destination
 * @property {CustomStash[]} [customStashes] - User-created named money stashes
 * @property {string|null} [resetUnspentStashId] - Custom stash that receives month-end other-goal routing
 * @property {string|null} [lastClosedPeriod] - Last closed month YYYY-MM
 * @property {MonthEndHistoryEntry[]} [monthEndHistory] - Past month-end routing events
 * @property {boolean} [deductSavingsGoal] - When true, monthly savings goal is reserved from spending budget
 * @property {number} [budgetSpendingRatio] - Share of available flexible budget for spending (0–1)
 * @property {number} [budgetSavingsShift] - Monthly amount redirected from spending to savings via slider
 * @property {number} [committedBaseline] - Committed monthly total at onboarding completion (cost-reduction tracking)
 * @property {number} [activityJarBalance] - Daily underspend set aside in the activity jar
 * @property {number|null} [activityJarCapAmount] - Optional max activity jar balance
 * @property {boolean} [dailyJarEnabled] - When true, day-end routes unspent allowance to jars
 * @property {'spendingBoost'|'looseMoney'|'savings'} [dailyJarDestination] - Day-end routing target
 * @property {number} [jarredThisMonth] - Amount moved from spending pool to jars this month
 * @property {string|null} [lastClosedDay] - Last processed day YYYY-MM-DD
 * @property {DayEndHistoryEntry[]} [dayEndHistory] - Closed-day jar routing log
 * @property {StashMovement[]} [stashMovements] - Ledger of inflows/outflows per money stash tab
 * @property {boolean} [stashMovementsLegacyBackfill] - One-time import from day/month history done
 * @property {boolean} [cyclesEnabled] - Pay-cycle budgeting (disables calendar month-end)
 * @property {string|null} [activeCycleId] - Denormalized active cycle id (see beaverr_budget_cycles)
 */

/**
 * @typedef {'cycleSavings'|'generalSavings'|'rollover'|'looseMoney'|'external'} OverspendSource
 */

/**
 * @typedef {'creditCard'|'friendLoan'|'familyLoan'|'bankLoan'|'overdraft'|'other'} ExternalCoverageType
 */

/**
 * @typedef {Object} OverspendCoverage
 * @property {number} amount
 * @property {OverspendSource} source
 * @property {ExternalCoverageType} [externalType]
 * @property {string|null} [note]
 * @property {boolean} [trackObligation]
 * @property {string|null} [obligationId]
 */

/**
 * @typedef {'active'|'closed'} BudgetCycleStatus
 */

/**
 * @typedef {Object} BudgetCycle
 * @property {string} id
 * @property {BudgetCycleStatus} status
 * @property {string} startedAt - YYYY-MM-DD
 * @property {string|null} [closedAt]
 * @property {number} budgetAmount
 * @property {number} plannedSavingsAmount
 * @property {number} spentTotal
 * @property {number} surplus
 * @property {number} deficit
 * @property {OverspendCoverage[]} [coverage]
 * @property {{ destination: string, amount: number }} [surplusRouting]
 * @property {boolean} [closedWithUnsetDays]
 * @property {string} createdAt
 */

/**
 * @typedef {Object} BudgetCycleStore
 * @property {BudgetCycle[]} cycles
 * @property {string|null} activeCycleId
 */

/**
 * @typedef {'open'|'paid'|'dismissed'} ObligationStatus
 */

/**
 * @typedef {Object} Obligation
 * @property {string} id
 * @property {number} amount
 * @property {number} remainingAmount
 * @property {ExternalCoverageType|'other'} source
 * @property {string|null} [note]
 * @property {string} fromCycleId
 * @property {ObligationStatus} status
 * @property {string} createdAt
 * @property {string|null} [paidAt]
 */

/**
 * @typedef {'income'|'expense'} CycleAdjustmentKind
 */

/**
 * @typedef {'immediate'|'scheduled'|'next_cycle'} CycleAdjustmentTiming
 */

/**
 * @typedef {'active'|'cancelled'|'applied'} CycleAdjustmentStatus
 */

/**
 * @typedef {'cycleBudget'|'elsewhere'} CycleAdjustmentFunding
 */

/**
 * @typedef {Object} CycleAdjustment
 * @property {string} id
 * @property {string} cycleId
 * @property {CycleAdjustmentKind} kind
 * @property {number} amount
 * @property {string} label
 * @property {CycleAdjustmentTiming} timing
 * @property {string|null} [paymentDate] - YYYY-MM-DD
 * @property {CycleAdjustmentFunding} [funding] - expense only; default cycleBudget
 * @property {CycleAdjustmentStatus} status
 * @property {string} createdAt
 */

/**
 * @typedef {Object} DayEndHistoryEntry
 * @property {string} date - YYYY-MM-DD
 * @property {number} dailyAllowance
 * @property {number} spent
 * @property {number} leftover
 * @property {number} [toLooseMoney]
 * @property {number} [toSavings]
 * @property {number} [removedFromPool] - Full day slot removed from cycle pool (backfill piggy bank)
 * @property {'backfill'|'natural'} [closeKind]
 */

/**
 * @typedef {Object} MonthEndHistoryEntry
 * @property {string} period - YYYY-MM
 * @property {number} leftover
 * @property {number} spent
 * @property {'looseMoney'|'savings'|'otherGoal'|'rollover'} destination
 * @property {number} amount
 * @property {number} [excessToLoose]
 */

/**
 * @typedef {'transfer_in'|'transfer_out'|'goal_funding'|'day_end'|'month_end'|'stash_delete'} StashMovementType
 */

/**
 * @typedef {'in'|'out'} StashMovementDirection
 */

/**
 * @typedef {Object} StashMovement
 * @property {string} id
 * @property {string} date - YYYY-MM-DD
 * @property {string} stashRef - looseCash | savings | stash:{id}
 * @property {number} amount - Positive magnitude
 * @property {StashMovementDirection} direction
 * @property {StashMovementType} type
 * @property {string|null} [counterpartyRef] - Other stash ref or goal id
 * @property {'stash'|'goal'|null} [counterpartyKind]
 * @property {string|null} [counterpartyLabel] - Denormalized display label
 * @property {string|null} [goalId]
 */

/**
 * @typedef {Object} DailyLog
 * @property {string} date - ISO date YYYY-MM-DD
 * @property {number|null} spent - Amount spent; null when unset
 * @property {'unset'|'confirmed'} [status]
 * @property {string} [cycleId]
 * @property {string} [updatedAt]
 */

/**
 * @typedef {'low' | 'medium' | 'high'} AlertUrgency
 */

/**
 * @typedef {'active' | 'snoozed' | 'dismissed'} AlertStatus
 */

/**
 * @typedef {Object} Alert
 * @property {string} id - Unique identifier
 * @property {string} type - Alert type
 * @property {string} message - Alert message
 * @property {AlertUrgency} urgency - Urgency level
 * @property {string|null} relatedId - Related item ID
 * @property {AlertStatus} status - Current status
 * @property {string|null} snoozedUntil - ISO date string
 */

/**
 * @typedef {'light' | 'dark'} Theme
 */

/**
 * @typedef {Object} Settings
 * @property {string} currency - Currency code
 * @property {Theme} theme - UI theme
 * @property {string} language - Language code ('en' | 'cs')
 * @property {string|null} [username] - Unique account username
 * @property {number} alertLeadDays - Days before event to show alert
 */

/**
 * @typedef {'renting' | 'own' | 'family'} HousingType
 */

/**
 * @typedef {Object} UtilityItem
 * @property {string} key - Catalog key or 'other'
 * @property {string|null} [customLabel] - Label when key is 'other'
 * @property {number|null} amount - Utility amount
 * @property {Frequency} frequency - Payment frequency
 */

/**
 * @typedef {Object} HousingCostItem
 * @property {number} amount - Cost amount
 * @property {Frequency} frequency - Payment frequency
 * @property {string|null} dueDate - Optional due date
 * @property {string|null} description - Optional description
 */

/**
 * @typedef {Object} Housing
 * @property {HousingType} type - Housing type
 * @property {number|null} rent - Monthly rent (renting branch)
 * @property {number|null} utilities - Monthly utilities total (renting branch)
 * @property {'total'|'itemized'} [utilitiesMode] - Combined vs per-utility entry
 * @property {Frequency|null} [utilitiesFrequency] - Frequency for combined total
 * @property {UtilityItem[]} [utilityItems] - Itemized utility rows
 * @property {boolean|null} hasInternet - Whether internet is paid separately
 * @property {number|null} internetAmount - Internet amount (if paid separately)
 * @property {Frequency|null} internetFrequency - Internet frequency
 * @property {boolean|null} hasMortgage - Whether has a mortgage (own branch)
 * @property {number|null} mortgageAmount - Monthly mortgage payment
 * @property {string|null} mortgageEndDate - Mortgage end date (optional)
 * @property {boolean|null} hasOtherOwnershipCosts - Whether has other ownership costs
 * @property {HousingCostItem[]} otherOwnershipCosts - Other ownership cost items
 * @property {boolean|null} contributesToFamily - Whether contributes to family costs
 * @property {HousingCostItem[]} familyContributions - Family contribution items
 * @property {Object|null} govtTaxes - Government & city taxes
 * @property {boolean} govtTaxes.wasteTax - Waste tax (CZ pre-filled)
 * @property {number|null} govtTaxes.wasteTaxAmount - Waste tax amount
 * @property {boolean} [govtTaxes.wasteTaxUserEdited] - User overrode auto-estimate
 * @property {number|null} [govtTaxes.wasteTaxEstimatedAmount] - Last household-based estimate
 * @property {boolean} govtTaxes.tvLicence - TV licence (CZ pre-filled)
 * @property {number|null} govtTaxes.tvLicenceAmount - TV licence amount
 * @property {boolean} govtTaxes.radioLicence - Radio licence (CZ pre-filled)
 * @property {number|null} govtTaxes.radioLicenceAmount - Radio licence amount
 * @property {HousingCostItem[]} govtTaxes.customItems - Custom tax items
 */

/**
 * @typedef {'petrol' | 'diesel' | 'electric' | 'hybrid' | 'lpg' | 'cng'} FuelType
 */

/**
 * @typedef {'tpl' | 'comprehensive'} VehicleInsuranceCoverageType
 */

/**
 * @typedef {Object} VehicleInsurance
 * @property {number} premium - Insurance premium amount
 * @property {Frequency} frequency - Payment frequency
 * @property {string|null} renewalDate - ISO date string for renewal
 * @property {VehicleInsuranceCoverageType|null} [coverageType] - TPL vs comprehensive
 * @property {number|null} [liabilityAmount] - TPL coverage limit (risk exposure, not budget)
 */

/**
 * @typedef {Object} Vehicle
 * @property {FuelType} fuelType - Type of fuel
 * @property {string|null} [displayName] - User label, e.g. "Hyundai i30"
 * @property {number} monthlyFuelCost - Estimated monthly fuel cost
 * @property {VehicleInsurance|null} insurance - Vehicle insurance details
 * @property {number|null} zoneParkingAmount - Zone parking monthly amount
 * @property {Frequency|null} zoneParkingFrequency - Zone parking frequency
 * @property {string|null} motDate - MOT/STK expiry date (ISO string)
 * @property {number|null} [motInspectionCost] - Typical STK/MOT inspection fee
 * @property {string|null} [motNextDate] - Next planned STK date (MM/YYYY)
 * @property {string[]} plannedMaintenance - Planned maintenance items
 * @property {number|null} publicTransportAmount - Monthly public transport cost
 * @property {Frequency|null} publicTransportFrequency - Public transport frequency
 * @property {string|null} passValidity - Pass validity description
 */

/**
 * @typedef {Object} Transport
 * @property {boolean} hasVehicle - Whether the household has a vehicle
 * @property {Vehicle|null} vehicle - Vehicle details (if hasVehicle)
 * @property {boolean} hasPublicTransport - Whether public transport is used
 * @property {number|null} publicTransportAmount - Public transport amount
 * @property {Frequency|null} publicTransportFrequency - Public transport frequency
 * @property {string|null} passValidity - Pass validity description
 */

/**
 * @typedef {'employee' | 'selfEmployed' | 'student' | 'notWorking'} OccupationType
 */

/**
 * @typedef {Object} HealthInsuranceMember
 * @property {string} name - Member name
 * @property {OccupationType} occupation - Occupation type
 * @property {boolean} coveredByEmployer - Whether covered by employer (CZ employees)
 * @property {number|null} premium - Monthly premium (if not covered)
 * @property {Frequency|null} frequency - Payment frequency
 * @property {string|null} startDate - Insurance start date (ISO string)
 * @property {string|null} endDate - Insurance end date (ISO string)
 * @property {boolean} hasOpenEnd - Whether end date is open-ended
 * @property {'ongoing'|'fixed'} [endDateType] - Contract end type
 * @property {boolean} [premiumPaidInFull] - Whether current fixed period was prepaid upfront
 * @property {'renew'|'switch'|'end'} [renewalPlan] - Plan when fixed contract ends
 * @property {boolean} [budgetForRenewal] - Include monthly renewal reserve in budget
 * @property {'suggested'|'custom'|'skip'} [renewalBudgetMode] - How renewal reserve is calculated
 * @property {number|null} [renewalCustomMonthly] - User-defined monthly renewal reserve
 * @property {boolean} [budgetForSwitch] - Include switch premium in budget after prepaid contract
 * @property {number|null} [switchPremiumAmount] - Expected premium after switching plans
 * @property {Frequency|'custom'|null} [switchPremiumFrequency] - Switch premium frequency
 * @property {string|null} [switchCustomFrequencyMonths] - Custom period length for switch premium (months)
 * @property {string|null} notes - Optional notes
 */

/**
 * @typedef {Object} HealthInsurance
 * @property {HealthInsuranceMember[]} members - Per-member health insurance details
 */

/**
 * @typedef {Object} ChildCostField
 * @property {string} key - Field identifier
 * @property {number} amount - Cost amount
 * @property {Frequency} frequency - Payment frequency
 */

/**
 * @typedef {Object} ChildCostsEntry
 * @property {string} childName - Child's display name
 * @property {AgeGroup} ageGroup - Child's age group
 * @property {ChildCostField[]} fields - Age-group-specific cost fields
 */

/**
 * @typedef {Object} ChildrenCosts
 * @property {ChildCostsEntry[]} children - Per-child cost entries
 */

/**
 * @typedef {'dog' | 'cat' | 'bird' | 'fish' | 'rabbit' | 'other'} PetType
 */

/**
 * @typedef {Object} Pet
 * @property {PetType} type - Type of pet
 * @property {string|null} name - Pet's name (optional)
 * @property {number|null} foodCost - Monthly food cost
 * @property {number|null} vetCost - Annual vet cost
 * @property {boolean} hasInsurance - Whether pet has insurance
 * @property {number|null} insurancePremium - Insurance premium amount
 * @property {Frequency|null} insuranceFrequency - Insurance payment frequency
 * @property {number|null} groomingCost - Monthly grooming cost
 * @property {number|null} dogWalkingCost - Monthly dog walking cost (dogs only)
 * @property {boolean} paysDogTax - Whether pays CZ dog tax
 * @property {number|null} dogTaxAmount - Dog tax amount (CZ: 1 500 Kč pre-filled)
 */

/**
 * @typedef {Object} Pets
 * @property {boolean} hasPets - Whether the household has pets
 * @property {Pet[]} pets - Array of pets
 */

/**
 * @typedef {Object} Subscription
 * @property {string} id - Unique identifier
 * @property {string} service - Service name
 * @property {number} amount - Subscription cost
 * @property {Frequency} frequency - Payment frequency
 * @property {boolean} autoRenew - Whether auto-renew is enabled
 * @property {string|null} renewalDate - ISO date string for next renewal
 * @property {string} category - Subscription category (e.g., 'streaming', 'cloud', 'fitness')
 */

/**
 * @typedef {Object} Subscriptions
 * @property {Subscription[]} items - Array of subscriptions
 */

/**
 * @typedef {Object} OtherCostItem
 * @property {string} id - Unique identifier
 * @property {string} label - Cost label
 * @property {number} amount - Cost amount
 * @property {Frequency} frequency - Payment frequency
 * @property {string|null} dueDate - ISO date string for due date
 * @property {string|null} category - Cost category
 */

/**
 * @typedef {Object} OtherCosts
 * @property {OtherCostItem[]} items - Array of other regular costs
 */

/**
 * @typedef {'creditCard' | 'personalLoan' | 'carLoan' | 'studentLoan' | 'medical' | 'family' | 'bnpl' | 'other'} DebtType
 */

/**
 * @typedef {Object} DebtEntry
 * @property {string} id - Unique identifier
 * @property {DebtType} type - Debt type
 * @property {string|null} creditor - Creditor name (optional)
 * @property {number} balance - Current balance
 * @property {number} minPayment - Minimum monthly payment
 * @property {number} apr - Annual percentage rate
 * @property {string|null} promoEndDate - ISO date string for promo rate end
 * @property {number|null} paymentDueDay - Day of month (1-31)
 * @property {string|null} notes - Optional notes
 * @property {boolean} [readOnly] - Locked when linked debt goal is completed
 * @property {string|null} [paidOffAt] - ISO date when marked paid off
 */

/**
 * @typedef {'savings' | 'debt' | 'custom' | 'reduceCosts'} GoalType
 */

/**
 * @typedef {'active' | 'on_hold' | 'paused' | 'completed' | 'archived'} GoalLifecycleStatus
 */

/**
 * @typedef {'on_track' | 'behind' | 'ahead' | 'regressed'} GoalPaceStatus
 */

/**
 * @typedef {'daily' | 'weekly' | 'monthly' | 'annual' | 'once'} GoalFundingFrequency
 */

/**
 * @typedef {Object} GoalFundingRule
 * @property {string} id
 * @property {string} stashRef - looseCash | savings | stash:{id}
 * @property {number} amount
 * @property {GoalFundingFrequency} frequency
 * @property {number} priority
 * @property {string|null} [nextRunDate] - ISO YYYY-MM-DD; first / next scheduled move
 * @property {number|null} [dayOfMonth] - 1–28 anchor for monthly moves
 * @property {number|null} [dayOfWeek] - 0–6 anchor for weekly moves
 * @property {string|null} [lastProcessedAt] - ISO date YYYY-MM-DD
 */

/**
 * @typedef {Object} Goal
 * @property {string} id
 * @property {GoalType} type
 * @property {string} name
 * @property {string|null} [description]
 * @property {string|null} [endDate] - DD/MM/YYYY
 * @property {number} targetAmount
 * @property {number} currentAmount
 * @property {number|null} [startingPrincipal] - Debt goals only
 * @property {string|null} [linkedDebtId]
 * @property {GoalLifecycleStatus} lifecycleStatus
 * @property {GoalPaceStatus|null} [paceStatus]
 * @property {GoalFundingRule[]} fundingRules
 * @property {boolean} autoCreated
 * @property {number} completionCount
 * @property {string|null} [completedAt]
 * @property {string|null} [archivedAt]
 * @property {string} createdAt - YYYY-MM-DD
 * @property {number|null} [previousDebtBalance] - For regression detection
 */

/**
 * @typedef {Object} Debts
 * @property {boolean} hasDebts - Whether the household has debts
 * @property {DebtEntry[]} debts - Array of debts
 */

/**
 * @typedef {'free' | 'capped' | 'reset'} RolloverStrategy
 */

/**
 * @typedef {'daily' | 'weekly' | 'monthly'} BudgetDisplayFrequency
 */

/**
 * @typedef {Object} CustomStash
 * @property {string} id
 * @property {string} name
 * @property {number} balance
 * @property {string} createdAt - YYYY-MM-DD
 * @property {string|null} [description] - Optional user note shown on the tab card
 * @property {boolean} [autoCreated] - System-managed tab (sinking fund)
 * @property {string|null} [sinkingSourceKey] - Stable dedupe key, e.g. vehicle_insurance:v_1
 * @property {number|null} [sinkingTargetAmount] - Lump sum due at renewal
 * @property {string|null} [sinkingDueDate] - DD/MM/YYYY
 * @property {number|null} [sinkingSuggestedMonthly] - Suggested monthly set-aside
 */

/**
 * @typedef {Object} Budget
 * @property {number} monthlyFlexible - Monthly flexible spending budget
 * @property {BudgetDisplayFrequency} budgetDisplayFrequency - How budget is shown on dashboard
 * @property {RolloverStrategy} rolloverStrategy - How unspent budget rolls over
 * @property {number|null} rolloverMultiplier - Multiplier for capped strategy (2, 3, 4)
 * @property {'multiplier'|'amount'|null} [rolloverCapType] - How capped rollover limit is set
 * @property {number|null} [rolloverCapAmount] - Fixed max rollover balance when cap type is amount
 * @property {'forfeit'|'looseMoney'|'savings'|'otherGoal'|null} [resetUnspentDestination] - Where reset strategy sends unspent budget (forfeit is legacy → looseMoney)
 * @property {string|null} [resetOtherGoalNote] - Label for other-goal destination
 * @property {number} rolloverBalance - Current rollover balance
 * @property {number} [looseMoneyBalance] - Unallocated cash from reset-month underspend
 * @property {number} [otherGoalBalance] - Balance set aside for reset-month other-goal destination
 * @property {CustomStash[]} [customStashes] - User-created named money stashes
 * @property {string|null} [resetUnspentStashId] - Custom stash that receives month-end other-goal routing
 * @property {string|null} [lastClosedPeriod] - Last closed month YYYY-MM
 * @property {MonthEndHistoryEntry[]} [monthEndHistory] - Past month-end routing events
 * @property {boolean} [deductSavingsGoal] - When true, monthly savings goal is reserved from spending budget
 * @property {number} [budgetSpendingRatio] - Share of available flexible budget for spending (0–1)
 * @property {number} [budgetSavingsShift] - Monthly amount redirected from spending to savings via slider
 * @property {number} [committedBaseline] - Committed monthly total at onboarding completion (cost-reduction tracking)
 * @property {number} [activityJarBalance] - Daily underspend set aside in the activity jar
 * @property {number|null} [activityJarCapAmount] - Optional max activity jar balance
 * @property {boolean} [dailyJarEnabled] - When true, day-end routes unspent allowance to jars
 * @property {'spendingBoost'|'looseMoney'|'savings'} [dailyJarDestination] - Day-end routing target
 * @property {number} [jarredThisMonth] - Amount moved from spending pool to jars this month
 * @property {string|null} [lastClosedDay] - Last processed day YYYY-MM-DD
 * @property {DayEndHistoryEntry[]} [dayEndHistory] - Closed-day jar routing log
 * @property {StashMovement[]} [stashMovements] - Ledger of inflows/outflows per money stash tab
 * @property {boolean} [stashMovementsLegacyBackfill] - One-time import from day/month history done
 * @property {boolean} [cyclesEnabled] - Pay-cycle budgeting (disables calendar month-end)
 * @property {string|null} [activeCycleId] - Denormalized active cycle id (see beaverr_budget_cycles)
 */

/**
 * @typedef {'cycleSavings'|'generalSavings'|'rollover'|'looseMoney'|'external'} OverspendSource
 */

/**
 * @typedef {'creditCard'|'friendLoan'|'familyLoan'|'bankLoan'|'overdraft'|'other'} ExternalCoverageType
 */

/**
 * @typedef {Object} OverspendCoverage
 * @property {number} amount
 * @property {OverspendSource} source
 * @property {ExternalCoverageType} [externalType]
 * @property {string|null} [note]
 * @property {boolean} [trackObligation]
 * @property {string|null} [obligationId]
 */

/**
 * @typedef {'active'|'closed'} BudgetCycleStatus
 */

/**
 * @typedef {Object} BudgetCycle
 * @property {string} id
 * @property {BudgetCycleStatus} status
 * @property {string} startedAt - YYYY-MM-DD
 * @property {string|null} [closedAt]
 * @property {number} budgetAmount
 * @property {number} plannedSavingsAmount
 * @property {number} spentTotal
 * @property {number} surplus
 * @property {number} deficit
 * @property {OverspendCoverage[]} [coverage]
 * @property {{ destination: string, amount: number }} [surplusRouting]
 * @property {boolean} [closedWithUnsetDays]
 * @property {string} createdAt
 */

/**
 * @typedef {Object} BudgetCycleStore
 * @property {BudgetCycle[]} cycles
 * @property {string|null} activeCycleId
 */

/**
 * @typedef {'open'|'paid'|'dismissed'} ObligationStatus
 */

/**
 * @typedef {Object} Obligation
 * @property {string} id
 * @property {number} amount
 * @property {number} remainingAmount
 * @property {ExternalCoverageType|'other'} source
 * @property {string|null} [note]
 * @property {string} fromCycleId
 * @property {ObligationStatus} status
 * @property {string} createdAt
 * @property {string|null} [paidAt]
 */

/**
 * @typedef {'full' | 'quick'} SetupMode
 */

/**
 * @typedef {Object} OnboardingState
 * @property {boolean} completed - Full questionnaire submitted (review)
 * @property {boolean} [dashboardUnlocked] - User may access the app shell / dashboard
 * @property {boolean} [questionnaireComplete] - Alias for completed after full review
 * @property {boolean} [questionnaireEverCompleted] - True once review was submitted at least once (retake restore)
 * @property {boolean} [questionnaireRetakeInProgress] - True while re-doing questionnaire after a prior submit
 * @property {SetupMode|null} [setupMode] - Quick vs full path chosen after consent
 * @property {string} currentStep - Current step identifier
 * @property {number} percentComplete - Completion percentage (0-100)
 * @property {string|null} [resumeRoute] - Expo route to continue full questionnaire
 * @property {{ route: string, params?: Record<string, string> }[]} [navHistory] - Visit stack for reliable back navigation
 */
