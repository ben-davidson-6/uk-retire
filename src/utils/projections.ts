import { Account, AccumulationResult, AccumulationYear, getTaxTreatment } from '../types';
import { LISA_BONUS_RATE, LISA_MAX_AGE } from './constants';

// Calculate employer contribution for workplace pension
function calculateEmployerContribution(account: Account): number {
  if (account.type !== 'workplace_pension') return 0;
  if (!account.employerContribution || !account.salaryForMatch) return 0;

  return account.salaryForMatch * (account.employerContribution / 100);
}

// Calculate LISA bonus (25% government bonus on contributions up to £4k)
function calculateLISABonus(account: Account, age: number): number {
  if (account.type !== 'lisa') return 0;
  if (age >= LISA_MAX_AGE) return 0;  // Cannot contribute after age 50

  return account.annualContribution * LISA_BONUS_RATE;
}

// Project account balances through the accumulation phase (working years)
export function calculateAccumulation(
  accounts: Account[],
  currentAge: number,
  retirementAge: number
): AccumulationResult {
  const years: AccumulationYear[] = [];
  const currentYear = new Date().getFullYear();

  // Initialize account balances
  const balances: Record<string, number> = {};
  accounts.forEach(account => {
    balances[account.id] = account.balance;
  });

  let totalContributions = 0;
  let totalReturns = 0;

  for (let age = currentAge; age <= retirementAge; age++) {
    const yearIndex = age - currentAge;
    const year = currentYear + yearIndex;

    // Calculate contributions and returns for each account
    let yearContributions = 0;
    let yearReturns = 0;

    accounts.forEach(account => {
      // Apply investment returns first
      const returns = balances[account.id] * account.expectedReturn;
      balances[account.id] += returns;
      yearReturns += returns;

      // Only add contributions if not yet at retirement age
      if (age < retirementAge) {
        // Calculate contribution with growth
        const growthFactor = Math.pow(1 + account.contributionGrowthRate, yearIndex);
        const contribution = account.annualContribution * growthFactor;

        // Add employer contribution for workplace pensions
        const employerContrib = calculateEmployerContribution(account) * growthFactor;

        // Add LISA bonus
        const lisaBonus = calculateLISABonus(account, age);

        const totalContrib = contribution + employerContrib + lisaBonus;
        balances[account.id] += totalContrib;
        yearContributions += totalContrib;
      }
    });

    totalContributions += yearContributions;
    totalReturns += yearReturns;

    // Calculate totals by tax treatment
    let pensionBalance = 0;
    let isaBalance = 0;
    let lisaBalance = 0;
    let taxableBalance = 0;

    accounts.forEach(account => {
      const treatment = getTaxTreatment(account.type);
      switch (treatment) {
        case 'pension':
          pensionBalance += balances[account.id];
          break;
        case 'isa':
          isaBalance += balances[account.id];
          break;
        case 'lisa':
          lisaBalance += balances[account.id];
          break;
        case 'taxable':
          taxableBalance += balances[account.id];
          break;
      }
    });

    const totalBalance = pensionBalance + isaBalance + lisaBalance + taxableBalance;

    years.push({
      age,
      year,
      accounts: { ...balances },
      totalBalance,
      pensionBalance,
      isaBalance,
      lisaBalance,
      taxableBalance,
      contributions: yearContributions,
      returns: yearReturns,
    });
  }

  const finalYear = years[years.length - 1];

  return {
    years,
    finalBalance: finalYear?.totalBalance ?? 0,
    totalContributions,
    totalReturns,
  };
}

// Get balance at a specific age from accumulation results
export function getBalanceAtAge(
  result: AccumulationResult,
  age: number
): AccumulationYear | undefined {
  return result.years.find(y => y.age === age);
}

// Calculate total contributions including employer matches and bonuses
export function calculateTotalContributions(accounts: Account[], years: number): number {
  let total = 0;

  accounts.forEach(account => {
    for (let year = 0; year < years; year++) {
      const growthFactor = Math.pow(1 + account.contributionGrowthRate, year);
      total += account.annualContribution * growthFactor;
      total += calculateEmployerContribution(account) * growthFactor;
      // Note: LISA bonus calculation would need age context
    }
  });

  return total;
}
