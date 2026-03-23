'use client';

import { useMemo } from 'react';
import { startOfWeek, subWeeks, addDays, format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { WorkoutSummary } from '@/lib/types';

interface FrequencyHeatmapProps {
  summaries: WorkoutSummary[];
}

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export function FrequencyHeatmap({ summaries }: FrequencyHeatmapProps) {
  const grid = useMemo(() => {
    const workoutDates = new Set(summaries.map((s) => s.date));
    const now = new Date();
    const weeks: { label: string; days: { date: string; hasWorkout: boolean }[] }[] = [];

    for (let w = 11; w >= 0; w--) {
      const weekStart = startOfWeek(subWeeks(now, w), { weekStartsOn: 1 });
      const label = format(weekStart, 'MMM d');
      const days: { date: string; hasWorkout: boolean }[] = [];

      for (let d = 0; d < 7; d++) {
        const day = addDays(weekStart, d);
        const dateStr = format(day, 'yyyy-MM-dd');
        days.push({
          date: dateStr,
          hasWorkout: workoutDates.has(dateStr),
        });
      }

      weeks.push({ label, days });
    }

    return weeks;
  }, [summaries]);

  return (
    <div className="space-y-1">
      {/* Day labels */}
      <div className="flex items-center gap-1">
        <div className="w-14 shrink-0" />
        {DAY_LABELS.map((label, i) => (
          <div
            key={i}
            className="flex h-5 w-5 items-center justify-center text-[10px] text-muted-foreground sm:h-6 sm:w-6 sm:text-xs"
          >
            {label}
          </div>
        ))}
      </div>

      {/* Week rows */}
      {grid.map((week) => (
        <div key={week.label} className="flex items-center gap-1">
          <div className="w-14 shrink-0 text-right text-[10px] text-muted-foreground sm:text-xs">
            {week.label}
          </div>
          {week.days.map((day) => (
            <div
              key={day.date}
              title={day.date}
              className={cn(
                'h-5 w-5 rounded-sm border sm:h-6 sm:w-6',
                day.hasWorkout
                  ? 'border-primary/30 bg-primary'
                  : 'border-border bg-muted/50'
              )}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
