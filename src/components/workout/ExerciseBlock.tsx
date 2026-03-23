'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardAction } from '@/components/ui/card';
import { SetRow } from '@/components/workout/SetRow';
import { cn } from '@/lib/utils';
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
    <Card size="sm">
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
            <span>{workoutExercise.exerciseName}</span>
          </button>
          <span className="text-xs font-normal text-muted-foreground">
            {completedCount}/{totalCount}
          </span>
        </CardTitle>
        <CardAction>
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
  );
}
