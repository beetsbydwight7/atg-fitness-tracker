'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { v4 as uuid } from 'uuid';
import { db } from '@/lib/db/database';
import { checkForPRs } from '@/lib/utils/prDetection';
import { calculateWorkoutVolume, calculateCompletedSets, calculateTotalSets } from '@/lib/utils/volumeCalc';
import { getElapsedSeconds, toDateString } from '@/lib/utils/dateUtils';
import type { Exercise, Workout, WorkoutExercise, WorkoutSet, WorkoutSummary } from '@/lib/types';
import type { Template } from '@/lib/types/template';

interface UseWorkoutReturn {
  workout: Workout | null;
  isActive: boolean;
  elapsed: number;
  completedSets: number;
  totalSets: number;
  startWorkout: (name?: string) => Promise<void>;
  startFromTemplate: (template: Template) => Promise<void>;
  resumeWorkout: (workout: Workout) => void;
  addExercise: (exercise: Exercise) => Promise<void>;
  removeExercise: (workoutExerciseId: string) => Promise<void>;
  addSet: (workoutExerciseId: string) => Promise<void>;
  removeSet: (workoutExerciseId: string, setId: string) => Promise<void>;
  updateSet: (workoutExerciseId: string, setId: string, updates: Partial<WorkoutSet>) => Promise<void>;
  completeSet: (workoutExerciseId: string, setId: string) => Promise<void>;
  skipSet: (workoutExerciseId: string, setId: string) => Promise<void>;
  completeWorkout: (currentWorkout: Workout) => Promise<WorkoutSummary | null>;
  discardWorkout: () => Promise<void>;
  updateWorkoutName: (name: string) => void;
}

const FOUR_HOURS_MS = 4 * 60 * 60 * 1000;

