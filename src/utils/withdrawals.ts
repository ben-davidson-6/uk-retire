import {
  Assumptions,
  AccumulationResult,
  WithdrawalYear,
  RetirementResult,
  HouseholdProfile,
  Account,
  getTaxTreatment,
  TaxBracketTarget,
} from '../types';
import { calculateIncomeTax, calculateCapitalGainsTax } from './taxes';
import { TAX_FREE_LUMP_SUM_RATE, TAX_BRACKET_THRESHOLDS } from './constants';

interface AccountBalances {
  pension: number;
  isa: number;
  lisa: number;
  taxable: number;
  taxableCostBasis: number;  // For CGT calculations
}

// Per-person balances for couple mode
interface CoupleBalances {
  person1: AccountBalances;
  person2: AccountBalances;
}

// Calculate withdrawals through retirement (supports both single and couple modes)
export function calculateWithdrawals(
  accounts: Account[],
  household: HouseholdProfile,
  assumptions: Assumptions,
  accumulation: AccumulationResult
): RetirementResult {
  // For couple mode, we need to track per-person balances
  if (household.mode === 'couple' && household.person2) {
    return calculateCoupleWithdrawals(accounts, household, assumptions, accumulation);
  }
  return calculateSingleWithdrawals(accounts, household, assumptions, accumulation);
}

