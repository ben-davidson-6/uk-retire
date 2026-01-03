import { useMemo } from 'react';
import { Account, HouseholdProfile, Assumptions, AccumulationResult, RetirementResult } from '../types';
import { calculateAccumulation } from '../utils/projections';
import { calculateWithdrawals } from '../utils/withdrawals';

interface RetirementCalculation {
  accumulation: AccumulationResult;
  retirement: RetirementResult;
}

export function useRetirementCalculator(
  accounts: Account[],
  household: HouseholdProfile,
  assumptions: Assumptions
): RetirementCalculation | null {
  return useMemo(() => {
    if (accounts.length === 0) {
      return null;
    }

    // Calculate accumulation phase
    const accumulation = calculateAccumulation(accounts, household);

    // Calculate withdrawal/retirement phase
    const retirement = calculateWithdrawals(
      accounts,
      household,
      assumptions,
      accumulation
    );

    return {
      accumulation,
      retirement,
    };
  }, [accounts, household, assumptions]);
}
