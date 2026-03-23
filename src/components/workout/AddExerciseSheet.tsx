'use client';

import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Flame } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { db } from '@/lib/db/database';
import { cn } from '@/lib/utils';
import type { Exercise, ExerciseCategory } from '@/lib/types';

interface AddExerciseSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectExercise: (exercise: Exercise) => void;
}

const CATEGORIES: { label: string; value: ExerciseCategory | 'ALL' }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'ATG Foundational', value: 'ATG_FOUNDATIONAL' },
  { label: 'ATG Mobility', value: 'ATG_MOBILITY' },
  { label: 'ATG Strength', value: 'ATG_STRENGTH' },
  { label: 'Traditional Lower', value: 'TRADITIONAL_LOWER' },
  { label: 'Traditional Upper', value: 'TRADITIONAL_UPPER' },
  { label: 'Sled', value: 'SLED' },
  { label: 'Gymnastics', value: 'GYMNASTICS' },
];

export function AddExerciseSheet({
  open,
  onOpenChange,
  onSelectExercise,
}: AddExerciseSheetProps) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<ExerciseCategory | 'ALL'>('ALL');

  const exercises = useLiveQuery(() => db.exercises.toArray(), []);

  const filtered = useMemo(() => {
    if (!exercises) return [];
    let result = exercises;

    if (activeCategory !== 'ALL') {
      result = result.filter((e) => e.category === activeCategory);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.aliases.some((a) => a.toLowerCase().includes(q)) ||
          e.primaryMuscles.some((m) => m.replace('_', ' ').includes(q))
      );
    }

    return result;
  }, [exercises, activeCategory, search]);

  function handleSelect(exercise: Exercise) {
    onSelectExercise(exercise);
    onOpenChange(false);
    setSearch('');
    setActiveCategory('ALL');
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] flex flex-col">
        <SheetHeader>
          <SheetTitle>Add Exercise</SheetTitle>
          <SheetDescription>Search and select an exercise to add</SheetDescription>
        </SheetHeader>

        {/* Search */}
        <div className="px-4">
          <Input
            placeholder="Search exercises..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9"
            autoFocus
          />
        </div>

        {/* Category filters */}
        <div className="flex gap-1.5 overflow-x-auto px-4 pb-1 no-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              className={cn(
                'shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                activeCategory === cat.value
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background text-muted-foreground hover:bg-muted'
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Exercise list */}
        <ScrollArea className="flex-1 px-4">
          <div className="space-y-1 pb-4">
            {filtered.map((exercise) => (
              <button
                key={exercise.id}
                onClick={() => handleSelect(exercise)}
                className="flex w-full items-start gap-3 rounded-lg p-2.5 text-left transition-colors hover:bg-muted active:bg-muted/80"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-foreground truncate">
                      {exercise.name}
                    </span>
                    {exercise.isATGSignature && (
                      <Flame className="size-3.5 shrink-0 text-orange-500" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {exercise.primaryMuscles
                      .map((m) => m.replace(/_/g, ' '))
                      .join(', ')}
                  </p>
                </div>
                <Badge variant="secondary" className="shrink-0 text-[10px]">
                  {exercise.category.replace(/_/g, ' ')}
                </Badge>
              </button>
            ))}

            {filtered.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No exercises found
              </p>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
