import { Account, getAccountTypeLabel } from '../types';
import { formatGBP } from '../utils/constants';

interface AccountListProps {
  accounts: Account[];
  onEdit: (account: Account) => void;
  onDelete: (id: string) => void;
}

export function AccountList({ accounts, onEdit, onDelete }: AccountListProps) {
  if (accounts.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <p>No accounts added yet.</p>
        <p className="text-sm mt-1">Click "Add Account" to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {accounts.map((account) => (
        <div
          key={account.id}
          className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 dark:text-white">
                {account.name}
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {getAccountTypeLabel(account.type)}
              </p>
              <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Balance: </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatGBP(account.balance)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Annual: </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatGBP(account.annualContribution)}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onEdit(account)}
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
              >
                Edit
              </button>
              <button
                onClick={() => onDelete(account.id)}
                className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
