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
 * @typedef {Object} Household
 * @property {HouseholdType} type - Household type
 * @property {string|null} partnerName - Partner's display name (if applicable)
 * @property {Child[]} children - Array of children
 */

/**
 * @typedef {Object} Location
 * @property {string} country - Country name
 * @property {string|null} city - City/region name
 * @property {string} currency - Currency code (e.g., 'CZK', 'EUR')
 */

/**
 * @typedef {Object} Occupation
 * @property {string} user - User's occupation type
 * @property {string|null} partner - Partner's occupation type (if applicable)
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
 * @typedef {Object} Budget
 * @property {number} monthlyFlexible - Monthly flexible spending budget
 * @property {RolloverStrategy} rolloverStrategy - How unspent budget rolls over
 * @property {number|null} rolloverMultiplier - Multiplier for capped strategy (2, 3, 4)
 * @property {number} rolloverBalance - Current rollover balance
 */

/**
 * @typedef {Object} DailyLog
 * @property {string} date - ISO date string
 * @property {number} spent - Amount spent that day
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
 * @property {number} alertLeadDays - Days before event to show alert
 */

/**
 * @typedef {'renting' | 'own' | 'family'} HousingType
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
 * @property {number|null} utilities - Monthly utilities (renting branch)
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
 * @typedef {Object} VehicleInsurance
 * @property {number} premium - Insurance premium amount
 * @property {Frequency} frequency - Payment frequency
 * @property {string|null} renewalDate - ISO date string for renewal
 */

/**
 * @typedef {Object} Vehicle
 * @property {FuelType} fuelType - Type of fuel
 * @property {number} monthlyFuelCost - Estimated monthly fuel cost
 * @property {VehicleInsurance|null} insurance - Vehicle insurance details
 * @property {number|null} zoneParkingAmount - Zone parking monthly amount
 * @property {Frequency|null} zoneParkingFrequency - Zone parking frequency
 * @property {string|null} motDate - MOT/STK expiry date (ISO string)
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
 * @typedef {Object} Budget
 * @property {number} monthlyFlexible - Monthly flexible spending budget
 * @property {RolloverStrategy} rolloverStrategy - How unspent budget rolls over
 * @property {number|null} rolloverMultiplier - Multiplier for capped strategy (2, 3, 4)
 * @property {number} rolloverBalance - Current rollover balance
 */

/**
 * @typedef {Object} OnboardingState
 * @property {boolean} completed - Whether onboarding is complete
 * @property {string} currentStep - Current step identifier
 * @property {number} percentComplete - Completion percentage (0-100)
 */
