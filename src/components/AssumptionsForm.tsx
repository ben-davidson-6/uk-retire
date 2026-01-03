import { Assumptions } from '../types';
import { NumberInput } from './NumberInput';
import { Tooltip } from './Tooltip';

interface AssumptionsFormProps {
  assumptions: Assumptions;
  onChange: (assumptions: Assumptions) => void;
}

const inputClassName = `
  w-full px-3 py-2
  border border-gray-300 dark:border-gray-600
  rounded-md shadow-sm
  bg-white dark:bg-gray-700
  text-gray-900 dark:text-gray-100
  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
`;

export function AssumptionsForm({ assumptions, onChange }: AssumptionsFormProps) {
  const handleChange = (field: keyof Assumptions, value: number) => {
    onChange({ ...assumptions, [field]: value });
  };

  const handleTargetIncomeChange = (value: number | null) => {
    onChange({ ...assumptions, targetRetirementIncome: value });
  };

  const useTargetIncome = assumptions.targetRetirementIncome !== null;

  return (
    <div className="space-y-4">
      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Target Retirement Income
          <Tooltip content="Your desired annual income in retirement (in today's money). This will be inflation-adjusted each year. Leave empty to use the Safe Withdrawal Rate instead." />
        </label>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={useTargetIncome}
              onChange={(e) => handleTargetIncomeChange(e.target.checked ? 40000 : null)}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">Use target income</span>
          </label>
        </div>
        {useTargetIncome && (
          <div className="mt-2">
            <NumberInput
              value={assumptions.targetRetirementIncome ?? 40000}
              onChange={(v) => handleTargetIncomeChange(v)}
              min={10000}
              max={500000}
              step={1000}
              prefix="£"
              suffix="/year"
              className={inputClassName}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              In today's money, will be inflation-adjusted
            </p>
          </div>
        )}
      </div>

      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Inflation Rate
          <Tooltip content="Expected annual inflation rate. The Bank of England targets 2%, but long-term average is around 3%." />
        </label>
        <NumberInput
          value={assumptions.inflationRate * 100}
          onChange={(v) => handleChange('inflationRate', v / 100)}
          min={0}
          max={10}
          step={0.5}
          suffix="%"
          className={inputClassName}
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          BoE target: 2%
        </p>
      </div>

      {!useTargetIncome && (
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Safe Withdrawal Rate
            <Tooltip content="Annual withdrawal as a percentage of your portfolio at retirement. The '4% rule' suggests this rate allows a portfolio to last 30 years." />
          </label>
          <NumberInput
            value={assumptions.safeWithdrawalRate * 100}
            onChange={(v) => handleChange('safeWithdrawalRate', v / 100)}
            min={1}
            max={10}
            step={0.25}
            suffix="%"
            className={inputClassName}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Traditional rule: 4%
          </p>
        </div>
      )}

      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Retirement Return Rate
          <Tooltip content="Expected investment return during retirement. Usually lower than accumulation phase due to more conservative allocation." />
        </label>
        <NumberInput
          value={assumptions.retirementReturnRate * 100}
          onChange={(v) => handleChange('retirementReturnRate', v / 100)}
          min={0}
          max={15}
          step={0.5}
          suffix="%"
          className={inputClassName}
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Conservative estimate: 4-5%
        </p>
      </div>
    </div>
  );
}
