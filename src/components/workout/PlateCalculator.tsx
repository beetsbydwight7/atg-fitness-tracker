'use client';

import { useState, useMemo } from 'react';
import { Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

const PLATES_KG = [25, 20, 15, 10, 5, 2.5, 1.25];
const PLATES_LBS = [45, 35, 25, 10, 5, 2.5];
const BAR_KG = 20;
const BAR_LBS = 45;

function calcPlates(target: number, unit: 'kg' | 'lbs') {
  const bar = unit === 'kg' ? BAR_KG : BAR_LBS;
  const plates = unit === 'kg' ? PLATES_KG : PLATES_LBS;
  const sideWeight = (target - bar) / 2;
  if (sideWeight <= 0) return { perSide: [] as { plate: number; count: number }[], achievable: Math.min(target, bar), remainder: 0 };

  let rem = sideWeight;
  const perSide: { plate: number; count: number }[] = [];
  for (const p of plates) {
    if (rem >= p) {
      const n = Math.floor(rem / p);
      perSide.push({ plate: p, count: n });
      rem = Math.round((rem - n * p) * 1000) / 1000;
    }
  }
  const achievable = bar + perSide.reduce((s, r) => s + r.plate * r.count * 2, 0);
  return { perSide, achievable, remainder: Math.round(rem * 1000) / 1000 };
}

function plateStyle(plate: number, unit: 'kg' | 'lbs') {
  if (unit === 'kg') {
    if (plate === 25) return 'bg-red-500 text-white';
    if (plate === 20) return 'bg-blue-500 text-white';
    if (plate === 15) return 'bg-yellow-400 text-black';
    if (plate === 10) return 'bg-green-500 text-white';
    if (plate === 5) return 'bg-zinc-100 border border-border text-black';
    return 'bg-zinc-300 text-black';
  }
  if (plate === 45) return 'bg-blue-500 text-white';
  if (plate === 35) return 'bg-green-500 text-white';
  if (plate === 25) return 'bg-red-500 text-white';
  if (plate === 10) return 'bg-zinc-800 text-white';
  if (plate === 5) return 'bg-zinc-100 border border-border text-black';
  return 'bg-zinc-300 text-black';
}

interface PlateCalculatorProps {
  weightUnit: 'kg' | 'lbs';
  initialWeight?: number | null;
}

export function PlateCalculator({ weightUnit, initialWeight }: PlateCalculatorProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState(initialWeight != null ? String(initialWeight) : '');
  const target = parseFloat(input) || 0;
  const bar = weightUnit === 'kg' ? BAR_KG : BAR_LBS;
  const { perSide, achievable, remainder } = useMemo(() => calcPlates(target, weightUnit), [target, weightUnit]);

  return (
    <>
      <Button variant="ghost" size="icon-xs" title="Plate calculator" onClick={() => setOpen(true)}>
        <Calculator className="size-3.5" />
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>Plate Calculator</SheetTitle>
        </SheetHeader>

        <div className="space-y-5 px-4 pb-8">
          <div className="flex items-center gap-3">
            <label className="shrink-0 text-sm font-medium">
              Target ({weightUnit})
            </label>
            <Input
              inputMode="decimal"
              placeholder="e.g. 100"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1"
              autoFocus
            />
          </div>

          {target > 0 && (
            <>
              <div className="flex items-center gap-3">
                <span className="w-16 shrink-0 text-xs text-muted-foreground">Bar</span>
                <div className="rounded bg-zinc-400 px-3 py-1 text-xs font-medium text-white">
                  {bar} {weightUnit}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-16 shrink-0 pt-1 text-xs text-muted-foreground">Per side</span>
                {perSide.length === 0 ? (
                  <span className="text-sm text-muted-foreground">Bar only</span>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {perSide.flatMap((r) =>
                      Array.from({ length: r.count }, (_, i) => (
                        <div
                          key={`${r.plate}-${i}`}
                          className={cn('rounded px-2.5 py-1 text-xs font-semibold', plateStyle(r.plate, weightUnit))}
                        >
                          {r.plate}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              <div className="rounded-lg bg-muted/50 px-4 py-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Loadable</span>
                  <span className="font-semibold">{achievable} {weightUnit}</span>
                </div>
                {remainder > 0 && (
                  <div className="mt-1 flex justify-between">
                    <span className="text-muted-foreground">Can&apos;t load</span>
                    <span className="font-medium text-amber-500">{remainder} {weightUnit}</span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
    </>
  );
}
