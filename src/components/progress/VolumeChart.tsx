'use client';

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { displayWeight } from '@/lib/utils/formatWeight';

interface VolumeChartProps {
  data: { week: string; volume: number }[];
  weightUnit: 'kg' | 'lbs';
}

export function VolumeChart({ data, weightUnit }: VolumeChartProps) {
  const chartData = data.map((d) => ({
    week: d.week,
    volume:
      weightUnit === 'lbs'
        ? Math.round(displayWeight(d.volume, 'lbs'))
        : d.volume,
  }));

  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        No volume data yet. Complete some workouts to see your progress.
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis
            dataKey="week"
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
            tickFormatter={(v: number) =>
              v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
            }
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
              `${Number(value).toLocaleString()} ${weightUnit}`,
              'Volume',
            ]}
            labelFormatter={(label) => `Week of ${label}`}
          />
          <Bar
            dataKey="volume"
            fill="hsl(var(--primary))"
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
