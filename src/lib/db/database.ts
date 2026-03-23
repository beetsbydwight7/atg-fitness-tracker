import Dexie, { type Table } from 'dexie';
import type { Exercise } from '@/lib/types/exercise';
import type { Workout, WorkoutSummary } from '@/lib/types/workout';
import type { Template } from '@/lib/types/template';
import type { PRRecord } from '@/lib/types/pr';
import type { AppSettings } from '@/lib/types';

export class FitnessDatabase extends Dexie {
  exercises!: Table<Exercise, string>;
  workouts!: Table<Workout, string>;
  workoutSummaries!: Table<WorkoutSummary, string>;
  templates!: Table<Template, string>;
  prs!: Table<PRRecord, string>;
  settings!: Table<AppSettings, string>;

  constructor() {
    super('ATGFitnessTracker');
    this.version(1).stores({
      exercises: '&id, slug, category, *primaryMuscles, isATGSignature, isCustom',
      workouts: '&id, startedAt, completedAt, templateId, isComplete',
      workoutSummaries: '&id, workoutId, date, *exerciseIds',
      templates: '&id, category, isBuiltIn',
      prs: '&id, exerciseId, metric, achievedAt, workoutId',
      settings: '&id',
    });
  }
}

export const db = new FitnessDatabase();

export async function initializeDatabase() {
  const { seedExercises } = await import('@/data/exercises');
  const { seedTemplates } = await import('@/data/templates');

  const exerciseCount = await db.exercises.where('isCustom').equals(0).count();
  if (exerciseCount === 0) {
    await db.exercises.bulkPut(seedExercises);
  }

  const templateCount = await db.templates.where('isBuiltIn').equals(1).count();
  if (templateCount === 0) {
    await db.templates.bulkPut(seedTemplates);
  }

  const settingsExist = await db.settings.get('default');
  if (!settingsExist) {
    await db.settings.put({
      id: 'default',
      weightUnit: 'lbs',
      defaultRestSeconds: 90,
      theme: 'system',
    });
  }
}
