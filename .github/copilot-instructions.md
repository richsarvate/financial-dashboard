<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Financial Dashboard - Copilot Instructions

This is a Next.js TypeScript application for investment portfolio analysis that integrates with Plaid for secure financial data access.

## Project Context
- **Purpose**: Track investment performance, calculate real returns, and compare against S&P 500 benchmark
- **Key Features**: Account summaries, performance charts, benchmark comparisons, transaction history
- **API Integration**: Plaid API for secure, reliable access to Schwab and other financial institutions
- **Demo Mode**: Includes mock data service when API credentials are not available

## Code Style & Patterns
- Use TypeScript for all new code with proper type definitions
- Follow Next.js App Router patterns (app/ directory structure)
- Use Tailwind CSS for styling with dark mode support
- Implement responsive design for mobile and desktop
- Use 'use client' directive for interactive components
- Format currency using Intl.NumberFormat with USD
- Format percentages with + prefix for positive values

## Financial Calculations
- **Real Return**: Account value minus (deposits - withdrawals) minus initial investment
- **Outperformance**: Real return percentage minus S&P 500 return percentage
- **Annualized Return**: Compound annual growth rate over investment period
- **Beta**: Portfolio volatility relative to S&P 500 (1.0 = same volatility)
- **Sharpe Ratio**: Risk-adjusted return (return per unit of risk)
- **Max Drawdown**: Largest peak-to-trough decline in portfolio value

## Component Structure
- `Dashboard`: Main container component with data loading and Plaid integration
- `PlaidLink`: Secure account connection component using react-plaid-link
- `AccountSummary`: Key metrics display with color-coded performance
- `PerformanceChart`: Time series chart using Recharts
- `BenchmarkComparison`: S&P 500 comparison with bar charts
- `TransactionHistory`: Paginated transaction list with filtering

## Data Flow
1. PlaidLink component handles secure account connection
2. PlaidService loads account data, transactions, and calculates performance
3. Dashboard component manages state and passes data to child components
4. Components format and display financial data with appropriate styling
5. Charts use Recharts library for responsive data visualization

## API Integration
- Use PlaidService class for all financial data interactions
- Implement Plaid Link for secure account connection
- Use Next.js API routes for server-side Plaid operations
- Include comprehensive error handling for API failures
- Provide mock data fallback for development/demo purposes

## Plaid Integration
- Use react-plaid-link for frontend account connection
- Implement Link token creation and public token exchange
- Focus on investment accounts (brokerage, IRA, Roth IRA)
- Handle both investment transactions and regular transactions (deposits/withdrawals)
- Maintain secure token management

## Styling Guidelines
- Use portfolio-card class for consistent card styling
- Apply metric-positive (green) and metric-negative (red) classes for performance indicators
- Implement dark mode support throughout the application
- Use responsive grid layouts for different screen sizes

## Security Considerations
- Store Plaid API credentials in environment variables
- Never commit sensitive credentials to version control
- Use server-side API routes for sensitive Plaid operations
- Process all financial data client-side
- Implement proper access token management
