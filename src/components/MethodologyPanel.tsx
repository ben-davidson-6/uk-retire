import { Profile, Assumptions } from '../types';
import {
  UK_TAX_BANDS,
  SCOTTISH_TAX_BANDS,
  CGT_ANNUAL_EXEMPT_AMOUNT,
  CGT_BASIC_RATE,
  CGT_HIGHER_RATE,
  formatGBP,
  formatPercent,
} from '../utils/constants';

interface MethodologyPanelProps {
  profile: Profile;
  assumptions: Assumptions;
}

export function MethodologyPanel({ profile, assumptions }: MethodologyPanelProps) {
  const taxBands = profile.isScottish ? SCOTTISH_TAX_BANDS : UK_TAX_BANDS;

  return (
    <div className="space-y-8 text-gray-700 dark:text-gray-300">
      {/* Overview */}
      <section>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          Overview
        </h3>
        <p className="mb-3">
          This calculator projects your retirement finances in two phases:
        </p>
        <ul className="list-disc list-inside space-y-1 ml-4">
          <li>
            <strong>Accumulation Phase</strong>: From your current age ({profile.currentAge}) to
            retirement ({profile.retirementAge}), tracking portfolio growth through contributions
            and investment returns.
          </li>
          <li>
            <strong>Withdrawal Phase</strong>: From retirement to life expectancy (
            {profile.lifeExpectancy}), simulating tax-efficient withdrawals and income from the
            State Pension.
          </li>
        </ul>
      </section>

      {/* Current Assumptions */}
      <section>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          Current Assumptions
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Economic</h4>
            <ul className="text-sm space-y-1">
              <li>Inflation: {formatPercent(assumptions.inflationRate)}</li>
              <li>Safe Withdrawal Rate: {formatPercent(assumptions.safeWithdrawalRate)}</li>
              <li>Retirement Returns: {formatPercent(assumptions.retirementReturnRate)}</li>
            </ul>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Personal</h4>
            <ul className="text-sm space-y-1">
              <li>Tax Region: {profile.isScottish ? 'Scotland' : 'Rest of UK'}</li>
              <li>State Pension: {formatGBP(profile.statePensionAmount)}/year</li>
              <li>State Pension Age: {profile.statePensionAge}</li>
            </ul>
          </div>
        </div>
      </section>

      {/* UK Account Types */}
      <section>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          UK Account Types
        </h3>
        <div className="space-y-3">
          <div className="border-l-4 border-blue-500 pl-4">
            <h4 className="font-medium text-gray-900 dark:text-white">
              Workplace Pension & SIPP
            </h4>
            <p className="text-sm">
              Contributions receive tax relief at your marginal rate. Withdrawals are taxed as
              income, but 25% can be taken tax-free. No required minimum distributions in the UK.
            </p>
          </div>
          <div className="border-l-4 border-green-500 pl-4">
            <h4 className="font-medium text-gray-900 dark:text-white">ISA</h4>
            <p className="text-sm">
              Contributions from post-tax income. All growth and withdrawals are completely
              tax-free. Annual limit: £20,000.
            </p>
          </div>
          <div className="border-l-4 border-purple-500 pl-4">
            <h4 className="font-medium text-gray-900 dark:text-white">Lifetime ISA</h4>
            <p className="text-sm">
              25% government bonus on contributions up to £4,000/year. Can be used for first home
              or retirement (after age 60). Withdrawals for other purposes incur a 25% penalty.
            </p>
          </div>
          <div className="border-l-4 border-amber-500 pl-4">
            <h4 className="font-medium text-gray-900 dark:text-white">
              General Investment Account (GIA)
            </h4>
            <p className="text-sm">
              No contribution limits. Gains are subject to Capital Gains Tax (after annual
              exemption), and dividends are taxed at dividend rates.
            </p>
          </div>
        </div>
      </section>

      {/* Withdrawal Strategy */}
      <section>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          Withdrawal Strategy
        </h3>
        <p className="mb-3">
          The calculator uses a tax-optimised withdrawal order to minimise your tax bill:
        </p>
        <ol className="list-decimal list-inside space-y-2 ml-4">
          <li>
            <strong>Tax-Free Pension Lump Sum</strong>: Take up to 25% of your pension pot
            tax-free.
          </li>
          <li>
            <strong>ISA Withdrawals</strong>: Completely tax-free, use before taxable accounts.
          </li>
          <li>
            <strong>LISA Withdrawals</strong>: Tax-free after age 60 for retirement purposes.
          </li>
          <li>
            <strong>GIA Withdrawals</strong>: May trigger Capital Gains Tax, but at lower rates
            than income tax.
          </li>
          <li>
            <strong>Pension Withdrawals</strong>: Taxed as income, use last to keep in lower tax
            brackets.
          </li>
        </ol>
      </section>

      {/* Income Tax Rates */}
      <section>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          Income Tax Rates (2024/25)
        </h3>
        <p className="text-sm mb-3">
          {profile.isScottish ? 'Scottish rates' : 'Rates for England, Wales & Northern Ireland'}
        </p>
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                Band
              </th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">
                Income Range
              </th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">
                Rate
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {taxBands.map((band) => (
              <tr key={band.name}>
                <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{band.name}</td>
                <td className="px-4 py-2 text-sm text-right text-gray-600 dark:text-gray-400">
                  {band.max === Infinity
                    ? `Over ${formatGBP(band.min)}`
                    : `${formatGBP(band.min)} - ${formatGBP(band.max)}`}
                </td>
                <td className="px-4 py-2 text-sm text-right text-gray-900 dark:text-white">
                  {formatPercent(band.rate, 0)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Note: Personal Allowance reduces by £1 for every £2 earned over £100,000, reaching zero
          at £125,140.
        </p>
      </section>

      {/* Capital Gains Tax */}
      <section>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          Capital Gains Tax (2024/25)
        </h3>
        <ul className="list-disc list-inside space-y-1 ml-4">
          <li>Annual Exempt Amount: {formatGBP(CGT_ANNUAL_EXEMPT_AMOUNT)}</li>
          <li>Basic Rate (if total income in basic band): {formatPercent(CGT_BASIC_RATE, 0)}</li>
          <li>Higher Rate (if in higher/additional band): {formatPercent(CGT_HIGHER_RATE, 0)}</li>
        </ul>
        <p className="text-sm mt-2">
          CGT applies to gains in your GIA. ISA and pension withdrawals are exempt from CGT.
        </p>
      </section>

      {/* State Pension */}
      <section>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          State Pension
        </h3>
        <ul className="list-disc list-inside space-y-1 ml-4">
          <li>
            The full new State Pension (2024/25) is £221.20/week (approximately £11,502/year)
          </li>
          <li>Your amount depends on your National Insurance contribution record</li>
          <li>State Pension is taxable income but collected without tax deducted</li>
          <li>State Pension age is currently 66, rising to 67 by 2028 and 68 by 2046</li>
          <li>The calculator inflation-adjusts State Pension payments each year</li>
        </ul>
      </section>

      {/* Limitations */}
      <section>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          Limitations & Assumptions
        </h3>
        <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
          <li>Uses 2024/25 tax rates without future inflation adjustment</li>
          <li>Does not account for National Insurance contributions</li>
          <li>Assumes constant investment returns (no sequence of returns risk)</li>
          <li>GIA cost basis estimated at 50% of value</li>
          <li>Does not model defined benefit pensions</li>
          <li>LISA early withdrawal penalties not modelled (assumes retirement use only)</li>
          <li>Does not include inheritance tax planning</li>
          <li>
            <strong>For educational purposes only</strong> - consult a qualified financial adviser
            for personal advice
          </li>
        </ul>
      </section>
    </div>
  );
}
