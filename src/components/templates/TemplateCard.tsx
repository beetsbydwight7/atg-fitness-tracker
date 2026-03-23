'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Play, Edit, Clock, Star, Dumbbell } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Template } from '@/lib/types';

interface TemplateCardProps {
  template: Template;
  onStart: (template: Template) => void;
  onEdit?: (template: Template) => void;
  onClick?: (template: Template) => void;
}

function DifficultyDots({ level }: { level: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={cn(
            'size-3',
            i < level
              ? 'fill-yellow-500 text-yellow-500'
              : 'fill-none text-muted-foreground/40'
          )}
        />
      ))}
    </div>
  );
}

export function TemplateCard({
  template,
  onStart,
  onEdit,
  onClick,
}: TemplateCardProps) {
  return (
    <Card
      className={cn(
        'cursor-pointer transition-colors hover:bg-muted/50',
        'min-w-[260px] sm:min-w-0'
      )}
      onClick={() => onClick?.(template)}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="leading-tight">{template.name}</CardTitle>
          <Badge variant="secondary" className="shrink-0 text-[10px]">
            {template.category}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground line-clamp-2">
          {template.description}
        </p>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <DifficultyDots level={template.difficulty} />
          <span className="flex items-center gap-1">
            <Clock className="size-3" />
            {template.estimatedMinutes}m
          </span>
          <span className="flex items-center gap-1">
            <Dumbbell className="size-3" />
            {template.exercises.length}
          </span>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <Button
            size="sm"
            className="flex-1"
            onClick={(e) => {
              e.stopPropagation();
              onStart(template);
            }}
          >
            <Play className="size-3.5" />
            Start Workout
          </Button>
          {onEdit && !template.isBuiltIn && (
            <Button
              size="icon-sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(template);
              }}
            >
              <Edit className="size-3.5" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
