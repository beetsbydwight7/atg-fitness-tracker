import type { WorkoutExercise } from '@/lib/types/workout';

export function calculateSetVolume(weight: number | null, reps: number | null): number {
  if (!weight || !reps) return 0;
  return weight * reps;
}

export function calculateExerciseVolume(exercise: WorkoutExercise): number {
  return exercise.sets.reduce((total, set) => {
    if (set.status !== 'completed') return total;
    return total + calculateSetVolume(set.weight, set.reps);
  }, 0);
}

export function calculateWorkoutVolume(exercises: WorkoutExercise[]): number {
  return exercises.reduce((total, ex) => total + calculateExerciseVolume(ex), 0);
}

export function calculateCompletedSets(exercises: WorkoutExercise[]): number {
  return exercises.reduce(
    (total, ex) => total + ex.sets.filter((s) => s.status === 'completed').length,
    0
  );
}

export function calculateTotalSets(exercises: WorkoutExercise[]): number {
  return exercises.reduce((total, ex) => total + ex.sets.length, 0);
}
