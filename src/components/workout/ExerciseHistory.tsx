'use client';

import { History, Loader2 } from 'lucide-react';
import { useExerciseHistory } from '@/lib/hooks/useExerciseHistory';
import { displayWeight } from '@/lib/utils/formatWeight';
import { formatDateShort } from '@/lib/utils/dateUtils';
import { cn } from '@/lib/utils';
import type { SetType } from '@/lib/types';
import type { EquipmentType } from '@/lib/types/exercise';

const WEIGHT_EQUIPMENT: EquipmentType[] = [
  'barbell', 'dumbbell', 'kettlebell', 'cable', 'machine', 'tib_bar', 'sled',
];

interface ExerciseHistoryProps {
  exerciseId: string;
  setType: SetType;
  exerciseEquipment: EquipmentType[];
  weightUnit: 'kg' | 'lbs';
}

function formatSet(
  set: { weight: number | null; reps: number | null; duration: number | null; distance: number | null; bandResistance: string | null },
  setType: SetType,
  weightUnit: 'kg' | 'lbs',
  isResistance: boolean
): string {
  switch (setType) {
    case 'bodyweight_reps':
      return `${set.reps ?? '-'}`;
    case 'duration': {
      const prefix = isResistance
        ? (set.bandResistance ?? '')
        : set.weight != null
          ? displayWeight(set.weight, weightUnit).toString()
          : '';
      const dur = set.duration != null ? `${set.duration}s` : '-';
      return prefix ? `${prefix} × ${dur}` : dur;
    }
    case 'distance': {
      const w = set.weight != null ? displayWeight(set.weight, weightUnit).toString() : '';
      const dist = set.distance != null ? `${set.distance}m` : '-';
      return w ? `${w} × ${dist}` : dist;
    }
    default: {
      // reps
      if (isResistance) {
        const band = set.bandResistance ?? '';
        return band ? `${band} × ${set.reps ?? '-'}` : `${set.reps ?? '-'}`;
      }
      const w = set.weight != null ? displayWeight(set.weight, weightUnit).toString() : 'BW';
      return `${w} × ${set.reps ?? '-'}`;
    }
  }
}

export function ExerciseHistory({
  exerciseId,
  setType,
  exerciseEquipment,
  weightUnit,
}: ExerciseHistoryProps) {
  const { sessions, loading } = useExerciseHistory(exerciseId, 6);

  const isResistance =
    (exerciseEquipment.includes('band') || exerciseEquipment.includes('iron_neck')) &&
    !exerciseEquipment.some((e) => WEIGHT_EQUIPMENT.includes(e));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-3 text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="flex items-center gap-2 py-3 text-xs text-muted-foreground">
        <History className="size-3.5" />
        <span>No previous sessions</span>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        <History className="size-3" />
        Recent History
      </div>
      <div className="space-y-1">
        {sessions.map((session) => (
          <div
            key={session.workoutId}
            className="flex items-baseline gap-2 text-xs"
          >
            <span className="w-16 shrink-0 text-muted-foreground tabular-nums">
              {formatDateShort(session.date)}
            </span>
            <div className="flex flex-wrap gap-x-2 gap-y-0.5">
              {session.exercise.sets.map((set, i) => (
                <span
                  key={i}
                  className={cn(
                    'tabular-nums',
                    set.isPR && 'font-semibold text-yellow-600 dark:text-yellow-400'
                  )}
                >
                  {formatSet(set, setType, weightUnit, isResistance)}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
