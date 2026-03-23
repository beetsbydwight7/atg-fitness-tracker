'use client';

import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/database';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Dumbbell,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Template, TemplateExercise } from '@/lib/types';
import type { Exercise } from '@/lib/types';

interface TemplateEditorProps {
  template: Template | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (template: Template) => void;
}

interface EditableExercise extends TemplateExercise {
  _key: string;
}

function generateKey(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function TemplateEditor({
  template,
  open,
  onOpenChange,
  onSave,
}: TemplateEditorProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [difficulty, setDifficulty] = useState(3);
  const [estimatedMinutes, setEstimatedMinutes] = useState(45);
  const [exercises, setExercises] = useState<EditableExercise[]>([]);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [exerciseSearch, setExerciseSearch] = useState('');

  const allExercises = useLiveQuery(() => db.exercises.toArray(), []);

  const filteredPickerExercises =
    allExercises?.filter((ex) => {
      if (!exerciseSearch.trim()) return true;
      const query = exerciseSearch.toLowerCase();
      return (
        ex.name.toLowerCase().includes(query) ||
        ex.aliases.some((a) => a.toLowerCase().includes(query))
      );
    }) ?? [];

  // Reset form when template changes or dialog opens
  useEffect(() => {
    if (open) {
      if (template) {
        setName(template.name);
        setDescription(template.description);
        setCategory(template.category);
        setDifficulty(template.difficulty);
        setEstimatedMinutes(template.estimatedMinutes);
        setExercises(
          template.exercises.map((ex) => ({ ...ex, _key: generateKey() }))
        );
      } else {
        setName('');
        setDescription('');
        setCategory('Custom');
        setDifficulty(3);
        setEstimatedMinutes(45);
        setExercises([]);
      }
      setShowExercisePicker(false);
      setExerciseSearch('');
    }
  }, [open, template]);

  function addExercise(exercise: Exercise) {
    const newEx: EditableExercise = {
      _key: generateKey(),
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      exerciseSlug: exercise.slug,
      order: exercises.length,
      targetSets: exercise.defaultSets,
      targetReps: exercise.defaultReps,
      targetDuration: exercise.defaultDuration,
      restSeconds: 90,
    };
    setExercises((prev) => [...prev, newEx]);
    setShowExercisePicker(false);
    setExerciseSearch('');
  }

  function removeExercise(key: string) {
    setExercises((prev) => {
      const filtered = prev.filter((ex) => ex._key !== key);
      return filtered.map((ex, i) => ({ ...ex, order: i }));
    });
  }

  function moveExercise(key: string, direction: 'up' | 'down') {
    setExercises((prev) => {
      const idx = prev.findIndex((ex) => ex._key === key);
      if (idx === -1) return prev;
      if (direction === 'up' && idx === 0) return prev;
      if (direction === 'down' && idx === prev.length - 1) return prev;

      const next = [...prev];
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
      [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
      return next.map((ex, i) => ({ ...ex, order: i }));
    });
  }

  function updateExerciseField(
    key: string,
    field: 'targetSets' | 'targetReps' | 'targetDuration' | 'restSeconds',
    value: string
  ) {
    const numValue = parseInt(value, 10);
    setExercises((prev) =>
      prev.map((ex) =>
        ex._key === key
          ? { ...ex, [field]: isNaN(numValue) ? null : numValue }
          : ex
      )
    );
  }

  function handleSave() {
    const now = new Date();
    const sanitizedExercises: TemplateExercise[] = exercises.map(
      ({ _key, ...rest }) => rest
    );

    const saved: Template = {
      id: template?.id ?? crypto.randomUUID(),
      name: name.trim() || 'Untitled Template',
      description: description.trim(),
      category: category.trim() || 'Custom',
      difficulty: Math.min(5, Math.max(1, difficulty)),
      estimatedMinutes,
      exercises: sanitizedExercises,
      isBuiltIn: false,
      createdAt: template?.createdAt ?? now,
      updatedAt: now,
    };

    onSave(saved);
    onOpenChange(false);
  }

  const isValid = name.trim().length > 0 && exercises.length > 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[90vh] overflow-y-auto rounded-t-2xl"
      >
        <SheetHeader>
          <SheetTitle>
            {template ? 'Edit Template' : 'Create Template'}
          </SheetTitle>
        </SheetHeader>

        <div className="px-4 space-y-4">
          {/* Basic info */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Name
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Template name"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Description
              </label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  Category
                </label>
                <Input
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. Push"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  Difficulty (1-5)
                </label>
                <Input
                  type="number"
                  min={1}
                  max={5}
                  value={difficulty}
                  onChange={(e) => setDifficulty(parseInt(e.target.value, 10) || 1)}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  Duration (min)
                </label>
                <Input
                  type="number"
                  min={1}
                  value={estimatedMinutes}
                  onChange={(e) =>
                    setEstimatedMinutes(parseInt(e.target.value, 10) || 1)
                  }
                />
              </div>
            </div>
          </div>

          {/* Exercise list */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">
              Exercises ({exercises.length})
            </h3>

            {exercises.length === 0 && (
              <p className="text-xs text-muted-foreground py-4 text-center">
                No exercises added yet. Tap the button below to add one.
              </p>
            )}

            <div className="space-y-2">
              {exercises.map((ex, idx) => (
                <div
                  key={ex._key}
                  className="rounded-lg border p-3 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="flex items-center justify-center size-5 rounded-full bg-muted text-[10px] font-medium shrink-0">
                        {idx + 1}
                      </span>
                      <span className="text-sm font-medium truncate">
                        {ex.exerciseName}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        disabled={idx === 0}
                        onClick={() => moveExercise(ex._key, 'up')}
                      >
                        <ChevronUp className="size-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        disabled={idx === exercises.length - 1}
                        onClick={() => moveExercise(ex._key, 'down')}
                      >
                        <ChevronDown className="size-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => removeExercise(ex._key)}
                      >
                        <Trash2 className="size-3 text-destructive" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] text-muted-foreground">
                        Sets
                      </label>
                      <Input
                        type="number"
                        min={1}
                        value={ex.targetSets}
                        onChange={(e) =>
                          updateExerciseField(
                            ex._key,
                            'targetSets',
                            e.target.value
                          )
                        }
                        className="h-7 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground">
                        {ex.targetDuration != null ? 'Duration (s)' : 'Reps'}
                      </label>
                      <Input
                        type="number"
                        min={1}
                        value={
                          ex.targetDuration != null
                            ? ex.targetDuration ?? ''
                            : ex.targetReps ?? ''
                        }
                        onChange={(e) =>
                          updateExerciseField(
                            ex._key,
                            ex.targetDuration != null
                              ? 'targetDuration'
                              : 'targetReps',
                            e.target.value
                          )
                        }
                        className="h-7 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground">
                        Rest (s)
                      </label>
                      <Input
                        type="number"
                        min={0}
                        value={ex.restSeconds}
                        onChange={(e) =>
                          updateExerciseField(
                            ex._key,
                            'restSeconds',
                            e.target.value
                          )
                        }
                        className="h-7 text-xs"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Add exercise */}
            {showExercisePicker ? (
              <div className="rounded-lg border p-3 space-y-2">
                <Input
                  value={exerciseSearch}
                  onChange={(e) => setExerciseSearch(e.target.value)}
                  placeholder="Search exercises..."
                  autoFocus
                />
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {filteredPickerExercises.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-2">
                      No exercises found.
                    </p>
                  ) : (
                    filteredPickerExercises.slice(0, 20).map((ex) => (
                      <button
                        key={ex.id}
                        type="button"
                        className={cn(
                          'flex items-center gap-2 w-full rounded-md px-2 py-1.5 text-left text-sm',
                          'hover:bg-muted transition-colors'
                        )}
                        onClick={() => addExercise(ex)}
                      >
                        <Dumbbell className="size-3.5 text-muted-foreground shrink-0" />
                        <span className="truncate">{ex.name}</span>
                      </button>
                    ))
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    setShowExercisePicker(false);
                    setExerciseSearch('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setShowExercisePicker(true)}
              >
                <Plus className="size-3.5" />
                Add Exercise
              </Button>
            )}
          </div>
        </div>

        <SheetFooter>
          <Button
            className="w-full"
            size="lg"
            disabled={!isValid}
            onClick={handleSave}
          >
            {template ? 'Save Changes' : 'Create Template'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
