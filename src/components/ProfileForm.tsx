import { Profile } from '../types';
import { NumberInput } from './NumberInput';
import { Tooltip } from './Tooltip';
import { FULL_STATE_PENSION_ANNUAL, STATE_PENSION_AGE } from '../utils/constants';

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
  const handleChange = (field: keyof Profile, value: number | boolean) => {
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
              min={Math.max(55, profile.currentAge)}
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
    </div>
  );
}
