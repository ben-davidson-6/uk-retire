// UK Account Types
export type AccountType =
  | 'workplace_pension'      // Employer pension scheme (pre-tax contributions, taxed on withdrawal)
  | 'sipp'                   // Self-Invested Personal Pension (pre-tax, taxed on withdrawal)
  | 'isa'                    // Individual Savings Account (post-tax, tax-free growth & withdrawal)
  | 'lisa'                   // Lifetime ISA (post-tax + 25% bonus, tax-free for retirement/first home)
  | 'gia';                   // General Investment Account (taxable)

export type TaxTreatment = 'pension' | 'isa' | 'lisa' | 'taxable';

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
}

export interface Profile {
  currentAge: number;
  retirementAge: number;
  lifeExpectancy: number;
  statePensionAge: number;         // UK State Pension age
  statePensionAmount: number;      // Annual State Pension (£11,502 for 2024/25 full amount)
  isScottish: boolean;             // Scotland has different income tax rates
}

export interface Assumptions {
  inflationRate: number;
  safeWithdrawalRate: number;
  retirementReturnRate: number;
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
