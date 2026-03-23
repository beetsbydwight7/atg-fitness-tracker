import { v4 as uuid } from 'uuid';
import { db } from '@/lib/db/database';
import type { PRRecord, PRMetric } from '@/lib/types/pr';
import type { WorkoutSet } from '@/lib/types/workout';

function estimatedOneRepMax(weight: number, reps: number): number {
  if (reps <= 0 || weight <= 0) return 0;
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30) * 100) / 100;
}

interface PRCheckResult {
  isPR: boolean;
  records: PRRecord[];
}

export async function checkForPRs(
  set: WorkoutSet,
  exerciseId: string,
  exerciseName: string,
  workoutId: string
): Promise<PRCheckResult> {
  const records: PRRecord[] = [];
  const now = new Date();

  if (set.status !== 'completed') return { isPR: false, records };

  // Weighted exercises: check estimated 1RM, max weight, max volume set
  if (set.weight && set.weight > 0 && set.reps && set.reps > 0) {
    const e1rm = estimatedOneRepMax(set.weight, set.reps);
    const volumeSet = set.weight * set.reps;

    const checks: { metric: PRMetric; value: number; display: string }[] = [
      { metric: 'estimated_1rm', value: e1rm, display: `${e1rm.toFixed(1)} kg e1RM` },
      { metric: 'max_weight', value: set.weight, display: `${set.weight} kg` },
      { metric: 'max_volume_set', value: volumeSet, display: `${volumeSet} kg total` },
    ];

    for (const check of checks) {
      const existing = await db.prs
        .where('[exerciseId+metric]')
        .equals([exerciseId, check.metric])
        .first()
        .catch(() => null);

      // Fallback: query without compound index
      const prev = existing ?? await db.prs
        .where('exerciseId')
        .equals(exerciseId)
        .filter((pr) => pr.metric === check.metric)
        .sortBy('achievedAt')
        .then((arr) => arr[arr.length - 1] ?? null);

      if (!prev || check.value > prev.value) {
        const improvement = prev
          ? Math.round(((check.value - prev.value) / prev.value) * 1000) / 10
          : null;

        records.push({
          id: uuid(),
          exerciseId,
          exerciseName,
          metric: check.metric,
          value: check.value,
          previousValue: prev?.value ?? null,
          improvementPercent: improvement,
          workoutId,
          workoutSetId: set.id,
          achievedAt: now,
          displayValue: check.display,
        });
      }
    }
  }

  // Bodyweight reps exercises
  if (set.isBodyweight && set.reps && set.reps > 0) {
    const prev = await db.prs
      .where('exerciseId')
      .equals(exerciseId)
      .filter((pr) => pr.metric === 'max_reps')
      .sortBy('achievedAt')
      .then((arr) => arr[arr.length - 1] ?? null);

    if (!prev || set.reps > prev.value) {
      const improvement = prev
        ? Math.round(((set.reps - prev.value) / prev.value) * 1000) / 10
        : null;
      records.push({
        id: uuid(),
        exerciseId,
        exerciseName,
        metric: 'max_reps',
        value: set.reps,
        previousValue: prev?.value ?? null,
        improvementPercent: improvement,
        workoutId,
        workoutSetId: set.id,
        achievedAt: now,
        displayValue: `${set.reps} reps`,
      });
    }
  }

  // Duration exercises
  if (set.duration && set.duration > 0) {
    const prev = await db.prs
      .where('exerciseId')
      .equals(exerciseId)
      .filter((pr) => pr.metric === 'max_duration')
      .sortBy('achievedAt')
      .then((arr) => arr[arr.length - 1] ?? null);

    if (!prev || set.duration > prev.value) {
      const improvement = prev
        ? Math.round(((set.duration - prev.value) / prev.value) * 1000) / 10
        : null;
      records.push({
        id: uuid(),
        exerciseId,
        exerciseName,
        metric: 'max_duration',
        value: set.duration,
        previousValue: prev?.value ?? null,
        improvementPercent: improvement,
        workoutId,
        workoutSetId: set.id,
        achievedAt: now,
        displayValue: `${set.duration}s`,
      });
    }
  }

  // Distance exercises
  if (set.distance && set.distance > 0) {
    const prev = await db.prs
      .where('exerciseId')
      .equals(exerciseId)
      .filter((pr) => pr.metric === 'max_distance')
      .sortBy('achievedAt')
      .then((arr) => arr[arr.length - 1] ?? null);

    if (!prev || set.distance > prev.value) {
      const improvement = prev
        ? Math.round(((set.distance - prev.value) / prev.value) * 1000) / 10
        : null;
      records.push({
        id: uuid(),
        exerciseId,
        exerciseName,
        metric: 'max_distance',
        value: set.distance,
        previousValue: prev?.value ?? null,
        improvementPercent: improvement,
        workoutId,
        workoutSetId: set.id,
        achievedAt: now,
        displayValue: `${set.distance}m`,
      });
    }
  }

  // Save all new PRs
  if (records.length > 0) {
    await db.prs.bulkPut(records);
  }

  return { isPR: records.length > 0, records };
}
