'use client';

import { Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PRBadgeProps {
  className?: string;
}

export function PRBadge({ className }: PRBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 rounded-full bg-yellow-500/20 px-1.5 py-0.5 text-[10px] font-bold text-yellow-600 dark:text-yellow-400 animate-pr-pop',
        className
      )}
    >
      <Trophy className="size-3" />
      PR
      <style jsx>{`
        @keyframes pr-pop {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          60% {
            transform: scale(1.3);
            opacity: 1;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-pr-pop {
          animation: pr-pop 0.4s ease-out;
        }
      `}</style>
    </span>
  );
}
