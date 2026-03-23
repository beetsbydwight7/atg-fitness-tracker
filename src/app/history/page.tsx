'use client';

import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Dumbbell, Search, X } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Filtered summaries for list view
  const filteredSummaries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return summaries.filter((s) => {
      if (q) {
        const nameMatch = s.name.toLowerCase().includes(q);
        const exerciseMatch = s.exerciseNames?.some((n) => n.toLowerCase().includes(q));
        if (!nameMatch && !exerciseMatch) return false;
      }
      if (dateFrom && s.date < dateFrom) return false;
      if (dateTo && s.date > dateTo) return false;
      return true;
    });
  }, [summaries, searchQuery, dateFrom, dateTo]);

  // Group filtered summaries by week (reuse logic from useHistory)
  const filteredByWeek = useMemo(() => {
    const groups: Record<string, typeof filteredSummaries> = {};
    for (const s of [...filteredSummaries].reverse()) {
      const d = new Date(s.date + 'T00:00:00');
      const monday = new Date(d);
      monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
      const key = monday.toISOString().slice(0, 10);
      if (!groups[key]) groups[key] = [];
      groups[key].push(s);
    }
    return Object.entries(groups)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([weekStart, weekSummaries]) => ({
        weekStart,
        label: new Date(weekStart + 'T00:00:00').toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        summaries: weekSummaries,
      }));
  }, [filteredSummaries]);

  const hasFilters = searchQuery || dateFrom || dateTo;

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
          <div className="space-y-4 pt-3">
            {/* Search & filter */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-8 pr-8"
                  placeholder="Search workouts or exercises…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="mb-1 block text-[11px] text-muted-foreground">From</label>
                  <Input
                    type="date"
                    className="text-sm"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                </div>
                <div className="flex-1">
                  <label className="mb-1 block text-[11px] text-muted-foreground">To</label>
                  <Input
                    type="date"
                    className="text-sm"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                </div>
              </div>
              {hasFilters && (
                <p className="text-xs text-muted-foreground">
                  {filteredSummaries.length} result{filteredSummaries.length !== 1 ? 's' : ''}
                  {' — '}
                  <button
                    className="underline"
                    onClick={() => { setSearchQuery(''); setDateFrom(''); setDateTo(''); }}
                  >
                    Clear
                  </button>
                </p>
              )}
            </div>

            {filteredByWeek.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No workouts match your search.</p>
            ) : (
              filteredByWeek.map((week) => (
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
              ))
            )}
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
