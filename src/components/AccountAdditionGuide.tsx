import React from 'react';

interface AccountAdditionGuideProps {
  onDismiss?: () => void;
}

export const AccountAdditionGuide: React.FC<AccountAdditionGuideProps> = ({ onDismiss }) => {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold text-blue-900">
          📁 Adding New Bank Accounts
        </h3>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-blue-600 hover:text-blue-800"
            aria-label="Dismiss guide"
          >
            ✕
          </button>
        )}
      </div>
      
      <div className="space-y-4 text-sm text-blue-800">
        <div>
          <h4 className="font-semibold mb-2">✅ Step-by-Step Process:</h4>
          <ol className="list-decimal list-inside space-y-1 ml-4">
            <li>Create a new folder in <code className="bg-blue-100 px-1 rounded">./bankdata/statements/</code></li>
            <li>Use a descriptive name (e.g., &ldquo;Chase Checking&rdquo;, &ldquo;Fidelity 401k&rdquo;)</li>
            <li>Add your CSV or PDF files to the new folder</li>
            <li>Run: <code className="bg-blue-100 px-1 rounded">node scripts/process-multi-account-data.js</code></li>
            <li>Refresh the dashboard to see your new account</li>
          </ol>
        </div>

        <div>
          <h4 className="font-semibold mb-2">⚠️ Important Guidelines:</h4>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Account names should be unique and descriptive</li>
            <li>Avoid special characters in folder names (use letters, numbers, spaces)</li>
            <li>Ensure CSV files have proper date, amount, and description columns</li>
            <li>Check console logs for validation warnings after processing</li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-2">🔧 Troubleshooting:</h4>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>If account doesn&rsquo;t appear, check the processing script output</li>
            <li>Verify CSV file format matches expected structure</li>
            <li>Look for validation errors in browser console (F12)</li>
            <li>Ensure no duplicate account names exist</li>
          </ul>
        </div>

        <div className="bg-blue-100 p-3 rounded mt-4">
          <p className="font-semibold">💡 Pro Tip:</p>
          <p>The system automatically validates new accounts and provides detailed error reports. Check the browser console in development mode for a health report of all accounts.</p>
        </div>
      </div>
    </div>
  );
};

export default AccountAdditionGuide;
