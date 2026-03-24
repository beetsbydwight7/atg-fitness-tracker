'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/db/database';
import type { WorkoutExercise } from '@/lib/types';

export interface ExerciseSession {
  workoutId: string;
  date: Date;
  exercise: WorkoutExercise;
}

/**
 * Fetches the last N completed sessions for a given exerciseId.
 * Returns them in reverse-chronological order (most recent first).
 */
export function useExerciseHistory(
  exerciseId: string,
  limit: number = 6
): { sessions: ExerciseSession[]; loading: boolean } {
  const [sessions, setSessions] = useState<ExerciseSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        // Query completed workouts, most recent first
        const workouts = await db.workouts
          .where('isComplete')
          .equals(1)
          .reverse()
          .toArray();

        const results: ExerciseSession[] = [];
        for (const w of workouts) {
          if (results.length >= limit) break;
          const match = w.exercises.find((e) => e.exerciseId === exerciseId);
          if (match) {
            const completedSets = match.sets.filter((s) => s.status === 'completed');
            if (completedSets.length > 0) {
              results.push({
                workoutId: w.id,
                date: new Date(w.completedAt ?? w.startedAt),
                exercise: { ...match, sets: completedSets },
              });
            }
          }
        }

        if (!cancelled) {
          setSessions(results);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [exerciseId, limit]);

  return { sessions, loading };
}
