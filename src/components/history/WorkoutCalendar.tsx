'use client';

import { useState, useMemo } from 'react';
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  isSameMonth,
  isToday,
  getDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { WorkoutSummary } from '@/lib/types';

interface WorkoutCalendarProps {
  summaries: WorkoutSummary[];
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
}

const DAY_HEADERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export function WorkoutCalendar({
  summaries,
  selectedDate,
  onSelectDate,
}: WorkoutCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const workoutDatesSet = useMemo(() => {
    const dates = new Set<string>();
    for (const s of summaries) {
      dates.add(s.date);
    }
    return dates;
  }, [summaries]);

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentMonth]);

  // Build a set of streak dates for subtle connecting background
  const streakDates = useMemo(() => {
    const sorted = [...workoutDatesSet].sort();
    const streaks = new Set<string>();

    for (let i = 0; i < sorted.length; i++) {
      const current = new Date(sorted[i] + 'T00:00:00');
      const prev = i > 0 ? new Date(sorted[i - 1] + 'T00:00:00') : null;
      const next =
        i < sorted.length - 1
          ? new Date(sorted[i + 1] + 'T00:00:00')
          : null;

      const diffPrev = prev
        ? (current.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24)
        : Infinity;
      const diffNext = next
        ? (next.getTime() - current.getTime()) / (1000 * 60 * 60 * 24)
        : Infinity;

      if (diffPrev === 1 || diffNext === 1) {
        streaks.add(sorted[i]);
      }
    }

    return streaks;
  }, [workoutDatesSet]);

  function handlePrevMonth() {
    setCurrentMonth((prev) => subMonths(prev, 1));
  }

  function handleNextMonth() {
    setCurrentMonth((prev) => addMonths(prev, 1));
  }

  return (
    <div className="space-y-3">
      {/* Month/Year Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon-sm" onClick={handlePrevMonth}>
          <ChevronLeft className="size-4" />
        </Button>
        <h3 className="text-sm font-medium text-foreground">
          {format(currentMonth, 'MMMM yyyy')}
        </h3>
        <Button variant="ghost" size="icon-sm" onClick={handleNextMonth}>
          <ChevronRight className="size-4" />
        </Button>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 gap-0">
        {DAY_HEADERS.map((day, i) => (
          <div
            key={i}
            className="flex items-center justify-center py-1 text-xs font-medium text-muted-foreground"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-0">
        {calendarDays.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const inMonth = isSameMonth(day, currentMonth);
          const today = isToday(day);
          const hasWorkout = workoutDatesSet.has(dateStr);
          const isSelected = selectedDate === dateStr;
          const isStreak = streakDates.has(dateStr);

          return (
            <button
              key={dateStr}
              type="button"
              disabled={!hasWorkout}
              onClick={() => hasWorkout && onSelectDate(dateStr)}
              className={cn(
                'relative flex flex-col items-center justify-center py-1.5 text-sm transition-colors',
                !inMonth && 'text-muted-foreground/40',
                inMonth && !hasWorkout && 'text-muted-foreground',
                inMonth && hasWorkout && 'text-foreground cursor-pointer',
                today &&
                  'font-bold',
                isSelected &&
                  'bg-primary/15 rounded-lg',
                isStreak &&
                  inMonth &&
                  !isSelected &&
                  'bg-primary/5',
                !hasWorkout && 'cursor-default'
              )}
            >
              <span
                className={cn(
                  'flex size-7 items-center justify-center rounded-full text-xs',
                  today && 'ring-1 ring-primary'
                )}
              >
                {format(day, 'd')}
              </span>
              {hasWorkout && (
                <span className="mt-0.5 size-1.5 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
