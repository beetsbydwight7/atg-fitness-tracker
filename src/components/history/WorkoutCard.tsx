'use client';

import { Trophy, Clock, Dumbbell } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatDateShort, formatDuration } from '@/lib/utils/dateUtils';
import { formatWeight } from '@/lib/utils/formatWeight';
import type { WorkoutSummary } from '@/lib/types';

interface WorkoutCardProps {
  summary: WorkoutSummary;
  weightUnit: 'kg' | 'lbs';
  onClick?: () => void;
}

export function WorkoutCard({ summary, weightUnit, onClick }: WorkoutCardProps) {
  return (
    <Card
      size="sm"
      className={cn(
        'cursor-pointer transition-colors hover:bg-muted/50 active:bg-muted/70',
      )}
      onClick={onClick}
    >
      <CardContent className="space-y-2.5">
        {/* Top row: name + date */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h4 className="truncate text-sm font-medium text-foreground">
              {summary.name}
            </h4>
            <p className="text-xs text-muted-foreground">
              {formatDateShort(summary.date)}
            </p>
          </div>
          {summary.prCount > 0 && (
            <Badge variant="default" className="shrink-0 gap-1 bg-amber-500/90 text-white">
              <Trophy className="size-3" />
              {summary.prCount} PR{summary.prCount !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3" />
            {formatDuration(summary.durationSeconds)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Dumbbell className="size-3" />
            {summary.totalSets} sets
          </span>
          {summary.totalVolume > 0 && (
            <span className="text-xs">
              {formatWeight(summary.totalVolume, weightUnit)} vol
            </span>
          )}
        </div>

        {/* Exercise badges */}
        {(summary.exerciseNames ?? []).length > 0 && (
          <div className="flex flex-wrap gap-1">
            {(summary.exerciseNames ?? []).slice(0, 5).map((name, i) => (
              <Badge key={i} variant="secondary" className="text-[10px]">
                {name}
              </Badge>
            ))}
            {(summary.exerciseNames ?? []).length > 5 && (
              <Badge variant="outline" className="text-[10px]">
                +{(summary.exerciseNames ?? []).length - 5}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
