import { Account, AccumulationResult, AccumulationYear, getTaxTreatment, HouseholdProfile } from '../types';
import { LISA_BONUS_RATE, LISA_MAX_AGE } from './constants';

// Calculate employer contribution for workplace pension
function calculateEmployerContribution(account: Account): number {
  if (account.type !== 'workplace_pension') return 0;
  if (!account.employerContribution || !account.salaryForMatch) return 0;

  return account.salaryForMatch * (account.employerContribution / 100);
}

// Calculate LISA bonus (25% government bonus on contributions up to £4k)
function calculateLISABonus(account: Account, ownerAge: number): number {
  if (account.type !== 'lisa') return 0;
  if (ownerAge >= LISA_MAX_AGE) return 0;  // Cannot contribute after age 50

  return account.annualContribution * LISA_BONUS_RATE;
}

// Get the owner's age for a given account and year
function getOwnerAge(
  account: Account,
  yearIndex: number,
  household: HouseholdProfile
): number {
  if (household.mode === 'single' || !account.owner || account.owner === 'person1') {
    return household.person1.currentAge + yearIndex;
  }
  return (household.person2?.currentAge ?? household.person1.currentAge) + yearIndex;
}

// Check if the owner is still working (not retired yet)
function isOwnerWorking(
  account: Account,
  yearIndex: number,
  household: HouseholdProfile
): boolean {
  const ownerAge = getOwnerAge(account, yearIndex, household);
  if (household.mode === 'single' || !account.owner || account.owner === 'person1') {
    return ownerAge < household.person1.retirementAge;
  }
  return ownerAge < (household.person2?.retirementAge ?? household.person1.retirementAge);
}

// Project account balances through the accumulation phase (working years)
// Supports both single and couple modes via HouseholdProfile
export function calculateAccumulation(
  accounts: Account[],
  household: HouseholdProfile
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

  // Determine the planning horizon - use the latest retirement age
  const person1RetirementAge = household.person1.retirementAge;
  const person2RetirementAge = household.person2?.retirementAge ?? 0;
  const latestRetirementAge = Math.max(person1RetirementAge, person2RetirementAge);

  // Use the oldest person's current age as the starting point
  const person1CurrentAge = household.person1.currentAge;
  const person2CurrentAge = household.person2?.currentAge ?? 0;
  const oldestCurrentAge = household.mode === 'couple'
    ? Math.max(person1CurrentAge, person2CurrentAge)
    : person1CurrentAge;

  // For single mode, use person1's ages
  const effectiveCurrentAge = household.mode === 'single' ? person1CurrentAge : oldestCurrentAge;
  const effectiveRetirementAge = household.mode === 'single' ? person1RetirementAge : latestRetirementAge;

  for (let yearIndex = 0; yearIndex <= effectiveRetirementAge - effectiveCurrentAge; yearIndex++) {
    const age = effectiveCurrentAge + yearIndex;
    const year = currentYear + yearIndex;

    // Calculate contributions and returns for each account
    let yearContributions = 0;
    let yearReturns = 0;

    accounts.forEach(account => {
      // Apply investment returns first
      const returns = balances[account.id] * account.expectedReturn;
      balances[account.id] += returns;
      yearReturns += returns;

      // Only add contributions if owner is still working
      if (isOwnerWorking(account, yearIndex, household)) {
        // Calculate contribution with growth
        const growthFactor = Math.pow(1 + account.contributionGrowthRate, yearIndex);
        const contribution = account.annualContribution * growthFactor;

        // Add employer contribution for workplace pensions
        const employerContrib = calculateEmployerContribution(account) * growthFactor;

        // Add LISA bonus (based on owner's age)
        const ownerAge = getOwnerAge(account, yearIndex, household);
        const lisaBonus = calculateLISABonus(account, ownerAge);

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

// Legacy function signature for backward compatibility
export function calculateAccumulationLegacy(
  accounts: Account[],
  currentAge: number,
  retirementAge: number
): AccumulationResult {
  const household: HouseholdProfile = {
    mode: 'single',
    person1: {
      name: 'Person 1',
      currentAge,
      retirementAge,
      lifeExpectancy: 90,
      privatePensionAge: 57,
      statePensionAge: 66,
      isScottish: false,
      taxBracketTarget: 'basic_rate',
    },
    statePensionAmount: 0,
  };
  return calculateAccumulation(accounts, household);
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
