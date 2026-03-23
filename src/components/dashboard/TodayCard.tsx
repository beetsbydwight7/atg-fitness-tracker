'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import Link from 'next/link';
import { Play, RotateCcw, CheckCircle2 } from 'lucide-react';
import { db } from '@/lib/db/database';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatDuration, toDateString } from '@/lib/utils/dateUtils';
import { formatWeight } from '@/lib/utils/formatWeight';

interface TodayCardProps {
  weightUnit: 'kg' | 'lbs';
}

export default function TodayCard({ weightUnit }: TodayCardProps) {
  const today = toDateString(new Date());
  const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);

  const todaySummary = useLiveQuery(
    () => db.workoutSummaries.where('date').equals(today).first(),
    [today]
  );

  const activeWorkout = useLiveQuery(
    () =>
      db.workouts
        .where('isComplete')
        .equals(0)
        .filter((w) => new Date(w.startedAt) >= fourHoursAgo)
        .first(),
    []
  );

  const completedToday = useLiveQuery(
    () =>
      db.workouts
        .where('isComplete')
        .equals(1)
        .filter((w) => toDateString(new Date(w.startedAt)) === today)
        .first(),
    [today]
  );

  // Active incomplete workout: show resume
  if (activeWorkout) {
    const elapsed = Math.floor(
      (Date.now() - new Date(activeWorkout.startedAt).getTime()) / 1000
    );
    const completedSets = activeWorkout.exercises.reduce(
      (acc, ex) => acc + ex.sets.filter((s) => s.status === 'completed').length,
      0
    );

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RotateCcw className="size-5 text-amber-500" />
            Workout In Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            {activeWorkout.name} &middot; {formatDuration(elapsed)} &middot;{' '}
            {completedSets} sets done
          </p>
          <Link href="/workout">
            <Button className="w-full" size="lg">
              <RotateCcw className="size-4" />
              Resume Workout
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  // Completed workout today: show summary
  if (completedToday && todaySummary) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="size-5 text-green-500" />
            Today&apos;s Workout Complete
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-lg font-semibold">
                {formatDuration(todaySummary.durationSeconds)}
              </p>
              <p className="text-xs text-muted-foreground">Duration</p>
            </div>
            <div>
              <p className="text-lg font-semibold">{todaySummary.totalSets}</p>
              <p className="text-xs text-muted-foreground">Sets</p>
            </div>
            <div>
              <p className="text-lg font-semibold">
                {formatWeight(todaySummary.totalVolume, weightUnit)}
              </p>
              <p className="text-xs text-muted-foreground">Volume</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // No workout today: show start button
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ready to Train?</CardTitle>
      </CardHeader>
      <CardContent>
        <Link href="/workout">
          <Button className="w-full" size="lg">
            <Play className="size-4" />
            Start Workout
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
