// Financial calculation constants
export const FINANCIAL_CONSTANTS = {
  // Time calculations
  DAYS_PER_YEAR: 365.25,
  HOURS_PER_DAY: 24,
  MINUTES_PER_HOUR: 60,
  SECONDS_PER_MINUTE: 60,
  MS_PER_SECOND: 1000,
  
  // Get milliseconds per year
  get MS_PER_YEAR() {
    return this.DAYS_PER_YEAR * this.HOURS_PER_DAY * this.MINUTES_PER_HOUR * this.SECONDS_PER_MINUTE * this.MS_PER_SECOND;
  },
  
  // Default date ranges
  DEFAULT_START_DATE: '2021-12-31',
  DEFAULT_END_DATE: '2025-06-30',
  
  // Formatting
  CURRENCY_LOCALE: 'en-US',
  CURRENCY_CODE: 'USD',
  PERCENTAGE_DECIMAL_PLACES: 2,
  
  // Performance thresholds and safety limits
  MIN_YEARS_FOR_ANNUALIZED: 0.1, // Minimum time period for meaningful annualized return
  MIN_PRINCIPAL_FOR_CALCULATION: 1, // Minimum principal to avoid division by zero
  MAX_REASONABLE_RETURN: 10000, // 10,000% annual return (obviously impossible)
  MIN_REASONABLE_RETURN: -100, // -100% annual return (total loss)
  
  // Data validation limits
  MAX_ACCOUNT_VALUE: 1e12, // $1 trillion (reasonable upper bound)
  MIN_ACCOUNT_VALUE: 0, // Account values can't be negative
  MAX_TIME_PERIOD_YEARS: 100, // 100 years (reasonable upper bound)
} as const;

// Account type constants
export const ACCOUNT_TYPES = {
  CONTRIBUTORY_IRA: 'Contributory IRA',
  GENERAL_INVESTMENT: 'General Investment Account', 
  JOINT_LLC: 'Joint LLC',
} as const;

// UI Constants
export const UI_CONSTANTS = {
  // Grid layouts
  SINGLE_COLUMN: 'md:grid-cols-1',
  TWO_COLUMNS: 'md:grid-cols-2', 
  THREE_COLUMNS: 'lg:grid-cols-3',
  
  // Loading states
  SPINNER_SIZE: 'h-12 w-12',
  MINI_SPINNER_SIZE: 'h-4 w-4',
  
  // Colors
  COLORS: {
    SUCCESS: 'text-green-600',
    ERROR: 'text-red-600',
    NEUTRAL: 'text-gray-700',
    PRIMARY: 'text-blue-600',
    PURPLE: 'text-purple-600',
  }
} as const;
