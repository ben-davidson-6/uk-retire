import { AccumulationResult, RetirementResult, Profile } from '../types';
import { formatGBP, formatPercent } from '../utils/constants';

interface SummaryCardsProps {
  accumulation: AccumulationResult;
  retirement: RetirementResult;
  profile: Profile;
}

interface CardProps {
  title: string;
  value: string;
  subtitle?: string;
  color?: 'blue' | 'green' | 'amber' | 'red' | 'purple';
}

function Card({ title, value, subtitle, color = 'blue' }: CardProps) {
  const colorClasses = {
    blue: 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/30',
    green: 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/30',
    amber: 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/30',
    red: 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30',
    purple: 'border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/30',
  };

  return (
    <div className={`rounded-lg border p-4 ${colorClasses[color]}`}>
      <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</h3>
      <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
      {subtitle && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
      )}
    </div>
  );
}

export function SummaryCards({ accumulation, retirement, profile }: SummaryCardsProps) {
  const yearsToRetirement = profile.retirementAge - profile.currentAge;
  const retirementLength = profile.lifeExpectancy - profile.retirementAge;

  const effectiveTaxRate = retirement.totalTaxPaid / (retirement.totalWithdrawn || 1);
  const averageAnnualTax = retirement.totalTaxPaid / retirementLength;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card
        title="Portfolio at Retirement"
        value={formatGBP(accumulation.finalBalance)}
        subtitle={`After ${yearsToRetirement} years`}
        color="blue"
      />
      <Card
        title="Total Contributions"
        value={formatGBP(accumulation.totalContributions)}
        subtitle="Including employer contributions"
        color="green"
      />
      <Card
        title="Investment Growth"
        value={formatGBP(accumulation.totalReturns)}
        subtitle={`${formatPercent(accumulation.totalReturns / (accumulation.totalContributions || 1))} return`}
        color="purple"
      />
      <Card
        title="Portfolio Lasts Until"
        value={retirement.portfolioDepletionAge ? `Age ${retirement.portfolioDepletionAge}` : `${profile.lifeExpectancy}+`}
        subtitle={retirement.portfolioDepletionAge ? 'Depleted before life expectancy' : 'Sustainable'}
        color={retirement.portfolioDepletionAge ? 'red' : 'green'}
      />
      <Card
        title="Total Retirement Income"
        value={formatGBP(retirement.totalWithdrawn)}
        subtitle={`Over ${retirementLength} years`}
        color="blue"
      />
      <Card
        title="Total Tax Paid"
        value={formatGBP(retirement.totalTaxPaid)}
        subtitle={`${formatPercent(effectiveTaxRate)} effective rate`}
        color="amber"
      />
      <Card
        title="Average Annual Tax"
        value={formatGBP(averageAnnualTax)}
        subtitle="During retirement"
        color="amber"
      />
      <Card
        title="Sustainable Withdrawal"
        value={formatGBP(retirement.sustainableWithdrawal)}
        subtitle="Annual (4% rule)"
        color="green"
      />
    </div>
  );
}
