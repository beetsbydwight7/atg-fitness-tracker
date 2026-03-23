'use client';

import { useState, useEffect } from 'react';
import { Check, X, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PRBadge } from '@/components/workout/PRBadge';
import { cn } from '@/lib/utils';
import { displayWeight, parseWeightToKg } from '@/lib/utils/formatWeight';
import type { WorkoutSet, SetType } from '@/lib/types';
import type { EquipmentType } from '@/lib/types/exercise';

// Exercises using only band/iron_neck (no weight-trackable equipment) use a
// resistance label instead of a numeric weight.
const WEIGHT_EQUIPMENT: EquipmentType[] = [
  'barbell', 'dumbbell', 'kettlebell', 'cable', 'machine', 'tib_bar', 'sled',
];

function usesResistanceField(equipment: EquipmentType[]): boolean {
  return (
    (equipment.includes('band') || equipment.includes('iron_neck')) &&
    !equipment.some((e) => WEIGHT_EQUIPMENT.includes(e))
  );
}

interface SetRowProps {
  set: WorkoutSet;
  setType: SetType;
  exerciseEquipment: EquipmentType[];
  previousSet?: WorkoutSet | null;
  onUpdate: (updates: Partial<WorkoutSet>) => void;
  onComplete: () => void;
  onSkip: () => void;
  weightUnit: 'kg' | 'lbs';
}

