import {
  Profile,
  Assumptions,
  AccumulationResult,
  WithdrawalYear,
  RetirementResult,
} from '../types';
import { calculateIncomeTax, calculateCapitalGainsTax } from './taxes';
import { TAX_FREE_LUMP_SUM_RATE } from './constants';

interface AccountBalances {
  pension: number;
  isa: number;
  lisa: number;
  taxable: number;
  taxableCostBasis: number;  // For CGT calculations
}

// Calculate withdrawals through retirement
export function calculateWithdrawals(
  _accounts: unknown,  // Reserved for future use
  profile: Profile,
  assumptions: Assumptions,
  accumulation: AccumulationResult
): RetirementResult {
  const years: WithdrawalYear[] = [];
  const currentYear = new Date().getFullYear();
  const yearsUntilRetirement = profile.retirementAge - profile.currentAge;

  // Get final balances from accumulation
  const finalAccumYear = accumulation.years[accumulation.years.length - 1];

  // Initialize balances
  const balances: AccountBalances = {
    pension: finalAccumYear?.pensionBalance ?? 0,
    isa: finalAccumYear?.isaBalance ?? 0,
    lisa: finalAccumYear?.lisaBalance ?? 0,
    taxable: finalAccumYear?.taxableBalance ?? 0,
    taxableCostBasis: (finalAccumYear?.taxableBalance ?? 0) * 0.5,  // Estimate 50% cost basis
  };

  // Track whether tax-free lump sum has been taken
  let taxFreeLumpSumRemaining = balances.pension * TAX_FREE_LUMP_SUM_RATE;

  // Calculate annual withdrawal target (inflation-adjusted)
  const totalPortfolio =
    balances.pension + balances.isa + balances.lisa + balances.taxable;
  const baseWithdrawalTarget = totalPortfolio * assumptions.safeWithdrawalRate;

  let totalWithdrawn = 0;
  let totalTaxPaid = 0;
  let portfolioDepletionAge: number | null = null;

  for (let age = profile.retirementAge; age <= profile.lifeExpectancy; age++) {
    const yearIndex = age - profile.retirementAge;
    const year = currentYear + yearsUntilRetirement + yearIndex;

    // Inflation-adjust the withdrawal target
    const inflationFactor = Math.pow(1 + assumptions.inflationRate, yearIndex);
    const withdrawalTarget = baseWithdrawalTarget * inflationFactor;

    // Calculate State Pension income (inflation-adjusted after state pension age)
    let statePension = 0;
    if (age >= profile.statePensionAge) {
      const statePensionYears = age - profile.statePensionAge;
      const statePensionInflation = Math.pow(1 + assumptions.inflationRate, statePensionYears);
      statePension = profile.statePensionAmount * statePensionInflation;
    }

    // Calculate how much we need to withdraw from portfolio
    const neededFromPortfolio = Math.max(0, withdrawalTarget - statePension);

    // Starting balances for the year
    const startingBalance =
      balances.pension + balances.isa + balances.lisa + balances.taxable;

    // Withdrawal strategy (optimized for tax efficiency)
    const withdrawal = performWithdrawal(
      balances,
      neededFromPortfolio,
      taxFreeLumpSumRemaining,
      profile.isScottish
    );

    // Update tax-free lump sum remaining
    taxFreeLumpSumRemaining = Math.max(
      0,
      taxFreeLumpSumRemaining - withdrawal.taxFreeLumpSum
    );

    // Apply investment returns to remaining balances
    const returnRate = assumptions.retirementReturnRate;
    balances.pension *= 1 + returnRate;
    balances.isa *= 1 + returnRate;
    balances.lisa *= 1 + returnRate;
    balances.taxable *= 1 + returnRate;
    // Cost basis grows proportionally
    if (balances.taxable > 0) {
      balances.taxableCostBasis *= 1 + returnRate;
    }

    const endingBalance =
      balances.pension + balances.isa + balances.lisa + balances.taxable;

    // Calculate taxes
    const taxableIncome =
      statePension + withdrawal.pensionWithdrawal - withdrawal.taxFreeLumpSum;

    const { tax: incomeTax } = calculateIncomeTax(
      Math.max(0, taxableIncome),
      profile.isScottish
    );

    const capitalGainsTax = calculateCapitalGainsTax(
      withdrawal.capitalGains,
      taxableIncome,
      profile.isScottish
    );

    const totalTax = incomeTax + capitalGainsTax;

    // Net income after tax
    const grossIncome =
      statePension +
      withdrawal.pensionWithdrawal +
      withdrawal.isaWithdrawal +
      withdrawal.lisaWithdrawal +
      withdrawal.taxableWithdrawal;
    const netIncome = grossIncome - totalTax;

    totalWithdrawn += withdrawal.total;
    totalTaxPaid += totalTax;

    // Check for portfolio depletion
    const portfolioDepleted = endingBalance <= 0;
    if (portfolioDepleted && portfolioDepletionAge === null) {
      portfolioDepletionAge = age;
    }

    years.push({
      age,
      year,
      startingBalance,
      endingBalance: Math.max(0, endingBalance),

      statePension,
      pensionWithdrawal: withdrawal.pensionWithdrawal,
      isaWithdrawal: withdrawal.isaWithdrawal,
      lisaWithdrawal: withdrawal.lisaWithdrawal,
      taxableWithdrawal: withdrawal.taxableWithdrawal,
      taxFreeLumpSum: withdrawal.taxFreeLumpSum,
      totalWithdrawal: withdrawal.total,

      taxableIncome: Math.max(0, taxableIncome),
      incomeTax,
      capitalGainsTax,
      totalTax,
      netIncome,

      pensionBalance: balances.pension,
      isaBalance: balances.isa,
      lisaBalance: balances.lisa,
      taxableBalance: balances.taxable,

      portfolioDepleted,
    });
  }

  // Calculate sustainable withdrawal (what could be withdrawn indefinitely)
  const sustainableWithdrawal = totalPortfolio * 0.04;  // Simple 4% rule

  return {
    years,
    totalWithdrawn,
    totalTaxPaid,
    portfolioDepletionAge,
    sustainableWithdrawal,
  };
}

