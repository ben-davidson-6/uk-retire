import {
  AreaChart,
  Area,
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

interface ChartDrawdownProps {
  data: RetirementResult;
  profile: Profile;
}

export function ChartDrawdown({ data, profile }: ChartDrawdownProps) {
  const chartData = data.years.map((year) => ({
    age: year.age,
    pension: year.pensionBalance,
    isa: year.isaBalance,
    lisa: year.lisaBalance,
    taxable: year.taxableBalance,
    total: year.endingBalance,
  }));

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
              label={{ value: 'State Pension', fill: '#EC4899', fontSize: 10 }}
            />
          )}
          <Area
            type="monotone"
            dataKey="pension"
            name="Pension"
            stackId="1"
            stroke={CHART_COLORS.pension}
            fill={CHART_COLORS.pension}
            fillOpacity={0.6}
          />
          <Area
            type="monotone"
            dataKey="isa"
            name="ISA"
            stackId="1"
            stroke={CHART_COLORS.isa}
            fill={CHART_COLORS.isa}
            fillOpacity={0.6}
          />
          <Area
            type="monotone"
            dataKey="lisa"
            name="LISA"
            stackId="1"
            stroke={CHART_COLORS.lisa}
            fill={CHART_COLORS.lisa}
            fillOpacity={0.6}
          />
          <Area
            type="monotone"
            dataKey="taxable"
            name="GIA"
            stackId="1"
            stroke={CHART_COLORS.taxable}
            fill={CHART_COLORS.taxable}
            fillOpacity={0.6}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
