'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { Trophy } from 'lucide-react';
import { db } from '@/lib/db/database';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatDateShort } from '@/lib/utils/dateUtils';

const metricLabels: Record<string, string> = {
  estimated_1rm: 'Est. 1RM',
  max_weight: 'Max Weight',
  max_reps: 'Max Reps',
  max_volume_set: 'Max Volume',
  max_duration: 'Max Duration',
  max_distance: 'Max Distance',
};

export default function RecentPRs() {
  const prs = useLiveQuery(
    () =>
      db.prs
        .orderBy('achievedAt')
        .reverse()
        .limit(5)
        .toArray(),
    []
  );

  if (!prs || prs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="size-5 text-amber-500" />
            Recent PRs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No personal records yet. Start training to set your first PR!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="size-5 text-amber-500" />
          Recent PRs
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3">
          {prs.map((pr) => (
            <div
              key={pr.id}
              className="flex items-center gap-3 rounded-lg border border-border/50 p-3"
            >
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-500/10">
                <Trophy className="size-4 text-amber-500" />
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <p className="truncate text-sm font-medium">{pr.exerciseName}</p>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-[10px]">
                    {metricLabels[pr.metric] ?? pr.metric}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {pr.displayValue}
                  </span>
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-0.5">
                {pr.improvementPercent !== null && pr.improvementPercent > 0 && (
                  <span className="text-xs font-medium text-green-500">
                    +{pr.improvementPercent.toFixed(1)}%
                  </span>
                )}
                <span className="text-[10px] text-muted-foreground">
                  {formatDateShort(pr.achievedAt)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