interface WithdrawalResult {
  pensionWithdrawal: number;
  isaWithdrawal: number;
  lisaWithdrawal: number;
  taxableWithdrawal: number;
  taxFreeLumpSum: number;
  capitalGains: number;
  total: number;
}

// Tax-optimized withdrawal strategy for UK
function performWithdrawal(
  balances: AccountBalances,
  target: number,
  taxFreeLumpSumRemaining: number,
  _isScottish: boolean  // Reserved for future Scottish-specific logic
): WithdrawalResult {
  let remaining = target;
  let pensionWithdrawal = 0;
  let isaWithdrawal = 0;
  let lisaWithdrawal = 0;
  let taxableWithdrawal = 0;
  let taxFreeLumpSum = 0;
  let capitalGains = 0;

  // Strategy:
  // 1. Use tax-free lump sum from pension first (25% tax-free)
  // 2. Use ISA (completely tax-free)
  // 3. Use LISA (tax-free for retirement after 60)
  // 4. Use taxable account (may incur CGT)
  // 5. Use pension (taxed as income)

  // Step 1: Tax-free lump sum from pension
  if (remaining > 0 && taxFreeLumpSumRemaining > 0 && balances.pension > 0) {
    const lumpSumToTake = Math.min(remaining, taxFreeLumpSumRemaining, balances.pension);
    taxFreeLumpSum = lumpSumToTake;
    pensionWithdrawal += lumpSumToTake;
    balances.pension -= lumpSumToTake;
    remaining -= lumpSumToTake;
  }

  // Step 2: ISA withdrawals (tax-free)
  if (remaining > 0 && balances.isa > 0) {
    const isaToWithdraw = Math.min(remaining, balances.isa);
    isaWithdrawal = isaToWithdraw;
    balances.isa -= isaToWithdraw;
    remaining -= isaToWithdraw;
  }

  // Step 3: LISA withdrawals (tax-free after 60)
  if (remaining > 0 && balances.lisa > 0) {
    const lisaToWithdraw = Math.min(remaining, balances.lisa);
    lisaWithdrawal = lisaToWithdraw;
    balances.lisa -= lisaToWithdraw;
    remaining -= lisaToWithdraw;
  }

  // Step 4: Taxable account (GIA) - may incur CGT
  if (remaining > 0 && balances.taxable > 0) {
    const taxableToWithdraw = Math.min(remaining, balances.taxable);

    // Calculate capital gains (proportional to cost basis)
    if (balances.taxable > 0) {
      const gainRatio = 1 - balances.taxableCostBasis / balances.taxable;
      capitalGains = taxableToWithdraw * gainRatio;
      // Reduce cost basis proportionally
      balances.taxableCostBasis *= (balances.taxable - taxableToWithdraw) / balances.taxable;
    }

    taxableWithdrawal = taxableToWithdraw;
    balances.taxable -= taxableToWithdraw;
    remaining -= taxableToWithdraw;
  }

  // Step 5: Additional pension withdrawals (taxed as income)
  if (remaining > 0 && balances.pension > 0) {
    const pensionToWithdraw = Math.min(remaining, balances.pension);
    pensionWithdrawal += pensionToWithdraw;
    balances.pension -= pensionToWithdraw;
    remaining -= pensionToWithdraw;
  }

  const total = pensionWithdrawal + isaWithdrawal + lisaWithdrawal + taxableWithdrawal;

  return {
    pensionWithdrawal,
    isaWithdrawal,
    lisaWithdrawal,
    taxableWithdrawal,
    taxFreeLumpSum,
    capitalGains,
    total,
  };
}
