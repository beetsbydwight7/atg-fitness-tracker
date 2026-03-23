'use client';

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { v4 as uuid } from 'uuid';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { db } from '@/lib/db/database';
import { displayWeight, parseWeightToKg } from '@/lib/utils/formatWeight';

export default function BodyWeightPage() {
  const settings = useLiveQuery(() => db.settings.get('default'), []);
  const logs = useLiveQuery(() => db.bodyWeightLogs.orderBy('date').toArray(), []);
  const weightUnit = settings?.weightUnit ?? 'lbs';

  const today = new Date().toISOString().slice(0, 10);
  const [dateInput, setDateInput] = useState(today);
  const [weightInput, setWeightInput] = useState('');
  const [notesInput, setNotesInput] = useState('');
  const [error, setError] = useState('');

  async function handleAdd() {
    const w = parseFloat(weightInput);
    if (!weightInput || isNaN(w) || w <= 0) {
      setError('Enter a valid weight.');
      return;
    }
    await db.bodyWeightLogs.put({
      id: uuid(),
      date: dateInput,
      weight: parseWeightToKg(w, weightUnit),
      notes: notesInput.trim(),
    });
    setWeightInput('');
    setNotesInput('');
    setError('');
  }

  async function handleDelete(id: string) {
    await db.bodyWeightLogs.delete(id);
  }

  const chartData = (logs ?? []).map((l) => ({
    date: l.date.slice(5), // MM-DD
    weight:
      weightUnit === 'lbs'
        ? Math.round(displayWeight(l.weight, 'lbs') * 10) / 10
        : Math.round(l.weight * 10) / 10,
  }));

  const latest = logs && logs.length > 0 ? logs[logs.length - 1] : null;
  const latestDisplay = latest
    ? `${displayWeight(latest.weight, weightUnit)} ${weightUnit}`
    : null;

  return (
    <div className="mx-auto max-w-lg px-4 py-6 pb-24">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Body Weight</h1>
          {latestDisplay && (
            <p className="text-sm text-muted-foreground">Latest: {latestDisplay} on {latest!.date}</p>
          )}
        </div>
      </div>

      {/* Chart */}
      {chartData.length >= 2 && (
        <Card className="mb-5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Trend ({weightUnit})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} className="fill-muted-foreground" />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} domain={['dataMin - 2', 'dataMax + 2']} className="fill-muted-foreground" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                    }}
                    formatter={(v) => [`${v} ${weightUnit}`, 'Weight']}
                  />
                  <Line type="monotone" dataKey="weight" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Log new entry */}
      <Card className="mb-5">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Log Weight</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              type="date"
              value={dateInput}
              onChange={(e) => setDateInput(e.target.value)}
              className="flex-1"
            />
            <Input
              inputMode="decimal"
              placeholder={weightUnit}
              value={weightInput}
              onChange={(e) => { setWeightInput(e.target.value); setError(''); }}
              className="w-28"
            />
          </div>
          <Input
            placeholder="Notes (optional)"
            value={notesInput}
            onChange={(e) => setNotesInput(e.target.value)}
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
          <Button className="w-full gap-1.5" onClick={handleAdd}>
            <Plus className="size-4" />
            Add Entry
          </Button>
        </CardContent>
      </Card>

      {/* Log history */}
      {logs && logs.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">History</h2>
          {[...logs].reverse().map((log) => (
            <div key={log.id} className="flex items-center justify-between rounded-lg border bg-card px-4 py-2.5">
              <div>
                <p className="text-sm font-medium">
                  {displayWeight(log.weight, weightUnit)} {weightUnit}
                </p>
                <p className="text-xs text-muted-foreground">{log.date}{log.notes ? ` · ${log.notes}` : ''}</p>
              </div>
              <Button
                variant="ghost"
                size="icon-xs"
                className="text-muted-foreground hover:text-destructive"
                onClick={() => handleDelete(log.id)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {(!logs || logs.length === 0) && (
        <div className="py-12 text-center text-sm text-muted-foreground">
          No entries yet. Log your first weight above.
        </div>
      )}
    </div>
  );
}
