'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { Flame } from 'lucide-react';
import { db } from '@/lib/db/database';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { getStreakDays } from '@/lib/utils/dateUtils';

export default function StreakBadge() {
  const summaries = useLiveQuery(
    () => db.workoutSummaries.orderBy('date').reverse().limit(60).toArray(),
    []
  );

  if (!summaries) return null;

  const dates = summaries.map((s) => s.date);
  const streak = getStreakDays(dates);

  return (
    <Card>
      <CardContent className="flex items-center gap-3 py-1">
        <div
          className={cn(
            'flex size-10 items-center justify-center rounded-full',
            streak > 0
              ? 'bg-orange-500/10'
              : 'bg-muted'
          )}
        >
          <Flame
            className={cn(
              'size-5',
              streak > 0
                ? 'text-orange-500 animate-pulse'
                : 'text-muted-foreground'
            )}
          />
        </div>
        <div>
          <p className="text-lg font-semibold leading-tight">
            {streak} day{streak !== 1 ? 's' : ''}
          </p>
          <p className="text-xs text-muted-foreground">
            {streak > 0 ? 'Training streak' : 'No active streak'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
