import React from 'react';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  message?: string;
  className?: string;
}

/**
 * Reusable loading spinner component
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  message,
  className = '',
}) => {
  const sizeClasses = {
    small: 'h-4 w-4',
    medium: 'h-8 w-8',
    large: 'h-12 w-12',
  };

  const containerClasses = size === 'large' 
    ? 'flex items-center justify-center h-64'
    : 'flex items-center justify-center';

  return (
    <div className={`${containerClasses} ${className}`}>
      <div className={`animate-spin rounded-full ${sizeClasses[size]} border-b-2 border-blue-500`}></div>
      {message && (
        <span className="ml-3 text-gray-600">{message}</span>
      )}
    </div>
  );
};

interface LoadingStateProps {
  accountName?: string;
}

/**
 * Specific loading component for account data
 */
export const AccountLoadingState: React.FC<LoadingStateProps> = ({ accountName }) => (
  <LoadingSpinner 
    size="large"
    message={accountName ? `Loading ${accountName} data...` : 'Loading your investment accounts...'}
  />
);
