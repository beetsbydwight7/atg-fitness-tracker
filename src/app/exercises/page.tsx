'use client';

import { useExercises } from '@/lib/hooks/useExercises';
import { ExerciseFilters } from '@/components/exercises/ExerciseFilters';
import { ExerciseCard } from '@/components/exercises/ExerciseCard';
import { CreateExerciseSheet } from '@/components/exercises/CreateExerciseSheet';

export default function ExercisesPage() {
  const {
    exercises,
    isLoading,
    filters,
    setSearchQuery,
    setSelectedCategory,
    setSelectedMuscle,
  } = useExercises();

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b px-4 pt-4 pb-3 space-y-1">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-tight">Exercise Library</h1>
          <CreateExerciseSheet />
        </div>
        <ExerciseFilters
          searchQuery={filters.searchQuery}
          onSearchChange={setSearchQuery}
          selectedCategory={filters.selectedCategory}
          onCategoryChange={setSelectedCategory}
          selectedMuscle={filters.selectedMuscle}
          onMuscleChange={setSelectedMuscle}
        />
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-sm text-muted-foreground">Loading exercises...</p>
          </div>
        ) : exercises.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-muted-foreground">No exercises found.</p>
            <p className="text-xs text-muted-foreground mt-1">
              Try adjusting your search or filters.
            </p>
          </div>
        ) : (
          <>
            <p className="text-xs text-muted-foreground pb-1">
              {exercises.length} exercise{exercises.length !== 1 ? 's' : ''} found
            </p>
            {exercises.map((exercise) => (
              <ExerciseCard key={exercise.id} exercise={exercise} />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
