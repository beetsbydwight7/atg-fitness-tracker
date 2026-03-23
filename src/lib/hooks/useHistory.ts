'use client';

import { useMemo, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { startOfWeek, format } from 'date-fns';
import { db } from '@/lib/db/database';
import type { WorkoutSummary, Workout } from '@/lib/types';

export interface WeekGroup {
  weekStart: string; // YYYY-MM-DD
  label: string; // e.g. "Mar 17 – Mar 23"
  summaries: WorkoutSummary[];
}

export function useHistory() {
  const summaries = useLiveQuery(
    () =>
      db.workoutSummaries
        .orderBy('date')
        .reverse()
        .toArray(),
    []
  );

  const isLoading = summaries === undefined;

  const summariesByWeek = useMemo<WeekGroup[]>(() => {
    if (!summaries || summaries.length === 0) return [];

    const weekMap = new Map<string, WorkoutSummary[]>();

    for (const summary of summaries) {
      const date = new Date(summary.date + 'T00:00:00');
      const weekStartDate = startOfWeek(date, { weekStartsOn: 1 });
      const key = format(weekStartDate, 'yyyy-MM-dd');

      if (!weekMap.has(key)) {
        weekMap.set(key, []);
      }
      weekMap.get(key)!.push(summary);
    }

    const weeks: WeekGroup[] = [];
    for (const [weekStart, items] of weekMap) {
      const start = new Date(weekStart + 'T00:00:00');
      const end = new Date(start);
      end.setDate(end.getDate() + 6);

      const label = `${format(start, 'MMM d')} – ${format(end, 'MMM d')}`;
      weeks.push({ weekStart, label, summaries: items });
    }

    return weeks;
  }, [summaries]);

  const getMonthSummaries = useCallback(
    (year: number, month: number): WorkoutSummary[] => {
      if (!summaries) return [];
      const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
      return summaries.filter((s) => s.date.startsWith(prefix));
    },
    [summaries]
  );

  const getWorkoutById = useCallback(
    async (workoutId: string): Promise<Workout | undefined> => {
      return db.workouts.get(workoutId);
    },
    []
  );

  return {
    summaries: summaries ?? [],
    summariesByWeek,
    getMonthSummaries,
    getWorkoutById,
    isLoading,
  };
}
