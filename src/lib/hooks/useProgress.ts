'use client';

import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { startOfWeek, subWeeks, format, parseISO } from 'date-fns';
import { db } from '@/lib/db/database';
import type { WorkoutSummary, Workout } from '@/lib/types';
import type { PRRecord } from '@/lib/types/pr';

export interface WeeklyVolume {
  week: string;
  volume: number;
}

export interface WeeklyFrequency {
  week: string;
  workouts: number;
}

export interface E1RMDataPoint {
  date: string;
  value: number;
}

export function useProgress(exerciseId?: string) {
  const summaries = useLiveQuery(
    () => db.workoutSummaries.orderBy('date').toArray(),
    []
  );

  const workouts = useLiveQuery(
    () => db.workouts.toArray(),
    []
  );

  const prs = useLiveQuery(
    () =>
      exerciseId
        ? db.prs.where('exerciseId').equals(exerciseId).sortBy('achievedAt')
        : db.prs.orderBy('achievedAt').toArray(),
    [exerciseId]
  );

  const allPrs = useLiveQuery(
    () => db.prs.orderBy('achievedAt').toArray(),
    []
  );

  const exercises = useLiveQuery(
    () => db.exercises.toArray(),
    []
  );

  const isLoading =
    summaries === undefined ||
    workouts === undefined ||
    prs === undefined ||
    allPrs === undefined ||
    exercises === undefined;

  const weeklyVolume = useMemo<WeeklyVolume[]>(() => {
    if (!summaries) return [];

    const now = new Date();
    const twelveWeeksAgo = subWeeks(startOfWeek(now, { weekStartsOn: 1 }), 11);
    const weekMap = new Map<string, number>();

    // Initialize all 12 weeks
    for (let i = 0; i < 12; i++) {
      const weekStart = subWeeks(startOfWeek(now, { weekStartsOn: 1 }), 11 - i);
      const key = format(weekStart, 'MMM d');
      weekMap.set(key, 0);
    }

    for (const summary of summaries) {
      const date = parseISO(summary.date);
      if (date < twelveWeeksAgo) continue;
      const weekStart = startOfWeek(date, { weekStartsOn: 1 });
      const key = format(weekStart, 'MMM d');
      if (weekMap.has(key)) {
        weekMap.set(key, (weekMap.get(key) ?? 0) + summary.totalVolume);
      }
    }

    return Array.from(weekMap.entries()).map(([week, volume]) => ({
      week,
      volume: Math.round(volume),
    }));
  }, [summaries]);

  const weeklyFrequency = useMemo<WeeklyFrequency[]>(() => {
    if (!summaries) return [];

    const now = new Date();
    const twelveWeeksAgo = subWeeks(startOfWeek(now, { weekStartsOn: 1 }), 11);
    const weekMap = new Map<string, number>();

    for (let i = 0; i < 12; i++) {
      const weekStart = subWeeks(startOfWeek(now, { weekStartsOn: 1 }), 11 - i);
      const key = format(weekStart, 'MMM d');
      weekMap.set(key, 0);
    }

    for (const summary of summaries) {
      const date = parseISO(summary.date);
      if (date < twelveWeeksAgo) continue;
      const weekStart = startOfWeek(date, { weekStartsOn: 1 });
      const key = format(weekStart, 'MMM d');
      if (weekMap.has(key)) {
        weekMap.set(key, (weekMap.get(key) ?? 0) + 1);
      }
    }

    return Array.from(weekMap.entries()).map(([week, workouts]) => ({
      week,
      workouts,
    }));
  }, [summaries]);

  const exerciseE1RMTrend = useMemo<E1RMDataPoint[]>(() => {
    if (!workouts || !exerciseId) return [];

    const dataPoints: E1RMDataPoint[] = [];

    for (const workout of workouts) {
      if (!workout.isComplete || !workout.completedAt) continue;

      for (const exercise of workout.exercises) {
        if (exercise.exerciseId !== exerciseId) continue;

        let bestE1RM = 0;
        for (const set of exercise.sets) {
          if (
            set.status !== 'completed' ||
            set.weight === null ||
            set.reps === null ||
            set.reps === 0
          )
            continue;
          // Brzycki formula: 1RM = weight * (36 / (37 - reps))
          const e1rm =
            set.reps === 1
              ? set.weight
              : set.weight * (36 / (37 - Math.min(set.reps, 36)));
          if (e1rm > bestE1RM) bestE1RM = e1rm;
        }

        if (bestE1RM > 0) {
          const date =
            workout.completedAt instanceof Date
              ? workout.completedAt
              : new Date(workout.completedAt);
          dataPoints.push({
            date: format(date, 'MMM d'),
            value: Math.round(bestE1RM * 10) / 10,
          });
        }
      }
    }

    return dataPoints.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [workouts, exerciseId]);

  const bestSets = useMemo(() => {
    if (!workouts || !exerciseId) return [];

    const sets: {
      date: string;
      weight: number;
      reps: number;
      volume: number;
      e1rm: number;
    }[] = [];

    for (const workout of workouts) {
      if (!workout.isComplete || !workout.completedAt) continue;

      for (const exercise of workout.exercises) {
        if (exercise.exerciseId !== exerciseId) continue;

        for (const set of exercise.sets) {
          if (
            set.status !== 'completed' ||
            set.weight === null ||
            set.reps === null ||
            set.reps === 0
          )
            continue;

          const e1rm =
            set.reps === 1
              ? set.weight
              : set.weight * (36 / (37 - Math.min(set.reps, 36)));

          const date =
            workout.completedAt instanceof Date
              ? workout.completedAt
              : new Date(workout.completedAt);

          sets.push({
            date: format(date, 'MMM d, yyyy'),
            weight: set.weight,
            reps: set.reps,
            volume: set.weight * set.reps,
            e1rm: Math.round(e1rm * 10) / 10,
          });
        }
      }
    }

    return sets
      .sort((a, b) => b.e1rm - a.e1rm)
      .slice(0, 10);
  }, [workouts, exerciseId]);

  const prCount = useMemo(() => {
    return allPrs?.length ?? 0;
  }, [allPrs]);

  // Volume per muscle group over the last 12 weeks
  const muscleGroupVolume = useMemo(() => {
    if (!workouts || !exercises) return [];
    const now = new Date();
    const twelveWeeksMs = 12 * 7 * 24 * 60 * 60 * 1000;
    const cutoff = new Date(now.getTime() - twelveWeeksMs);

    const exerciseMap: Record<string, typeof exercises[0]> = {};
    for (const ex of exercises) exerciseMap[ex.id] = ex;

    const volumeMap: Record<string, number> = {};

    for (const workout of workouts) {
      if (!workout.isComplete || !workout.completedAt) continue;
      const completedAt = workout.completedAt instanceof Date ? workout.completedAt : new Date(workout.completedAt);
      if (completedAt < cutoff) continue;

      for (const ex of workout.exercises) {
        const exerciseDef = exerciseMap[ex.exerciseId];
        const muscles = exerciseDef?.primaryMuscles ?? [];
        for (const set of ex.sets) {
          if (set.status !== 'completed' || set.weight === null || set.reps === null) continue;
          const vol = set.weight * set.reps;
          for (const muscle of muscles) {
            volumeMap[muscle] = (volumeMap[muscle] ?? 0) + vol;
          }
        }
      }
    }

    return Object.entries(volumeMap)
      .map(([muscle, volume]) => ({ muscle, volume: Math.round(volume) }))
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 10);
  }, [workouts, exercises]);

  return {
    summaries: summaries ?? [],
    weeklyVolume,
    weeklyFrequency,
    exerciseE1RMTrend,
    bestSets,
    prs: prs ?? [],
    allPrs: allPrs ?? [],
    prCount,
    exercises: exercises ?? [],
    muscleGroupVolume,
    isLoading,
  };
}
