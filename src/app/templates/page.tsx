'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTemplates } from '@/lib/hooks/useTemplates';
import { TemplateCard } from '@/components/templates/TemplateCard';
import { TemplateDetail } from '@/components/templates/TemplateDetail';
import { TemplateEditor } from '@/components/templates/TemplateEditor';
import { Button } from '@/components/ui/button';
import { Plus, Dumbbell, Download } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { decodeTemplateFromShare } from '@/lib/utils/templateShare';
import type { Template } from '@/lib/types';

// Inner component that reads search params (must be inside Suspense)
function TemplatesPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    builtInTemplates,
    customTemplates,
    isLoading,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,
  } = useTemplates();

  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);

  // Import-via-URL state
  const [importPreview, setImportPreview] = useState<
    Omit<Template, 'id' | 'isBuiltIn' | 'createdAt' | 'updatedAt'> | null
  >(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importSaved, setImportSaved] = useState(false);

  // Decode import param on mount
  useEffect(() => {
    const encoded = searchParams.get('import');
    if (!encoded) return;
    const decoded = decodeTemplateFromShare(encoded);
    if (decoded) {
      setImportPreview(decoded);
      setImportOpen(true);
    }
    // Remove the param from the URL so refreshing doesn't re-trigger the dialog
    const url = new URL(window.location.href);
    url.searchParams.delete('import');
    window.history.replaceState({}, '', url.toString());
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSaveImport() {
    if (!importPreview) return;
    await createTemplate(importPreview);
    setImportSaved(true);
    setTimeout(() => {
      setImportOpen(false);
      setImportSaved(false);
      setImportPreview(null);
    }, 1200);
  }

  function handleStartWorkout(template: Template) {
    sessionStorage.setItem('startTemplateId', template.id);
    router.push('/workout');
  }

  function handleViewTemplate(template: Template) {
    setSelectedTemplate(template);
    setDetailOpen(true);
  }

  function handleEditTemplate(template: Template) {
    setEditingTemplate(template);
    setEditorOpen(true);
  }

  function handleCreateTemplate() {
    setEditingTemplate(null);
    setEditorOpen(true);
  }

  async function handleSaveTemplate(template: Template) {
    if (editingTemplate) {
      const { id, isBuiltIn, createdAt, ...updates } = template;
      await updateTemplate(editingTemplate.id, updates);
    } else {
      const { id, isBuiltIn, createdAt, updatedAt, ...data } = template;
      await createTemplate(data);
    }
  }

  async function handleDuplicateTemplate(template: Template) {
    await duplicateTemplate(template.id);
  }

  async function handleDeleteTemplate(template: Template) {
    await deleteTemplate(template.id);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b px-4 pt-4 pb-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-tight">Templates</h1>
          <Button size="sm" onClick={handleCreateTemplate}>
            <Plus className="size-3.5" />
            Create
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-sm text-muted-foreground">Loading templates...</p>
          </div>
        ) : (
          <>
            {/* Built-in Templates */}
            {builtInTemplates.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Built-in Templates
                </h2>
                <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 sm:overflow-visible">
                  {builtInTemplates.map((template) => (
                    <div key={template.id} className="snap-start shrink-0 sm:shrink sm:snap-align-none w-[280px] sm:w-auto">
                      <TemplateCard
                        template={template}
                        onStart={handleStartWorkout}
                        onClick={handleViewTemplate}
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* My Templates */}
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                My Templates
              </h2>
              {customTemplates.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="flex items-center justify-center size-12 rounded-full bg-muted mb-3">
                    <Dumbbell className="size-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">No custom templates yet.</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Create your own or duplicate a built-in template.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={handleCreateTemplate}
                  >
                    <Plus className="size-3.5" />
                    Create Template
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {customTemplates.map((template) => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      onStart={handleStartWorkout}
                      onEdit={handleEditTemplate}
                      onClick={handleViewTemplate}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>

      {/* Detail Sheet */}
      <TemplateDetail
        template={selectedTemplate}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onStart={handleStartWorkout}
        onDuplicate={handleDuplicateTemplate}
        onDelete={handleDeleteTemplate}
      />

      {/* Editor Sheet */}
      <TemplateEditor
        template={editingTemplate}
        open={editorOpen}
        onOpenChange={setEditorOpen}
        onSave={handleSaveTemplate}
      />

      {/* Import Sheet */}
      <Sheet open={importOpen} onOpenChange={(o) => { if (!importSaved) setImportOpen(o); }}>
        <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto rounded-t-2xl">
          <SheetHeader>
            <div className="flex items-center gap-2">
              <Download className="size-5 text-primary" />
              <SheetTitle>Import Template</SheetTitle>
            </div>
            <SheetDescription>
              Someone shared this workout template with you.
            </SheetDescription>
          </SheetHeader>

          {importPreview && (
            <div className="px-4 space-y-4">
              <div>
                <p className="text-base font-semibold">{importPreview.name}</p>
                {importPreview.description && (
                  <p className="text-sm text-muted-foreground mt-0.5">{importPreview.description}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {importPreview.estimatedMinutes} min · {importPreview.exercises.length} exercises
                </p>
              </div>

              <div className="divide-y rounded-lg border">
                {importPreview.exercises
                  .sort((a, b) => a.order - b.order)
                  .map((ex, idx) => (
                    <div key={`${ex.exerciseId}-${idx}`} className="flex items-center gap-3 px-3 py-2.5">
                      <span className="flex items-center justify-center size-6 rounded-full bg-muted text-xs font-medium shrink-0">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{ex.exerciseName}</p>
                        <p className="text-xs text-muted-foreground">
                          {ex.targetSets} x{' '}
                          {ex.targetReps != null
                            ? `${ex.targetReps} reps`
                            : ex.targetDuration != null
                              ? `${ex.targetDuration}s`
                              : '---'}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          <SheetFooter>
            <Button
              className="w-full"
              size="lg"
              onClick={handleSaveImport}
              disabled={importSaved}
            >
              <Download className="size-4" />
              {importSaved ? 'Saved!' : 'Save to My Templates'}
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => setImportOpen(false)}
              disabled={importSaved}
            >
              Dismiss
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default function TemplatesPage() {
  return (
    <Suspense>
      <TemplatesPageInner />
    </Suspense>
  );
}
