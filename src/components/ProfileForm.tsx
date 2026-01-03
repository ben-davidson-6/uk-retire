import { useState } from 'react';
import { HouseholdProfile, PersonProfile, TaxBracketTarget, PlanningMode } from '../types';
import { NumberInput } from './NumberInput';
import { Tooltip } from './Tooltip';
import { FULL_STATE_PENSION_ANNUAL, STATE_PENSION_AGE, MINIMUM_PENSION_ACCESS_AGE, DEFAULT_PERSON2_PROFILE } from '../utils/constants';

const TAX_BRACKET_OPTIONS: { value: TaxBracketTarget; label: string; description: string }[] = [
  { value: 'personal_allowance', label: 'Personal Allowance (£12,570)', description: '0% tax on pension withdrawals' },
  { value: 'basic_rate', label: 'Basic Rate (£50,270)', description: 'Max 20% tax on pension withdrawals' },
  { value: 'higher_rate', label: 'Higher Rate (£125,140)', description: 'Max 40% tax on pension withdrawals' },
  { value: 'no_limit', label: 'No limit (draw pension last)', description: 'Original strategy - deplete ISA/GIA first' },
];

interface ProfileFormProps {
  household: HouseholdProfile;
  onChange: (household: HouseholdProfile) => void;
}

const inputClassName = `
  w-full px-3 py-2
  border border-gray-300 dark:border-gray-600
  rounded-md shadow-sm
  bg-white dark:bg-gray-700
  text-gray-900 dark:text-gray-100
  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
`;

type PersonTab = 'person1' | 'person2';

export function ProfileForm({ household, onChange }: ProfileFormProps) {
  const [activeTab, setActiveTab] = useState<PersonTab>('person1');

  const handleModeChange = (mode: PlanningMode) => {
    if (mode === 'couple' && !household.person2) {
      // Switching to couple mode - add person2 with defaults
      onChange({
        ...household,
        mode: 'couple',
        person2: { ...DEFAULT_PERSON2_PROFILE },
        // Double state pension for couple (full amount for each person)
        statePensionAmount: household.statePensionAmount * 2,
      });
    } else {
      onChange({ ...household, mode });
    }
  };

  const handlePersonChange = (person: PersonTab, field: keyof PersonProfile, value: number | boolean | TaxBracketTarget | string) => {
    if (person === 'person1') {
      onChange({
        ...household,
        person1: { ...household.person1, [field]: value },
      });
    } else if (household.person2) {
      onChange({
        ...household,
        person2: { ...household.person2, [field]: value },
      });
    }
  };

  const handleStatePensionChange = (value: number) => {
    onChange({ ...household, statePensionAmount: value });
  };

  const currentPerson = activeTab === 'person1' ? household.person1 : household.person2;

  return (
    <div className="space-y-6">
      {/* Planning Mode Toggle */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Planning Mode
        </h4>
        <div className="flex gap-2">
          <button
            onClick={() => handleModeChange('single')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              household.mode === 'single'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Single
          </button>
          <button
            onClick={() => handleModeChange('couple')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              household.mode === 'couple'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Couple
          </button>
        </div>
        {household.mode === 'couple' && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Tax benefit: 2x Personal Allowance (£25,140 tax-free), 2x CGT allowance (£6,000)
          </p>
        )}
      </div>

      {/* Person Tabs (only in couple mode) */}
      {household.mode === 'couple' && household.person2 && (
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex gap-4">
            <button
              onClick={() => setActiveTab('person1')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'person1'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              {household.person1.name}
            </button>
            <button
              onClick={() => setActiveTab('person2')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'person2'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              {household.person2.name}
            </button>
          </nav>
        </div>
      )}

      {currentPerson && (
        <>
          {/* Person Name (only in couple mode) */}
          {household.mode === 'couple' && (
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                Name
              </label>
              <input
                type="text"
                value={currentPerson.name}
                onChange={(e) => handlePersonChange(activeTab, 'name', e.target.value)}
                className={inputClassName}
                placeholder="Enter name..."
              />
            </div>
          )}

          {/* Personal Information */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              {household.mode === 'couple' ? `${currentPerson.name}'s Information` : 'Personal Information'}
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Current Age
                </label>
                <NumberInput
                  value={currentPerson.currentAge}
                  onChange={(v) => handlePersonChange(activeTab, 'currentAge', v)}
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
                  value={currentPerson.retirementAge}
                  onChange={(v) => handlePersonChange(activeTab, 'retirementAge', v)}
                  min={currentPerson.currentAge}
                  max={100}
                  className={inputClassName}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Life Expectancy
                </label>
                <NumberInput
                  value={currentPerson.lifeExpectancy}
                  onChange={(v) => handlePersonChange(activeTab, 'lifeExpectancy', v)}
                  min={currentPerson.retirementAge}
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
                    checked={currentPerson.isScottish}
                    onChange={(e) => handlePersonChange(activeTab, 'isScottish', e.target.checked)}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                    {currentPerson.isScottish ? 'Yes' : 'No'}
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
                  value={currentPerson.privatePensionAge}
                  onChange={(v) => handlePersonChange(activeTab, 'privatePensionAge', v)}
                  min={MINIMUM_PENSION_ACCESS_AGE}
                  max={75}
                  className={inputClassName}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Currently {MINIMUM_PENSION_ACCESS_AGE}, rising to 57 in 2028
                </p>
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  State Pension Age
                  <Tooltip content={`Current State Pension age is ${STATE_PENSION_AGE}. Rising to 67 by 2028 and 68 thereafter.`} />
                </label>
                <NumberInput
                  value={currentPerson.statePensionAge}
                  onChange={(v) => handlePersonChange(activeTab, 'statePensionAge', v)}
                  min={currentPerson.retirementAge}
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
                value={currentPerson.taxBracketTarget}
                onChange={(e) => handlePersonChange(activeTab, 'taxBracketTarget', e.target.value as TaxBracketTarget)}
                className={inputClassName}
              >
                {TAX_BRACKET_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {TAX_BRACKET_OPTIONS.find(o => o.value === currentPerson.taxBracketTarget)?.description}
              </p>
            </div>
          </div>
        </>
      )}

      {/* State Pension (Household) */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          State Pension {household.mode === 'couple' ? '(Combined Household)' : ''}
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              Annual Amount
              <Tooltip content={household.mode === 'couple'
                ? `Combined household State Pension. Full amount is £${FULL_STATE_PENSION_ANNUAL.toLocaleString()}/year per person.`
                : `Full new State Pension is £${FULL_STATE_PENSION_ANNUAL.toLocaleString()}/year for 2024/25. Your amount depends on your National Insurance record.`
              } />
            </label>
            <NumberInput
              value={household.statePensionAmount}
              onChange={handleStatePensionChange}
              min={0}
              max={100000}
              prefix="£"
              className={inputClassName}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {household.mode === 'couple'
                ? `Full amount for couple: £${(FULL_STATE_PENSION_ANNUAL * 2).toLocaleString()}/year`
                : `Full amount: £${FULL_STATE_PENSION_ANNUAL.toLocaleString()}/year`
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
