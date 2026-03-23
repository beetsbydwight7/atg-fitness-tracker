export interface WorkoutSet {
  id: string;
  exerciseId: string;
  setNumber: number;
  reps: number | null;
  weight: number | null; // always stored in kg
  duration: number | null; // seconds
  distance: number | null; // meters
  rir: number | null;
  rpe: number | null;
  isBodyweight: boolean;
  isPR: boolean;
  status: 'pending' | 'completed' | 'skipped';
  notes: string;
  completedAt: Date | null;
}

export interface WorkoutExercise {
  id: string;
  exerciseId: string;
  exerciseName: string;
  exerciseSlug: string;
  order: number;
  sets: WorkoutSet[];
  restSeconds: number;
  notes: string;
}

export interface Workout {
  id: string;
  name: string;
  templateId: string | null;
  startedAt: Date;
  completedAt: Date | null;
  durationSeconds: number | null;
  exercises: WorkoutExercise[];
  notes: string;
  isComplete: boolean;
}

export interface WorkoutSummary {
  id: string;
  workoutId: string;
  date: string; // YYYY-MM-DD
  name: string;
  durationSeconds: number;
  totalSets: number;
  totalVolume: number; // kg * reps
  exerciseIds: string[];
  prCount: number;
}
