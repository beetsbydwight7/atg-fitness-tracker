'use client';

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { displayWeight } from '@/lib/utils/formatWeight';

interface StrengthChartProps {
  data: { date: string; value: number }[];
  exerciseName: string;
  weightUnit: 'kg' | 'lbs';
}

export function StrengthChart({ data, exerciseName, weightUnit }: StrengthChartProps) {
  const chartData = data.map((d) => ({
    date: d.date,
    value:
      weightUnit === 'lbs'
        ? Math.round(displayWeight(d.value, 'lbs') * 10) / 10
        : d.value,
  }));

  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        No data for this exercise yet. Log some sets to track your estimated 1RM.
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11 }}
            className="fill-muted-foreground"
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 11 }}
            className="fill-muted-foreground"
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => `${v}`}
            domain={['dataMin - 5', 'dataMax + 5']}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--popover))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '0.5rem',
              color: 'hsl(var(--popover-foreground))',
              fontSize: '0.875rem',
            }}
            formatter={(value) => [
              `${value} ${weightUnit}`,
              'Est. 1RM',
            ]}
            labelFormatter={(label) => `${label}`}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={{ r: 4, fill: 'hsl(var(--primary))' }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
