import { useState } from 'react';
import { RetirementResult } from '../types';
import { formatGBP } from '../utils/constants';

interface DataTableWithdrawalProps {
  data: RetirementResult;
}

export function DataTableWithdrawal({ data }: DataTableWithdrawalProps) {
  const [expanded, setExpanded] = useState(false);
  const displayYears = expanded ? data.years : data.years.slice(0, 10);

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Age
            </th>
            <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              State Pension
            </th>
            <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Withdrawals
            </th>
            <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Gross Income
            </th>
            <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Tax
            </th>
            <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Net Income
            </th>
            <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Balance
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          {displayYears.map((year) => (
            <tr
              key={year.age}
              className={`hover:bg-gray-50 dark:hover:bg-gray-800 ${
                year.portfolioDepleted ? 'bg-red-50 dark:bg-red-900/20' : ''
              }`}
            >
              <td className="px-3 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                {year.age}
              </td>
              <td className="px-3 py-3 whitespace-nowrap text-sm text-right text-pink-600 dark:text-pink-400">
                {formatGBP(year.statePension)}
              </td>
              <td className="px-3 py-3 whitespace-nowrap text-sm text-right text-gray-600 dark:text-gray-400">
                {formatGBP(year.totalWithdrawal)}
              </td>
              <td className="px-3 py-3 whitespace-nowrap text-sm text-right text-gray-900 dark:text-white">
                {formatGBP(year.statePension + year.totalWithdrawal)}
              </td>
              <td className="px-3 py-3 whitespace-nowrap text-sm text-right text-red-600 dark:text-red-400">
                {formatGBP(year.totalTax)}
              </td>
              <td className="px-3 py-3 whitespace-nowrap text-sm text-right font-medium text-green-600 dark:text-green-400">
                {formatGBP(year.netIncome)}
              </td>
              <td className="px-3 py-3 whitespace-nowrap text-sm text-right text-gray-600 dark:text-gray-400">
                {formatGBP(year.endingBalance)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {data.years.length > 10 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          {expanded ? 'Show less' : `Show all ${data.years.length} years`}
        </button>
      )}
    </div>
  );
}
