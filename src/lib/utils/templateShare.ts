import type { Template, TemplateExercise } from '@/lib/types/template';

// Minimal payload — strip runtime-only fields before encoding.
interface SharePayload {
  n: string;           // name
  d: string;           // description
  c: string;           // category
  m: number;           // estimatedMinutes
  v: number;           // difficulty
  e: {
    id: string;        // exerciseId
    nm: string;        // exerciseName
    sl: string;        // exerciseSlug
    o: number;         // order
    s: number;         // targetSets
    r: number | null;  // targetReps
    du: number | null; // targetDuration
    rs: number;        // restSeconds
  }[];
}

export function encodeTemplateForSharing(template: Template): string {
  const payload: SharePayload = {
    n: template.name,
    d: template.description,
    c: template.category,
    m: template.estimatedMinutes,
    v: template.difficulty,
    e: template.exercises.map((ex) => ({
      id: ex.exerciseId,
      nm: ex.exerciseName,
      sl: ex.exerciseSlug,
      o: ex.order,
      s: ex.targetSets,
      r: ex.targetReps,
      du: ex.targetDuration,
      rs: ex.restSeconds,
    })),
  };
  // encodeURIComponent handles the full Unicode range safely, unlike btoa.
  return encodeURIComponent(JSON.stringify(payload));
}

export function decodeTemplateFromShare(
  encoded: string
): Omit<Template, 'id' | 'isBuiltIn' | 'createdAt' | 'updatedAt'> | null {
  try {
    const payload: SharePayload = JSON.parse(decodeURIComponent(encoded));
    if (!payload.n || !Array.isArray(payload.e)) return null;

    const exercises: TemplateExercise[] = payload.e.map((ex) => ({
      exerciseId: ex.id,
      exerciseName: ex.nm,
      exerciseSlug: ex.sl,
      order: ex.o,
      targetSets: ex.s,
      targetReps: ex.r,
      targetDuration: ex.du,
      restSeconds: ex.rs,
    }));

    return {
      name: payload.n,
      description: payload.d ?? '',
      category: payload.c ?? 'Custom',
      estimatedMinutes: payload.m ?? 0,
      difficulty: payload.v ?? 3,
      exercises,
    };
  } catch {
    return null;
  }
}

export function buildTemplateShareUrl(template: Template): string {
  const encoded = encodeTemplateForSharing(template);
  const base =
    typeof window !== 'undefined'
      ? `${window.location.origin}/templates`
      : '/templates';
  return `${base}?import=${encoded}`;
}

export async function shareTemplate(
  template: Template
): Promise<'shared' | 'copied' | 'failed'> {
  const url = buildTemplateShareUrl(template);
  const text = `Check out this workout template: "${template.name}"\n${url}`;

  if (navigator.share) {
    try {
      await navigator.share({ title: template.name, text, url });
      return 'shared';
    } catch {
      // user cancelled or API failed — fall through
    }
  }

  try {
    await navigator.clipboard.writeText(url);
    return 'copied';
  } catch {
    return 'failed';
  }
}
