'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import Link from 'next/link';
import {
  Dumbbell,
  BookOpen,
  Calendar,
  LayoutTemplate,
  Scale,
} from 'lucide-react';
import { db } from '@/lib/db/database';
import { Button } from '@/components/ui/button';
import TodayCard from '@/components/dashboard/TodayCard';
import WeeklySummary from '@/components/dashboard/WeeklySummary';
import RecentPRs from '@/components/dashboard/RecentPRs';
import StreakBadge from '@/components/dashboard/StreakBadge';

const quickLinks = [
  { label: 'Templates', href: '/templates', icon: LayoutTemplate },
  { label: 'Exercises', href: '/exercises', icon: Dumbbell },
  { label: 'History', href: '/history', icon: Calendar },
  { label: 'Progress', href: '/progress', icon: BookOpen },
  { label: 'Body Wt', href: '/bodyweight', icon: Scale },
] as const;

export default function DashboardPage() {
  const settings = useLiveQuery(() => db.settings.get('default'), []);
  const weightUnit = settings?.weightUnit ?? 'lbs';

  return (
    <div className="flex flex-col gap-4 px-4 pb-8 pt-6">
      <h1 className="text-2xl font-bold tracking-tight">ATG Fitness</h1>

      <TodayCard weightUnit={weightUnit} />

      {/* Quick access buttons */}
      <div className="grid grid-cols-5 gap-2">
        {quickLinks.map(({ label, href, icon: Icon }) => (
          <Link key={href} href={href}>
            <Button
              variant="outline"
              className="flex h-auto w-full flex-col gap-1.5 py-3"
            >
              <Icon className="size-5" />
              <span className="text-[11px]">{label}</span>
            </Button>
          </Link>
        ))}
      </div>

      <WeeklySummary weightUnit={weightUnit} />

      <StreakBadge />

      <RecentPRs />
    </div>
  );
}
