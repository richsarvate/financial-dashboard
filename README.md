# Financial Dashboard

A Next.js application for tracking investment performance using Schwab CSV data exports.

## Features

- **CSV Data Import**: Process Schwab positions and transaction CSV exports
- **Real-time Account Data**: View current balances, positions, and transaction history
- **Performance Analysis**: Calculate real returns after accounting for deposits, withdrawals, and fees
- **Benchmark Comparison**: Compare your portfolio performance against the S&P 500 index
- **Transaction History**: View complete transaction history with filtering and pagination
- **Interactive Charts**: Visualize performance over time with responsive charts
- **Clean Data Processing**: Pre-process CSV data for fast dashboard loading

## What This Dashboard Answers

### Core Questions:
1. **How much money did I really make?** - Shows real returns after factoring in your deposits and withdrawals
2. **How effective is my money manager?** - Compares your performance vs S&P 500 benchmark
3. **What are my total fees?** - Tracks all management fees and their impact on returns
4. **How volatile is my portfolio?** - Shows beta and risk-adjusted returns (Sharpe ratio)

### Key Metrics Displayed:
- **Real Return**: Your actual gains minus deposits/withdrawals and fees
- **Outperformance**: How much better (or worse) you performed vs S&P 500
- **Annualized Return**: Your average yearly return over the investment period
- **Portfolio Value**: Current market value of all holdings
- **Net Invested**: Total deposits minus withdrawals
- **Total Gains**: Absolute dollar gains on your investment

## Getting Started

### Prerequisites
- Node.js 18+ 
- Schwab CSV exports (Positions and Transactions)

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set environment variables:
   Create a `.env.local` file in the root directory:
   ```
   NEXTAUTH_SECRET=your-secret-key
   ALPHA_VANTAGE_API_KEY=your-alpha-vantage-api-key
   ```

3. Export CSV data from Schwab:
   - Log into your Schwab account
   - Navigate to "Positions" and export as CSV
   - Navigate to "History" and export transactions as CSV
   - Place these files in the `data/` directory

4. Preprocess the CSV data:
   ```bash
   npm run preprocess
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

## CSV Data Setup

### Required Files
Place these CSV exports from Schwab in the `data/` directory:
- `Positions.csv` - Current holdings and balances
- `Transactions.csv` - Complete transaction history

### Data Processing
The preprocessing script will:
- Parse and validate CSV data
- Calculate performance metrics
- Apply proper data types
- Generate clean JSON for the dashboard

### Running the Preprocessor
```bash
npm run preprocess
```

This will create processed JSON data in `public/data/` for the dashboard to consume.

## Usage

### Dashboard Views
1. **Account Summary**: Overview of current balances and key metrics
2. **Performance Chart**: Time series chart showing portfolio value vs S&P 500
3. **Benchmark Comparison**: Side-by-side performance comparison
4. **Transaction History**: Searchable, filterable transaction list

### Key Features
- **Real Return Calculation**: Automatically calculates your actual gains after deposits/withdrawals
- **S&P 500 Benchmark**: Shows how your portfolio compares to market performance  
- **Fee Impact Analysis**: Tracks management fees and their effect on returns
- **Risk Metrics**: Beta, Sharpe ratio, and maximum drawdown calculations

## Technology Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Charts**: Recharts for responsive data visualization
- **Data Processing**: Node.js CSV parsing and transformation
- **Styling**: Tailwind CSS with dark mode support
- **APIs**: Alpha Vantage for S&P 500 benchmark data

## Development

### Project Structure
```
src/
├── app/              # Next.js app router pages
├── components/       # React components
├── services/         # Data services and API calls
├── types/           # TypeScript type definitions
└── lib/             # Utility functions
data/                # Raw CSV exports (user-provided)
public/data/         # Processed JSON data
scripts/             # Data preprocessing scripts
```

### Adding New Features
1. **Data Processing**: Update `scripts/preprocessSchwabData.js` for new calculations
2. **Components**: Create new components in `src/components/`
3. **Services**: Add data fetching logic to `src/services/`
4. **Types**: Define interfaces in `src/types/`

### CSV Data Format
The preprocessor expects Schwab CSV exports with specific columns:
- **Positions.csv**: Symbol, Description, Quantity, Price, Value, etc.
- **Transactions.csv**: Date, Description, Symbol, Quantity, Price, Amount, etc.

## Troubleshooting

### Common Issues
1. **CSV Format Error**: Ensure your CSV files match Schwab's export format
2. **Missing Data**: Check that all required CSV files are in the `data/` directory
3. **Preprocessing Fails**: Verify CSV headers match expected format
4. **Dashboard Not Loading**: Run `npm run preprocess` to regenerate data

### Debug Mode
Set `DEBUG=true` in `.env.local` for detailed processing logs.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with your own CSV data
5. Submit a pull request

## Security

- All financial data processing happens locally
- No sensitive data is sent to external services (except S&P 500 API)
- CSV files remain on your local machine
- Processed data is stored locally in `public/data/`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with your own CSV data
5. Submit a pull request

## License

This project is licensed under the MIT License.
