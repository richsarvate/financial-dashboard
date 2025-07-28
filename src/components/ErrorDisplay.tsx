import React from 'react';

interface ErrorDisplayProps {
  title: string;
  message: string;
  onRetry?: () => void;
  details?: string;
}

/**
 * Reusable error display component
 */
export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  title,
  message,
  onRetry,
  details,
}) => {
  return (
    <div className="rounded-lg bg-red-50 p-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-red-400"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800">{title}</h3>
          <div className="mt-2 text-sm text-red-700">
            <p>{message}</p>
            {details && (
              <p className="mt-2 text-xs">{details}</p>
            )}
          </div>
          {onRetry && (
            <div className="mt-4">
              <button
                onClick={onRetry}
                className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700 transition-colors"
              >
                Retry
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface AccountListErrorProps {
  error: string;
  onRetry: () => void;
}

/**
 * Specific error component for account list loading
 */
export const AccountListError: React.FC<AccountListErrorProps> = ({ error, onRetry }) => (
  <ErrorDisplay
    title="Error loading accounts"
    message={error}
    onRetry={onRetry}
    details="Make sure you've run: node scripts/process-multi-account-data.js"
  />
);

interface AccountDataErrorProps {
  accountName: string;
  error: string;
  onRetry: () => void;
}

/**
 * Specific error component for individual account data loading
 */
export const AccountDataError: React.FC<AccountDataErrorProps> = ({ 
  accountName, 
  error, 
  onRetry 
}) => (
  <ErrorDisplay
    title={`Error loading ${accountName}`}
    message={error}
    onRetry={onRetry}
  />
);
