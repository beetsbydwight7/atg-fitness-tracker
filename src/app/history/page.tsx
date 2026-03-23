'use client';

import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Dumbbell } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { WorkoutCalendar } from '@/components/history/WorkoutCalendar';
import { WorkoutCard } from '@/components/history/WorkoutCard';
import { WorkoutDetail } from '@/components/history/WorkoutDetail';
import { useHistory } from '@/lib/hooks/useHistory';
import { db } from '@/lib/db/database';
import type { AppSettings } from '@/lib/types';

export default function HistoryPage() {
  const { summaries, summariesByWeek, isLoading } = useHistory();
  const settings = useLiveQuery(() => db.settings.get('default'), []);
  const weightUnit = settings?.weightUnit ?? 'lbs';

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [detailWorkoutId, setDetailWorkoutId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Summaries for the selected date in calendar view
  const selectedDateSummaries = useMemo(() => {
    if (!selectedDate) return [];
    return summaries.filter((s) => s.date === selectedDate);
  }, [summaries, selectedDate]);

  function handleOpenDetail(workoutId: string) {
    setDetailWorkoutId(workoutId);
    setDetailOpen(true);
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  // Empty state
  if (summaries.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-4 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-muted">
          <Dumbbell className="size-8 text-muted-foreground" />
        </div>
        <h2 className="text-lg font-medium text-foreground">No workouts yet</h2>
        <p className="max-w-xs text-sm text-muted-foreground">
          Complete your first workout and it will appear here in your history.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 px-4 pb-24 pt-4">
      <h1 className="text-xl font-bold text-foreground">History</h1>

      <Tabs defaultValue={0}>
        <TabsList className="w-full">
          <TabsTrigger value={0}>Calendar</TabsTrigger>
          <TabsTrigger value={1}>List</TabsTrigger>
        </TabsList>

        {/* Calendar Tab */}
        <TabsContent value={0}>
          <div className="space-y-4 pt-3">
            <WorkoutCalendar
              summaries={summaries}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
            />

            {/* Selected day's workouts */}
            {selectedDate && (
              <div className="space-y-2">
                {selectedDateSummaries.length > 0 ? (
                  selectedDateSummaries.map((summary) => (
                    <WorkoutCard
                      key={summary.id}
                      summary={summary}
                      weightUnit={weightUnit}
                      onClick={() => handleOpenDetail(summary.workoutId)}
                    />
                  ))
                ) : (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    No workouts on this day
                  </p>
                )}
              </div>
            )}

            {!selectedDate && (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Tap a day with a workout to view details
              </p>
            )}
          </div>
        </TabsContent>

        {/* List Tab */}
        <TabsContent value={1}>
          <div className="space-y-6 pt-3">
            {summariesByWeek.map((week) => (
              <div key={week.weekStart} className="space-y-2">
                <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {week.label}
                </h3>
                <div className="space-y-2">
                  {week.summaries.map((summary) => (
                    <WorkoutCard
                      key={summary.id}
                      summary={summary}
                      weightUnit={weightUnit}
                      onClick={() => handleOpenDetail(summary.workoutId)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Workout Detail Sheet */}
      <WorkoutDetail
        workoutId={detailWorkoutId}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        weightUnit={weightUnit}
      />
    </div>
  );
}