export function useWorkout(): UseWorkoutReturn {
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Always-current ref so async callbacks (completeSet, completeWorkout) never
  // close over a stale workout snapshot.
  const workoutRef = useRef<Workout | null>(null);
  workoutRef.current = workout;

  const isActive = workout !== null && !workout.isComplete;
  const completedSets = workout ? calculateCompletedSets(workout.exercises) : 0;
  const totalSets = workout ? calculateTotalSets(workout.exercises) : 0;

  // Elapsed time ticker
  useEffect(() => {
    if (elapsedRef.current) {
      clearInterval(elapsedRef.current);
      elapsedRef.current = null;
    }

    if (isActive && workout) {
      setElapsed(getElapsedSeconds(new Date(workout.startedAt)));
      elapsedRef.current = setInterval(() => {
        setElapsed(getElapsedSeconds(new Date(workout.startedAt)));
      }, 1000);
    }

    return () => {
      if (elapsedRef.current) {
        clearInterval(elapsedRef.current);
        elapsedRef.current = null;
      }
    };
  }, [isActive, workout?.startedAt]);

  // Check for incomplete workout on mount
  useEffect(() => {
    async function checkIncomplete() {
      const cutoff = new Date(Date.now() - FOUR_HOURS_MS);
      const incomplete = await db.workouts
        .where('isComplete')
        .equals(0)
        .filter((w) => new Date(w.startedAt) > cutoff)
        .first();
      if (incomplete) {
        setWorkout(incomplete);
      }
    }
    checkIncomplete();
  }, []);

  const saveWorkout = useCallback(async (w: Workout) => {
    await db.workouts.put(w);
  }, []);

  const updateWorkoutState = useCallback(
    (updater: (prev: Workout) => Workout) => {
      setWorkout((prev) => {
        if (!prev) return prev;
        const updated = updater(prev);
        // Fire-and-forget save
        saveWorkout(updated);
        return updated;
      });
    },
    [saveWorkout]
  );

  const startWorkout = useCallback(
    async (name?: string) => {
      const now = new Date();
      const w: Workout = {
        id: uuid(),
        name: name || `Workout ${toDateString(now)}`,
        templateId: null,
        startedAt: now,
        completedAt: null,
        durationSeconds: null,
        exercises: [],
        notes: '',
        isComplete: false,
      };
      await saveWorkout(w);
      setWorkout(w);
    },
    [saveWorkout]
  );

  const startFromTemplate = useCallback(
    async (template: Template) => {
      const now = new Date();
      const exercises: WorkoutExercise[] = template.exercises.map((te) => ({
        id: uuid(),
        exerciseId: te.exerciseId,
        exerciseName: te.exerciseName,
        exerciseSlug: te.exerciseSlug,
        order: te.order,
        sets: Array.from({ length: te.targetSets }, (_, i) => ({
          id: uuid(),
          exerciseId: te.exerciseId,
          setNumber: i + 1,
          reps: te.targetReps,
          weight: null,
          duration: te.targetDuration,
          distance: null,
          rir: null,
          rpe: null,
          isBodyweight: false,
          isPR: false,
          status: 'pending' as const,
          notes: '',
          completedAt: null,
        })),
        restSeconds: te.restSeconds,
        notes: '',
      }));

      const w: Workout = {
        id: uuid(),
        name: template.name,
        templateId: template.id,
        startedAt: now,
        completedAt: null,
        durationSeconds: null,
        exercises,
        notes: '',
        isComplete: false,
      };
      await saveWorkout(w);
      setWorkout(w);
    },
    [saveWorkout]
  );

  const resumeWorkout = useCallback((w: Workout) => {
    setWorkout(w);
  }, []);

  const addExercise = useCallback(
    async (exercise: Exercise) => {
      updateWorkoutState((prev) => {
        const order = prev.exercises.length;
        const we: WorkoutExercise = {
          id: uuid(),
          exerciseId: exercise.id,
          exerciseName: exercise.name,
          exerciseSlug: exercise.slug,
          order,
          sets: Array.from({ length: exercise.defaultSets }, (_, i) => ({
            id: uuid(),
            exerciseId: exercise.id,
            setNumber: i + 1,
            reps: exercise.defaultReps,
            weight: null,
            duration: exercise.defaultDuration,
            distance: null,
            rir: null,
            rpe: null,
            isBodyweight: exercise.setType === 'bodyweight_reps',
            isPR: false,
            status: 'pending' as const,
            notes: '',
            completedAt: null,
          })),
          restSeconds: 90,
          notes: '',
        };
        return { ...prev, exercises: [...prev.exercises, we] };
      });
    },
    [updateWorkoutState]
  );

  const removeExercise = useCallback(
    async (workoutExerciseId: string) => {
      updateWorkoutState((prev) => ({
        ...prev,
        exercises: prev.exercises
          .filter((e) => e.id !== workoutExerciseId)
          .map((e, i) => ({ ...e, order: i })),
      }));
    },
    [updateWorkoutState]
  );

  const addSet = useCallback(
    async (workoutExerciseId: string) => {
      updateWorkoutState((prev) => ({
        ...prev,
        exercises: prev.exercises.map((ex) => {
          if (ex.id !== workoutExerciseId) return ex;
          const lastSet = ex.sets[ex.sets.length - 1];
          const newSet: WorkoutSet = {
            id: uuid(),
            exerciseId: ex.exerciseId,
            setNumber: ex.sets.length + 1,
            reps: lastSet?.reps ?? null,
            weight: lastSet?.weight ?? null,
            duration: lastSet?.duration ?? null,
            distance: lastSet?.distance ?? null,
            rir: null,
            rpe: null,
            isBodyweight: lastSet?.isBodyweight ?? false,
            isPR: false,
            status: 'pending',
            notes: '',
            completedAt: null,
          };
          return { ...ex, sets: [...ex.sets, newSet] };
        }),
      }));
    },
    [updateWorkoutState]
  );

  const removeSet = useCallback(
    async (workoutExerciseId: string, setId: string) => {
      updateWorkoutState((prev) => ({
        ...prev,
        exercises: prev.exercises.map((ex) => {
          if (ex.id !== workoutExerciseId) return ex;
          return {
            ...ex,
            sets: ex.sets
              .filter((s) => s.id !== setId)
              .map((s, i) => ({ ...s, setNumber: i + 1 })),
          };
        }),
      }));
    },
    [updateWorkoutState]
  );

  const updateSet = useCallback(
    async (workoutExerciseId: string, setId: string, updates: Partial<WorkoutSet>) => {
      updateWorkoutState((prev) => ({
        ...prev,
        exercises: prev.exercises.map((ex) => {
          if (ex.id !== workoutExerciseId) return ex;
          return {
            ...ex,
            sets: ex.sets.map((s) => (s.id === setId ? { ...s, ...updates } : s)),
          };
        }),
      }));
    },
    [updateWorkoutState]
  );

  const completeSet = useCallback(
    async (workoutExerciseId: string, setId: string) => {
      const w = workoutRef.current;
      if (!w) return;

      const ex = w.exercises.find((e) => e.id === workoutExerciseId);
      if (!ex) return;
      const set = ex.sets.find((s) => s.id === setId);
      if (!set) return;

      const completedAt = new Date();

      // Mark as completed IMMEDIATELY so that completeWorkout always sees the
      // correct count and volume regardless of how long the async PR check takes.
      updateWorkoutState((prev) => ({
        ...prev,
        exercises: prev.exercises.map((e) => {
          if (e.id !== workoutExerciseId) return e;
          return {
            ...e,
            sets: e.sets.map((s) =>
              s.id === setId
                ? { ...s, status: 'completed' as const, completedAt }
                : s
            ),
          };
        }),
      }));

      // Run PR detection asynchronously; failures must not undo completion.
      const completedSet: WorkoutSet = { ...set, status: 'completed', completedAt };
      try {
        const { isPR } = await checkForPRs(
          completedSet,
          ex.exerciseId,
          ex.exerciseName,
          w.id
        );
        if (isPR) {
          updateWorkoutState((prev) => ({
            ...prev,
            exercises: prev.exercises.map((e) => {
              if (e.id !== workoutExerciseId) return e;
              return {
                ...e,
                sets: e.sets.map((s) =>
                  s.id === setId ? { ...s, isPR: true } : s
                ),
              };
            }),
          }));
        }
      } catch {
        // PR detection failed silently; the set remains completed.
      }
    },
    [updateWorkoutState]
  );

  const skipSet = useCallback(
    async (workoutExerciseId: string, setId: string) => {
      updateWorkoutState((prev) => ({
        ...prev,
        exercises: prev.exercises.map((ex) => {
          if (ex.id !== workoutExerciseId) return ex;
          return {
            ...ex,
            sets: ex.sets.map((s) =>
              s.id === setId ? { ...s, status: 'skipped' as const, completedAt: new Date() } : s
            ),
          };
        }),
      }));
    },
    [updateWorkoutState]
  );

  const completeWorkout = useCallback(
    async (currentWorkout: Workout): Promise<WorkoutSummary | null> => {
      // Receive the workout from the caller (page component) rather than
      // reading workoutRef.current, which may lag a render behind the
      // committed state when the user taps Finish immediately after
      // completing the last set.
      const w = currentWorkout;

      const now = new Date();
      const durationSeconds = getElapsedSeconds(new Date(w.startedAt));
      const volume = calculateWorkoutVolume(w.exercises);
      const completed = calculateCompletedSets(w.exercises);
      const prCount = w.exercises.reduce(
        (count, ex) => count + ex.sets.filter((s) => s.isPR).length,
        0
      );

      const completedWorkout: Workout = {
        ...w,
        completedAt: now,
        durationSeconds,
        isComplete: true,
      };

      const summary: WorkoutSummary = {
        id: uuid(),
        workoutId: w.id,
        date: toDateString(now),
        name: w.name,
        durationSeconds,
        totalSets: completed,
        totalVolume: volume,
        exerciseIds: w.exercises.map((e) => e.exerciseId),
        exerciseNames: w.exercises.map((e) => e.exerciseName),
        prCount,
      };

      await db.workouts.put(completedWorkout);
      await db.workoutSummaries.put(summary);

      setWorkout(completedWorkout);
      return summary;
    },
    []
  );

  const discardWorkout = useCallback(async () => {
    if (!workout) return;
    await db.workouts.delete(workout.id);
    setWorkout(null);
  }, [workout]);

  const updateWorkoutName = useCallback(
    (name: string) => {
      updateWorkoutState((prev) => ({ ...prev, name }));
    },
    [updateWorkoutState]
  );

  return {
    workout,
    isActive,
    elapsed,
    completedSets,
    totalSets,
    startWorkout,
    startFromTemplate,
    resumeWorkout,
    addExercise,
    removeExercise,
    addSet,
    removeSet,
    updateSet,
    completeSet,
    skipSet,
    completeWorkout,
    discardWorkout,
    updateWorkoutName,
  };
}
