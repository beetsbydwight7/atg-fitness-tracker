'use client';

import { useState } from 'react';
import { Trophy, TrendingUp, Calendar, Dumbbell } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/database';
import { cn } from '@/lib/utils';
import { formatWeight, displayWeight } from '@/lib/utils/formatWeight';
import { useProgress } from '@/lib/hooks/useProgress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { VolumeChart } from '@/components/progress/VolumeChart';
import { FrequencyHeatmap } from '@/components/progress/FrequencyHeatmap';
import { StrengthChart } from '@/components/progress/StrengthChart';
import { PRHistory } from '@/components/progress/PRHistory';

export default function ProgressPage() {
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>('');

  const settings = useLiveQuery(() => db.settings.get('default'), []);
  const weightUnit = settings?.weightUnit ?? 'lbs';

  const {
    summaries,
    weeklyVolume,
    weeklyFrequency,
    exerciseE1RMTrend,
    bestSets,
    prCount,
    exercises,
    isLoading,
  } = useProgress(selectedExerciseId || undefined);

  const selectedExercise = exercises.find((e) => e.id === selectedExerciseId);

  // Get exercises that have been used in workouts for the selector
  const usedExerciseIds = new Set(summaries.flatMap((s) => s.exerciseIds));
  const usedExercises = exercises
    .filter((e) => usedExerciseIds.has(e.id))
    .sort((a, b) => a.name.localeCompare(b.name));

  const totalVolume = weeklyVolume.reduce((sum, w) => sum + w.volume, 0);
  const totalWorkouts = weeklyFrequency.reduce((sum, w) => sum + w.workouts, 0);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading progress...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 pb-24">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Progress</h1>
        <p className="text-sm text-muted-foreground">
          Track your training volume, frequency, and personal records.
        </p>
      </div>

      <Tabs defaultValue={0}>
        <TabsList className="w-full">
          <TabsTrigger value={0}>Overview</TabsTrigger>
          <TabsTrigger value={1}>By Exercise</TabsTrigger>
          <TabsTrigger value={2}>PRs</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value={0}>
          <div className="mt-4 space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-3">
              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <Dumbbell className="size-4 text-primary" />
                    <span className="text-xs text-muted-foreground">Workouts</span>
                  </div>
                  <p className="mt-1 text-xl font-bold">{totalWorkouts}</p>
                  <p className="text-[10px] text-muted-foreground">Last 12 weeks</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="size-4 text-primary" />
                    <span className="text-xs text-muted-foreground">Volume</span>
                  </div>
                  <p className="mt-1 text-xl font-bold">
                    {totalVolume >= 1000
                      ? `${(
                          (weightUnit === 'lbs'
                            ? displayWeight(totalVolume, 'lbs')
                            : totalVolume) / 1000
                        ).toFixed(0)}k`
                      : Math.round(
                          weightUnit === 'lbs'
                            ? displayWeight(totalVolume, 'lbs')
                            : totalVolume
                        )}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{weightUnit}, 12 wks</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <Trophy className="size-4 text-amber-500" />
                    <span className="text-xs text-muted-foreground">PRs</span>
                  </div>
                  <p className="mt-1 text-xl font-bold">{prCount}</p>
                  <p className="text-[10px] text-muted-foreground">All time</p>
                </CardContent>
              </Card>
            </div>

            {/* Frequency Heatmap */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Calendar className="size-4" />
                  Training Frequency
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FrequencyHeatmap summaries={summaries} />
              </CardContent>
            </Card>

            {/* Volume Chart */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="size-4" />
                  Weekly Volume
                </CardTitle>
              </CardHeader>
              <CardContent>
                <VolumeChart data={weeklyVolume} weightUnit={weightUnit} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* By Exercise Tab */}
        <TabsContent value={1}>
          <div className="mt-4 space-y-4">
            {/* Exercise Selector */}
            <Card>
              <CardContent className="p-4">
                <label className="mb-2 block text-sm font-medium">
                  Select Exercise
                </label>
                {usedExercises.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Complete some workouts to see exercise-specific data.
                  </p>
                ) : (
                  <Select
                    value={selectedExerciseId}
                    onValueChange={(val) => setSelectedExerciseId(val as string)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose an exercise..." />
                    </SelectTrigger>
                    <SelectContent>
                      {usedExercises.map((exercise) => (
                        <SelectItem key={exercise.id} value={exercise.id}>
                          {exercise.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </CardContent>
            </Card>

            {selectedExerciseId && selectedExercise && (
              <>
                {/* Strength Chart */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <TrendingUp className="size-4" />
                      Estimated 1RM Trend
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <StrengthChart
                      data={exerciseE1RMTrend}
                      exerciseName={selectedExercise.name}
                      weightUnit={weightUnit}
                    />
                  </CardContent>
                </Card>

                {/* Best Sets Table */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Dumbbell className="size-4" />
                      Top Sets
                      <Badge variant="secondary" className="ml-auto text-xs">
                        By Est. 1RM
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {bestSets.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No completed sets for this exercise yet.
                      </p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-border text-left text-xs text-muted-foreground">
                              <th className="pb-2 pr-3 font-medium">Date</th>
                              <th className="pb-2 pr-3 font-medium">Weight</th>
                              <th className="pb-2 pr-3 font-medium">Reps</th>
                              <th className="pb-2 pr-3 font-medium">Volume</th>
                              <th className="pb-2 font-medium">Est. 1RM</th>
                            </tr>
                          </thead>
                          <tbody>
                            {bestSets.map((set, i) => (
                              <tr
                                key={i}
                                className="border-b border-border/50 last:border-0"
                              >
                                <td className="py-2 pr-3 text-muted-foreground">
                                  {set.date}
                                </td>
                                <td className="py-2 pr-3">
                                  {formatWeight(set.weight, weightUnit)}
                                </td>
                                <td className="py-2 pr-3">{set.reps}</td>
                                <td className="py-2 pr-3">
                                  {formatWeight(set.volume, weightUnit)}
                                </td>
                                <td className="py-2 font-medium">
                                  {formatWeight(set.e1rm, weightUnit)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </TabsContent>

        {/* PRs Tab */}
        <TabsContent value={2}>
          <div className="mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Trophy className="size-4 text-amber-500" />
                  Personal Records
                  {prCount > 0 && (
                    <Badge variant="secondary" className="ml-auto">
                      {prCount} total
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PRHistory />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
