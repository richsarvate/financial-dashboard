import React from 'react';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  id?: string;
}

/**
 * Reusable toggle switch component
 */
export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  checked,
  onChange,
  label,
  id,
}) => {
  return (
    <label className="flex items-center cursor-pointer">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
      <div className={`relative w-11 h-6 rounded-full transition-colors ${
        checked ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-600'
      }`}>
        <div className={`absolute w-4 h-4 bg-white rounded-full top-1 transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}></div>
      </div>
      <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </span>
    </label>
  );
};
