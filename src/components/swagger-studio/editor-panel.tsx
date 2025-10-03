"use client"

import { useDropzone } from 'react-dropzone';
import { useCallback } from 'react';
import { EditorComponent } from './editor-component';
import { ValidationPanel } from './validation-panel';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { cn } from '@/lib/utils';
import { useStore } from '@/lib/store';
import { UploadCloud } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function EditorPanel() {
  const { setSpec } = useStore();
  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setSpec(content);
        toast({ title: "File loaded", description: `${file.name} has been loaded into the editor.` });
      };
      reader.readAsText(file);
    }
  }, [setSpec, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    noClick: true,
    accept: {
      'application/json': ['.json'],
      'application/x-yaml': ['.yaml', '.yml'],
      'text/plain': ['.txt'],
    }
  });

  return (
    <div {...getRootProps()} className={cn("h-full w-full flex flex-col outline-none", isDragActive ? "bg-accent/20" : "")}>
      <input {...getInputProps()} />

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
          <ValidationPanel />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
