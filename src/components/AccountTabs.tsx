import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';

interface AccountTabsProps {
  accountList: string[];
  activeAccount: string;
  accountsData: Record<string, { loading?: boolean }>;
  onTabClick: (accountName: string) => void;
}

/**
 * Account tabs component for switching between different accounts
 */
export const AccountTabs: React.FC<AccountTabsProps> = ({
  accountList,
  activeAccount,
  accountsData,
  onTabClick,
}) => {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6" aria-label="Tabs">
          {accountList.map((accountName) => (
            <button
              key={accountName}
              onClick={() => onTabClick(accountName)}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                activeAccount === accountName
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <span>{accountName}</span>
                {accountsData[accountName]?.loading && (
                  <LoadingSpinner size="small" />
                )}
              </div>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
};
