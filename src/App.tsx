import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Account, Profile, Assumptions } from './types';
import { DEFAULT_PROFILE, DEFAULT_ASSUMPTIONS } from './utils/constants';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useRetirementCalculator } from './hooks/useRetirementCalculator';
import { Layout } from './components/Layout';
import { ProfileForm } from './components/ProfileForm';
import { AccountForm } from './components/AccountForm';
import { AccountList } from './components/AccountList';
import { AssumptionsForm } from './components/AssumptionsForm';
import { SummaryCards } from './components/SummaryCards';
import { ChartAccumulation } from './components/ChartAccumulation';
import { ChartDrawdown } from './components/ChartDrawdown';
import { ChartIncome } from './components/ChartIncome';
import { ChartTax } from './components/ChartTax';
import { DataTableAccumulation } from './components/DataTableAccumulation';
import { DataTableWithdrawal } from './components/DataTableWithdrawal';
import { MethodologyPanel } from './components/MethodologyPanel';

function createDefaultAccounts(): Account[] {
  return [
    {
      id: uuidv4(),
      name: 'Workplace Pension',
      type: 'workplace_pension',
      balance: 50000,
      annualContribution: 4000,
      contributionGrowthRate: 0.02,
      expectedReturn: 0.07,
      employerContribution: 5,
      salaryForMatch: 50000,
    },
    {
      id: uuidv4(),
      name: 'Stocks & Shares ISA',
      type: 'isa',
      balance: 30000,
      annualContribution: 10000,
      contributionGrowthRate: 0.02,
      expectedReturn: 0.07,
    },
  ];
}

type TabId = 'summary' | 'accumulation' | 'retirement' | 'methodology';

export default function App() {
  // State
  const [darkMode, setDarkMode] = useLocalStorage('uk-retirement-dark-mode', false);
  const [accounts, setAccounts] = useLocalStorage<Account[]>(
    'uk-retirement-accounts',
    createDefaultAccounts()
  );
  const [storedProfile, setProfile] = useLocalStorage<Partial<Profile>>(
    'uk-retirement-profile',
    DEFAULT_PROFILE
  );
  // Merge with defaults to handle missing fields from older stored profiles
  const profile: Profile = { ...DEFAULT_PROFILE, ...storedProfile };
  const [assumptions, setAssumptions] = useLocalStorage<Assumptions>(
    'uk-retirement-assumptions',
    DEFAULT_ASSUMPTIONS
  );

  // UI State
  const [activeTab, setActiveTab] = useState<TabId>('summary');
  const [expandedSections, setExpandedSections] = useState({
    accounts: true,
    profile: true,
    assumptions: false,
  });
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);

  // Calculations
  const results = useRetirementCalculator(accounts, profile, assumptions);

  // Handlers
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleAddAccount = (account: Account) => {
    setAccounts([...accounts, account]);
    setShowAccountForm(false);
  };

  const handleUpdateAccount = (account: Account) => {
    setAccounts(accounts.map((a) => (a.id === account.id ? account : a)));
    setEditingAccount(null);
  };

  const handleDeleteAccount = (id: string) => {
    setAccounts(accounts.filter((a) => a.id !== id));
  };

  const handleReset = () => {
    setAccounts(createDefaultAccounts());
    setProfile(DEFAULT_PROFILE);
    setAssumptions(DEFAULT_ASSUMPTIONS);
    setShowResetModal(false);
  };

  const tabs: { id: TabId; label: string }[] = [
    { id: 'summary', label: 'Summary' },
    { id: 'accumulation', label: 'Accumulation' },
    { id: 'retirement', label: 'Retirement' },
    { id: 'methodology', label: 'Methodology' },
  ];

  return (
    <Layout darkMode={darkMode} onToggleDarkMode={() => setDarkMode(!darkMode)}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Inputs */}
        <div className="lg:col-span-1 space-y-4">
          {/* Accounts Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => toggleSection('accounts')}
              className="w-full px-4 py-3 flex justify-between items-center text-left"
            >
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Investment Accounts
              </h2>
              <svg
                className={`w-5 h-5 text-gray-500 transition-transform ${
                  expandedSections.accounts ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            {expandedSections.accounts && (
              <div className="px-4 pb-4">
                {showAccountForm || editingAccount ? (
                  <AccountForm
                    account={editingAccount || undefined}
                    onSave={editingAccount ? handleUpdateAccount : handleAddAccount}
                    onCancel={() => {
                      setShowAccountForm(false);
                      setEditingAccount(null);
                    }}
                  />
                ) : (
                  <>
                    <AccountList
                      accounts={accounts}
                      onEdit={setEditingAccount}
                      onDelete={handleDeleteAccount}
                    />
                    <button
                      onClick={() => setShowAccountForm(true)}
                      className="mt-4 w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Add Account
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Profile Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => toggleSection('profile')}
              className="w-full px-4 py-3 flex justify-between items-center text-left"
            >
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Personal Profile
              </h2>
              <svg
                className={`w-5 h-5 text-gray-500 transition-transform ${
                  expandedSections.profile ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            {expandedSections.profile && (
              <div className="px-4 pb-4">
                <ProfileForm profile={profile} onChange={setProfile} />
              </div>
            )}
          </div>

          {/* Assumptions Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => toggleSection('assumptions')}
              className="w-full px-4 py-3 flex justify-between items-center text-left"
            >
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Economic Assumptions
              </h2>
              <svg
                className={`w-5 h-5 text-gray-500 transition-transform ${
                  expandedSections.assumptions ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            {expandedSections.assumptions && (
              <div className="px-4 pb-4">
                <AssumptionsForm assumptions={assumptions} onChange={setAssumptions} />
              </div>
            )}
          </div>

          {/* Reset Button */}
          <button
            onClick={() => setShowResetModal(true)}
            className="w-full py-2 px-4 text-red-600 dark:text-red-400 border border-red-300 dark:border-red-700 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            Reset All Data
          </button>
        </div>

        {/* Right Panel - Results */}
        <div className="lg:col-span-2">
          {!results ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">
                Add at least one investment account to see your retirement projections.
              </p>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              {/* Tabs */}
              <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="flex -mb-px">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                          : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === 'summary' && (
                  <div className="space-y-6">
                    <SummaryCards
                      accumulation={results.accumulation}
                      retirement={results.retirement}
                      profile={profile}
                    />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Portfolio Growth
                      </h3>
                      <ChartAccumulation data={results.accumulation} />
                    </div>
                  </div>
                )}

                {activeTab === 'accumulation' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Portfolio Growth Over Time
                      </h3>
                      <ChartAccumulation data={results.accumulation} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Year by Year Breakdown
                      </h3>
                      <DataTableAccumulation data={results.accumulation} />
                    </div>
                  </div>
                )}

                {activeTab === 'retirement' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Portfolio Drawdown
                      </h3>
                      <ChartDrawdown data={results.retirement} profile={profile} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Income Sources
                      </h3>
                      <ChartIncome data={results.retirement} profile={profile} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Tax Burden
                      </h3>
                      <ChartTax data={results.retirement} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Withdrawal Details
                      </h3>
                      <DataTableWithdrawal data={results.retirement} />
                    </div>
                  </div>
                )}

                {activeTab === 'methodology' && (
                  <MethodologyPanel profile={profile} assumptions={assumptions} />
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Reset All Data?
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              This will reset all accounts, profile settings, and assumptions to their default
              values. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleReset}
                className="flex-1 py-2 px-4 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Reset
              </button>
              <button
                onClick={() => setShowResetModal(false)}
                className="flex-1 py-2 px-4 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
