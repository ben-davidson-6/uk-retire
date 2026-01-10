// UK Account Types
export type AccountType =
  | 'workplace_pension'      // Employer pension scheme (pre-tax contributions, taxed on withdrawal)
  | 'sipp'                   // Self-Invested Personal Pension (pre-tax, taxed on withdrawal)
  | 'isa'                    // Individual Savings Account (post-tax, tax-free growth & withdrawal)
  | 'lisa'                   // Lifetime ISA (post-tax + 25% bonus, tax-free for retirement/first home)
  | 'gia';                   // General Investment Account (taxable)

export type TaxTreatment = 'pension' | 'isa' | 'lisa' | 'taxable';

// Planning mode for single person or couple
export type PlanningMode = 'single' | 'couple';

// Person identifier for couple mode
export type PersonId = 'person1' | 'person2';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  annualContribution: number;
  contributionGrowthRate: number;  // Annual increase in contributions
  expectedReturn: number;
  // Workplace pension specific
  employerContribution?: number;   // Employer contribution percentage
  salaryForMatch?: number;         // Salary used to calculate employer contribution
  // Couple mode
  owner?: PersonId;                // Account owner (required in couple mode)
}

// Tax bracket targets for withdrawal strategy
export type TaxBracketTarget =
  | 'personal_allowance'  // Stay below £12,570 - 0% tax
  | 'basic_rate'          // Stay below £50,270 - max 20% tax (UK) / £43,662 (Scotland)
  | 'higher_rate'         // Stay below £125,140 - max 40% tax
  | 'no_limit';           // Draw pension last (original behavior)

// Individual person's profile (for couple mode)
export interface PersonProfile {
  name: string;                    // Display name (e.g., "Person 1" or custom)
  currentAge: number;
  retirementAge: number;
  lifeExpectancy: number;
  privatePensionAge: number;       // Age when private pension can be accessed
  statePensionAge: number;         // UK State Pension age for this person
  isScottish: boolean;             // Scotland has different income tax rates
  taxBracketTarget: TaxBracketTarget;  // Which tax bracket to fill before using ISA/LISA
}

// Household profile supporting single or couple mode
export interface HouseholdProfile {
  mode: PlanningMode;
  person1: PersonProfile;
  person2?: PersonProfile;         // Only populated in couple mode
  statePensionAmount: number;      // Combined household state pension
}

// Legacy Profile interface (for backward compatibility)
export interface Profile {
  currentAge: number;
  retirementAge: number;
  lifeExpectancy: number;
  privatePensionAge: number;       // Age when private pension (SIPP/workplace) can be accessed
  statePensionAge: number;         // UK State Pension age
  statePensionAmount: number;      // Annual State Pension (£11,502 for 2024/25 full amount)
  isScottish: boolean;             // Scotland has different income tax rates
  taxBracketTarget: TaxBracketTarget;  // Which tax bracket to fill before using ISA/LISA
}

export interface Assumptions {
  inflationRate: number;
  safeWithdrawalRate: number;
  retirementReturnRate: number;
  targetRetirementIncome: number | null;  // Annual target in today's money, null = use SWR
  inflateTaxBands: boolean;  // Whether to inflation-adjust tax bands over time
}

// Yearly snapshot during accumulation
export interface AccumulationYear {
  age: number;
  year: number;
  accounts: Record<string, number>;  // Account ID -> balance
  totalBalance: number;
  pensionBalance: number;            // Workplace pension + SIPP
  isaBalance: number;
  lisaBalance: number;
  taxableBalance: number;            // GIA
  contributions: number;
  returns: number;
}

export interface AccumulationResult {
  years: AccumulationYear[];
  finalBalance: number;
  totalContributions: number;
  totalReturns: number;
}

// Yearly snapshot during withdrawal/retirement
export interface WithdrawalYear {
  age: number;
  year: number;
  startingBalance: number;
  endingBalance: number;

  // Income sources
  statePension: number;
  pensionWithdrawal: number;
  isaWithdrawal: number;
  lisaWithdrawal: number;
  taxableWithdrawal: number;
  taxFreeLumpSum: number;           // 25% tax-free from pension
  totalWithdrawal: number;

  // Tax calculations
  taxableIncome: number;
  incomeTax: number;
  capitalGainsTax: number;
  totalTax: number;
  netIncome: number;

  // Account balances at year end
  pensionBalance: number;
  isaBalance: number;
  lisaBalance: number;
  taxableBalance: number;

  // Flags
  portfolioDepleted: boolean;
}

export interface RetirementResult {
  years: WithdrawalYear[];
  totalWithdrawn: number;
  totalTaxPaid: number;
  portfolioDepletionAge: number | null;
  sustainableWithdrawal: number;
}

// Helper functions
export function getTaxTreatment(type: AccountType): TaxTreatment {
  switch (type) {
    case 'workplace_pension':
    case 'sipp':
      return 'pension';
    case 'isa':
      return 'isa';
    case 'lisa':
      return 'lisa';
    case 'gia':
      return 'taxable';
  }
}

export function getAccountTypeLabel(type: AccountType): string {
  switch (type) {
    case 'workplace_pension':
      return 'Workplace Pension';
    case 'sipp':
      return 'SIPP';
    case 'isa':
      return 'ISA';
    case 'lisa':
      return 'Lifetime ISA';
    case 'gia':
      return 'General Investment Account';
  }
}

export function isPension(type: AccountType): boolean {
  return type === 'workplace_pension' || type === 'sipp';
}

export function isTaxFree(type: AccountType): boolean {
  return type === 'isa' || type === 'lisa';
}

// Convert legacy Profile to HouseholdProfile
export function profileToHousehold(profile: Profile): HouseholdProfile {
  return {
    mode: 'single',
    person1: {
      name: 'Person 1',
      currentAge: profile.currentAge,
      retirementAge: profile.retirementAge,
      lifeExpectancy: profile.lifeExpectancy,
      privatePensionAge: profile.privatePensionAge,
      statePensionAge: profile.statePensionAge,
      isScottish: profile.isScottish,
      taxBracketTarget: profile.taxBracketTarget,
    },
    statePensionAmount: profile.statePensionAmount,
  };
}

// Convert HouseholdProfile to legacy Profile (uses person1 for single mode)
export function householdToProfile(household: HouseholdProfile): Profile {
  return {
    currentAge: household.person1.currentAge,
    retirementAge: household.person1.retirementAge,
    lifeExpectancy: household.person1.lifeExpectancy,
    privatePensionAge: household.person1.privatePensionAge,
    statePensionAge: household.person1.statePensionAge,
    statePensionAmount: household.statePensionAmount,
    isScottish: household.person1.isScottish,
    taxBracketTarget: household.person1.taxBracketTarget,
  };
}
