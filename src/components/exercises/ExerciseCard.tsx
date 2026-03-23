'use client';

import Link from 'next/link';
import { Flame, ChevronRight, Dumbbell } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Exercise, ExerciseCategory } from '@/lib/types/exercise';

const CATEGORY_LABELS: Record<ExerciseCategory, string> = {
  ATG_FOUNDATIONAL: 'ATG Foundational',
  ATG_MOBILITY: 'ATG Mobility',
  ATG_STRENGTH: 'ATG Strength',
  TRADITIONAL_LOWER: 'Traditional Lower',
  TRADITIONAL_UPPER: 'Traditional Upper',
  SLED: 'Sled',
  GYMNASTICS: 'Gymnastics',
};

const CATEGORY_COLORS: Record<ExerciseCategory, string> = {
  ATG_FOUNDATIONAL:
    'bg-amber-500/15 text-amber-400 border-amber-500/30',
  ATG_MOBILITY:
    'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  ATG_STRENGTH:
    'bg-rose-500/15 text-rose-400 border-rose-500/30',
  TRADITIONAL_LOWER:
    'bg-blue-500/15 text-blue-400 border-blue-500/30',
  TRADITIONAL_UPPER:
    'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
  SLED:
    'bg-orange-500/15 text-orange-400 border-orange-500/30',
  GYMNASTICS:
    'bg-purple-500/15 text-purple-400 border-purple-500/30',
};

function formatMuscle(muscle: string): string {
  return muscle
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function formatEquipment(eq: string): string {
  return eq
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

interface ExerciseCardProps {
  exercise: Exercise;
}

export function ExerciseCard({ exercise }: ExerciseCardProps) {
  return (
    <Link href={`/exercises/${exercise.slug}`}>
      <Card
        size="sm"
        className={cn(
          'cursor-pointer transition-colors hover:bg-muted/50 active:bg-muted/70'
        )}
      >
        <CardContent className="flex items-center gap-3">
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm truncate">
                {exercise.name}
              </span>
              {exercise.isATGSignature && (
                <Flame className="size-4 shrink-0 text-amber-500" />
              )}
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <Badge
                className={cn(
                  'text-[10px] px-1.5 py-0 h-4',
                  CATEGORY_COLORS[exercise.category]
                )}
              >
                {CATEGORY_LABELS[exercise.category]}
              </Badge>
            </div>

            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="truncate">
                {exercise.primaryMuscles.map(formatMuscle).join(', ')}
              </span>
            </div>

            {exercise.equipment.length > 0 &&
              !exercise.equipment.every((e) => e === 'none' || e === 'bodyweight') && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Dumbbell className="size-3 shrink-0" />
                  <span className="truncate">
                    {exercise.equipment
                      .filter((e) => e !== 'none' && e !== 'bodyweight')
                      .map(formatEquipment)
                      .join(', ')}
                  </span>
                </div>
              )}
          </div>

          <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
        </CardContent>
      </Card>
    </Link>
  );
}
