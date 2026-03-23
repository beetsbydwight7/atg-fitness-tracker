'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/database';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Download, Upload, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function SettingsPage() {
  const settings = useLiveQuery(() => db.settings.get('default'));
  const [importStatus, setImportStatus] = useState<string>('');

  if (!settings) return null;

  async function updateSetting(key: string, value: string | number | null) {
    await db.settings.update('default', { [key]: value });
  }

  async function exportData() {
    const data = {
      exercises: await db.exercises.where('isCustom').equals(1).toArray(),
      workouts: await db.workouts.toArray(),
      workoutSummaries: await db.workoutSummaries.toArray(),
      templates: await db.templates.where('isBuiltIn').equals(0).toArray(),
      prs: await db.prs.toArray(),
      settings: await db.settings.toArray(),
      exportedAt: new Date().toISOString(),
      version: 1,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `atg-fitness-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function exportCSV() {
    const workouts = await db.workouts.where('isComplete').equals(1).toArray();
    const rows: string[] = [
      ['Date', 'Workout', 'Exercise', 'Set #', 'Weight (kg)', 'Reps', 'Duration (s)', 'Distance (m)', 'RPE', 'RIR', 'Notes', 'PR'].join(','),
    ];
    for (const w of workouts) {
      const date = w.completedAt ? new Date(w.completedAt).toISOString().slice(0, 10) : '';
      for (const ex of w.exercises) {
        for (const s of ex.sets) {
          if (s.status !== 'completed') continue;
          rows.push([
            date,
            `"${w.name.replace(/"/g, '""')}"`,
            `"${ex.exerciseName.replace(/"/g, '""')}"`,
            s.setNumber,
            s.weight ?? '',
            s.reps ?? '',
            s.duration ?? '',
            s.distance ?? '',
            s.rpe ?? '',
            s.rir ?? '',
            `"${(s.notes ?? '').replace(/"/g, '""')}"`,
            s.isPR ? 'Yes' : '',
          ].join(','));
        }
      }
    }
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `atg-fitness-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function importData(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!data.version) throw new Error('Invalid export file');

      if (data.workouts?.length) await db.workouts.bulkPut(data.workouts);
      if (data.workoutSummaries?.length) await db.workoutSummaries.bulkPut(data.workoutSummaries);
      if (data.prs?.length) await db.prs.bulkPut(data.prs);
      if (data.exercises?.length) await db.exercises.bulkPut(data.exercises);
      if (data.templates?.length) await db.templates.bulkPut(data.templates);
      if (data.settings?.length) await db.settings.bulkPut(data.settings);

      setImportStatus(`Imported successfully!`);
    } catch (err) {
      setImportStatus(`Import failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
    e.target.value = '';
  }

  async function clearAllData() {
    if (!confirm('Are you sure? This will delete ALL your workout data, PRs, and custom exercises. This cannot be undone.')) return;
    await db.workouts.clear();
    await db.workoutSummaries.clear();
    await db.prs.clear();
    await db.exercises.where('isCustom').equals(1).delete();
    await db.templates.where('isBuiltIn').equals(0).delete();
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Weight Unit</label>
              <Select
                value={settings.weightUnit}
                onValueChange={(v) => updateSetting('weightUnit', v)}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lbs">lbs</SelectItem>
                  <SelectItem value="kg">kg</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Default Rest (seconds)</label>
              <Input
                type="number"
                className="w-24"
                value={settings.defaultRestSeconds}
                onChange={(e) => updateSetting('defaultRestSeconds', parseInt(e.target.value) || 90)}
                inputMode="numeric"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Data</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start gap-2" onClick={exportData}>
              <Download className="h-4 w-4" />
              Export Data (JSON)
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2" onClick={exportCSV}>
              <Download className="h-4 w-4" />
              Export Workouts (CSV)
            </Button>
            <div>
              <label className="cursor-pointer">
                <div className="inline-flex h-9 w-full items-center justify-start gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-xs hover:bg-accent hover:text-accent-foreground">
                  <Upload className="h-4 w-4" />
                  Import Data
                </div>
                <input type="file" accept=".json" className="hidden" onChange={importData} />
              </label>
              {importStatus && (
                <p className="mt-2 text-sm text-muted-foreground">{importStatus}</p>
              )}
            </div>
            <Button
              variant="destructive"
              className="w-full justify-start gap-2"
              onClick={clearAllData}
            >
              <Trash2 className="h-4 w-4" />
              Clear All Data
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
