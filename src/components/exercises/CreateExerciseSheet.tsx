'use client';

import { useState } from 'react';
import { v4 as uuid } from 'uuid';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import { db } from '@/lib/db/database';
import type { Exercise, ExerciseCategory, SetType } from '@/lib/types';

const CATEGORIES: { label: string; value: ExerciseCategory }[] = [
  { label: 'ATG Foundational', value: 'ATG_FOUNDATIONAL' },
  { label: 'ATG Mobility', value: 'ATG_MOBILITY' },
  { label: 'ATG Strength', value: 'ATG_STRENGTH' },
  { label: 'Traditional Lower', value: 'TRADITIONAL_LOWER' },
  { label: 'Traditional Upper', value: 'TRADITIONAL_UPPER' },
  { label: 'Sled', value: 'SLED' },
  { label: 'Gymnastics', value: 'GYMNASTICS' },
];

const SET_TYPES: { label: string; value: SetType }[] = [
  { label: 'Weight + Reps', value: 'reps' },
  { label: 'Bodyweight Reps', value: 'bodyweight_reps' },
  { label: 'Duration (seconds)', value: 'duration' },
  { label: 'Distance (meters)', value: 'distance' },
];

interface CreateExerciseSheetProps {
  onCreated?: (exercise: Exercise) => void;
}

export function CreateExerciseSheet({ onCreated }: CreateExerciseSheetProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ExerciseCategory>('TRADITIONAL_UPPER');
  const [setType, setSetType] = useState<SetType>('reps');
  const [defaultSets, setDefaultSets] = useState('3');
  const [defaultReps, setDefaultReps] = useState('10');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function reset() {
    setName('');
    setCategory('TRADITIONAL_UPPER');
    setSetType('reps');
    setDefaultSets('3');
    setDefaultReps('10');
    setDescription('');
    setError('');
  }

  async function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Name is required.');
      return;
    }
    setSaving(true);
    try {
      const slug = trimmed.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const exercise: Exercise = {
        id: uuid(),
        slug: `custom-${slug}-${Date.now()}`,
        name: trimmed,
        aliases: [],
        category,
        primaryMuscles: [],
        secondaryMuscles: [],
        equipment: [],
        setType,
        description: description.trim(),
        cues: [],
        progressions: [],
        isATGSignature: false,
        defaultSets: parseInt(defaultSets) || 3,
        defaultReps: setType === 'reps' || setType === 'bodyweight_reps' ? (parseInt(defaultReps) || 10) : null,
        defaultDuration: setType === 'duration' ? (parseInt(defaultReps) || 30) : null,
        isCustom: true,
      };
      await db.exercises.put(exercise);
      onCreated?.(exercise);
      reset();
      setOpen(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Button size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
        <Plus className="size-3.5" />
        New Exercise
      </Button>
      <Sheet open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>Create Custom Exercise</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 px-4 pb-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Name *</label>
            <Input
              placeholder="e.g. Reverse Nordic Curl"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(''); }}
              autoFocus
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Category</label>
            <Select value={category} onValueChange={(v) => setCategory(v as ExerciseCategory)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Set Type</label>
            <Select value={setType} onValueChange={(v) => setSetType(v as SetType)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SET_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3">
            <div className="flex-1 space-y-1.5">
              <label className="text-sm font-medium">Default Sets</label>
              <Input
                inputMode="numeric"
                value={defaultSets}
                onChange={(e) => setDefaultSets(e.target.value)}
              />
            </div>
            <div className="flex-1 space-y-1.5">
              <label className="text-sm font-medium">
                {setType === 'duration' ? 'Default Duration (s)' : 'Default Reps'}
              </label>
              <Input
                inputMode="numeric"
                value={defaultReps}
                onChange={(e) => setDefaultReps(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Description (optional)</label>
            <Input
              placeholder="Brief description…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        <SheetFooter className="px-4">
          <Button className="w-full" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Create Exercise'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
    </>
  );
}
