import {
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Line,
  ComposedChart,
} from 'recharts';
import { RetirementResult } from '../types';
import { formatGBP, CHART_COLORS } from '../utils/constants';

interface ChartTaxProps {
  data: RetirementResult;
}

export function ChartTax({ data }: ChartTaxProps) {
  const chartData = data.years.map((year) => ({
    age: year.age,
    incomeTax: year.incomeTax,
    cgt: year.capitalGainsTax,
    totalTax: year.totalTax,
    effectiveRate: year.totalTax / (year.totalWithdrawal + year.statePension || 1) * 100,
  }));

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis
            dataKey="age"
            tick={{ fill: 'currentColor', fontSize: 12 }}
            tickLine={{ stroke: 'currentColor' }}
          />
          <YAxis
            yAxisId="left"
            tickFormatter={(value) => `£${(value / 1000).toFixed(0)}k`}
            tick={{ fill: 'currentColor', fontSize: 12 }}
            tickLine={{ stroke: 'currentColor' }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tickFormatter={(value) => `${value.toFixed(0)}%`}
            tick={{ fill: 'currentColor', fontSize: 12 }}
            tickLine={{ stroke: 'currentColor' }}
          />
          <Tooltip
            formatter={(value: number, name: string) => {
              if (name === 'Effective Rate') return `${value.toFixed(1)}%`;
              return formatGBP(value);
            }}
            labelFormatter={(age) => `Age ${age}`}
            contentStyle={{
              backgroundColor: 'var(--tooltip-bg, #fff)',
              border: '1px solid var(--tooltip-border, #e5e7eb)',
              borderRadius: '0.5rem',
            }}
          />
          <Legend />
          <Bar
            yAxisId="left"
            dataKey="incomeTax"
            name="Income Tax"
            stackId="1"
            fill={CHART_COLORS.tax}
          />
          <Bar
            yAxisId="left"
            dataKey="cgt"
            name="CGT"
            stackId="1"
            fill="#F97316"
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="effectiveRate"
            name="Effective Rate"
            stroke={CHART_COLORS.total}
            strokeWidth={2}
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
