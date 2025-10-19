
"use client";

import { useEffect, useState } from 'react';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { SwaggerStudioHeader } from '@/components/swagger-studio/header';
import { EditorPanel } from '@/components/swagger-studio/editor-panel';
import { PreviewPanel } from '@/components/swagger-studio/preview-panel';
import { ErdPanel } from '@/components/swagger-studio/erd-panel';
import { ComparePanel } from '@/components/swagger-studio/compare-panel';
import { ExcelReaderPanel } from '@/components/swagger-studio/excel-reader-panel';
import { useStore, Project, Notes } from '@/lib/store';
import { Toaster } from '@/components/ui/toaster';
import { DEFAULT_SPEC } from '@/lib/templates';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { BookOpen, Code, FileSpreadsheet, GitCompareArrows, Network } from 'lucide-react';
import { convertSpec, EditorFormat } from '@/lib/swagger-utils';

export default function SwaggerStudioPage() {
  const { setSpec, setProjects, setCurrentProjectId, setDirty, previewType, setEditorFormat, setNotes } = useStore();
  const [isClient, setIsClient] = useState(false);
  const isMobile = useIsMobile();
  const [mobileView, setMobileView] = useState<'editor' | 'preview'>('editor');

  useEffect(() => {
    setIsClient(true);
    
    const savedFormat = localStorage.getItem('swagger-studio-format') as EditorFormat | null || 'yaml';
    setEditorFormat(savedFormat);

    let initialSpec = DEFAULT_SPEC;
    
    const savedProjects = localStorage.getItem('swagger-studio-projects');
    if (savedProjects) {
      const projects: Project[] = JSON.parse(savedProjects);
      setProjects(projects);
      const lastOpenedId = localStorage.getItem('swagger-studio-last-opened');
      const projectToLoad = projects.find(p => p.id === lastOpenedId) || (projects.length > 0 ? projects[0] : null);
      if (projectToLoad) {
        initialSpec = projectToLoad.content;
        setCurrentProjectId(projectToLoad.id);
      }
    }
    
    setSpec(convertSpec(initialSpec, savedFormat));

    const savedNotes = localStorage.getItem('swagger-studio-notes');
    if (savedNotes) {
      const notes: Notes = JSON.parse(savedNotes);
      setNotes(notes);
    }

    setDirty(false);
  }, [setSpec, setProjects, setCurrentProjectId, setDirty, setEditorFormat, setNotes]);

  if (!isClient) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-foreground">Loading Swagger Studio...</div>
      </div>
    );
  }

  const renderMobilePreview = () => {
    switch(previewType) {
      case 'erd':
        return <ErdPanel />;
      case 'compare':
        return <ComparePanel />;
      case 'excel':
        return <ExcelReaderPanel />;
      default:
        return <PreviewPanel />;
    }
  }

  const renderMobileIcon = () => {
    switch(previewType) {
      case 'erd':
        return mobileView === 'editor' ? <Network /> : <Code />;
      case 'compare':
        return mobileView === 'editor' ? <GitCompareArrows /> : <Code />;
      case 'excel':
        return mobileView === 'editor' ? <FileSpreadsheet /> : <Code />;
      case 'redoc':
         return mobileView === 'editor' ? <BookOpen /> : <Code />;
      default:
         return mobileView === 'editor' ? <Code /> : <Code />;
    }
  }

  if (isMobile) {
    return (
      <div className="flex flex-col h-screen bg-background text-foreground font-body">
        <SwaggerStudioHeader />
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {mobileView === 'editor' && <EditorPanel />}
          {mobileView === 'preview' && <div className="h-full overflow-auto">{renderMobilePreview()}</div>}
        </div>
        <div className="fixed bottom-4 right-4 z-50">
          <Button
            size="icon"
            onClick={() => setMobileView(v => v === 'editor' ? 'preview' : 'editor')}
            aria-label={mobileView === 'editor' ? 'Switch to preview' : 'Switch to editor'}
            className='rounded-full h-14 w-14 shadow-lg'
          >
            {renderMobileIcon()}
          </Button>
        </div>
        <Toaster />
      </div>
    );
  }
  
  const renderMainPanel = () => {
    switch (previewType) {
      case 'erd':
        return <ErdPanel />;
      case 'compare':
        return <ComparePanel />;
      case 'excel':
        return <ExcelReaderPanel />;
      case 'redoc':
        return (
          <div className="h-full overflow-auto">
            <PreviewPanel />
          </div>
        );
      case 'swagger-ui':
      default:
        return (
          <ResizablePanelGroup direction="horizontal" className="h-full">
            <ResizablePanel defaultSize={50} minSize={25}>
              <div className="h-full overflow-auto flex flex-col">
                <EditorPanel />
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={50} minSize={25}>
              <div className="h-full overflow-auto">
                <PreviewPanel />
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        );
    }
  }

  return (
    <div className="flex flex-col h-screen bg-background text-foreground font-body">
      <SwaggerStudioHeader />
      <main className="flex-1 overflow-hidden border-t">
        {renderMainPanel()}
      </main>
      <Toaster />
    </div>
  );
}
