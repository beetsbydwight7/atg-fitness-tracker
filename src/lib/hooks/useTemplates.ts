'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/database';
import type { Template } from '@/lib/types';

export function useTemplates() {
  const allTemplates = useLiveQuery(() => db.templates.toArray(), []);

  const builtInTemplates = allTemplates?.filter((t) => t.isBuiltIn) ?? [];
  const customTemplates = allTemplates?.filter((t) => !t.isBuiltIn) ?? [];

  async function createTemplate(
    template: Omit<Template, 'id' | 'createdAt' | 'updatedAt' | 'isBuiltIn'>
  ): Promise<string> {
    const id = crypto.randomUUID();
    const now = new Date();
    await db.templates.add({
      ...template,
      id,
      isBuiltIn: false,
      createdAt: now,
      updatedAt: now,
    });
    return id;
  }

  async function updateTemplate(
    id: string,
    updates: Partial<Omit<Template, 'id' | 'isBuiltIn' | 'createdAt'>>
  ): Promise<void> {
    await db.templates.update(id, {
      ...updates,
      updatedAt: new Date(),
    });
  }

  async function deleteTemplate(id: string): Promise<void> {
    const template = await db.templates.get(id);
    if (template?.isBuiltIn) {
      throw new Error('Cannot delete a built-in template');
    }
    await db.templates.delete(id);
  }

  async function duplicateTemplate(id: string): Promise<string> {
    const template = await db.templates.get(id);
    if (!template) {
      throw new Error('Template not found');
    }
    const newId = crypto.randomUUID();
    const now = new Date();
    await db.templates.add({
      ...template,
      id: newId,
      name: `${template.name} (Copy)`,
      isBuiltIn: false,
      createdAt: now,
      updatedAt: now,
    });
    return newId;
  }

  return {
    allTemplates: allTemplates ?? [],
    builtInTemplates,
    customTemplates,
    isLoading: allTemplates === undefined,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,
  };
}
