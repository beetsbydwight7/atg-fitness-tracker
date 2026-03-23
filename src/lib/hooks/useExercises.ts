'use client';

import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/database';
import type { Exercise, ExerciseCategory, MuscleGroup } from '@/lib/types/exercise';

interface ExerciseFilters {
  searchQuery: string;
  selectedCategory: ExerciseCategory | null;
  selectedMuscle: MuscleGroup | null;
}

function fuzzyMatch(text: string, query: string): boolean {
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const terms = lowerQuery.split(/\s+/).filter(Boolean);
  return terms.every((term) => lowerText.includes(term));
}

export function useExercises() {
  const [filters, setFilters] = useState<ExerciseFilters>({
    searchQuery: '',
    selectedCategory: null,
    selectedMuscle: null,
  });

  const allExercises = useLiveQuery(() => db.exercises.toArray(), []);

  const filteredExercises = useMemo(() => {
    if (!allExercises) return [];

    let results = allExercises;

    if (filters.selectedCategory) {
      results = results.filter((ex) => ex.category === filters.selectedCategory);
    }

    if (filters.selectedMuscle) {
      results = results.filter(
        (ex) =>
          ex.primaryMuscles.includes(filters.selectedMuscle!) ||
          ex.secondaryMuscles.includes(filters.selectedMuscle!)
      );
    }

    if (filters.searchQuery.trim()) {
      const query = filters.searchQuery.trim();
      results = results.filter((ex) => {
        if (fuzzyMatch(ex.name, query)) return true;
        if (ex.aliases.some((alias) => fuzzyMatch(alias, query))) return true;
        return false;
      });
    }

    return results.sort((a, b) => a.name.localeCompare(b.name));
  }, [allExercises, filters]);

  function setSearchQuery(searchQuery: string) {
    setFilters((prev) => ({ ...prev, searchQuery }));
  }

  function setSelectedCategory(selectedCategory: ExerciseCategory | null) {
    setFilters((prev) => ({ ...prev, selectedCategory }));
  }

  function setSelectedMuscle(selectedMuscle: MuscleGroup | null) {
    setFilters((prev) => ({ ...prev, selectedMuscle }));
  }

  return {
    exercises: filteredExercises,
    isLoading: allExercises === undefined,
    filters,
    setSearchQuery,
    setSelectedCategory,
    setSelectedMuscle,
  };
}
