'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Plus, Trash2, ArrowUp, ArrowDown, Link2, Link2Off } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardAction } from '@/components/ui/card';
import { SetRow } from '@/components/workout/SetRow';
import { cn } from '@/lib/utils';
import { PlateCalculator } from '@/components/workout/PlateCalculator';
import type { WorkoutExercise, WorkoutSet, SetType } from '@/lib/types';

interface ExerciseBlockProps {
  workoutExercise: WorkoutExercise;
  exerciseSetType: SetType;
  previousExercise?: WorkoutExercise | null;
  onUpdateSet: (setId: string, updates: Partial<WorkoutSet>) => void;
  onCompleteSet: (setId: string) => void;
  onSkipSet: (setId: string) => void;
  onAddSet: () => void;
  onRemoveExercise: () => void;
  weightUnit: 'kg' | 'lbs';
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
  supersetGroupId?: string;
  supersetLabel?: string; // e.g. "A" or "B"
  onLinkSuperset?: () => void; // link with the next exercise
  onUnlinkSuperset?: () => void;
}

export function ExerciseBlock({
  workoutExercise,
  exerciseSetType,
  previousExercise,
  onUpdateSet,
  onCompleteSet,
  onSkipSet,
  onAddSet,
  onRemoveExercise,
  weightUnit,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  supersetGroupId,
  supersetLabel,
  onLinkSuperset,
  onUnlinkSuperset,
}: ExerciseBlockProps) {
  const [collapsed, setCollapsed] = useState(false);

  const completedCount = workoutExercise.sets.filter(
    (s) => s.status === 'completed'
  ).length;
  const totalCount = workoutExercise.sets.length;

  function getColumnHeaders() {
    switch (exerciseSetType) {
      case 'duration':
        return { col1: 'Weight', col2: 'Duration' };
      case 'distance':
        return { col1: 'Weight', col2: 'Distance' };
      case 'bodyweight_reps':
        return { col1: null, col2: 'Reps' };
      default:
        return { col1: weightUnit === 'kg' ? 'kg' : 'lbs', col2: 'Reps' };
    }
  }

  const headers = getColumnHeaders();

  return (
    <div className="relative">
      {supersetGroupId && (
        <div className="absolute -left-2 top-0 bottom-0 w-0.5 rounded-full bg-primary/40" />
      )}
    <Card size="sm" className={cn(supersetGroupId && 'border-primary/30')}>
      <CardHeader className="border-b pb-2">
        <CardTitle className="flex items-center gap-2">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center gap-1 text-left"
          >
            {collapsed ? (
              <ChevronDown className="size-4 text-muted-foreground" />
            ) : (
              <ChevronUp className="size-4 text-muted-foreground" />
            )}
            {supersetLabel && (
              <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {supersetLabel}
              </span>
            )}
            <span>{workoutExercise.exerciseName}</span>
          </button>
          <span className="text-xs font-normal text-muted-foreground">
            {completedCount}/{totalCount}
          </span>
        </CardTitle>
        <CardAction className="flex items-center gap-0.5">
          {exerciseSetType === 'reps' && (
            <PlateCalculator
              weightUnit={weightUnit}
              initialWeight={workoutExercise.sets.find((s) => s.weight != null)?.weight ?? null}
            />
          )}
          {onMoveUp && (
            <Button variant="ghost" size="icon-xs" onClick={onMoveUp} disabled={isFirst}>
              <ArrowUp className="size-3.5" />
            </Button>
          )}
          {onMoveDown && (
            <Button variant="ghost" size="icon-xs" onClick={onMoveDown} disabled={isLast}>
              <ArrowDown className="size-3.5" />
            </Button>
          )}
          {supersetGroupId && onUnlinkSuperset ? (
            <Button variant="ghost" size="icon-xs" onClick={onUnlinkSuperset} title="Remove from superset" className="text-primary">
              <Link2Off className="size-3.5" />
            </Button>
          ) : !supersetGroupId && onLinkSuperset && !isLast ? (
            <Button variant="ghost" size="icon-xs" onClick={onLinkSuperset} title="Superset with next exercise">
              <Link2 className="size-3.5" />
            </Button>
          ) : null}
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={onRemoveExercise}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </CardAction>
      </CardHeader>

      {!collapsed && (
        <CardContent className="space-y-1">
          {/* Column headers */}
          <div
            className={cn(
              'grid items-center gap-2 px-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground',
              exerciseSetType === 'bodyweight_reps'
                ? 'grid-cols-[2rem_1fr_2.5rem_2.5rem]'
                : 'grid-cols-[2rem_1fr_1fr_2.5rem_2.5rem]'
            )}
          >
            <span className="text-center">Set</span>
            {headers.col1 && <span className="text-center">{headers.col1}</span>}
            <span className="text-center">{headers.col2}</span>
            <span className="text-center">
              <span className="sr-only">Complete</span>
            </span>
            <span className="text-center">
              <span className="sr-only">Skip</span>
            </span>
          </div>

          {/* Set rows */}
          {workoutExercise.sets.map((set, idx) => {
            const prevSet = previousExercise?.sets[idx] ?? null;
            return (
              <SetRow
                key={set.id}
                set={set}
                setType={exerciseSetType}
                previousSet={prevSet}
                onUpdate={(updates) => onUpdateSet(set.id, updates)}
                onComplete={() => onCompleteSet(set.id)}
                onSkip={() => onSkipSet(set.id)}
                weightUnit={weightUnit}
              />
            );
          })}

          {/* Add Set button */}
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-muted-foreground"
            onClick={onAddSet}
          >
            <Plus className="size-3.5 mr-1" />
            Add Set
          </Button>
        </CardContent>
      )}
    </Card>
    </div>
  );
}
