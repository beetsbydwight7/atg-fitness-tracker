'use client';

import { useState, useEffect } from 'react';
import { Trophy, Dumbbell, Clock, Flame, Share2, CheckCheck, Pencil, Trash2 } from 'lucide-react';
import { v4 as uuid } from 'uuid';
import { useRouter } from 'next/navigation';
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
import { generateWhoopText, shareWorkout } from '@/lib/utils/workoutShare';
import type { Workout } from '@/lib/types';
import type { Template } from '@/lib/types/template';

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
  const router = useRouter();
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [loading, setLoading] = useState(false);
  const [shareStatus, setShareStatus] = useState<'idle' | 'copied' | 'shared'>('idle');
  const [templateStatus, setTemplateStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function handleDelete() {
    if (!workout) return;
    await db.workouts.delete(workout.id);
    await db.workoutSummaries.where('workoutId').equals(workout.id).delete();
    onOpenChange(false);
  }

  async function handleUseAsTemplate() {
    if (!workout) return;
    setTemplateStatus('saving');
    const now = new Date();
    const template: Template = {
      id: uuid(),
      name: workout.name,
      description: '',
      category: 'custom',
      estimatedMinutes: workout.durationSeconds ? Math.round(workout.durationSeconds / 60) : 0,
      difficulty: 3,
      exercises: workout.exercises.map((ex, i) => {
        const completedSets = ex.sets.filter((s) => s.status === 'completed');
        const allSets = ex.sets;
        const representativeSets = completedSets.length > 0 ? completedSets : allSets;
        const avgReps = representativeSets.length > 0
          ? Math.round(
              representativeSets.reduce((sum, s) => sum + (s.reps ?? 0), 0) /
                representativeSets.length
            )
          : null;
        return {
          exerciseId: ex.exerciseId,
          exerciseName: ex.exerciseName,
          exerciseSlug: ex.exerciseSlug,
          order: i,
          targetSets: allSets.length || 3,
          targetReps: avgReps,
          targetDuration: representativeSets[0]?.duration ?? null,
          restSeconds: ex.restSeconds,
        };
      }),
      isBuiltIn: false,
      createdAt: now,
      updatedAt: now,
    };
    await db.templates.put(template);
    setTemplateStatus('saved');
    setTimeout(() => setTemplateStatus('idle'), 2500);
  }

  async function handleShare() {
    if (!workout) return;
    const text = generateWhoopText(workout, weightUnit);
    const result = await shareWorkout(text);
    if (result === 'shared' || result === 'copied') {
      setShareStatus(result);
      setTimeout(() => setShareStatus('idle'), 3000);
    }
  }

  useEffect(() => {
    if (!workoutId || !open) {
      setWorkout(null);
      setConfirmDelete(false);
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
                    .filter((s) => s.status !== 'skipped')
                    .map((set) => (
                      <div
                        key={set.id}
                        className={cn(
                          'flex items-center justify-between rounded-md px-2 py-1 text-xs',
                          set.isPR
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                            : set.status === 'completed'
                              ? 'text-foreground'
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
                          {set.status === 'pending' && (
                            <span className="text-[10px] text-muted-foreground/60">
                              —
                            </span>
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

            {/* Share to Whoop */}
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={handleShare}
            >
              {shareStatus === 'copied' ? (
                <>
                  <CheckCheck className="size-4 text-green-500" />
                  Copied to Clipboard!
                </>
              ) : shareStatus === 'shared' ? (
                <>
                  <CheckCheck className="size-4 text-green-500" />
                  Shared!
                </>
              ) : (
                <>
                  <Share2 className="size-4" />
                  Share to Whoop
                </>
              )}
            </Button>

            {/* Use as Template button */}
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={handleUseAsTemplate}
              disabled={templateStatus === 'saving'}
            >
              {templateStatus === 'saved' ? (
                <>
                  <CheckCheck className="size-4 text-green-500" />
                  Saved as Template!
                </>
              ) : (
                <>
                  <Flame className="size-4" />
                  Use as Template
                </>
              )}
            </Button>

            {/* Edit Workout button */}
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => {
                onOpenChange(false);
                router.push(`/workout?editId=${workout.id}`);
              }}
            >
              <Pencil className="size-4" />
              Edit Workout
            </Button>

            {/* Delete Workout */}
            {confirmDelete ? (
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={handleDelete}
                >
                  Yes, delete
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setConfirmDelete(false)}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                className="w-full gap-2 text-destructive hover:text-destructive"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 className="size-4" />
                Delete Workout
              </Button>
            )}
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
