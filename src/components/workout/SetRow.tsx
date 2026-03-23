'use client';

import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PRBadge } from '@/components/workout/PRBadge';
import { cn } from '@/lib/utils';
import { displayWeight, parseWeightToKg } from '@/lib/utils/formatWeight';
import type { WorkoutSet, SetType } from '@/lib/types';

interface SetRowProps {
  set: WorkoutSet;
  setType: SetType;
  previousSet?: WorkoutSet | null;
  onUpdate: (updates: Partial<WorkoutSet>) => void;
  onComplete: () => void;
  onSkip: () => void;
  weightUnit: 'kg' | 'lbs';
}

export function SetRow({
  set,
  setType,
  previousSet,
  onUpdate,
  onComplete,
  onSkip,
  weightUnit,
}: SetRowProps) {
  const isCompleted = set.status === 'completed';
  const isSkipped = set.status === 'skipped';
  const isPending = set.status === 'pending';

  const prevWeightDisplay = previousSet?.weight
    ? displayWeight(previousSet.weight, weightUnit).toString()
    : '';
  const prevRepsDisplay = previousSet?.reps?.toString() ?? '';
  const prevDurationDisplay = previousSet?.duration?.toString() ?? '';

  const currentWeightDisplay = set.weight
    ? displayWeight(set.weight, weightUnit).toString()
    : '';

  function handleWeightChange(value: string) {
    const num = parseFloat(value);
    if (value === '' || value === '.') {
      onUpdate({ weight: null });
    } else if (!isNaN(num)) {
      onUpdate({ weight: parseWeightToKg(num, weightUnit) });
    }
  }

  function handleRepsChange(value: string) {
    const num = parseInt(value, 10);
    onUpdate({ reps: isNaN(num) ? null : num });
  }

  function handleDurationChange(value: string) {
    const num = parseInt(value, 10);
    onUpdate({ duration: isNaN(num) ? null : num });
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

      {/* Weight input (not shown for bodyweight_reps) */}
      {setType !== 'bodyweight_reps' && (
        <Input
          className="h-7 text-center text-sm"
          inputMode="decimal"
          placeholder={prevWeightDisplay || (weightUnit === 'kg' ? 'kg' : 'lbs')}
          value={isCompleted || isSkipped ? currentWeightDisplay : undefined}
          defaultValue={isPending ? currentWeightDisplay : undefined}
          onChange={(e) => handleWeightChange(e.target.value)}
          disabled={!isPending}
        />
      )}

      {/* Reps / Duration / Distance input */}
      {(setType === 'reps' || setType === 'bodyweight_reps') && (
        <Input
          className="h-7 text-center text-sm"
          inputMode="numeric"
          placeholder={prevRepsDisplay || 'Reps'}
          value={isCompleted || isSkipped ? (set.reps?.toString() ?? '') : undefined}
          defaultValue={isPending ? (set.reps?.toString() ?? '') : undefined}
          onChange={(e) => handleRepsChange(e.target.value)}
          disabled={!isPending}
        />
      )}

      {setType === 'duration' && (
        <Input
          className="h-7 text-center text-sm"
          inputMode="numeric"
          placeholder={prevDurationDisplay || 'Sec'}
          value={isCompleted || isSkipped ? (set.duration?.toString() ?? '') : undefined}
          defaultValue={isPending ? (set.duration?.toString() ?? '') : undefined}
          onChange={(e) => handleDurationChange(e.target.value)}
          disabled={!isPending}
        />
      )}

      {setType === 'distance' && (
        <>
          <Input
            className="h-7 text-center text-sm"
            inputMode="decimal"
            placeholder="Meters"
            value={isCompleted || isSkipped ? (set.distance?.toString() ?? '') : undefined}
            defaultValue={isPending ? (set.distance?.toString() ?? '') : undefined}
            onChange={(e) => {
              const num = parseFloat(e.target.value);
              onUpdate({ distance: isNaN(num) ? null : num });
            }}
            disabled={!isPending}
          />
        </>
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

      {/* PR badge */}
      {set.isPR && (
        <div className="col-span-full flex justify-end -mt-1">
          <PRBadge />
        </div>
      )}
    </div>
  );
}
