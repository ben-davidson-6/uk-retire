// UK Tax Constants for 2024/25 Tax Year

// Income Tax Bands (Rest of UK - England, Wales, Northern Ireland)
export const UK_TAX_BANDS = [
  { min: 0, max: 12570, rate: 0, name: 'Personal Allowance' },
  { min: 12570, max: 50270, rate: 0.20, name: 'Basic Rate' },
  { min: 50270, max: 125140, rate: 0.40, name: 'Higher Rate' },
  { min: 125140, max: Infinity, rate: 0.45, name: 'Additional Rate' },
];

// Scottish Income Tax Bands (different rates)
export const SCOTTISH_TAX_BANDS = [
  { min: 0, max: 12570, rate: 0, name: 'Personal Allowance' },
  { min: 12570, max: 14876, rate: 0.19, name: 'Starter Rate' },
  { min: 14876, max: 26561, rate: 0.20, name: 'Basic Rate' },
  { min: 26561, max: 43662, rate: 0.21, name: 'Intermediate Rate' },
  { min: 43662, max: 75000, rate: 0.42, name: 'Higher Rate' },
  { min: 75000, max: 125140, rate: 0.45, name: 'Advanced Rate' },
  { min: 125140, max: Infinity, rate: 0.48, name: 'Top Rate' },
];

// Personal Allowance
export const PERSONAL_ALLOWANCE = 12570;
export const PERSONAL_ALLOWANCE_TAPER_THRESHOLD = 100000;
// Personal allowance reduces by £1 for every £2 earned over £100,000
// It's completely eliminated at £125,140

// Capital Gains Tax
export const CGT_ANNUAL_EXEMPT_AMOUNT = 3000;  // 2024/25
export const CGT_BASIC_RATE = 0.10;            // 10% for basic rate taxpayers
export const CGT_HIGHER_RATE = 0.20;           // 20% for higher/additional rate

// Dividend Tax (for reference, though not heavily used in this calculator)
export const DIVIDEND_ALLOWANCE = 500;
export const DIVIDEND_BASIC_RATE = 0.0875;
export const DIVIDEND_HIGHER_RATE = 0.3375;
export const DIVIDEND_ADDITIONAL_RATE = 0.3938;

// State Pension
export const FULL_STATE_PENSION_WEEKLY = 221.20;  // 2024/25 full new State Pension
export const FULL_STATE_PENSION_ANNUAL = FULL_STATE_PENSION_WEEKLY * 52;  // ~£11,502
export const STATE_PENSION_AGE = 66;  // Current, rising to 67 by 2028

// Pension Contribution Limits
export const ANNUAL_ALLOWANCE = 60000;  // Maximum tax-relieved pension contribution
export const MONEY_PURCHASE_ANNUAL_ALLOWANCE = 10000;  // If already accessed pension flexibly

// ISA Limits
export const ISA_ANNUAL_LIMIT = 20000;
export const LISA_ANNUAL_LIMIT = 4000;
export const LISA_BONUS_RATE = 0.25;  // 25% government bonus on LISA contributions
export const LISA_MAX_AGE = 50;       // Cannot contribute after age 50

// Pension Access
export const MINIMUM_PENSION_ACCESS_AGE = 55;  // Rising to 57 in 2028
export const TAX_FREE_LUMP_SUM_RATE = 0.25;   // 25% of pension can be taken tax-free

// Chart Colors
export const CHART_COLORS = {
  pension: '#3B82F6',      // Blue for pensions
  isa: '#10B981',          // Green for ISA
  lisa: '#8B5CF6',         // Purple for LISA
  taxable: '#F59E0B',      // Amber for GIA
  statePension: '#EC4899', // Pink for State Pension
  tax: '#EF4444',          // Red for tax
  total: '#6366F1',        // Indigo for totals
};

// Default Profile (legacy - for backward compatibility)
export const DEFAULT_PROFILE = {
  currentAge: 35,
  retirementAge: 60,
  lifeExpectancy: 90,
  privatePensionAge: 57,  // Rising to 57 in 2028, currently 55
  statePensionAge: STATE_PENSION_AGE,
  statePensionAmount: FULL_STATE_PENSION_ANNUAL,
  isScottish: false,
  taxBracketTarget: 'basic_rate' as const,  // Stay below 40% tax rate
};

// Default Person Profile (for single mode and person1 in couple mode)
export const DEFAULT_PERSON_PROFILE = {
  name: 'Person 1',
  currentAge: 35,
  retirementAge: 60,
  lifeExpectancy: 90,
  privatePensionAge: 57,
  statePensionAge: STATE_PENSION_AGE,
  isScottish: false,
  taxBracketTarget: 'basic_rate' as const,
};

// Default Person 2 Profile (for couple mode)
export const DEFAULT_PERSON2_PROFILE = {
  name: 'Person 2',
  currentAge: 33,
  retirementAge: 60,
  lifeExpectancy: 92,
  privatePensionAge: 57,
  statePensionAge: STATE_PENSION_AGE,
  isScottish: false,
  taxBracketTarget: 'basic_rate' as const,
};

// Default Household Profile
export const DEFAULT_HOUSEHOLD_PROFILE = {
  mode: 'single' as const,
  person1: DEFAULT_PERSON_PROFILE,
  person2: undefined as typeof DEFAULT_PERSON2_PROFILE | undefined,
  statePensionAmount: FULL_STATE_PENSION_ANNUAL,
};

// Tax bracket thresholds for withdrawal strategy
export const TAX_BRACKET_THRESHOLDS = {
  personal_allowance: { uk: 12570, scottish: 12570 },
  basic_rate: { uk: 50270, scottish: 43662 },
  higher_rate: { uk: 125140, scottish: 125140 },
  no_limit: { uk: Infinity, scottish: Infinity },
};

// Default Assumptions
export const DEFAULT_ASSUMPTIONS = {
  inflationRate: 0.03,
  safeWithdrawalRate: 0.04,
  retirementReturnRate: 0.05,
  targetRetirementIncome: 40000 as number | null,  // £40k/year target, null = use SWR
  inflateTaxBands: true,  // Assume tax bands rise with inflation (UK Government typically does this)
};

// Format currency in GBP
export function formatGBP(amount: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Format percentage
export function formatPercent(value: number, decimals: number = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

// Get effective personal allowance (tapers above £100k)
export function getEffectivePersonalAllowance(income: number): number {
  if (income <= PERSONAL_ALLOWANCE_TAPER_THRESHOLD) {
    return PERSONAL_ALLOWANCE;
  }
  const reduction = Math.floor((income - PERSONAL_ALLOWANCE_TAPER_THRESHOLD) / 2);
  return Math.max(0, PERSONAL_ALLOWANCE - reduction);
}
