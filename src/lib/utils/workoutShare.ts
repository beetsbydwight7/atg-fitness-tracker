import type { Workout } from '@/lib/types/workout';
import { displayWeight } from './formatWeight';
import { formatDuration } from './dateUtils';
import { format } from 'date-fns';

export function generateWhoopText(
  workout: Workout,
  weightUnit: 'kg' | 'lbs'
): string {
  const date = format(new Date(workout.startedAt), 'MMM d, yyyy');
  const duration = workout.durationSeconds
    ? formatDuration(workout.durationSeconds)
    : 'N/A';

  const lines: string[] = [];
  lines.push(`Strength Workout — ${date}`);
  lines.push(`Duration: ${duration}`);
  lines.push('');

  for (const exercise of workout.exercises) {
    const completedSets = exercise.sets.filter((s) => s.status === 'completed');
    if (completedSets.length === 0) continue;

    lines.push(`${exercise.exerciseName}`);

    for (const set of completedSets) {
      const parts: string[] = [];

      if (set.weight != null && set.weight > 0 && set.reps != null) {
        const w = displayWeight(set.weight, weightUnit);
        parts.push(`${w} ${weightUnit} x ${set.reps} reps`);
      } else if (set.isBodyweight && set.reps != null) {
        parts.push(`Bodyweight x ${set.reps} reps`);
      } else if (set.reps != null && set.reps > 0) {
        parts.push(`${set.reps} reps`);
      }

      if (set.duration != null && set.duration > 0) {
        parts.push(`${set.duration}s hold`);
      }

      if (set.distance != null && set.distance > 0) {
        parts.push(`${set.distance}m`);
      }

      const prTag = set.isPR ? ' (PR!)' : '';
      lines.push(`  Set ${set.setNumber}: ${parts.join(', ')}${prTag}`);
    }

    if (exercise.restSeconds > 0) {
      lines.push(`  Rest: ${exercise.restSeconds}s between sets`);
    }

    lines.push('');
  }

  // Summary
  let totalVolume = 0;
  let totalSets = 0;
  let prCount = 0;

  for (const exercise of workout.exercises) {
    for (const set of exercise.sets) {
      if (set.status !== 'completed') continue;
      totalSets++;
      if (set.weight && set.reps) totalVolume += set.weight * set.reps;
      if (set.isPR) prCount++;
    }
  }

  lines.push('---');
  lines.push(`Total Sets: ${totalSets}`);
  if (totalVolume > 0) {
    const vol = displayWeight(totalVolume, weightUnit);
    lines.push(`Total Volume: ${vol} ${weightUnit}`);
  }
  if (prCount > 0) {
    lines.push(`Personal Records: ${prCount}`);
  }

  return lines.join('\n');
}

export async function shareWorkout(text: string): Promise<'shared' | 'copied' | 'failed'> {
  // Try native share API first (works on mobile)
  if (navigator.share) {
    try {
      await navigator.share({ text });
      return 'shared';
    } catch {
      // User cancelled or share failed — fall through to clipboard
    }
  }

  // Fallback to clipboard
  try {
    await navigator.clipboard.writeText(text);
    return 'copied';
  } catch {
    return 'failed';
  }
}
