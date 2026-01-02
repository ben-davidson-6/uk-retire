import { useState } from 'react';
import { AccumulationResult } from '../types';
import { formatGBP } from '../utils/constants';

interface DataTableAccumulationProps {
  data: AccumulationResult;
}

export function DataTableAccumulation({ data }: DataTableAccumulationProps) {
  const [expanded, setExpanded] = useState(false);
  const displayYears = expanded ? data.years : data.years.slice(-5);

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Age
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Pension
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              ISA
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              LISA
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              GIA
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Total
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Contributions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          {displayYears.map((year) => (
            <tr key={year.age} className="hover:bg-gray-50 dark:hover:bg-gray-800">
              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                {year.age}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-blue-600 dark:text-blue-400">
                {formatGBP(year.pensionBalance)}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-green-600 dark:text-green-400">
                {formatGBP(year.isaBalance)}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-purple-600 dark:text-purple-400">
                {formatGBP(year.lisaBalance)}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-amber-600 dark:text-amber-400">
                {formatGBP(year.taxableBalance)}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium text-gray-900 dark:text-white">
                {formatGBP(year.totalBalance)}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-600 dark:text-gray-400">
                {formatGBP(year.contributions)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {data.years.length > 5 && (
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
