'use client';

import { useRef } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { ExerciseCategory, MuscleGroup } from '@/lib/types/exercise';

const CATEGORIES: { value: ExerciseCategory | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'ATG_FOUNDATIONAL', label: 'ATG Foundational' },
  { value: 'ATG_MOBILITY', label: 'ATG Mobility' },
  { value: 'ATG_STRENGTH', label: 'ATG Strength' },
  { value: 'TRADITIONAL_LOWER', label: 'Traditional Lower' },
  { value: 'TRADITIONAL_UPPER', label: 'Traditional Upper' },
  { value: 'SLED', label: 'Sled' },
  { value: 'GYMNASTICS', label: 'Gymnastics' },
];

const MUSCLE_GROUPS: { value: MuscleGroup; label: string }[] = [
  { value: 'tibialis_anterior', label: 'Tibialis Anterior' },
  { value: 'calves', label: 'Calves' },
  { value: 'quads', label: 'Quads' },
  { value: 'hamstrings', label: 'Hamstrings' },
  { value: 'glutes', label: 'Glutes' },
  { value: 'hip_flexors', label: 'Hip Flexors' },
  { value: 'adductors', label: 'Adductors' },
  { value: 'abductors', label: 'Abductors' },
  { value: 'lower_back', label: 'Lower Back' },
  { value: 'upper_back', label: 'Upper Back' },
  { value: 'lats', label: 'Lats' },
  { value: 'traps', label: 'Traps' },
  { value: 'chest', label: 'Chest' },
  { value: 'shoulders', label: 'Shoulders' },
  { value: 'biceps', label: 'Biceps' },
  { value: 'triceps', label: 'Triceps' },
  { value: 'forearms', label: 'Forearms' },
  { value: 'core', label: 'Core' },
  { value: 'neck', label: 'Neck' },
  { value: 'full_body', label: 'Full Body' },
];

interface ExerciseFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: ExerciseCategory | null;
  onCategoryChange: (category: ExerciseCategory | null) => void;
  selectedMuscle: MuscleGroup | null;
  onMuscleChange: (muscle: MuscleGroup | null) => void;
}

export function ExerciseFilters({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedMuscle,
  onMuscleChange,
}: ExerciseFiltersProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className="space-y-3">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        <Input
          type="text"
          placeholder="Search exercises..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-8"
        />
      </div>

      {/* Category filter - horizontal scroll */}
      <div
        ref={scrollRef}
        className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none -mx-4 px-4"
      >
        {CATEGORIES.map((cat) => {
          const isActive =
            cat.value === 'ALL'
              ? selectedCategory === null
              : selectedCategory === cat.value;
          return (
            <button
              key={cat.value}
              onClick={() =>
                onCategoryChange(cat.value === 'ALL' ? null : (cat.value as ExerciseCategory))
              }
              className="shrink-0"
            >
              <Badge
                variant={isActive ? 'default' : 'outline'}
                className={cn(
                  'cursor-pointer text-xs whitespace-nowrap transition-colors',
                  isActive && 'ring-1 ring-primary/50'
                )}
              >
                {cat.label}
              </Badge>
            </button>
          );
        })}
      </div>

      {/* Muscle group filter */}
      <Select
        value={selectedMuscle ?? ''}
        onValueChange={(val) =>
          onMuscleChange(val === '' ? null : (val as MuscleGroup))
        }
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="All muscle groups" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All muscle groups</SelectItem>
          {MUSCLE_GROUPS.map((mg) => (
            <SelectItem key={mg.value} value={mg.value}>
              {mg.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