export function SetRow({
  set,
  setType,
  exerciseEquipment,
  previousSet,
  onUpdate,
  onComplete,
  onSkip,
  weightUnit,
}: SetRowProps) {
  const isResistanceExercise = usesResistanceField(exerciseEquipment);
  const isCompleted = set.status === 'completed';
  const isSkipped = set.status === 'skipped';
  const isPending = set.status === 'pending';

  // Local controlled state for inputs while the set is pending.
  // Initialised from the set's current values (e.g. template defaults).
  const [weightInput, setWeightInput] = useState(
    set.weight != null ? displayWeight(set.weight, weightUnit).toString() : ''
  );
  const [repsInput, setRepsInput] = useState(set.reps?.toString() ?? '');
  const [durationInput, setDurationInput] = useState(set.duration?.toString() ?? '');
  const [distanceInput, setDistanceInput] = useState(set.distance?.toString() ?? '');
  const [resistanceInput, setResistanceInput] = useState(set.bandResistance ?? '');
  const [notesOpen, setNotesOpen] = useState(false);

  // Re-sync local state when the set identity changes (different set mounted
  // into the same row slot, e.g. after a set is removed).
  useEffect(() => {
    setWeightInput(
      set.weight != null ? displayWeight(set.weight, weightUnit).toString() : ''
    );
    setRepsInput(set.reps?.toString() ?? '');
    setDurationInput(set.duration?.toString() ?? '');
    setDistanceInput(set.distance?.toString() ?? '');
    setResistanceInput(set.bandResistance ?? '');
  }, [set.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const prevWeightDisplay = previousSet?.weight
    ? displayWeight(previousSet.weight, weightUnit).toString()
    : '';
  const prevRepsDisplay = previousSet?.reps?.toString() ?? '';
  const prevDurationDisplay = previousSet?.duration?.toString() ?? '';
  const prevResistanceDisplay = previousSet?.bandResistance ?? '';

  // For completed/skipped sets, display the committed value from state.
  const committedWeightDisplay =
    set.weight != null ? displayWeight(set.weight, weightUnit).toString() : '';
  const committedRepsDisplay = set.reps?.toString() ?? '';
  const committedDurationDisplay = set.duration?.toString() ?? '';
  const committedDistanceDisplay = set.distance?.toString() ?? '';
  const committedResistanceDisplay = set.bandResistance ?? '';

  function handleWeightChange(value: string) {
    setWeightInput(value);
    const num = parseFloat(value);
    if (value === '' || value === '.') {
      onUpdate({ weight: null });
    } else if (!isNaN(num)) {
      onUpdate({ weight: parseWeightToKg(num, weightUnit) });
    }
  }

  function handleRepsChange(value: string) {
    setRepsInput(value);
    const num = parseInt(value, 10);
    onUpdate({ reps: isNaN(num) ? null : num });
  }

  function handleDurationChange(value: string) {
    setDurationInput(value);
    const num = parseInt(value, 10);
    onUpdate({ duration: isNaN(num) ? null : num });
  }

  function handleDistanceChange(value: string) {
    setDistanceInput(value);
    const num = parseFloat(value);
    onUpdate({ distance: isNaN(num) ? null : num });
  }

  function handleResistanceChange(value: string) {
    setResistanceInput(value);
    onUpdate({ bandResistance: value || null });
  }

  return (
    <div
      className={cn(
        'grid items-center gap-2 rounded-lg px-2 py-1.5 transition-colors',
        isCompleted && 'bg-green-500/10',
        isSkipped && 'bg-muted/50 opacity-60',
        setType === 'duration' || setType === 'distance'
          ? 'grid-cols-[2rem_1fr_1fr_2.5rem_2.5rem]'
          : setType === 'bodyweight_reps'
            ? 'grid-cols-[2rem_1fr_2.5rem_2.5rem]'
            : 'grid-cols-[2rem_1fr_1fr_2.5rem_2.5rem]'
      )}
    >
      {/* Set number */}
      <span
        className={cn(
          'text-center text-xs font-medium text-muted-foreground',
          isSkipped && 'line-through'
        )}
      >
        {set.setNumber}
      </span>

      {/* Resistance input (band / iron_neck) or weight input */}
      {setType !== 'bodyweight_reps' && (
        isResistanceExercise ? (
          <Input
            className="h-7 text-center text-sm"
            inputMode="text"
            placeholder={prevResistanceDisplay || 'Resistance'}
            value={isPending ? resistanceInput : committedResistanceDisplay}
            onChange={(e) => handleResistanceChange(e.target.value)}
            disabled={!isPending}
          />
        ) : (
          <Input
            className="h-7 text-center text-sm"
            inputMode="decimal"
            placeholder={prevWeightDisplay || (weightUnit === 'kg' ? 'kg' : 'lbs')}
            value={isPending ? weightInput : committedWeightDisplay}
            onChange={(e) => handleWeightChange(e.target.value)}
            disabled={!isPending}
          />
        )
      )}

      {/* Reps input */}
      {(setType === 'reps' || setType === 'bodyweight_reps') && (
        <Input
          className="h-7 text-center text-sm"
          inputMode="numeric"
          placeholder={prevRepsDisplay || 'Reps'}
          value={isPending ? repsInput : committedRepsDisplay}
          onChange={(e) => handleRepsChange(e.target.value)}
          disabled={!isPending}
        />
      )}

      {/* Duration input */}
      {setType === 'duration' && (
        <Input
          className="h-7 text-center text-sm"
          inputMode="numeric"
          placeholder={prevDurationDisplay || 'Sec'}
          value={isPending ? durationInput : committedDurationDisplay}
          onChange={(e) => handleDurationChange(e.target.value)}
          disabled={!isPending}
        />
      )}

      {/* Distance input */}
      {setType === 'distance' && (
        <Input
          className="h-7 text-center text-sm"
          inputMode="decimal"
          placeholder="Meters"
          value={isPending ? distanceInput : committedDistanceDisplay}
          onChange={(e) => handleDistanceChange(e.target.value)}
          disabled={!isPending}
        />
      )}

      {/* Complete button */}
      <Button
        variant={isCompleted ? 'default' : 'outline'}
        size="icon-xs"
        onClick={onComplete}
        disabled={!isPending}
        className={cn(
          isCompleted && 'bg-green-600 text-white hover:bg-green-700'
        )}
      >
        <Check className="size-3.5" />
      </Button>

      {/* Skip button */}
      <Button
        variant={isSkipped ? 'secondary' : 'ghost'}
        size="icon-xs"
        onClick={onSkip}
        disabled={!isPending}
      >
        <X className="size-3.5" />
      </Button>

      {/* Notes toggle */}
      {isPending && (
        <button
          onClick={() => setNotesOpen((o) => !o)}
          className={cn(
            'col-span-full flex items-center gap-1 px-1 text-[11px]',
            notesOpen || set.notes ? 'text-primary' : 'text-muted-foreground'
          )}
        >
          <MessageSquare className="size-3" />
          {set.notes ? set.notes : 'Add note'}
        </button>
      )}

      {notesOpen && isPending && (
        <Input
          className="col-span-full h-7 text-xs"
          placeholder="Set note…"
          value={set.notes}
          onChange={(e) => onUpdate({ notes: e.target.value })}
          autoFocus
        />
      )}

      {/* Show note on completed sets */}
      {!isPending && set.notes && (
        <p className="col-span-full px-1 text-[11px] text-muted-foreground italic">
          {set.notes}
        </p>
      )}

      {/* PR badge */}
      {set.isPR && (
        <div className="col-span-full flex justify-end -mt-1">
          <PRBadge />
        </div>
      )}
    </div>
  );
}
