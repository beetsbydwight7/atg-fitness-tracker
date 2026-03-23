'use client';

import { useState, useEffect, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Plus,
  Dumbbell,
  Timer,
  Trophy,
  Check,
  Share2,
  Copy,
  CheckCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ExerciseBlock } from '@/components/workout/ExerciseBlock';
import { AddExerciseSheet } from '@/components/workout/AddExerciseSheet';
import { RestTimer } from '@/components/workout/RestTimer';
import { useWorkout } from '@/lib/hooks/useWorkout';
import { useTimer } from '@/lib/hooks/useTimer';
import { db } from '@/lib/db/database';
import { formatTimer, formatDuration } from '@/lib/utils/dateUtils';
import { formatWeight } from '@/lib/utils/formatWeight';
import { cn } from '@/lib/utils';
import { generateWhoopText, shareWorkout } from '@/lib/utils/workoutShare';
import type { Exercise, Workout, WorkoutSummary, SetType } from '@/lib/types';

export default function WorkoutPage() {
  const {
    workout,
    isActive,
    elapsed,
    completedSets,
    totalSets,
    startWorkout,
    startFromTemplate,
    addExercise,
    removeExercise,
    addSet,
    updateSet,
    completeSet,
    skipSet,
    completeWorkout,
    discardWorkout,
    updateWorkoutName,
  } = useWorkout();

  const timer = useTimer();
  const [addExerciseOpen, setAddExerciseOpen] = useState(false);
  const [summary, setSummary] = useState<WorkoutSummary | null>(null);
  const [completedWorkout, setCompletedWorkout] = useState<Workout | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [shareStatus, setShareStatus] = useState<'idle' | 'copied' | 'shared'>('idle');

  const templates = useLiveQuery(() => db.templates.toArray(), []);
  const settings = useLiveQuery(() => db.settings.get('default'), []);
  const weightUnit = settings?.weightUnit ?? 'lbs';
  const defaultRestSeconds = settings?.defaultRestSeconds ?? 90;

  // Build a map of exerciseId -> setType from the exercises table
  const exerciseIds = useMemo(
    () => workout?.exercises.map((e) => e.exerciseId) ?? [],
    [workout?.exercises]
  );

  const exerciseDetails = useLiveQuery(
    async () => {
      if (exerciseIds.length === 0) return {};
      const exercises = await db.exercises.where('id').anyOf(exerciseIds).toArray();
      const map: Record<string, Exercise> = {};
      for (const ex of exercises) {
        map[ex.id] = ex;
      }
      return map;
    },
    [exerciseIds]
  );

  // Fetch previous workout data for placeholder display
  const previousWorkoutData = useLiveQuery(
    async () => {
      if (!workout || workout.exercises.length === 0) return {};
      const prevWorkouts = await db.workouts
        .where('isComplete')
        .equals(1)
        .reverse()
        .limit(20)
        .toArray();

      const result: Record<string, typeof workout.exercises[0]> = {};
      for (const ex of workout.exercises) {
        for (const pw of prevWorkouts) {
          const match = pw.exercises.find((pe) => pe.exerciseId === ex.exerciseId);
          if (match) {
            result[ex.id] = match;
            break;
          }
        }
      }
      return result;
    },
    [workout?.exercises.length]
  );

  async function handleCompleteSet(workoutExerciseId: string, setId: string) {
    await completeSet(workoutExerciseId, setId);
    // Start rest timer
    const ex = workout?.exercises.find((e) => e.id === workoutExerciseId);
    const restSecs = ex?.restSeconds || defaultRestSeconds;
    timer.start(restSecs);
  }

  async function handleFinishWorkout() {
    // Capture the workout data before completing (completing marks it done)
    const workoutSnapshot = workout ? { ...workout, exercises: [...workout.exercises] } : null;
    const s = await completeWorkout();
    if (s) {
      setSummary(s);
      if (workoutSnapshot) {
        setCompletedWorkout({
          ...workoutSnapshot,
          isComplete: true,
          completedAt: new Date(),
          durationSeconds: s.durationSeconds,
        } as Workout);
      }
      setShowSummary(true);
      setShareStatus('idle');
      timer.reset();
    }
  }

  async function handleShareToWhoop() {
    if (!completedWorkout) return;
    const text = generateWhoopText(completedWorkout, weightUnit);
    const result = await shareWorkout(text);
    if (result === 'shared' || result === 'copied') {
      setShareStatus(result);
      setTimeout(() => setShareStatus('idle'), 3000);
    }
  }

  function handleSelectExercise(exercise: Exercise) {
    addExercise(exercise);
  }

  function handleDismissSummary() {
    setShowSummary(false);
    setSummary(null);
  }

  // Completion summary overlay
  if (showSummary && summary) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center gap-6 px-4">
        <div className="flex size-16 items-center justify-center rounded-full bg-green-500/20">
          <Check className="size-8 text-green-500" />
        </div>

        <h1 className="text-2xl font-bold text-foreground">Workout Complete!</h1>

        <Card className="w-full max-w-sm">
          <CardContent className="grid grid-cols-2 gap-4 pt-4">
            <div className="text-center">
              <p className="text-2xl font-bold tabular-nums">
                {formatDuration(summary.durationSeconds)}
              </p>
              <p className="text-xs text-muted-foreground">Duration</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold tabular-nums">{summary.totalSets}</p>
              <p className="text-xs text-muted-foreground">Sets Completed</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold tabular-nums">
                {formatWeight(summary.totalVolume, weightUnit)}
              </p>
              <p className="text-xs text-muted-foreground">Total Volume</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <Trophy className="size-5 text-yellow-500" />
                <p className="text-2xl font-bold tabular-nums">{summary.prCount}</p>
              </div>
              <p className="text-xs text-muted-foreground">PRs Hit</p>
            </div>
          </CardContent>
        </Card>

        <div className="flex w-full max-w-sm flex-col gap-2">
          <Button
            size="lg"
            variant="outline"
            className="w-full gap-2"
            onClick={handleShareToWhoop}
          >
            {shareStatus === 'copied' ? (
              <>
                <CheckCheck className="size-5 text-green-500" />
                Copied to Clipboard!
              </>
            ) : shareStatus === 'shared' ? (
              <>
                <CheckCheck className="size-5 text-green-500" />
                Shared!
              </>
            ) : (
              <>
                <Share2 className="size-5" />
                Share to Whoop
              </>
            )}
          </Button>
          <Button size="lg" onClick={handleDismissSummary} className="w-full">
            Done
          </Button>
        </div>
      </div>
    );
  }

  // Active workout view
  if (isActive && workout) {
    return (
      <div className="flex flex-col gap-4 pb-32">
        {/* Header */}
        <div className="sticky top-0 z-40 border-b bg-background/95 px-4 py-3 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-2">
            <Input
              value={workout.name}
              onChange={(e) => updateWorkoutName(e.target.value)}
              className="h-8 border-none bg-transparent px-0 text-base font-bold focus-visible:ring-0"
            />
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="tabular-nums">
                <Timer className="mr-1 size-3" />
                {formatTimer(elapsed)}
              </Badge>
              <Button size="sm" onClick={handleFinishWorkout}>
                Finish
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {completedSets}/{totalSets} sets completed
          </p>
        </div>

        {/* Exercise blocks */}
        <div className="space-y-3 px-4">
          {workout.exercises.map((we) => {
            const detail = exerciseDetails?.[we.exerciseId];
            const setType: SetType = detail?.setType ?? 'reps';
            const prevEx = previousWorkoutData?.[we.id] ?? null;

            return (
              <ExerciseBlock
                key={we.id}
                workoutExercise={we}
                exerciseSetType={setType}
                previousExercise={prevEx}
                onUpdateSet={(setId, updates) => updateSet(we.id, setId, updates)}
                onCompleteSet={(setId) => handleCompleteSet(we.id, setId)}
                onSkipSet={(setId) => skipSet(we.id, setId)}
                onAddSet={() => addSet(we.id)}
                onRemoveExercise={() => removeExercise(we.id)}
                weightUnit={weightUnit}
              />
            );
          })}

          {workout.exercises.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <Dumbbell className="size-10 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                No exercises yet. Add one to get started.
              </p>
            </div>
          )}
        </div>

        {/* Floating Add Exercise button */}
        <div className="fixed bottom-20 right-4 z-40">
          <Button
            size="lg"
            className="size-12 rounded-full shadow-lg"
            onClick={() => setAddExerciseOpen(true)}
          >
            <Plus className="size-5" />
          </Button>
        </div>

        {/* Add Exercise Sheet */}
        <AddExerciseSheet
          open={addExerciseOpen}
          onOpenChange={setAddExerciseOpen}
          onSelectExercise={handleSelectExercise}
        />

        {/* Rest Timer */}
        {(timer.isRunning || timer.secondsRemaining > 0) && (
          <RestTimer
            secondsRemaining={timer.secondsRemaining}
            totalSeconds={timer.totalSeconds}
            isRunning={timer.isRunning}
            onPause={timer.pause}
            onResume={timer.resume}
            onReset={timer.reset}
            onAdjust={timer.adjust}
          />
        )}

        {/* Discard button */}
        <div className="px-4">
          <Button
            variant="destructive"
            size="sm"
            className="w-full"
            onClick={async () => {
              if (window.confirm('Discard this workout? This cannot be undone.')) {
                await discardWorkout();
                timer.reset();
              }
            }}
          >
            Discard Workout
          </Button>
        </div>
      </div>
    );
  }

  // No active workout: start screen
  return (
    <div className="flex flex-col gap-6 px-4 py-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Start Workout</h1>
        <p className="text-sm text-muted-foreground">
          Begin a new workout or pick a template
        </p>
      </div>

      <Button
        size="lg"
        className="w-full gap-2"
        onClick={() => startWorkout()}
      >
        <Dumbbell className="size-5" />
        Start Empty Workout
      </Button>

      {/* Templates */}
      {templates && templates.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Templates
          </h2>
          <div className="grid gap-3">
            {templates.map((template) => (
              <Card
                key={template.id}
                size="sm"
                className="cursor-pointer transition-colors hover:bg-muted/50 active:bg-muted"
                onClick={() => startFromTemplate(template)}
              >
                <CardHeader>
                  <CardTitle>{template.name}</CardTitle>
                  <CardDescription>
                    {template.exercises.length} exercises
                    {template.estimatedMinutes > 0 &&
                      ` \u00B7 ~${template.estimatedMinutes} min`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {template.exercises.map((e) => e.exerciseName).join(', ')}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
