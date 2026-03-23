'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { startOfWeek, endOfWeek, subWeeks, format } from 'date-fns';
import { ArrowUp, ArrowDown, Minus, TrendingUp } from 'lucide-react';
import { db } from '@/lib/db/database';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatWeight } from '@/lib/utils/formatWeight';
import { toDateString } from '@/lib/utils/dateUtils';

interface WeeklySummaryProps {
  weightUnit: 'kg' | 'lbs';
}

function ComparisonArrow({ current, previous }: { current: number; previous: number }) {
  if (current > previous) {
    return <ArrowUp className="size-3.5 text-green-500" />;
  }
  if (current < previous) {
    return <ArrowDown className="size-3.5 text-red-500" />;
  }
  return <Minus className="size-3.5 text-muted-foreground" />;
}

export default function WeeklySummary({ weightUnit }: WeeklySummaryProps) {
  const now = new Date();
  const thisWeekStart = toDateString(startOfWeek(now, { weekStartsOn: 1 }));
  const thisWeekEnd = toDateString(endOfWeek(now, { weekStartsOn: 1 }));

  const lastWeekDate = subWeeks(now, 1);
  const lastWeekStart = toDateString(startOfWeek(lastWeekDate, { weekStartsOn: 1 }));
  const lastWeekEnd = toDateString(endOfWeek(lastWeekDate, { weekStartsOn: 1 }));

  const thisWeekSummaries = useLiveQuery(
    () =>
      db.workoutSummaries
        .where('date')
        .between(thisWeekStart, thisWeekEnd, true, true)
        .toArray(),
    [thisWeekStart, thisWeekEnd]
  );

  const lastWeekSummaries = useLiveQuery(
    () =>
      db.workoutSummaries
        .where('date')
        .between(lastWeekStart, lastWeekEnd, true, true)
        .toArray(),
    [lastWeekStart, lastWeekEnd]
  );

  if (!thisWeekSummaries || !lastWeekSummaries) return null;

  const thisWeekDays = new Set(thisWeekSummaries.map((s) => s.date)).size;
  const thisWeekVolume = thisWeekSummaries.reduce((acc, s) => acc + s.totalVolume, 0);
  const thisWeekSets = thisWeekSummaries.reduce((acc, s) => acc + s.totalSets, 0);

  const lastWeekDays = new Set(lastWeekSummaries.map((s) => s.date)).size;
  const lastWeekVolume = lastWeekSummaries.reduce((acc, s) => acc + s.totalVolume, 0);
  const lastWeekSets = lastWeekSummaries.reduce((acc, s) => acc + s.totalSets, 0);

  const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const trainedDaysSet = new Set(thisWeekSummaries.map((s) => {
    const d = new Date(s.date);
    // getDay: 0=Sun, adjust for Monday start
    return (d.getDay() + 6) % 7;
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="size-5" />
          This Week
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="flex items-center justify-center gap-1">
              <p className="text-lg font-semibold">{thisWeekDays}/7</p>
              <ComparisonArrow current={thisWeekDays} previous={lastWeekDays} />
            </div>
            <p className="text-xs text-muted-foreground">Days</p>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1">
              <p className="text-lg font-semibold">
                {formatWeight(thisWeekVolume, weightUnit)}
              </p>
              <ComparisonArrow current={thisWeekVolume} previous={lastWeekVolume} />
            </div>
            <p className="text-xs text-muted-foreground">Volume</p>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1">
              <p className="text-lg font-semibold">{thisWeekSets}</p>
              <ComparisonArrow current={thisWeekSets} previous={lastWeekSets} />
            </div>
            <p className="text-xs text-muted-foreground">Sets</p>
          </div>
        </div>

        {/* Days trained bar */}
        <div className="flex items-center justify-between gap-1">
          {dayLabels.map((label, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  'h-2 w-8 rounded-full',
                  trainedDaysSet.has(i)
                    ? 'bg-primary'
                    : 'bg-muted'
                )}
              />
              <span className="text-[10px] text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
