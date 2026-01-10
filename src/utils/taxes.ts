import {
  UK_TAX_BANDS,
  SCOTTISH_TAX_BANDS,
  PERSONAL_ALLOWANCE,
  PERSONAL_ALLOWANCE_TAPER_THRESHOLD,
  CGT_ANNUAL_EXEMPT_AMOUNT,
  CGT_BASIC_RATE,
  CGT_HIGHER_RATE,
  getEffectivePersonalAllowance,
} from './constants';

interface TaxBand {
  min: number;
  max: number;
  rate: number;
  name: string;
}

// Get the appropriate tax bands based on Scottish status
// inflationFactor is optional - if provided, thresholds are inflated (but not the Infinity max)
export function getTaxBands(isScottish: boolean, inflationFactor: number = 1): TaxBand[] {
  const baseBands = isScottish ? SCOTTISH_TAX_BANDS : UK_TAX_BANDS;
  if (inflationFactor === 1) {
    return baseBands;
  }
  return baseBands.map(band => ({
    ...band,
    min: Math.round(band.min * inflationFactor),
    max: band.max === Infinity ? Infinity : Math.round(band.max * inflationFactor),
  }));
}

// Calculate income tax on a given income
// inflationFactor is optional - if provided, tax band thresholds are inflated
export function calculateIncomeTax(
  grossIncome: number,
  isScottish: boolean = false,
  inflationFactor: number = 1
): { tax: number; breakdown: { band: string; amount: number; tax: number }[] } {
  if (grossIncome <= 0) {
    return { tax: 0, breakdown: [] };
  }

  const bands = getTaxBands(isScottish, inflationFactor);
  // Inflate personal allowance thresholds too
  const inflatedPersonalAllowance = Math.round(PERSONAL_ALLOWANCE * inflationFactor);
  const inflatedTaperThreshold = Math.round(PERSONAL_ALLOWANCE_TAPER_THRESHOLD * inflationFactor);

  // Calculate effective personal allowance (tapers above threshold)
  let personalAllowance = inflatedPersonalAllowance;
  if (grossIncome > inflatedTaperThreshold) {
    const reduction = Math.floor((grossIncome - inflatedTaperThreshold) / 2);
    personalAllowance = Math.max(0, inflatedPersonalAllowance - reduction);
  }

  // Adjust bands for personal allowance
  const adjustedBands = bands.map((band, index) => {
    if (index === 0) {
      return { ...band, max: personalAllowance };
    }
    // Shift other bands by the difference from standard personal allowance
    const shift = inflatedPersonalAllowance - personalAllowance;
    return {
      ...band,
      min: Math.max(0, band.min - shift),
      max: band.max === Infinity ? Infinity : band.max - shift,
    };
  });

  let remainingIncome = grossIncome;
  let totalTax = 0;
  const breakdown: { band: string; amount: number; tax: number }[] = [];

  for (const band of adjustedBands) {
    if (remainingIncome <= 0) break;
    if (grossIncome <= band.min) continue;

    const taxableInBand = Math.min(
      remainingIncome,
      Math.max(0, Math.min(grossIncome, band.max) - band.min)
    );

    if (taxableInBand > 0) {
      const taxInBand = taxableInBand * band.rate;
      totalTax += taxInBand;
      breakdown.push({
        band: band.name,
        amount: taxableInBand,
        tax: taxInBand,
      });
      remainingIncome -= taxableInBand;
    }
  }

  return { tax: totalTax, breakdown };
}

