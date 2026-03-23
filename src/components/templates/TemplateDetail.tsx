'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Play, Copy, Trash2, Clock, Star, Dumbbell } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Template } from '@/lib/types';

interface TemplateDetailProps {
  template: Template | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStart: (template: Template) => void;
  onDuplicate: (template: Template) => void;
  onDelete: (template: Template) => void;
}

function DifficultyStars({ level }: { level: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={cn(
            'size-3.5',
            i < level
              ? 'fill-yellow-500 text-yellow-500'
              : 'fill-none text-muted-foreground/40'
          )}
        />
      ))}
    </div>
  );
}

function formatExerciseTarget(
  targetSets: number,
  targetReps: number | null,
  targetDuration: number | null
): string {
  const repsPart =
    targetReps != null
      ? `${targetReps} reps`
      : targetDuration != null
        ? `${targetDuration}s`
        : '---';
  return `${targetSets} x ${repsPart}`;
}

export function TemplateDetail({
  template,
  open,
  onOpenChange,
  onStart,
  onDuplicate,
  onDelete,
}: TemplateDetailProps) {
  if (!template) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl">
        <SheetHeader>
          <div className="flex items-start justify-between gap-2">
            <SheetTitle>{template.name}</SheetTitle>
            <Badge variant="secondary">{template.category}</Badge>
          </div>
          <SheetDescription>{template.description}</SheetDescription>
        </SheetHeader>

        <div className="px-4 space-y-4">
          {/* Meta info */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <DifficultyStars level={template.difficulty} />
            <span className="flex items-center gap-1">
              <Clock className="size-4" />
              {template.estimatedMinutes} min
            </span>
            <span className="flex items-center gap-1">
              <Dumbbell className="size-4" />
              {template.exercises.length} exercises
            </span>
          </div>

          {/* Exercise list */}
          <div className="space-y-1">
            <h3 className="text-sm font-medium">Exercises</h3>
            <div className="divide-y rounded-lg border">
              {template.exercises
                .sort((a, b) => a.order - b.order)
                .map((ex, idx) => (
                  <div
                    key={`${ex.exerciseId}-${idx}`}
                    className="flex items-center justify-between px-3 py-2.5"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="flex items-center justify-center size-6 rounded-full bg-muted text-xs font-medium shrink-0">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {ex.exerciseName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatExerciseTarget(
                            ex.targetSets,
                            ex.targetReps,
                            ex.targetDuration
                          )}
                          {ex.restSeconds > 0 && (
                            <span className="ml-2 text-muted-foreground/60">
                              Rest: {ex.restSeconds}s
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

        <SheetFooter>
          <Button
            className="w-full"
            size="lg"
            onClick={() => {
              onStart(template);
              onOpenChange(false);
            }}
          >
            <Play className="size-4" />
            Start Workout
          </Button>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                onDuplicate(template);
                onOpenChange(false);
              }}
            >
              <Copy className="size-3.5" />
              Duplicate
            </Button>
            {!template.isBuiltIn && (
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => {
                  onDelete(template);
                  onOpenChange(false);
                }}
              >
                <Trash2 className="size-3.5" />
                Delete
              </Button>
            )}
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
