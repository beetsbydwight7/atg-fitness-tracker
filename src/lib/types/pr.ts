export type PRMetric =
  | 'estimated_1rm'
  | 'max_weight'
  | 'max_reps'
  | 'max_volume_set'
  | 'max_duration'
  | 'max_distance';

export interface PRRecord {
  id: string;
  exerciseId: string;
  exerciseName: string;
  metric: PRMetric;
  value: number;
  previousValue: number | null;
  improvementPercent: number | null;
  workoutId: string;
  workoutSetId: string;
  achievedAt: Date;
  displayValue: string;
}
