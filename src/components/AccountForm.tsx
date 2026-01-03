import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Account, AccountType, getAccountTypeLabel, PersonId, PlanningMode } from '../types';
import { NumberInput } from './NumberInput';
import { Tooltip } from './Tooltip';

interface AccountFormProps {
  account?: Account;
  onSave: (account: Account) => void;
  onCancel: () => void;
  planningMode: PlanningMode;
  person1Name: string;
  person2Name?: string;
}

const accountTypes: AccountType[] = [
  'workplace_pension',
  'sipp',
  'isa',
  'lisa',
  'gia',
];

const inputClassName = `
  w-full px-3 py-2
  border border-gray-300 dark:border-gray-600
  rounded-md shadow-sm
  bg-white dark:bg-gray-700
  text-gray-900 dark:text-gray-100
  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
`;

export function AccountForm({ account, onSave, onCancel, planningMode, person1Name, person2Name }: AccountFormProps) {
  const [formData, setFormData] = useState<Account>({
    id: account?.id || uuidv4(),
    name: account?.name || '',
    type: account?.type || 'workplace_pension',
    balance: account?.balance || 0,
    annualContribution: account?.annualContribution || 0,
    contributionGrowthRate: account?.contributionGrowthRate || 0.02,
    expectedReturn: account?.expectedReturn || 0.07,
    employerContribution: account?.employerContribution || 3,
    salaryForMatch: account?.salaryForMatch || 50000,
    owner: account?.owner || (planningMode === 'couple' ? 'person1' : undefined),
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (account) {
      setFormData(account);
    }
  }, [account]);

  const handleChange = (field: keyof Account, value: string | number) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Account name is required';
    }

    if (formData.balance < 0) {
      newErrors.balance = 'Balance cannot be negative';
    }

    if (formData.annualContribution < 0) {
      newErrors.annualContribution = 'Contribution cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSave(formData);
    }
  };

  const isWorkplacePension = formData.type === 'workplace_pension';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Account Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Account Name
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="e.g., Company Pension"
          className={`${inputClassName} ${errors.name ? 'border-red-500' : ''}`}
        />
        {errors.name && (
          <p className="text-red-500 text-xs mt-1">{errors.name}</p>
        )}
      </div>

      {/* Account Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Account Type
        </label>
        <select
          value={formData.type}
          onChange={(e) => handleChange('type', e.target.value as AccountType)}
          className={inputClassName}
        >
          {accountTypes.map((type) => (
            <option key={type} value={type}>
              {getAccountTypeLabel(type)}
            </option>
          ))}
        </select>
      </div>

      {/* Account Owner (only in couple mode) */}
      {planningMode === 'couple' && person2Name && (
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Account Owner
            <Tooltip content="Who owns this account? Each person has separate tax allowances." />
          </label>
          <select
            value={formData.owner || 'person1'}
            onChange={(e) => handleChange('owner', e.target.value as PersonId)}
            className={inputClassName}
          >
            <option value="person1">{person1Name}</option>
            <option value="person2">{person2Name}</option>
          </select>
        </div>
      )}

      {/* Balance and Contribution */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Current Balance
          </label>
          <NumberInput
            value={formData.balance}
            onChange={(v) => handleChange('balance', v)}
            min={0}
            prefix="£"
            className={inputClassName}
          />
          {errors.balance && (
            <p className="text-red-500 text-xs mt-1">{errors.balance}</p>
          )}
        </div>
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Annual Contribution
            <Tooltip content="Your personal annual contribution to this account" />
          </label>
          <NumberInput
            value={formData.annualContribution}
            onChange={(v) => handleChange('annualContribution', v)}
            min={0}
            prefix="£"
            className={inputClassName}
          />
        </div>
      </div>

      {/* Growth Rates */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Contribution Growth
            <Tooltip content="Expected annual increase in your contributions (e.g., matching salary growth)" />
          </label>
          <NumberInput
            value={formData.contributionGrowthRate * 100}
            onChange={(v) => handleChange('contributionGrowthRate', v / 100)}
            min={0}
            max={20}
            step={0.5}
            suffix="%"
            className={inputClassName}
          />
        </div>
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Expected Return
            <Tooltip content="Expected annual investment return. Historically, diversified portfolios average 5-7% after inflation." />
          </label>
          <NumberInput
            value={formData.expectedReturn * 100}
            onChange={(v) => handleChange('expectedReturn', v / 100)}
            min={0}
            max={20}
            step={0.1}
            suffix="%"
            className={inputClassName}
          />
        </div>
      </div>

      {/* Workplace Pension Specific Fields */}
      {isWorkplacePension && (
        <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Employer Contribution
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Employer Rate
                <Tooltip content="Percentage of your salary your employer contributes. Auto-enrolment minimum is 3%." />
              </label>
              <NumberInput
                value={formData.employerContribution || 0}
                onChange={(v) => handleChange('employerContribution', v)}
                min={0}
                max={100}
                step={0.5}
                suffix="%"
                className={inputClassName}
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Salary
                <Tooltip content="Your salary used to calculate employer contribution" />
              </label>
              <NumberInput
                value={formData.salaryForMatch || 0}
                onChange={(v) => handleChange('salaryForMatch', v)}
                min={0}
                prefix="£"
                className={inputClassName}
              />
            </div>
          </div>
        </div>
      )}

      {/* Form Actions */}
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
        >
          {account ? 'Update Account' : 'Add Account'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 py-2 px-4 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
