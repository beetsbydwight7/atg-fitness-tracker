'use client';

import { useState, useEffect } from 'react';
import { Trophy, Dumbbell, Clock, Flame } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatDate, formatDuration } from '@/lib/utils/dateUtils';
import { formatWeight, displayWeight } from '@/lib/utils/formatWeight';
import { db } from '@/lib/db/database';
import type { Workout } from '@/lib/types';

interface WorkoutDetailProps {
  workoutId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  weightUnit?: 'kg' | 'lbs';
}

export function WorkoutDetail({
  workoutId,
  open,
  onOpenChange,
  weightUnit = 'lbs',
}: WorkoutDetailProps) {
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!workoutId || !open) {
      setWorkout(null);
      return;
    }

    setLoading(true);
    db.workouts
      .get(workoutId)
      .then((w) => setWorkout(w ?? null))
      .finally(() => setLoading(false));
  }, [workoutId, open]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl p-0">
        <SheetHeader className="border-b px-4 py-3">
          <SheetTitle>
            {loading ? 'Loading...' : workout?.name ?? 'Workout'}
          </SheetTitle>
          {workout && (
            <p className="text-xs text-muted-foreground">
              {formatDate(workout.startedAt)}
              {workout.durationSeconds != null &&
                ` \u00B7 ${formatDuration(workout.durationSeconds)}`}
            </p>
          )}
        </SheetHeader>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        )}

        {!loading && workout && (
          <div className="space-y-4 p-4">
            {/* Exercise breakdown */}
            {workout.exercises.map((exercise) => (
              <div key={exercise.id} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Dumbbell className="size-4 text-primary" />
                  <h4 className="text-sm font-medium text-foreground">
                    {exercise.exerciseName}
                  </h4>
                </div>

                <div className="ml-6 space-y-1">
                  {exercise.sets
                    .filter((s) => s.status === 'completed')
                    .map((set) => (
                      <div
                        key={set.id}
                        className={cn(
                          'flex items-center justify-between rounded-md px-2 py-1 text-xs',
                          set.isPR
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                            : 'text-muted-foreground'
                        )}
                      >
                        <span className="font-mono text-muted-foreground">
                          Set {set.setNumber}
                        </span>
                        <div className="flex items-center gap-2">
                          {set.weight != null && set.reps != null && (
                            <span>
                              {displayWeight(set.weight, weightUnit)}{' '}
                              {weightUnit} &times; {set.reps}
                            </span>
                          )}
                          {set.isBodyweight && set.reps != null && (
                            <span>BW &times; {set.reps}</span>
                          )}
                          {set.duration != null && (
                            <span>{set.duration}s</span>
                          )}
                          {set.distance != null && (
                            <span>{set.distance}m</span>
                          )}
                          {set.isPR && (
                            <Trophy className="size-3 text-amber-500" />
                          )}
                        </div>
                      </div>
                    ))}
                </div>

                {exercise.notes && (
                  <p className="ml-6 text-xs italic text-muted-foreground">
                    {exercise.notes}
                  </p>
                )}
              </div>
            ))}

            {/* Workout notes */}
            {workout.notes && (
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  Notes
                </p>
                <p className="text-sm text-foreground">{workout.notes}</p>
              </div>
            )}

            {/* Use as Template button */}
            <Button variant="outline" className="w-full" disabled>
              <Flame className="size-4" />
              Use as Template
            </Button>
          </div>
        )}

        {!loading && !workout && workoutId && (
          <div className="flex flex-col items-center justify-center gap-2 py-12">
            <p className="text-sm text-muted-foreground">
              Workout not found
            </p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
