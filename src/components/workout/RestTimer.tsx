'use client';

import { Play, Pause, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatTimer } from '@/lib/utils/dateUtils';
import { cn } from '@/lib/utils';

interface RestTimerProps {
  secondsRemaining: number;
  totalSeconds: number;
  isRunning: boolean;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
  onAdjust: (delta: number) => void;
}

export function RestTimer({
  secondsRemaining,
  totalSeconds,
  isRunning,
  onPause,
  onResume,
  onReset,
  onAdjust,
}: RestTimerProps) {
  if (totalSeconds === 0 && secondsRemaining === 0) return null;

  const progress = totalSeconds > 0 ? secondsRemaining / totalSeconds : 0;
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress);

  return (
    <div className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2">
      <div
        className={cn(
          'flex items-center gap-3 rounded-2xl border bg-background/95 px-4 py-3 shadow-lg backdrop-blur-sm',
          secondsRemaining === 0 && 'border-green-500/50 bg-green-500/10'
        )}
      >
        {/* Circular progress */}
        <div className="relative flex items-center justify-center">
          <svg width="56" height="56" className="-rotate-90">
            <circle
              cx="28"
              cy="28"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              className="text-muted/30"
            />
            <circle
              cx="28"
              cy="28"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className={cn(
                'transition-[stroke-dashoffset] duration-1000 ease-linear',
                secondsRemaining === 0 ? 'text-green-500' : 'text-primary'
              )}
            />
          </svg>
          <span className="absolute text-sm font-bold tabular-nums">
            {formatTimer(secondsRemaining)}
          </span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="xs" onClick={() => onAdjust(-30)}>
            -30s
          </Button>

          {isRunning ? (
            <Button variant="outline" size="icon-sm" onClick={onPause}>
              <Pause className="size-4" />
            </Button>
          ) : (
            <Button variant="outline" size="icon-sm" onClick={onResume}>
              <Play className="size-4" />
            </Button>
          )}

          <Button variant="outline" size="xs" onClick={() => onAdjust(30)}>
            +30s
          </Button>

          <Button variant="ghost" size="icon-sm" onClick={onReset}>
            <RotateCcw className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
