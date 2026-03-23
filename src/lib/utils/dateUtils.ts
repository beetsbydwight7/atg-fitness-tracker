import { format, startOfWeek, endOfWeek, eachDayOfInterval, isToday, isSameDay, differenceInSeconds, differenceInDays, subDays } from 'date-fns';

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date + (date.length === 10 ? 'T00:00:00' : '')) : date;
  return format(d, 'MMM d, yyyy');
}

export function formatDateShort(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date + (date.length === 10 ? 'T00:00:00' : '')) : date;
  if (isToday(d)) return 'Today';
  const yesterday = subDays(new Date(), 1);
  if (isSameDay(d, yesterday)) return 'Yesterday';
  return format(d, 'MMM d');
}

export function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0) return `${hrs}h ${mins}m`;
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
}

export function formatTimer(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function toDateString(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function getWeekDays(date: Date): Date[] {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  const end = endOfWeek(date, { weekStartsOn: 1 });
  return eachDayOfInterval({ start, end });
}

export function getElapsedSeconds(from: Date): number {
  return differenceInSeconds(new Date(), from);
}

export function getStreakDays(workoutDates: string[]): number {
  if (workoutDates.length === 0) return 0;
  const sorted = [...new Set(workoutDates)].sort().reverse();
  const today = toDateString(new Date());
  const yesterday = toDateString(subDays(new Date(), 1));

  if (sorted[0] !== today && sorted[0] !== yesterday) return 0;

  let streak = 1;
  for (let i = 1; i < sorted.length; i++) {
    const diff = differenceInDays(new Date(sorted[i - 1]), new Date(sorted[i]));
    if (diff === 1) streak++;
    else break;
  }
  return streak;
}