// Calculate capital gains tax
// inflationFactor is optional - if provided, CGT thresholds are inflated
export function calculateCapitalGainsTax(
  capitalGains: number,
  otherIncome: number,
  isScottish: boolean = false,
  inflationFactor: number = 1
): number {
  if (capitalGains <= 0) return 0;

  // Apply annual exempt amount (inflated if applicable)
  const inflatedCGTAllowance = Math.round(CGT_ANNUAL_EXEMPT_AMOUNT * inflationFactor);
  const taxableGains = Math.max(0, capitalGains - inflatedCGTAllowance);
  if (taxableGains <= 0) return 0;

  // Determine if basic or higher rate applies
  // CGT rates depend on your income tax band after gains are added
  const inflatedPersonalAllowance = Math.round(PERSONAL_ALLOWANCE * inflationFactor);
  const inflatedTaperThreshold = Math.round(PERSONAL_ALLOWANCE_TAPER_THRESHOLD * inflationFactor);

  // Calculate effective personal allowance (tapers above threshold)
  let personalAllowance = inflatedPersonalAllowance;
  if (otherIncome + taxableGains > inflatedTaperThreshold) {
    const reduction = Math.floor((otherIncome + taxableGains - inflatedTaperThreshold) / 2);
    personalAllowance = Math.max(0, inflatedPersonalAllowance - reduction);
  }

  // Basic rate limit (inflated)
  const basicRateLimit = Math.round((isScottish ? 43662 : 50270) * inflationFactor);

  const incomeAboveAllowance = Math.max(0, otherIncome - personalAllowance);
  const remainingBasicBand = Math.max(0, basicRateLimit - personalAllowance - incomeAboveAllowance);

  // Gains within basic rate band
  const gainsAtBasicRate = Math.min(taxableGains, remainingBasicBand);
  const gainsAtHigherRate = Math.max(0, taxableGains - gainsAtBasicRate);

  return gainsAtBasicRate * CGT_BASIC_RATE + gainsAtHigherRate * CGT_HIGHER_RATE;
}

// Calculate total tax (income + CGT)
export function calculateTotalTax(
  income: number,
  capitalGains: number,
  isScottish: boolean = false
): { incomeTax: number; capitalGainsTax: number; totalTax: number } {
  const { tax: incomeTax } = calculateIncomeTax(income, isScottish);
  const capitalGainsTax = calculateCapitalGainsTax(capitalGains, income, isScottish);

  return {
    incomeTax,
    capitalGainsTax,
    totalTax: incomeTax + capitalGainsTax,
  };
}

// Get the marginal tax rate for the next pound of income
export function getMarginalTaxRate(income: number, isScottish: boolean = false): number {
  const bands = getTaxBands(isScottish);
  const personalAllowance = getEffectivePersonalAllowance(income);

  // Check if in personal allowance taper zone (60% effective rate)
  if (income > PERSONAL_ALLOWANCE_TAPER_THRESHOLD && income < 125140) {
    // In this range, effective marginal rate is 60% (40% + 20% from losing allowance)
    return 0.60;
  }

  for (const band of bands) {
    // Adjust for personal allowance
    const adjustedMin = band.min === 0 ? 0 : band.min;
    const adjustedMax = band.max;

    if (income >= adjustedMin && income < adjustedMax) {
      // If below personal allowance, no tax
      if (income < personalAllowance) return 0;
      return band.rate;
    }
  }

  // Above all bands, return top rate
  return bands[bands.length - 1].rate;
}

// Get effective tax rate
export function getEffectiveTaxRate(
  income: number,
  capitalGains: number = 0,
  isScottish: boolean = false
): number {
  if (income + capitalGains <= 0) return 0;

  const { totalTax } = calculateTotalTax(income, capitalGains, isScottish);
  return totalTax / (income + capitalGains);
}

// Calculate pension tax relief (contribution from net pay gets grossed up)
export function calculatePensionTaxRelief(
  netContribution: number,
  marginalRate: number
): number {
  // Basic rate relief is added automatically (20% on grossed-up amount)
  // Higher/additional rate relief must be claimed via self-assessment
  const grossContribution = netContribution / (1 - 0.20);  // Basic rate gross-up
  const additionalRelief = grossContribution * Math.max(0, marginalRate - 0.20);
  return grossContribution - netContribution + additionalRelief;
}
