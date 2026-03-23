export interface TemplateExercise {
  exerciseId: string;
  exerciseName: string;
  exerciseSlug: string;
  order: number;
  targetSets: number;
  targetReps: number | null;
  targetDuration: number | null;
  restSeconds: number;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  estimatedMinutes: number;
  difficulty: number; // 1–5
  exercises: TemplateExercise[];
  isBuiltIn: boolean;
  createdAt: Date;
  updatedAt: Date;
}
