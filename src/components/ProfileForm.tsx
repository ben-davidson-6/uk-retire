import { Profile, TaxBracketTarget } from '../types';
import { NumberInput } from './NumberInput';
import { Tooltip } from './Tooltip';
import { FULL_STATE_PENSION_ANNUAL, STATE_PENSION_AGE, MINIMUM_PENSION_ACCESS_AGE } from '../utils/constants';

const TAX_BRACKET_OPTIONS: { value: TaxBracketTarget; label: string; description: string }[] = [
  { value: 'personal_allowance', label: 'Personal Allowance (£12,570)', description: '0% tax on pension withdrawals' },
  { value: 'basic_rate', label: 'Basic Rate (£50,270)', description: 'Max 20% tax on pension withdrawals' },
  { value: 'higher_rate', label: 'Higher Rate (£125,140)', description: 'Max 40% tax on pension withdrawals' },
  { value: 'no_limit', label: 'No limit (draw pension last)', description: 'Original strategy - deplete ISA/GIA first' },
];

interface ProfileFormProps {
  profile: Profile;
  onChange: (profile: Profile) => void;
}

const inputClassName = `
  w-full px-3 py-2
  border border-gray-300 dark:border-gray-600
  rounded-md shadow-sm
  bg-white dark:bg-gray-700
  text-gray-900 dark:text-gray-100
  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
`;

export function ProfileForm({ profile, onChange }: ProfileFormProps) {
  const handleChange = (field: keyof Profile, value: number | boolean | TaxBracketTarget) => {
    onChange({ ...profile, [field]: value });
  };

  return (
    <div className="space-y-6">
      {/* Personal Information */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Personal Information
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              Current Age
            </label>
            <NumberInput
              value={profile.currentAge}
              onChange={(v) => handleChange('currentAge', v)}
              min={18}
              max={100}
              className={inputClassName}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              Retirement Age
            </label>
            <NumberInput
              value={profile.retirementAge}
              onChange={(v) => handleChange('retirementAge', v)}
              min={profile.currentAge}
              max={100}
              className={inputClassName}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              Life Expectancy
            </label>
            <NumberInput
              value={profile.lifeExpectancy}
              onChange={(v) => handleChange('lifeExpectancy', v)}
              min={profile.retirementAge}
              max={120}
              className={inputClassName}
            />
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              Scottish Taxpayer
              <Tooltip content="Scotland has different income tax rates and bands than the rest of the UK" />
            </label>
            <div className="flex items-center h-10">
              <input
                type="checkbox"
                checked={profile.isScottish}
                onChange={(e) => handleChange('isScottish', e.target.checked)}
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                {profile.isScottish ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Private Pension */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Private Pension
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              Access Age
              <Tooltip content={`The earliest age you can access your private pension (SIPP/workplace pension). Currently ${MINIMUM_PENSION_ACCESS_AGE}, rising to 57 in 2028.`} />
            </label>
            <NumberInput
              value={profile.privatePensionAge}
              onChange={(v) => handleChange('privatePensionAge', v)}
              min={MINIMUM_PENSION_ACCESS_AGE}
              max={75}
              className={inputClassName}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Currently {MINIMUM_PENSION_ACCESS_AGE}, rising to 57 in 2028
            </p>
          </div>
        </div>
      </div>

      {/* State Pension */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          State Pension
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              Annual Amount
              <Tooltip content={`Full new State Pension is £${FULL_STATE_PENSION_ANNUAL.toLocaleString()}/year for 2024/25. Your amount depends on your National Insurance record.`} />
            </label>
            <NumberInput
              value={profile.statePensionAmount}
              onChange={(v) => handleChange('statePensionAmount', v)}
              min={0}
              max={50000}
              prefix="£"
              className={inputClassName}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Full amount: £{FULL_STATE_PENSION_ANNUAL.toLocaleString()}/year
            </p>
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              Start Age
              <Tooltip content={`Current State Pension age is ${STATE_PENSION_AGE}. Rising to 67 by 2028 and 68 thereafter.`} />
            </label>
            <NumberInput
              value={profile.statePensionAge}
              onChange={(v) => handleChange('statePensionAge', v)}
              min={profile.retirementAge}
              max={75}
              className={inputClassName}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Current age: {STATE_PENSION_AGE}
            </p>
          </div>
        </div>
      </div>

      {/* Withdrawal Strategy */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Withdrawal Strategy
        </h4>
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            Tax Bracket Target
            <Tooltip content="Controls how much pension to withdraw each year vs ISA/LISA. Lower brackets mean more tax-efficient withdrawals spread across years, but uses ISA sooner." />
          </label>
          <select
            value={profile.taxBracketTarget}
            onChange={(e) => handleChange('taxBracketTarget', e.target.value as TaxBracketTarget)}
            className={inputClassName}
          >
            {TAX_BRACKET_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {TAX_BRACKET_OPTIONS.find(o => o.value === profile.taxBracketTarget)?.description}
          </p>
        </div>
      </div>
    </div>
  );
}