// Single-person withdrawal calculation (original logic with HouseholdProfile)
function calculateSingleWithdrawals(
  _accounts: Account[],
  household: HouseholdProfile,
  assumptions: Assumptions,
  accumulation: AccumulationResult
): RetirementResult {
  const profile = household.person1;
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

  // Calculate annual withdrawal target
  const totalPortfolio =
    balances.pension + balances.isa + balances.lisa + balances.taxable;

  // Use target income if set, otherwise fall back to SWR
  const baseWithdrawalTarget = assumptions.targetRetirementIncome !== null
    ? assumptions.targetRetirementIncome
    : totalPortfolio * assumptions.safeWithdrawalRate;

  let totalWithdrawn = 0;
  let totalTaxPaid = 0;
  let portfolioDepletionAge: number | null = null;

  for (let age = profile.retirementAge; age <= profile.lifeExpectancy; age++) {
    const yearIndex = age - profile.retirementAge;
    const year = currentYear + yearsUntilRetirement + yearIndex;

    // Years from today (current age) for inflation calculations
    const yearsFromToday = age - profile.currentAge;

    // Inflation-adjust the withdrawal target
    const inflationFactor = Math.pow(1 + assumptions.inflationRate, yearIndex);
    const withdrawalTarget = baseWithdrawalTarget * inflationFactor;

    // Tax band inflation factor (from today, not retirement)
    const taxBandInflationFactor = assumptions.inflateTaxBands
      ? Math.pow(1 + assumptions.inflationRate, yearsFromToday)
      : 1;

    // Calculate State Pension income (inflation-adjusted from today, not state pension age)
    // The state pension amount is in today's money, so it should grow with inflation from now
    let statePension = 0;
    if (age >= profile.statePensionAge) {
      const statePensionInflation = Math.pow(1 + assumptions.inflationRate, yearsFromToday);
      statePension = household.statePensionAmount * statePensionInflation;
    }

    // Calculate how much we need to withdraw from portfolio
    const neededFromPortfolio = Math.max(0, withdrawalTarget - statePension);

    // Starting balances for the year
    const startingBalance =
      balances.pension + balances.isa + balances.lisa + balances.taxable;

    // Determine tax bracket threshold to fill based on user preference (inflated if enabled)
    const thresholds = TAX_BRACKET_THRESHOLDS[profile.taxBracketTarget];
    const baseMaxTaxBracketThreshold = profile.isScottish ? thresholds.scottish : thresholds.uk;
    const maxTaxBracketThreshold = baseMaxTaxBracketThreshold === Infinity
      ? Infinity
      : Math.round(baseMaxTaxBracketThreshold * taxBandInflationFactor);

    // Check if private pension is accessible
    const canAccessPension = age >= profile.privatePensionAge;

    // Withdrawal strategy (optimized for tax efficiency using band-filling)
    const withdrawal = performWithdrawal(
      balances,
      neededFromPortfolio,
      taxFreeLumpSumRemaining,
      profile.isScottish,
      statePension,
      maxTaxBracketThreshold,
      canAccessPension
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

    // Calculate taxes (with inflated tax bands if enabled)
    const taxableIncome =
      statePension + withdrawal.pensionWithdrawal - withdrawal.taxFreeLumpSum;

    const { tax: incomeTax } = calculateIncomeTax(
      Math.max(0, taxableIncome),
      profile.isScottish,
      taxBandInflationFactor
    );

    const capitalGainsTax = calculateCapitalGainsTax(
      withdrawal.capitalGains,
      taxableIncome,
      profile.isScottish,
      taxBandInflationFactor
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

// Couple withdrawal calculation - optimizes across both people's tax allowances
function calculateCoupleWithdrawals(
  accounts: Account[],
  household: HouseholdProfile,
  assumptions: Assumptions,
  accumulation: AccumulationResult
): RetirementResult {
  const person1 = household.person1;
  const person2 = household.person2!;

  const years: WithdrawalYear[] = [];
  const currentYear = new Date().getFullYear();

  // Get final balances from accumulation per person
  const finalAccumYear = accumulation.years[accumulation.years.length - 1];

  // Split balances by account owner
  const person1Balances: AccountBalances = { pension: 0, isa: 0, lisa: 0, taxable: 0, taxableCostBasis: 0 };
  const person2Balances: AccountBalances = { pension: 0, isa: 0, lisa: 0, taxable: 0, taxableCostBasis: 0 };

  accounts.forEach(account => {
    const balance = finalAccumYear?.accounts[account.id] ?? account.balance;
    const treatment = getTaxTreatment(account.type);
    const targetBalances = (account.owner === 'person2') ? person2Balances : person1Balances;

    switch (treatment) {
      case 'pension':
        targetBalances.pension += balance;
        break;
      case 'isa':
        targetBalances.isa += balance;
        break;
      case 'lisa':
        targetBalances.lisa += balance;
        break;
      case 'taxable':
        targetBalances.taxable += balance;
        targetBalances.taxableCostBasis += balance * 0.5;  // Estimate 50% cost basis
        break;
    }
  });

  // Track tax-free lump sum per person
  let person1TaxFreeLumpSum = person1Balances.pension * TAX_FREE_LUMP_SUM_RATE;
  let person2TaxFreeLumpSum = person2Balances.pension * TAX_FREE_LUMP_SUM_RATE;

  // Calculate total portfolio and withdrawal target
  const totalPortfolio =
    person1Balances.pension + person1Balances.isa + person1Balances.lisa + person1Balances.taxable +
    person2Balances.pension + person2Balances.isa + person2Balances.lisa + person2Balances.taxable;

  // Use target income if set, otherwise fall back to SWR
  const baseWithdrawalTarget = assumptions.targetRetirementIncome !== null
    ? assumptions.targetRetirementIncome
    : totalPortfolio * assumptions.safeWithdrawalRate;

  let totalWithdrawn = 0;
  let totalTaxPaid = 0;
  let portfolioDepletionAge: number | null = null;

  // Use the older person's current age as reference, and longest life expectancy
  const oldestCurrentAge = Math.max(person1.currentAge, person2.currentAge);
  const earliestRetirementAge = Math.min(person1.retirementAge, person2.retirementAge);
  const latestLifeExpectancy = Math.max(person1.lifeExpectancy, person2.lifeExpectancy);
  const yearsUntilRetirement = earliestRetirementAge - oldestCurrentAge;

  for (let yearIndex = 0; yearIndex <= latestLifeExpectancy - earliestRetirementAge; yearIndex++) {
    const referenceAge = earliestRetirementAge + yearIndex;
    const year = currentYear + yearsUntilRetirement + yearIndex;

    // Calculate actual ages for each person
    const ageDiff1 = oldestCurrentAge - person1.currentAge;
    const ageDiff2 = oldestCurrentAge - person2.currentAge;
    const person1Age = referenceAge - ageDiff1 + (oldestCurrentAge - earliestRetirementAge);
    const person2Age = referenceAge - ageDiff2 + (oldestCurrentAge - earliestRetirementAge);

    // Years from today for each person (for inflation calculations)
    const person1YearsFromToday = person1Age - person1.currentAge;
    const person2YearsFromToday = person2Age - person2.currentAge;

    // Inflation-adjust the withdrawal target
    const inflationFactor = Math.pow(1 + assumptions.inflationRate, yearIndex);
    const withdrawalTarget = baseWithdrawalTarget * inflationFactor;

    // Tax band inflation factor (use average of both persons' years from today)
    const avgYearsFromToday = (person1YearsFromToday + person2YearsFromToday) / 2;
    const taxBandInflationFactor = assumptions.inflateTaxBands
      ? Math.pow(1 + assumptions.inflationRate, avgYearsFromToday)
      : 1;

    // Calculate State Pension - split 50/50 between both people
    // Inflation-adjusted from today (not from state pension age)
    let person1StatePension = 0;
    let person2StatePension = 0;
    const halfStatePension = household.statePensionAmount / 2;

    if (person1Age >= person1.statePensionAge) {
      const person1Inflation = Math.pow(1 + assumptions.inflationRate, person1YearsFromToday);
      person1StatePension = halfStatePension * person1Inflation;
    }
    if (person2Age >= person2.statePensionAge) {
      const person2Inflation = Math.pow(1 + assumptions.inflationRate, person2YearsFromToday);
      person2StatePension = halfStatePension * person2Inflation;
    }
    const totalStatePension = person1StatePension + person2StatePension;

    // Calculate how much we need to withdraw from portfolio
    const neededFromPortfolio = Math.max(0, withdrawalTarget - totalStatePension);

    // Starting balances for the year
    const startingBalance =
      person1Balances.pension + person1Balances.isa + person1Balances.lisa + person1Balances.taxable +
      person2Balances.pension + person2Balances.isa + person2Balances.lisa + person2Balances.taxable;

    // Check pension accessibility for each person
    const person1CanAccessPension = person1Age >= person1.privatePensionAge;
    const person2CanAccessPension = person2Age >= person2.privatePensionAge;

    // Perform couple withdrawal - optimizes across both people's tax allowances
    const withdrawal = performCoupleWithdrawal(
      { person1: person1Balances, person2: person2Balances },
      neededFromPortfolio,
      { person1: person1TaxFreeLumpSum, person2: person2TaxFreeLumpSum },
      { person1: person1.isScottish, person2: person2.isScottish },
      { person1: person1StatePension, person2: person2StatePension },
      { person1: person1.taxBracketTarget, person2: person2.taxBracketTarget },
      { person1: person1CanAccessPension, person2: person2CanAccessPension },
      taxBandInflationFactor
    );

    // Update tax-free lump sum remaining
    person1TaxFreeLumpSum = Math.max(0, person1TaxFreeLumpSum - withdrawal.person1TaxFreeLumpSum);
    person2TaxFreeLumpSum = Math.max(0, person2TaxFreeLumpSum - withdrawal.person2TaxFreeLumpSum);

    // Apply investment returns to remaining balances
    const returnRate = assumptions.retirementReturnRate;
    person1Balances.pension *= 1 + returnRate;
    person1Balances.isa *= 1 + returnRate;
    person1Balances.lisa *= 1 + returnRate;
    person1Balances.taxable *= 1 + returnRate;
    if (person1Balances.taxable > 0) person1Balances.taxableCostBasis *= 1 + returnRate;

    person2Balances.pension *= 1 + returnRate;
    person2Balances.isa *= 1 + returnRate;
    person2Balances.lisa *= 1 + returnRate;
    person2Balances.taxable *= 1 + returnRate;
    if (person2Balances.taxable > 0) person2Balances.taxableCostBasis *= 1 + returnRate;

    const endingBalance =
      person1Balances.pension + person1Balances.isa + person1Balances.lisa + person1Balances.taxable +
      person2Balances.pension + person2Balances.isa + person2Balances.lisa + person2Balances.taxable;

    // Calculate taxes for each person (with inflated tax bands if enabled)
    const person1TaxableIncome = person1StatePension + withdrawal.person1PensionWithdrawal - withdrawal.person1TaxFreeLumpSum;
    const person2TaxableIncome = person2StatePension + withdrawal.person2PensionWithdrawal - withdrawal.person2TaxFreeLumpSum;

    const { tax: person1IncomeTax } = calculateIncomeTax(Math.max(0, person1TaxableIncome), person1.isScottish, taxBandInflationFactor);
    const { tax: person2IncomeTax } = calculateIncomeTax(Math.max(0, person2TaxableIncome), person2.isScottish, taxBandInflationFactor);

    const person1CGT = calculateCapitalGainsTax(withdrawal.person1CapitalGains, person1TaxableIncome, person1.isScottish, taxBandInflationFactor);
    const person2CGT = calculateCapitalGainsTax(withdrawal.person2CapitalGains, person2TaxableIncome, person2.isScottish, taxBandInflationFactor);

    const incomeTax = person1IncomeTax + person2IncomeTax;
    const capitalGainsTax = person1CGT + person2CGT;
    const totalTax = incomeTax + capitalGainsTax;

    // Calculate totals
    const totalPensionWithdrawal = withdrawal.person1PensionWithdrawal + withdrawal.person2PensionWithdrawal;
    const totalIsaWithdrawal = withdrawal.person1IsaWithdrawal + withdrawal.person2IsaWithdrawal;
    const totalLisaWithdrawal = withdrawal.person1LisaWithdrawal + withdrawal.person2LisaWithdrawal;
    const totalTaxableWithdrawal = withdrawal.person1TaxableWithdrawal + withdrawal.person2TaxableWithdrawal;
    const totalTaxFreeLumpSum = withdrawal.person1TaxFreeLumpSum + withdrawal.person2TaxFreeLumpSum;

    const grossIncome =
      totalStatePension + totalPensionWithdrawal + totalIsaWithdrawal + totalLisaWithdrawal + totalTaxableWithdrawal;
    const netIncome = grossIncome - totalTax;

    totalWithdrawn += withdrawal.total;
    totalTaxPaid += totalTax;

    // Check for portfolio depletion
    const portfolioDepleted = endingBalance <= 0;
    if (portfolioDepleted && portfolioDepletionAge === null) {
      portfolioDepletionAge = referenceAge;
    }

    years.push({
      age: referenceAge,
      year,
      startingBalance,
      endingBalance: Math.max(0, endingBalance),

      statePension: totalStatePension,
      pensionWithdrawal: totalPensionWithdrawal,
      isaWithdrawal: totalIsaWithdrawal,
      lisaWithdrawal: totalLisaWithdrawal,
      taxableWithdrawal: totalTaxableWithdrawal,
      taxFreeLumpSum: totalTaxFreeLumpSum,
      totalWithdrawal: withdrawal.total,

      taxableIncome: Math.max(0, person1TaxableIncome + person2TaxableIncome),
      incomeTax,
      capitalGainsTax,
      totalTax,
      netIncome,

      pensionBalance: person1Balances.pension + person2Balances.pension,
      isaBalance: person1Balances.isa + person2Balances.isa,
      lisaBalance: person1Balances.lisa + person2Balances.lisa,
      taxableBalance: person1Balances.taxable + person2Balances.taxable,

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
// Uses "tax-band filling" approach: withdraw pension up to a target tax bracket,
// then supplement with ISA/LISA/GIA to avoid paying higher rates in later years
function performWithdrawal(
  balances: AccountBalances,
  target: number,
  taxFreeLumpSumRemaining: number,
  _isScottish: boolean,  // Reserved for potential Scottish-specific logic
  statePensionIncome: number,
  maxTaxBracketThreshold: number,  // e.g., 50270 to stay in basic rate
  canAccessPension: boolean  // Whether private pension is accessible (age >= privatePensionAge)
): WithdrawalResult {
  let remaining = target;
  let pensionWithdrawal = 0;
  let isaWithdrawal = 0;
  let lisaWithdrawal = 0;
  let taxableWithdrawal = 0;
  let taxFreeLumpSum = 0;
  let capitalGains = 0;

  // Tax-band filling strategy:
  // 1. Take tax-free lump sum from pension (25% tax-free) - always good (if pension accessible)
  // 2. Fill lower tax brackets with pension withdrawals (up to threshold) (if pension accessible)
  // 3. Use ISA/LISA (tax-free) to supplement
  // 4. Use GIA (CGT) if more needed
  // 5. Fall back to more pension if all else exhausted (if pension accessible)

  // Step 1: Tax-free lump sum from pension (only if pension is accessible)
  if (canAccessPension && remaining > 0 && taxFreeLumpSumRemaining > 0 && balances.pension > 0) {
    const lumpSumToTake = Math.min(remaining, taxFreeLumpSumRemaining, balances.pension);
    taxFreeLumpSum = lumpSumToTake;
    pensionWithdrawal += lumpSumToTake;
    balances.pension -= lumpSumToTake;
    remaining -= lumpSumToTake;
  }

  // Step 2: Fill tax brackets with pension (excluding tax-free lump sum from taxable income)
  // Calculate how much "room" we have in lower tax brackets
  // State pension is already taxable income, so we need to account for it
  const taxableIncomeAlready = statePensionIncome;  // Tax-free lump sum doesn't count
  const roomInLowerBrackets = Math.max(0, maxTaxBracketThreshold - taxableIncomeAlready);

  if (canAccessPension && remaining > 0 && balances.pension > 0 && roomInLowerBrackets > 0) {
    // Withdraw pension up to the tax bracket threshold
    const pensionToFillBracket = Math.min(remaining, roomInLowerBrackets, balances.pension);
    pensionWithdrawal += pensionToFillBracket;
    balances.pension -= pensionToFillBracket;
    remaining -= pensionToFillBracket;
  }

  // Step 3: ISA withdrawals (tax-free) to supplement
  if (remaining > 0 && balances.isa > 0) {
    const isaToWithdraw = Math.min(remaining, balances.isa);
    isaWithdrawal = isaToWithdraw;
    balances.isa -= isaToWithdraw;
    remaining -= isaToWithdraw;
  }

  // Step 4: LISA withdrawals (tax-free after 60)
  if (remaining > 0 && balances.lisa > 0) {
    const lisaToWithdraw = Math.min(remaining, balances.lisa);
    lisaWithdrawal = lisaToWithdraw;
    balances.lisa -= lisaToWithdraw;
    remaining -= lisaToWithdraw;
  }

  // Step 5: Taxable account (GIA) - may incur CGT but usually lower than income tax
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

  // Step 6: Additional pension withdrawals if we've exhausted other sources
  // (This will be taxed at higher rates, but we have no choice)
  if (canAccessPension && remaining > 0 && balances.pension > 0) {
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

// Couple withdrawal result type
interface CoupleWithdrawalResult {
  person1PensionWithdrawal: number;
  person1IsaWithdrawal: number;
  person1LisaWithdrawal: number;
  person1TaxableWithdrawal: number;
  person1TaxFreeLumpSum: number;
  person1CapitalGains: number;
  person2PensionWithdrawal: number;
  person2IsaWithdrawal: number;
  person2LisaWithdrawal: number;
  person2TaxableWithdrawal: number;
  person2TaxFreeLumpSum: number;
  person2CapitalGains: number;
  total: number;
}

// Couple withdrawal strategy - optimizes across both people's tax allowances
function performCoupleWithdrawal(
  balances: CoupleBalances,
  target: number,
  taxFreeLumpSum: { person1: number; person2: number },
  isScottish: { person1: boolean; person2: boolean },
  statePension: { person1: number; person2: number },
  taxBracketTarget: { person1: TaxBracketTarget; person2: TaxBracketTarget },
  canAccessPension: { person1: boolean; person2: boolean },
  taxBandInflationFactor: number = 1
): CoupleWithdrawalResult {
  let remaining = target;

  // Initialize per-person withdrawal tracking
  let p1Pension = 0, p1Isa = 0, p1Lisa = 0, p1Taxable = 0, p1TaxFreeLumpSum = 0, p1CapitalGains = 0;
  let p2Pension = 0, p2Isa = 0, p2Lisa = 0, p2Taxable = 0, p2TaxFreeLumpSum = 0, p2CapitalGains = 0;

  // Calculate tax bracket thresholds for each person (inflated if enabled)
  const p1Thresholds = TAX_BRACKET_THRESHOLDS[taxBracketTarget.person1];
  const p2Thresholds = TAX_BRACKET_THRESHOLDS[taxBracketTarget.person2];
  const p1BaseMaxBracket = isScottish.person1 ? p1Thresholds.scottish : p1Thresholds.uk;
  const p2BaseMaxBracket = isScottish.person2 ? p2Thresholds.scottish : p2Thresholds.uk;
  const p1MaxBracket = p1BaseMaxBracket === Infinity ? Infinity : Math.round(p1BaseMaxBracket * taxBandInflationFactor);
  const p2MaxBracket = p2BaseMaxBracket === Infinity ? Infinity : Math.round(p2BaseMaxBracket * taxBandInflationFactor);

  // Calculate room in lower tax brackets for each person
  const p1RoomInBracket = Math.max(0, p1MaxBracket - statePension.person1);
  const p2RoomInBracket = Math.max(0, p2MaxBracket - statePension.person2);

  // Step 1: Tax-free lump sums from both people's pensions
  if (canAccessPension.person1 && remaining > 0 && taxFreeLumpSum.person1 > 0 && balances.person1.pension > 0) {
    const lumpSum = Math.min(remaining, taxFreeLumpSum.person1, balances.person1.pension);
    p1TaxFreeLumpSum = lumpSum;
    p1Pension += lumpSum;
    balances.person1.pension -= lumpSum;
    remaining -= lumpSum;
  }
  if (canAccessPension.person2 && remaining > 0 && taxFreeLumpSum.person2 > 0 && balances.person2.pension > 0) {
    const lumpSum = Math.min(remaining, taxFreeLumpSum.person2, balances.person2.pension);
    p2TaxFreeLumpSum = lumpSum;
    p2Pension += lumpSum;
    balances.person2.pension -= lumpSum;
    remaining -= lumpSum;
  }

  // Step 2: Fill tax brackets with pension withdrawals - split between both people
  // This is the key tax optimization: use both people's lower tax bands
  if (remaining > 0) {
    // Person 1 pension filling
    if (canAccessPension.person1 && p1RoomInBracket > 0 && balances.person1.pension > 0) {
      const toWithdraw = Math.min(remaining, p1RoomInBracket, balances.person1.pension);
      p1Pension += toWithdraw;
      balances.person1.pension -= toWithdraw;
      remaining -= toWithdraw;
    }

    // Person 2 pension filling
    if (canAccessPension.person2 && remaining > 0 && p2RoomInBracket > 0 && balances.person2.pension > 0) {
      const toWithdraw = Math.min(remaining, p2RoomInBracket, balances.person2.pension);
      p2Pension += toWithdraw;
      balances.person2.pension -= toWithdraw;
      remaining -= toWithdraw;
    }
  }

  // Step 3: ISA withdrawals (tax-free) from both people
  if (remaining > 0 && balances.person1.isa > 0) {
    const toWithdraw = Math.min(remaining, balances.person1.isa);
    p1Isa = toWithdraw;
    balances.person1.isa -= toWithdraw;
    remaining -= toWithdraw;
  }
  if (remaining > 0 && balances.person2.isa > 0) {
    const toWithdraw = Math.min(remaining, balances.person2.isa);
    p2Isa = toWithdraw;
    balances.person2.isa -= toWithdraw;
    remaining -= toWithdraw;
  }

  // Step 4: LISA withdrawals from both people
  if (remaining > 0 && balances.person1.lisa > 0) {
    const toWithdraw = Math.min(remaining, balances.person1.lisa);
    p1Lisa = toWithdraw;
    balances.person1.lisa -= toWithdraw;
    remaining -= toWithdraw;
  }
  if (remaining > 0 && balances.person2.lisa > 0) {
    const toWithdraw = Math.min(remaining, balances.person2.lisa);
    p2Lisa = toWithdraw;
    balances.person2.lisa -= toWithdraw;
    remaining -= toWithdraw;
  }

  // Step 5: Taxable accounts (GIA) - use both people's CGT allowances
  if (remaining > 0 && balances.person1.taxable > 0) {
    const toWithdraw = Math.min(remaining, balances.person1.taxable);
    if (balances.person1.taxable > 0) {
      const gainRatio = 1 - balances.person1.taxableCostBasis / balances.person1.taxable;
      p1CapitalGains = toWithdraw * gainRatio;
      balances.person1.taxableCostBasis *= (balances.person1.taxable - toWithdraw) / balances.person1.taxable;
    }
    p1Taxable = toWithdraw;
    balances.person1.taxable -= toWithdraw;
    remaining -= toWithdraw;
  }
  if (remaining > 0 && balances.person2.taxable > 0) {
    const toWithdraw = Math.min(remaining, balances.person2.taxable);
    if (balances.person2.taxable > 0) {
      const gainRatio = 1 - balances.person2.taxableCostBasis / balances.person2.taxable;
      p2CapitalGains = toWithdraw * gainRatio;
      balances.person2.taxableCostBasis *= (balances.person2.taxable - toWithdraw) / balances.person2.taxable;
    }
    p2Taxable = toWithdraw;
    balances.person2.taxable -= toWithdraw;
    remaining -= toWithdraw;
  }

  // Step 6: Additional pension withdrawals if needed (higher tax rates)
  if (canAccessPension.person1 && remaining > 0 && balances.person1.pension > 0) {
    const toWithdraw = Math.min(remaining, balances.person1.pension);
    p1Pension += toWithdraw;
    balances.person1.pension -= toWithdraw;
    remaining -= toWithdraw;
  }
  if (canAccessPension.person2 && remaining > 0 && balances.person2.pension > 0) {
    const toWithdraw = Math.min(remaining, balances.person2.pension);
    p2Pension += toWithdraw;
    balances.person2.pension -= toWithdraw;
    remaining -= toWithdraw;
  }

  const total = p1Pension + p1Isa + p1Lisa + p1Taxable + p2Pension + p2Isa + p2Lisa + p2Taxable;

  return {
    person1PensionWithdrawal: p1Pension,
    person1IsaWithdrawal: p1Isa,
    person1LisaWithdrawal: p1Lisa,
    person1TaxableWithdrawal: p1Taxable,
    person1TaxFreeLumpSum: p1TaxFreeLumpSum,
    person1CapitalGains: p1CapitalGains,
    person2PensionWithdrawal: p2Pension,
    person2IsaWithdrawal: p2Isa,
    person2LisaWithdrawal: p2Lisa,
    person2TaxableWithdrawal: p2Taxable,
    person2TaxFreeLumpSum: p2TaxFreeLumpSum,
    person2CapitalGains: p2CapitalGains,
    total,
  };
}
