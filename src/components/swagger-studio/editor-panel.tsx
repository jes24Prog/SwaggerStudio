
"use client"

import { useDropzone } from 'react-dropzone';
import { useCallback, useState } from 'react';
import { EditorComponent } from './editor-component';
import { ValidationPanel } from './validation-panel';
import { NotesPanel } from './notes-panel';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { cn } from '@/lib/utils';
import { useStore } from '@/lib/store';
import { UploadCloud, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { convertSpec } from '@/lib/swagger-utils';

export function EditorPanel() {
  const { spec, setSpec, isValidationPanelOpen, isNotesPanelOpen, editorFormat, setEditorFormat } = useStore();
  const { toast } = useToast();
  const [isConverting, setIsConverting] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const content = event.target?.result as string;
        const newFormat = file.name.endsWith('.json') ? 'json' : 'yaml';
        setEditorFormat(newFormat);
        const convertedContent = await convertSpec(content, newFormat);
        setSpec(convertedContent);
        toast({ title: "File loaded", description: `${file.name} has been loaded into the editor.` });
      };
      reader.readAsText(file);
    }
  }, [setSpec, toast, setEditorFormat]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    noClick: true,
    accept: {
      'application/json': ['.json'],
      'application/x-yaml': ['.yaml', '.yml'],
      'text/plain': ['.txt'],
    }
  });
  
  const handleFormatToggle = async () => {
    const newFormat = editorFormat === 'yaml' ? 'json' : 'yaml';
    setIsConverting(true);
    try {
      const convertedSpec = await convertSpec(spec, newFormat);
      setSpec(convertedSpec);
      setEditorFormat(newFormat);
      localStorage.setItem('swagger-studio-format', newFormat);
      toast({ title: "Format Converted", description: `Switched to ${newFormat.toUpperCase()}` });
    } catch(e: any) {
      toast({ variant: 'destructive', title: "Conversion Failed", description: e.message });
    } finally {
      setIsConverting(false);
    }
  };

  const showBottomPanel = isValidationPanelOpen || isNotesPanelOpen;

  const renderBottomPanels = () => {
    if (!showBottomPanel) return null;

    if (isValidationPanelOpen && isNotesPanelOpen) {
      return (
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel defaultSize={50} minSize={20}>
            <ValidationPanel />
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={50} minSize={20}>
            <NotesPanel />
          </ResizablePanel>
        </ResizablePanelGroup>
      );
    }
    if (isValidationPanelOpen) {
      return <ValidationPanel />;
    }
    if (isNotesPanelOpen) {
      return <NotesPanel />;
    }
    return null;
  };

  return (
    <div {...getRootProps()} className={cn("h-full w-full flex flex-col outline-none", isDragActive ? "bg-accent/20" : "")}>
      <input {...getInputProps()} />
      
      <div className='flex items-center justify-end p-1 border-b bg-card'>
        <Button variant="ghost" size="sm" onClick={handleFormatToggle} disabled={isConverting}>
           {isConverting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Converting...
            </>
          ) : (
            editorFormat === 'yaml' ? 'Switch to JSON' : 'Switch to YAML'
          )}
        </Button>
      </div>

      {showBottomPanel ? (
        <ResizablePanelGroup direction="vertical">
          <ResizablePanel defaultSize={80} minSize={30}>
            <div className="relative h-full">
              <EditorComponent />
              {isDragActive && (
                <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center pointer-events-none z-10">
                  <UploadCloud className="w-16 h-16 text-primary mb-4" />
                  <p className="text-xl font-semibold">Drop file to upload</p>
                </div>
              )}
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={20} minSize={10} maxSize={50}>
            {renderBottomPanels()}
          </ResizablePanel>
        </ResizablePanelGroup>
      ) : (
        <div className="relative h-full flex-1">
          <EditorComponent />
          {isDragActive && (
            <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center pointer-events-none z-10">
              <UploadCloud className="w-16 h-16 text-primary mb-4" />
              <p className="text-xl font-semibold">Drop file to upload</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
