# UK Retirement Planner

A comprehensive retirement planning calculator designed for the UK tax system. Project your portfolio growth, simulate tax-optimised withdrawals, and visualise your financial future through retirement.

## Features

### UK-Specific Tax Handling
- **Income Tax**: Full support for both Rest of UK and Scottish tax rates
- **Personal Allowance**: Including taper for incomes over £100,000
- **Capital Gains Tax**: With annual exempt amount and rate differentiation
- **State Pension**: Inflation-adjusted projections from State Pension age

### UK Account Types
- **Workplace Pension**: With employer contribution matching
- **SIPP**: Self-Invested Personal Pension
- **ISA**: Stocks & Shares ISA (tax-free growth and withdrawals)
- **Lifetime ISA**: With 25% government bonus
- **GIA**: General Investment Account

### Tax-Optimised Withdrawal Strategy
1. Tax-free pension lump sum (25%)
2. ISA withdrawals (completely tax-free)
3. LISA withdrawals (tax-free after 60)
4. GIA withdrawals (CGT efficient)
5. Pension withdrawals (income tax applies)

### Visualisations
- Portfolio accumulation over time
- Retirement drawdown projections
- Income source breakdown
- Tax burden analysis
- Detailed year-by-year tables

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Tech Stack

- React 19 with TypeScript
- Vite for development and building
- Tailwind CSS for styling
- Recharts for data visualisation
- LocalStorage for data persistence

## Tax Year

All calculations use 2024/25 UK tax rates and allowances.

## Disclaimer

This calculator is for educational purposes only. It does not constitute financial advice. Please consult a qualified financial adviser for personal retirement planning.

## Acknowledgements

Inspired by [mjcrepeau/retirement-planner](https://github.com/mjcrepeau/retirement-planner), adapted for the UK tax system.
