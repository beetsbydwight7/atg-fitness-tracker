export type MuscleGroup =
  | 'tibialis_anterior'
  | 'calves'
  | 'quads'
  | 'hamstrings'
  | 'glutes'
  | 'hip_flexors'
  | 'adductors'
  | 'abductors'
  | 'lower_back'
  | 'upper_back'
  | 'lats'
  | 'traps'
  | 'chest'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'core'
  | 'neck'
  | 'full_body';

export type EquipmentType =
  | 'bodyweight'
  | 'barbell'
  | 'dumbbell'
  | 'kettlebell'
  | 'cable'
  | 'machine'
  | 'band'
  | 'slant_board'
  | 'tib_bar'
  | 'sled'
  | 'parallettes'
  | 'pull_up_bar'
  | 'dip_station'
  | 'bench'
  | 'box'
  | 'foam_roller'
  | 'none';

export type ExerciseCategory =
  | 'ATG_FOUNDATIONAL'
  | 'ATG_MOBILITY'
  | 'ATG_STRENGTH'
  | 'TRADITIONAL_LOWER'
  | 'TRADITIONAL_UPPER'
  | 'SLED'
  | 'GYMNASTICS';

export type SetType = 'reps' | 'duration' | 'distance' | 'bodyweight_reps';

export interface Exercise {
  id: string;
  slug: string;
  name: string;
  aliases: string[];
  category: ExerciseCategory;
  primaryMuscles: MuscleGroup[];
  secondaryMuscles: MuscleGroup[];
  equipment: EquipmentType[];
  setType: SetType;
  description: string;
  cues: string[];
  progressions: string[];
  isATGSignature: boolean;
  defaultSets: number;
  defaultReps: number | null;
  defaultDuration: number | null;
  isCustom: boolean;
}
