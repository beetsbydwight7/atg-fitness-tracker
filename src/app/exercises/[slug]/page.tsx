'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  ArrowLeft,
  Flame,
  Dumbbell,
  ChevronRight,
} from 'lucide-react';
import { db } from '@/lib/db/database';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { ExerciseCategory } from '@/lib/types/exercise';
import Link from 'next/link';

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
  ATG_FOUNDATIONAL: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  ATG_MOBILITY: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  ATG_STRENGTH: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
  TRADITIONAL_LOWER: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  TRADITIONAL_UPPER: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
  SLED: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  GYMNASTICS: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
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

export default function ExerciseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();

  const exercise = useLiveQuery(
    () => db.exercises.where('slug').equals(slug).first(),
    [slug]
  );

  // Look up progression exercises to check if they exist in the DB
  const progressionExercises = useLiveQuery(async () => {
    if (!exercise || exercise.progressions.length === 0) return [];
    const all = await db.exercises.toArray();
    const slugMap = new Map(all.map((ex) => [ex.slug, ex]));
    return exercise.progressions.map((progSlug) => ({
      slug: progSlug,
      exercise: slugMap.get(progSlug) ?? null,
    }));
  }, [exercise]);

  if (exercise === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (exercise === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <p className="text-sm text-muted-foreground">Exercise not found.</p>
        <Button variant="outline" onClick={() => router.push('/exercises')}>
          <ArrowLeft className="size-4" />
          Back to Library
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col pb-6">
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b px-4 py-3 flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/exercises')}
        >
          <ArrowLeft className="size-5" />
        </Button>
        <h1 className="text-lg font-bold truncate">{exercise.name}</h1>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Name, category, signature badge */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              className={cn(
                'text-xs',
                CATEGORY_COLORS[exercise.category]
              )}
            >
              {CATEGORY_LABELS[exercise.category]}
            </Badge>
            {exercise.isATGSignature && (
              <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30 text-xs gap-1">
                <Flame className="size-3" />
                ATG Signature
              </Badge>
            )}
          </div>
        </div>

        {/* Description */}
        {exercise.description && (
          <Card size="sm">
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {exercise.description}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Coaching Cues */}
        {exercise.cues.length > 0 && (
          <Card size="sm">
            <CardHeader>
              <CardTitle>Coaching Cues</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal list-inside space-y-1.5">
                {exercise.cues.map((cue, i) => (
                  <li
                    key={i}
                    className="text-sm text-muted-foreground leading-relaxed"
                  >
                    {cue}
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        )}

        {/* Muscles */}
        <Card size="sm">
          <CardHeader>
            <CardTitle>Target Muscles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {exercise.primaryMuscles.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Primary</p>
                <div className="flex flex-wrap gap-1.5">
                  {exercise.primaryMuscles.map((m) => (
                    <Badge key={m} variant="secondary" className="text-xs">
                      {formatMuscle(m)}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {exercise.secondaryMuscles.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Secondary</p>
                <div className="flex flex-wrap gap-1.5">
                  {exercise.secondaryMuscles.map((m) => (
                    <Badge key={m} variant="outline" className="text-xs">
                      {formatMuscle(m)}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Equipment */}
        {exercise.equipment.length > 0 && (
          <Card size="sm">
            <CardHeader>
              <CardTitle>Equipment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1.5">
                {exercise.equipment.map((eq) => (
                  <Badge key={eq} variant="outline" className="text-xs gap-1">
                    <Dumbbell className="size-3" />
                    {formatEquipment(eq)}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Progressions */}
        {progressionExercises && progressionExercises.length > 0 && (
          <Card size="sm">
            <CardHeader>
              <CardTitle>Progressions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {progressionExercises.map((prog, i) => {
                const content = (
                  <div
                    className={cn(
                      'flex items-center justify-between py-2 text-sm',
                      i < progressionExercises.length - 1 && 'border-b border-border'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-muted-foreground w-5">
                        {i + 1}.
                      </span>
                      <span className={prog.exercise ? '' : 'text-muted-foreground'}>
                        {prog.exercise?.name ?? prog.slug}
                      </span>
                    </div>
                    {prog.exercise && (
                      <ChevronRight className="size-4 text-muted-foreground" />
                    )}
                  </div>
                );

                return prog.exercise ? (
                  <Link
                    key={prog.slug}
                    href={`/exercises/${prog.slug}`}
                    className="block hover:bg-muted/50 rounded-md px-1 -mx-1 transition-colors"
                  >
                    {content}
                  </Link>
                ) : (
                  <div key={prog.slug} className="px-1 -mx-1">
                    {content}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Defaults */}
        <Card size="sm">
          <CardHeader>
            <CardTitle>Defaults</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-muted-foreground">Sets</p>
                <p className="text-lg font-semibold">{exercise.defaultSets}</p>
              </div>
              {exercise.defaultReps !== null && (
                <div>
                  <p className="text-xs text-muted-foreground">Reps</p>
                  <p className="text-lg font-semibold">{exercise.defaultReps}</p>
                </div>
              )}
              {exercise.defaultDuration !== null && (
                <div>
                  <p className="text-xs text-muted-foreground">Duration</p>
                  <p className="text-lg font-semibold">{exercise.defaultDuration}s</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Add to Workout button */}
        <Button className="w-full h-11 text-base font-semibold" size="lg">
          Add to Workout
        </Button>
      </div>
    </div>
  );
}
