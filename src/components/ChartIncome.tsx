import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from 'recharts';
import { RetirementResult, Profile } from '../types';
import { formatGBP, CHART_COLORS } from '../utils/constants';

interface ChartIncomeProps {
  data: RetirementResult;
  profile: Profile;
}

export function ChartIncome({ data, profile }: ChartIncomeProps) {
  const chartData = data.years.map((year) => ({
    age: year.age,
    statePension: year.statePension,
    pension: year.pensionWithdrawal,
    isa: year.isaWithdrawal,
    lisa: year.lisaWithdrawal,
    taxable: year.taxableWithdrawal,
    total: year.totalWithdrawal + year.statePension,
  }));

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis
            dataKey="age"
            tick={{ fill: 'currentColor', fontSize: 12 }}
            tickLine={{ stroke: 'currentColor' }}
          />
          <YAxis
            tickFormatter={(value) => `£${(value / 1000).toFixed(0)}k`}
            tick={{ fill: 'currentColor', fontSize: 12 }}
            tickLine={{ stroke: 'currentColor' }}
          />
          <Tooltip
            formatter={(value: number) => formatGBP(value)}
            labelFormatter={(age) => `Age ${age}`}
            contentStyle={{
              backgroundColor: 'var(--tooltip-bg, #fff)',
              border: '1px solid var(--tooltip-border, #e5e7eb)',
              borderRadius: '0.5rem',
            }}
          />
          <Legend />
          {profile.statePensionAge > profile.retirementAge && (
            <ReferenceLine
              x={profile.statePensionAge}
              stroke="#EC4899"
              strokeDasharray="5 5"
            />
          )}
          <Bar
            dataKey="statePension"
            name="State Pension"
            stackId="1"
            fill={CHART_COLORS.statePension}
          />
          <Bar
            dataKey="pension"
            name="Private Pension"
            stackId="1"
            fill={CHART_COLORS.pension}
          />
          <Bar
            dataKey="isa"
            name="ISA"
            stackId="1"
            fill={CHART_COLORS.isa}
          />
          <Bar
            dataKey="lisa"
            name="LISA"
            stackId="1"
            fill={CHART_COLORS.lisa}
          />
          <Bar
            dataKey="taxable"
            name="GIA"
            stackId="1"
            fill={CHART_COLORS.taxable}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
