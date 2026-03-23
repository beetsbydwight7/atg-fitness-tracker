'use client';

import { useMemo, useState } from 'react';
import { Trophy } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/database';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/utils/dateUtils';
import type { PRRecord } from '@/lib/types/pr';

interface PRHistoryProps {
  exerciseFilter?: string;
}

const METRIC_LABELS: Record<string, string> = {
  estimated_1rm: 'Est. 1RM',
  max_weight: 'Max Weight',
  max_reps: 'Max Reps',
  max_volume_set: 'Max Volume (Set)',
  max_duration: 'Max Duration',
  max_distance: 'Max Distance',
};

export function PRHistory({ exerciseFilter }: PRHistoryProps) {
  const [sortAsc, setSortAsc] = useState(false);

  const prs = useLiveQuery(
    () =>
      exerciseFilter
        ? db.prs.where('exerciseId').equals(exerciseFilter).toArray()
        : db.prs.toArray(),
    [exerciseFilter]
  );

  const sortedPrs = useMemo(() => {
    if (!prs) return [];
    return [...prs].sort((a, b) => {
      const dateA = a.achievedAt instanceof Date ? a.achievedAt.getTime() : new Date(a.achievedAt).getTime();
      const dateB = b.achievedAt instanceof Date ? b.achievedAt.getTime() : new Date(b.achievedAt).getTime();
      return sortAsc ? dateA - dateB : dateB - dateA;
    });
  }, [prs, sortAsc]);

  if (prs === undefined) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (prs.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
        No personal records yet. Keep training!
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs text-muted-foreground">
            <th className="pb-2 pr-3 font-medium" />
            <th className="pb-2 pr-3 font-medium">Exercise</th>
            <th className="pb-2 pr-3 font-medium">Metric</th>
            <th className="pb-2 pr-3 font-medium">Value</th>
            <th className="pb-2 pr-3 font-medium">Improvement</th>
            <th
              className="cursor-pointer pb-2 font-medium hover:text-foreground"
              onClick={() => setSortAsc((prev) => !prev)}
            >
              Date {sortAsc ? '\u2191' : '\u2193'}
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedPrs.map((pr) => (
            <tr key={pr.id} className="border-b border-border/50 last:border-0">
              <td className="py-2.5 pr-2">
                <Trophy className="size-4 text-amber-500" />
              </td>
              <td className="py-2.5 pr-3 font-medium">{pr.exerciseName}</td>
              <td className="py-2.5 pr-3 text-muted-foreground">
                {METRIC_LABELS[pr.metric] ?? pr.metric}
              </td>
              <td className="py-2.5 pr-3">{pr.displayValue}</td>
              <td className="py-2.5 pr-3">
                {pr.improvementPercent !== null ? (
                  <span
                    className={cn(
                      'text-xs font-medium',
                      pr.improvementPercent > 0
                        ? 'text-green-500'
                        : 'text-muted-foreground'
                    )}
                  >
                    {pr.improvementPercent > 0 ? '+' : ''}
                    {pr.improvementPercent.toFixed(1)}%
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">First PR</span>
                )}
              </td>
              <td className="py-2.5 text-muted-foreground">
                {formatDate(pr.achievedAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
