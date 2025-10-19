
"use client"

import { useState, useCallback } from 'react';
import ReactDiffViewer from 'react-diff-viewer-continued';
import { useDropzone } from 'react-dropzone';
import { useStore, Project } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent } from '@/components/ui/card';
import { UploadCloud, GitCompareArrows, X } from 'lucide-react';
import * as yaml from 'js-yaml';
import { useTheme } from 'next-themes';

const SpecInput = ({ title, spec, setSpec, projects, isDragActive }: { title: string, spec: string | null, setSpec: (content: string | null) => void, projects: Project[], isDragActive: boolean }) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const content = event.target?.result as string;
        setSpec(content);
      };
      reader.readAsText(file);
    }
  }, [setSpec]);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      'application/json': ['.json'],
      'application/x-yaml': ['.yaml', '.yml'],
    }
  });

  return (
    <div {...getRootProps()} className={cn("flex-1 border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary transition-colors", isDragActive ? "border-primary bg-accent/20" : "")}>
      <input {...getInputProps()} />
      <UploadCloud className="w-10 h-10 text-muted-foreground mb-2" />
      <h3 className="font-semibold text-lg">{title}</h3>
      {spec ? (
        <Card className="mt-2 w-full text-left p-2 bg-muted/50">
          <div className='flex justify-between items-center'>
            <p className="text-sm truncate">{spec.split('\n')[0]}</p>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); setSpec(null); }}><X className="h-4 w-4" /></Button>
          </div>
        </Card>
      ) : (
        <>
          <p className="text-muted-foreground">Drag & drop a file here</p>
          <p className="text-xs text-muted-foreground my-1">OR</p>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" onClick={e => e.stopPropagation()}>Select from Projects</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent onClick={e => e.stopPropagation()}>
              {projects.length > 0 ? projects.map(p => (
                <DropdownMenuItem key={p.id} onSelect={() => setSpec(p.content)}>{p.name}</DropdownMenuItem>
              )) : (
                <DropdownMenuItem disabled>No saved projects</DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      )}
    </div>
  );
};


export function ComparePanel() {
  const { projects } = useStore();
  const { theme } = useTheme();
  const [oldSpec, setOldSpec] = useState<string | null>(null);
  const [newSpec, setNewSpec] = useState<string | null>(null);
  const [isOldDragActive, setIsOldDragActive] = useState(false);
  const [isNewDragActive, setIsNewDragActive] = useState(false);

  const getNormalizedSpec = (specString: string | null): string => {
    if (!specString) return '';
    try {
      const parsed = yaml.load(specString);
      return yaml.dump(parsed);
    } catch {
      return specString; // fallback to original string if parsing fails
    }
  }

  const normalizedOld = getNormalizedSpec(oldSpec);
  const normalizedNew = getNormalizedSpec(newSpec);
  const hasContent = Boolean(oldSpec || newSpec);

  return (
    <div className="h-full flex flex-col p-4 gap-4 bg-muted/20">
      <div className="flex gap-4 items-stretch h-40">
        <SpecInput title="Old Spec" spec={oldSpec} setSpec={setOldSpec} projects={projects} isDragActive={isOldDragActive} />
        <div className="flex items-center justify-center p-2">
            <GitCompareArrows className="h-8 w-8 text-muted-foreground" />
        </div>
        <SpecInput title="New Spec" spec={newSpec} setSpec={setNewSpec} projects={projects} isDragActive={isNewDragActive} />
      </div>
      <Card className="flex-1 overflow-auto">
        <CardContent className="p-0 h-full">
        {hasContent ? (
          <ReactDiffViewer
            oldValue={normalizedOld}
            newValue={normalizedNew}
            splitView={true}
            useDarkTheme={theme === 'dark'}
            leftTitle="Old Spec"
            rightTitle="New Spec"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
             <p>Please select two specs above to see the comparison.</p>
          </div>
        )}
        </CardContent>
      </Card>
    </div>
  );
}
