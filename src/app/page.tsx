
"use client";

import { useEffect, useState } from 'react';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { SwaggerStudioHeader } from '@/components/swagger-studio/header';
import { EditorPanel } from '@/components/swagger-studio/editor-panel';
import { PreviewPanel } from '@/components/swagger-studio/preview-panel';
import { useStore, Project } from '@/lib/store';
import { Toaster } from '@/components/ui/toaster';
import { DEFAULT_SPEC } from '@/lib/templates';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { BookOpen, Code } from 'lucide-react';

export default function SwaggerStudioPage() {
  const { setSpec, setProjects, setCurrentProjectId, setDirty, previewType } = useStore();
  const [isClient, setIsClient] = useState(false);
  const isMobile = useIsMobile();
  const [mobileView, setMobileView] = useState<'editor' | 'preview'>('editor');

  useEffect(() => {
    setIsClient(true);
    // Load projects from localStorage
    const savedProjects = localStorage.getItem('swagger-studio-projects');
    if (savedProjects) {
      const projects: Project[] = JSON.parse(savedProjects);
      setProjects(projects);
      const lastOpenedId = localStorage.getItem('swagger-studio-last-opened');
      const projectToLoad = projects.find(p => p.id === lastOpenedId) || (projects.length > 0 ? projects[0] : null);
      if (projectToLoad) {
        setSpec(projectToLoad.content);
        setCurrentProjectId(projectToLoad.id);
      } else {
        setSpec(DEFAULT_SPEC);
      }
    } else {
      setSpec(DEFAULT_SPEC);
    }
    setDirty(false);
  }, [setSpec, setProjects, setCurrentProjectId, setDirty]);

  if (!isClient) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-foreground">Loading Swagger Studio...</div>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="flex flex-col h-screen bg-background text-foreground font-body">
        <SwaggerStudioHeader />
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {mobileView === 'editor' && <EditorPanel />}
          {mobileView === 'preview' && <div className="h-full overflow-auto"><PreviewPanel /></div>}
        </div>
        <div className="fixed bottom-4 right-4 z-50">
          <Button
            size="icon"
            onClick={() => setMobileView(v => v === 'editor' ? 'preview' : 'editor')}
            aria-label={mobileView === 'editor' ? 'Switch to preview' : 'Switch to editor'}
            className='rounded-full h-14 w-14 shadow-lg'
          >
            {mobileView === 'editor' ? <BookOpen /> : <Code />}
          </Button>
        </div>
        <Toaster />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background text-foreground font-body">
      <SwaggerStudioHeader />
      <main className="flex-1 overflow-hidden border-t">
        {previewType === 'redoc' ? (
          <PreviewPanel />
        ) : (
          <ResizablePanelGroup direction="horizontal" className="h-full">
            <ResizablePanel defaultSize={50} minSize={25}>
              <EditorPanel />
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={50} minSize={25}>
              <PreviewPanel />
            </ResizablePanel>
          </ResizablePanelGroup>
        )}
      </main>
      <Toaster />
    </div>
  );
}
