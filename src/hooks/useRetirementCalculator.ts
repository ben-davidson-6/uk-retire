import { useMemo } from 'react';
import { Account, Profile, Assumptions, AccumulationResult, RetirementResult } from '../types';
import { calculateAccumulation } from '../utils/projections';
import { calculateWithdrawals } from '../utils/withdrawals';

interface RetirementCalculation {
  accumulation: AccumulationResult;
  retirement: RetirementResult;
}

export function useRetirementCalculator(
  accounts: Account[],
  profile: Profile,
  assumptions: Assumptions
): RetirementCalculation | null {
  return useMemo(() => {
    if (accounts.length === 0) {
      return null;
    }

    // Calculate accumulation phase
    const accumulation = calculateAccumulation(
      accounts,
      profile.currentAge,
      profile.retirementAge
    );

    // Calculate withdrawal/retirement phase
    const retirement = calculateWithdrawals(
      accounts,
      profile,
      assumptions,
      accumulation
    );

    return {
      accumulation,
      retirement,
    };
  }, [accounts, profile, assumptions]);
}
